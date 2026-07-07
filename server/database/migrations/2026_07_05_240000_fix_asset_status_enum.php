<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasTable('assets')) {
            return;
        }

        if (!Schema::hasColumn('assets', 'status')) {
            return;
        }

        Schema::table('assets', function (Blueprint $table) {
            $table->enum('status', [
                'unassigned',
                'assigned',
                'in_repair',
                'lost',
                'retired',
                'disposed',
            ])->default('unassigned')->change();
        });
    }

    public function down(): void
    {

        if (!Schema::hasTable('assets') || !Schema::hasColumn('assets', 'status')) {
            return;
        }

        Schema::table('assets', function (Blueprint $table) {
            $table->enum('status', [
                'unassigned',
                'assigned',
                'in_repair',
                'lost',
                'retired',
                'disposed',
            ])->default('unassigned')->change();
        });
    }
};

