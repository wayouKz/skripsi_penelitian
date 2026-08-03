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
        Schema::create('t_jadwals', function (Blueprint $table) {
            $table->id();
            $table->string('kode_jadwal')->unique();
            // $table->foreignId('t_list_guru_id')->constrained('t_list_gurus');
            $table->foreignId('t_list_guru_mapel_id')->constrained('t_list_guru_mapels');
            $table->foreignId('mapel_id')->constrained('m_mapels');
            $table->foreignId('kelas_id')->constrained('m_kelas');
            $table->string('hari');
            $table->time('jam_mulai');
            $table->time('jam_selesai');
            $table->foreignId('tahun_ajaran_id')->constrained('m_tahun_ajarans');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('t_jadwals');
    }
};
