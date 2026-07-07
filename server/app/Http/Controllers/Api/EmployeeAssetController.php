<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Asset;
use Illuminate\Http\Request;

class EmployeeAssetController extends Controller
{
    /**
     * GET /api/my-assets
     * Returns assets assigned to the authenticated employee.
     *
     * Employee-safe endpoint so employee users don't need to call admin-only `/api/admin/assets`.
     */
    public function index(Request $request)
    {
        $user = $request->user();


        // Prefer assigned_to (assets.assigned_to points to users.id)
        $assets = Asset::query()
            ->with(['employee', 'creator'])
            ->where('assigned_to', $user->id)
            ->orWhere(function ($q) use ($user) {
                $q->whereNotNull('assigned_to')
                  ->where('assigned_to', $user->id);
            })
            ->latest()
            ->get();


        $assets = $assets->map(function (Asset $a) {
            return [
                'id' => $a->id,

                'asset_name' => $a->asset_name,
                'asset_code' => $a->asset_code,
                'asset_tag' => $a->asset_code,
                'asset_type' => $a->asset_type ?? 'other',
                'manufacturer' => $a->manufacturer,
                'brand' => $a->manufacturer,
                'model' => $a->model,
                'serial_number' => $a->serial_number,

                'location' => $a->location ?? ($a->employee?->location ?? null),
                'department' => $a->department ?? ($a->employee?->department ?? null),

                'status' => $a->status,
                'assigned_to' => $a->assigned_to,
                'assigned_at' => $a->assigned_at,

                'assigned_user' => $a->employee ? [
                    'id' => $a->employee->id,
                    'name' => $a->employee->full_name ?? $a->employee->name,
                    'full_name' => $a->employee->full_name ?? $a->employee->name,
                ] : null,

                'warranty_expiry' => $a->warranty_expiry,
                'purchase_date' => $a->purchase_date,

                'qr_code_path' => $a->qr_code_path,
                'qr_code_url' => $a->qr_code_path ? asset('storage/' . $a->qr_code_path) : null,
                'qr_code_value' => $a->qr_code_value,

                'notes' => $a->notes ?? null,
                'created_at' => $a->created_at,
                'updated_at' => $a->updated_at,

                'assignment_history' => [],
            ];
        });

        return response()->json([
            'assets' => $assets,
        ]);
    }

    public function show(Request $request, Asset $asset)
    {
        $user = $request->user();

        if ((int) $asset->assigned_to !== (int) $user->id) {
            return response()->json([
                'message' => 'You do not have access to view this asset.',
            ], 403);
        }

        $asset->load(['employee', 'creator', 'tickets']);

        $assignmentHistory = [];

        $tickets = $asset->tickets ? $asset->tickets->map(function ($t) {
            return [
                'id' => $t->id,
                'ticket_number' => $t->ticket_number ?? null,
                'title' => $t->title ?? null,
                'priority' => $t->priority ? $t->priority->priority_name ?? $t->priority : ($t->priority_name ?? null),
                'status' => $t->status ? [
                    'status_name' => $t->status->status_name ?? ($t->status->name ?? $t->status),
                ] : ($t->status_name ?? null),
                'created_at' => $t->created_at,
            ];
        })->values()->all() : [];

        return response()->json([
            'data' => [
                'id' => $asset->id,
                'asset_name' => $asset->asset_name,
                'name' => $asset->asset_name,
                'asset_tag' => $asset->asset_code,
                'asset_code' => $asset->asset_code,

                'type' => $asset->asset_type ?? 'other',
                'asset_type' => $asset->asset_type ?? 'other',

                'manufacturer' => $asset->manufacturer,
                'brand' => $asset->manufacturer,
                'model' => $asset->model,
                'serial_number' => $asset->serial_number,

                'status' => $asset->status,
                'condition' => 'Good',

                'location' => $asset->location ?? ($asset->employee?->location ?? null),
                'department' => $asset->department ?? ($asset->employee?->department ?? null),

                'assigned_to' => $asset->assigned_to,
                'assigned_at' => $asset->assigned_at,
                'assigned_user' => $asset->employee ? [
                    'id' => $asset->employee->id,
                    'name' => $asset->employee->full_name ?? $asset->employee->name,
                    'full_name' => $asset->employee->full_name ?? $asset->employee->name,
                ] : null,

                'purchase_date' => $asset->purchase_date,
                'warranty_expiry' => $asset->warranty_expiry,

                'qr_code_path' => $asset->qr_code_path,
                'qr_code_url' => $asset->qr_code_path ? asset('storage/' . $asset->qr_code_path) : null,
                'qr_code_value' => $asset->qr_code_value,

                'notes' => $asset->notes ?? null,

                'assignment_history' => $assignmentHistory,
                'tickets' => $tickets,
            ],
        ]);
    }
}



