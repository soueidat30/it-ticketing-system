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
});

// Agents, managers, admins can view and manage all tickets
Route::middleware(['auth:api', 'role:agent,manager,admin'])->group(function () {

    Route::get('/tickets', [TicketController::class, 'index']);
    Route::get('/tickets/{id}', [TicketController::class, 'show']);

    // Agent queue (MY assigned tickets)
    Route::get('/agent/tickets', [TicketController::class, 'assignedTickets']);

    // Agent ticket details (fetch by ticket number/id)
    Route::get('/agent/tickets/{id}', [TicketController::class, 'show']);


    // Agent dashboard stats
    Route::get('/agent/dashboard/stats', [TicketController::class, 'dashboardStats']);


});


Route::middleware(['auth:api', 'role:manager,admin'])->group(function () {
});

Route::middleware(['auth:api', 'role:admin'])->group(function () {
});
