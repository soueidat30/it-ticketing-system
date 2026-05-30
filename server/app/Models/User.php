<?php

namespace App\Models;

use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Tymon\JWTAuth\Contracts\JWTSubject;

class User extends Authenticatable implements JWTSubject
{
    /** @use HasFactory<UserFactory> */
    use HasFactory, Notifiable;

    protected $fillable = [
        'full_name',
        'username',
        'email',
        'password',
        'department',
        'status',
        'role_id',
    ];

    protected $hidden = [
        'password',
        // 'remember_token' removed — column was dropped in update_users_table migration
    ];

    protected $casts = [
        'password' => 'hashed',
    ];

    // ── JWT required ──────────────────────────────────────────
    public function getJWTIdentifier()
    {
        return $this->getKey();
    }

    public function getJWTCustomClaims(): array
    {
        // Role is embedded in the token so your friend can
        // read it client-side without an extra API call
        return [
            'role' => $this->role->name ?? 'employee',
        ];
    }

    // ── Relationships ─────────────────────────────────────────
    public function role()
    {
        return $this->belongsTo(Role::class);
    }

    public function tickets()
    {
        return $this->hasMany(Ticket::class);
    }

    public function assignedTickets()
    {
        return $this->hasMany(Ticket::class, 'assigned_to');
    }
}
