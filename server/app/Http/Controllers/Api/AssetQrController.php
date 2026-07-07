<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Asset;
use Illuminate\Support\Facades\Log;

class AssetQrController extends Controller
{
    /**
     * GET /api/assets/{asset}/qr/download
     */
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
            'Content-Type' => 'image/png',
            'Content-Disposition' => 'attachment; filename="' . ($asset->asset_code ?? 'asset') . '-qr.png"',
        ]);
    }
}

