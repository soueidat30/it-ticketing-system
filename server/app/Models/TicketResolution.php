<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class TicketResolution extends Model
{
    protected $fillable = [
        'ticket_id',
        'resolved_by',
        'resolution_type',
        'solution',
        'root_cause',
        'time_spent',
        'time_unit',
        'internal_notes',
        'rating',
    ];

    public function ticket()
    {
        return $this->belongsTo(Ticket::class);
    }

    public function resolver()
    {
        return $this->belongsTo(User::class, 'resolved_by');
    }
}
