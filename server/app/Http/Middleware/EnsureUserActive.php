<?php

namespace App\Http\Middleware;

use App\Models\User;
use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class EnsureUserActive
{
    public function handle(Request $request, Closure $next)
    {
        $user = Auth::guard('api')->user();

        if ($user && isset($user->status) && $user->status === 'Inactive') {
            return response()->json([
                'code' => 'USER_INACTIVE',
                'message' => 'Your account is deactivated. Please contact the administrator.',
            ], 403);
        }

        if ($user) {
            $fresh = User::query()->select(['id', 'status'])->find($user->id);
            if ($fresh && $fresh->status === 'Inactive') {
                return response()->json([
                    'code' => 'USER_INACTIVE',
                    'message' => 'Your account is deactivated. Please contact the administrator.',
                ], 403);
            }
        }

        return $next($request);
    }
}

