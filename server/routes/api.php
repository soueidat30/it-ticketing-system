<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\AuthController;

// ── Public ────────────────────────────────────────────────────
Route::prefix('auth')->group(function () {
    Route::post('login', [AuthController::class, 'login']);
});

// ── Protected (valid JWT required) ───────────────────────────
Route::middleware('auth:api')->prefix('auth')->group(function () {
    Route::post('logout',          [AuthController::class, 'logout']);
    Route::post('refresh',         [AuthController::class, 'refresh']);
    Route::get('me',               [AuthController::class, 'me']);
    Route::post('change-password', [AuthController::class, 'changePassword']);
});

// ── Role-gated groups ─────────────────────────────────────────
Route::middleware(['auth:api', 'role:employee,agent,manager,admin'])->group(function () {
    // Any authenticated user — ticket submission, tracking
});

Route::middleware(['auth:api', 'role:agent,manager,admin'])->group(function () {
    // Agents — manage & resolve tickets
});

Route::middleware(['auth:api', 'role:manager,admin'])->group(function () {
    // Managers — reports, dashboard
});

Route::middleware(['auth:api', 'role:admin'])->group(function () {
    // Admin — user management, settings
});
