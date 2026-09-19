---
name: AeroCode · Plataforma de análisis estratégico
description: Sala de operaciones para inteligencia de fuentes abiertas, con evidencia trazable a fragmento.
colors:
  noche: "#070d19"
  casco: "#0b1426"
  cabina: "#12203a"
  hilo: "#1d2c47"
  control: "#5f7499"
  texto: "#e8edf5"
  apagado: "#a7b4ca"
  tenue: "#8494ae"
  oro: "#e8b64c"
  oro-claro: "#f2c96e"
  senal: "#8cb4ff"
  ok: "#4cc38a"
  alerta: "#f28b7d"
  f1: "#e08ec0"
  f2: "#56b4e9"
  f3: "#2fc39b"
  mapa-fondo: "#0a1222"
  sin-dato: "#16223a"
typography:
  titulo-superficie:
    fontFamily: "IBM Plex Sans, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1.125rem"
    fontWeight: 600
    lineHeight: 1.25
    letterSpacing: "-0.01em"
  titulo:
    fontFamily: "IBM Plex Sans, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1rem"
    fontWeight: 600
    lineHeight: 1.3
  lectura:
    fontFamily: "IBM Plex Sans, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.65
  cuerpo:
    fontFamily: "IBM Plex Sans, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.5
  etiqueta:
    fontFamily: "IBM Plex Sans, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.75rem"
    fontWeight: 600
    lineHeight: 1.3
    letterSpacing: "0.06em"
  dato:
    fontFamily: "IBM Plex Mono, ui-monospace, Consolas, monospace"
    fontSize: "0.75rem"
    fontWeight: 400
    lineHeight: 1.4
    fontFeature: "tnum"
rounded:
  sm: "4px"
  md: "6px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "12px"
  lg: "16px"
  xl: "24px"
components:
  boton-primario:
    backgroundColor: "{colors.oro}"
    textColor: "{colors.noche}"
    rounded: "{rounded.md}"
    height: "40px"
    padding: "0 16px"
  boton-primario-hover:
    backgroundColor: "{colors.oro-claro}"
  boton-contorno:
    backgroundColor: "{colors.cabina}"
    textColor: "{colors.texto}"
    rounded: "{rounded.md}"
    height: "40px"
  campo:
    backgroundColor: "{colors.noche}"
    textColor: "{colors.texto}"
    rounded: "{rounded.md}"
    height: "44px"
  insignia:
    backgroundColor: "{colors.cabina}"
    textColor: "{colors.apagado}"
    typography: "{typography.dato}"
    rounded: "{rounded.sm}"
    padding: "2px 6px"
  cita:
    backgroundColor: "{colors.cabina}"
    textColor: "{colors.senal}"
    typography: "{typography.dato}"
    rounded: "{rounded.sm}"
    height: "22px"
  cita-activa:
    backgroundColor: "{colors.oro}"
    textColor: "{colors.noche}"
  panel:
    backgroundColor: "{colors.casco}"
    rounded: "{rounded.md}"
---

# Design System: AeroCode

## Overview

**Creative North Star: "La sala de operaciones"**

Las dos superficies de AeroCode, la consola de chat (`frontagent/`) y el tablero (`dashboard/web/`), son dos puestos de la misma sala de mando. Son oscuras porque se usan en penumbra y proyectadas. Son densas porque el analista necesita ver mucho a la vez. Son serenas porque la evidencia es lo que debe hablar. La paleta toma prestado el azul profundo y el dorado de la tradición aeroespacial colombiana a modo de guiño, sin escudos, logotipos ni nombres institucionales. La identidad es del equipo AeroCode.

El azul noche es la sala. El dorado es el mando: marca la acción principal, el foco de teclado y la selección vigente, y nada más. El azul de señal identifica lo que se puede rastrear, es decir, las citas y los enlaces a evidencia. Los tres fenómenos tienen su propio código de color, forma y rótulo, independiente de la marca, para que F1 nunca se confunda con una acción.

No hay decoración que compita con la evidencia: nada de cuadrículas de fondo, vidrio esmerilado, degradados ni neón. La profundidad sale de tres niveles tonales de azul, no de sombras.

**Key Characteristics:**

- Tres niveles de superficie azul (noche → casco → cabina) separados por hilos de 1px.
- Dorado escaso: acción primaria, foco y selección.
- IBM Plex Sans para la interfaz y IBM Plex Mono solo para identificadores y cifras (`doc_id`, `chunk_id`, tokens, latencias).
- Tamaño mínimo de 12px en todo el texto, porque todo se proyecta.
- La misma barra de mando en las dos superficies: marca AeroCode, nombre del puesto y estado del sistema.

## Colors

Azul noche institucional con un único acento dorado. El color de los datos (fenómenos y escalas) va en un canal aparte, apto para daltonismo.

### Primary

- **Oro de mando** (`oro`): botón primario, anillo de foco (2px), pestaña activa, cita seleccionada y franja superior de la barra de mando. Sobre él va el texto en `noche` (10,4:1).
- **Oro claro** (`oro-claro`): estado _hover_ del botón primario.

