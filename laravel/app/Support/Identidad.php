<?php
namespace App\Support;
use Illuminate\Validation\ValidationException;
class Identidad
{
    public static function nit($value): ?string
    {
        if (!is_string($value)) {
            self::error("nit", "Escriba un NIT válido o CF.");
        }
        $n = strtoupper(preg_replace("/[\s-]/", "", $value));
        if ($n === "CF") {
            return null;
        }
        $n = ltrim($n, "0");
        if (
            !preg_match('/^[0-9]+[0-9K]$/', $n) ||
            strlen($n) < 2 ||
            strlen($n) > 12
        ) {
            self::error("nit", "Escriba un NIT válido o CF.");
        }
        $sum = 0;
        $digits = strrev(substr($n, 0, -1));
        foreach (str_split($digits) as $i => $d) {
            $sum += (int) $d * ($i + 2);
        }
        $v = (11 - ($sum % 11)) % 11;
        if (substr($n, -1) !== ($v === 10 ? "K" : (string) $v)) {
            self::error("nit", "El dígito verificador del NIT no es válido.");
        }
        return $n;
    }
    public static function telefono($value): string
    {
        if (!is_string($value) || !preg_match('/^[0-9\s().+\-]+$/', $value)) {
            self::error("telefono", "Escriba un teléfono de Guatemala válido.");
        }
        $n = preg_replace("/[\s().-]/", "", $value);
        if (str_starts_with($n, "+502")) {
            $n = substr($n, 4);
        } elseif (strlen($n) === 11 && str_starts_with($n, "502")) {
            $n = substr($n, 3);
        }
        if (!preg_match('/^[2-9][0-9]{7}$/', $n)) {
            self::error(
                "telefono",
                "Escriba un teléfono de Guatemala de 8 dígitos.",
            );
        }
        return $n;
    }
    public static function error(string $field, string $message): never
    {
        throw ValidationException::withMessages([$field => $message]);
    }
}
