---
name: AeroCode · Plataforma de análisis estratégico
description: Sala de operaciones para inteligencia de fuentes abiertas, con evidencia trazable a fragmento.
colors:
  fondo: "#0a0a0a"
  panel: "#111111"
  elevado: "#1a1a1a"
  borde: "#262626"
  control: "#404040"
  texto: "#ededed"
  apagado: "#a1a1a1"
  tenue: "#8f8f8f"
  acento: "#fafafa"
  acento-claro: "#ffffff"
  senal: "#3291ff"
  ok: "#46a758"
  alerta: "#e5484d"
  f1: "#b087d6"
  f2: "#6aa9f0"
  f3: "#63b37a"
  mapa-fondo: "#0a0a0a"
  sin-dato: "#1c1c1c"
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
    backgroundColor: "{colors.acento}"
    textColor: "{colors.fondo}"
    rounded: "{rounded.md}"
    height: "40px"
    padding: "0 16px"
  boton-primario-hover:
    backgroundColor: "{colors.acento-claro}"
  boton-contorno:
    backgroundColor: "{colors.elevado}"
    textColor: "{colors.texto}"
    rounded: "{rounded.md}"
    height: "40px"
  campo:
    backgroundColor: "{colors.fondo}"
    textColor: "{colors.texto}"
    rounded: "{rounded.md}"
    height: "44px"
  insignia:
    backgroundColor: "{colors.elevado}"
    textColor: "{colors.apagado}"
    typography: "{typography.dato}"
    rounded: "{rounded.sm}"
    padding: "2px 6px"
  cita:
    backgroundColor: "{colors.elevado}"
    textColor: "{colors.senal}"
    typography: "{typography.dato}"
    rounded: "{rounded.sm}"
    height: "22px"
  cita-activa:
    backgroundColor: "{colors.acento}"
    textColor: "{colors.fondo}"
  panel:
    backgroundColor: "{colors.panel}"
    rounded: "{rounded.md}"
---

# Design System: AeroCode

## Overview

**Creative North Star: "El instrumento, no el tablero de mandos"**

Las dos superficies de AeroCode, la consola de chat (`frontagent/`) y el tablero (`dashboard/web/`), son herramientas de análisis, no una puesta en escena. La interfaz es **gris neutro puro** y el único color de la pantalla es el dato. Es el reparto que usan los sistemas de producto que mejor envejecen (Vercel Geist, Linear, Stripe): escala neutra sin matiz, jerarquía por luminosidad y tipografía, y un acento que no compite con el contenido.

No hay identidad institucional, ni azul aeroespacial, ni dorado de mando: esa paleta convertía cada botón en un elemento tan llamativo como el mapa. Aquí la acción se marca con **claridad** (blanco sobre negro), no con matiz. El azul de señal identifica lo que se puede rastrear, es decir, las citas y los enlaces a evidencia. Los tres fenómenos tienen su propio código de color, forma y rótulo, para que F1 nunca se confunda con una acción.

Nada de cuadrículas de fondo, vidrio esmerilado, degradados ni neón. La profundidad sale de tres niveles de gris, no de sombras.

**Key Characteristics:**

- Tres niveles de superficie neutra (fondo → panel → elevado) separados por bordes de 1px.
- Acento acromático: blanco para la acción primaria, el foco y la selección.
- IBM Plex Sans para la interfaz y IBM Plex Mono solo para identificadores y cifras (`doc_id`, `chunk_id`, tokens, latencias).
- Tamaño mínimo de 12px en todo el texto, porque todo se proyecta.
- La misma barra en las dos superficies: marca AeroCode, nombre del puesto y el enlace a la otra mitad del sistema.

## Colors

Gris neutro sin matiz, con un acento acromático. El color de los datos (fenómenos y escalas) va en un canal aparte, apto para daltonismo.

### Primary

- **Acento** (`acento`, blanco): botón primario, anillo de foco (2px), pestaña activa y cita seleccionada. Sobre él va el texto en `fondo` (18,9:1).
- **Acento claro** (`acento-claro`): estado _hover_ del botón primario.

### Secondary

- **Azul de señal** (`senal`): citas `[n]`, enlaces a evidencia e iconos de trazabilidad. Todo lo que tiene este color se puede abrir hasta su fragmento.

