/**
 * Banco vivo del Reto 2: el agente de verdad, el tablero de verdad.
 *
 * Escribe cada instrucción en la burbuja del tablero y comprueba tres cosas:
 * que el agente devuelve una especificación, que el componente trae datos, y que
 * la interfaz se movió de verdad. Esto último se mira por dos vías: el título del
 * lienzo pasa a ser el que dijo la API, y —lo que ve un humano— los píxeles del
 * lienzo cambian. El título vive en un `h2` `sr-only`, así que por sí solo prueba el
 * nombre accesible, no el dibujo; de ahí la huella de la captura.
 * No sustituye a la suite (que simula la API a propósito): esta corre contra el sistema real.
 */
import { chromium } from "@playwright/test";
import { readFileSync, writeFileSync } from "node:fs";
import { createHash } from "node:crypto";

const TABLERO = process.env.TABLERO_URL ?? "http://localhost:8080";
const casos = readFileSync(process.argv[2], "utf-8")
  .split("\n")
  .filter((l) => l.trim())
  .map((l) => JSON.parse(l));
const salida = process.argv[3];

const navegador = await chromium.launch();
const pagina = await navegador.newPage({ viewport: { width: 1440, height: 900 } });

let ultima = null;
pagina.on("response", async (r) => {
  if (!r.url().includes("/api/visualizar")) return;
  try {
    ultima = { estado: r.status(), cuerpo: await r.json() };
  } catch {
    ultima = { estado: r.status(), cuerpo: null };
  }
});

const errores = [];
pagina.on("pageerror", (e) => errores.push(String(e)));
pagina.on("console", (m) => {
  if (m.type() === "error") errores.push(m.text());
});

await pagina.goto(TABLERO, { waitUntil: "networkidle" });
const abrir = pagina.getByRole("button", { name: "Abrir el agente" });
if (await abrir.isVisible().catch(() => false)) await abrir.click();

const campo = pagina.getByRole("textbox", { name: "Instrucción en lenguaje natural" });
const boton = pagina.getByRole("button", { name: /Visualizar|Analizando/ });
const titulo = pagina.locator("#titulo-componente");
const lienzo = pagina.locator('section[aria-labelledby="titulo-componente"]');

/** Huella de lo dibujado en el lienzo. `null` si no se pudo capturar. */
async function huella() {
  try {
    return createHash("sha1").update(await lienzo.screenshot()).digest("hex");
  } catch {
    return null;
  }
}

/** Cuántas filas/celdas/nodos trae el componente. Cero = el experto ve un lienzo vacío. */
function tamanoDatos(resultado) {
  const datos = resultado?.datos;
  if (Array.isArray(datos)) return datos.length;
  if (datos && typeof datos === "object") {
    for (const clave of ["celdas", "nodos", "series", "unidades", "puntos", "grupos"]) {
      if (Array.isArray(datos[clave])) return datos[clave].length;
    }
    return Object.values(datos).reduce((n, v) => n + (Array.isArray(v) ? v.length : 0), 0);
  }
  return 0;
}

const filas = [];
for (const [i, caso] of casos.entries()) {
  const antes = await titulo.textContent().catch(() => null);
  const pintadoAntes = await huella();
  ultima = null;
  const marcaErrores = errores.length;
  const t0 = Date.now();
  await campo.fill(caso.text);
  await boton.click();
  let fallo = null;
  try {
    await pagina.waitForResponse((r) => r.url().includes("/api/visualizar"), { timeout: 180000 });
    await pagina.waitForTimeout(600); // que React pinte la vista nueva
  } catch (e) {
    fallo = String(e).slice(0, 160);
  }
  const despues = await titulo.textContent().catch(() => null);
  // El dibujo solo sirve de prueba cuando ha dejado de moverse: se reintenta hasta
  // que dos capturas seguidas coinciden. Los mapas y las líneas de tiempo animan al
  // entrar, y con una sola espera corta la mitad de los casos quedaba sin veredicto.
  let pintado2 = await huella();
  let quieto = false;
  for (let intento = 0; intento < 12; intento += 1) {
    await pagina.waitForTimeout(400);
    const siguiente = await huella();
    if (siguiente !== null && siguiente === pintado2) {
      quieto = true;
      pintado2 = siguiente;
      break;
    }
    pintado2 = siguiente;
  }
  const spec = ultima?.cuerpo?.especificacion ?? null;
  const resultado = ultima?.cuerpo?.resultado ?? null;
  const fila = {
    id: caso.query_id,
    pregunta: caso.text,
    esperado: caso.esperado ?? null,
    componente: spec?.componente ?? null,
    acierto: caso.esperado ? spec?.componente === caso.esperado : null,
    filtros: spec?.filtros ?? null,
    tituloApi: resultado?.titulo ?? null,
    tituloEnPantalla: despues,
    // Lo que de verdad importa: ¿la interfaz refleja lo que decidió el agente?
    interfazCoincide: Boolean(resultado?.titulo) && despues === resultado.titulo,
    cambio: antes !== despues,
    // Lo que ve un humano: el dibujo es otro, y ya no se está moviendo.
    lienzoRepintado: quieto && pintadoAntes !== null && pintado2 !== pintadoAntes,
    lienzoQuieto: quieto,
    evidencia: (resultado?.evidencia ?? []).length,
    datos: tamanoDatos(resultado),
    ignorados: resultado?.filtros_ignorados ?? [],
    erroresConsola: errores.slice(marcaErrores),
    fallo,
    ms: Date.now() - t0,
  };
  filas.push(fila);
  console.log(
    `${String(i + 1).padStart(3)}/${casos.length} ` +
      `${(fila.componente ?? "SIN SPEC").padEnd(23)} ` +
      `${fila.acierto === null ? "  " : fila.acierto ? "ok" : "NO"} ` +
      `ui=${fila.interfazCoincide ? "si" : "NO"} ` +
      `px=${fila.lienzoRepintado ? "si" : fila.lienzoQuieto ? "NO" : "??"} ` +
      `datos=${String(fila.datos).padStart(4)} ev=${String(fila.evidencia).padStart(3)} ` +
      `${String(fila.ms).padStart(6)}ms  ` +
      caso.text.slice(0, 52),
  );
}

writeFileSync(salida, JSON.stringify(filas, null, 1), "utf-8");
const vacias = filas.filter((f) => f.datos === 0).length;
const con = filas.filter((f) => f.componente).length;
const ui = filas.filter((f) => f.interfazCoincide).length;
const px = filas.filter((f) => f.lienzoRepintado).length;
const inquietos = filas.filter((f) => !f.lienzoQuieto).length;
const aciertos = filas.filter((f) => f.acierto === true).length;
const conEtiqueta = filas.filter((f) => f.esperado).length;
console.log(
  `\nespecificación: ${con}/${filas.length} · interfaz movida: ${ui}/${filas.length} · ` +
    `componente esperado: ${aciertos}/${conEtiqueta} · vistas en blanco: ${vacias}`,
);
if (vacias > 0) {
  console.log("");
  console.log("EN BLANCO:");
  for (const f of filas.filter((x) => x.datos === 0)) console.log(`  ${f.id} ${f.componente}  ${f.pregunta}`);
}
await navegador.close();
