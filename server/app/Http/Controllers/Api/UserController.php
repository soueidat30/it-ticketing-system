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
}