### Secondary

- **Azul de señal** (`senal`): citas `[n]`, enlaces a evidencia e iconos de trazabilidad. Todo lo que tiene este color se puede abrir hasta su fragmento.

### Tertiary: fenómenos (paleta Okabe–Ito adaptada a fondo oscuro)

- **F1 · IA y capacidades estratégicas** (`f1`, púrpura rojizo): marcador en círculo y trazo continuo.
- **F2 · Seguridad del entorno espacial** (`f2`, azul cielo): marcador en triángulo y trazo discontinuo.
- **F3 · Dinámicas territoriales** (`f3`, verde azulado): marcador en rombo y trazo punteado.

Todos superan 6,8:1 sobre `cabina`. El color nunca va solo: cada uso lleva el rótulo F1, F2 o F3 y, en los gráficos, además la forma del marcador y el tipo de trazo.

### Escalas de datos

- **Secuencial:** viridis (ocho paradas, en `dashboard/web/src/lib/paleta.ts`), para coropletas y matrices.
- **Categórica:** Okabe–Ito, para tipos de entidad y organizaciones.
- **Sin dato** (`sin-dato`): relleno de las regiones con conteo cero, sobre el lienzo `mapa-fondo`.

### Neutral

- **Noche** (`noche`): fondo de la página y de los campos de texto.
- **Casco** (`casco`): paneles y tarjetas.
- **Cabina** (`cabina`): elementos elevados dentro de un panel, como insignias, opciones y filas activas.
- **Hilo** (`hilo`): separadores y bordes de panel. Es puramente estructural.
- **Control** (`control`): borde de campos, selectores y botones de contorno. Tiene un contraste de 3:1 o más sobre las tres superficies (WCAG 1.4.11).
- **Texto** (`texto`), **Apagado** (`apagado`), **Tenue** (`tenue`): texto primario, secundario y terciario. El tenue (5,3:1 sobre cabina) es también el color de los _placeholders_.

### Semánticos

- **Ok** (`ok`): agente o API en línea y ejecución correcta.
- **Alerta** (`alerta`): errores y filtros ignorados. Siempre va con icono y texto.

### Named Rules

**The Gold Is Command Rule.** El dorado solo marca lo que el usuario puede ordenar ahora o lo que tiene seleccionado. Nunca se usa como decoración ni como color de un dato.

**The Signal Is Traceable Rule.** El azul de señal significa «esto abre evidencia». Si algo no lleva a un fragmento, no usa `senal`.

**The Phenomenon Never Rides Alone Rule.** El color de F1, F2 o F3 siempre va acompañado de su rótulo o de su forma.

## Typography

**Fuente de interfaz:** IBM Plex Sans (400, 500 y 600), autoalojada con `@fontsource/ibm-plex-sans`.
**Fuente de datos:** IBM Plex Mono (400 y 500), autoalojada con `@fontsource/ibm-plex-mono`.

**Character:** es una familia de ingeniería, sobria y legible a distancia. Sans y Mono comparten métricas, así que las cifras y los identificadores conviven con la prosa sin romper el ritmo. No se carga nada desde CDN, lo que garantiza que funcione en el evento sin conexión.

### Hierarchy

- **Título de superficie** (600, 1,125rem): nombre del puesto en la barra de mando.
- **Título** (600, 1rem): encabezados de componente, respuesta o panel.
- **Lectura** (400, 1rem, interlineado 1,65, máximo 75ch): el texto de las respuestas del agente, que es lo que el jurado lee.
- **Cuerpo** (400, 0,875rem): texto de interfaz, justificaciones, notas de método y fragmentos citados.
- **Etiqueta** (600, 0,75rem, mayúsculas, tracking 0,06em): rótulos de sección y de campos. Nunca por debajo de 12px.
- **Dato** (Plex Mono, 0,75rem, cifras tabulares): `doc_id`, `chunk_id`, tokens, latencias, conteos y rangos de leyenda.

### Named Rules

**The Projector Floor Rule.** Ningún texto baja de 12px (0,75rem), tampoco en gráficos, leyendas o insignias.

**The Mono Is For Data Rule.** La monoespaciada solo se usa para identificadores, cifras y parámetros. No se usa como disfraz «técnico» para títulos ni rótulos.

## Layout

- **Estructura:** barra de mando fija arriba, área de trabajo principal y un panel lateral de inspección a la derecha (Evidencia/Traza en el chat, Evidencia en el tablero), de 384 a 416px en escritorio (`lg`, 1024px o más).
- **Ritmo:** múltiplos de 4px. Grupos internos de 8 a 12px y separación entre bloques de 16px. El relleno de panel es de 16px.
- **Móvil (menos de 1024px):**
  - En el chat, un selector segmentado alterna Conversación y Evidencia/Traza. Pulsar una cita lleva a Evidencia.
  - En el tablero, el panel de evidencia pasa debajo del componente con una altura máxima de 70dvh y su propio scroll.
  - Margen lateral de 16px y sin scroll horizontal.
