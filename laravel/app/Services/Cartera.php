<?php
namespace App\Services;
use App\Models\{User, Cliente, Oportunidad, Actividad};
use App\Support\Identidad;
use Illuminate\Database\UniqueConstraintViolationException;
use Illuminate\Support\Facades\DB;
class Cartera
{
    public function visibles(User $actor)
    {
        return Cliente::query()->when(
            $actor->rol === "supervisor",
            fn($q) => $q->where(
                fn($q) => $q
                    ->whereNull("vendedor_id")
                    ->orWhereIn(
                        "vendedor_id",
                        User::where("supervisor_id", $actor->id)->select("id"),
                    ),
            ),
        );
    }
    public function asignar(
        User $actor,
        ?int $clientId,
        ?int $target,
        array $data = [],
    ): Cliente {
        return DB::transaction(function () use (
            $actor,
            $clientId,
            $target,
            $data,
        ) {
            $existing = $clientId
                ? $this->visibles($actor)->findOrFail($clientId)
                : null;
            $ids = array_values(
                array_unique(array_filter([$existing?->vendedor_id, $target])),
            );
            sort($ids);
            $locked = User::whereIn("id", $ids)
                ->orderBy("id")
                ->lockForUpdate()
                ->get()
                ->keyBy("id");
            $client = $existing
                ? $this->visibles($actor)
                    ->lockForUpdate()
                    ->findOrFail($clientId)
                : new Cliente();
            if ($existing && $client->vendedor_id !== $existing->vendedor_id) {
                Identidad::error(
                    "general",
                    "La asignación cambió. Recargue e intente nuevamente.",
                );
            }
            if ($target !== null && $client->vendedor_id !== $target) {
                $seller = $locked->get($target);
                if (
                    !$seller ||
                    !$seller->activo ||
                    $seller->rol !== "vendedor" ||
                    ($actor->rol === "supervisor" &&
                        $seller->supervisor_id !== $actor->id)
                ) {
                    Identidad::error(
                        "vendedor_id",
                        "Seleccione un vendedor activo de su equipo.",
                    );
                }
                if (
                    Cliente::where("vendedor_id", $target)
                        ->lockForUpdate()
                        ->get(["id"])
                        ->count() >= 10
                ) {
                    Identidad::error(
                        "vendedor_id",
                        "El vendedor ya tiene 10 clientes.",
                    );
                }
            }
            if ($client->exists && $client->vendedor_id !== $target) {
                // El vendedor y el cliente ya están bloqueados. FOR UPDATE lee
                // datos actuales, no la instantánea de la primera consulta.
                if (
                    !$target &&
                    (Oportunidad::where("cliente_id", $client->id)
                        ->whereNotIn("etapa", ["ganada", "perdida"])
                        ->lockForUpdate()
                        ->first(["id"]) !== null ||
                        Actividad::where("cliente_id", $client->id)
                            ->where("completada", false)
                            ->lockForUpdate()
                            ->first(["id"]) !== null)
                ) {
                    Identidad::error(
                        "vendedor_id",
                        "Complete las actividades pendientes y cierre las oportunidades antes de liberar el cliente.",
                    );
                }
                if ($target) {
                    Oportunidad::where("cliente_id", $client->id)
                        ->whereNotIn("etapa", ["ganada", "perdida"])
                        ->update(["vendedor_id" => $target]);
                    Actividad::where("cliente_id", $client->id)->update([
                        "vendedor_id" => $target,
                    ]);
                }
            }
            $client->fill($data);
            $client->vendedor_id = $target;
            try {
                $client->save();
            } catch (UniqueConstraintViolationException $e) {
                $detail = $e->errorInfo[2] ?? "";
                if (preg_match("/for key '[^']*clientes_nit_unique'/", $detail)) {
                    Identidad::error("nit", "Ya existe un cliente con ese NIT.");
                }
                if (preg_match("/for key '[^']*clientes_telefono_unique'/", $detail)) {
                    Identidad::error("telefono", "Ya existe un cliente con ese teléfono.");
                }
                throw $e;
            }
            return $client;
        }, 3);
    }
}
