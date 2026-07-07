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

        $visibility = $request->input('visibility');

        $isInternal = $request->boolean('internal', false) || $visibility === 'internal';
        $mode = $visibility ?: 'all';

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


        $role = strtolower(optional($user->role)->name);
        $isStaffReply = in_array($role, ['agent', 'manager', 'admin'], true);

        if ($isStaffReply && !$comment->internal) {
            $ticketForSla = Ticket::query()
                ->where('id', $ticketId)
                ->first();

            if ($ticketForSla) {
                $now = now();
                $updates = [];

                $shouldNotifyBreach = false;
                $breachedValue = null;

                if (empty($ticketForSla->first_response_at)) {
                    $updates['first_response_at'] = $now;
                }

                if (!empty($ticketForSla->response_due_at)) {
                    $responseDueAt = $ticketForSla->response_due_at instanceof \Carbon\Carbon
                        ? $ticketForSla->response_due_at
                        : \Carbon\Carbon::parse($ticketForSla->response_due_at);

                    $candidateResponseAt = $updates['first_response_at'] ?? $ticketForSla->first_response_at;
                    if (!empty($candidateResponseAt)) {
                        $candidate = $candidateResponseAt instanceof \Carbon\Carbon
                            ? $candidateResponseAt
                            : \Carbon\Carbon::parse($candidateResponseAt);

                        $breachedValue = $candidate->greaterThan($responseDueAt);
                        $updates['response_breached'] = $breachedValue;
                        $shouldNotifyBreach = true;
                    }
                }

                if (!empty($updates)) {
                    $ticketForSla->update($updates);
                }

                // Notify managers/admins if SLA breached
                if ($shouldNotifyBreach && $breachedValue === true) {
                    $managerRoleId = \App\Models\Role::where('name', 'manager')->value('id');
                    $adminRoleId   = \App\Models\Role::where('name', 'admin')->value('id');

                    $recipientIds = collect();
                    if (!empty($managerRoleId)) {
                        $recipientIds = $recipientIds->merge(\App\Models\User::where('role_id', $managerRoleId)->pluck('id'));
                    }
                    if (!empty($adminRoleId)) {
                        $recipientIds = $recipientIds->merge(\App\Models\User::where('role_id', $adminRoleId)->pluck('id'));
                    }

                    $recipientIds = $recipientIds
                        ->filter(fn($uid) => !empty($uid) && (int)$uid !== (int)$user->id)
                        ->unique()
                        ->values();

                    foreach ($recipientIds as $rid) {
                        NotificationController::notify(
                            user_id: (int) $rid,
                            ticket_id: (int) $ticketForSla->id,
                            triggered_by: (int) $user->id,
                            type: 'sla_breached',
                            title: 'SLA Breached',
                            message: "Ticket {$ticketForSla->ticket_number} is overdue for first response (SLA breached)."
                        );
                    }
                }
            }
        }

        // ── Notifications ───────────────────────────────────────────────────
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
