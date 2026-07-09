<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasTable('tickets')) {
            return;
        }

        if (!Schema::hasColumn('tickets', 'client_email')) {
            Schema::table('tickets', function (Blueprint $table) {
                $table->string('client_email')->after('user_id')->nullable();
            });
        }

        if (!Schema::hasColumn('tickets', 'client_closed_email_sent_at')) {
            Schema::table('tickets', function (Blueprint $table) {
                $table->timestamp('client_closed_email_sent_at')->nullable()->after('resolved_at');
            });
        }
    }

    public function down(): void
    {
        if (!Schema::hasTable('tickets')) {
            return;
        }

        if (Schema::hasColumn('tickets', 'client_email')) {
            Schema::table('tickets', function (Blueprint $table) {
                $table->dropColumn('client_email');
            });
        }

        if (Schema::hasColumn('tickets', 'client_closed_email_sent_at')) {
            Schema::table('tickets', function (Blueprint $table) {
                $table->dropColumn('client_closed_email_sent_at');
            });
        }
    }
};

