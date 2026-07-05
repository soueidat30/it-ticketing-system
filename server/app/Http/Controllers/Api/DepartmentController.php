<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class DepartmentController extends Controller
{
    /**
     * This project represents departments as values stored in `users.department`.
     */

    public function index()
    {
        $departments = User::query()
            ->select('department')
            ->whereNotNull('department')
            ->where('department', '!=', '')
            ->distinct()
            ->orderBy('department')
            ->pluck('department')
            ->values();

        $result = $departments->map(function ($d) {
            $manager = User::query()
                ->where('department', $d)
                ->whereHas('role', function ($q) {
                    $q->where('name', 'manager');
                })
                ->first();

            return [
                'name' => $d,
                'manager_id' => $manager?->id,
                'manager' => $manager,
            ];
        });

        return response()->json($result);
    }

    /**
     * Support: GET /api/departments/{department}
     */
    public function show($department)
    {
        $department = (string) $department;

        $found = User::query()
            ->whereNotNull('department')
            ->where('department', '!=', '')
            ->where('department', $department)
            ->exists();

        if (! $found) {
            return response()->json(['message' => 'Department not found'], 404);
        }

        return response()->json(['name' => $department]);
    }

    /**
     * Support: POST /api/departments
     * Creates a department by assigning all users that match the desired name?
     * Since UI doesn’t provide user list here, we only create the department name
     * (by validating it) and return it.
     */
    public function store(Request $request)
    {
        $departmentName = trim((string) $request->input('department_name', ''));
        $managerId = $request->input('manager_id', null);

        if ($departmentName === '') {
            return response()->json(['message' => 'department_name is required'], 422);
        }

        // No dedicated departments table; departments appear once users have a department value.
        // If a manager_id was provided, assign that user to this department so the
        // UI can show them as the manager.
        $manager = null;

        if ($managerId) {
            $manager = User::find($managerId);
            if ($manager) {
                $manager->department = $departmentName;
                $manager->save();
            }
        }

        return response()->json(['data' => ['department_name' => $departmentName, 'manager_id' => $managerId, 'manager' => $manager]], 201);
    }

    /**
     * Support: PUT/PATCH /api/departments/{department}
     * Since there is no departments table, we interpret update as renaming the value
     * across users.
     */
    public function update(Request $request, $department)
    {
        $oldName = (string) $department;
        $newName = trim((string) $request->input('department_name', ''));
        $managerId = $request->input('manager_id', null);

        if ($newName === '') {
            return response()->json(['message' => 'department_name is required'], 422);
        }

        $updated = User::query()->where('department', $oldName)->update([
            'department' => $newName,
        ]);

        if ($updated === 0) {
            return response()->json(['message' => 'Department not found'], 404);
        }

        // If a manager_id was provided, ensure that user is assigned to this department
        // so the frontend can display them as the manager. We return manager info
        // in the response so the client can update its local state immediately.
        $manager = null;

        if ($managerId) {
            $manager = User::find($managerId);
            if ($manager) {
                $manager->department = $newName;
                $manager->save();
            }
        }

        return response()->json(['data' => ['name' => $newName, 'manager_id' => $managerId, 'manager' => $manager]]);
    }

    /**
     * Support: DELETE /api/departments/{department}
     * Interpreted as clearing `users.department` where it matches.
     */
    public function destroy($department)
    {
        $name = (string) $department;

        $affected = User::query()->where('department', $name)->update([
            'department' => null,
        ]);

        if ($affected === 0) {
            return response()->json(['message' => 'Department not found'], 404);
        }

        return response()->json(['message' => 'Department deleted']);
    }
}



