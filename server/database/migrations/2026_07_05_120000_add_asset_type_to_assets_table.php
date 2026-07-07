<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('assets', function (Blueprint $table) {
            if (!Schema::hasColumn('assets', 'asset_type')) {
                $table->enum('asset_type', [
                    'laptop',
                    'desktop',
                    'monitor',
                    'printer',
                    'scanner',
                    'mobile_phone',
                    'tablet',
                    'server',
                    'network_device',
                    'other',
                ])->nullable();
            }
        });
    }

    public function down(): void
    {
        Schema::table('assets', function (Blueprint $table) {
            if (Schema::hasColumn('assets', 'asset_type')) {
                $table->dropColumn('asset_type');
            }
        });
    }
};

