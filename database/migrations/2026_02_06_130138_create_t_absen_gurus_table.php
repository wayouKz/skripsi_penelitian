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
        Schema::create('t_absen_gurus', function (Blueprint $table) {
            $table->id();
            $table->string('kode_absen')->index();
            $table->string('kode_jadwal')->index();
            $table->string('nip')->index();
            $table->foreign('kode_absen')->references('kode_absen')->on('t_absen_siswas');
            $table->foreign('kode_jadwal')->references('kode_jadwal')->on('t_jadwals');
            $table->foreign('nip')->references('nip')->on('m_gurus');
            $table->dateTime('waktu_absen');
            $table->time('waktu');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('t_absen_gurus');
    }
};
