<?php

namespace App\Models\WAHYU;

use Illuminate\Database\Eloquent\Model;

class MGuru extends Model
{
    protected $guarded = ['id'];

    public static function GetAllGuru()
    {
        return MGuru::query();
    }

    public static function GetGuruByNip($nip)
    {
        return MGuru::where('nip', $nip)->first();
    }

    public function kelas()
    {
        return $this->hasOne(MKelas::class, 'id_wali_kelas', 'id');
    }

}
