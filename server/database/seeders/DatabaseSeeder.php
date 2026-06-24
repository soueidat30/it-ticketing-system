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
    $this->call(RoleSeeder::class);

    $this->call(CategoryDesignOptionsSeeder::class);
    $this->call(KnowledgeBaseSeeder::class);


    $adminRole = Role::firstWhere('name', 'admin');
    User::firstOrCreate(

        ['username' => 'admin'],
        [
            'full_name' => 'Administrator',
            'email' => 'admin@example.com',
            'password' => Hash::make('password'),
            'role_id' => $adminRole?->id,
        ]
    );

    $agentRole = Role::firstWhere('name', 'agent');
    User::firstOrCreate(
        ['username' => 'agent'],
        [
            'full_name' => 'Agent User',
            'email' => 'agent@example.com',
            'password' => Hash::make('password'),
            'role_id' => $agentRole?->id,
        ]
    );

    $employeeRole = Role::firstWhere('name', 'employee');
    User::firstOrCreate(
        ['username' => 'employee'],
        [
            'full_name' => 'Employee User',
            'email' => 'employee@example.com',
            'password' => Hash::make('password'),
            'role_id' => $employeeRole?->id,
        ]
    );
}
    }
