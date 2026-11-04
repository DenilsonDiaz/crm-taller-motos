<?php
namespace App\Services;
use App\Models\{User, Oportunidad};
use Carbon\CarbonImmutable;
use Illuminate\Support\Facades\DB;
class Reportes
{
    public function obtener(User $actor, string $month): array
    {
        $start = CarbonImmutable::createFromFormat(
            "!Y-m",
            $month,
            "America/Guatemala",
        )
            ->startOfMonth()
            ->utc();
        $end = $start->setTimezone("America/Guatemala")->addMonth()->utc();
        $sellers = User::where("rol", "vendedor")
            ->when(
                $actor->rol === "supervisor",
                fn($q) => $q->where("supervisor_id", $actor->id),
            )
            ->orderBy("name")
            ->get();
        $ids = $sellers->pluck("id");
        $totals = DB::table("oportunidad_productos")
            ->select("oportunidad_id")
            ->selectRaw("SUM(cantidad * precio_unitario) AS total")
            ->groupBy("oportunidad_id");
        $base = fn() => DB::table("oportunidades as o")
            ->leftJoinSub(
                $totals,
                "t",
                fn($j) => $j->on("t.oportunidad_id", "=", "o.id"),
            )
            ->whereIn("o.vendedor_id", $ids);
        $sales = $base()
            ->where("o.etapa", "ganada")
            ->where("o.fecha_cierre", ">=", $start)
            ->where("o.fecha_cierre", "<", $end)
            ->select("o.vendedor_id")
            ->selectRaw("COUNT(*) AS ventas, COALESCE(SUM(t.total),0) AS total")
            ->groupBy("o.vendedor_id")
            ->get()
            ->keyBy("vendedor_id");
        $forecasts = $base()
            ->whereIn("o.etapa", [
                "prospecto",
                "calificado",
                "propuesta",
                "negociacion",
            ])
            ->select("o.vendedor_id")
            ->selectRaw(
                "COALESCE(SUM(t.total * CASE o.etapa WHEN 'prospecto' THEN .10 WHEN 'calificado' THEN .25 WHEN 'propuesta' THEN .50 WHEN 'negociacion' THEN .75 ELSE 0 END),0) AS total",
            )
            ->groupBy("o.vendedor_id")
            ->get()
            ->keyBy("vendedor_id");
        $bySeller = $sellers->map(
            fn($s) => [
                "id" => $s->id,
                "nombre" => $s->name,
                "activo" => $s->activo,
                "cartera" => $s->clientes()->count(),
                "ventas" => (int) ($sales->get($s->id)->ventas ?? 0),
                "total" => (float) ($sales->get($s->id)->total ?? 0),
                "pronostico" => round(
                    (float) ($forecasts->get($s->id)->total ?? 0),
                    2,
                ),
            ],
        );
        $products = DB::table("oportunidad_productos as l")
            ->join("productos as p", "p.id", "=", "l.producto_id")
            ->join("oportunidades as o", "o.id", "=", "l.oportunidad_id")
            ->whereIn("o.vendedor_id", $ids)
            ->where("o.etapa", "ganada")
            ->where("o.fecha_cierre", ">=", $start)
            ->where("o.fecha_cierre", "<", $end)
            ->select("p.nombre")
            ->selectRaw(
                "SUM(l.cantidad) AS unidades, SUM(l.cantidad*l.precio_unitario) AS total",
            )
            ->groupBy("p.id", "p.nombre")
            ->orderBy("p.nombre")
            ->get();
        return [
            "mes" => $month,
            "vendedores" => $bySeller,
            "productos" => $products,
            "ventas" => $bySeller->sum("ventas"),
            "total" => $bySeller->sum("total"),
            "pronostico" => round(
                $forecasts->sum(fn($f) => (float) $f->total),
                2,
            ),
        ];
    }
}
