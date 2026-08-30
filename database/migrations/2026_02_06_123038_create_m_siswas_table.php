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
        Schema::create('m_siswas', function (Blueprint $table) {
            $table->id();
            $table->string('nisn')->nullable()->index();
            $table->string('nama_siswa');
            $table->enum('jenis_kelamin', ['Laki-laki', 'Perempuan']);
            $table->string('tempat_lahir');
            $table->date('tanggal_lahir');
            $table->string('agama')->nullable();
            $table->string('alamat');
            $table->string('no_telp')->nullable();
            $table->string('no_telp_orang_tua')->nullable();
            $table->string('foto')->nullable();
            $table->enum('status', ['active', 'nonactive'])->default('active');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('m_siswas');
    }
};