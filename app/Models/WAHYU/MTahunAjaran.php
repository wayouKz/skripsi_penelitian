<?php

namespace App\Models\WAHYU;

use Illuminate\Database\Eloquent\Model;

class MTahunAjaran extends Model
{
    protected $guarded = ['id'];

    public static function getTahunAjaranAktif(){
        $builder = MTahunAjaran::where('status', 'active');
        $data = $builder->first();
        return $data;
    }
}
