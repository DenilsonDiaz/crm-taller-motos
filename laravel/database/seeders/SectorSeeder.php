<?php
namespace Database\Seeders;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\{DB, Hash};
use App\Models\{
    User,
    Producto,
    Cliente,
    Oportunidad,
    Linea,
    Historial,
    Actividad,
};
class SectorSeeder extends Seeder
{
    public function run(): void
    {
        DB::transaction(function () {
            $hash = Hash::make("Ventas2026");
            $sup = User::create([
                "name" => "Mariana López",
                "email" => "supervision@motogest.test",
                "password" => $hash,
                "rol" => "supervisor",
            ]);
            $seller = User::create([
                "name" => "Andrés Méndez",
                "email" => "asesor@motogest.test",
                "password" => $hash,
                "rol" => "vendedor",
                "supervisor_id" => $sup->id,
            ]);
            $list = [
                ["Aceite Honda 20W50 premium 1 litro", 60, false, false],
                ["Bujía Honda 31918-HM5-630", 39.98, false, false],
                ["Kit de cilindro Honda CBF125 Stunner", 690, true, false],
                ["Mano de obra de instalación de cilindro", 100, false, true],
                ["Pastillas delanteras Honda 06455-KPP-N01", 221.10, false, false],
                ["Servicio de mantenimiento express", 295, false, false],
            ];
            $products = [];
            foreach ($list as [$n, $p, $required, $labor]) {
                $products[] = Producto::create([
                    "nombre" => $n,
                    "precio" => $p,
                    "activo" => true,
                    "requiere_instalacion" => $required,
                    "es_instalacion" => $labor,
                ]);
            }
            foreach (
                [
                    "Jorge Pérez",
                    "Daniela Gómez",
                    "Luis Hernández",
                    "Marta Vásquez",
                    "Kevin Ramos",
                    "Paola López",
                ]
                as $i => $name
            ) {
                $c = Cliente::create([
                    "nombre" => $name,
                    "nit" => null,
                    "telefono" => "4501000" . ($i + 1),
                    "correo" => "cliente" . ($i + 1) . "@motogest.test",
                    "vendedor_id" => $seller->id,
                ]);
                $stages = [
                    "prospecto",
                    "calificado",
                    "propuesta",
                    "negociacion",
                    "ganada",
                    "perdida",
                ];
                $stage = $stages[$i];
                $closed = in_array($stage, ["ganada", "perdida"]);
                $o = Oportunidad::create([
                    "cliente_id" => $c->id,
                    "vendedor_id" => $seller->id,
                    "titulo" => [
                        "Consulta de mantenimiento",
                        "Cambio de aceite",
                        "Cotización de frenos",
                        "Cambio de cilindro",
                        "Mantenimiento completo",
                        "Revisión de repuestos",
                    ][$i],
                    "etapa" => $stage,
                    "fecha_cierre" => $closed ? now() : null,
                    "motivo_perdida" =>
                        $stage === "perdida"
                            ? "El cliente pospuso la compra"
                            : null,
                ]);
                if ($i === 3) {
                    foreach ([2, 3] as $k) {
                        Linea::create([
                            "oportunidad_id" => $o->id,
                            "producto_id" => $products[$k]->id,
                            "cantidad" => 1,
                            "precio_unitario" => $products[$k]->precio,
                        ]);
                    }
                } else {
                    Linea::create([
                        "oportunidad_id" => $o->id,
                        "producto_id" => $products[$i]->id,
                        "cantidad" => 1,
                        "precio_unitario" => $products[$i]->precio,
                    ]);
                }
                $path =
                    $stage === "perdida"
                        ? ["prospecto", "calificado", "propuesta", "perdida"]
                        : array_slice($stages, 0, $i + 1);
                foreach ($path as $j => $s) {
                    Historial::create([
                        "oportunidad_id" => $o->id,
                        "usuario_id" => $seller->id,
                        "etapa_anterior" => $j ? $path[$j - 1] : null,
                        "etapa_nueva" => $s,
                        "created_at" => now()->subDays(count($path) - $j),
                    ]);
                }
                Actividad::create([
                    "cliente_id" => $c->id,
                    "vendedor_id" => $seller->id,
                    "tipo" => $i % 2 ? "llamada" : "tarea",
                    "descripcion" =>
                        "Confirmar repuestos y disponibilidad para la motocicleta.",
                    "vence_en" => now()->addDays($i + 1),
                    "completada" => false,
                ]);
            }
        });
    }
}
