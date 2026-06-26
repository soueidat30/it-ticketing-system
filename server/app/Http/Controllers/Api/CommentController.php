<?php

namespace App\Http\Controllers\Api;


use App\Http\Controllers\Controller;
use App\Models\Comment;
use App\Models\Ticket;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

use App\Http\Controllers\Api\NotificationController;

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

        $role = strtolower(optional($user->role)->name);


        $isManagerOrAdmin = in_array($role, ['manager', 'admin'], true);

        if ($role === 'employee') {
            $query->where(function ($q) use ($user) {
                $q->where('visibility', 'all')
                  ->orWhere(function ($sub) use ($user) {
                      $sub->where('visibility', 'employee')
                          ->where('receiver_id', $user->id);
                  });
            });
        }

        elseif ($role === 'agent') {
            $query->where(function ($q) use ($user) {
                $q->where('visibility', 'all')
                  ->orWhere(function ($sub) use ($user) {
                      $sub->where('visibility', 'agent')
                          ->where('receiver_id', $user->id);
                  });
            });
        }

        elseif ($isManagerOrAdmin) {
            // no visibility restriction
        }

        else {
            $query->where('internal', false);
            $authUserId = (int) $user->id;
            $query->where(function ($q) use ($authUserId) {
                $q->whereNull('receiver_id')
                  ->orWhere('receiver_id', $authUserId);
            });
        }


        $comments = $query->get()->map(function ($c) {
            return [
                'id' => $c->id,
                'user' => [
                    'id' => $c->user?->id,
                    'full_name' => $c->user?->full_name
                        ?? $c->user?->username
                        ?? 'Unknown',
                    'username' => $c->user?->username,
                    'role' => $c->user?->role?->name,
                ],
                // backward compatibility
                'author' => $c->user?->full_name
                    ?? $c->user?->username
                    ?? 'Unknown',
                'role' => $c->user?->role?->name ?? 'employee',
                'text' => $c->content,
                'content' => $c->content,
                'internal' => $c->internal,
                'time' => $c->created_at?->diffForHumans(),
                'created_at' => $c->created_at,
            ];
        });

        return response()->json($comments);
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

        // Determine receiver based on comment visibility + ticket assignment.
        // - receiver_id null => everyone (external)
        // - internal comments always have receiver_id null
        $visibility = $request->input('visibility');

        $isInternal = $request->boolean('internal', false) || $visibility === 'internal';
        $mode = $visibility ?: 'all';

        // Store visibility explicitly so index() can filter correctly.
        // For internal notes, we still set visibility='internal'.
        $storedVisibility = $isInternal ? 'internal' : $mode;

        $receiverId = null;
        if (!$isInternal) {
            if ($mode === 'employee') {
                $receiverId = (int) $ticket->user_id;
            } elseif ($mode === 'agent' && !empty($ticket->assigned_to)) {
                $receiverId = (int) $ticket->assigned_to;
            } elseif ($mode === 'all') {
                $receiverId = null; // everyone
            }
        }


        $comment = Comment::create([
            'ticket_id'    => $ticketId,
            'user_id'      => $user->id,
            'content'      => $request->content,
            'internal'     => $isInternal,
            'visibility'   => $storedVisibility,
            'receiver_id'  => $receiverId,
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
