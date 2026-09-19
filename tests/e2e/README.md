# Pruebas de punta a punta (Playwright)

Suite E2E de las dos superficies de AeroCode contra los contenedores que se despliegan:

| Superficie | Contenedor | Variable | Por defecto |
| --- | --- | --- | --- |
| Consola de chat (`frontagent`) | `chat-prueba` | `CHAT_URL` | `http://localhost:3000` |
| Tablero de analítica (`dashboard`) | `tablero-prueba` | `TABLERO_URL` | `http://localhost:8080` |

Se ejecuta en dos perfiles: `escritorio` (1440×900) y `movil` (390×844, táctil).

## Presupuesto de la clave: ningún modelo se invoca

`POST /api/chat` y `POST /api/visualizar` son las dos únicas rutas que llegan a los modelos, y
**siempre** se interceptan con grabaciones reales guardadas en `fixtures/`. La guardia de
`soporte/fixtures.ts` lo impone de dos maneras:

- una ruta registrada en el contexto aborta cualquier petición a esas rutas que no atrape una
  simulación de la prueba, y
- al cerrar cada prueba se comprueba que toda petición observada a esas rutas estuvo simulada.

Si alguien añade una prueba que se olvida de simular, la prueba falla; no se gasta cuota.

El resto sí se prueba en vivo, porque es justo lo que hay que verificar: `/api/health` del chat,
y `/api/salud`, `/api/componente`, `/api/evidencia` y `/geo/*.geojson` del tablero, contra
`dashboard.db` y el `metadata.jsonl` reales.

## Qué se verifica

- **Chat** (`pruebas/chat.spec.ts`): carga inicial y estado del agente, envío por Enter y por
  botón, espera honesta, respuesta con citas numeradas que abren su fragmento, pestañas de
  evidencia y traza (agentes, herramientas, tokens por agente, latencia), rechazo de inyección
  sin citas, errores 502/504 y cuerpos no-JSON, validación del redactor y el selector móvil.
- **Tablero** (`pruebas/tablero.spec.ts`): carga inicial y estado de la API, mapa de Colombia
  por defecto con su tabla de ranking, trazabilidad de cada dato a `doc_id`/`chunk_id` con el
  texto original, el mapa dibujado (globo con nombre y cifra: regresión del mapa en blanco),
  filtros globales y de cada componente, normalización de entidades (`ELN` ≡ `eln`), vacíos
  honestos, instrucción en lenguaje natural con la especificación del agente aplicada sin
  recalcular, historial, y errores del agente.
- **En ambas**: auditoría axe (WCAG 2.x A/AA) que falla con violaciones `serious` o `critical`,
  y comprobación de que no hay desborde horizontal en ninguna vista.

Las violaciones menores de axe quedan en `test-results/axe/` y como adjunto del informe.

## Uso

```bash
npm install
npm run instalar-navegador          # chromium
npm test                            # los dos perfiles
npm run test:escritorio             # solo escritorio
npm run test:movil                  # solo móvil
npm run reporte                     # abre el informe HTML
```

Antes de lanzar la suite, `soporte/preparacion-global.ts` espera (hasta `E2E_ESPERA_MS`, 180 s
por defecto) a que ambas superficies respondan en sus rutas de salud. Los contenedores se
levantan así:

```bash
docker network create aerocode
docker run -d --name agente-prueba  --network aerocode -p 8000:8000 codefest-agent
docker run -d --name tablero-prueba --network aerocode -p 8080:8080 \
  -e AGENT_URL=http://agente-prueba:8000 codefest-dashboard
docker run -d --name chat-prueba    --network aerocode -p 3000:3000 \
  -e AGENT_URL=http://agente-prueba:8000 -e DASHBOARD_URL=http://localhost:8080 codefest-frontagent
```

MapLibre necesita WebGL: la configuración arranca Chromium con SwiftShader (WebGL por
software), que es costoso en CPU, y por eso limita el paralelismo a dos procesos
(`E2E_WORKERS` lo cambia).
