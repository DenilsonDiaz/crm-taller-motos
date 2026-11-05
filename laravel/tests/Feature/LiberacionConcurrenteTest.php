<?php

namespace Tests\Feature;

use App\Models\{Cliente, User};
use App\Services\Cartera;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;
use PHPUnit\Framework\Attributes\DataProvider;
use Symfony\Component\Process\Process;
use Tests\TestCase;

class LiberacionConcurrenteTest extends TestCase
{
    public static function trabajos(): array
    {
        return ["oportunidad abierta" => ["oportunidad"], "actividad pendiente" => ["actividad"]];
    }

    #[DataProvider("trabajos")]
    public function test_rechaza_liberar_si_la_api_confirma_mientras_el_panel_espera(string $tipo): void
    {
        if (getenv("RUN_CONCURRENCY_TESTS") !== "1") {
            $this->markTestSkipped("Requiere una base MySQL 8.4 exclusiva de pruebas y RUN_CONCURRENCY_TESTS=1.");
        }

        // Nunca reutilice DB_* ni la conexión de desarrollo. No migra ni reinicia tablas.
        $database = getenv("TEST_DB_DATABASE") ?: "";
        $this->assertMatchesRegularExpression('/^[a-zA-Z0-9_]+_pruebas$/', $database);
        $this->assertNotEmpty(getenv("TEST_DB_USERNAME"), "Configure TEST_DB_USERNAME.");
        $connection = [
            "driver" => "mysql",
            "host" => getenv("TEST_DB_HOST") ?: "127.0.0.1",
            "port" => getenv("TEST_DB_PORT") ?: "3306",
            "database" => $database,
            "username" => getenv("TEST_DB_USERNAME"),
            "password" => getenv("TEST_DB_PASSWORD") ?: "",
            "charset" => "utf8mb4",
            "collation" => "utf8mb4_unicode_ci",
            "prefix" => "",
            "strict" => true,
            "timezone" => "+00:00",
        ];
        config([
            "database.default" => "liberacion_test",
            "database.connections.liberacion_test" => $connection,
        ]);

        $this->assertStringStartsWith("8.4.", DB::selectOne("SELECT VERSION() AS version")->version);
        DB::statement("SET SESSION TRANSACTION ISOLATION LEVEL REPEATABLE READ");
        DB::statement("SET SESSION innodb_lock_wait_timeout = 15");
        $this->assertSame("REPEATABLE-READ", DB::selectOne("SELECT @@session.transaction_isolation AS nivel")->nivel);
        // La sincronización observa una espera real; no depende de un sleep supuesto.
        DB::select("SELECT REQUESTING_THREAD_ID FROM performance_schema.data_lock_waits LIMIT 0");
        DB::select("SELECT PROCESSLIST_ID FROM performance_schema.threads LIMIT 0");

        $users = [];
        $client = null;
        $process = null;
        try {
            $suffix = bin2hex(random_bytes(8));
            foreach (["administrador", "supervisor", "vendedor"] as $rol) {
                $users[$rol] = User::create([
                    "name" => "Regresión liberación",
                    "email" => "$rol.$suffix@regresion.test",
                    "password" => bin2hex(random_bytes(16)), // El cast de Laravel genera el hash.
                    "rol" => $rol,
                    "activo" => true,
                    "supervisor_id" => $rol === "vendedor" ? $users["supervisor"]->id : null,
                ]);
            }
            do {
                $phone = "4" . random_int(1000000, 9999999);
            } while (Cliente::where("telefono", $phone)->exists());
            $seller = $users["vendedor"];
            $client = Cliente::create([
                "nombre" => "Cliente temporal de regresión",
                "telefono" => $phone,
                "vendedor_id" => $seller->id,
            ]);

            $process = new Process(
                ["node", "--input-type=module", "-e", $this->apiWorker()],
                base_path("../api"),
            );
            // Las credenciales viajan por stdin, nunca por argumentos o mensajes.
            $process->setInput(json_encode([
                "env" => [
                    "DB_HOST" => $connection["host"],
                    "DB_PORT" => $connection["port"],
                    "DB_DATABASE" => $database,
                    "DB_USERNAME" => $connection["username"],
                    "DB_PASSWORD" => $connection["password"],
                ],
                "panel" => (int) DB::selectOne("SELECT CONNECTION_ID() AS id")->id,
                "seller" => $seller->id,
                "client" => $client->id,
                "tipo" => $tipo,
            ], JSON_THROW_ON_ERROR));
            $process->setTimeout(25);
            $process->start();
            $this->assertTrue($process->waitUntil(
                fn($type, $output) => str_contains($process->getOutput(), "LISTA_PARA_CONFIRMAR"),
            ), "La API debe preparar trabajo sin confirmarlo todavía.");

            $rejected = false;
            try {
                // La primera lectura crea la instantánea antes del COMMIT de la API.
                app(Cartera::class)->asignar($users["administrador"], $client->id, null);
            } catch (ValidationException $e) {
                $rejected = true;
                $this->assertSame([
                    "vendedor_id" => ["Complete las actividades pendientes y cierre las oportunidades antes de liberar el cliente."],
                ], $e->errors());
            }
            $process->wait();
            $this->assertSame(0, $process->getExitCode(), "La API debe confirmar después de observar la espera del panel.");
            $this->assertStringContainsString("ESPERA_OBSERVADA", $process->getOutput());
            $this->assertStringContainsString("CONFIRMADO", $process->getOutput());
            $this->assertTrue($rejected, "El panel no debe liberar usando la instantánea anterior.");
            $this->assertSame($seller->id, $client->fresh()->vendedor_id);
            $table = $tipo === "oportunidad" ? "oportunidades" : "actividades";
            $this->assertSame(1, DB::table($table)->where("cliente_id", $client->id)->count());

            // Camino permitido: sin trabajo pendiente sí se puede liberar.
            if ($tipo === "oportunidad") {
                DB::table("oportunidades")->where("cliente_id", $client->id)->delete();
            } else {
                DB::table("actividades")->where("cliente_id", $client->id)->update(["completada" => true]);
            }
            app(Cartera::class)->asignar($users["administrador"], $client->id, null);
            $this->assertNull($client->fresh()->vendedor_id);
        } finally {
            if ($process?->isRunning()) {
                $process->stop(0);
            }
            // Solo elimina filas creadas por esta prueba; no toca las semillas.
            if ($client) {
                DB::table("oportunidades")->where("cliente_id", $client->id)->delete();
                DB::table("clientes")->where("id", $client->id)->delete();
            }
            foreach (array_reverse($users) as $user) {
                DB::table("users")->where("id", $user->id)->delete();
            }
            DB::disconnect("liberacion_test");
        }
    }

