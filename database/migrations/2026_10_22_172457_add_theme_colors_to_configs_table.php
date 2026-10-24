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
    Schema::table('configs', function (Blueprint $table) {
        $table->string('warna_primary')->nullable()->after('card_img');      // "16 185 129"
        $table->string('warna_primary_dark')->nullable();
        $table->string('warna_primary_light')->nullable();
        $table->string('warna_hex')->nullable();                            // "#10b981" (opsional, untuk preview)
        $table->string('nama_tema')->nullable();                            // "Emerald", "Biru", dll
    });
}

public function down(): void
{
    Schema::table('configs', function (Blueprint $table) {
        $table->dropColumn([
            'warna_primary',
            'warna_primary_dark',
            'warna_primary_light',
            'warna_hex',
            'nama_tema',
        ]);
    });
}
};