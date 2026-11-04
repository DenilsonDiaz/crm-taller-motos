<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;
return new class extends Migration {
    public function up(): void
    {
        Schema::table("users", function (Blueprint $t) {
            $t->enum("rol", [
                "administrador",
                "supervisor",
                "vendedor",
            ])->default("vendedor");
            $t->foreignId("supervisor_id")
                ->nullable()
                ->constrained("users")
                ->restrictOnDelete();
            $t->boolean("activo")->default(true);
        });
        DB::statement(
            "ALTER TABLE users ADD CONSTRAINT users_supervisor_check CHECK ((rol='vendedor' AND supervisor_id IS NOT NULL) OR (rol<>'vendedor' AND supervisor_id IS NULL))",
        );
    }
    public function down(): void
    {
        DB::statement("ALTER TABLE users DROP CHECK users_supervisor_check");
        Schema::table("users", function (Blueprint $t) {
            $t->dropForeign(["supervisor_id"]);
            $t->dropColumn(["rol", "supervisor_id", "activo"]);
        });
    }
};
