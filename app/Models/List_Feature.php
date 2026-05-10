<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class List_Feature extends Model
{
    protected $guarded = ['id'];
    protected $table = 'list_features';

      public function roles()
    {
        return $this->belongsToMany(
            Role::class,
            't_list_feature_by_roles',
            'list_feature_id',
            'role_id'
        );
    }

}
