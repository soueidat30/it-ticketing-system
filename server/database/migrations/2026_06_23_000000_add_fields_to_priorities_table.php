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
        Schema::table('priorities', function (Blueprint $table) {
            if (!Schema::hasColumn('priorities', 'level')) {
                $table->integer('level')->default(1);
            }

            if (!Schema::hasColumn('priorities', 'color')) {
                $table->string('color')
                    ->default('#3b82f6');
            }

            if (!Schema::hasColumn('priorities', 'bg_color')) {
                $table->string('bg_color')
                    ->default('#eff6ff');
            }

            if (!Schema::hasColumn('priorities', 'icon')) {
                $table->string('icon')
                    ->default('ti-info-circle');
            }

            if (!Schema::hasColumn('priorities', 'description')) {
                $table->text('description')
                    ->nullable();
            }

            if (!Schema::hasColumn('priorities', 'sla_response_minutes')) {
                $table->integer('sla_response_minutes')
                    ->default(240);
            }

            if (!Schema::hasColumn('priorities', 'sla_resolve_minutes')) {
                $table->integer('sla_resolve_minutes')
                    ->default(1440);
            }

            if (!Schema::hasColumn('priorities', 'auto_escalate')) {
                $table->boolean('auto_escalate')
                    ->default(false);
            }

            if (!Schema::hasColumn('priorities', 'notify_manager')) {
                $table->boolean('notify_manager')
                    ->default(false);
            }

            if (!Schema::hasColumn('priorities', 'is_active')) {
                $table->boolean('is_active')
                    ->default(true);
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('priorities', function (Blueprint $table) {
            $columns = [
                'level',
                'color',
                'bg_color',
                'icon',
                'description',
                'sla_response_minutes',
                'sla_resolve_minutes',
                'auto_escalate',
                'notify_manager',
                'is_active',
            ];

            // Only drop columns that exist to avoid rollback failures.
            $columnsToDrop = array_values(array_filter($columns, function ($col) {
                return Schema::hasColumn('priorities', $col);
            }));

            if (!empty($columnsToDrop)) {
                $table->dropColumn($columnsToDrop);
            }
        });
    }
};


