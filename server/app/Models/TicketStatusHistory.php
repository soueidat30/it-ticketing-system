<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class TicketStatusHistory extends Model
{
    use HasFactory;

    protected $fillable = [
        'ticket_id',
        'status_id',
        'changed_by',
        'note',
    ];

    // ── Relationships ─────────────────────────────────────────
    public function ticket()
    {
        return $this->belongsTo(Ticket::class);
    }

    public function status()
    {
        return $this->belongsTo(Status::class);   // ← gives us status_name
    }

    public function changer()
    {
        return $this->belongsTo(User::class, 'changed_by'); // ← gives us full_name
    }
}
