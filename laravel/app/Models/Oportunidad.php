<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;
class Oportunidad extends Model
{
    protected $table = "oportunidades";
    protected $guarded = [];
    protected function casts(): array
    {
        return ["fecha_cierre" => "datetime"];
    }
    public function cliente()
    {
        return $this->belongsTo(Cliente::class, "cliente_id");
    }
    public function vendedor()
    {
        return $this->belongsTo(User::class, "vendedor_id");
    }
    public function lineas()
    {
        return $this->hasMany(Linea::class, "oportunidad_id");
    }
    public function historial()
    {
        return $this->hasMany(Historial::class, "oportunidad_id");
    }
}
