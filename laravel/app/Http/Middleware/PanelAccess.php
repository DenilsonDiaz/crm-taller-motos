<?php
namespace App\Http\Middleware;
use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
class PanelAccess
{
    public function handle(Request $request, Closure $next)
    {
        $user = $request->user();
        if (
            !$user ||
            !$user->activo ||
            !in_array($user->rol, ["administrador", "supervisor"])
        ) {
            Auth::logout();
            $request->session()->invalidate();
            $request->session()->regenerateToken();
            return redirect()
                ->route("login")
                ->withErrors([
                    "email" => "Su cuenta ya no tiene acceso al panel.",
                ]);
        }
        return $next($request);
    }
}
