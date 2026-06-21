<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\ActivityLog;
use Illuminate\Http\Request;

class ActivityLogController extends Controller
{
    public function index(Request $request)
    {
        $query = ActivityLog::query()->orderByDesc('created_at');

        // Optional filters
        if ($request->filled('module')) {
            $query->where('module', $request->string('module')->toString());
        }

        if ($request->filled('severity')) {
            $query->where('severity', $request->string('severity')->toString());
        }

        if ($request->filled('search')) {
            $search = $request->string('search')->toString();
            $query->where(function ($q) use ($search) {
                $q->where('description', 'like', "%{$search}%")
                    ->orWhere('action', 'like', "%{$search}%")
                    ->orWhere('module', 'like', "%{$search}%")
                    ->orWhere('affected_ticket', 'like', "%{$search}%")
                    ->orWhereHas('user', function ($u) use ($search) {
                        $u->where('full_name', 'like', "%{$search}%");
                    });
            });
        }


        $hasSeverity = ActivityLog::query()->getModel()->getConnection()
            ->getSchemaBuilder()
            ->hasColumn((new ActivityLog())->getTable(), 'severity');

        $stats = [
            'total' => ActivityLog::count(),
            'info' => $hasSeverity ? ActivityLog::where('severity', 'info')->count() : 0,
            'warning' => $hasSeverity ? ActivityLog::where('severity', 'warning')->count() : 0,
            'danger' => $hasSeverity ? ActivityLog::where('severity', 'danger')->count() : 0,
        ];


        $logs = $query->with(['user', 'ticket'])->latest()->paginate(50);

        $logs->getCollection()->transform(function ($log) {
            return [
                'id' => $log->id,
                'actor' => $log->user?->full_name ?? 'System',
                'actorRole' => ucfirst($log->user?->role ?? 'System'),
                'action' => $log->action,
                'target' => $log->ticket?->ticket_number ?? 'System',
                'detail' => $log->description,
'module' => $log->module ?: 'Tickets',
                'severity' => $log->severity ?: 'info',
                'affected_ticket' => $log->affected_ticket ?: ($log->ticket?->ticket_number ? "Ticket #{$log->ticket->ticket_number}" : 'Unknown'),
                'time' => optional($log->created_at)->diffForHumans(),
                'date' => optional($log->created_at)->format('M d, Y h:i A'),
            ];
        });

        return response()->json([
            'stats' => $stats,
            'logs' => $logs->items(),
            'pagination' => [
                'current_page' => $logs->currentPage(),
                'last_page' => $logs->lastPage(),
                'total' => $logs->total(),
            ],
        ]);
    }
}


