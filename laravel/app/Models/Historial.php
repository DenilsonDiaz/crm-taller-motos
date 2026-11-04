<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;
class Historial extends Model
{
    protected $table = "historial_etapas";
    protected $guarded = [];
    protected function casts(): array
    {
        return ["created_at" => "datetime"];
    }
    public $timestamps = false;
    public function usuario()
    {
        return $this->belongsTo(User::class, "usuario_id");
    }
}
