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
        Schema::create('configs', function (Blueprint $table) {
            $table->id();
            $table->string('nama_instansi')->nullable();
            $table->string('logo_instansi')->nullable();
            $table->string('alamat_instansi')->nullable();
            $table->string('telepon_instansi')->nullable();
            $table->string('email_instansi')->nullable();
            $table->string('website_instansi')->nullable();
            $table->string('sampul_instansi')->nullable();
            $table->foreignId('kepala_sekolah_id')->nullable()->constrained('m_gurus')->onDelete('set null');
            $table->json('card_img')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('configs');
    }
};
