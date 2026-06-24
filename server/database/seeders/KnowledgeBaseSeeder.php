<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\KbCategory;
use App\Models\KbArticle;

class KnowledgeBaseSeeder extends Seeder
{
    public function run(): void
    {
        $network = KbCategory::create([
            'name' => 'Network',
            'slug' => 'network',
            'icon' => 'ti-wifi-off',
            'description' => 'VPN, internet, connectivity issues',
        ]);

        $software = KbCategory::create([
            'name' => 'Software',
            'slug' => 'software',
            'icon' => 'ti-code',
            'description' => 'Applications, OS, tools',
        ]);

        KbArticle::create([
            'kb_category_id' => $network->id,
            'author_id' => 1, // adjust to a real user ID
            'title' => 'How to connect to VPN',
            'slug' => 'vpn-setup',
            'excerpt' => 'Step-by-step VPN connection guide.',
            'content' => '<p>Open the VPN client and enter your credentials...</p>',
            'status' => 'published',
            'is_faq' => true,
        ]);

        KbArticle::create([
            'kb_category_id' => $software->id,
            'author_id' => 1,
            'title' => 'Installing Office Suite',
            'slug' => 'office-install',
            'excerpt' => 'Guide to install Microsoft Office.',
            'content' => '<p>Download the installer and follow the prompts...</p>',
            'status' => 'published',
            'is_faq' => false,
        ]);
    }
}
