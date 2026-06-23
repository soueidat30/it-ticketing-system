<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Priority;

class PriorityController extends Controller
{
    public function index()
    {
        return response()->json(
            Priority::withCount('tickets')
                ->orderBy('level')
                ->get()
        );
    }

    public function store(\Illuminate\Http\Request $request)
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

        $priority = Priority::create([
            ...$validated,
        ]);

        return response()->json([
            'message' => 'Priority created successfully',
            'priority' => $priority,
        ], 201);
    }

    public function update(\Illuminate\Http\Request $request, Priority $priority)
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
            'priority' => $priority,
        ]);
    }

    public function toggleStatus(Priority $priority)
    {
        $priority->update([
            'is_active' => !$priority->is_active,
        ]);

        return response()->json([
            'message' => 'Status updated',
            'is_active' => $priority->is_active,
        ]);
    }

    public function reorder(\Illuminate\Http\Request $request)
    {
        $validated = $request->validate([
            'priorities' => 'required|array',
        ]);

        foreach ($validated['priorities'] as $item) {
            if (!isset($item['id'], $item['level'])) {
                continue;
            }

            Priority::where('id', $item['id'])
                ->update([
                    'level' => $item['level'],
                ]);
        }

        return response()->json([
            'message' => 'Priority order updated successfully',
        ]);
    }

    public function destroy(Priority $priority)
    {
        if ($priority->tickets()->exists()) {
            return response()->json([
                'message' => 'Cannot delete priority because tickets are using it.',
            ], 422);
        }

        $priority->delete();

        return response()->json([
            'message' => 'Priority deleted successfully',
        ]);
    }
}



