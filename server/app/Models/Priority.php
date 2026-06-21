<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Priority extends Model
{
    public function tickets()
    {
        return $this->hasMany(\App\Models\Ticket::class, 'priority_id');
    }
}

