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
    Schema::create('list_features', function (Blueprint $table) {
        $table->id();

        // relasi parent (untuk submenu)
        $table->foreignId('parent_id')->nullable()->constrained('list_features')->cascadeOnDelete();

        // info menu
        $table->string('label'); // Dashboard, Manajemen, dll
        $table->string('route')->nullable(); // route name (dashboard, users.index, dll)
        $table->string('icon')->nullable(); // fa-home, fa-user, dll
        $table->string('deskripsi')->nullable();

        // urutan tampil
        $table->integer('order')->default(0);

        // status aktif
        $table->boolean('is_active')->default(true);

        $table->timestamps();
    });
}
    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('list_features');
    }
};
