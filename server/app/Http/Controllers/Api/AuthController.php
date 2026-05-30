<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class AuthController extends Controller
{
    // POST /api/auth/login
    public function login(Request $request): JsonResponse
    {
        $request->validate([
            'username'    => 'required|string',
            'password' => 'required|string|min:6',
        ]);

        $credentials = $request->only('username', 'password');

        if (! $token = Auth::guard('api')->attempt($credentials)) {
            return response()->json([
                'message' => 'Invalid credentials.',
            ], 401);
        }

        $user = Auth::guard('api')->user()->load('role');

        if (strtolower($user->status) !== 'active') {
            Auth::guard('api')->logout();
            return response()->json([
                'message' => 'Your account is deactivated. Contact IT support.',
            ], 403);
        }

        return $this->respondWithToken($token, $user);
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
        return response()->json(['message' => 'Successfully logged out.']);
    }

    // ── Helper ────────────────────────────────────────────────
    private function respondWithToken(string $token, $user): JsonResponse
    {
        return response()->json([
            'access_token' => $token,
            'token_type'   => 'bearer',
            'expires_in'   => config('jwt.ttl') * 60, // seconds
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
