<?php
namespace Tests\Feature;
use Tests\TestCase;
class PanelTest extends TestCase
{
    public function test_panel_requiere_sesion(): void
    {
        $this->get("/dashboard")->assertRedirect("/login");
    }
    public function test_no_existe_registro_publico(): void
    {
        $this->get("/register")->assertNotFound();
        $this->post("/register")->assertNotFound();
    }
    public function test_login_muestra_validacion_en_espanol(): void
    {
        $this->post("/login", [])->assertSessionHasErrors([
            "email" => "Debe ingresar su correo.",
        ]);
    }
}
