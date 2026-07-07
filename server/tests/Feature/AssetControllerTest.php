<?php

namespace Tests\Feature;

use App\Http\Controllers\Admin\AssetController;
use App\Models\Asset;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\Request;
use Tests\TestCase;

class AssetControllerTest extends TestCase
{
    use RefreshDatabase;

    public function test_assign_updates_status_and_assignment_timestamp(): void
    {
        $user = User::factory()->create();
        $asset = Asset::create([
            'asset_code' => 'AST-0001',
            'asset_name' => 'Laptop',
            'status' => 'unassigned',
        ]);

        $controller = new AssetController();

        $controller->assign(new Request(['user_id' => $user->id]), $asset);

        $asset->refresh();

        $this->assertEquals($user->id, $asset->assigned_to);
        $this->assertEquals('assigned', $asset->status);
        $this->assertNotNull($asset->assigned_at);

        $controller->assign(new Request(['user_id' => null]), $asset);

        $asset->refresh();

        $this->assertNull($asset->assigned_to);
        $this->assertEquals('unassigned', $asset->status);
        $this->assertNull($asset->assigned_at);
    }
}
