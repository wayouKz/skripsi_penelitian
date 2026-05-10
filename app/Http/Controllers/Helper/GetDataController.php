<?php

namespace App\Http\Controllers\Helper;

use Illuminate\Http\Request;
use App\Http\Controllers\Controller;
use App\Models\List_Feature;
use App\Models\TListFeatureByRole;
use Illuminate\Support\Facades\Auth;

class GetDataController extends Controller
{
    public function getListFeatureByRole(Request $request){
        $data = TListFeatureByRole::GetFeatureByName($request->q, Auth::user()->role_id)->get();

        if($data->isEmpty()){
            $json = ["data" => $data, "success" => false];
        }else{
            $json = ["data" => $data, "success" => true];
        }
        return $response = response()->json($json);
    }

    public function getListFeature(Request $request){
        $data = List_Feature::where('parent_id' ,'!=' ,'null')->orderBy('order', 'asc')->get();

        if($data->isEmpty()){
            $json = ["data" => $data, "success" => false];
        }else{
            $json = ["data" => $data, "success" => true];
        }
        return $response = response()->json($json);
    }
}