    private function apiWorker(): string
    {
        return <<<'JS'
import { createPool } from "./src/db.js";
import { createService } from "./src/service.js";
let input = "";
for await (const chunk of process.stdin) input += chunk;
const data = JSON.parse(input);
const pool = createPool(data.env);
let observer;
try {
  observer = await pool.getConnection();
  const getConnection = pool.getConnection.bind(pool);
  pool.getConnection = async () => {
    const db = await getConnection();
    await db.query("SET SESSION TRANSACTION ISOLATION LEVEL REPEATABLE READ");
    const [[connection]] = await db.query("SELECT CONNECTION_ID() AS id");
    const commit = db.commit.bind(db);
    db.commit = async () => {
      console.log("LISTA_PARA_CONFIRMAR");
      const limit = Date.now() + 10000;
      while (Date.now() < limit) {
        const [waits] = await observer.execute(
          "SELECT 1 FROM performance_schema.data_lock_waits w JOIN performance_schema.threads r ON r.THREAD_ID=w.REQUESTING_THREAD_ID JOIN performance_schema.threads b ON b.THREAD_ID=w.BLOCKING_THREAD_ID WHERE r.PROCESSLIST_ID=? AND b.PROCESSLIST_ID=? LIMIT 1",
          [data.panel, connection.id],
        );
        if (waits.length) {
          console.log("ESPERA_OBSERVADA");
          await commit();
          console.log("CONFIRMADO");
          return;
        }
        await new Promise(resolve => setTimeout(resolve, 20));
      }
      throw new Error("No se observó la espera del panel.");
    };
    return db;
  };
  const service = createService(pool);
  if (data.tipo === "oportunidad") {
    await service.createOpportunity(data.seller, { cliente_id: data.client, titulo: "Trabajo concurrente" });
  } else {
    await service.createActivity(data.seller, data.client, { tipo: "tarea", descripcion: "Trabajo concurrente" });
  }
} catch {
  console.error("Falló la prueba concurrente de la API; revise MySQL y los permisos de observación.");
  process.exitCode = 1;
} finally {
  observer?.release();
  await pool.end();
}
JS;
    }
}
