<?php

namespace Database\Seeders;

use App\Models\User;
use App\Models\Role;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // Seed roles first
        $this->call(RoleSeeder::class);

        // Create an admin user with bcrypt password
        $adminRole = Role::firstWhere('name', 'admin');

        User::firstOrCreate(
            ['username' => 'admin'],
            [
                'full_name' => 'Administrator',
                'email' => 'admin@example.com',
                'password' => Hash::make('password'),
                'role_id' => $adminRole ? $adminRole->id : null,
            ]
        );
    }
}
