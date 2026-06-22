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
use App\Http\Controllers\Api\UserController;
use App\Http\Controllers\Api\RoleController;
use App\Http\Controllers\Api\DepartmentController;
use App\Http\Controllers\Admin\AdminDashboardController;
use App\Http\Controllers\Admin\ActivityLogController;
use App\Http\Controllers\Api\Admin\UserManagementController;


Route::prefix('auth')->group(function () {

    Route::post('login', [AuthController::class, 'login']);
});

Route::middleware(['auth:api'])->group(function () {
    Route::get('/admin/dashboard', [AdminDashboardController::class, 'index']);
    Route::get('/admin/activity-logs', [ActivityLogController::class, 'index']);

    Route::get('/roles', [RoleController::class, 'index']);
    Route::get('/departments', [DepartmentController::class, 'index']);
});


Route::middleware(['auth:api', 'role:admin'])->prefix('admin')->group(function () {
    Route::get('/users', [UserManagementController::class, 'index']);
    Route::post('/users', [UserManagementController::class, 'store']);
    Route::put('/users/{user}', [UserManagementController::class, 'update']);
    Route::delete('/users/{user}', [UserManagementController::class, 'destroy']);

    Route::post('/users/bulk-delete', [UserManagementController::class, 'bulkDelete']);
    Route::post('/users/bulk-deactivate', [UserManagementController::class, 'bulkDeactivate']);
});




Route::middleware('auth:api')->group(function () {

    Route::get('auth/me', [AuthController::class, 'me']);
    Route::put('auth/me', [AuthController::class, 'updateMe']);

    Route::post('auth/logout', [AuthController::class, 'logout']);
    Route::get('auth/debug', [AuthController::class, 'authDebug']);

    Route::post('auth/refresh', [AuthController::class, 'refresh']);
    Route::post('auth/change-password', [AuthController::class, 'changePassword']);

    Route::get('/categories', [CategoryController::class, 'index']);
    Route::get('/priorities', [PriorityController::class, 'index']);
    Route::get('/statuses', [StatusController::class, 'index']);
    Route::get('/my-tickets', [TicketController::class, 'myTickets']);
    Route::post('/tickets', [TicketController::class, 'store']);
    Route::get('/tickets/{id}', [TicketController::class, 'show']);

    Route::put('/tickets/{id}', [TicketController::class, 'update']);
    Route::delete('/tickets/{id}', [TicketController::class, 'destroy']);

    Route::post('/tickets/{id}/comments', [TicketController::class, 'storeComment']);
});


Route::middleware(['auth:api', 'role:agent,manager,admin,employee'])->group(function () {

    Route::get('/agent/dashboard/stats', [TicketController::class, 'dashboardStats']);

    Route::get('/tickets', [TicketController::class, 'index']);
    Route::get('/agent/tickets', [TicketController::class, 'assignedTickets']);
    Route::get('/tickets/{id}/history', [TicketController::class, 'history']);

    Route::get('/agent/tickets/{id}', [TicketController::class, 'show']);

    Route::patch('/tickets/{id}/status', [TicketController::class, 'updateStatus']);

    Route::post('/tickets/{id}/assign', [TicketController::class, 'assignTicket']);

    Route::post('/agent/tickets/{id}/resolve', [TicketController::class, 'resolveTicket']);
    Route::post('/agent/tickets/{id}/attachments', [TicketController::class, 'storeAttachment']);
    Route::post('/employee/tickets/{id}/attachments', [TicketController::class, 'storeAttachment']);
    Route::get('/agent/tickets/{ticketId}/attachments/{attachmentId}', [TicketController::class, 'downloadAttachment']);
    Route::get('/agent/tickets/{ticketId}/attachments/{attachmentId}/preview', [TicketController::class, 'previewAttachment']);
    Route::delete('/agent/tickets/{ticketId}/attachments/{attachmentId}', [TicketController::class, 'deleteAttachment']);

Route::get('/tickets/{id}/attachments', [TicketController::class, 'getAttachments']);
    Route::get('/manager/tickets/pending', [TicketController::class, 'pendingForManager']);


    Route::get('/agent/tickets/{id}/comments', [TicketController::class, 'getComments']);
    Route::post('/agent/tickets/{id}/comments', [TicketController::class, 'storeComment']);
    Route::delete('/agent/tickets/{ticketId}/comments/{commentId}', [TicketController::class, 'deleteComment']);

    Route::get('/tickets/{id}/comments', [TicketController::class, 'getComments']);
    Route::post('/tickets/{id}/comments', [TicketController::class, 'storeComment']);
    Route::delete('/tickets/{ticketId}/comments/{commentId}', [TicketController::class, 'deleteComment']);
});

Route::get('/users', [UserController::class, 'index']);

Route::get('/health/route-users', function () {
    return response()->json(['ok' => true]);
});

Route::middleware(['auth:api'])->group(function () {

    Route::get('users', [UserController::class, 'index']);

    Route::get   ('/notifications', [NotificationController::class, 'index']);

    Route::get   ('/employee/comments', [EmployeeCommentsController::class, 'index']);

    Route::get   ('/notifications/unread-count', [NotificationController::class, 'unreadCount']);
    Route::patch ('/notifications/read-all', [NotificationController::class, 'markAllRead']);
    Route::patch ('/notifications/{id}/read', [NotificationController::class, 'markRead']);
    Route::delete('/notifications/{id}', [NotificationController::class, 'destroy']);

    Route::get('/tickets/{id}', [TicketController::class, 'showSingle']);
});
