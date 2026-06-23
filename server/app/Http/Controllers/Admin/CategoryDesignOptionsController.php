<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\CategoryDesignOption;

class CategoryDesignOptionsController extends Controller
{
    public function index()
    {
        $options = CategoryDesignOption::query()
            ->orderBy('icon')
            ->orderBy('color')
            ->get(['icon', 'color']);

        return response()->json([
            'icons' => $options->pluck('icon')->unique()->values(),
            'colors' => $options->pluck('color')->unique()->values(),
        ]);
    }
}

