<?php

namespace App\Services\Auth;

use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Str;
use RuntimeException;

class AuthService
{
    public function login(array $credentials)
    {
        // Normalize common username/email input differences.
        if (isset($credentials['username']) && ! isset($credentials['email'])) {
            if (is_string($credentials['username']) && Str::contains($credentials['username'], '@')) {
                $credentials['email'] = $credentials['username'];
            }
        }

        $debug = request()->header('X-Debug-Auth') === '1';

        try {
            // Auth provider for api guard uses App\\Models\\User (see User model).
            // In your DB, the unique login field is `email`.
            // Frontend sends `{ username, password }`.
            // So we normalize and attempt using email-first.

            $username = $credentials['username'] ?? null;
            $password = $credentials['password'] ?? null;

            $normalized = $credentials;
            if (is_string($username) && $username !== '') {
                // If username already looks like an email, map it.
                if (Str::contains($username, '@')) {
                    $normalized['email'] = $username;
                }
            }

            $token = null;

            // 1) If we have an email (from input), try email login.
            if (isset($normalized['email']) && $password !== null) {
                $token = Auth::guard('api')->attempt([
                    'email' => $normalized['email'],
                    'password' => $password,
                ]);
            }

            // 2) Fallback: try raw credentials (supports username login if your DB has it).
            if (! $token) {
                $token = Auth::guard('api')->attempt($normalized);
            }

            // 3) Fallback: try explicit email if present (keeps previous behavior).
            if (! $token && isset($credentials['email']) && $password !== null) {
                $token = Auth::guard('api')->attempt([
                    'email' => $credentials['email'],
                    'password' => $password,
                ]);
            }


            if ($debug && ! $token) {
                // Safe debug: do not echo password.
                return response()->json([
                    'debug' => true,
                    'auth_guard' => 'api',
                    'attempted' => array_keys($credentials),
                    'note' => 'Auth::attempt returned null (invalid credentials OR provider/secret mismatch).',
                ], 401);
            }

            return $token ?: null;
        } catch (RuntimeException $exception) {
            if ($debug) {
                return response()->json([
                    'debug' => true,
                    'auth_guard' => 'api',
                    'error' => $exception->getMessage(),
                ], 401);
            }

            return null;
        }
    }
}


