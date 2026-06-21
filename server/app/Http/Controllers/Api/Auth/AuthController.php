<?php

namespace App\Http\Controllers\Api\Auth;

use App\Http\Controllers\Controller;
use App\Http\Requests\LoginRequest;
use App\Services\Auth\AuthService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;

class AuthController extends Controller
{
    protected AuthService $authService;

    public function __construct(AuthService $authService)
    {
        $this->authService = $authService;
    }

    public function login(LoginRequest $request): JsonResponse
    {
        $credentials = $request->validated();

        $token = $this->authService->login($credentials);

        if (! $token) {
            return response()->json(['message' => 'Invalid credentials'], 401);
        }

        $user = Auth::guard('api')->user()->load('role');
        $userData = $user->toArray();
        $userData['role'] = $user->role->name ?? 'employee';

        return response()->json([
            'access_token' => $token,
            'user' => $userData
        ]);
    }

    public function logout(): JsonResponse
    {
        Auth::guard('api')->logout();

        return response()->json(['message' => 'Logged out successfully']);
    }

    public function refresh(): JsonResponse
    {
        return response()->json([
            'access_token' => Auth::guard('api')->refresh(),
        ]);
    }

    public function me(): JsonResponse
    {
        $user = Auth::guard('api')->user()->load('role');
        $userData = $user->toArray();
        $userData['role'] = $user->role->name ?? 'employee';

        return response()->json($userData);
    }

    public function authDebug(Request $request): JsonResponse
    {
        $user = Auth::guard('api')->user();
        return response()->json([
            'authenticated' => (bool) $user,
            'user_id'       => $user?->id,
            'role'          => $user?->role?->name,
            'auth_guard'    => 'api',
        ]);
    }


    public function updateMe(Request $request): JsonResponse
    {
        $request->validate([
            'full_name'  => 'required|string|max:255',
            'department' => 'nullable|string|max:255',
        ]);

        $user = Auth::guard('api')->user();

        $user->full_name = $request->string('full_name');
        $user->department = $request->input('department');
        $user->save();

        return response()->json(
            Auth::guard('api')->user()->load('role')->toArray() + ['role' => optional(Auth::guard('api')->user()->role)->name ?? 'employee']
        );
    }

    public function changePassword(Request $request): JsonResponse
    {
        $data = $request->validate([
            'current_password' => 'required|string',
            'password' => 'required|string|min:8|confirmed',
            'password_confirmation' => 'required|string',
        ]);

        $user = Auth::guard('api')->user();

        if (! Hash::check($data['current_password'], $user->password)) {
            return response()->json(['message' => 'Current password is incorrect'], 403);
        }

        $user->password = Hash::make($data['password']);
        $user->save();

        return response()->json(['message' => 'Password changed successfully']);
    }

}
