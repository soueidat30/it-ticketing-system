<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\Auth\AuthController;
use App\Http\Controllers\Api\TicketController;

Route::prefix('auth')->group(function () {
    Route::post('login', [AuthController::class, 'login']);
});

Route::middleware('auth:api')->prefix('auth')->group(function () {
    Route::post('logout',          [AuthController::class, 'logout']);
    Route::post('refresh',         [AuthController::class, 'refresh']);
    Route::get('me',               [AuthController::class, 'me']);
    Route::post('change-password', [AuthController::class, 'changePassword']);
});

Route::middleware(['auth:api', 'role:agent,manager,admin'])->group(function () {

    Route::get('/tickets',      [TicketController::class, 'index']);
    Route::get('/tickets/{id}', [TicketController::class, 'show']);

    Route::get('/agent/tickets',          [TicketController::class, 'assignedTickets']);
    Route::get('/agent/tickets/{id}',     [TicketController::class, 'show']);
    Route::post('/agent/tickets/{id}/attachments', [TicketController::class, 'storeAttachment']);
    Route::get('/agent/tickets/{ticketId}/attachments/{attachmentId}', [TicketController::class, 'downloadAttachment']);
    Route::post('/agent/tickets/{id}/status', [TicketController::class, 'updateStatus']);
    Route::get('/agent/dashboard/stats',  [TicketController::class, 'dashboardStats']);

    Route::post('/agent/tickets/{id}/comments', [TicketController::class, 'storeComment']);
});

Route::middleware(['auth:api', 'role:manager,admin'])->group(function () {
});

Route::middleware(['auth:api', 'role:admin'])->group(function () {
});
