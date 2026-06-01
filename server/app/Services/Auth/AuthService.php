<?php

namespace App\Services\Auth;

use Illuminate\Support\Facades\Auth;
use RuntimeException;

class AuthService
{
    public function login(array $credentials)
    {
        try {
            if (! $token = Auth::guard('api')->attempt($credentials)) {
                return null;
            }

            return $token;
        } catch (RuntimeException $exception) {
            return null;
        }
    }
}
