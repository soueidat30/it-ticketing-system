<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('kb_articles', function (Blueprint $table) {
            if (!Schema::hasColumn('kb_articles', 'views')) {
                $table->unsignedInteger('views')->default(0)->after('content');
            }

            if (!Schema::hasColumn('kb_articles', 'helpful_yes')) {
                $table->unsignedInteger('helpful_yes')->default(0)->after('views');
            }

            if (!Schema::hasColumn('kb_articles', 'helpful_no')) {
                $table->unsignedInteger('helpful_no')->default(0)->after('helpful_yes');
            }

            if (!Schema::hasColumn('kb_articles', 'approved_by')) {
                $table->foreignId('approved_by')->nullable()->after('helpful_no');
            }

            if (!Schema::hasColumn('kb_articles', 'approved_at')) {
                $table->timestamp('approved_at')->nullable()->after('approved_by');
            }
        });
    }

    public function down(): void
    {
        Schema::table('kb_articles', function (Blueprint $table) {
            if (Schema::hasColumn('kb_articles', 'approved_at')) {
                $table->dropColumn('approved_at');
            }
            if (Schema::hasColumn('kb_articles', 'approved_by')) {
                // drop FK constraint if present
                try {
                    $table->dropForeign(['approved_by']);
                } catch (\Throwable $e) {
                    // ignore
                }
                $table->dropColumn('approved_by');
            }
            if (Schema::hasColumn('kb_articles', 'helpful_no')) {
                $table->dropColumn('helpful_no');
            }
            if (Schema::hasColumn('kb_articles', 'helpful_yes')) {
                $table->dropColumn('helpful_yes');
            }
            if (Schema::hasColumn('kb_articles', 'views')) {
                $table->dropColumn('views');
            }
        });
    }
};

