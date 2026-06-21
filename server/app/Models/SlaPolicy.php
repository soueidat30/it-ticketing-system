<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class SlaPolicy extends Model
{
    protected $fillable = [
        'name',
        'priority_id',
        'response_time_hours',
        'resolution_time_hours',
        'is_active'
    ];

    public function priority()
    {
        return $this->belongsTo(Priority::class);
    }
}
