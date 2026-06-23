<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Priority;
use Illuminate\Http\Request;

class PriorityManagementController extends Controller
{
    public function index()
    {
        $priorities = Priority::withCount('tickets')
            ->orderBy('level')
            ->get()
            ->map(function (Priority $priority) {
                return [
                    'id' => $priority->id,
                    'name' => $priority->priority_name,
                    'level' => $priority->level,
                    'color' => $priority->color,
                    'bgColor' => $priority->bg_color,
                    'icon' => $priority->icon,
                    'description' => $priority->description,
                    'slaResponse' => $priority->sla_response_minutes,
                    'slaResolve' => $priority->sla_resolve_minutes,
                    'autoEscalate' => $priority->auto_escalate,
                    'notifyManager' => $priority->notify_manager,
                    'active' => $priority->is_active,
                    'ticketCount' => $priority->tickets_count,
                ];
            });

        return response()->json($priorities);

    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'priority_name' => 'required|string|max:255|unique:priorities,priority_name',
            'level' => 'required|integer|min:1',
            'color' => 'required|string',
            'bg_color' => 'required|string',
            'icon' => 'required|string',
            'description' => 'nullable|string',
            'sla_response_minutes' => 'required|integer|min:1',
            'sla_resolve_minutes' => 'required|integer|min:1',
            'auto_escalate' => 'boolean',
            'notify_manager' => 'boolean',
            'is_active' => 'boolean',
        ]);

        $priority = Priority::create($validated);

        return response()->json([
            'message' => 'Priority created successfully',
            'priority' => $priority
        ], 201);
    }

    public function update(Request $request, Priority $priority)
    {
        $validated = $request->validate([
            'priority_name' => 'required|string|max:255|unique:priorities,priority_name,' . $priority->id,
            'level' => 'required|integer|min:1',
            'color' => 'required|string',
            'bg_color' => 'required|string',
            'icon' => 'required|string',
            'description' => 'nullable|string',
            'sla_response_minutes' => 'required|integer|min:1',
            'sla_resolve_minutes' => 'required|integer|min:1',
            'auto_escalate' => 'boolean',
            'notify_manager' => 'boolean',
            'is_active' => 'boolean',
        ]);

        $priority->update($validated);

        return response()->json([
            'message' => 'Priority updated successfully',
            'priority' => $priority
        ]);
    }

    public function destroy(Priority $priority)
    {
        if ($priority->tickets()->count() > 0) {
            return response()->json([
                'message' => 'Cannot delete priority that is used by tickets.'
            ], 422);
        }

        $priority->delete();

        return response()->json([
            'message' => 'Priority deleted successfully'
        ]);
    }

    public function toggleStatus(Priority $priority)
    {
        $priority->update([
            'is_active' => !$priority->is_active
        ]);

        return response()->json([
            'message' => 'Status updated',
            'priority' => $priority
        ]);
    }

    public function reorder(Request $request)
    {
        $request->validate([
            'priorities' => 'required|array'
        ]);

        foreach ($request->priorities as $item) {
            Priority::where('id', $item['id'])
                ->update([
                    'level' => $item['level']
                ]);
        }

        return response()->json([
            'message' => 'Priority order updated successfully'
        ]);
    }
}
