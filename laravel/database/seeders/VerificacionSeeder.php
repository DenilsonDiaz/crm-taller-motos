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
use Carbon\CarbonImmutable;
class VerificacionSeeder extends Seeder
{
    public function run(): void
    {
        DB::transaction(function () {
            $password = Hash::make("Ventas2026");
            $users = [];
            foreach (
                [
                    ["Alicia Morales", "admin", "administrador", null, true],
                    ["Sergio Ruiz", "sergio", "supervisor", null, true],
                    ["Sandra Pérez", "sandra", "supervisor", null, true],
                    ["Valeria López", "valeria", "vendedor", "sergio", true],
                    ["Diego Castillo", "diego", "vendedor", "sergio", true],
                    ["Carlos Ajú", "carlos", "vendedor", "sandra", true],
                    ["Iván Toj", "ivan", "vendedor", "sandra", false],
                ]
                as [$name, $mail, $role, $sup, $active]
            ) {
                $users[$mail] = User::create([
                    "name" => $name,
                    "email" => $mail . "@crm.test",
                    "password" => $password,
                    "rol" => $role,
                    "supervisor_id" => $sup ? $users[$sup]->id : null,
                    "activo" => $active,
                ]);
            }
            $products = [];
            foreach (
                [
                    ["Plan básico", "1200.00", true],
                    ["Plan avanzado", "2750.50", true],
                    ["Instalación", "450.00", true],
                    ["Soporte anual", "3600.00", true],
                    ["Licencia anterior", "999.99", false],
                ]
                as [$name, $price, $active]
            ) {
                $products[$name] = Producto::create([
                    "nombre" => $name,
                    "precio" => $price,
                    "activo" => $active,
                ]);
            }
            $clients = [];
            $data = [
                [
                    "valeria",
                    "Comercial El Quetzal",
                    "4521817K",
                    "55551234",
                    "compras@elquetzal.test",
                ],
                ["valeria", "Ferretería Xela", "98765434", "77612345", null],
                ["valeria", "María Coyoy", null, "41234567", null],
                [
                    "diego",
                    "Farmacia Los Altos",
                    "34567895",
                    "77634567",
                    "gerencia@losaltos.test",
                ],
                ["diego", "Luis Tzul", null, "52345678", null],
                ["carlos", "Abarrotes San Juan", "12345679", "77651001", null],
                ["carlos", "Panadería La Esperanza", null, "30001002", null],
                ["carlos", "Taller El Volcán", "22233342", "77651003", null],
                ["carlos", "Ana Xicará", null, "30001004", null],
                ["carlos", "Librería Cantel", "55566677", "77651005", null],
                ["carlos", "Pedro Batz", null, "30001006", null],
                ["carlos", "Tienda La Bendición", null, "30001007", null],
                [
                    "carlos",
                    "Distribuidora Occidente",
                    "77788893",
                    "77651008",
                    null,
                ],
                ["carlos", "Rosa Tax", null, "30001009", null],
                ["ivan", "Hotel Los Pinos", "66655544", "77661001", null],
                [null, "Agencia Cuatro Caminos", null, "30002001", null],
                [null, "Café Zunil", null, "30002002", null],
                [null, "Clínica San Rafael", "8889990K", "77672003", null],
                [null, "Constructora Altiplano", "44433328", "77672004", null],
                [null, "Escuela Futuro", null, "30002005", null],
                [null, "Gimnasio Fuerza", null, "30002006", null],
            ];
            foreach ($data as [$seller, $name, $nit, $phone, $mail]) {
                $clients[$name] = Cliente::create([
                    "vendedor_id" => $seller ? $users[$seller]->id : null,
                    "nombre" => $name,
                    "nit" => $nit,
                    "telefono" => $phone,
                    "correo" => $mail,
                ]);
            }
            $ops = [
                [
                    "Renovación de planes",
                    "Comercial El Quetzal",
                    "valeria",
                    "ganada",
                    "2026-10-05 16:00:00",
                    [
                        ["Plan avanzado", 2, "2600.00"],
                        ["Instalación", 1, "450.00"],
                    ],
                ],
                [
                    "Equipo para sucursal",
                    "Ferretería Xela",
                    "valeria",
                    "ganada",
                    "2026-11-01 03:30:00",
                    [["Plan básico", 3, "1200.00"]],
                ],
                [
                    "Soporte del hogar",
                    "María Coyoy",
                    "valeria",
                    "ganada",
                    "2026-11-01 06:30:00",
                    [["Soporte anual", 1, "3600.00"]],
                ],
                [
                    "Ampliación a bodega",
                    "Comercial El Quetzal",
                    "valeria",
                    "negociacion",
                    null,
                    [["Plan avanzado", 1, "2750.50"]],
                ],
                [
                    "Capacitación de personal",
                    "Ferretería Xela",
                    "valeria",
                    "propuesta",
                    null,
                    [["Instalación", 2, "450.00"]],
                ],
                [
                    "Plan familiar",
                    "María Coyoy",
                    "valeria",
                    "perdida",
                    "2026-10-20 18:00:00",
                    [
                        ["Plan básico", 1, "1200.00"],
                        ["Licencia anterior", 1, "999.99"],
                    ],
                ],
                [
                    "Seguimiento anual",
                    "Comercial El Quetzal",
                    "valeria",
                    "prospecto",
                    null,
                    [],
                ],
                [
                    "Licencias de caja",
                    "Farmacia Los Altos",
                    "diego",
                    "ganada",
                    "2026-10-10 15:00:00",
                    [
                        ["Plan básico", 2, "1200.00"],
                        ["Soporte anual", 1, "3600.00"],
                    ],
                ],
                [
                    "Mantenimiento",
                    "Luis Tzul",
                    "diego",
                    "calificado",
                    null,
                    [["Instalación", 1, "450.00"]],
                ],
                [
                    "Plan anual",
                    "Abarrotes San Juan",
                    "carlos",
                    "ganada",
                    "2026-10-15 20:00:00",
                    [["Soporte anual", 2, "3600.00"]],
                ],
                [
                    "Cotización de equipo",
                    "Taller El Volcán",
                    "carlos",
                    "negociacion",
                    null,
                    [["Plan avanzado", 2, "2750.50"]],
                ],
            ];
            $stages = [
                "prospecto",
                "calificado",
                "propuesta",
                "negociacion",
                "ganada",
            ];
            foreach (
                $ops
                as [$title, $client, $seller, $stage, $close, $lines]
            ) {
                $path =
                    $stage === "perdida"
                        ? ["prospecto", "calificado", "propuesta", "perdida"]
                        : array_slice(
                            $stages,
                            0,
                            array_search($stage, $stages) + 1,
                        );
                $end = CarbonImmutable::parse(
                    $close ?? "2026-10-02 16:00:00",
                    "UTC",
                );
                $created = $end->subDays(3 * (count($path) - 1));
                $o = Oportunidad::create([
                    "cliente_id" => $clients[$client]->id,
                    "vendedor_id" => $users[$seller]->id,
                    "titulo" => $title,
                    "etapa" => $stage,
                    "fecha_cierre" => $close,
                    "motivo_perdida" =>
                        $stage === "perdida" ? "Eligió a la competencia" : null,
                    "created_at" => $created,
                    "updated_at" => $end,
                ]);
                foreach ($lines as [$product, $qty, $price]) {
                    Linea::create([
                        "oportunidad_id" => $o->id,
                        "producto_id" => $products[$product]->id,
                        "cantidad" => $qty,
                        "precio_unitario" => $price,
                    ]);
                }
                foreach ($path as $i => $next) {
                    Historial::create([
                        "oportunidad_id" => $o->id,
                        "usuario_id" => $users[$seller]->id,
                        "etapa_anterior" => $i ? $path[$i - 1] : null,
                        "etapa_nueva" => $next,
                        "created_at" => $created->addDays($i * 3),
                    ]);
                }
            }
            foreach (
                [
                    [
                        "Comercial El Quetzal",
                        "valeria",
                        "llamada",
                        "Confirmar fecha de instalación",
                        "2026-10-08 15:00:00",
                        true,
                    ],
                    [
                        "Ferretería Xela",
                        "valeria",
                        "tarea",
                        "Enviar propuesta de capacitación",
                        "2030-01-15 15:00:00",
                        false,
                    ],
                    [
                        "María Coyoy",
                        "valeria",
                        "reunion",
                        "Presentar opciones de soporte",
                        "2026-09-01 15:00:00",
                        false,
                    ],
                    [
                        "Farmacia Los Altos",
                        "diego",
                        "llamada",
                        "Renovación de licencias",
                        "2030-02-01 15:00:00",
                        false,
                    ],
                ]
                as [$c, $s, $type, $desc, $due, $done]
            ) {
                Actividad::create([
                    "cliente_id" => $clients[$c]->id,
                    "vendedor_id" => $users[$s]->id,
                    "tipo" => $type,
                    "descripcion" => $desc,
                    "vence_en" => $due,
                    "completada" => $done,
                ]);
            }
        });
    }
}
