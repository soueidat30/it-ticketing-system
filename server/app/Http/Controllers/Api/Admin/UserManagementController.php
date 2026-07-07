<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Role;
use App\Models\User;
use Illuminate\Http\Request;


class UserManagementController extends Controller
{

    public function index(Request $request)
    {
        $query = User::query()->with(['role']);

        if ($request->filled('search')) {
            $search = $request->string('search')->toString();
            $query->where(function ($q) use ($search) {
                $q->where('full_name', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%")
                    ->orWhere('username', 'like', "%{$search}%");
            });
        }

        if ($request->filled('department')) {
            $query->where('department', $request->string('department')->toString());
        }

        if ($request->filled('status')) {
            $query->where('status', $request->string('status')->toString());
        }

        if ($request->filled('role_id')) {
            $query->where('role_id', $request->integer('role_id'));
        } elseif ($request->filled('role')) {
            $roleName = trim((string) $request->input('role'));
            $normalized = strtolower($roleName);

            $roleIds = Role::query()
                ->whereRaw('LOWER(name) = ?', [$normalized])
                ->pluck('id')
                ->toArray();

            if (!empty($roleIds)) {
                $query->whereIn('role_id', $roleIds);
            } else {
                $query->whereRaw('1 = 0');
            }
        }

        $perPage = (int) $request->integer('per_page', 50);
        $perPage = $perPage > 0 ? min($perPage, 200) : 50;

        $users = $query
            ->orderBy('full_name')
            ->paginate($perPage);

        $data = $users->through(function (User $u) {
            return [
                'id' => $u->id,
                'name' => $u->full_name,
                'email' => $u->email,
                'dept' => $u->department,
                'role' => $u->role?->name,
                'status' => $u->status,
                'joined' => optional($u->created_at)->format('M d, Y'),
                'tickets' => $u->tickets()->count(),
            ];
        });

        return response()->json([
            'users' => $data,
            'pagination' => [
                'current_page' => $users->currentPage(),
                'last_page' => $users->lastPage(),
                'total' => $users->total(),
            ],
        ]);
    }

    /**
     * POST /api/admin/users
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'full_name' => ['required', 'string', 'max:255'],
            'username' => ['required', 'string', 'max:255', 'unique:users,username'],
            'email' => ['required', 'email', 'max:255', 'unique:users,email'],
            'department' => ['required', 'string', 'max:255'],
            'status' => ['required', 'string', 'max:50'],
            'role_id' => ['nullable', 'integer', 'exists:roles,id'],
            'role' => ['nullable', 'string', 'max:255'],
            'password' => ['required', 'string', 'min:8'],
        ]);

        $roleId = $this->resolveRoleId($validated);

        $user = User::create([
            'full_name' => $validated['full_name'],
            'username' => $validated['username'],
            'email' => $validated['email'],
            'department' => $validated['department'],
            'status' => $validated['status'],
            'role_id' => $roleId,
            'password' => $validated['password'],
        ]);

        return response()->json([
            'message' => 'User created successfully.',
            'user' => $user->load('role'),
        ], 201);
    }

    /**
     * PUT /api/admin/users/{user}
     */
    public function update(Request $request, User $user)
    {
        $validated = $request->validate([
            'full_name' => ['sometimes', 'required', 'string', 'max:255'],
            'username' => ['sometimes', 'required', 'string', 'max:255', 'unique:users,username,' . $user->id],
            'email' => ['sometimes', 'required', 'email', 'max:255', 'unique:users,email,' . $user->id],
            'department' => ['sometimes', 'required', 'string', 'max:255'],
            'status' => ['sometimes', 'required', 'string', 'max:50'],
            'role_id' => ['nullable', 'integer', 'exists:roles,id'],
            'role' => ['nullable', 'string', 'max:255'],
            'password' => ['nullable', 'string', 'min:8'],
        ]);

        $payload = collect($validated)->except(['role', 'role_id'])->toArray();

        $roleId = null;
        if (array_key_exists('role_id', $validated) || array_key_exists('role', $validated)) {
            $roleId = $this->resolveRoleId($validated);
        }

        if (!is_null($roleId)) {
            $payload['role_id'] = $roleId;
        }

        if (array_key_exists('password', $validated) && !empty($validated['password'])) {
            $payload['password'] = $validated['password'];
        }

        $user->update($payload);

        return response()->json([
            'message' => 'User updated successfully.',
            'user' => $user->fresh('role'),
        ]);
    }

    /**
     * DELETE /api/admin/users/{user}
     */
    public function destroy(User $user)
    {
        $user->delete();

        return response()->json(['message' => 'User deleted successfully.']);
    }

    /**
     * POST /api/admin/users/bulk-delete
     * body: { ids: [1,2,3] }
     */
    public function bulkDelete(Request $request)
    {
        $validated = $request->validate([
            'user_ids' => ['required', 'array', 'min:1'],
            'user_ids.*' => ['integer', 'distinct', 'exists:users,id'],
        ]);

        User::whereIn('id', $validated['user_ids'])->delete();

        return response()->json([
            'message' => 'Users deleted successfully',
        ]);
    }


    /**
     * POST /api/admin/users/bulk-deactivate
     * body: { user_ids: [1,2,3] }
     */
    public function bulkDeactivate(Request $request)
    {
        $validated = $request->validate([
            'user_ids' => ['required', 'array', 'min:1'],
            'user_ids.*' => ['integer', 'distinct', 'exists:users,id'],
        ]);

        User::whereIn('id', $validated['user_ids'])->update([
            'status' => 'Inactive',
        ]);

        return response()->json([
            'message' => 'Users deactivated successfully',
        ]);
    }

    /**
     * POST /api/admin/users/bulk-activate
     * body: { user_ids: [1,2,3] }
     */
    public function bulkActivate(Request $request)
    {
        $validated = $request->validate([
            'user_ids' => ['required', 'array', 'min:1'],
            'user_ids.*' => ['integer', 'distinct', 'exists:users,id'],
        ]);

        User::whereIn('id', $validated['user_ids'])->update([
            'status' => 'Active',
        ]);

        return response()->json([
            'message' => 'Users activated successfully',
        ]);
    }


    private function resolveRoleId(array $validated): int

    {
        if (!empty($validated['role_id'])) {
            return (int) $validated['role_id'];
        }

        if (!empty($validated['role'])) {
            $roleName = trim((string) $validated['role']);
            $normalized = strtolower($roleName);

            $role = Role::query()
                ->whereRaw('LOWER(name) = ?', [$normalized])
                ->first();

            if ($role) {
                return (int) $role->id;
            }
        }

        $defaultRole = Role::query()
            ->orderBy('id')
            ->first();

        if (!$defaultRole) {
            abort(422, 'Role is required but roles table is empty.');
        }

        return (int) $defaultRole->id;
    }
}

