<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;

class UserController extends Controller
{
    /**
     * GET /api/users?role=agent
     * Simple helper for role-based dropdowns.
     */
    public function index(Request $request)
    {
        $role = $request->query('role');

        $query = User::query()->with('role');

        if ($role) {
            // Robust matching for dropdowns:
            // - match by roles.name
            // - OR match by users.role_id resolved from roles.name
            // (Also handle cases where frontend passes role as different casing.)

            $trimmed = trim((string) $role);
            $normalized = strtolower($trimmed);
            $roleId = is_numeric($trimmed) ? (int) $trimmed : null;

            $resolvedRoleIds = null;
            if (!is_numeric($trimmed)) {
                $resolvedRoleIds = \DB::table('roles')
                    ->whereRaw('LOWER(name) = ?', [$normalized])
                    ->pluck('id')
                    ->toArray();

                if (empty($resolvedRoleIds)) {
                    $resolvedRoleIds = null;
                }
            }

            $query->where(function ($q) use ($normalized, $roleId, $resolvedRoleIds) {
                // match by role name
                $q->whereHas('role', function ($qr) use ($normalized) {
                    $qr->whereRaw('LOWER(name) = ?', [$normalized]);
                });

                // OR match by explicit role_id passed in
                if (!is_null($roleId)) {
                    $q->orWhere('role_id', $roleId);
                }

                // OR match by role_id(s) resolved from role name
                if (!is_null($resolvedRoleIds)) {
                    $q->orWhereIn('role_id', $resolvedRoleIds);
                }
            });
        }

        $users = $query->orderBy('full_name')->get();

        return response()->json(
            $users->map(fn ($u) => [
                'id' => $u->id,
                'full_name' => $u->full_name,
                'username' => $u->username,
                'department' => $u->department,
                'role' => $u->role?->name,
                'role_id' => $u->role_id,
            ])
        );
    }

    /**
     * GET /api/users/{user}
     * Used by admin “Manage assignments” screens.
     */
    public function show(int $user)
    {
        $u = User::query()
            ->with('role')
            ->findOrFail($user);

        return response()->json([
            'id' => $u->id,
            'full_name' => $u->full_name,
            'username' => $u->username,
            'email' => $u->email ?? null,
            'department' => $u->department,
            'role' => $u->role?->name,
            'role_id' => $u->role_id,
            'status' => $u->status ?? null,
        ]);
    }

    /**
     * PATCH/PUT /api/users/{user}
     * UI sends: { department_id: number|null }
     * In this project `users` stores `department` as a string.
     */
    public function updateDepartment(Request $request, int $user)
    {
        $payload = $request->only(['department_id']);

        $departmentId = $payload['department_id'] ?? null;

        $departmentValue = null;
        if ($departmentId !== null && $departmentId !== '') {
            // Departments endpoint returns names, not ids.
            // If the frontend sends an id, ignore and let it remain null.
            // If it sends a department name, accept it.
            $departmentValue = is_numeric($departmentId) ? null : (string) $departmentId;
        }

        // If your frontend actually sends a department *name* in `department_id`, this will work.
        // Otherwise, you should update the frontend to send department name.

        $u = User::query()->findOrFail($user);
        $u->department = $departmentValue;
        $u->save();

        $u->load('role');

        return response()->json([
            'data' => [
                'id' => $u->id,
                'department' => $u->department,
                'role' => $u->role?->name,
                'role_id' => $u->role_id,
            ],
        ]);
    }
}



