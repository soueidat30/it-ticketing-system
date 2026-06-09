<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Comment;
use App\Models\Status;
use App\Models\Ticket;
use App\Models\TicketAttachment;
use App\Models\TicketResolution;
use App\Models\TicketStatusHistory;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

class TicketController extends Controller
{
    // ── POST /tickets ─────────────────────────────────────────
    public function store(Request $request)
    {
        $request->validate([
            'title'       => 'required|string|max:255',
            'description' => 'required|string',
            'category_id' => 'required|exists:categories,id',
            'priority_id' => 'required|exists:priorities,id',
        ]);

        $ticketNumber = 'TKT-' . str_pad(
            (Ticket::orderBy('id', 'desc')->value('id') ?? 0) + 1,
            4, '0', STR_PAD_LEFT
        );

        $openStatus  = DB::table('statuses')->where('status_name', 'Open')->first();
        $agentRoleId = DB::table('roles')->where('name', 'agent')->value('id');

        // ── FIX: use withCount so agents with 0 tickets are included ──
        $agent = $agentRoleId
            ? User::where('role_id', $agentRoleId)
                ->where('status', 'Active')
                ->withCount(['assignedTickets as open_count' => fn($q) =>
                    $q->whereHas('status', fn($s) =>
                        $s->whereIn('status_name', ['Open', 'In Progress', 'Pending'])
                    )
                ])
                ->orderBy('open_count')
                ->first()
            : null;

        $ticket = Ticket::create([
            'ticket_number' => $ticketNumber,
            'title'         => $request->title,
            'description'   => $request->description,
            'category_id'   => $request->category_id,
            'priority_id'   => $request->priority_id,
            'status_id'     => $openStatus?->id ?? 1,
            'user_id'       => Auth::id(),
            'assigned_to'   => $agent?->id,
        ]);

        return response()->json([
            'message'     => 'Ticket created successfully',
            'assigned_to' => $agent?->full_name ?? 'Unassigned',
            'ticket'      => $ticket->load(['category', 'priority', 'status', 'user']),
        ], 201);
    }

    // ── GET /tickets ──────────────────────────────────────────
    public function index()
    {
        return response()->json(
            Ticket::with(['category', 'priority', 'status', 'user', 'assignee'])
                ->latest('id')->get()
        );
    }

    // ── GET /tickets/{id}  &  /agent/tickets/{id} ────────────
    // ── FIX: shapes comments, attachments, history ───────────
    public function show($id)
    {
        $query = Ticket::with([
            'category', 'priority', 'status', 'user', 'assignee',
            'comments.user.role',
            'attachments.uploader',
            'history.status',
            'history.changer',
        ]);

        $ticket = is_numeric($id)
            ? $query->find($id)
            : $query->where('ticket_number', $id)->first();

        if (!$ticket) {
            return response()->json(['message' => 'Ticket not found'], 404);
        }

        $comments = $ticket->comments->map(fn($c) => [
            'id'       => $c->id,
            'author'   => $c->user->full_name ?? $c->user->username ?? 'Unknown',
            'role'     => $c->user->role->name ?? 'employee',
            'text'     => $c->content,
            'internal' => $c->internal,
            'time'     => $c->created_at->diffForHumans(),
        ]);

        $attachments = $ticket->attachments->map(fn($a) => [
            'id'       => $a->id,
            'name'     => $a->file_name,
            'type'     => $a->file_type,
            'size'     => $this->formatBytes($a->file_size),
            'uploaded' => $a->created_at->format('M j, Y'),
            'path'     => $a->file_path,
        ]);

        $history = $ticket->history->map(fn($h) => [
            'id'    => $h->id,
            'event' => 'Status changed to ' . ($h->status->status_name ?? '—'),
            'actor' => 'By ' . ($h->changer->full_name ?? $h->changer->username ?? 'System'),
            'time'  => $h->created_at->diffForHumans(),
            'type'  => 'status',
            'note'  => $h->note,
        ]);

        return response()->json([
            'ticket'      => $ticket,
            'comments'    => $comments,
            'attachments' => $attachments,
            'history'     => $history,
        ]);
    }

