# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

- `frontagent/`: Next.js 16 (App Router, TypeScript estricto), Tailwind v4, primitivas estilo shadcn/ui y lucide-react. Consola de chat del Reto 1.
- `dashboard/web/`: Vite, React 19, TypeScript estricto, Tailwind 4, MapLibre GL, ECharts y d3-force. Tablero del Reto 2, servido por la API FastAPI de `dashboard/api/`.
- Cada superficie es un contenedor Docker desplegado en Coolify en su propio subdominio: `frontagent.aerocode…` y `dashboard.aerocode…`.

## Users

- **Evaluadores de ADL y un jurado militar y académico** de la Fuerza Aeroespacial Colombiana y la Universidad de los Andes. Llegan con preguntas propias sobre los tres fenómenos y juzgan si el sistema responde con rigor y si el agente activa la visualización correcta. Usan la interfaz en un computador, a menudo proyectada en pantalla grande durante un pitch.
- **Analistas de inteligencia estratégica**, el usuario final supuesto: necesitan respuestas verificables y trazables a la fuente, no opiniones del modelo.

## Product Purpose

Plataforma de análisis estratégico multiagente sobre tres fenómenos:

- **F1:** IA y capacidades estratégicas.
- **F2:** seguridad del entorno espacial.
- **F3:** dinámicas territoriales y amenazas regionales en América Latina y Colombia.

El **chat** responde en lenguaje natural con citas a los fragmentos del corpus. El **tablero** activa, a partir de una instrucción en lenguaje natural, el componente visual adecuado (mapa, línea de tiempo, red, matriz, cuadrante, composición o evidencia) con los datos reales del corpus.

El éxito es que el jurado confíe en lo que ve: cada afirmación y cada dato se rastrean hasta su `doc_id` y `chunk_id`.

## Positioning

Producto de inteligencia de fuentes abiertas con la disciplina de un centro de operaciones: evidencia antes que retórica. Se diferencia de un chatbot genérico porque cita, se abstiene cuando no hay evidencia y muestra su traza (agentes, herramientas, tokens y latencia). Se diferencia de un tablero estático porque el agente decide qué mostrar.

## Operating Context

Demostración presencial el sábado 19 de septiembre de 2026, con la evaluación automática de ADL sobre el endpoint y la revisión de expertos que interactúan en vivo. Pantallas de escritorio y proyector; la conectividad puede ser irregular. Las respuestas del agente tardan de 2 a 7 s, así que los estados de espera deben comunicar progreso con honestidad.

## Capabilities and Constraints

- **Solo datos reales del corpus o de la base SQL de ADL.** Está prohibido mostrar puntajes, índices o niveles de riesgo inventados (Anexo B.2.5); solo conteos, frecuencias y agregaciones.
- Todo dato visible debe poder abrir su evidencia (`doc_id`, `chunk_id` y el texto original).
- El tipo de gráfico debe corresponder a la tarea analítica: comparación, distribución, relación, tendencia, composición o espacial. Nada llamativo por sí mismo.
- Sin mapas base ni recursos remotos que dependan de tokens. Todo el texto de la interfaz en español.
- Presupuesto de modelos limitado (USD 100): la interfaz no debe disparar llamadas al agente de forma automática ni repetida.

## Brand Commitments

**Sala de operaciones con un guiño a la Fuerza Aeroespacial Colombiana.** Tema oscuro, sobrio y denso en información, con la precisión de un centro de mando. La paleta se inspira en los colores institucionales de la FAC (azul profundo y acentos dorados o amarillos) **sin usar logos, escudos ni nombres oficiales como marca**. La identidad es del equipo AeroCode.

Personalidad en tres palabras: **riguroso, sereno, preciso**.

Evitar:

- La estética genérica de IA: degradados morados, neón, glassmorphism, partículas brillantes.
- El dashboard SaaS de manual: métricas gigantes decorativas, tarjetas idénticas y sparklines de adorno.
- El ruido visual que compita con la evidencia.
- Emojis: siempre iconos SVG.

## Evidence on Hand

- Corpus oficial de 1.825 documentos y 90.613 fragmentos, con grafo de 26.961 entidades.
- 1.082 filas de alertas tempranas por municipio (del DANE, con código DIVIPOLA), menciones por país y la base SQL de ADL sobre F2.
- Métricas medidas del agente: recuperación de 1,6 a 2,1 s, respuesta de 2 a 7 s, y rechazo de inyecciones sin llamar a modelos.
- No hay testimonios, clientes ni cifras de impacto; ninguna superficie debe inventarlos.

## Product Principles

1. **La evidencia manda.** Cada afirmación lleva su cita; cada dato, su trazabilidad a un clic.
2. **Honestidad del sistema.** Mostrar lo que hizo el agente (ruta, herramientas, tokens y latencia) y abstenerse con claridad cuando no hay evidencia.
3. **Densidad legible.** Mucha información, jerarquía impecable y nada decorativo.
4. **El agente decide, la interfaz explica.** Toda visualización activada dice qué componente es, por qué se eligió y cómo se calculó (`nota_metodo`).
5. **Sobriedad institucional.** Proyectable en un auditorio y creíble ante un jurado militar.

## Accessibility & Inclusion

- Contraste WCAG AA como mínimo.
- Paletas aptas para daltonismo (viridis y Okabe-Ito) y nunca el color como único canal: etiquetas, formas y leyendas con unidades.
- Navegación por teclado, con foco visible en las citas, los nodos y las regiones.
- Legible al proyectarse: tamaños de texto que aguanten la distancia.
