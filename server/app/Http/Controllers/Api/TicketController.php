<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Ticket;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class TicketController extends Controller
{

    // GET /api/tickets - List all tickets
    public function index()
    {
        $tickets = Ticket::with([
            'category',
            'priority',
            'status',
            'creator',
            'assignee'
        ])->get();

        return response()->json($tickets);
    }

    // GET /api/tickets/{id} - Show single ticket
    public function show($id)
    {
        $ticket = Ticket::with([
            'category',
            'priority',
            'status',
            'creator',
            'assignee'
        ])->find($id);

        if (!$ticket) {
            return response()->json([
                'message' => 'Ticket not found'
            ], 404);
        }

        return response()->json($ticket);
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