    // ── GET /my-tickets ───────────────────────────────────────
    public function myTickets()
    {
        return response()->json(
            Ticket::with(['category', 'priority', 'status'])
                ->where('user_id', Auth::id())
                ->latest('id')->get()
        );
    }

    // ── PUT /tickets/{id} ─────────────────────────────────────
    public function update(Request $request, $id)
    {
        $ticket = Ticket::findOrFail($id);
        $request->validate([
            'title'       => 'sometimes|required|string|max:255',
            'description' => 'sometimes|required|string',
            'category_id' => 'sometimes|nullable|exists:categories,id',
            'priority_id' => 'sometimes|nullable|exists:priorities,id',
            'status_id'   => 'sometimes|nullable|exists:statuses,id',
            'assigned_to' => 'sometimes|nullable|exists:users,id',
        ]);
        $ticket->update($request->only([
            'title', 'description', 'category_id', 'priority_id', 'status_id', 'assigned_to'
        ]));
        return response()->json([
            'message' => 'Ticket updated successfully',
            'ticket'  => $ticket->load(['category', 'priority', 'status', 'user', 'assignee']),
        ]);
    }

    // ── DELETE /tickets/{id} ──────────────────────────────────
    public function destroy($id)
    {
        Ticket::findOrFail($id)->delete();
        return response()->json(['message' => 'Ticket deleted successfully']);
    }

    // ── GET /agent/tickets ────────────────────────────────────
    public function assignedTickets()
    {
        return response()->json(
            Ticket::with(['category', 'priority', 'status', 'user'])
                ->where('assigned_to', Auth::id())
                ->latest('id')->get()
        );
    }

    // ── GET /agent/dashboard/stats ────────────────────────────
    // ── FIX: was two separate methods; now one 'dashboard' method
    //         called by the route — returns everything Dashboard.jsx needs ─
    public function dashboard()
    {
        $agentId = Auth::id();
        $base    = fn() => Ticket::where('assigned_to', $agentId);

        return response()->json([
            'stats' => [
                'assigned'       => ($base)()->count(),
                'in_progress'    => ($base)()->whereHas('status', fn($q) => $q->where('status_name', 'In Progress'))->count(),
                'resolved_today' => ($base)()->whereHas('status', fn($q) => $q->where('status_name', 'Resolved'))->whereDate('updated_at', today())->count(),
                'pending_review' => ($base)()->whereHas('status', fn($q) => $q->where('status_name', 'Pending'))->count(),
            ],
            'recent_tickets' => ($base)()->with(['user', 'priority', 'status'])->latest()->take(5)->get(),
            'priority_breakdown' => [
                'critical' => ($base)()->whereHas('priority', fn($q) => $q->where('priority_name', 'Critical'))->count(),
                'high'     => ($base)()->whereHas('priority', fn($q) => $q->where('priority_name', 'High'))->count(),
                'medium'   => ($base)()->whereHas('priority', fn($q) => $q->where('priority_name', 'Medium'))->count(),
                'low'      => ($base)()->whereHas('priority', fn($q) => $q->where('priority_name', 'Low'))->count(),
            ],
        ]);
    }

    // ── PUT /agent/tickets/{id}/status ────────────────────────
    // ── FIX: removed reason/notify_user/notify_manager from
    //         TicketStatusHistory::create — columns don't exist ─
    public function updateStatus(Request $request, $id)
    {
        $request->validate([
            'status_id'      => 'required|exists:statuses,id',
            'priority_id'    => 'sometimes|exists:priorities,id',
            'reason'         => 'required|string|max:255',
            'note'           => 'nullable|string|max:1000',
            'notify_user'    => 'sometimes|boolean',
            'notify_manager' => 'sometimes|boolean',
        ]);

        $ticket = Ticket::findOrFail($id);
        $ticket->update([
            'status_id'   => $request->status_id,
            'priority_id' => $request->has('priority_id') ? $request->priority_id : $ticket->priority_id,
        ]);

        // Combine reason + note into the 'note' column that actually exists
        $noteText = collect([$request->reason, $request->note])->filter()->implode(' — ');

        TicketStatusHistory::create([
            'ticket_id'  => $ticket->id,
            'status_id'  => $request->status_id,
            'changed_by' => Auth::id(),
            'note'       => $noteText ?: null,
        ]);

        $ticket->load(['status', 'priority']);
        return response()->json([
            'message'      => 'Status updated successfully.',
            'new_status'   => $ticket->status->status_name,
            'new_priority' => $ticket->priority->priority_name,
        ]);
    }

