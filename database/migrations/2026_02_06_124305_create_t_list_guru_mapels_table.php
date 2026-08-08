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
    Schema::create('t_list_guru_mapels', function (Blueprint $table) {
        $table->id();
        $table->string('nip')->index();
        $table->foreign('nip')->references('nip')->on('m_gurus')->onDelete('cascade');

        // MENGGUNAKAN ID DARI T_LIST_GURUS SEBAGAI PENGHUBUNG UTAMA
        $table->foreignId('t_list_guru_id')->constrained('t_list_gurus')->onDelete('cascade');

        $table->foreignId('mapel_id')->constrained('m_mapels')->onDelete('cascade');
        $table->integer('beban_jam');
        $table->timestamps();
    });
}

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('t_list_guru_mapels');
    }
};