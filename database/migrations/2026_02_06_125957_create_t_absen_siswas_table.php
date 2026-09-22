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
        Schema::create('t_absen_siswas', function (Blueprint $table) {
            $table->id();
            $table->string('kode_absen')->index();
            $table->string('kode_jadwal')->index();
            $table->string('nisn')->nullable()->index();
            $table->foreignId('siswa_id')->constrained('m_siswas')->onDelete('cascade');
            $table->integer('pertemuan')->nullable();
            $table->foreign('kode_jadwal')->references('kode_jadwal')->on('t_jadwals')->onDelete('cascade');
            $table->foreign('nisn')->references('nisn')->on('m_siswas')->onDelete('cascade');
            $table->foreignId('tahun_ajaran_id')->constrained('m_tahun_ajarans')->onDelete('cascade');
            $table->enum('status', ['hadir', 'izin', 'sakit', 'alpha'])->nullable();
            $table->string('keterangan')->nullable();
            $table->string('foto')->nullable();
            $table->dateTime('tanggal_absen');
            $table->time('waktu');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('t_absen_siswas');
    }
};