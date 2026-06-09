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
        Schema::create('ticket_resolutions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('ticket_id')
                ->constrained()
                ->onDelete('cascade');
            $table->foreignId('resolved_by')
                ->constrained('users');
            $table->string('resolution_type');
            $table->text('solution');
            $table->text('root_cause')->nullable();
            $table->integer('time_spent')->nullable();
            $table->string('time_unit')->nullable();
            $table->text('internal_notes')->nullable();
            $table->tinyInteger('rating')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('ticket_resolutions');
    }
};
