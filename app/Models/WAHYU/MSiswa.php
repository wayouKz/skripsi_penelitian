<?php

namespace App\Models\WAHYU;

use Illuminate\Database\Eloquent\Model;

class MSiswa extends Model
{
    protected $guarded = ['id'];

    public static function getSiswa(){
        $builder = MSiswa::where('status', 'active');
        $data = $builder->get();
        return $data;
    }
}
