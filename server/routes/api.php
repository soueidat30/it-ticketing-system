<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\Auth\AuthController;
use App\Http\Controllers\Api\TicketController;
use App\Http\Controllers\Api\CategoryController;
use App\Http\Controllers\Api\PriorityController;

Route::prefix('auth')->group(function () {
    Route::post('login', [AuthController::class, 'login']);
});

Route::middleware('auth:api')->prefix('auth')->group(function () {
    Route::post('logout',          [AuthController::class, 'logout']);
    Route::post('refresh',         [AuthController::class, 'refresh']);
    Route::get('me',               [AuthController::class, 'me']);
    Route::post('change-password', [AuthController::class, 'changePassword']);
});

Route::middleware(['auth:api', 'role:employee,agent,manager,admin'])->group(function () {
    Route::post('/tickets',             [TicketController::class, 'store']);
    Route::put('/tickets/{id}',         [TicketController::class, 'update']);
    Route::delete('/tickets/{id}',      [TicketController::class, 'destroy']);
    Route::get('/my-tickets',           [TicketController::class, 'myTickets']);
    Route::get('/categories',           [CategoryController::class, 'index']);
    Route::get('/priorities',           [PriorityController::class, 'index']);
});

Route::middleware(['auth:api', 'role:agent,manager,admin'])->group(function () {

    Route::get('/tickets', [TicketController::class, 'index']);
    Route::get('/tickets/{id}', [TicketController::class, 'show']);

    Route::get('/agent/tickets', [TicketController::class, 'assignedTickets']);

    Route::get('/agent/tickets/{id}', [TicketController::class, 'show']);

    Route::get('/agent/dashboard/stats', [TicketController::class, 'dashboardStats']);

    Route::post('/agent/tickets/{id}/comments',                         [TicketController::class, 'storeComment']);
    Route::post('/agent/tickets/{id}/attachments',                      [TicketController::class, 'storeAttachment']);
    Route::get('/agent/tickets/{ticketId}/attachments/{attachmentId}',  [TicketController::class, 'downloadAttachment']);

    Route::put('/agent/tickets/{id}/status',                            [TicketController::class, 'updateStatus']);


    Route::post('/agent/tickets/{id}/resolve',                          [TicketController::class, 'resolveTicket']);
});

Route::middleware(['auth:api', 'role:manager,admin'])->group(function () {
});

Route::middleware(['auth:api', 'role:admin'])->group(function () {
});



