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
            $table->foreign('kode_jadwal')->references('kode_jadwal')->on('t_jadwals')->onDelete('cascade');

            $table->string('nip')->index();
            $table->foreign('nip')->references('nip')->on('m_gurus')->onDelete('cascade');

            $table->string('nip_pengganti')->index();
            $table->foreign('nip_pengganti')->references('nip')->on('m_gurus')->onDelete('cascade');

            $table->date('tanggal_pergantian');

            $table->text('alasan')->nullable();

            // Status alur penugasan
            $table->enum('status', [
                'menunggu',
                'diterima',
                'ditolak',
                'selesai'
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