<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Asset;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Schema;
use Illuminate\Validation\Rule;
use SimpleSoftwareIO\QrCode\Facades\QrCode;

class AssetController extends Controller
{
    public function index()
    {
        $assets = Asset::with(['employee', 'creator'])
            ->latest()
            ->get();

        return response()->json([
            'assets' => $assets->map(fn ($asset) => $this->transformAsset($asset)),
        ]);
    }

    public function show(Asset $asset)
    {
        $assetData = $this->transformAsset($asset->load(['employee', 'tickets', 'creator']));

        $assignmentHistory = DB::table('asset_assignments')
            ->leftJoin('users as assigned_user', 'asset_assignments.user_id', '=', 'assigned_user.id')
            ->where('asset_assignments.asset_id', $asset->id)
            ->orderByDesc('asset_assignments.assigned_at')
            ->select([
                'asset_assignments.id',
                'asset_assignments.assigned_at',
                'asset_assignments.returned_at',
                'asset_assignments.user_id',
                'assigned_user.full_name as assigned_to_name',
                'assigned_user.username as assigned_to_username',
            ])
            ->get()
            ->map(function ($r) {
                return [
                    'id' => $r->id,
                    'assigned_at' => $r->assigned_at,
                    'returned_at' => $r->returned_at,
                    'assigned_to' => (int) $r->user_id,
                    'assigned_to_name' => $r->assigned_to_name ?? $r->assigned_to_username,
                    'status' => empty($r->returned_at) ? 'Assigned' : 'Returned',
                ];
            });

        return response()->json([
            'asset' => $assetData,
            'history' => $assignmentHistory,
            'tickets' => $asset->tickets->map(fn ($t) => [
                'id'            => $t->id,
                'ticket_number' => $t->ticket_number,
                'title'         => $t->title,
                'status'        => $t->status,
            ]),
        ]);
    }

