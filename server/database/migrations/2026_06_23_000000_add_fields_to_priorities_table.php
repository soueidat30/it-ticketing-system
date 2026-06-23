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
            $table->integer('level')->default(1);

            $table->string('color')
                ->default('#3b82f6');

            $table->string('bg_color')
                ->default('#eff6ff');

            $table->string('icon')
                ->default('ti-info-circle');

            $table->text('description')
                ->nullable();

            $table->integer('sla_response_minutes')
                ->default(240);

            $table->integer('sla_resolve_minutes')
                ->default(1440);

            $table->boolean('auto_escalate')
                ->default(false);

            $table->boolean('notify_manager')
                ->default(false);

            $table->boolean('is_active')
                ->default(true);

        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('priorities', function (Blueprint $table) {
            $table->dropColumn([
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
            ]);
        });
    }
};