### Tertiary: fenómenos (paleta Okabe–Ito adaptada a fondo oscuro)

- **F1 · IA y capacidades estratégicas** (`f1`, púrpura): marcador en círculo y trazo continuo.
- **F2 · Seguridad del entorno espacial** (`f2`, azul): marcador en triángulo y trazo discontinuo.
- **F3 · Dinámicas territoriales** (`f3`, verde): marcador en rombo y trazo punteado.

Todos superan 6,5:1 sobre `elevado`. El color nunca va solo: cada uso lleva el rótulo F1, F2 o F3 y, en los gráficos, además la forma del marcador y el tipo de trazo.

### Escalas de datos

- **Secuencial:** rampa azul de un solo matiz, ocho paradas (`dashboard/web/src/lib/paleta.ts`), para coropletas y matrices. Sustituye a viridis: un solo matiz ordena por claridad, así que se lee con cualquier tipo de daltonismo y también en blanco y negro, y no mete tres colores nuevos en una interfaz gris.
- **Categórica:** Okabe–Ito con la saturación rebajada, para tipos de entidad y organizaciones.
- **Sin dato** (`sin-dato`): relleno de las regiones con conteo cero, sobre el lienzo `mapa-fondo`.

### Neutral

- **Fondo** (`fondo`): fondo de la página y de los campos de texto.
- **Panel** (`panel`): paneles y tarjetas.
- **Elevado** (`elevado`): elementos elevados dentro de un panel, como insignias, opciones y filas activas.
- **Borde** (`borde`): separadores y bordes de panel. Es puramente estructural.
- **Control** (`control`): borde de campos, selectores y botones de contorno. Tiene un contraste de 3:1 o más sobre las tres superficies (WCAG 1.4.11).
- **Texto** (`texto`), **Apagado** (`apagado`), **Tenue** (`tenue`): texto primario, secundario y terciario. El tenue (4,8:1 sobre `elevado`) es también el color de los _placeholders_.

### Semánticos

- **Ok** (`ok`): agente o API en línea y ejecución correcta.
- **Alerta** (`alerta`): errores y filtros ignorados. Siempre va con icono y texto.

### Named Rules

**The Chrome Has No Hue Rule.** La interfaz no lleva matiz. Si algo tiene color, o es un dato, o es una cita, o es un estado del sistema. Un botón, un borde o una pestaña nunca se colorean.

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

Es un sistema plano con capas tonales. La profundidad se expresa con el paso fondo → panel → elevado y con bordes de 1px. Solo las superficies flotantes (tooltips de gráficos, globos del mapa y leyenda sobre el mapa) llevan sombra, porque se superponen a datos.

### Shadow Vocabulary

- **Flotante** (`box-shadow: 0 8px 24px rgb(0 0 0 / 0.45)`): tooltips y globos sobre el mapa o los gráficos.

### Named Rules

**The Flat-At-Rest Rule.** Paneles y tarjetas no llevan sombra. Si algo necesita destacarse, sube un nivel tonal.

## Shapes

Esquinas contenidas: 4px en insignias y citas, 6px en botones, campos y paneles. Nada de píldoras salvo el punto de estado. Los bordes son de 1px y no hay ninguna raya de color en el sistema.

## Components

### Buttons

- **Shape:** 6px de radio y 40px de alto (32px en la variante compacta).
- **Primario:** fondo `acento` con texto `fondo` en peso 600. Uno por vista.
- **Hover / Focus:** en _hover_, `acento-claro`. En foco, anillo `acento` de 2px separado 2px.
- **Contorno:** fondo `elevado`, borde `control`, texto `texto`.
- **Fantasma:** texto `apagado`; en _hover_, fondo `elevado` y texto `texto`.
- **Deshabilitado:** opacidad 50% y sin puntero.

### Chips (insignias y opciones)

- **Insignia:** Plex Mono de 12px sobre `elevado` con borde `borde`. Sirve para metadatos, no es interactiva.
- **Opción seleccionable** (fenómeno, pestaña, sugerencia): borde `control`. Cuando está activa, borde `acento`, fondo con un 10% de `acento` y texto `texto`, además de `aria-pressed`.

### Cards / Containers

