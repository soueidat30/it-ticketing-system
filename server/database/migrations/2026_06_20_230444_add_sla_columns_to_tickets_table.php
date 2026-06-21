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
        Schema::table('tickets', function (Blueprint $table) {

            $table->timestamp('response_due_at')->nullable();

            $table->timestamp('resolution_due_at')->nullable();

            $table->timestamp('first_response_at')->nullable();

            $table->boolean('response_breached')
                ->default(false);

            $table->boolean('resolution_breached')
                ->default(false);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('tickets', function (Blueprint $table) {
            //
        });
    }
};
