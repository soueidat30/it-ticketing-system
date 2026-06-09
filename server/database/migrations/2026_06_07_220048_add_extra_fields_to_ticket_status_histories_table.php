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
        Schema::table('ticket_status_histories', function (Blueprint $table) {
            $table->string('reason')->after('changed_by');
            $table->boolean('notify_user')->default(false)->after('note');
            $table->boolean('notify_manager')->default(false)->after('notify_user');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('ticket_status_histories', function (Blueprint $table) {
            $table->dropColumn(['notify_manager', 'notify_user', 'note', 'reason']);
        });
    }
};
