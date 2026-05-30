<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            // nullable() prevents MySQL error when existing rows have no role yet.
            // After seeding roles you can remove nullable and re-run if needed.
            $table->foreignId('role_id')
                  ->nullable()
                  ->default(null)
                  ->constrained('roles')
                  ->onDelete('restrict');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropForeign(['role_id']);
            $table->dropColumn('role_id');
        });
    }
};
