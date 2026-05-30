<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class CheckRole
{
    public function handle(Request $request, Closure $next, string ...$roles): mixed
    {
        $user = Auth::guard('api')->user();

        if (! $user) {
            return response()->json(['message' => 'Unauthenticated.'], 401);
        }

        $userRole = $user->role->name ?? 'employee';

        if (! in_array($userRole, $roles)) {
            return response()->json([
                'message' => 'Unauthorized. You do not have permission to access this resource.',
            ], 403);
        }

        return $next($request);
    }
}
