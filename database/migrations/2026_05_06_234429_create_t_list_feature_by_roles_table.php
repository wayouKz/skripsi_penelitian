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
    Schema::create('t_list_feature_by_roles', function (Blueprint $table) {
        $table->id();

        $table->foreignId('list_feature_id')
            ->constrained('list_features')
            ->cascadeOnDelete();

        $table->foreignId('role_id')
            ->constrained('roles')
            ->cascadeOnDelete();

        $table->boolean('can_view')->default(false);
        $table->boolean('can_create')->default(false);
        $table->boolean('can_update')->default(false);
        $table->boolean('can_delete')->default(false);

        $table->integer('order')->default(0);

        $table->timestamps();

        $table->unique(['list_feature_id', 'role_id']);
    });
}
    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('t_list_feature_by_roles');
    }
};