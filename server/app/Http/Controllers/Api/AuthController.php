<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class AuthController extends Controller
{
    // POST /api/auth/login
    public function login(Request $request): JsonResponse
    {
        $request->validate([
            'username' => 'required|string',
            'password' => 'required|string|min:6',
        ]);

        // Find user by username manually
        // Auth::attempt() only works with email by default
        $user = User::where('username', $request->username)->first();

        // Check user exists and password is correct
        if (! $user || ! password_verify($request->password, $user->password)) {
            return response()->json([
                'message' => 'Invalid credentials.',
            ], 401);
        }

        // Check account is active before generating token
        if (strtolower($user->status) !== 'active') {
            return response()->json([
                'message' => 'Your account is deactivated. Contact IT support.',
            ], 403);
        }

        // Generate JWT token for this user
        $token = Auth::guard('api')->login($user);

        return $this->respondWithToken($token, $user->load('role'));
    }

    // GET /api/auth/me
    public function me(): JsonResponse
    {
        $user = Auth::guard('api')->user()->load('role');

        return response()->json([
            'id'         => $user->id,
            'full_name'  => $user->full_name,
            'username'   => $user->username,
            'email'      => $user->email,
            'department' => $user->department,
            'status'     => $user->status,
            'role'       => $user->role->name ?? 'employee',
        ]);
    }

    // POST /api/auth/refresh
    public function refresh(): JsonResponse
    {
        return $this->respondWithToken(
            Auth::guard('api')->refresh(),
            Auth::guard('api')->user()->load('role')
        );
    }

    // POST /api/auth/logout
    public function logout(): JsonResponse
    {
        Auth::guard('api')->logout();

        return response()->json([
            'message' => 'Successfully logged out.',
        ]);
    }

    // ── Helper ────────────────────────────────────────────────
    private function respondWithToken(string $token, $user): JsonResponse
    {
        return response()->json([
            'access_token' => $token,
            'token_type'   => 'bearer',
            'expires_in'   => config('jwt.ttl') * 60, // in seconds
            'user' => [
                'id'         => $user->id,
                'full_name'  => $user->full_name,
                'username'   => $user->username,
                'email'      => $user->email,
                'department' => $user->department,
                'role'       => $user->role->name ?? 'employee',
            ],
        ]);
    }
}
