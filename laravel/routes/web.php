<?php
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\PanelController;
use App\Http\Controllers\Auth\AuthenticatedSessionController;
Route::get("/", fn() => redirect()->route("dashboard"));
Route::middleware("guest")->group(function () {
    Route::get("/login", [
        AuthenticatedSessionController::class,
        "create",
    ])->name("login");
    Route::post("/login", [AuthenticatedSessionController::class, "store"]);
});
Route::post("/logout", [AuthenticatedSessionController::class, "destroy"])
    ->middleware("auth")
    ->name("logout");
Route::middleware(["auth", "panel"])->group(function () {
    Route::get("/dashboard", [PanelController::class, "dashboard"])->name(
        "dashboard",
    );
    Route::get("/cuentas", [PanelController::class, "users"])->name("users");
    Route::get("/cuentas/{user}/editar", [
        PanelController::class,
        "editUser",
    ])->name("users.edit");
    Route::post("/cuentas", [PanelController::class, "saveUser"])->name(
        "users.store",
    );
    Route::put("/cuentas/{user}", [PanelController::class, "saveUser"])->name(
        "users.update",
    );
    Route::get("/productos", [PanelController::class, "products"])->name(
        "productos",
    );
    Route::get("/productos/{producto}/editar", [
        PanelController::class,
        "products",
    ])->name("productos.edit");
    Route::post("/productos", [PanelController::class, "saveProduct"])->name(
        "productos.store",
    );
    Route::put("/productos/{producto}", [
        PanelController::class,
        "saveProduct",
    ])->name("productos.update");
    Route::get("/clientes", [PanelController::class, "clients"])->name(
        "clientes",
    );
    Route::get("/clientes/{id}/editar", [
        PanelController::class,
        "clients",
    ])->name("clientes.edit");
    Route::post("/clientes", [PanelController::class, "saveClient"])->name(
        "clientes.store",
    );
    Route::put("/clientes/{id}", [PanelController::class, "saveClient"])->name(
        "clientes.update",
    );
    Route::delete("/clientes/{id}", [
        PanelController::class,
        "deleteClient",
    ])->name("clientes.delete");
    Route::get("/oportunidades", [
        PanelController::class,
        "opportunities",
    ])->name("oportunidades");
    Route::get("/reportes", [PanelController::class, "reports"])->name(
        "reportes",
    );
    Route::get("/equipo", [PanelController::class, "team"])->name("equipo");
});
