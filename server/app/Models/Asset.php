<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Asset extends Model
{
    protected $fillable = [
        'asset_code',
        'asset_name',
        'asset_type',
        'serial_number',
        'manufacturer',
        'model',
        'purchase_date',
        'warranty_expiry',
        'assigned_to',
        'created_by',
        'assigned_at',
        'status',

        // Admin editable fields
        'location',
        'department',
        'notes',

        'qr_code_path',
        'qr_code_value',
    ];

    public function employee()
    {
        return $this->belongsTo(User::class, 'assigned_to');
    }

    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function tickets()
    {
        return $this->hasMany(Ticket::class);
    }
}
