/**
 * Regenera `src/lib/tle-generado.ts` con los elementos orbitales vigentes de Celestrak.
 *
 * El tablero no consulta Celestrak en tiempo de ejecución: PRODUCT.md exige que la SPA
 * abra sin red y sin llaves, así que los TLE viajan dentro del paquete. Un TLE envejece
 * —la traza se desvía unos kilómetros por semana— y por eso el panel de misiones muestra
 * siempre la antigüedad del dato. Antes de una demo, ejecutar:
 *
 *     node scripts/actualizar-tle.mjs
 *
 * Uso de red: solo aquí, en desarrollo. Celestrak es público y no pide credencial.
 */
import { writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const GRUPOS = ["resource", "weather"];

/** Los que el tablero dibuja, en el orden del panel. Ver `MISIONES` en src/lib/satelites.ts. */
const QUERIDOS = [
  "SENTINEL-2A",
  "SENTINEL-2B",
  "SENTINEL-2C",
  "SENTINEL-1A",
  "LANDSAT 8",
  "LANDSAT 9",
  "TERRA",
  "AQUA",
  "NOAA 20 (JPSS-1)",
  "NOAA 21 (JPSS-2)",
];

async function bajarGrupo(grupo) {
  const url = `https://celestrak.org/NORAD/elements/gp.php?GROUP=${grupo}&FORMAT=tle`;
  const respuesta = await fetch(url);
  if (!respuesta.ok) {
    throw new Error(`Celestrak respondio ${respuesta.status} para el grupo ${grupo}`);
  }
  return respuesta.text();
}

function trocear(texto) {
  const lineas = texto.split(/\r?\n/).filter((l) => l.trim() !== "");
  const porNombre = new Map();
  for (let i = 0; i + 2 < lineas.length; i += 3) {
    const nombre = lineas[i]?.trim();
    const l1 = lineas[i + 1];
    const l2 = lineas[i + 2];
    if (!nombre || !l1?.startsWith("1 ") || !l2?.startsWith("2 ")) continue;
    if (!porNombre.has(nombre)) porNombre.set(nombre, [l1, l2]);
  }
  return porNombre;
}

const crudos = await Promise.all(GRUPOS.map(bajarGrupo));
const catalogo = new Map();
for (const crudo of crudos) {
  for (const [nombre, par] of trocear(crudo)) {
    if (!catalogo.has(nombre)) catalogo.set(nombre, par);
  }
}

const faltan = QUERIDOS.filter((n) => !catalogo.has(n));
if (faltan.length > 0) {
  throw new Error(`Celestrak no trajo: ${faltan.join(", ")}`);
}

const entradas = QUERIDOS.map((nombre) => {
  const [l1, l2] = catalogo.get(nombre);
  return `  ${JSON.stringify(nombre)}: [\n    ${JSON.stringify(l1)},\n    ${JSON.stringify(l2)},\n  ],`;
}).join("\n");

const salida = `/**
 * Elementos orbitales de dos lineas (TLE) de las misiones que el tablero dibuja.
 *
 * ARCHIVO GENERADO - no editar a mano. Se regenera con \`node scripts/actualizar-tle.mjs\`.
 * Fuente: Celestrak (dominio publico, sin llave). Se embeben para que el tablero abra sin
 * red; la epoca de cada TLE se muestra en el panel de misiones para que nadie confunda una
 * prediccion vieja con una medicion.
 *
 * Descargado: ${new Date().toISOString()}
 */
export const TLE: Readonly<Record<string, readonly [string, string]>> = {
${entradas}
} as const;
`;

const aqui = dirname(fileURLToPath(import.meta.url));
const destino = join(aqui, "..", "src", "lib", "tle-generado.ts");
await writeFile(destino, salida, "utf8");
console.log(`Escrito ${destino} con ${QUERIDOS.length} misiones.`);
