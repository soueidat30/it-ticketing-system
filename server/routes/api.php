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
use App\Http\Controllers\Admin\CategoryManagementController;
use App\Http\Controllers\Admin\PriorityManagementController;
use App\Http\Controllers\Api\KnowledgeBaseController;
use App\Http\Controllers\Api\ReportsController;
use App\Http\Controllers\Api\AiTicketAssistController;
use App\Http\Controllers\Admin\AssetController;
use App\Http\Controllers\Api\EmployeeAssetController;



Route::prefix('auth')->group(function () {

    Route::post('login', [AuthController::class, 'login']);
});

Route::middleware(['auth:api'])->group(function () {

    // Added: allow frontend assignment UI to fetch user details
    Route::get('/users/{user}', [UserController::class, 'show']);

    // Added: allow department assignment UI to update a user's department
    Route::patch('/users/{user}', [UserController::class, 'updateDepartment']);
    Route::put('/users/{user}', [UserController::class, 'updateDepartment']);

    Route::get('/admin/dashboard', [AdminDashboardController::class, 'index']);
    Route::get('/admin/activity-logs', [ActivityLogController::class, 'index']);
    Route::get('/admin/activity-logs/export/csv', [ActivityLogController::class, 'exportCsv']);

    Route::get('/roles', [RoleController::class, 'index']);

    // Departments
    // Existing: list departments
    Route::get('/departments', [DepartmentController::class, 'index']);

    // Support fetching by department name/id/slug (frontend sometimes calls /departments/{name})
    Route::get('/departments/{department}', [DepartmentController::class, 'show']);

    // Department management CRUD (implemented in DepartmentController)
    Route::post('/departments', [DepartmentController::class, 'store']);
    Route::put('/departments/{department}', [DepartmentController::class, 'update']);
    Route::patch('/departments/{department}', [DepartmentController::class, 'update']);
    Route::delete('/departments/{department}', [DepartmentController::class, 'destroy']);
});



Route::middleware(['auth:api', 'role:admin'])->prefix('admin')->group(function () {
    // Notifications
    Route::get('/notifications', [\App\Http\Controllers\Api\NotificationController::class, 'adminIndex']);

    Route::patch('/notifications/{id}/read', [\App\Http\Controllers\Api\NotificationController::class, 'adminMarkRead']);
    Route::patch('/notifications/{id}/unread', [\App\Http\Controllers\Api\NotificationController::class, 'adminMarkUnread']);
    Route::delete('/notifications/{id}', [\App\Http\Controllers\Api\NotificationController::class, 'adminDestroy']);


    // Users

    Route::get('/users', [UserManagementController::class, 'index']);
    Route::post('/users', [UserManagementController::class, 'store']);
    Route::put('/users/{user}', [UserManagementController::class, 'update']);
    Route::delete('/users/{user}', [UserManagementController::class, 'destroy']);

    Route::post('/users/bulk-delete', [UserManagementController::class, 'bulkDelete']);
    Route::post('/users/bulk-deactivate', [UserManagementController::class, 'bulkDeactivate']);
    Route::post('/users/bulk-activate', [UserManagementController::class, 'bulkActivate']);


    // Categories (Admin)
    Route::get('/categories', [CategoryManagementController::class, 'index']);
    Route::post('/categories', [CategoryManagementController::class, 'store']);
    Route::put('/categories/{category}', [CategoryManagementController::class, 'update']);
    Route::delete('/categories/{category}', [CategoryManagementController::class, 'destroy']);

    Route::patch('/categories/{category}/toggle-status', [CategoryManagementController::class, 'toggleStatus']);

    Route::get('/category-design-options', [\App\Http\Controllers\Admin\CategoryDesignOptionsController::class, 'index']);

    // Assets (Admin)
    Route::get('/assets', [AssetController::class, 'index']);
    Route::post('/assets', [AssetController::class, 'store']);
    Route::get('/assets/{asset}', [AssetController::class, 'show']);
    Route::put('/assets/{asset}', [AssetController::class, 'update']);
    Route::delete('/assets/{asset}', [AssetController::class, 'destroy']);
    Route::post('/assets/{asset}/assign', [AssetController::class, 'assign']);
    Route::get('/assets/{asset}/qr/download', [AssetController::class, 'downloadQr']);

    Route::post('/assets/{asset}/qr/regenerate', [AssetController::class, 'regenerateQr']);

    // Priorities (Admin)
    Route::prefix('admin')->group(function () {
        Route::get('/priorities', [PriorityManagementController::class, 'index']);

        Route::post('/priorities', [PriorityManagementController::class, 'store']);

        Route::put('/priorities/{priority}', [PriorityManagementController::class, 'update']);

        Route::delete('/priorities/{priority}', [PriorityManagementController::class, 'destroy']);

        Route::patch('/priorities/{priority}/toggle-status', [PriorityManagementController::class, 'toggleStatus']);

        Route::post('/priorities/reorder', [PriorityManagementController::class, 'reorder']);
    });
});


