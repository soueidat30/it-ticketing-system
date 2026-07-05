<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Status extends Model
{
    protected $fillable = [
        'status_name',
        'description',
        'color',
        'sort_order',
        'is_active',
    ];

    public function tickets()
    {
        return $this->hasMany(Ticket::class);
    }

    public function histories()
    {
        return $this->hasMany(TicketStatusHistory::class, 'status_id');
    }
}
