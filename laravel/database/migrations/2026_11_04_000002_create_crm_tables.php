<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;
return new class extends Migration {
    public function up(): void
    {
        Schema::create("productos", function (Blueprint $t) {
            $t->id();
            $t->string("nombre", 120)->unique();
            $t->decimal("precio", 10, 2);
            $t->boolean("activo")->default(true);
            $t->boolean("requiere_instalacion")->default(false);
            $t->boolean("es_instalacion")->default(false);
            $t->timestamps();
        });
        Schema::create("clientes", function (Blueprint $t) {
            $t->id();
            $t->foreignId("vendedor_id")
                ->nullable()
                ->constrained("users")
                ->restrictOnDelete();
            $t->string("nombre", 150);
            $t->string("nit", 12)->nullable()->unique();
            $t->char("telefono", 8)->unique();
            $t->string("correo", 150)->nullable();
            $t->timestamps();
        });
        Schema::create("oportunidades", function (Blueprint $t) {
            $t->id();
            $t->foreignId("cliente_id")
                ->constrained("clientes")
                ->restrictOnDelete();
            $t->foreignId("vendedor_id")
                ->constrained("users")
                ->restrictOnDelete();
            $t->string("titulo", 150);
            $t->enum("etapa", [
                "prospecto",
                "calificado",
                "propuesta",
                "negociacion",
                "ganada",
                "perdida",
            ])->default("prospecto");
            $t->string("motivo_perdida", 255)->nullable();
            $t->dateTime("fecha_cierre")->nullable();
            $t->timestamps();
        });
        Schema::create("oportunidad_productos", function (Blueprint $t) {
            $t->id();
            $t->foreignId("oportunidad_id")
                ->constrained("oportunidades")
                ->cascadeOnDelete();
            $t->foreignId("producto_id")
                ->constrained("productos")
                ->restrictOnDelete();
            $t->smallInteger("cantidad");
            $t->decimal("precio_unitario", 10, 2);
            $t->timestamps();
            $t->unique(["oportunidad_id", "producto_id"]);
        });
        Schema::create("historial_etapas", function (Blueprint $t) {
            $t->id();
            $t->foreignId("oportunidad_id")
                ->constrained("oportunidades")
                ->cascadeOnDelete();
            $t->foreignId("usuario_id")
                ->constrained("users")
                ->restrictOnDelete();
            $t->enum("etapa_anterior", [
                "prospecto",
                "calificado",
                "propuesta",
                "negociacion",
                "ganada",
                "perdida",
            ])->nullable();
            $t->enum("etapa_nueva", [
                "prospecto",
                "calificado",
                "propuesta",
                "negociacion",
                "ganada",
                "perdida",
            ]);
            $t->dateTime("created_at");
        });
        Schema::create("actividades", function (Blueprint $t) {
            $t->id();
            $t->foreignId("cliente_id")
                ->constrained("clientes")
                ->cascadeOnDelete();
            $t->foreignId("vendedor_id")
                ->constrained("users")
                ->restrictOnDelete();
            $t->enum("tipo", ["llamada", "reunion", "tarea"]);
            $t->string("descripcion", 500);
            $t->dateTime("vence_en")->nullable();
            $t->boolean("completada")->default(false);
            $t->timestamps();
        });
        DB::statement(
            "ALTER TABLE productos ADD CONSTRAINT productos_precio_check CHECK (precio > 0)",
        );
        DB::statement(
            "ALTER TABLE clientes ADD CONSTRAINT clientes_telefono_check CHECK (REGEXP_LIKE(telefono,'^[2-9][0-9]{7}$'))",
        );
        DB::statement(
            "ALTER TABLE oportunidad_productos ADD CONSTRAINT lineas_cantidad_check CHECK (cantidad BETWEEN 1 AND 999), ADD CONSTRAINT lineas_precio_check CHECK (precio_unitario > 0)",
        );
        DB::statement(
            "ALTER TABLE oportunidades ADD CONSTRAINT oportunidades_cierre_check CHECK ((etapa IN ('ganada','perdida') AND fecha_cierre IS NOT NULL) OR (etapa NOT IN ('ganada','perdida') AND fecha_cierre IS NULL)), ADD CONSTRAINT oportunidades_motivo_check CHECK ((etapa='perdida' AND motivo_perdida IS NOT NULL AND CHAR_LENGTH(TRIM(motivo_perdida)) BETWEEN 1 AND 255) OR (etapa<>'perdida' AND motivo_perdida IS NULL))",
        );
    }
    public function down(): void
    {
        foreach (
            [
                "actividades",
                "historial_etapas",
                "oportunidad_productos",
                "oportunidades",
                "clientes",
                "productos",
            ]
            as $table
        ) {
            Schema::dropIfExists($table);
        }
    }
};
