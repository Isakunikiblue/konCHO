<?php

use App\Http\Controllers\DashboardController;
use App\Http\Controllers\ApiController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Web Routes - konCHO (Konsolidasi Complaint Handling Officer)
|--------------------------------------------------------------------------
*/

Route::get('/', [DashboardController::class, 'index'])->name('dashboard');

// API routes for system health & configuration
Route::prefix('api')->group(function () {
    Route::get('/health', [ApiController::class, 'health'])->name('api.health');
    Route::get('/config', [ApiController::class, 'config'])->name('api.config');
});
