<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;
class Actividad extends Model
{
    protected $table = "actividades";
    protected $guarded = [];
    protected function casts(): array
    {
        return ["vence_en" => "datetime", "completada" => "boolean"];
    }
}
