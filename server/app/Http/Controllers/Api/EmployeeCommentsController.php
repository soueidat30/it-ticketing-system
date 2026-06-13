<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Comment;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class EmployeeCommentsController extends Controller
{
    /**
     * GET /api/employee/comments
     * Returns public (non-internal) ticket comments for the logged-in employee.
     */
    public function index(Request $request)
    {
        $employeeId = $request->user()->id;

        // Public comments targeted to the logged-in employee.
        $comments = Comment::query()
            ->where('internal', false)
            ->where('notify_user_id', $employeeId)
            ->with(['user.role', 'ticket'])
            ->orderByDesc('created_at')
            ->get();

        return response()->json(
            $comments->map(fn($c) => [
                'id' => $c->id,
                'ticket_id' => $c->ticket_id,
                'ticket_number' => $c->ticket->ticket_number ?? null,
                'author' => $c->user->full_name ?? $c->user->username ?? 'Unknown',
                'role' => $c->user->role->name ?? 'employee',
                'text' => $c->content,
                'internal' => $c->internal,
                'created_at' => $c->created_at->toISOString(),
            ])
        );
    }
}

