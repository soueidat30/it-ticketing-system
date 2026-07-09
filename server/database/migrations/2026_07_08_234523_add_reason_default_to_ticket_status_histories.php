<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('ticket_status_histories', function (Blueprint $table) {
            // Make sure `reason` (used by some inserts) never breaks with NOT NULL/no default.
            if (Schema::hasColumn('ticket_status_histories', 'reason')) {
                $table->string('reason')->default('')->change();
            } else {
                $table->string('reason')->default('')->after('note');
            }
        });
    }

    public function down(): void
    {
        Schema::table('ticket_status_histories', function (Blueprint $table) {
            if (Schema::hasColumn('ticket_status_histories', 'reason')) {
                // Revert to no default (leaves column as-is; exact prior state not guaranteed).
                $table->string('reason')->default(null)->change();
            }
        });
    }
};

