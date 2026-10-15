<?php

namespace App\Models\WAHYU;

use Illuminate\Database\Eloquent\Model;

class MSiswa extends Model
{
    protected $guarded = ['id'];

    public function getSiswa(){
        $this->where('status', 'active');
        return $this->get();
    }
}
