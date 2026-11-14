<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\View\View;

class DashboardController extends Controller
{
    /**
     * Tampilkan halaman utama aplikasi konCHO.
     */
    public function index(): View
    {
        $appConfig = [
            'appName' => 'konCHO',
            'appLongName' => 'Konsolidasi Complaint Handling Officer',
            'version' => '3.0.0-Laravel',
            'phpVersion' => PHP_VERSION,
            'laravelVersion' => app()->version(),
            'spreadsheetId' => '1bqispkT4gfY7GJ38ruVxqyuBk3ChdORDd2E5AiBYuDc',
            'activeUnits' => [
                [
                    'id' => 'CHO Mobile',
                    'name' => 'CHO Mobile',
                    'sheet' => 'Mobile',
                    'color' => '#818cf8',
                    'description' => 'Layanan Konsolidasi Seluler & Mobile Network'
                ],
                [
                    'id' => 'CHO Fixed',
                    'name' => 'CHO Fixed',
                    'sheet' => 'Fixed',
                    'color' => '#38bdf8',
                    'description' => 'Layanan Konsolidasi Fixed Broadband & Jaringan Tetap'
                ],
                [
                    'id' => 'CHO eCare',
                    'name' => 'CHO eCare',
                    'sheet' => 'eCare',
                    'color' => '#2dd4bf',
                    'description' => 'Layanan Konsolidasi Kanal Digital & eCare'
                ],
                [
                    'id' => 'CHO Priority',
                    'name' => 'CHO Priority',
                    'sheet' => 'Priority',
                    'color' => '#fbbf24',
                    'description' => 'Layanan Konsolidasi Pelanggan Prioritas High-Touch'
                ]
            ],
            'defaultSites' => [
                'CHO Fixed CC Semarang',
                'CHO Fixed CC Bandung',
                'CHO Mobile CC Semarang',
                'CHO Mobile CC Bandung',
                'CHO E Care',
                'CHO Priority Semarang',
                'CHO Priority Bandung'
            ],
            'defaultFacilitatorRouting' => [
                ['site' => 'CHO Fixed CC Bandung', 'sheet' => 'CHO Fixed', 'facilitator' => 'Galih'],
                ['site' => 'CHO Fixed CC Semarang', 'sheet' => 'CHO Fixed', 'facilitator' => 'Reza'],
                ['site' => 'CHO Mobile CC Bandung', 'sheet' => 'CHO Mobile', 'facilitator' => 'Galih'],
                ['site' => 'CHO Mobile CC Semarang', 'sheet' => 'CHO Mobile', 'facilitator' => 'Reza'],
                ['site' => 'CHO E Care', 'sheet' => 'CHO eCare', 'facilitator' => 'Ajun'],
                ['site' => 'CHO Priority Semarang', 'sheet' => 'CHO Priority', 'facilitator' => 'Yurina'],
                ['site' => 'CHO Priority Bandung', 'sheet' => 'CHO Priority', 'facilitator' => 'Kenny'],
            ],
            'theme' => 'navy',
        ];

        return view('dashboard', compact('appConfig'));
    }
}

