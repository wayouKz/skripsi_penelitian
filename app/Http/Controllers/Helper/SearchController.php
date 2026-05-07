<?php

namespace App\Http\Controllers\Helper;

use Illuminate\Http\Request;
use App\Models\List_Feature;
use App\Http\Controllers\Controller;
use App\Models\TListFeatureByRole;
use Illuminate\Support\Facades\Auth;

class SearchController extends Controller
{
    public function getListFeatur(Request $request){
        $data = TListFeatureByRole::GetFeatureByName($request->q, Auth::user()->role_id)->get();

        if($data->isEmpty()){
            $json = ["data" => $data, "success" => false];
        }else{
            $json = ["data" => $data, "success" => true];
        }
        return $response = response()->json($json);
    }
}