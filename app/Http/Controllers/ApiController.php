<?php

namespace App\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ApiController extends Controller
{
    /**
     * Endpoint status healthcheck backend Laravel.
     */
    public function health(): JsonResponse
    {
        return response()->json([
            'status' => 'success',
            'message' => 'konCHO Laravel Backend running smoothly',
            'php_version' => PHP_VERSION,
            'laravel_version' => app()->version(),
            'timestamp' => now()->toIso8601String(),
            'env' => config('app.env')
        ]);
    }

    /**
     * Endpoint konfigurasi sistem & routing.
     */
    public function config(): JsonResponse
    {
        return response()->json([
            'app_name' => 'konCHO',
            'spreadsheet_id' => '1bqispkT4gfY7GJ38ruVxqyuBk3ChdORDd2E5AiBYuDc',
            'units' => ['CHO Mobile', 'CHO Fixed', 'CHO eCare', 'CHO Priority'],
            'sites' => [
                'CHO Fixed CC Semarang',
                'CHO Fixed CC Bandung',
                'CHO Mobile CC Semarang',
                'CHO Mobile CC Bandung',
                'CHO E Care',
                'CHO Priority Semarang',
                'CHO Priority Bandung'
            ],
            'default_routing' => [
                ['site' => 'CHO Fixed CC Bandung', 'sheet' => 'CHO Fixed', 'facilitator' => 'Galih'],
                ['site' => 'CHO Fixed CC Semarang', 'sheet' => 'CHO Fixed', 'facilitator' => 'Reza'],
                ['site' => 'CHO Mobile CC Bandung', 'sheet' => 'CHO Mobile', 'facilitator' => 'Galih'],
                ['site' => 'CHO Mobile CC Semarang', 'sheet' => 'CHO Mobile', 'facilitator' => 'Reza'],
                ['site' => 'CHO E Care', 'sheet' => 'CHO eCare', 'facilitator' => 'Ajun'],
                ['site' => 'CHO Priority Semarang', 'sheet' => 'CHO Priority', 'facilitator' => 'Yurina'],
                ['site' => 'CHO Priority Bandung', 'sheet' => 'CHO Priority', 'facilitator' => 'Kenny'],
            ]
        ]);
    }
}

