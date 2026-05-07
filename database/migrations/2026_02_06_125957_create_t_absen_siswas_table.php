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
            $table->string('kode_absen')->index()->unique();
            $table->string('kode_jadwal')->index();
            $table->string('nisn')->index();
            $table->foreign('kode_jadwal')->references('kode_jadwal')->on('t_jadwals');
            $table->foreign('nisn')->references('nisn')->on('m_siswas');
            $table->foreignId('tahun_ajaran_id')->constrained('m_tahun_ajarans');
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
