<?php

namespace App\Models\WAHYU;

use Illuminate\Database\Eloquent\Model;

class MMapel extends Model
{
    protected $guarded = ['id'];

    public function guruMapel()
    {
        return $this->hasMany(TListGuruMapel::class, 'mapel_id', 'id');
    }
}