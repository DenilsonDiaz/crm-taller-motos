import { API_URL } from "./config.js";
export class ApiError extends Error {
  constructor(message, status = 0, fields = {}) {
    super(message);
    this.status = status;
    this.fields = fields;
  }
}
export async function request(
  path,
  { method = "GET", data, token, signal } = {},
) {
  let response;
  try {
    response = await fetch(API_URL + path, {
      method,
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(data !== undefined ? { "Content-Type": "application/json" } : {}),
      },
      body: data === undefined ? undefined : JSON.stringify(data),
      signal,
    });
  } catch (error) {
    if (error.name === "AbortError") throw error;
    throw new ApiError(
      "No se pudo conectar con la API. Compruebe que el servidor esté encendido y vuelva a intentarlo.",
    );
  }
  if (response.status === 204) return null;
  let payload;
  try {
    payload = await response.json();
  } catch {
    throw new ApiError(
      "El servidor respondió en un formato inesperado.",
      response.status,
    );
  }
  if (!response.ok)
    throw new ApiError(
      payload.error || "Revise los campos indicados.",
      response.status,
      payload.errores || {},
    );
  return payload;
}
