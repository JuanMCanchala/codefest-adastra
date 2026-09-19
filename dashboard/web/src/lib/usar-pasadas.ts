import { useEffect, useMemo, useState } from "react";

import { type ClaveMision, type Pasada, buscarPasada, misionDe, registroDe } from "@/lib/satelites";

/**
 * Pasadas de cada misión sobre un punto: la anterior y la siguiente.
 *
 * El cálculo es caro —barrer hasta dieciséis días de órbita, segundo a segundo alrededor de
 * cada acercamiento— así que se reparte una misión por tarea del bucle de eventos y el panel
 * se va llenando en vez de congelar el tablero. El resultado se memoriza por punto y hora.
 */

export interface PasadasMision {
  clave: ClaveMision;
  anterior: Pasada | null;
  proxima: Pasada | null;
}

export interface EstadoPasadas {
  /** Quedan misiones por resolver: el panel lo dice en vez de fingir que no hay pasada. */
  calculando: boolean;
  porMision: ReadonlyMap<ClaveMision, PasadasMision>;
}

const memoria = new Map<string, PasadasMision>();

/**
 * Llave del recuerdo. El punto se redondea a centésimas de grado (un kilómetro largo, muy
 * por debajo de la franja más estrecha) y el instante a la hora en curso: dentro de esa
 * hora la respuesta no cambia de forma apreciable.
 */
function llave(clave: ClaveMision, objetivo: [number, number], hora: number): string {
  return `${clave}|${objetivo[0].toFixed(2)}|${objetivo[1].toFixed(2)}|${hora}`;
}

function calcular(clave: ClaveMision, objetivo: [number, number], ahora: Date): PasadasMision {
  const registro = registroDe(clave);
  if (!registro) {
    return { clave, anterior: null, proxima: null };
  }
  const mision = misionDe(clave);
  return {
    clave,
    anterior: buscarPasada(registro, mision, objetivo, ahora, -1),
    proxima: buscarPasada(registro, mision, objetivo, ahora, 1),
  };
}

export function usarPasadas(
  objetivo: [number, number] | null,
  claves: readonly ClaveMision[],
  activo: boolean,
): EstadoPasadas {
  const [porMision, setPorMision] = useState<ReadonlyMap<ClaveMision, PasadasMision>>(new Map());
  const [calculando, setCalculando] = useState(false);

  // Las dependencias son valores, no referencias: sin esto cada render relanzaría el barrido.
  const firma = useMemo(
    () => (objetivo ? `${objetivo[0].toFixed(2)},${objetivo[1].toFixed(2)}` : ""),
    [objetivo],
  );
  const listaClaves = useMemo(() => [...claves].sort().join(","), [claves]);

  useEffect(() => {
    if (!activo || !objetivo || listaClaves === "") {
      setPorMision(new Map());
      setCalculando(false);
      return;
    }
    const pendientes = listaClaves.split(",") as ClaveMision[];
    const ahora = new Date();
    const hora = Math.floor(ahora.getTime() / 3_600_000);
    const acumulado = new Map<ClaveMision, PasadasMision>();
    let cancelado = false;
    let temporizador = 0;

    // Lo ya memorizado se entrega de inmediato; el resto se reparte en tareas sucesivas.
    const porResolver: ClaveMision[] = [];
    for (const clave of pendientes) {
      const recordado = memoria.get(llave(clave, objetivo, hora));
      if (recordado) {
        acumulado.set(clave, recordado);
      } else {
        porResolver.push(clave);
      }
    }
    setPorMision(new Map(acumulado));
    setCalculando(porResolver.length > 0);

    const siguiente = (indice: number): void => {
      if (cancelado) return;
      if (indice >= porResolver.length) {
        setCalculando(false);
        return;
      }
      const clave = porResolver[indice]!;
      const resultado = calcular(clave, objetivo, ahora);
      memoria.set(llave(clave, objetivo, hora), resultado);
      acumulado.set(clave, resultado);
      setPorMision(new Map(acumulado));
      temporizador = window.setTimeout(() => siguiente(indice + 1), 0);
    };
    temporizador = window.setTimeout(() => siguiente(0), 0);

    return () => {
      cancelado = true;
      window.clearTimeout(temporizador);
    };
    // `objetivo` entra por `firma`: es un par de números, no una identidad estable.
  }, [activo, firma, listaClaves, objetivo]);

  return { calculando, porMision };
}
