<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Ticket extends Model
{
    protected $casts = [
        'resolved_at' => 'datetime',
        'response_due_at' => 'datetime',
        'resolution_due_at' => 'datetime',
        'first_response_at' => 'datetime',
    ];

    protected $fillable = [
        'ticket_number',
        'title',
        'description',
        'user_id',
        'asset_id',
        'assigned_to',
        'category_id',
        'priority_id',
        'status_id',
        'resolved_at',

        // Email notification fields
        'client_email',
        'client_closed_email_sent_at',

        // SLA timer fields
        'response_due_at',
        'resolution_due_at',
        'first_response_at',
        'response_breached',
        'resolution_breached',
    ];


    public function category()
    {
        return $this->belongsTo(Category::class);
    }

    public function priority()
    {
        return $this->belongsTo(Priority::class);
    }

    public function status()
    {
        return $this->belongsTo(Status::class);
    }

    public function user()
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    public function assignee()
    {
        return $this->belongsTo(User::class, 'assigned_to');
    }

    public function asset()
    {
        return $this->belongsTo(Asset::class);
    }

    public function comments()
    {
        return $this->hasMany(Comment::class);
    }

    public function attachments()
    {
        return $this->hasMany(TicketAttachment::class);
    }

    public function history()
    {
        return $this->hasMany(TicketStatusHistory::class);
    }
}

