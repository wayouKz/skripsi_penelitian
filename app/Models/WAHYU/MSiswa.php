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

    public static function getSiswaActive(){
        $builder = MSiswa::select('m_siswas.*');
        $builder->join('t_list_siswas','m_siswas.id' , '=', 't_list_siswas.siswa_id');
        // $builder->where('t_list_siswas.status','siswa_aktif');
        $data = $builder->get();
        return $data;
    }
}
