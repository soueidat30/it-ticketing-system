<?php
 
namespace App\Http\Controllers\Api;
 
use App\Http\Controllers\Controller;
use App\Models\Notification;
use Illuminate\Http\Request;
 
class NotificationController extends Controller
{
    /**
     * GET /api/notifications
     */
    public function index(Request $request)
    {
        $notifications = Notification::with(['ticket', 'triggeredBy'])
            ->where('user_id', $request->user()->id)
            ->orderByDesc('created_at')
            ->get();
 
        return response()->json($notifications);
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
            'user_id'      => $user_id,
            'ticket_id'    => $ticket_id,
            'triggered_by' => $triggered_by,
            'type'         => $type,
            'title'        => $title,
            'message'      => $message,
            'is_read'      => false,
        ]);
    }
}