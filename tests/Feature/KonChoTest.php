<?php

namespace Tests\Feature;

use Tests\TestCase;

class KonChoTest extends TestCase
{
    /**
     * Test halaman dashboard utama merender dengan status 200 dan elemen penting.
     */
    public function test_dashboard_renders_successfully(): void
    {
        $response = $this->get('/');

        $response->assertStatus(200);
        $response->assertSee('konCHO');
        $response->assertSee('Konsolidasi Complaint Handling Officer');
        $response->assertSee('theme-navy.css');
        $response->assertSee('CHO Mobile');
        $response->assertSee('CHO Fixed');
        $response->assertSee('CHO eCare');
        $response->assertSee('CHO Priority');
        $response->assertSee('CHO Fixed CC Semarang');
        $response->assertSee('CHO Fixed CC Bandung');
        $response->assertSee('Alur Routing Fasilitator');
        $response->assertSee('Agenda CHO');
        $response->assertDontSee('Agenda & Sesi CHO');
        $response->assertDontSee('Sinkronisasi Google Sheet & konCHO Aktif');
        $response->assertSee('data-theme="dark"', false);
    }

    /**
     * Test endpoint API health check.
     */
    public function test_api_health_endpoint(): void
    {
        $response = $this->getJson('/api/health');

        $response->assertStatus(200);
        $response->assertJson([
            'status' => 'success',
            'message' => 'konCHO Laravel Backend running smoothly',
        ]);
        $response->assertJsonStructure([
            'status',
            'message',
            'php_version',
            'laravel_version',
            'timestamp',
            'env'
        ]);
    }

    /**
     * Test endpoint API config mengembalikan units, sites, dan alur routing.
     */
    public function test_api_config_endpoint(): void
    {
        $response = $this->getJson('/api/config');

        $response->assertStatus(200);
        $response->assertJsonStructure([
            'app_name',
            'spreadsheet_id',
            'units',
            'sites',
            'default_routing'
        ]);

        $response->assertJsonFragment(['site' => 'CHO Fixed CC Semarang', 'facilitator' => 'Reza']);
        $response->assertJsonFragment(['site' => 'CHO Fixed CC Bandung', 'facilitator' => 'Galih']);
        $response->assertJsonFragment(['site' => 'CHO Priority Semarang', 'facilitator' => 'Yurina']);
        $response->assertJsonFragment(['site' => 'CHO Priority Bandung', 'facilitator' => 'Kenny']);
    }
}
