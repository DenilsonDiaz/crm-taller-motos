<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;
class Cliente extends Model
{
    protected $table = "clientes";
    protected $guarded = [];
    protected function casts(): array
    {
        return [];
    }
    public function vendedor()
    {
        return $this->belongsTo(User::class, "vendedor_id");
    }
    public function oportunidades()
    {
        return $this->hasMany(Oportunidad::class, "cliente_id");
    }
}