    // ── POST /agent/tickets/{id}/comments ─────────────────────
    // ── FIX: was creating with $request->comment (undefined);
    //         must use $request->content ─────────────────────
    public function storeComment(Request $request, $id)
    {
        $request->validate([
            'content'  => 'required|string|max:5000',
            'internal' => 'sometimes|boolean',
        ]);

        $ticket  = Ticket::findOrFail($id);
        $comment = Comment::create([
            'ticket_id' => $ticket->id,
            'user_id'   => Auth::id(),
            'content'   => $request->content,   // ← FIX: was $request->comment
            'internal'  => $request->boolean('internal', false),
        ]);

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

    // ── POST /agent/tickets/{id}/attachments ──────────────────
    public function storeAttachment(Request $request, $id)
    {
        $request->validate(['file' => 'required|file|max:10240|mimes:jpg,jpeg,png,pdf,doc,docx,txt,log,zip']);

        $ticket = Ticket::findOrFail($id);
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
        ]);

        return response()->json([
            'id'       => $attachment->id,
            'name'     => $attachment->file_name,
            'type'     => $attachment->file_type,
            'size'     => $this->formatBytes($attachment->file_size),
            'uploaded' => $attachment->created_at->format('M j, Y'),
        ], 201);
    }

    // ── GET /agent/tickets/{ticketId}/attachments/{id} ────────
    public function downloadAttachment($ticketId, $attachmentId)
    {
        $att = TicketAttachment::where('ticket_id', $ticketId)->findOrFail($attachmentId);
        return response()->download(storage_path('app/' . $att->file_path), $att->file_name);
    }

    // ── POST /agent/tickets/{id}/resolve ─────────────────────
    // ── FIX: removed notify_user/notify_manager from history create ─
    public function resolveTicket(Request $request, $id)
    {
        $request->validate([
            'resolution_type' => 'required|string',
            'solution'        => 'required|string|min:20',
            'root_cause'      => 'nullable|string',
            'time_spent'      => 'nullable|integer|min:1',
            'time_unit'       => 'nullable|in:minutes,hours',
            'internal_notes'  => 'nullable|string',
            'rating'          => 'nullable|integer|min:1|max:5',
            'notify_user'     => 'boolean',
            'notify_manager'  => 'boolean',
        ]);

        $ticket         = Ticket::findOrFail($id);
        $resolvedStatus = Status::where('status_name', 'Resolved')->firstOrFail();

        $ticket->update([
            'status_id'   => $resolvedStatus->id,
            'resolved_at' => now(),
        ]);

        TicketResolution::create([
            'ticket_id'       => $ticket->id,
            'resolved_by'     => Auth::id(),
            'resolution_type' => $request->resolution_type,
            'solution'        => $request->solution,
            'root_cause'      => $request->root_cause,
            'time_spent'      => $request->time_spent,
            'time_unit'       => $request->time_unit,
            'internal_notes'  => $request->internal_notes,
            'rating'          => $request->rating,
        ]);

        // Only write columns that exist in the migration
        TicketStatusHistory::create([
            'ticket_id'  => $ticket->id,
            'status_id'  => $resolvedStatus->id,
            'changed_by' => Auth::id(),
            'note'       => $request->solution,   // summary of what was done
        ]);

        return response()->json([
            'message' => 'Ticket resolved successfully',
            'ticket'  => $ticket->load(['status', 'priority', 'resolution']),
        ]);
    }

    // ── Helper ────────────────────────────────────────────────
    private function formatBytes(int $bytes): string
    {
        if ($bytes < 1024)    return "{$bytes} B";
        if ($bytes < 1048576) return round($bytes / 1024, 1) . ' KB';
        return round($bytes / 1048576, 1) . ' MB';
    }
}
