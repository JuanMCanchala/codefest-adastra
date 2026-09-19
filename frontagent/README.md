# Consola de Inteligencia (frontend del Reto 1)

Interfaz web del asistente conversacional multiagente. Se despliega como contenedor
independiente, expone **un solo puerto HTTP** y consume el agente de [`../agent`](../agent) a
través de un proxy interno, de modo que el navegador nunca habla directamente con el agente (no
hay CORS y la URL del agente no se filtra al cliente).

## Qué muestra

| Zona                     | Contenido                                                                                                                        |
| ------------------------ | -------------------------------------------------------------------------------------------------------------------------------- |
| Hilo de conversación     | Respuesta del sistema con **citas `[n]` clicables**, lista de fuentes al pie y ruta, latencia y tokens de la ejecución.           |
| Panel **Evidencia**      | Por cada cita: el fragmento recuperado (`evaluacion.retrieval_context[n-1]`), `doc_id`, `chunk_id`, fuente y título del documento. |
| Panel **Traza**          | Agentes invocados en orden, herramientas llamadas con sus parámetros y salida, tokens por agente, total, latencia y estado.       |
| Tarjeta de visualización | Si el agente devuelve `extras.visualizacion`: componente del catálogo, título, justificación, filtros y botón "abrir en el tablero". |
| Consultas preparadas     | Dos preguntas por fenómeno (F1 IA y capacidades estratégicas, F2 seguridad del entorno espacial, F3 dinámicas territoriales).     |

Al pasar el cursor o hacer clic sobre `[n]` se resalta la cita y el panel de evidencia abre ese
fragmento. El render real de los gráficos corresponde al tablero del Reto 2: aquí solo se muestra
la especificación y el enlace.

**No hay datos simulados.** Si el agente no responde, devuelve un error o supera el tiempo límite,
la consola muestra el mensaje de error con su detalle.

## Variables de entorno

Se declaran en el entorno de ejecución (Coolify → _Environment Variables_). **Nunca** se escriben
en el código ni en la imagen: el servidor las lee en cada petición, así que cambiarlas **no exige
reconstruir**.

| Variable        | Por defecto             | Descripción                                                                            |
| --------------- | ----------------------- | -------------------------------------------------------------------------------------- |
| `AGENT_URL`     | `http://localhost:8000` | Base del agente del Reto 1. El proxy consulta `POST {AGENT_URL}/chat` y `GET {AGENT_URL}/health`. |
| `DASHBOARD_URL` | _(vacío)_               | Base del tablero del Reto 2. Si está vacía, la tarjeta de visualización oculta el botón. |
| `PORT`          | `3000`                  | Puerto HTTP del contenedor.                                                            |

## Rutas propias

| Ruta           | Uso                                                                                                            |
| -------------- | -------------------------------------------------------------------------------------------------------------- |
| `POST /api/chat`  | Proxy al agente. Recibe `{"pregunta": "..."}`, reenvía `{"pregunta", "incluir_extras": true}` y aplica un tiempo límite de 90 s. Traduce los fallos a 400, 413, 502 y 504. |
| `GET /api/health` | _Healthcheck_ del contenedor. Responde 200 siempre e informa si el agente es alcanzable.                     |

## Desarrollo local

```bash
cd frontagent
npm install
AGENT_URL=http://localhost:8000 npm run dev     # Windows: $env:AGENT_URL="http://localhost:8000"; npm run dev
npm run lint
npm run build
```

La consola queda en <http://localhost:3000>.

## Docker

```bash
docker build -t frontagent ./frontagent
docker run -p 3000:3000 \
  -e AGENT_URL=https://agent.<equipo>.codefest2026.augusta.avaldigitallabs.com \
  -e DASHBOARD_URL=https://dashboard.<equipo>.codefest2026.augusta.avaldigitallabs.com \
  frontagent
```

Imagen multi-etapa sobre `node:22-alpine`, salida `standalone`, usuario sin privilegios
(`nextjs`), `EXPOSE 3000` y `HEALTHCHECK` contra `/api/health`.

## Despliegue en Coolify

1. Nueva aplicación, build pack **Dockerfile**.
2. _Base Directory_: `/frontagent`.
3. Puerto expuesto: `3000`.
4. Dominio: `frontagent.<equipo>.codefest2026.augusta.avaldigitallabs.com`.
5. Variables: `AGENT_URL` (obligatoria) y `DASHBOARD_URL` (opcional).

El agente permite el origen del frontend mediante su variable `CORS_ORIGINS`, aunque el tráfico
real sale del servidor de Next, no del navegador.

## Estructura

```
frontagent/
├── app/
│   ├── api/chat/route.ts        # proxy al agente, con tiempo límite y manejo de errores
│   ├── api/health/route.ts      # healthcheck del contenedor
│   ├── layout.tsx  page.tsx     # página servidor que inyecta DASHBOARD_URL en tiempo de ejecución
│   └── globals.css              # tema oscuro "sala de operaciones" (Tailwind v4)
├── components/
│   ├── chat/                    # redactor, burbujas, texto con citas, fuentes, sugerencias
│   ├── consola/consola.tsx      # estado de la sesión y composición de la vista
│   ├── layout/                  # barra superior e indicador de salud del agente
│   ├── paneles/                 # evidencia, traza y tarjeta de visualización
│   └── ui/                      # primitivas estilo shadcn/ui (botón, tarjeta, insignia)
└── lib/                         # contrato en TypeScript, fenómenos, sugerencias, cliente, utilidades
```
