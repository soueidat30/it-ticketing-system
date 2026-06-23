<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Comment;
use App\Models\Ticket;
use App\Models\TicketAttachment;
use App\Models\TicketStatusHistory;
use App\Models\Notification;
use App\Models\SlaPolicy;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class TicketController extends Controller
{
    private function activityDefaults(string $action, ?Ticket $ticket = null): array
    {
        $module = 'Tickets';
        $severity = 'info';

        $a = strtolower($action);
        if (str_contains($a, 'resolve')) {
            $module = 'Tickets';
            $severity = 'info';
        } elseif (str_contains($a, 'status_changed')) {
            $module = 'Tickets';
            $severity = 'warning';
        } elseif (str_contains($a, 'assigned')) {
            $module = 'Tickets';
            $severity = 'info';
        } elseif (str_contains($a, 'comment')) {
            $module = 'Comments';
            $severity = 'info';
        } elseif (str_contains($a, 'attachment')) {
            $module = 'Attachments';
            $severity = 'info';
        }

        $affected = $ticket?->ticket_number ? "Ticket #{$ticket->ticket_number}" : null;

        return [
            'module' => $module,
            'severity' => $severity,
            'affected_ticket' => $affected,
        ];
    }


    public function index(Request $request)
    {
        $query = Ticket::query()->with([
            'category',
            'priority',
            'status',
            'user',
            'assignee',
        ]);

        // Filters
        $status = $request->query('status'); // status_name
        if (!empty($status)) {
            $query->whereHas('status', function ($q) use ($status) {
                $q->where('status_name', $status);
            });
        }

        $priority = $request->query('priority'); // priority_name
        if (!empty($priority)) {
            $query->whereHas('priority', function ($q) use ($priority) {
                $q->where('priority_name', $priority);
            });
        }

        $category = $request->query('category'); // category_id
        if (!empty($category)) {
            $query->where('category_id', $category);
        }

        $search = $request->query('search');
        if (!empty($search)) {
            $search = trim($search);
            $query->where(function ($q) use ($search) {
                $q->where('ticket_number', 'like', '%' . $search . '%')
                    ->orWhere('title', 'like', '%' . $search . '%');

                // requester name
                $q->orWhereHas('user', function ($uq) use ($search) {
                    $uq->where('full_name', 'like', '%' . $search . '%')
                       ->orWhere('username', 'like', '%' . $search . '%');
                });
            });
        }

        // Sorting
        $sort = $request->query('sort', 'newest');
        if ($sort === 'oldest') {
            $query->orderBy('created_at', 'asc');
        } elseif ($sort === 'priority') {
            // Map common UI order: critical, high, medium, low
            $priorityOrder = [
                'critical' => 1,
                'high'     => 2,
                'medium'   => 3,
                'low'      => 4,
            ];

            // Join priorities to sort by priority_name bucket
            $query->leftJoin('priorities', 'tickets.priority_id', '=', 'priorities.id')
                ->orderByRaw('CASE priorities.priority_name ' .
                    'WHEN "critical" THEN 1 ' .
                    'WHEN "high" THEN 2 ' .
                    'WHEN "medium" THEN 3 ' .
                    'WHEN "low" THEN 4 ' .
                    'ELSE 9 END asc')
                ->select('tickets.*');
        } else {
            // newest
            $query->orderBy('created_at', 'desc');
        }

        // Pagination
        // Reports require complete dataset; allow pageSize=all to disable pagination.
        $pageSizeRaw = $request->query('pageSize', 10);
        $pageSizeStr = strtolower(trim((string) $pageSizeRaw));

        $pageSizeAll = $pageSizeStr === 'all' || $pageSizeStr === '-1';

        if ($pageSizeAll) {
            $tickets = $query->get();
            $now = now();

            $tickets->transform(function (Ticket $ticket) use ($now) {
                $responseDueAt   = $ticket->response_due_at;
                $resolutionDueAt = $ticket->resolution_due_at;

                $slaBreached = (bool) ($ticket->response_breached || $ticket->resolution_breached);

                $isResolvedLike = in_array(strtolower($ticket->status?->status_name ?? ''), ['resolved', 'closed'], true);

                $progressDueAt = null;
                if (!empty($resolutionDueAt) && !$isResolvedLike) {
                    $progressDueAt = $resolutionDueAt;
                } else {
                    $progressDueAt = $responseDueAt;
                }

                $slaPercent = 0;
                if (!empty($progressDueAt) && !empty($ticket->created_at)) {
                    $createdAt = $ticket->created_at;

                    $totalSeconds = max(1, $progressDueAt->getTimestamp() - $createdAt->getTimestamp());
                    $elapsedSeconds = $now->getTimestamp() - $createdAt->getTimestamp();

                    $ratio = 1 - ($elapsedSeconds / $totalSeconds);
                    $slaPercent = (int) round(max(0, min(1, $ratio)) * 100);
                }

                $dueAt = !empty($resolutionDueAt) ? $resolutionDueAt : $responseDueAt;

                $timeOpen = '—';
                if (!empty($ticket->created_at)) {
                    $end = $isResolvedLike && !empty($ticket->resolved_at) ? $ticket->resolved_at : $now;
                    $timeOpen = $ticket->created_at->diffForHumans($end, true);
                }

                $ticket->sla_breached = $slaBreached;
                $ticket->sla_percent  = $slaPercent;
                $ticket->due_at       = $dueAt;
                $ticket->time_open    = $timeOpen;

                return $ticket;
            });

            return response()->json([
                'data' => $tickets->values(),
                'meta' => [
                    'total' => $tickets->count(),
                    'page' => 1,
                    'pageSize' => $tickets->count(),
                    'totalPages' => 1,
                ],
            ]);
        }

        $pageSize = (int) $pageSizeRaw;
        $pageSize = max(1, min(100, $pageSize));
        $page = (int) $request->query('page', 1);
        $page = max(1, $page);

        $paginator = $query->paginate($pageSize, ['*'], 'page', $page);

        // SLA fields for index view (same approach as show())
        $tickets = $paginator->getCollection();

        $now = now();

        $tickets->transform(function (Ticket $ticket) use ($now) {
            $responseDueAt   = $ticket->response_due_at;
            $resolutionDueAt = $ticket->resolution_due_at;

            $slaBreached = (bool) ($ticket->response_breached || $ticket->resolution_breached);

            $isResolvedLike = in_array(strtolower($ticket->status?->status_name ?? ''), ['resolved', 'closed'], true);

            $progressDueAt = null;
            if (!empty($resolutionDueAt) && !$isResolvedLike) {
                $progressDueAt = $resolutionDueAt;
            } else {
                $progressDueAt = $responseDueAt;
            }

            $slaPercent = 0;
            if (!empty($progressDueAt) && !empty($ticket->created_at)) {
                $createdAt = $ticket->created_at;

                $totalSeconds = max(1, $progressDueAt->getTimestamp() - $createdAt->getTimestamp());
                $elapsedSeconds = $now->getTimestamp() - $createdAt->getTimestamp();

                $ratio = 1 - ($elapsedSeconds / $totalSeconds);
                $slaPercent = (int) round(max(0, min(1, $ratio)) * 100);
            }

            $dueAt = !empty($resolutionDueAt) ? $resolutionDueAt : $responseDueAt;

            $timeOpen = '—';
            if (!empty($ticket->created_at)) {
                $end = $isResolvedLike && !empty($ticket->resolved_at) ? $ticket->resolved_at : $now;
                $timeOpen = $ticket->created_at->diffForHumans($end, true);
            }

            $ticket->sla_breached = $slaBreached;
            $ticket->sla_percent  = $slaPercent;
            $ticket->due_at       = $dueAt;
            $ticket->time_open    = $timeOpen;

            return $ticket;
        });

        return response()->json([
            'data' => $tickets->values(),
            'meta' => [
                'total' => $paginator->total(),
                'page' => $paginator->currentPage(),
                'pageSize' => $paginator->perPage(),
                'totalPages' => $paginator->lastPage(),
            ],
        ]);
    }



    public function show($id)
    {
        $query = Ticket::with([
            'category',
            'priority',
            'status',
            'user',
            'assignee',
            'comments.user.role',
            'attachments.uploader',
            'history.status',
            'history.changer',
        ]);

        $role = optional(Auth::user()->role)->name;
        $isEmployee = $role === 'employee';


        $ticket = is_numeric($id)
            ? $query->find($id)
            : null;

        if (!$ticket) {
            $ticketNumber = str_contains($id, ':') ? explode(':', $id, 2)[0] : $id;
            $ticket = $query->where('ticket_number', $ticketNumber)->first();
        }

        if (!$ticket) {
            return response()->json(['message' => 'Ticket not found'], 404);
        }

        $commentsQuery = $ticket->comments;
        if (!$isEmployee) {
            if ($role !== 'agent') {
                $commentsQuery = $commentsQuery->where('internal', false);
            }
        } else {
            $commentsQuery = $commentsQuery->where('internal', false);
        }


        $comments = $commentsQuery->map(fn($c) => [
            'id'       => $c->id,
            'author'   => $c->user->full_name ?? $c->user->username ?? 'Unknown',
            'role'     => $c->user->role->name ?? 'employee',
            'text'     => $c->content,
            'internal' => $c->internal,
            'time'     => $c->created_at->diffForHumans(),
        ]);


        $attachments = $ticket->attachments->map(fn($a) => [
            'id'               => $a->id,
            'name'             => $a->file_name,
            'type'             => $a->file_type,
            'size'             => $this->formatBytes($a->file_size),
            'uploaded'         => $a->created_at->format('M j, Y'),
            'path'             => $a->file_path,
            'uploaded_by'      => $a->uploaded_by,
            'uploaded_by_name' => $a->uploader->full_name ?? $a->uploader->username ?? null,
        ]);

        $history = $ticket->history->map(fn($h) => [
            'id'    => $h->id,
            'event' => 'Status changed to ' . ($h->status->status_name ?? '—'),
            'actor' => 'By ' . ($h->changer->full_name ?? $h->changer->username ?? 'System'),
            'time'  => $h->created_at->diffForHumans(),
            'type'  => 'status',
            'note'  => $h->note,
        ]);

        $now = now();

        $responseDueAt   = $ticket->response_due_at;
        $resolutionDueAt = $ticket->resolution_due_at;

        $slaBreached = (bool) ($ticket->response_breached || $ticket->resolution_breached);

        $isResolvedLike = in_array(strtolower($ticket->status?->status_name ?? ''), ['resolved', 'closed'], true);

        $progressDueAt = null;
        $progressNow   = $now;

        if (!empty($resolutionDueAt) && !$isResolvedLike) {
            $progressDueAt = $resolutionDueAt;
        } else {
            $progressDueAt = $responseDueAt;
        }
        $slaPercent = 0;
        if (!empty($progressDueAt) && !empty($ticket->created_at)) {
            $createdAt = $ticket->created_at;

            $totalSeconds = max(1, $progressDueAt->getTimestamp() - $createdAt->getTimestamp());
            $elapsedSeconds = $progressNow->getTimestamp() - $createdAt->getTimestamp();

            $ratio = 1 - ($elapsedSeconds / $totalSeconds);
            $slaPercent = (int) round(max(0, min(1, $ratio)) * 100);
        }

        $dueAt = !empty($resolutionDueAt) ? $resolutionDueAt : $responseDueAt;

        $timeOpen = '—';
        if (!empty($ticket->created_at)) {
            $end = $isResolvedLike && !empty($ticket->resolved_at) ? $ticket->resolved_at : $now;
            $timeOpen = $ticket->created_at->diffForHumans($end, true);
        }

        $ticket->sla_breached = $slaBreached;
        $ticket->sla_percent  = $slaPercent;
        $ticket->due_at       = $dueAt;
        $ticket->time_open    = $timeOpen;

        return response()->json([
            'ticket'      => $ticket,
            'comments'    => $comments,
            'attachments' => $attachments,
            'history'     => $history,
        ]);
    }

    public function assignedTickets()
    {
        $agentId = Auth::id();


        $tickets = Ticket::with([
            'category',
            'priority',
            'status',
            'user',
            'comments.user.role',
        ])
        ->where('assigned_to', $agentId)
        ->get();

        return response()->json($tickets);
    }

    public function dashboardStats()
    {
        $agentId = Auth::id();

        $recentTickets = Ticket::with(['status'])
            ->where('assigned_to', $agentId)
            ->orderByDesc('updated_at')
            ->limit(5)
            ->get()
            ->map(fn ($t) => [
                'ticket_number' => $t->ticket_number,
                'title' => $t->title,
                'status' => [
                    'status_name' => $t->status?->status_name,
                ],
                'created_at' => $t->created_at,
                'updated_at' => $t->updated_at,
            ]);

        $priority_breakdown = collect(['critical' => 0, 'high' => 0, 'medium' => 0, 'low' => 0]);


        try {
            $priorityRows = Ticket::query()
                ->selectRaw('priorities.priority_name as priority_name, COUNT(*) as cnt')
                ->join('priorities', 'tickets.priority_id', '=', 'priorities.id')
                ->where('tickets.assigned_to', $agentId)
                ->groupBy('priorities.priority_name')
                ->get();

            $bucketFor = function (?string $name): ?string {
                $n = strtolower(trim($name ?? ''));
                if (str_contains($n, 'crit')) return 'critical';
                if (str_contains($n, 'high')) return 'high';
                if (str_contains($n, 'med')) return 'medium';
                if (str_contains($n, 'low')) return 'low';
                return null;
            };

            foreach ($priorityRows as $row) {
                $bucket = $bucketFor($row->priority_name);
                if ($bucket && $priority_breakdown->has($bucket)) {
                    $priority_breakdown[$bucket] = (int) $row->cnt;
                }
            }
        } catch (\Throwable $e) {
            \Log::error('dashboardStats priority_breakdown failed', [
                'agent_id' => $agentId,
                'error' => $e->getMessage(),
                'exception' => get_class($e),
            ]);
        }



        $openCount = Ticket::where('assigned_to', $agentId)
            ->whereHas('status', fn($q) => $q->where('status_name', 'Open'))
            ->count();

        $inProgressCount = Ticket::where('assigned_to', $agentId)
            ->whereHas('status', fn($q) => $q->where('status_name', 'In Progress'))
            ->count();

        $resolvedCount = Ticket::where('assigned_to', $agentId)
            ->whereHas('status', fn($q) => $q->where('status_name', 'Resolved'))
            ->count();

        return response()->json([
            'assigned' => Ticket::where('assigned_to', $agentId)->count(),
            'open' => $openCount,
            'in_progress' => $inProgressCount,
            'resolved' => $resolvedCount,

            'stats' => [
                'assigned' => Ticket::where('assigned_to', $agentId)->count(),
                'resolved_today' => $resolvedCount,
                'pending_review' => Ticket::where('assigned_to', $agentId)
                    ->whereHas('status', fn($q) => $q->where('status_name', 'Pending'))
                    ->count(),
                'in_progress' => $inProgressCount,
            ],

            'recent_tickets' => $recentTickets,

            'priority_breakdown' => $priority_breakdown->all(),
        ]);
    }


    public function storeComment(Request $request, $id)
    {

        $request->validate([
            'content'          => 'required|string|max:5000',
            'internal'         => 'boolean',
            'notify_user_id'   => 'nullable|exists:users,id',
        ]);

        \Log::info('storeComment incoming', [
            'ticket_param' => $id,
            'auth_user_id' => Auth::id(),
            'payload' => $request->only(['content', 'internal', 'notify_user_id']),
        ]);


        $ticket = (is_numeric($id)
            ? Ticket::findOrFail($id)
            : Ticket::where('ticket_number', $id)->firstOrFail());

        try {

            $senderId = Auth::id();
            $receiverId = null;
            $isInternal = $request->boolean('internal', false);

            if (!$isInternal) {
                $receiverId = $request->input('notify_user_id') ?? $ticket->user_id;
            }

            $comment = Comment::create([
                'ticket_id' => $ticket->id,
                'user_id'   => $senderId,
                'sender_id' => $senderId,
                'receiver_id' => $receiverId,
                'content'   => $request->content,
                'internal'  => $isInternal,
                'notify_user_id' => $receiverId,
            ]);
        } catch (\Throwable $e) {

            \Log::error('storeComment failed', [
                'ticket_param' => $id,
                'auth_user_id' => Auth::id(),
                'error_message' => $e->getMessage(),
                'exception_class' => get_class($e),
            ]);

            $msg = $e->getMessage();
            $friendly = str_contains($msg, 'Base table or view not found') && str_contains($msg, 'comments')
                ? 'Database table `comments` is missing in the current DB. Run migrations / verify DB connection.'
                : 'Failed to create comment: ' . $msg;

            return response()->json([
                'message' => $friendly,
                'debug' => [
                    'error' => class_basename($e),
                ],
            ], 500);
        }


        $this->logActivity($ticket->id, 'comment', "Added comment: {$request->content}");
        if (!$request->boolean('internal', false)) {

            $notifyUserId = $comment->receiver_id ?? $ticket->user_id;

            Notification::notify(
                user_id:      (int) $notifyUserId,
                ticket_id:    $ticket->id,
                triggered_by: $senderId,
                type:         'comment_added',
                title:        'New reply on your ticket',
                message:      "A new reply was added to ticket {$ticket->ticket_number}.",
            );
        }
        $comment->load('user.role');

        return response()->json([
            'id'       => $comment->id,
            'author'   => $comment->user->full_name ?? $comment->user->username,
            'role'     => $comment->user->role->name ?? 'agent',
            'text'     => $comment->content,
            'internal' => $comment->internal,
            'time'     => 'Just now',
        ], 201);
    }


    public function storeAttachment(Request $request, $id)
    {
        $request->validate([
            'file' => 'required|file|max:10240|mimes:jpg,jpeg,png,pdf,doc,docx,txt,log,zip',
        ]);

        $ticket = is_numeric($id)
            ? Ticket::findOrFail($id)
            : Ticket::where('ticket_number', $id)->firstOrFail();

        $role = optional(Auth::user()->role)->name;
        if ($role === 'employee' && (int) $ticket->user_id !== (int) Auth::id()) {
            return response()->json(['message' => 'You do not have permission to access this resource.'], 403);
        }

        $file   = $request->file('file');

        $path   = $file->store("tickets/{$ticket->id}/attachments", 'local');
        $ext    = strtolower($file->getClientOriginalExtension());
        $type   = in_array($ext, ['jpg','jpeg','png','gif','webp']) ? 'img'
                : (in_array($ext, ['pdf']) ? 'pdf'
                : (in_array($ext, ['log','txt']) ? 'log' : 'doc'));

        $attachment = TicketAttachment::create([
            'ticket_id'   => $ticket->id,
            'uploaded_by' => Auth::id(),
            'file_name'   => $file->getClientOriginalName(),
            'file_path'   => $path,
            'file_type'   => $type,
            'file_size'   => $file->getSize(),
            'attachment_id' => $attachment->id,
        ]);

        $senderId = Auth::id();
        $receiverIds = collect();
        $attachment->id;
        if (!empty($ticket->user_id)) {
            $receiverIds->push((int) $ticket->user_id);
        }

        if (!empty($ticket->assigned_to)) {
            $receiverIds->push((int) $ticket->assigned_to);
        }

        $managerRoleId = \App\Models\Role::where('name', 'manager')->value('id');
        if ($managerRoleId) {
            $managerUserIds = \App\Models\User::where('role_id', $managerRoleId)->pluck('id');
            $receiverIds = $receiverIds->merge($managerUserIds);
        }

        $receiverIds = $receiverIds
            ->filter(fn ($id) => !empty($id) && (int) $id !== (int) $senderId)
            ->unique()
            ->values();

        foreach ($receiverIds as $receiverId) {
            Notification::notify(
                 user_id:      (int) $receiverId,
        ticket_id:    $ticket->id,
        triggered_by: $senderId,
        type:         'attachment_added',
        title:        'New attachment added',
        message:      json_encode([
            'text'          => "A new attachment \"{$attachment->file_name}\" was added to ticket {$ticket->ticket_number}.",
            'attachment_id' => $attachment->id,
            'file_name'     => $attachment->file_name,
            'file_type'     => $attachment->file_type,
            'ticket_id'     => $ticket->id,
        ]),
            );
        }


        return response()->json([
            'id'               => $attachment->id,
            'name'             => $attachment->file_name,
            'type'             => $attachment->file_type,
            'size'             => $this->formatBytes($attachment->file_size),
            'uploaded'         => $attachment->created_at->format('M j, Y'),
            'uploaded_by'      => $attachment->uploaded_by,
            'uploaded_by_name' => Auth::user()->full_name ?? Auth::user()->username ?? null,
        ], 201);
    }

    public function downloadAttachment($ticketId, $attachmentId)
    {
        $ticket = is_numeric($ticketId)
            ? Ticket::findOrFail($ticketId)
            : Ticket::where('ticket_number', $ticketId)->firstOrFail();

        $attachment = TicketAttachment::where('id', $attachmentId)
    ->where('ticket_id', $ticketId)
    ->firstOrFail();

        if ((int) $attachment->ticket_id !== (int) $ticket->id) {
            return response()->json(['message' => 'Attachment does not belong to this ticket.'], 404);
        }

        if (empty($attachment->file_path) || !\Storage::disk('local')->exists($attachment->file_path)) {
            return response()->json([
                'message' => 'Attachment file not found.',
                'debug' => [
                    'attachment_id'    => $attachmentId,
                    'ticket_id'        => $ticket->id,
                    'stored_file_path' => $attachment->file_path,
                    'resolved_path'    => $attachment->file_path
                        ? \Storage::disk('local')->path($attachment->file_path)
                        : null,
                ],
            ], 404);
        }

        return \Storage::disk('local')->download($attachment->file_path, $attachment->file_name);
    }

    public function previewAttachment($ticketId, $attachmentId)
    {
        $ticket = is_numeric($ticketId)
            ? Ticket::findOrFail($ticketId)
            : Ticket::where('ticket_number', $ticketId)->firstOrFail();

       $attachment = TicketAttachment::where('id', $attachmentId)
    ->where('ticket_id', $ticketId)
    ->firstOrFail();

        if ((int) $attachment->ticket_id !== (int) $ticket->id) {
            return response()->json(['message' => 'Attachment does not belong to this ticket.'], 404);
        }

        if (empty($attachment->file_path) || !\Storage::disk('local')->exists($attachment->file_path)) {
            return response()->json([
                'message' => 'Attachment file not found.',
                'debug' => [
                    'attachment_id'    => $attachmentId,
                    'ticket_id'        => $ticket->id,
                    'stored_file_path' => $attachment->file_path,
                    'resolved_path'    => $attachment->file_path
                        ? \Storage::disk('local')->path($attachment->file_path)
                        : null,
                ],
            ], 404);
        }

        $mime = \Storage::disk('local')->mimeType($attachment->file_path) ?: 'application/octet-stream';

        return \Storage::disk('local')->response($attachment->file_path, $attachment->file_name, [
            'Content-Type' => $mime,
        ]);
    }

    public function deleteAttachment(Request $request, $ticketId, $attachmentId)
    {
        $ticket = is_numeric($ticketId)
            ? Ticket::findOrFail($ticketId)
            : Ticket::where('ticket_number', $ticketId)->firstOrFail();

       $attachment = TicketAttachment::where('id', $attachmentId)
    ->where('ticket_id', $ticketId)
    ->firstOrFail();

        if ((int) $attachment->ticket_id !== (int) $ticket->id) {
            return response()->json(['message' => 'Attachment does not belong to this ticket.'], 404);
        }

        $userId = Auth::id();
        $role   = optional(Auth::user()->role)->name;

        $canDelete = (int) $attachment->uploaded_by === (int) $userId
            || in_array($role, ['admin', 'manager'], true);

        if (!$canDelete) {
            return response()->json([
                'message' => 'You can only delete attachments you uploaded.',
            ], 403);
        }

        if (!empty($attachment->file_path)) {
            \Storage::disk('local')->delete($attachment->file_path);
        }

        $fileName = $attachment->file_name;
        $attachment->delete();

        $this->logActivity($ticket->id, 'attachment_deleted', "Deleted attachment: {$fileName}");

        return response()->json(['message' => 'Attachment deleted successfully.']);
    }



    public function updateStatus(Request $request, $id)
{
    $request->validate([
        'status_id' => 'required|exists:statuses,id',
        'note'      => 'nullable|string|max:500',
    ]);

    $user   = $request->user();
    $ticket = Ticket::with(['user', 'status'])->findOrFail($id);

    $oldStatusId = $ticket->status_id;

    $ticket->update(['status_id' => $request->status_id]);
    $ticket->refresh()->load('status');

    if (!$ticket->first_response_at) {

        $ticket->first_response_at = now();
        $ticket->save();
    }
    \DB::table('ticket_status_histories')->insert([
        'ticket_id'  => $ticket->id,
        'status_id'  => $request->status_id,
        'changed_by' => $user->id,
        'note'       => $request->note,
        'created_at' => now(),
        'updated_at' => now(),
    ]);

        $defaults = $this->activityDefaults('status_changed', $ticket);

        \DB::table('activity_logs')->insert([
            'user_id'          => $user->id,
            'action'           => 'status_changed',
            'description'      => "Status changed to {$ticket->status->status_name} on #{$ticket->ticket_number}",
            'ticket_id'        => $ticket->id,
            'module'           => $defaults['module'],
            'severity'         => $defaults['severity'],
            'affected_ticket' => $defaults['affected_ticket'],
            'created_at'       => now(),
            'updated_at'       => now(),
        ]);

        if ($ticket->user_id !== $user->id) {
            $newStatusName = \App\Models\Status::find($request->status_id)->status_name ?? 'Updated';

            Notification::notify(
                user_id:      $ticket->user_id,
                ticket_id:    $ticket->id,
                triggered_by: $user->id,
                type:         'status_changed',
                title:        'Your ticket status was updated',
                message:      "Ticket {$ticket->ticket_number} status changed to \"{$newStatusName}\".",

            );
        }


    if (in_array(strtolower($ticket->status->status_name), ['resolved', 'closed'])) {
        $ticket->update(['resolved_at' => now()]);
    }

    return response()->json($ticket->load(['status', 'priority', 'category', 'user', 'assignee']));
}

    public function resolveTicket(Request $request, $id)
    {
        $request->validate([
            'resolution_type' => 'required|string|max:50',
            'solution'         => 'required|string|min:20',
            'root_cause'       => 'nullable|string',
            'time_spent'       => 'nullable|numeric',
            'time_unit'        => 'nullable|in:minutes,hours',
            'internal_notes'   => 'nullable|string',
            'rating'           => 'nullable|integer|min:1|max:5',
            'notify_user'      => 'boolean',
            'notify_manager'   => 'boolean',
        ]);

        $user   = $request->user();

        $ticket = null;
        if (is_numeric($id)) {
            $ticket = Ticket::with(['user', 'status'])->findOrFail($id);
        } else {
            $ticketNumber = (string) $id;
            $ticket = Ticket::with(['user', 'status'])->where('ticket_number', $ticketNumber)->firstOrFail();
        }
        \DB::table('ticket_resolutions')->insert([
            'ticket_id'       => $ticket->id,
            'resolved_by'     => $user->id,
            'resolution_type' => $request->resolution_type,
            'solution'        => $request->solution,
            'root_cause'      => $request->root_cause,
            'time_spent'      => $request->time_spent,
            'time_unit'       => $request->time_unit,
            'internal_notes'  => $request->internal_notes,
            'rating'          => $request->rating,
            'created_at'      => now(),
            'updated_at'      => now(),
        ]);

        $resolvedStatus = \DB::table('statuses')->where('status_name', 'Resolved')->first();
        $resolvedStatusId = $resolvedStatus ? $resolvedStatus->id : $ticket->status_id;

        $ticket->update([
            'status_id'   => $resolvedStatusId,
            'resolved_at' => now(),
        ]);

        \DB::table('ticket_status_histories')->insert([
            'ticket_id'  => $ticket->id,
            'status_id'  => $resolvedStatusId,
            'changed_by' => $user->id,
            'note'       => $request->solution,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $defaults = $this->activityDefaults('ticket_resolved', $ticket);

        \DB::table('activity_logs')->insert([
            'user_id'          => $user->id,
            'action'           => 'ticket_resolved',
            'description'      => "Ticket #{$ticket->ticket_number} marked as resolved",
            'ticket_id'        => $ticket->id,
            'module'           => $defaults['module'],
            'severity'         => $defaults['severity'],
            'affected_ticket' => $defaults['affected_ticket'],
            'created_at'       => now(),
            'updated_at'       => now(),
        ]);

        if ($request->boolean('notify_user', true) && $ticket->user_id !== $user->id) {
            Notification::notify(
                user_id:      $ticket->user_id,
                ticket_id:    $ticket->id,
                triggered_by: $user->id,
                type:         'ticket_resolved',
                title:        'Your ticket has been resolved',
                message:      "Ticket {$ticket->ticket_number} has been marked as resolved.",
            );
        }

        return response()->json([
            'message' => 'Ticket resolved successfully',
            'ticket'  => $ticket->refresh()->load(['status', 'priority', 'category', 'user', 'assignee']),
        ]);
    }

    private function formatBytes(int $bytes): string
    {
        if ($bytes < 1024)       return "{$bytes} B";
        if ($bytes < 1048576)    return round($bytes / 1024, 1) . ' KB';
        return round($bytes / 1048576, 1) . ' MB';
    }

    public function store(Request $request)
    {
        $request->validate([
            'title'       => 'required|string|max:255',
            'description' => 'required|string',
            'category_id' => 'required|exists:categories,id',
            'priority_id' => 'required|exists:priorities,id',
        ]);

        $lastTicket = Ticket::orderBy('id', 'desc')->first();
        $nextNumber = $lastTicket ? ($lastTicket->id + 1) : 1;
        $ticketNumber = 'TKT-' . str_pad($nextNumber, 4, '0', STR_PAD_LEFT);

        $openStatus = \DB::table('statuses')->where('status_name', 'Open')->first();

        $ticket = Ticket::create([
            'ticket_number' => $ticketNumber,
            'title'         => $request->title,
            'description'   => $request->description,
            'category_id'   => $request->category_id,
            'priority_id'   => $request->priority_id,
            'status_id'     => $openStatus ? $openStatus->id : 1,
            'user_id'       => Auth::id(),
        ]);

        // SLA driven by Priority (minutes)
        // tickets.sla_* should be computed from priorities.sla_*_minutes
        $priority = $ticket->priority()->first();

        if ($priority) {
            $ticket->response_due_at = now()->addMinutes((int) $priority->sla_response_minutes);
            $ticket->resolution_due_at = now()->addMinutes((int) $priority->sla_resolve_minutes);

            // optional: set first_response_at baseline if you want; otherwise leave null
            $ticket->save();
        }


        return response()->json([
            'message' => 'Ticket created successfully',
            'ticket'  => $ticket->load(['category', 'priority', 'status'])
        ], 201);
    }

    public function update(Request $request, $id)
    {
        $ticket = Ticket::find($id);

        if (!$ticket) {
            return response()->json(['message' => 'Ticket not found'], 404);
        }

        $request->validate([
            'title'       => 'sometimes|string|max:255',
            'description' => 'sometimes|string',
            'category_id' => 'sometimes|exists:categories,id',
            'priority_id' => 'sometimes|exists:priorities,id',
            'status_id'   => 'sometimes|exists:statuses,id',
        ]);

        $ticket->update($request->only([
            'title', 'description', 'category_id', 'priority_id', 'status_id'
        ]));

        return response()->json([
            'message' => 'Ticket updated successfully',
            'ticket'  => $ticket->load(['category', 'priority', 'status'])
        ]);
    }

    public function destroy($id)
    {
        $ticket = Ticket::find($id);

        if (!$ticket) {
            return response()->json(['message' => 'Ticket not found'], 404);
        }

        $ticket->delete();

        return response()->json([
            'message' => 'Ticket deleted successfully'
        ]);
    }
    public function myTickets(Request $request)
    {
    return Ticket::with(['category', 'priority', 'status'])
        ->where('user_id', $request->user()->id)
        ->orderBy('created_at', 'desc')
        ->get();
}



    public function assignTicket(Request $request, $id)
{
    $request->validate([
        'agent_id' => 'required|exists:users,id',
        'note'     => 'nullable|string|max:1000',
    ]);

    $ticket = Ticket::findOrFail($id);
    $agent  = \App\Models\User::find($request->agent_id);

    $ticket->update([
        'assigned_to' => $request->agent_id,
    ]);

        \DB::table('ticket_assignments')->insert([
            'ticket_id'    => $ticket->id,
            'assigned_by'  => Auth::id(),
            'assigned_to'  => $request->agent_id,
            'assigned_at'  => now(),
            'notes'         => $request->note,
            'created_at'   => now(),
            'updated_at'   => now(),
        ]);

    $defaults = $this->activityDefaults('ticket_assigned', $ticket);

    \DB::table('activity_logs')->insert([
        'user_id'          => Auth::id(),
        'action'           => 'ticket_assigned',
        'description'      => "Ticket #{$ticket->ticket_number} assigned to user {$request->agent_id}",
        'ticket_id'        => $ticket->id,
        'module'           => $defaults['module'],
        'severity'         => $defaults['severity'],
        'affected_ticket' => $defaults['affected_ticket'],
        'created_at'       => now(),
        'updated_at'       => now(),
    ]);

    $ticketNumber = $ticket->ticket_number;
    if ($agent) {
        $previousAssignment = \DB::table('ticket_assignments')
            ->where('ticket_id', $ticket->id)
            ->where('assigned_to', $request->agent_id)
            ->orderByDesc('assigned_at')
            ->first();

        $isReassignedToSameAgent = $previousAssignment && ($previousAssignment->assigned_at ?? null);

        $notificationTitle = $isReassignedToSameAgent ? 'Ticket Reassigned' : 'New Ticket Assigned';
        $notificationMessage = $isReassignedToSameAgent
            ? "Ticket {$ticketNumber} has been reassigned to you."
            : "Ticket {$ticketNumber} has been assigned to you by Manager.";

        Notification::notify(
            user_id:      $agent->id,
            ticket_id:    $ticket->id,
            triggered_by: Auth::id(),
            type:         'ticket_assigned',
            title:        $notificationTitle,
            message:      $notificationMessage,
        );
    }

    return response()->json(['message' => 'Ticket assigned successfully.']);
}

    public function pendingForManager()
{
    $tickets = Ticket::with([
        'category',
        'priority',
        'status',
        'user',
        'assignee',
    ])
        ->whereNull('assigned_to')
        ->orderByDesc('created_at')
        ->get();

    return response()->json($tickets);
}

public function history($id)
{
    $history = \DB::table('ticket_status_histories')
        ->join('users', 'ticket_status_histories.changed_by', '=', 'users.id')
        ->join('statuses', 'ticket_status_histories.status_id', '=', 'statuses.id')
        ->where('ticket_status_histories.ticket_id', $id)
        ->orderBy('ticket_status_histories.created_at')
        ->select(
            'ticket_status_histories.id',
            'ticket_status_histories.note',
            'ticket_status_histories.created_at',
            'statuses.status_name as new_status',
            'users.full_name as changed_by_name'
        )
        ->get();

    return response()->json($history);
}

private function logActivity($ticketId, $action, $details)
{
    $ticket = Ticket::find($ticketId);
    $defaults = $this->activityDefaults($action, $ticket);

    \DB::table('activity_logs')->insert([
        'ticket_id'        => $ticketId,
        'user_id'          => Auth::id(),
        'action'           => $action,
        'description'      => $details,
        'module'           => $defaults['module'],
        'severity'         => $defaults['severity'],
        'affected_ticket' => $defaults['affected_ticket'],
        'created_at'       => now(),
        'updated_at'       => now(),
    ]);
}

    public function getComments($id)
    {
        $ticket = (is_numeric($id)
            ? Ticket::with('comments.user.role')->findOrFail($id)
            : Ticket::with('comments.user.role')->where('ticket_number', $id)->firstOrFail());


        $role = optional(Auth::user()->role)->name;
        $isEmployee = $role === 'employee';

        $commentsQuery = $ticket->comments;

        if ($role !== 'agent') {
            $commentsQuery = $commentsQuery->where('internal', false);
        }

        $comments = $commentsQuery->map(fn($c) => [
            'id'       => $c->id,
            'author'   => $c->user->full_name ?? $c->user->username ?? 'Unknown',
            'role'     => $c->user->role->name ?? 'employee',
            'text'     => $c->content,
            'internal' => $c->internal,
            'time'     => $c->created_at->diffForHumans(),
        ]);

        return response()->json($comments);
    }

    public function deleteComment(Request $request, $ticketId, $commentId)
    {

        $comment = Comment::where('ticket_id', $ticketId)
            ->where('id', $commentId)
            ->firstOrFail();

        $userId = Auth::id();

        if ((int)$comment->user_id !== (int)$userId) {
            return response()->json(['message' => 'You can only delete your own comments.'], 403);
        }

        $comment->delete();

        return response()->json(['message' => 'Comment deleted successfully.']);
    }
    public function showSingle($id)
    {
    $ticket = Ticket::with(['status', 'priority', 'category', 'user', 'assignee'])
        ->where('id', $id)
        ->orWhere('ticket_number', $id)
        ->firstOrFail();

    return response()->json($ticket);
}

    public function getAttachments($id)
{
    $attachments = \DB::table('ticket_attachments')
        ->where('ticket_id', $id)
        ->get();

    return response()->json($attachments);
}

    // ---------------------------
    // Enterprise ticket-scoped data (All Tickets modal)
    // ---------------------------
    public function assignmentHistory($id)
    {
        $ticket = is_numeric($id) ? Ticket::find($id) : Ticket::where('ticket_number', $id)->first();
        if (!$ticket) {
            return response()->json(['message' => 'Ticket not found'], 404);
        }

        $rows = \DB::table('ticket_assignments')
            ->join('users as assigned_user', 'ticket_assignments.assigned_to', '=', 'assigned_user.id')
            ->join('users as assigned_by_user', 'ticket_assignments.assigned_by', '=', 'assigned_by_user.id')
            ->where('ticket_assignments.ticket_id', $ticket->id)
            ->orderByDesc('ticket_assignments.assigned_at')
            ->select([
                'ticket_assignments.id',
                'ticket_assignments.assigned_at',
                'ticket_assignments.unassigned_at',
                'ticket_assignments.notes',
                'ticket_assignments.assigned_to',
                'ticket_assignments.assigned_by',
                'assigned_user.full_name as assigned_to_name',
                'assigned_user.username as assigned_to_username',
                'assigned_by_user.full_name as assigned_by_name',
                'assigned_by_user.username as assigned_by_username',
            ])
            ->get()
            ->map(function ($r) {
                return [
                    'id' => $r->id,
                    'assigned_at' => $r->assigned_at,
                    'assigned_to' => $r->assigned_to,
                    'assigned_to_name' => $r->assigned_to_name ?? $r->assigned_to_username,
                    'assigned_by' => $r->assigned_by,
                    'assigned_by_name' => $r->assigned_by_name ?? $r->assigned_by_username,
                    'unassigned_at' => $r->unassigned_at,
                    'notes' => $r->notes,
                    'time' => optional($r->assigned_at)->diffForHumans(),
                ];
            });

        return response()->json(['data' => $rows]);
    }

    public function ticketNotifications($id)
    {
        $ticket = is_numeric($id) ? Ticket::find($id) : Ticket::where('ticket_number', $id)->first();
        if (!$ticket) {
            return response()->json(['message' => 'Ticket not found'], 404);
        }

        $notifications = Notification::query()
            ->where('ticket_id', $ticket->id)
            ->orderByDesc('created_at')
            ->get();

        return response()->json([
            'data' => $notifications->map(fn($n) => [
                'id' => $n->id,
                'title' => $n->title,
                'message' => $n->message,
                'type' => $n->type,
                'is_read' => (bool) $n->is_read,
                'created_at' => $n->created_at,
                'time' => optional($n->created_at)->diffForHumans(),
            ]),
        ]);
    }

    public function ticketActivityLogs($id)
    {
        $ticket = is_numeric($id) ? Ticket::find($id) : Ticket::where('ticket_number', $id)->first();
        if (!$ticket) {
            return response()->json(['message' => 'Ticket not found'], 404);
        }

        $logs = \DB::table('activity_logs')
            ->where('ticket_id', $ticket->id)
            ->orderByDesc('created_at')
            ->get();

        return response()->json([
            'data' => $logs->map(fn($l) => [
                'id' => $l->id,
                'action' => $l->action,
                'module' => $l->module,
                'severity' => $l->severity,
                'affected_ticket' => $l->affected_ticket,
                'description' => $l->description,
                'created_at' => $l->created_at,
                'time' => optional($l->created_at)->diffForHumans(),
            ]),
        ]);
    }
}

