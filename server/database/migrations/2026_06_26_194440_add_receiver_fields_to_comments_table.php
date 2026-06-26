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
    Schema::table('comments', function (Blueprint $table) {
        if (!Schema::hasColumn('comments', 'visibility')) {
            $table->enum('visibility', [
                'employee',
                'agent',
                'all',
                'internal'
            ])->default('all');
        }

        if (!Schema::hasColumn('comments', 'receiver_id')) {
            $table->unsignedBigInteger('receiver_id')
                ->nullable()
                ->after('user_id');

            $table->foreign('receiver_id')
                ->references('id')
                ->on('users')
                ->nullOnDelete();
        }
    });
}

public function down(): void
{
    Schema::table('comments', function (Blueprint $table) {
        if (Schema::hasColumn('comments', 'receiver_id')) {
            $table->dropForeign(['receiver_id']);
            $table->dropColumn('receiver_id');
        }

        if (Schema::hasColumn('comments', 'visibility')) {
            $table->dropColumn('visibility');
        }
    });
}
};

