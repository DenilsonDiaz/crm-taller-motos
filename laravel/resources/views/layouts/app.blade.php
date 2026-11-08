<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>@yield('title','Panel') · MotoGest Xela</title><link rel="icon" href="data:,"><link rel="stylesheet" href="{{ asset('css/bootstrap.min.css') }}">@vite(['resources/css/app.css','resources/js/app.js'])</head><body>
<div class="app-shell"><aside class="sidebar"><a class="brand" href="{{ route('dashboard') }}"><span class="brand-mark">MG</span><div><span class="brand-name">MotoGest</span><small>Taller de motos · Xela</small></div></a><p class="nav-caption">CONTROL DEL TALLER</p><nav class="side-nav" aria-label="Navegación principal">
@php
    $navigation = [
        'dashboard' => ['Resumen', 'M3 3h7v7H3zM14 3h7v7h-7zM3 14h7v7H3zM14 14h7v7h-7z'],
        'clientes' => ['Clientes', 'M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M16 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0z'],
        'oportunidades' => ['Cotizaciones', 'M3 4h18l-7 8v6l-4 2v-8z'],
        'equipo' => ['Mi equipo', 'M17 21v-2a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v2M14 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0zM21 21v-2a4 4 0 0 0-3-4M17 3a4 4 0 0 1 0 8'],
        'reportes' => ['Reportes', 'M3 3v18h18M8 16v-4m5 4V8m5 8V5'],
    ];
    if (auth()->user()->rol === 'administrador') {
        $navigation['productos'] = ['Catálogo', 'm12 3 9 5v8l-9 5-9-5V8zm0 10 9-5m-9 5L3 8m9 5v8'];
        $navigation['users'] = ['Cuentas', 'M4 11h16v10H4zM8 11V7a4 4 0 1 1 8 0v4m-4 4v2'];
    }
@endphp
@foreach($navigation as $route => [$title, $icon])
    @php($active = request()->routeIs($route.'*'))
    <a @class(['active' => $active]) href="{{ route($route) }}" @if($active) aria-current="page" @endif>
        <svg class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="{{ $icon }}" /></svg>
        {{ $title }}
    </a>
@endforeach
</nav><div class="sidebar-bottom"><p>Un taller organizado.<br>Clientes mejor atendidos.</p><form method="POST" action="{{ route('logout') }}">@csrf<button>Cerrar sesión ↗</button></form></div></aside><div class="workspace"><header class="topbar"><span class="breadcrumb-text">MotoGest Xela / Panel de gestión</span><div class="user-chip"><span class="avatar">{{ mb_substr(auth()->user()->name,0,1) }}</span><span>{{ auth()->user()->name }}<small>{{ ucfirst(auth()->user()->rol) }}</small></span></div></header><main class="content" tabindex="-1">@if(session('success'))<div class="alert alert-success" role="status">{{ session('success') }}</div>@endif
@if($errors->any())<div class="alert alert-danger" role="alert"><strong>Revise los datos del formulario.</strong><ul class="mb-0">@foreach($errors->all() as $error)<li>{{ $error }}</li>@endforeach</ul></div>@endif
@yield('content')<p class="bottom-note">MotoGest Xela · Montos en quetzales · Hora de Guatemala</p></main></div></div></body></html>
