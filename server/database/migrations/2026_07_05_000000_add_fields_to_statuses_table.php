<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('statuses', function (Blueprint $table) {
            if (! Schema::hasColumn('statuses', 'description')) {
                $table->text('description')->nullable()->after('status_name');
            }

            if (! Schema::hasColumn('statuses', 'color')) {
                $table->string('color', 32)->nullable()->after('description');
            }

            if (! Schema::hasColumn('statuses', 'sort_order')) {
                $table->integer('sort_order')->default(1)->after('color');
            }

            if (! Schema::hasColumn('statuses', 'is_active')) {
                $table->boolean('is_active')->default(true)->after('sort_order');
            }
        });
    }

    public function down(): void
    {
        Schema::table('statuses', function (Blueprint $table) {
            if (Schema::hasColumn('statuses', 'is_active')) {
                $table->dropColumn('is_active');
            }

            if (Schema::hasColumn('statuses', 'sort_order')) {
                $table->dropColumn('sort_order');
            }

            if (Schema::hasColumn('statuses', 'color')) {
                $table->dropColumn('color');
            }

            if (Schema::hasColumn('statuses', 'description')) {
                $table->dropColumn('description');
            }
        });
    }
};
