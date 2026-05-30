<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\AuthController;

Route::prefix('auth')->group(function () {
    Route::post('login', [AuthController::class, 'login']);
});

Route::middleware('auth:api')->prefix('auth')->group(function () {
    Route::post('logout',  [AuthController::class, 'logout']);
    Route::post('refresh', [AuthController::class, 'refresh']);
    Route::get('me',       [AuthController::class, 'me']);
});

Route::middleware(['auth:api', 'role:employee,agent,manager,admin'])->group(function () {
});

Route::middleware(['auth:api', 'role:agent,manager,admin'])->group(function () {
});

Route::middleware(['auth:api', 'role:manager,admin'])->group(function () {
});

Route::middleware(['auth:api', 'role:admin'])->group(function () {
});
