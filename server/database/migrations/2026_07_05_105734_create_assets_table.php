<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('assets', function (Blueprint $table) {
            $table->id();

            $table->string('asset_code')->unique();

            $table->string('asset_name');

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
                'other'
            ])->nullable();

            $table->string('serial_number')
                ->nullable();

            $table->string('manufacturer')
                ->nullable();

            $table->string('model')
                ->nullable();

            $table->date('purchase_date')
                ->nullable();

            $table->date('warranty_expiry')
                ->nullable();

            $table->foreignId('assigned_to')
                ->nullable()
                ->constrained('users')
                ->nullOnDelete();

            $table->foreignId('created_by')
                ->nullable()
                ->constrained('users')
                ->nullOnDelete();

            $table->timestamp('assigned_at')
                ->nullable();

            $table->enum('status', [
                'unassigned',
                'assigned',
                'in_repair',
                'lost',
                'retired',
                'disposed'
            ])->default('unassigned');

            $table->string('qr_code_path')
                ->nullable();

            $table->string('qr_code_value')
                ->nullable();

            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('assets');
    }
};
