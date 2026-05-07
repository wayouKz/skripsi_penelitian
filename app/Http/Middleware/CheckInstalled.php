<?php

namespace App\Http\Middleware;

use Illuminate\Http\Request;
use Closure;

class CheckInstalled
{
    public function handle(Request $request, Closure $next)
    {
        $installed = file_exists(public_path('storage/installed'));

        /**
         * ===================================
         * ❌ BELUM INSTALLED
         * ===================================
         */
        if (!$installed) {

            // XHR / Inertia → jangan redirect (hindari reload)
            if (
                $request->ajax() ||
                $request->wantsJson() ||
                $request->header('X-Inertia')
            ) {

            }

            // Web biasa → paksa ke installer
            if (!$request->is('install*')) {
                return redirect('/install');
            }
        }

        /**
         * ===================================
         * ✅ SUDAH INSTALLED
         * ===================================
         */
        if ($installed && $request->is('install*')) {

            // 🔥 BLOK TOTAL installer
            // Inertia → soft redirect (no reload)
            if ($request->header('X-Inertia')) {
                return response('', 409)
                    ->header('X-Inertia-Location', route('login'));
            }

            // Web biasa
            abort(404); // ⬅️ installer benar-benar mati
        }

        return $next($request);
    }
}
