<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Ticket;
use Illuminate\Http\Request;

class TicketController extends Controller
{

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
}
