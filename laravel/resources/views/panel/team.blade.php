@extends('layouts.app')
@section('title','Equipo')
@section('content')
<div class="page-heading"><div><div class="eyebrow">Personas y resultados</div><h1>Su equipo comercial.</h1><p>Carteras y ventas de los vendedores dentro de su alcance.</p></div><form method="GET" class="filter-row"><label for="mes" class="visually-hidden">Mes</label><input class="form-control" type="month" id="mes" name="mes" value="{{ $report['mes'] }}"><button class="btn btn-light">Consultar</button></form></div><section class="card-box">@include('panel.partials.sellers')</section>
@endsection
