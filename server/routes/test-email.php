<?php

use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\Mail;
use App\Models\Ticket;

// Diagnostic route - intentionally NOT protected by auth middleware in this template.
// You can protect it if needed.
Route::get('/test-email', function () {
    try {
        $ticket = Ticket::first();
        if (!$ticket) {
            return response()->json(['message' => 'No ticket found'], 404);
        }

        $solution = 'Test solution for diagnostic purposes';
        $to = 'placeholder@example.com';

        Mail::to($to)->send(new \App\Mail\TicketClosedMail($ticket, $solution));

        return response()->json(['message' => 'Test email sent successfully', 'to' => $to]);
    } catch (\Throwable $e) {
        return response()->json([
            'error' => $e->getMessage(),
            'trace' => $e->getTraceAsString()
        ], 500);
    }
});

