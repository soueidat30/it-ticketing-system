<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\Auth\AuthController;
use App\Http\Controllers\Api\TicketController;
use App\Http\Controllers\Api\CategoryController;
use App\Http\Controllers\Api\PriorityController;
use App\Http\Controllers\Api\StatusController;

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

    Route::get('/tickets', [TicketController::class, 'index']);

    // Ticket details for agent (supports numeric DB id OR ticket_number like TKT-0001)
    Route::get('/agent/tickets/{id}', [TicketController::class, 'show']);
    Route::get('/agent/tickets', [TicketController::class, 'assignedTickets']);


    Route::put('/tickets/{id}/status', [TicketController::class, 'updateStatus']);
    Route::post('/tickets/{id}/assign', [TicketController::class, 'assignTicket']);
    Route::get('/tickets/{id}/comments', [TicketController::class, 'getComments']);
    Route::get('/tickets/{id}/history', [TicketController::class, 'history']);


});

