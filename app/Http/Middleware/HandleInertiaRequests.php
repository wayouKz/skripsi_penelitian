<?php

namespace App\Http\Middleware;

use App\Models\Config;
use App\Models\List_Feature;
use Inertia\Middleware;
use Illuminate\Http\Request;
use App\Models\Role;

class HandleInertiaRequests extends Middleware
{
    /**
     * The root template that is loaded on the first page visit.
     *
     * @var string
     */
    protected $rootView = 'app';

    /**
     * Determine the current asset version.
     */
    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    /**
     * Define the props that are shared by default.
     *
     * @return array<string, mixed>
     */
public function share(Request $request): array
{
    try {
    $user = $request->user();
    $config = Config::first();
    // Lanjutkan logika jika user ditemukan
} catch (\Illuminate\Database\QueryException $e) {
    $user = null;
    $config = null;

}
    return [
        ...parent::share($request),
        'auth' => [
            'user' => $user,
            'list_features' => $user?->role->listFeatures,
            'guru' => $user?->guru,
        ],
        'settings_application' => $config,
        'flash' => [
            'success' => $request->session()->get('success'),
            'error' => $request->session()->get('error'),
        ],
    ];
}
}