Route::middleware('auth:api')->group(function () {

    Route::get('auth/me', [AuthController::class, 'me']);

    // Employee-safe asset listing (assigned assets)
    Route::get('/my-assets', [EmployeeAssetController::class, 'index']);

    Route::put('auth/me', [AuthController::class, 'updateMe']);

    Route::post('auth/logout', [AuthController::class, 'logout']);
    Route::get('auth/debug', [AuthController::class, 'authDebug']);

    Route::post('auth/refresh', [AuthController::class, 'refresh']);
    Route::post('auth/change-password', [AuthController::class, 'changePassword']);

    Route::get('/categories', [CategoryController::class, 'index']);
    Route::get('/priorities', [PriorityController::class, 'index']);
    Route::post('/priorities', [PriorityController::class, 'store']);
    Route::put('/priorities/{priority}', [PriorityController::class, 'update']);
    Route::patch('/priorities/{priority}/toggle-status', [PriorityController::class, 'toggleStatus']);
    Route::post('/priorities/reorder', [PriorityController::class, 'reorder']);
    Route::delete('/priorities/{priority}', [PriorityController::class, 'destroy']);
    Route::get('/statuses', [StatusController::class, 'index']);
    Route::post('/statuses', [StatusController::class, 'store']);
    Route::put('/statuses/{status}', [StatusController::class, 'update']);
    Route::patch('/statuses/{status}', [StatusController::class, 'update']);
    Route::delete('/statuses/{status}', [StatusController::class, 'destroy']);

    Route::get('/my-tickets', [TicketController::class, 'myTickets']);
    Route::post('/tickets', [TicketController::class, 'store']);
    Route::get('/tickets/{id}', [TicketController::class, 'show']);
    // Employee-safe asset details (used by employee AssetDetails.jsx)
    Route::get('/assets/{asset}', [\App\Http\Controllers\Api\EmployeeAssetController::class, 'show']);

    // Employee QR download
    // Use dedicated API controller to avoid any route/middleware mismatch.
    Route::get('/assets/{asset}/qr/download', [\App\Http\Controllers\Api\AssetQrController::class, 'downloadQr']);



    Route::put('/tickets/{id}', [TicketController::class, 'update']);
    Route::delete('/tickets/{id}', [TicketController::class, 'destroy']);

    Route::post('/tickets/{id}/comments', [TicketController::class, 'storeComment']);
    Route::post('/ai/suggest-ticket-fields', [AiTicketAssistController::class, 'suggestFields']);
    Route::post('/ai/chat', [AiTicketAssistController::class, 'chat']);
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
    Route::get('/manager/tickets/{ticketId}/attachments/{attachmentId}', [TicketController::class, 'downloadAttachment']);
    Route::get('/manager/tickets/{ticketId}/attachments/{attachmentId}/preview', [TicketController::class, 'previewAttachment']);

    Route::get('/tickets/{id}/attachments', [TicketController::class, 'getAttachments']);
    Route::get('/manager/tickets/pending', [TicketController::class, 'pendingForManager']);

    Route::get('/agent/tickets/{id}/comments', [TicketController::class, 'getComments']);
    Route::post('/agent/tickets/{id}/comments', [TicketController::class, 'storeComment']);
    Route::delete('/agent/tickets/{ticketId}/comments/{commentId}', [TicketController::class, 'deleteComment']);

    Route::get('/tickets/{id}/comments', [TicketController::class, 'getComments']);
    Route::post('/tickets/{id}/comments', [TicketController::class, 'storeComment']);
    Route::delete('/tickets/{ticketId}/comments/{commentId}', [TicketController::class, 'deleteComment']);

    Route::get('/tickets/{id}/assignment-history', [TicketController::class, 'assignmentHistory']);
    Route::get('/tickets/{id}/notifications', [TicketController::class, 'ticketNotifications']);
    Route::get('/tickets/{id}/activity-logs', [TicketController::class, 'ticketActivityLogs']);
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
    Route::patch ('/notifications/{id}/unread', [NotificationController::class, 'markUnread']);
    Route::delete('/notifications/{id}', [NotificationController::class, 'destroy']);


    Route::get('/tickets/{id}', [TicketController::class, 'showSingle']);
});


// ── Knowledge Base — all authenticated users can READ ────────────────────────
Route::middleware('auth:api')->prefix('kb')->group(function () {
    Route::get('/categories',          [KnowledgeBaseController::class, 'categories']);
    Route::get('/articles',            [KnowledgeBaseController::class, 'index']);
    Route::get('/articles/{id}',       [KnowledgeBaseController::class, 'show']);
    Route::post('/articles/{id}/helpful', [KnowledgeBaseController::class, 'helpful']);
});

// ── Knowledge Base — agents/managers/admins can CREATE ──────────────────────
Route::middleware(['auth:api', 'role:agent,manager,admin'])->prefix('kb')->group(function () {
    Route::post('/articles',               [KnowledgeBaseController::class, 'store']);
});

// ── Knowledge Base — admin only can APPROVE ──────────────────────────────────
Route::middleware(['auth:api', 'role:admin'])->prefix('kb')->group(function () {
    Route::patch('/articles/{id}/approve', [KnowledgeBaseController::class, 'approve']);
});
Route::middleware(['auth:api', 'role:manager,admin'])->prefix('report')->group(function () {
    // Summary stats for the reports page
    Route::get('/summary',    [ReportsController::class, 'summary']);
    // Monthly trend data
    Route::get('/monthly',    [ReportsController::class, 'monthly']);
    // Export as CSV (alternative server-side export)
    Route::get('/export/csv', [ReportsController::class, 'exportCsv']);
});