- **Densidad:** alta pero agrupada. Cada bloque tiene un único título y las insignias van en una sola fila con ajuste de línea.

## Elevation & Depth

Es un sistema plano con capas tonales. La profundidad se expresa con el paso noche → casco → cabina y con hilos de 1px. Solo las superficies flotantes (tooltips de gráficos, globos del mapa y leyenda sobre el mapa) llevan sombra, porque se superponen a datos.

### Shadow Vocabulary

- **Flotante** (`box-shadow: 0 8px 24px rgb(0 0 0 / 0.45)`): tooltips y globos sobre el mapa o los gráficos.

### Named Rules

**The Flat-At-Rest Rule.** Paneles y tarjetas no llevan sombra. Si algo necesita destacarse, sube un nivel tonal.

## Shapes

Esquinas contenidas: 4px en insignias y citas, 6px en botones, campos y paneles. Nada de píldoras salvo el punto de estado. Los bordes son de 1px. Una franja dorada de 2px corona la barra de mando: es la única raya de color del sistema.

## Components

### Buttons

- **Shape:** 6px de radio y 40px de alto (32px en la variante compacta).
- **Primario:** fondo `oro` con texto `noche` en peso 600. Uno por vista.
- **Hover / Focus:** en _hover_, `oro-claro`. En foco, anillo `oro` de 2px separado 2px.
- **Contorno:** fondo `cabina`, borde `control`, texto `texto`.
- **Fantasma:** texto `apagado`; en _hover_, fondo `cabina` y texto `texto`.
- **Deshabilitado:** opacidad 50% y sin puntero.

### Chips (insignias y opciones)

- **Insignia:** Plex Mono de 12px sobre `cabina` con borde `hilo`. Sirve para metadatos, no es interactiva.
- **Opción seleccionable** (fenómeno, modo, sugerencia): borde `control`. Cuando está activa, borde `oro`, fondo con un 12% de oro y texto `texto`, además de `aria-pressed`.

### Cards / Containers

- **Corner Style:** 6px.
- **Background:** `casco`, con `cabina` para las filas o zonas internas.
- **Shadow Strategy:** ninguna (ver Elevation & Depth).
- **Border:** `hilo` de 1px.
- **Internal Padding:** 16px, y 12px en listas densas.

### Inputs / Fields

- **Style:** fondo `noche`, borde `control` de 1px, radio de 6px, texto de 14 a 16px y _placeholder_ en `tenue`.
- **Focus:** anillo `oro` de 2px.
- **Error / Disabled:** en error, borde `alerta` con mensaje debajo. Deshabilitado, al 60%.

### Navigation

- **Barra de mando:** franja `oro` de 2px arriba y, sobre `casco`, la marca (icono de radar en `oro`, «AeroCode» y el nombre del puesto), el selector de modo si lo hay y el estado del sistema (punto `ok`/`alerta` y texto).
- **Pestañas:** texto de etiqueta; la activa lleva un subrayado `oro` de 2px.

### Cita trazable (componente distintivo)

Número en Plex Mono dentro de una caja de 22px sobre `cabina`, con texto `senal`. Activa, se ve en `oro` con texto `noche`. Abre el fragmento en el panel de Evidencia con su `doc_id`, `chunk_id` y texto original. El fragmento citado se muestra sobre `noche` con un borde `hilo` de 1px, nunca con una raya lateral gruesa.

### Nota de método (componente distintivo)

Todo componente del tablero termina con un pie en `cabina` que incluye un icono de matraz, el texto de `nota_metodo` y el conteo de fragmentos de evidencia. Es la respuesta visible a «¿cómo se calculó?».

## Do's and Don'ts

### Do:

- **Do** usar `oro` solo para la acción primaria, el foco y la selección vigente.
- **Do** acompañar cada color de fenómeno con su rótulo (F1/F2/F3) y, en gráficos, con su forma y su trazo.
- **Do** mantener todo texto en 12px o más y el texto de lectura en 16px con un máximo de 75ch.
- **Do** mostrar `doc_id` y `chunk_id` en Plex Mono junto a cada fragmento.
- **Do** tomar los colores de ECharts y MapLibre de `dashboard/web/src/lib/tema.ts`, espejo de estos tokens, en lugar de escribir hex sueltos.

### Don't:

- **Don't** usar logos, escudos ni nombres oficiales de la Fuerza Aeroespacial como marca.
- **Don't** usar degradados morados, neón, glassmorphism (`backdrop-blur`), partículas ni cuadrículas decorativas de fondo.
- **Don't** usar métricas gigantes decorativas, sparklines de adorno ni rejillas de tarjetas idénticas.
- **Don't** usar rayas laterales de color de más de 1px en citas, alertas o tarjetas.
- **Don't** usar emojis: siempre iconos lucide.
- **Don't** usar texto por debajo de 12px ni _placeholders_ con opacidad reducida.
