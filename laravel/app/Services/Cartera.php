<?php
namespace App\Services;
use App\Models\{User, Cliente, Oportunidad, Actividad};
use App\Support\Identidad;
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
            if ($target) {
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
                    $client->vendedor_id !== $target &&
                    Cliente::where("vendedor_id", $target)->count() >= 10
                ) {
                    Identidad::error(
                        "vendedor_id",
                        "El vendedor ya tiene 10 clientes.",
                    );
                }
            }
            if ($client->exists && $client->vendedor_id !== $target) {
                if (
                    !$target &&
                    (Oportunidad::where("cliente_id", $client->id)
                        ->whereNotIn("etapa", ["ganada", "perdida"])
                        ->exists() ||
                        Actividad::where("cliente_id", $client->id)
                            ->where("completada", false)
                            ->exists())
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
            $client->save();
            return $client;
        }, 3);
    }
}
