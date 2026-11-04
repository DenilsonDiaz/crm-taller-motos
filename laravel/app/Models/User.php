<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
class User extends Authenticatable
{
    use HasFactory, Notifiable;
    protected $fillable = [
        "name",
        "email",
        "password",
        "rol",
        "supervisor_id",
        "activo",
    ];
    protected $hidden = ["password", "remember_token"];
    protected function casts(): array
    {
        return [
            "email_verified_at" => "datetime",
            "password" => "hashed",
            "activo" => "boolean",
        ];
    }
    public function supervisor()
    {
        return $this->belongsTo(self::class, "supervisor_id");
    }
    public function vendedores()
    {
        return $this->hasMany(self::class, "supervisor_id");
    }
    public function clientes()
    {
        return $this->hasMany(Cliente::class, "vendedor_id");
    }
}
