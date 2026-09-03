<?php


namespace App\Models;

use App\Models\WAHYU\MGuru;
use Illuminate\Database\Eloquent\Model;

class Config extends Model
{
    protected $guarded = ['id'];

    public function kepalaSekolah()
    {
        return $this->belongsTo(MGuru::class, 'kepala_sekolah_id');
    }
}
