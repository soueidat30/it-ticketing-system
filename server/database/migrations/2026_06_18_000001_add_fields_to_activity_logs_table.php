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
        Schema::table('activity_logs', function (Blueprint $table) {
            if (!Schema::hasColumn('activity_logs', 'module')) {
                $table->string('module')->nullable();
            }

            if (!Schema::hasColumn('activity_logs', 'severity')) {
                $table->string('severity')->nullable();
            }

            if (!Schema::hasColumn('activity_logs', 'affected_ticket')) {
                $table->string('affected_ticket')->nullable();
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('activity_logs', function (Blueprint $table) {
            if (Schema::hasColumn('activity_logs', 'module')) {
                $table->dropColumn('module');
            }

            if (Schema::hasColumn('activity_logs', 'severity')) {
                $table->dropColumn('severity');
            }

            if (Schema::hasColumn('activity_logs', 'affected_ticket')) {
                $table->dropColumn('affected_ticket');
            }
        });
    }
};

