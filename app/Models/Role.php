<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Role extends Model
{
    protected $table = 'roles';
    protected $guarded = ['id'];



    public static function GetRoleById($id)
    {
        return Role::where('id', $id)->first();
    }

    public function listFeatures()
    {
        return $this->belongsToMany(
            List_Feature::class,
            't_list_feature_by_roles',
            'role_id',          // foreign key di pivot untuk role
            'list_feature_id'   // foreign key di pivot untuk feature
        )->withTimestamps()->withPivot('order');
    }
}