    public function store(Request $request)
    {
        try {
            $validated = $request->validate([
                'name'             => 'required|string|max:255',
                'asset_tag'        => 'required|string|max:255|unique:assets,asset_code',
                'type'             => ['required', Rule::in([
                    'laptop','desktop','monitor','printer','scanner',
                    'mobile_phone','tablet','server','network_device','other'
                ])],
                'brand'            => 'nullable|string|max:255',
                'model'            => 'nullable|string|max:255',
                'serial_number'    => 'nullable|string|max:255',
                'condition'        => 'nullable|string|max:50',
                'status'           => ['nullable', Rule::in([
                    'unassigned','assigned','in_repair','lost','retired','disposed'
                ])],

                'location'         => 'nullable|string|max:255',
                'department'       => 'nullable|string|max:255',
                'assigned_to'      => 'nullable|integer|exists:users,id',
                'purchase_date'    => 'nullable|date',
                'purchase_price'   => 'nullable|numeric|min:0',
                'warranty_expiry'  => 'nullable|date',
                'notes'            => 'nullable|string',
                'qr_code_value'    => 'nullable|string|max:500',
            ]);

            $payload = $validated;
            $assetType = $this->normalizeAssetType($payload['type'] ?? null);
            $assignedTo = $payload['assigned_to'] ?? null;
            $rawStatus = $payload['status'] ?? null;

            if ($assignedTo) {

                $status = 'assigned';
                $assignedAt = now();
            } else {
                $status = $this->normalizeStatus($rawStatus, null);
                $assignedAt = null;
            }


            $asset = Asset::create([
                'asset_code'     => $payload['asset_tag'],
                'asset_name'     => $payload['name'],
                'asset_type'     => $assetType,
                'serial_number'  => $payload['serial_number'] ?? null,
                'manufacturer'   => $payload['brand'] ?? null,
                'model'          => $payload['model'] ?? null,
                'purchase_date'  => $payload['purchase_date'] ?? null,
                'warranty_expiry'=> $payload['warranty_expiry'] ?? null,
                'assigned_to'    => $assignedTo,
                'created_by'     => $request->user()?->id,
                'assigned_at'    => $assignedAt,
                'status'         => $status,
            ]);

            try {
                $url = url('/admin/assets/' . $asset->id);
                $qrDir = storage_path('app/public/qrcodes');
                $qrFile = 'qrcodes/asset-' . $asset->id . '.png';
                $qrPath = $qrDir . '/asset-' . $asset->id . '.png';

                if (!is_dir($qrDir)) {

                    mkdir($qrDir, 0755, true);
                }

                if (class_exists(\SimpleSoftwareIO\QrCode\Facades\QrCode::class)) {
                    QrCode::format('png')->size(300)->generate($url, $qrPath);
                } else {
                    $imageContent = @file_get_contents(
                        'https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=' . urlencode($url)
                    );
                    if ($imageContent !== false) {
                        file_put_contents($qrPath, $imageContent);
                    }
                }

                $qrUpdate = [
                    'qr_code_path' => $qrFile,
                ];

                if (Schema::hasColumn('assets', 'qr_code_value')) {
                    $qrUpdate['qr_code_value'] = $payload['qr_code_value'] ?? $url;
                }

                $asset->update($qrUpdate);
            } catch (\Throwable $qrError) {
                Log::warning("QR generation failed for asset {$asset->id}: " . $qrError->getMessage());
            }

            return response()->json([
                'asset'   => $this->transformAsset($asset->fresh()),
                'message' => 'Asset created successfully.',
            ], 201);

        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'message' => 'Validation failed',
                'errors'  => $e->errors(),
            ], 422);
        } catch (\Throwable $e) {
            Log::error("Asset store failed: " . $e->getMessage(), [
                'request' => $request->all(),
                'trace'   => $e->getTraceAsString(),
            ]);
            return response()->json([
                'message' => 'Server error: ' . $e->getMessage(),
            ], 500);
        }
    }

    public function update(Request $request, Asset $asset)
    {
        try {
            $validated = $request->validate([
                'name'             => 'sometimes|required|string|max:255',
                'asset_tag'        => [
                    'sometimes', 'required', 'string', 'max:255',
                    Rule::unique('assets', 'asset_code')->ignore($asset->id),
                ],
                'type'             => ['sometimes', 'required', Rule::in([
                    'laptop','desktop','monitor','printer','scanner',
                    'mobile_phone','tablet','server','network_device','other'
                ])],
                'brand'            => 'nullable|string|max:255',
                'model'            => 'nullable|string|max:255',
                'serial_number'    => 'nullable|string|max:255',
                'status'           => ['nullable', Rule::in([
                    'unassigned','in_repair','lost','retired','disposed','assigned'
                ])],
                'assigned_to'      => 'nullable|integer|exists:users,id',
                'purchase_date'    => 'nullable|date',
                'purchase_price'   => 'nullable|numeric|min:0',
                'warranty_expiry'  => 'nullable|date',
                'notes'            => 'nullable|string',
                'qr_code_value'    => 'nullable|string|max:500',
                'department'       => 'nullable|string|max:255',
                'location'         => 'nullable|string|max:255',
            ]);

            $payload = $validated;
            $assignedTo = array_key_exists('assigned_to', $payload)
                ? $payload['assigned_to']
                : $asset->assigned_to;


            if ($assignedTo) {
                $status = 'assigned';
                $assignedAt = $asset->assigned_at ?? now();
            } else {
                $status = $this->normalizeStatus($payload['status'] ?? $asset->status, null);
                $assignedAt = null;
            }

            $update = [
                'asset_code'      => $payload['asset_tag'] ?? $asset->asset_code,
                'asset_name'      => $payload['name'] ?? $asset->asset_name,
                'asset_type'      => $this->normalizeAssetType($payload['type'] ?? $asset->asset_type),
                'serial_number'   => $payload['serial_number'] ?? $asset->serial_number,
                'manufacturer'    => $payload['brand'] ?? $asset->manufacturer,
                'model'           => $payload['model'] ?? $asset->model,
                'purchase_date'   => $payload['purchase_date'] ?? $asset->purchase_date,
                'warranty_expiry' => $payload['warranty_expiry'] ?? $asset->warranty_expiry,
                'assigned_to'     => $assignedTo,
                'assigned_at'     => $assignedAt,
                'status'          => $status,

                'location'         => array_key_exists('location', $payload) ? $payload['location'] : $asset->location,
                'department'       => array_key_exists('department', $payload) ? $payload['department'] : $asset->department,

                'notes'            => array_key_exists('notes', $payload) ? $payload['notes'] : $asset->notes,
            ];

            if (Schema::hasColumn('assets', 'qr_code_value')) {
                $update['qr_code_value'] = $payload['qr_code_value'] ?? $asset->qr_code_value;
            }

            $asset->update($update);

            return response()->json([
                'asset'   => $this->transformAsset($asset->fresh()->load(['employee', 'creator'])),
                'message' => 'Asset updated successfully.',
            ]);


        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'message' => 'Validation failed',
                'errors'  => $e->errors(),
            ], 422);
        } catch (\Throwable $e) {
            Log::error("Asset update failed: " . $e->getMessage(), [
                'asset_id' => $asset->id,
                'request'  => $request->all(),
            ]);
            return response()->json([
                'message' => 'Server error: ' . $e->getMessage(),
            ], 500);
        }
    }

    public function destroy(Asset $asset)
    {
        try {
            if ($asset->qr_code_path) {
                $qrPath = storage_path('app/public/' . $asset->qr_code_path);
                if (file_exists($qrPath)) {
                    @unlink($qrPath);
                }
            }

            $asset->delete();
            return response()->json(['message' => 'Asset deleted.']);
        } catch (\Throwable $e) {
            Log::error("Asset delete failed: " . $e->getMessage());
            return response()->json(['message' => 'Server error'], 500);
        }
    }

    public function assign(Request $request, Asset $asset)
    {
        $payload = $request->validate([
            'user_id' => ['nullable', 'exists:users,id'],
        ]);

        $assignedTo = $payload['user_id'] ?? null;
        $now = now();

        if ($assignedTo) {
            $openAssignment = DB::table('asset_assignments')
                ->where('asset_id', $asset->id)
                ->whereNull('returned_at')
                ->orderByDesc('assigned_at')
                ->first();

            if ($openAssignment) {
                DB::table('asset_assignments')
                    ->where('id', $openAssignment->id)
                    ->update([
                        'returned_at' => $now,
                        'updated_at'  => $now,
                    ]);
            }

            DB::table('asset_assignments')->insert([
                'asset_id'    => $asset->id,
                'user_id'     => $assignedTo,
                'assigned_at' => $now,
                'returned_at' => null,
                'created_at'  => $now,
                'updated_at'  => $now,
            ]);

            $asset->update([
                'assigned_to' => $assignedTo,
                'status'      => 'assigned',
                'assigned_at' => $asset->assigned_at ?? $now,
            ]);
        } else {
            $openAssignment = DB::table('asset_assignments')
                ->where('asset_id', $asset->id)
                ->whereNull('returned_at')
                ->orderByDesc('assigned_at')
                ->first();

            if ($openAssignment) {
                DB::table('asset_assignments')
                    ->where('id', $openAssignment->id)
                    ->update([
                        'returned_at' => $now,
                        'updated_at'  => $now,
                    ]);
            }

            $asset->update([
                'assigned_to' => null,
                'status'      => 'unassigned',
                'assigned_at' => null,
            ]);
        }

        return response()->json([
            'asset' => $this->transformAsset($asset->fresh()),
        ]);
    }

    public function downloadQr(Asset $asset)
    {
        $qrCodePath = $asset->qr_code_path;
        $candidates = [];
        if ($qrCodePath) {
            $candidates[] = storage_path('app/public/' . $qrCodePath);
            $candidates[] = storage_path('app/public/qrcodes/' . basename($qrCodePath));
            $candidates[] = storage_path('app/public/qrcodes/asset-' . $asset->id . '.png');
        } else {
            $candidates[] = storage_path('app/public/qrcodes/asset-' . $asset->id . '.png');
        }

        $foundPath = null;
        foreach ($candidates as $p) {
            if ($p && file_exists($p)) {
                $foundPath = $p;
                break;
            }
        }

        if (!$foundPath) {
            return response()->json([
                'message' => 'QR code file not found for this asset. Try regenerating it.',
            ], 404);
        }

        return response()->file($foundPath, [
            'Content-Type'        => 'image/png',
            'Content-Disposition' => 'attachment; filename="' . ($asset->asset_code ?? 'asset') . '-qr.png"',
        ]);
    }

    public function regenerateQr(Asset $asset)
    {
        try {
            $url     = url('/admin/assets/' . $asset->id);
            $qrDir   = storage_path('app/public/qrcodes');
            $qrFile  = 'qrcodes/asset-' . $asset->id . '.png';
            $qrPath  = $qrDir . '/asset-' . $asset->id . '.png';

            if (!is_dir($qrDir)) {
                mkdir($qrDir, 0755, true);
            }

            if (class_exists(\SimpleSoftwareIO\QrCode\Facades\QrCode::class)) {
                QrCode::format('png')->size(300)->generate($url, $qrPath);
            } else {
                $imageContent = @file_get_contents(
                    'https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=' . urlencode($url)
                );
                if ($imageContent !== false) {
                    file_put_contents($qrPath, $imageContent);
                }
            }

            $qrUpdate = [
                'qr_code_path' => $qrFile,
            ];

            if (Schema::hasColumn('assets', 'qr_code_value')) {
                $qrUpdate['qr_code_value'] = $asset->qr_code_value ?? $url;
            }

            $asset->update($qrUpdate);

            return response()->json([
                'message'       => 'QR code regenerated successfully.',
                'qr_code_path'  => $qrFile,
                'qr_code_value' => $asset->qr_code_value,
                'asset'         => $this->transformAsset($asset->fresh()),
            ]);
        } catch (\Throwable $e) {
            Log::error("QR regen failed: " . $e->getMessage());
            return response()->json(['message' => 'QR regeneration failed: ' . $e->getMessage()], 500);
        }
    }

    private function transformAsset(Asset $asset): array
    {
        $status = $this->formatStatus($asset);

        $createdByName = null;
        if ($asset->relationLoaded('creator') && $asset->creator) {
            $createdByName = $asset->creator->full_name ?? $asset->creator->username;
        }

        return [
            'id' => $asset->id,

            'asset_name' => $asset->asset_name,
            'name'       => $asset->asset_name,

            'asset_tag'  => $asset->asset_code,
            'asset_code' => $asset->asset_code,

            'type'       => $asset->asset_type ?? 'other',
            'asset_type' => $asset->asset_type ?? 'other',

            'brand'        => $asset->manufacturer,
            'manufacturer' => $asset->manufacturer,

            'model'         => $asset->model,
            'serial_number' => $asset->serial_number,

            'status'    => $status,
            'condition' => 'Good',

            // Location/department can be either stored on assets or derived.
            'location'   => $asset->location ?? ($asset->employee?->location ?? ''),
            'department' => $asset->department ?? ($asset->employee?->department ?? ''),

            // Assignment
            'assigned_to'   => $asset->assigned_to,
            'assigned_at'   => $asset->assigned_at,
            'assigned_user' => $asset->employee ? [
                'id'        => $asset->employee->id,
                'name'      => $asset->employee->full_name ?? $asset->employee->name,
                'full_name' => $asset->employee->full_name ?? $asset->employee->name,
            ] : null,

            'purchase_date'   => $asset->purchase_date,
            'purchase_price'  => null,
            'warranty_expiry' => $asset->warranty_expiry,

            'qr_code_path'  => $asset->qr_code_path,
            'qr_code_url'   => $asset->qr_code_path ? asset('storage/' . $asset->qr_code_path) : null,
            'qr_code_value' => $asset->qr_code_value,

'notes' => $asset->notes ?? '',

            'created_by'      => $asset->created_by,
            'created_by_name' => $createdByName,
            'created_at'      => $asset->created_at,
            'updated_at'      => $asset->updated_at,
        ];
    }

    private function normalizeStatus(?string $status, ?int $assignedTo = null): string
    {
        $value = strtolower(trim((string) $status));

        if (in_array($value, ['unassigned', 'available', 'inactive', 'none', 'null', ''], true)) {
            return 'unassigned';
        }

        if (in_array($value, ['in repair', 'maintenance', 'repair', 'in_repair'], true)) {
            return 'in_repair';
        }

        if ($value === 'lost')     return 'lost';
        if ($value === 'retired')  return 'retired';
        if ($value === 'disposed') return 'disposed';

        return 'unassigned';
    }

    private function normalizeAssetType(?string $type): ?string
    {
        $value = strtolower(trim((string) $type));

        $allowedTypes = [
            'laptop', 'desktop', 'monitor', 'printer', 'scanner',
            'mobile_phone', 'tablet', 'server', 'network_device', 'other',
        ];

        return in_array($value, $allowedTypes, true) ? $value : 'other';
    }

    private function formatStatus(Asset $asset): string
    {
        $status = strtolower((string) $asset->status);

        if ($status === 'in_repair') return 'In Repair';
        if ($status === 'lost')      return 'Lost';
        if ($status === 'retired')   return 'Retired';
        if ($status === 'disposed')  return 'Disposed';

        return $asset->assigned_to ? 'Assigned' : 'Unassigned';
    }
}
