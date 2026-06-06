<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Priority;

class PriorityController extends Controller
{
    public function index()
    {
        return response()->json(Priority::all());
    }
}