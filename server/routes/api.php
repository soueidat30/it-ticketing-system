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

// Employee can create tickets and view/cancel their own
Route::middleware(['auth:api', 'role:employee,agent,manager,admin'])->group(function () {
    Route::post('/tickets',        [TicketController::class, 'store']);
    Route::get('/categories',      [CategoryController::class, 'index']); 
    Route::get('/priorities',      [PriorityController::class, 'index']); 
    Route::get('/my-tickets',      [TicketController::class, 'myTickets']);
    Route::delete('/tickets/{id}', [TicketController::class, 'destroy']);
});

// Agents, managers, admins can view and manage all tickets
Route::middleware(['auth:api', 'role:agent,manager,admin'])->group(function () {
    Route::get('/tickets',         [TicketController::class, 'index']);
    Route::get('/tickets/{id}',    [TicketController::class, 'show']);
    Route::put('/tickets/{id}',    [TicketController::class, 'update']);
});

Route::middleware(['auth:api', 'role:manager,admin'])->group(function () {
});

Route::middleware(['auth:api', 'role:admin'])->group(function () {
});