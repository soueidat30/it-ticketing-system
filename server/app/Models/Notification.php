<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Notification extends Model
{
    protected $fillable = [
        //
        // NOTE: other controllers call Notification::notify(...)
        // This method is implemented below.
        //

        'user_id',
        'ticket_id',
        'triggered_by',
        'type',
        'title',
        'message',
        'is_read',
        'read_at',
    ];

    protected $casts = [
        'is_read' => 'boolean',
        'read_at' => 'datetime',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function ticket()
    {
        return $this->belongsTo(Ticket::class);
    }

    public function triggeredBy()
    {
        return $this->belongsTo(User::class, 'triggered_by');
    }

    /**
     * Static helper used by other controllers, e.g.
     * Notification::notify(user_id: ..., ticket_id: ..., triggered_by: ..., type: ..., title: ..., message: ...)
     */
    public static function notify(
        int $user_id,
        int $ticket_id,
        ?int $triggered_by,
        string $type,
        string $title,
        string $message
    ): self {
        return self::create([
            'user_id'      => $user_id,
            'ticket_id'    => $ticket_id,
            'triggered_by' => $triggered_by,
            'type'         => $type,
            'title'        => $title,
            'message'      => $message,
            'is_read'      => false,
        ]);
    }
}

