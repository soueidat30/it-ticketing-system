<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Notification;
use Illuminate\Http\Request;

class NotificationController extends Controller
{
    /**
     * GET /api/notifications (user-scoped)
     */
    public function index(Request $request)
    {
        $userId = $request->user()->id;

        try {
            if (!\Illuminate\Support\Facades\Schema::hasTable('notifications')) {
                return response()->json([]);
            }

            return response()->json(
                Notification::with(['ticket', 'triggeredBy'])
                    ->where('user_id', $userId)
                    ->orderByDesc('created_at')
                    ->get()
            );
        } catch (\Throwable $e) {
            return response()->json([
                'message' => 'Failed to load notifications',
                'debug' => [
                    'error' => class_basename($e),
                    'detail' => $e->getMessage(),
                ],
            ], 500);
        }
    }

    /**
     * GET /api/notifications/unread-count
     */
    public function unreadCount(Request $request)
    {
        $count = Notification::where('user_id', $request->user()->id)
            ->where('is_read', false)
            ->count();

        return response()->json(['count' => $count]);
    }

    /**
     * PATCH /api/notifications/{id}/read
     */
    public function markRead(Request $request, $id)
    {
        $notification = Notification::where('id', $id)
            ->where('user_id', $request->user()->id)
            ->firstOrFail();

        $notification->update([
            'is_read' => true,
            'read_at' => now(),
        ]);

        return response()->json(['message' => 'Marked as read']);
    }

    /**
     * PATCH /api/notifications/read-all
     */
    public function markAllRead(Request $request)
    {
        Notification::where('user_id', $request->user()->id)
            ->where('is_read', false)
            ->update(['is_read' => true, 'read_at' => now()]);

        return response()->json(['message' => 'All marked as read']);
    }

    /**
     * DELETE /api/notifications/{id}
     */
    public function destroy(Request $request, $id)
    {
        Notification::where('id', $id)
            ->where('user_id', $request->user()->id)
            ->firstOrFail()
            ->delete();

        return response()->json(['message' => 'Notification deleted']);
    }

    /**
     * GET /api/admin/notifications (admin-scoped: returns everything)
     */
    public function adminIndex(Request $request)
    {
        try {
            if (!\Illuminate\Support\Facades\Schema::hasTable('notifications')) {
                return response()->json([]);
            }

            return response()->json(
                Notification::with(['ticket', 'triggeredBy'])
                    ->orderByDesc('created_at')
                    ->get()
            );
        } catch (\Throwable $e) {
            return response()->json([
                'message' => 'Failed to load admin notifications',
                'debug' => [
                    'error' => class_basename($e),
                    'detail' => $e->getMessage(),
                ],
            ], 500);
        }
    }

    /**
     * GET /api/notifications/{id}/unread (user-scoped)
     */
    public function markUnread(Request $request, $id)
    {
        $notification = Notification::where('id', $id)
            ->where('user_id', $request->user()->id)
            ->firstOrFail();

        $notification->update([
            'is_read' => false,
            'read_at' => null,
        ]);

        return response()->json(['message' => 'Marked as unread']);
    }

    /**
     * PATCH /api/admin/notifications/{id}/read (admin-scoped)
     */
    public function adminMarkRead(Request $request, $id)
    {
        $notification = Notification::where('id', $id)->firstOrFail();

        $notification->update([
            'is_read' => true,
            'read_at' => now(),
        ]);

        return response()->json(['message' => 'Marked as read']);
    }

    /**
     * PATCH /api/admin/notifications/{id}/unread (admin-scoped)
     */
    public function adminMarkUnread(Request $request, $id)
    {
        $notification = Notification::where('id', $id)->firstOrFail();

        $notification->update([
            'is_read' => false,
            'read_at' => null,
        ]);

        return response()->json(['message' => 'Marked as unread']);
    }

    /**
     * DELETE /api/admin/notifications/{id} (admin-scoped)
     */
    public function adminDestroy(Request $request, $id)
    {
        Notification::where('id', $id)->firstOrFail()->delete();

        return response()->json(['message' => 'Notification deleted']);
    }



    /**
     * Static helper — call from other controllers to create notifications.
     */
    public static function notify(
        int $user_id,
        int $ticket_id,
        ?int $triggered_by,
        string $type,
        string $title,
        string $message
    ): Notification {
        return Notification::create([
            'user_id' => $user_id,
            'ticket_id' => $ticket_id,
            'triggered_by' => $triggered_by,
            'type' => $type,
            'title' => $title,
            'message' => $message,
            'is_read' => false,
        ]);
    }
}

