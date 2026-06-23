<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('category_design_options', function (Blueprint $table) {
            $table->id();

            // Example values: "ti-cpu", "#3b82f6"
            $table->string('icon')->index();
            $table->string('color')->index();

            $table->timestamps();

            $table->unique(['icon', 'color']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('category_design_options');
    }
};

