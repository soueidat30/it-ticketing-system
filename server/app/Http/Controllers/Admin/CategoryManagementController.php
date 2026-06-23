<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Category;
use Illuminate\Http\Request;

class CategoryManagementController extends Controller
{
    public function index(Request $request)
    {
        $query = Category::withCount('tickets');

        if ($request->filled('search')) {
            $search = $request->search;

            $query->where(function ($q) use ($search) {
                $q->where('category_name', 'like', "%{$search}%")
                    ->orWhere('description', 'like', "%{$search}%");
            });
        }

        $categories = $query
            ->orderBy('category_name')
            ->get();

        return response()->json(
            $categories->map(function (Category $category) {
                return [
                    'id' => $category->id,
                    'name' => $category->category_name,
                    'description' => $category->description,
                    'icon' => $category->icon,
                    'color' => $category->color,
                    'tickets' => (int) ($category->tickets_count ?? 0),
                    'active' => (bool) $category->is_active,
                ];
            })
        );
    }


    public function store(Request $request)
    {
        $validated = $request->validate([
            'category_name' => 'required|string|max:255|unique:categories,category_name',
            'description' => 'nullable|string',
            'icon' => 'required|string',
            'color' => 'required|string',
        ]);

        $category = Category::create([
            'category_name' => $validated['category_name'],
            'description' => $validated['description'] ?? null,
            'icon' => $validated['icon'],
            'color' => $validated['color'],
            'is_active' => true,
        ]);

        return response()->json([
            'message' => 'Category created successfully',
            'category' => [
                'id' => $category->id,
                'name' => $category->category_name,
                'description' => $category->description,
                'icon' => $category->icon,
                'color' => $category->color,
                'tickets' => 0,
                'active' => (bool) $category->is_active,
            ],
        ], 201);
    }


    public function update(Request $request, Category $category)
    {
        $validated = $request->validate([
            'category_name' => 'required|string|max:255|unique:categories,category_name,' . $category->id,
            'description' => 'nullable|string',
            'icon' => 'required|string',
            'color' => 'required|string',
        ]);

        $category->update([
            'category_name' => $validated['category_name'],
            'description'   => $validated['description'] ?? null,
            'icon'           => $validated['icon'],
            'color'          => $validated['color'],
        ]);

        return response()->json([
            'message' => 'Category updated successfully',
            'category' => [
                'id' => $category->id,
                'name' => $category->category_name,
                'description' => $category->description,
                'icon' => $category->icon,
                'color' => $category->color,
                'tickets' => 0, 
                'active' => (bool) $category->is_active,
            ],
        ]);
    }

    public function toggleStatus(Category $category)
    {
        $category->update([
            'is_active' => !$category->is_active,
        ]);

        return response()->json([
            'message' => 'Status updated',
            'active' => (bool) $category->is_active,
        ]);
    }


    public function destroy(Category $category)
    {
        if ($category->tickets()->exists()) {
            return response()->json([
                'message' => 'Cannot delete category with assigned tickets.',
            ], 422);
        }

        $category->delete();

        return response()->json([
            'message' => 'Category deleted successfully.',
        ]);
    }

}

