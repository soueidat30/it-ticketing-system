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
    Schema::table('users', function (Blueprint $table) {

        $table->string('full_name')->after('id');
        $table->string('username')->unique()->after('full_name');
        $table->string('department')->nullable();
        $table->string('status')->default('Active');

        $table->dropColumn('name');
        $table->dropColumn('email_verified_at');
        $table->dropColumn('remember_token');
    });
}

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        //
    }
};
