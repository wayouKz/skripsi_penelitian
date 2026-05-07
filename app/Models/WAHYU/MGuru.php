<?php

namespace App\Models\WAHYU;

use Illuminate\Database\Eloquent\Model;

class MGuru extends Model
{
    protected $guarded = ['id'];
    protected function casts(): array {
    return     [
            'nama_guru' => 'string',
            'jenis_kelamin' => 'string',
            'tempat_lahir' => 'string',
            'alamat' => 'string',
            'no_telp' => 'string',
            'nip' => 'integer',
            'status' => 'string'
        ];
    }

    public static function GetAllGuru()
    {
        return MGuru::query();
    }

    public static function GetGuruByNip($nip)
    {
        return MGuru::where('nip', $nip)->first();
    }


}