<?php

namespace App\Models\WAHYU;

use Illuminate\Database\Eloquent\Model;

class MKelas extends Model
{
    protected $guarded = ['id'];

    public function waliKelas(){
        return $this->belongsTo(MGuru::class,'id_wali_kelas','id');
    }

    public function kelasSiswa(){
        return $this->hasMany(TListSiswa::class,'kelas_id','id');
    }
}
