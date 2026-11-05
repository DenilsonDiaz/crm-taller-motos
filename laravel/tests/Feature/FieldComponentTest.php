<?php

namespace Tests\Feature;

use Tests\TestCase;

class FieldComponentTest extends TestCase
{
    public function test_el_campo_se_renderiza_sin_error_de_sintaxis(): void
    {
        $this->withViewErrors([])
            ->blade('<x-field name="correo" label="Correo electrónico" />')
            ->assertSee('name="correo"', false)
            ->assertSee('Correo electrónico')
            ->assertDontSee('is-invalid');
    }

    public function test_el_campo_muestra_el_error_de_validacion(): void
    {
        $this->withViewErrors(['correo' => 'Revise su correo.'])
            ->blade('<x-field name="correo" label="Correo electrónico" />')
            ->assertSee('is-invalid')
            ->assertSee('Revise su correo.');
    }
}
