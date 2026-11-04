<?php
namespace Tests\Unit;
use PHPUnit\Framework\TestCase;
use App\Support\Identidad;
use Illuminate\Validation\ValidationException;
class IdentidadTest extends TestCase
{
    public function test_nit_y_cf(): void
    {
        $this->assertSame("4521817K", Identidad::nit("000452 1817-k"));
        $this->assertNull(Identidad::nit("CF"));
    }
    public function test_telefono(): void
    {
        $this->assertSame("55551234", Identidad::telefono("+502 (5555)-1234"));
    }
}
