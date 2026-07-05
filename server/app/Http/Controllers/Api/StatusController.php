<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Status;
use App\Models\Ticket;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class StatusController extends Controller
{
    public function index()
    {
        return response()->json(Status::withCount(['tickets', 'histories'])->get());
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'status_name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'color' => 'nullable|string|max:32',
            'sort_order' => 'nullable|integer',
            'is_active' => 'nullable|boolean',
        ]);

        $status = Status::create([
            'status_name' => $validated['status_name'],
            'description' => $validated['description'] ?? null,
            'color' => $validated['color'] ?? null,
            'sort_order' => $validated['sort_order'] ?? 1,
            'is_active' => $validated['is_active'] ?? true,
        ]);

        return response()->json(['data' => $status], 201);
    }

    public function update(Request $request, Status $status)
    {
        $validated = $request->validate([
            'status_name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'color' => 'nullable|string|max:32',
            'sort_order' => 'nullable|integer',
            'is_active' => 'nullable|boolean',
        ]);

        $status->update([
            'status_name' => $validated['status_name'],
            'description' => $validated['description'] ?? $status->description,
            'color' => $validated['color'] ?? $status->color,
            'sort_order' => $validated['sort_order'] ?? $status->sort_order,
            'is_active' => $validated['is_active'] ?? $status->is_active,
        ]);

        return response()->json(['data' => $status]);
    }

    public function destroy(Status $status)
    {
        $ticketCount = Ticket::where('status_id', $status->id)->count();
        $historyCount = DB::table('ticket_status_histories')
            ->where('status_id', $status->id)
            ->count();

        if ($ticketCount > 0 || $historyCount > 0) {
            return response()->json([
                'message' => 'Cannot delete status while it is referenced by tickets or ticket history.',
                'ticket_references' => $ticketCount,
                'history_references' => $historyCount,
            ], 409);
        }

        $status->delete();

        return response()->json(['message' => 'Status deleted']);
    }
}
