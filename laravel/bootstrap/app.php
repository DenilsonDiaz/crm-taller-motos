<?php
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
return Application::configure(basePath: dirname(__DIR__))
 ->withRouting(web: __DIR__.'/../routes/web.php', commands: __DIR__.'/../routes/console.php', health: '/up')
 ->withMiddleware(function (Middleware $middleware): void { $middleware->alias(['panel'=>\App\Http\Middleware\PanelAccess::class]); })
 ->withExceptions(function (Exceptions $exceptions): void {
  $exceptions->render(function (\Illuminate\Database\QueryException $e, \Illuminate\Http\Request $request) {
   $code=$e->errorInfo[1]??0;
   if(in_array($code,[1062,1213,1205])) return back()->withInput($request->except(['password','password_confirmation']))->withErrors(['general'=>$code===1062?'Ya existe un registro con ese NIT, teléfono o nombre.':'Otra operación cambió estos datos. Intente nuevamente.']);
   return null;
  });
 })->create();
