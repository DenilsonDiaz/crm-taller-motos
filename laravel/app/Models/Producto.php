<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;
class Producto extends Model
{
    protected $table = "productos";
    protected $guarded = [];
    protected function casts(): array
    {
        return [
            "precio" => "decimal:2",
            "activo" => "boolean",
            "requiere_instalacion" => "boolean",
            "es_instalacion" => "boolean",
        ];
    }
}
