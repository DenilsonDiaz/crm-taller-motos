<?php
namespace App\Http\Controllers;
use App\Models\{User, Cliente, Producto, Oportunidad};
use App\Services\{Cartera, Reportes};
use App\Support\Identidad;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\{DB, Hash};
use Illuminate\Validation\Rule;
class PanelController extends Controller
{
    private function admin(Request $r): void
    {
        abort_unless(
            $r->user()->rol === "administrador",
            403,
            "Esta opción es del administrador.",
        );
    }
    private function month(Request $r): string
    {
        $d = $r->validate(["mes" => ["nullable", "date_format:Y-m"]]);
        return $d["mes"] ?? now("America/Guatemala")->format("Y-m");
    }
    public function dashboard(Request $r, Reportes $report)
    {
        return view("panel.dashboard", [
            "report" => $report->obtener($r->user(), $this->month($r)),
        ]);
    }
    public function users(Request $r)
    {
        $this->admin($r);
        return view("panel.users", [
            "users" => User::with("supervisor")->orderBy("name")->get(),
            "supervisores" => User::where("rol", "supervisor")
                ->where("activo", true)
                ->get(),
            "edit" => null,
        ]);
    }
    public function editUser(Request $r, User $user)
    {
        $this->admin($r);
        return view("panel.users", [
            "users" => User::with("supervisor")->orderBy("name")->get(),
            "supervisores" => User::where("rol", "supervisor")
                ->where("activo", true)
                ->get(),
            "edit" => $user,
        ]);
    }
    public function saveUser(Request $r, ?User $user = null)
    {
        $this->admin($r);
        $editing = $user?->exists;
        $d = $r->validate([
            "name" => ["required", "string", "max:150"],
            "email" => [
                "required",
                "email",
                "max:150",
                Rule::unique("users")->ignore($user?->id),
            ],
            "password" => [
                $editing ? "nullable" : "required",
                "string",
                "min:8",
                "confirmed",
            ],
            "rol" => [
                "required",
                Rule::in(["administrador", "supervisor", "vendedor"]),
            ],
            "supervisor_id" => ["nullable", "integer"],
            "activo" => ["required", "boolean"],
        ]);
        DB::transaction(function () use ($r, $user, $d, $editing) {
            $u = $editing
                ? User::lockForUpdate()->findOrFail($user->id)
                : new User();
            if (
                $u->id === $r->user()->id &&
                (!$d["activo"] || $d["rol"] !== "administrador")
            ) {
                Identidad::error(
                    "rol",
                    "Usted no puede desactivarse ni quitarse su rol.",
                );
            }
            if (
                $editing &&
                $u->rol !== $d["rol"] &&
                (Cliente::where("vendedor_id", $u->id)->exists() ||
                    Oportunidad::where("vendedor_id", $u->id)->exists() ||
                    User::where("supervisor_id", $u->id)->exists())
            ) {
                Identidad::error(
                    "rol",
                    "Reasigne primero las relaciones de esta cuenta antes de cambiar su rol.",
                );
            }
            if (
                $editing &&
                !$d["activo"] &&
                User::where("supervisor_id", $u->id)
                    ->where("activo", true)
                    ->exists()
            ) {
                Identidad::error(
                    "activo",
                    "Reasigne primero los vendedores activos de este supervisor.",
                );
            }
            if ($d["rol"] === "vendedor") {
                $s = User::where("id", $d["supervisor_id"] ?? 0)
                    ->where("rol", "supervisor")
                    ->where("activo", true)
                    ->lockForUpdate()
                    ->first();
                if (!$s) {
                    Identidad::error(
                        "supervisor_id",
                        "Seleccione un supervisor activo.",
                    );
                }
            }
            $u->fill([
                "name" => $d["name"],
                "email" => $d["email"],
                "rol" => $d["rol"],
                "activo" => $d["activo"],
                "supervisor_id" => $d["rol"] === "vendedor" ? $s->id : null,
            ]);
            if (!empty($d["password"])) {
                $u->password = Hash::make($d["password"]);
            }
            $u->save();
        });
        return redirect()
            ->route("users")
            ->with("success", "Cuenta guardada correctamente.");
    }
    public function products(Request $r, ?Producto $producto = null)
    {
        $this->admin($r);
        return view("panel.products", [
            "products" => Producto::orderBy("nombre")->get(),
            "edit" => $producto,
        ]);
    }
    public function saveProduct(Request $r, ?Producto $producto = null)
    {
        $this->admin($r);
        $d = $r->validate([
            "nombre" => [
                "required",
                "string",
                "max:120",
                Rule::unique("productos")->ignore($producto?->id),
            ],
            "precio" => [
                "required",
                "numeric",
                "gt:0",
                "decimal:0,2",
                "max:99999999.99",
            ],
            "activo" => ["required", "boolean"],
            "requiere_instalacion" => ["required", "boolean"],
            "es_instalacion" => ["required", "boolean"],
        ]);
        ($producto ?? new Producto())->fill($d)->save();
        return redirect()
            ->route("productos")
            ->with(
                "success",
                "Producto guardado. Las cotizaciones anteriores conservan su precio.",
            );
    }
    public function clients(Request $r, Cartera $service, ?int $id = null)
    {
        $r->validate([
            "q" => ["nullable", "string", "max:150"],
            "vendedor" => [
                "nullable",
                function ($attr, $v, $fail) {
                    if ($v !== "libres" && !ctype_digit((string) $v)) {
                        $fail("Seleccione un vendedor válido.");
                    }
                },
            ],
        ]);
        $q = $service
            ->visibles($r->user())
            ->with("vendedor")
            ->when($r->filled("q"), function ($q) use ($r) {
                $s =
                    "%" .
                    addcslashes($r->string("q")->toString(), "\\%_") .
                    "%";
                $q->where(
                    fn($q) => $q
                        ->where("nombre", "like", $s)
                        ->orWhere("nit", "like", $s),
                );
            })
            ->when(
                $r->filled("vendedor"),
                fn($q) => $r->vendedor === "libres"
                    ? $q->whereNull("vendedor_id")
                    : $q->where("vendedor_id", $r->vendedor),
            );
        return view("panel.clients", [
            "clients" => $q->orderBy("nombre")->get(),
            "sellers" => User::where("rol", "vendedor")
                ->where("activo", true)
                ->when(
                    $r->user()->rol === "supervisor",
                    fn($q) => $q->where("supervisor_id", $r->user()->id),
                )
                ->get(),
            "edit" => $id
                ? $service->visibles($r->user())->findOrFail($id)
                : null,
        ]);
    }
    public function saveClient(Request $r, Cartera $service, ?int $id = null)
    {
        if ($id) {
            $service->visibles($r->user())->findOrFail($id);
        }
        $d = $r->validate([
            "nombre" => ["required", "string", "max:150"],
            "nit" => ["required", "string", "max:60"],
            "telefono" => ["required", "string", "max:60"],
            "correo" => ["nullable", "email", "max:150"],
            "vendedor_id" => ["nullable", "integer"],
        ]);
        $d["nit"] = Identidad::nit($d["nit"]);
        $d["telefono"] = Identidad::telefono($d["telefono"]);
        $target = $d["vendedor_id"] ?? null;
        unset($d["vendedor_id"]);
        $service->asignar($r->user(), $id, $target, $d);
        return redirect()
            ->route("clientes")
            ->with("success", "Cliente guardado y asignación actualizada.");
    }
    public function deleteClient(Request $r, Cartera $service, int $id)
    {
        $this->admin($r);
        DB::transaction(function () use ($service, $r, $id) {
            $c = $service
                ->visibles($r->user())
                ->lockForUpdate()
                ->findOrFail($id);
            if ($c->oportunidades()->exists()) {
                Identidad::error(
                    "general",
                    "No se puede eliminar un cliente con oportunidades.",
                );
            }
            $c->delete();
        });
        return redirect()
            ->route("clientes")
            ->with("success", "Cliente eliminado.");
    }
    public function opportunities(Request $r)
    {
        $r->validate([
            "etapa" => [
                "nullable",
                Rule::in([
                    "prospecto",
                    "calificado",
                    "propuesta",
                    "negociacion",
                    "ganada",
                    "perdida",
                ]),
            ],
            "vendedor" => ["nullable", "integer"],
        ]);
        $q = Oportunidad::with([
            "cliente",
            "vendedor",
            "lineas.producto",
            "historial.usuario",
        ])
            ->when(
                $r->user()->rol === "supervisor",
                fn($q) => $q->whereIn(
                    "vendedor_id",
                    User::where("supervisor_id", $r->user()->id)->select("id"),
                ),
            )
            ->when($r->filled("etapa"), fn($q) => $q->where("etapa", $r->etapa))
            ->when(
                $r->filled("vendedor"),
                fn($q) => $q->where("vendedor_id", $r->vendedor),
            );
        return view("panel.opportunities", [
            "opportunities" => $q->orderByDesc("id")->get(),
            "sellers" => User::where("rol", "vendedor")
                ->when(
                    $r->user()->rol === "supervisor",
                    fn($q) => $q->where("supervisor_id", $r->user()->id),
                )
                ->get(),
        ]);
    }
    public function reports(Request $r, Reportes $report)
    {
        return view("panel.reports", [
            "report" => $report->obtener($r->user(), $this->month($r)),
        ]);
    }
    public function team(Request $r, Reportes $report)
    {
        return view("panel.team", [
            "report" => $report->obtener($r->user(), $this->month($r)),
        ]);
    }
}
