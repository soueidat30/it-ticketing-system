<?php
 
namespace App\Http\Controllers\Api;
 
 
use App\Http\Controllers\Controller;
use App\Models\Comment;
use App\Models\Ticket;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
 
class CommentController extends Controller
{
    /**
     * GET /api/tickets/{ticket}/comments
     * Returns all comments for a ticket.
     * Internal comments are hidden from employees.
     */
    public function index(Request $request, $ticketId)
    {
        $user   = $request->user();
        $ticket = Ticket::findOrFail($ticketId);
 
        $query = Comment::with('user')
            ->where('ticket_id', $ticketId)
            ->orderBy('created_at');
 
        // Employees cannot see internal notes
        if ($user->role_id === 3) { // 3 = employee
            $query->where('internal', false);
        }
 
        return response()->json($query->get());
    }
 
    /**
     * POST /api/tickets/{ticket}/comments
     * Adds a comment and fires a notification to the ticket owner.
     */
    public function store(Request $request, $ticketId)
    {
        $request->validate([
            'content'  => 'required|string|max:2000',
            'internal' => 'boolean',
        ]);
 
        $user   = $request->user();
        $ticket = Ticket::with('user')->findOrFail($ticketId);
 
        $comment = Comment::create([
            'ticket_id' => $ticketId,
            'user_id'   => $user->id,
            'content'   => $request->content,
            'internal'  => $request->boolean('internal', false),
        ]);
 
        // Notify the ticket owner (employee), unless they are the commenter
        if (!$comment->internal && $ticket->user_id !== $user->id) {
            NotificationController::notify(
                user_id:      $ticket->user_id,
                ticket_id:    $ticket->id,
                triggered_by: $user->id,
                type:         'comment_added',
                title:        'New reply on your ticket',
                message:      "{$user->full_name} replied on \"{$ticket->title}\": \"" .
                              Str::limit($request->content, 80) . "\""
            );
        }
 
        // Activity log
        \DB::table('activity_logs')->insert([
            'user_id'     => $user->id,
            'action'      => 'comment_added',
            'description' => "Comment added on ticket #{$ticket->ticket_number}",
            'ticket_id'   => $ticket->id,
            'created_at'  => now(),
            'updated_at'  => now(),
        ]);
 
        return response()->json($comment->load('user'), 201);
    }
}
 