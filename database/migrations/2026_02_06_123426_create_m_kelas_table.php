<?php

use Illuminate\Support\Facades\Schema;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Database\Migrations\Migration;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('m_kelas', function (Blueprint $table) {
            $table->id();
            $table->string('nama_kelas');
            $table->enum('status', ['active', 'nonactive'])->default('active');
            $table->integer('tingkat');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('m_kelas');
    }
};
