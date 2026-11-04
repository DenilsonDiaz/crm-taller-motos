@extends('layouts.app')
@section('title','Resumen')
@section('content')
<div class="page-heading"><div><div class="eyebrow">El taller de un vistazo</div><h1>Su equipo, en marcha.</h1><p>Ventas y oportunidades del mes {{ $report['mes'] }}.</p></div><a class="btn btn-light" href="{{ route('reportes',['mes'=>$report['mes']]) }}">Ver reporte completo ↗</a></div>
<div class="metric-grid">@foreach([['Ventas del mes',$report['ventas'],'Cotizaciones ganadas'],['Total vendido','Q'.number_format($report['total'],2),'Precios históricos de venta'],['Pronóstico','Q'.number_format($report['pronostico'],2),'Todas las oportunidades abiertas'],['Vendedores',$report['vendedores']->count(),'Cuentas dentro de su alcance']] as [$name,$value,$note])<section class="metric"><small>{{ $name }}</small><strong>{{ $value }}</strong><p>{{ $note }}</p></section>@endforeach</div>
<section class="hero-strip"><div><div class="eyebrow" style="color:#f8875e">Relaciones que hacen crecer</div><h2>Cada cliente necesita un responsable.</h2><p>Asigne su cartera y facilite que su equipo continúe el seguimiento.</p></div><a class="button-primary" href="{{ route('clientes') }}">Gestionar clientes →</a></section>
<section class="card-box"><div class="card-head"><h2>Rendimiento del equipo</h2><a class="action-link" href="{{ route('equipo') }}">Ver equipo →</a></div>@include('panel.partials.sellers')</section>
@endsection
