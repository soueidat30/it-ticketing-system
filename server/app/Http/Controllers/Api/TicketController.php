<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Comment;
use App\Models\Ticket;
use App\Models\TicketAttachment;
use App\Models\TicketStatusHistory;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class TicketController extends Controller
{

    public function index()
    {
        $tickets = Ticket::with([
            'category',
            'priority',
            'status',
            'user',
            'assignee',
        ])->get();

        return response()->json($tickets);
    }


    public function show($id)
    {
        $query = Ticket::with([
            'category',
            'priority',
            'status',
            'user',
            'assignee',
            // comments — eager-load the author so the frontend gets full_name & role
            'comments.user.role',
            // attachments — eager-load the uploader
            'attachments.uploader',
            // history — eager-load the new status label and the actor's name
            'history.status',
            'history.changer',
        ]);

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

        // ── Shape comments so the frontend field names match ──
        $comments = $ticket->comments->map(fn($c) => [
            'id'       => $c->id,
            'author'   => $c->user->full_name ?? $c->user->username ?? 'Unknown',
            'role'     => $c->user->role->name ?? 'employee',
            'text'     => $c->content,          // frontend reads c.text
            'internal' => $c->internal,
            'time'     => $c->created_at->diffForHumans(),
        ]);

        // ── Shape attachments ─────────────────────────────────
        $attachments = $ticket->attachments->map(fn($a) => [
            'id'       => $a->id,
            'name'     => $a->file_name,        // frontend reads a.name
            'type'     => $a->file_type,        // frontend reads a.type (pdf / img / log / doc)
            'size'     => $this->formatBytes($a->file_size), // frontend reads a.size
            'uploaded' => $a->created_at->format('M j, Y'), // frontend reads a.uploaded
            'path'     => $a->file_path,
        ]);

        // ── Shape history ─────────────────────────────────────
        $history = $ticket->history->map(fn($h) => [
            'id'    => $h->id,
            'event' => 'Status changed to ' . ($h->status->status_name ?? '—'),
            'actor' => 'By ' . ($h->changer->full_name ?? $h->changer->username ?? 'System'),
            'time'  => $h->created_at->diffForHumans(),
            'type'  => 'status',   // drives the CSS dot colour (td-history-dot--status)
            'note'  => $h->note,
        ]);

        return response()->json([
            'ticket'      => $ticket,
            'comments'    => $comments,
            'attachments' => $attachments,
            'history'     => $history,
        ]);
    }

    // ── GET /agent/tickets  (only MY assigned tickets) ───────
    public function assignedTickets()
    {
        $agentId = Auth::id();   // ← was returning ALL tickets before

        $tickets = Ticket::with([
            'category',
            'priority',
            'status',
            'user',
        ])
        ->where('assigned_to', $agentId)
        ->get();

        return response()->json($tickets);
    }

    // ── GET /agent/dashboard/stats ───────────────────────────
    public function dashboardStats()
    {
        $agentId = Auth::id();

        return response()->json([
            'assigned' => Ticket::where('assigned_to', $agentId)->count(),

            'open' => Ticket::where('assigned_to', $agentId)
                ->whereHas('status', fn($q) => $q->where('status_name', 'Open'))
                ->count(),

            'in_progress' => Ticket::where('assigned_to', $agentId)
                ->whereHas('status', fn($q) => $q->where('status_name', 'In Progress'))
                ->count(),

            'resolved' => Ticket::where('assigned_to', $agentId)
                ->whereHas('status', fn($q) => $q->where('status_name', 'Resolved'))
                ->count(),
        ]);
    }

    // ── POST /agent/tickets/{id}/comments ────────────────────
    public function storeComment(Request $request, $id)
    {
        $request->validate([
            'content'  => 'required|string|max:5000',
            'internal' => 'boolean',
        ]);

        $ticket = Ticket::findOrFail($id);

        $comment = Comment::create([
            'ticket_id' => $ticket->id,
            'user_id'   => Auth::id(),
            'content'   => $request->content,
            'internal'  => $request->boolean('internal', false),
        ]);

        // Return the same shape the frontend expects
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

    public function downloadAttachment($ticketId, $attachmentId)
    {
        $attachment = TicketAttachment::where('ticket_id', $ticketId)
                                      ->findOrFail($attachmentId);

        return response()->download(
            storage_path('app/' . $attachment->file_path),
            $attachment->file_name
        );
    }

    public function updateStatus(Request $request, $id)
    {
        $request->validate([
            'status_id' => 'required|exists:statuses,id',
            'note'      => 'nullable|string|max:1000',
        ]);

        $ticket = Ticket::findOrFail($id);
        $ticket->update(['status_id' => $request->status_id]);

        TicketStatusHistory::create([
            'ticket_id'  => $ticket->id,
            'status_id'  => $request->status_id,
            'changed_by' => Auth::id(),
            'note'       => $request->note,
        ]);

        return response()->json(['message' => 'Status updated successfully.']);
    }

    // ── Helper: human-readable file size ─────────────────────
    private function formatBytes(int $bytes): string
    {
        if ($bytes < 1024)       return "{$bytes} B";
        if ($bytes < 1048576)    return round($bytes / 1024, 1) . ' KB';
        return round($bytes / 1048576, 1) . ' MB';
    }

    // POST /api/tickets - Create a new ticket
    public function store(Request $request)
    {
        $request->validate([
            'title'       => 'required|string|max:255',
            'description' => 'required|string',
            'category_id' => 'required|exists:categories,id',
            'priority_id' => 'required|exists:priorities,id',
        ]);

        // Generate unique ticket number
        $lastTicket = Ticket::orderBy('id', 'desc')->first();
        $nextNumber = $lastTicket ? ($lastTicket->id + 1) : 1;
        $ticketNumber = 'TKT-' . str_pad($nextNumber, 4, '0', STR_PAD_LEFT);

        // Get the "Open" status id
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

        return response()->json([
            'message' => 'Ticket created successfully',
            'ticket'  => $ticket->load(['category', 'priority', 'status'])
        ], 201);
    }

    // PUT /api/tickets/{id} - Update a ticket
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

    // DELETE /api/tickets/{id} - Delete a ticket
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

    public function myTickets()
    {
    $tickets = Ticket::with(['category', 'priority', 'status'])
        ->where('user_id', Auth::id())
        ->orderBy('created_at', 'desc')
        ->get();

    return response()->json($tickets);
    }
}
