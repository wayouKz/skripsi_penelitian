<?php

namespace App\Models\WAHYU;

use Illuminate\Database\Eloquent\Model;

class TListGuruMapel extends Model
{
    protected $guarded = ['id'];

    public function GuruMapel()
    {
        return $this->belongsTo(MGuru::class, 'nip', 'nip');
    }
}
