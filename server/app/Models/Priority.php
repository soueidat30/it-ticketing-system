<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Priority extends Model
{
    protected $fillable = [
        'priority_name',
        'level',
        'color',
        'bg_color',
        'icon',
        'description',
        'sla_response_minutes',
        'sla_resolve_minutes',
        'auto_escalate',
        'notify_manager',
        'is_active',
    ];

    public function tickets()
    {
        return $this->hasMany(\App\Models\Ticket::class, 'priority_id');
    }
}


