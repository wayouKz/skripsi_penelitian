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
        Schema::create('t_list_siswas', function (Blueprint $table) {
            $table->id();
            $table->string('nisn')->index();
            $table->foreign('nisn')->references('nisn')->on('m_siswas')->onDelete('cascade');
            $table->foreignId('kelas_id')->constrained('m_kelas')->onDelete('cascade');
            $table->foreignId('tahun_ajaran_id')->constrained('m_tahun_ajarans')->onDelete('cascade');
            $table->string('nama_siswa');
            $table->enum('status', ['siswa_aktif', 'alumni'])->default('siswa_aktif');
            // $table->enum('jenis_kelamin', ['Laki-laki', 'Perempuan']);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('t_list_siswas');
    }
};