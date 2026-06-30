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
            $table->string('nama_instansi');
            $table->string('logo_instansi');
            $table->string('alamat_instansi');
            $table->string('telepon_instansi')->nullable();
            $table->string('email_instansi')->nullable();
            $table->string('website_instansi')->nullable();
            $table->string('sampul_instansi')->nullable();
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
