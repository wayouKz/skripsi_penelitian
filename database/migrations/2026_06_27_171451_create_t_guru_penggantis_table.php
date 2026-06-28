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
        Schema::create('t_guru_penggantis', function (Blueprint $table) {
            $table->id();
            $table->string('kode_jadwal')->index();
            $table->foreign('kode_jadwal')->references('kode_jadwal')->on('t_jadwals');

            $table->string('nip')->index();
            $table->foreign('nip')->references('nip')->on('m_gurus');

            $table->string('nip_pengganti')->index();
            $table->foreign('nip_pengganti')->references('nip')->on('m_gurus');

            $table->date('tanggal_pergantian');

            $table->text('alasan')->nullable();

            // Status alur penugasan
            $table->enum('status', [
                'menunggu', // Menunggu konfirmasi dari guru pengganti
                'diterima', // Guru pengganti bersedia mengajar
                'ditolak',  // Guru pengganti menolak/tidak bisa
                'selesai'   // Sesi kelas pengganti sudah selesai dilaksanakan
            ])->default('menunggu');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('t_guru_penggantis');
    }
};