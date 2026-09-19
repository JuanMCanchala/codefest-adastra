/** URLs de las dos superficies; se pueden sobrescribir con variables de entorno. */

function sinBarraFinal(url: string): string {
  return url.replace(/\/+$/, "");
}

export const CHAT_URL = sinBarraFinal(
  process.env["CHAT_URL"] ?? "http://localhost:3000",
);
export const TABLERO_URL = sinBarraFinal(
  process.env["TABLERO_URL"] ?? "http://localhost:8080",
);
