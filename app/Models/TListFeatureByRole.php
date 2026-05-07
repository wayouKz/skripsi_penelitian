<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class TListFeatureByRole extends Model
{
    protected $guarded = ['id'];

    public static function getFeatureByName($key, $role_id)
{
    return List_Feature::with('roles')
        ->whereHas('roles', function ($query) use ($role_id) {
            $query->where('role_id', $role_id);
        })
        ->where('label', 'like', '%' . $key . '%')
        ;
}
}