- **Corner Style:** 6px.
- **Background:** `panel`, con `elevado` para las filas o zonas internas.
- **Shadow Strategy:** ninguna (ver Elevation & Depth).
- **Border:** `borde` de 1px.
- **Internal Padding:** 16px, y 12px en listas densas.

### Inputs / Fields

- **Style:** fondo `fondo`, borde `control` de 1px, radio de 6px, texto de 14 a 16px y _placeholder_ en `tenue`.
- **Focus:** anillo `acento` de 2px.
- **Error / Disabled:** en error, borde `alerta` con mensaje debajo. Deshabilitado, al 60%.

### Navigation

- **Barra superior:** sobre `panel`, la marca («AeroCode» y el nombre del puesto) y el enlace a la otra superficie. Sin franja de color ni estado permanente: el estado solo aparece cuando falla.
- **Pestañas:** texto de etiqueta; la activa lleva un subrayado `acento` de 2px.

### Ventana del agente (componente distintivo)

La superficie principal del tablero. Flota sobre el lienzo en vez de apilarse encima de él,
porque lo que se pregunta cambia el gráfico de detrás y las dos cosas tienen que verse a la vez.

- **Cerrada:** burbuja de 48px en la esquina inferior derecha, con borde `borde` y sombra
  flotante. Es lo único que queda del agente cuando estorba.
- **Compacta:** 360px de ancho, anclada abajo a la derecha del panel de evidencia y arrastrable
  por el asidero de la cabecera (también con las flechas del teclado, y con `Mayús` para ir más
  rápido). Alto máximo de 60dvh. Debajo de `lg` no se arrastra: se ancla abajo como hoja.
- **Ampliada:** ocupa la ventana. La conversación queda en una columna de 420px y el gráfico
  con sus cifras en el resto, para leer la respuesta y comprobarla sin cambiar de sitio. Se sale
  con `Esc`.
- **Cifras de la respuesta:** en la ventana compacta, cada respuesta lleva de dos a cuatro cifras
  (`dl`) sacadas de los mismos `datos` que se dibujan. Nunca se estiman ni se extrapolan.

**The Ask, Don't Configure Rule.** El tablero no tiene mandos manuales: el componente, los
filtros y el rango de años se piden hablando. Un control que duplique lo que decide el agente
acaba mintiendo sobre lo que muestra el gráfico.

### Cita trazable (componente distintivo)

Número en Plex Mono dentro de una caja de 22px sobre `elevado`, con texto `senal`. Activa, se ve en `acento` con texto `fondo`. Abre el fragmento en el panel de Evidencia con su `doc_id`, `chunk_id` y texto original. El fragmento citado se muestra sobre `fondo` con un borde `borde` de 1px, nunca con una raya lateral gruesa.

### Nota de método (componente distintivo)

La nota de método de cada componente vive en el icono de ayuda de su cabecera y se abre al pasar el ratón o al enfocarlo con el teclado. Es la respuesta a «¿cómo se calculó?» sin gastar una tira de pantalla en cada vista.

## Do's and Don'ts

### Do:

- **Do** usar `acento` solo para la acción primaria, el foco y la selección vigente.
- **Do** acompañar cada color de fenómeno con su rótulo (F1/F2/F3) y, en gráficos, con su forma y su trazo.
- **Do** mantener todo texto en 12px o más y el texto de lectura en 16px con un máximo de 75ch.
- **Do** mostrar `doc_id` y `chunk_id` en Plex Mono junto a cada fragmento.
- **Do** tomar los colores de ECharts y MapLibre de `dashboard/web/src/lib/tema.ts`, espejo de estos tokens, en lugar de escribir hex sueltos.

### Don't:

- **Don't** usar logos, escudos, nombres oficiales ni la paleta institucional de ninguna fuerza como marca.
- **Don't** dar matiz a la interfaz: si un borde, un botón o una pestaña lleva color, está mal.
- **Don't** usar degradados morados, neón, glassmorphism (`backdrop-blur`), partículas ni cuadrículas decorativas de fondo.
- **Don't** usar métricas gigantes decorativas, sparklines de adorno ni rejillas de tarjetas idénticas.
- **Don't** usar rayas laterales de color de más de 1px en citas, alertas o tarjetas.
- **Don't** usar emojis: siempre iconos lucide.
- **Don't** usar texto por debajo de 12px ni _placeholders_ con opacidad reducida.
