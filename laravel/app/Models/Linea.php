<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;
class Linea extends Model
{
    protected $table = "oportunidad_productos";
    protected $guarded = [];
    protected function casts(): array
    {
        return ["precio_unitario" => "decimal:2"];
    }
    public function producto()
    {
        return $this->belongsTo(Producto::class, "producto_id");
    }
}
