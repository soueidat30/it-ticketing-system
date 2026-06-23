<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\CategoryDesignOption;

class CategoryDesignOptionsSeeder extends Seeder
{
    public function run(): void
    {
        $data = [
            ['icon' => 'ti-cpu', 'color' => '#3b82f6'],
            ['icon' => 'ti-apps', 'color' => '#8b5cf6'],
            ['icon' => 'ti-network', 'color' => '#06b6d4'],
            ['icon' => 'ti-shield-lock', 'color' => '#10b981'],
            ['icon' => 'ti-mail', 'color' => '#f59e0b'],
            ['icon' => 'ti-printer', 'color' => '#f97316'],
            ['icon' => 'ti-user-check', 'color' => '#d4f265'],
            ['icon' => 'ti-lock', 'color' => '#ef4444'],
            ['icon' => 'ti-dots-circle-horizontal', 'color' => '#6b7280'],
            ['icon' => 'ti-server', 'color' => '#94a3b8'],

            ['icon' => 'ti-database', 'color' => '#03363d'],
            ['icon' => 'ti-cloud', 'color' => '#ec4899'],
            ['icon' => 'ti-headset', 'color' => '#14b8a6'],
            ['icon' => 'ti-device-laptop', 'color' => '#a78bfa'],
            ['icon' => 'ti-settings', 'color' => '#fb923c'],

            ['icon' => 'ti-tag', 'color' => '#3b82f6'],
            ['icon' => 'ti-building', 'color' => '#8b5cf6'],
            ['icon' => 'ti-chart-bar', 'color' => '#06b6d4'],
            ['icon' => 'ti-file', 'color' => '#10b981'],
            ['icon' => 'ti-tools', 'color' => '#f59e0b'],
        ];

        foreach ($data as $row) {
            CategoryDesignOption::updateOrCreate(
                ['icon' => $row['icon'], 'color' => $row['color']],
                $row
            );
        }
    }
}

