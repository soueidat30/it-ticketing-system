<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\Auth\AuthController;
use App\Http\Controllers\Api\TicketController;
use App\Http\Controllers\Api\CategoryController;
use App\Http\Controllers\Api\PriorityController;
use App\Http\Controllers\Api\StatusController;
use App\Http\Controllers\Api\NotificationController;
use App\Http\Controllers\Api\CommentController;
use App\Http\Controllers\Api\EmployeeCommentsController;



/*
| AUTH
*/
Route::prefix('auth')->group(function () {
    Route::post('login', [AuthController::class, 'login']);
});

Route::middleware('auth:api')->group(function () {

    // auth
    Route::get('auth/me', [AuthController::class, 'me']);
    Route::post('auth/logout', [AuthController::class, 'logout']);
    Route::post('auth/refresh', [AuthController::class, 'refresh']);
    Route::post('auth/change-password', [AuthController::class, 'changePassword']);

    // shared data
    Route::get('/categories', [CategoryController::class, 'index']);
    Route::get('/priorities', [PriorityController::class, 'index']);
    Route::get('/statuses', [StatusController::class, 'index']);
    // employee ticket actions
    Route::get('/my-tickets', [TicketController::class, 'myTickets']);
    Route::post('/tickets', [TicketController::class, 'store']);
    Route::get('/tickets/{id}', [TicketController::class, 'show']);

    Route::put('/tickets/{id}', [TicketController::class, 'update']);
    Route::delete('/tickets/{id}', [TicketController::class, 'destroy']);

    // comments (IMPORTANT: shared for employee + agent)
    Route::post('/tickets/{id}/comments', [TicketController::class, 'storeComment']);
});

/*
| AGENT ONLY
*/
Route::middleware(['auth:api', 'role:agent,manager,admin'])->group(function () {

    // Dashboard stats for agent profile
    Route::get('/agent/dashboard/stats', [TicketController::class, 'dashboardStats']);

    // Tickets
    Route::get('/tickets', [TicketController::class, 'index']);
    Route::get('/agent/tickets', [TicketController::class, 'assignedTickets']);
    Route::get('/tickets/{id}/history', [TicketController::class, 'history']);

    // Ticket details (agents can also use the generic /tickets/{id})
    Route::get('/agent/tickets/{id}', [TicketController::class, 'show']);

    // Status updates (use PATCH consistently)
    Route::patch('/tickets/{id}/status', [TicketController::class, 'updateStatus']);

    // Assignment
    Route::post('/tickets/{id}/assign', [TicketController::class, 'assignTicket']);

// Comments (agent/manager). NOTE: api/agent/tickets/{id}/comments is used by the React UI.
    Route::get('/agent/tickets/{id}/comments', [TicketController::class, 'getComments']);
    Route::post('/agent/tickets/{id}/comments', [TicketController::class, 'storeComment']);
    Route::delete('/agent/tickets/{ticketId}/comments/{commentId}', [TicketController::class, 'deleteComment']);

    // Backwards-compatible routes (if any older pages call without `/agent`)
    Route::get('/tickets/{id}/comments', [TicketController::class, 'getComments']);
    Route::post('/tickets/{id}/comments', [TicketController::class, 'storeComment']);
    Route::delete('/tickets/{ticketId}/comments/{commentId}', [TicketController::class, 'deleteComment']);
});

Route::middleware(['auth:api'])->group(function () {

    // Notifications — accessible to ALL roles
    Route::get   ('/notifications', [NotificationController::class, 'index']);

    // Employee comments section (public replies)
    Route::get   ('/employee/comments', [EmployeeCommentsController::class, 'index']);

    Route::get   ('/notifications/unread-count', [NotificationController::class, 'unreadCount']);
    Route::patch ('/notifications/read-all', [NotificationController::class, 'markAllRead']);
    Route::patch ('/notifications/{id}/read', [NotificationController::class, 'markRead']);
    Route::delete('/notifications/{id}', [NotificationController::class, 'destroy']);

    // Single ticket detail — accessible to ALL roles (employee, agent, manager)
    Route::get('/tickets/{id}', [TicketController::class, 'showSingle']);
});
