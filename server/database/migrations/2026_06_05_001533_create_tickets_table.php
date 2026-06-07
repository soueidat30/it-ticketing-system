<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('tickets', function (Blueprint $table) {
            $table->id();
            $table->string('ticket_number')->unique();
            $table->string('title');
            $table->text('description');

            $table->foreignId('user_id')->constrained()->onDelete('cascade');   // requester
            $table->foreignId('assigned_to')->nullable()                        // ← ADDED
                  ->constrained('users')->nullOnDelete();
            $table->foreignId('category_id')->constrained();
            $table->foreignId('priority_id')->constrained();
            $table->foreignId('status_id')->constrained();

            $table->timestamps();
            $table->timestamp('resolved_at')->nullable();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('tickets');
    }
};
