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
            $table->foreignId('jurusan_id')->nullable()->constrained('m_jurusans')->onDelete('cascade');
            $table->string('nama_kelas');
            $table->enum('status', ['active', 'nonactive'])->default('active');
            $table->foreignId('id_wali_kelas')
            ->nullable()
            ->constrained('m_gurus')
            ->onDelete('cascade')
            ->onUpdate('cascade');
            // $table->foreignId('tahun_ajaran_id')->constrained('m_tahun_ajarans')->onDelete('cascade')->onUpdate('cascade');
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
