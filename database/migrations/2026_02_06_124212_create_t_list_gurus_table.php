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
    Schema::create('t_list_gurus', function (Blueprint $table) {
        $table->id();
            $table->string('nip')->index()->nullable();
        $table->foreignId('guru_id')->constrained('m_gurus')->onDelete('cascade');
        // $table->foreign('nip')->references('nip')->on('m_gurus')->onDelete('cascade');
        $table->foreignId('kelas_id')->constrained('m_kelas');
        $table->foreignId('tahun_ajaran_id')->constrained('m_tahun_ajarans')->onDelete('cascade');
        $table->timestamps();
    });
}

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('t_list_gurus');
    }
};