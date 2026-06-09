<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Category;
use App\Models\Comment;
use App\Models\Priority;
use App\Models\Status;
use App\Models\Ticket;
use App\Models\TicketAttachment;
use App\Models\TicketStatusHistory;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use App\Models\TicketResolution;

class TicketController extends Controller
{

    public function store(Request $request)
    {
        $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'required|string',
            'category_id' => 'required|exists:categories,id',
            'priority_id' => 'required|exists:priorities,id',
        ]);

        $lastTicket = Ticket::orderBy('id', 'desc')->first();
        $nextNumber = $lastTicket ? ($lastTicket->id + 1) : 1;
        $ticketNumber = 'TKT-' . str_pad($nextNumber, 4, '0', STR_PAD_LEFT);

        $openStatus = DB::table('statuses')->where('status_name', 'Open')->first();

        $agentRoleId = DB::table('roles')->where('name', 'agent')->value('id');
        $agent = null;
        if ($agentRoleId) {
            $agent = User::where('role_id', $agentRoleId)
                ->where('status', 'Active')
                ->leftJoin('tickets', 'users.id', '=', 'tickets.assigned_to')
                ->whereIn('tickets.status_id', function ($q) {
                    $q->select('id')->from('statuses')->whereIn('status_name', ['Open', 'In Progress', 'Pending']);
                })
                ->select('users.*', DB::raw('count(tickets.id) as open_count'))
                ->groupBy('users.id')
                ->orderBy('open_count', 'asc')
                ->first();

            if (!$agent) $agent = null;
        }

        $ticket = Ticket::create([
            'ticket_number' => $ticketNumber,
            'title' => $request->title,
            'description' => $request->description,
            'category_id' => $request->category_id,
            'priority_id' => $request->priority_id,
            'status_id' => $openStatus?->id ?? 1,
            'user_id' => Auth::id(),
            'assigned_to' => $agent?->id,
        ]);

        return response()->json([
            'message' => 'Ticket created successfully',
            'assigned_to' => $agent?->full_name ?? 'Unassigned',
            'ticket' => $ticket->load(['category', 'priority', 'status', 'user']),
        ], 201);
    }

    public function index(Request $request)
    {
        $tickets = Ticket::with(['category', 'priority', 'status', 'user', 'assignee'])
            ->latest('id')
            ->get();

        return response()->json($tickets);
    }

    public function show($id)
    {
        $query = Ticket::with(['category', 'priority', 'status', 'user', 'assignee', 'history']);

        if (is_string($id) && str_starts_with($id, 'TKT-')) {
            $ticket = $query->where('ticket_number', $id)->firstOrFail();
        } else {
            $ticket = $query->findOrFail($id);
        }

        return response()->json($ticket);
    }


    public function myTickets()
    {
        $tickets = Ticket::with(['category', 'priority', 'status', 'history'])
            ->where('user_id', Auth::id())
            ->latest('id')
            ->get();

        return response()->json($tickets);
    }

    public function update(Request $request, $id)
    {
        $ticket = Ticket::findOrFail($id);
        $request->validate([
            'title' => 'sometimes|required|string|max:255',
            'description' => 'sometimes|required|string',
            'category_id' => 'sometimes|nullable|exists:categories,id',
            'priority_id' => 'sometimes|nullable|exists:priorities,id',
            'status_id' => 'sometimes|nullable|exists:statuses,id',
            'assigned_to' => 'sometimes|nullable|exists:users,id',
        ]);

        $ticket->update($request->only(['title','description','category_id','priority_id','status_id','assigned_to']));

        return response()->json([
            'message' => 'Ticket updated successfully',
            'ticket' => $ticket->load(['category','priority','status','user','assignee']),
        ]);
    }

    public function destroy($id)
    {
        $ticket = Ticket::findOrFail($id);
        $ticket->delete();
        return response()->json(['message' => 'Ticket deleted successfully']);
    }

    public function assignedTickets()
    {
        $agentId = Auth::id();

        $tickets = Ticket::with(['category', 'priority', 'status', 'user'])
            ->where('assigned_to', $agentId)
            ->latest('id')
            ->get();

        return response()->json($tickets);
    }

    public function dashboardStats()
    {
        $agentId = Auth::id();

        $base = Ticket::where('assigned_to', $agentId);

        $stats = [
            'total' => (clone $base)->count(),
            'open' => (clone $base)->whereHas('status', fn($q) => $q->where('status_name', 'Open'))->count(),
            'in_progress' => (clone $base)->whereHas('status', fn($q) => $q->where('status_name', 'In Progress'))->count(),
            'pending' => (clone $base)->whereHas('status', fn($q) => $q->where('status_name', 'Pending'))->count(),
        ];

        return response()->json($stats);
    }

    public function updateStatus(Request $request, $id)
    {
        $request->validate([
            'status_id' => 'required|exists:statuses,id',
            'priority_id' => 'sometimes|exists:priorities,id',
            // Columns exist per your migrations
            'reason' => 'required|string|max:255',
            'note' => 'nullable|string|max:1000',
            'notify_user' => 'sometimes|boolean',
            'notify_manager' => 'sometimes|boolean',
        ]);

        $ticket = Ticket::findOrFail($id);

        $ticket->update([
            'status_id' => $request->status_id,
            'priority_id' => $request->has('priority_id') ? $request->priority_id : $ticket->priority_id,
        ]);

        TicketStatusHistory::create([
            'ticket_id' => $ticket->id,
            'status_id' => $request->status_id,
            'changed_by' => Auth::id(),
            'reason' => $request->reason,
            'note' => $request->note,
            'notify_user' => $request->boolean('notify_user', false),
            'notify_manager' => $request->boolean('notify_manager', false),
        ]);

        return response()->json([
            'message' => 'Status updated successfully.',
            'ticket' => $ticket->load(['status','priority']),
        ]);
    }

    public function storeComment(Request $request, $id)
    {
        $request->validate([
            'content' => 'required|string|max:5000',
            'internal' => 'sometimes|boolean',
        ]);


        $ticket = Ticket::findOrFail($id);

        $comment = Comment::create([
            'ticket_id' => $ticket->id,
            'user_id' => Auth::id(),
            'content' => $request->comment,
        ]);

        return response()->json($comment, 201);
    }

    public function storeAttachment(Request $request, $id)
    {
        $ticket = Ticket::findOrFail($id);

        $request->validate([
            'file' => 'required|file|max:10240', // 10MB
        ]);

        $path = $request->file('file')->store('ticket-attachments', 'public');

        $att = TicketAttachment::create([
            'ticket_id' => $ticket->id,
            'uploaded_by' => Auth::id(),
            'file_path' => $path,
            'file_name' => $request->file('file')->getClientOriginalName(),
        ]);

        return response()->json($att, 201);
    }

    public function downloadAttachment($ticketId, $attachmentId)
    {
        $att = TicketAttachment::where('id', $attachmentId)
            ->where('ticket_id', $ticketId)
            ->firstOrFail();

        $fullPath = storage_path('app/public/' . $att->file_path);

        return response()->download($fullPath, $att->file_name);
    }
    // (Optional) resolution endpoint if you later add it to routes.
    // Keeping it out of the route graph avoids extra 500s.
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

    $ticket = Ticket::findOrFail($id);

    $resolvedStatus = Status::where(
        'status_name',
        'Resolved'
    )->first();

    $ticket->update([
        'status_id' => $resolvedStatus->id,
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

    TicketStatusHistory::create([
        'ticket_id'      => $ticket->id,
        'status_id'      => $resolvedStatus->id,
        'changed_by'     => Auth::id(),
        'note'           => $request->solution,
        'notify_user'    => $request->boolean('notify_user'),
        'notify_manager' => $request->boolean('notify_manager'),
    ]);

    return response()->json([
        'message' => 'Ticket resolved successfully'
    ]);
}
}

