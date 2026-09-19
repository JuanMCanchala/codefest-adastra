# Fenómeno 2 — Seguridad espacial y órbita baja terrestre (LEO)

## Estado del tema

La órbita baja terrestre (LEO, hasta ~2 000 km de altitud) está cada vez más congestionada por el
crecimiento explosivo de constelaciones comerciales (Starlink, OneWeb, Kuiper) sumado a décadas de
lanzamientos gubernamentales y militares. El resultado es un aumento sostenido de objetos rastreados
—satélites activos, satélites muertos, etapas de cohetes y fragmentos de colisiones o pruebas
antisatélite (ASAT)— que eleva el riesgo de colisión y genera el escenario conocido como
**síndrome de Kessler**: una cascada de colisiones que vuelve inutilizables ciertas franjas
orbitales. El foco del reto es explícitamente de **informes de agencias, observatorios y think
tanks**, no de datos orbitales primarios (TLE/catálogos), por lo que la investigación debe
apoyarse en reportes de sostenibilidad espacial, no en construir un rastreador propio.

Los temas centrales del debate: (1) basura espacial y su crecimiento; (2) maniobras de mitigación
(deorbitación, escudos, evasión); (3) gobernanza y normas de tráfico espacial (Space Traffic
Management); (4) el rol de nuevos actores privados (SpaceX, Amazon) frente a agencias estatales;
(5) seguridad nacional y dependencia de infraestructura satelital dual-uso (civil/militar).

## Actores y fuentes clave

- **ESA — Space Debris Office / Space Environment Report** — informe anual de referencia sobre el
  estado del entorno espacial, número de objetos, tasa de reentradas, fragmentaciones.
  https://www.esa.int/Space_Safety/Space_Debris/ESA_s_Space_Environment_Report
- **UNOOSA** (UN Office for Outer Space Affairs) — registro de objetos espaciales, directrices de
  mitigación de basura espacial (IADC Guidelines adoptadas por la ONU). https://www.unoosa.org
- **IADC** (Inter-Agency Space Debris Coordination Committee) — coordina a las agencias espaciales
  en mitigación de desechos; el informe técnico de la Etapa 1 ya usa su reporte como fuente.
  https://www.iadc-home.org
- **NASA Orbital Debris Program Office** — publica el *Orbital Debris Quarterly News*.
  https://orbitaldebris.jsc.nasa.gov
- **Secure World Foundation** — think tank especializado en sostenibilidad espacial y gobernanza,
  publica el *Global Counterspace Capabilities Report* (anual). https://swfound.org
- **CSIS Aerospace Security Project** — análisis de seguridad espacial y competencia entre potencias.
  https://www.csis.org/programs/aerospace-security-project
- **Union of Concerned Scientists — Satellite Database** — conteo público de satélites activos por
  país/operador, actualizado periódicamente. https://www.ucsusa.org/resources/satellite-database
- **ESA / European Space Agency — ESPI** (European Space Policy Institute) — informes de política
  espacial europea. https://espi.or.at
- **Agencia Espacial Colombiana (antes Comisión Colombiana de Espacio)** — política espacial
  nacional. https://www.aec.gov.co
- **Fuerza Aeroespacial Colombiana** — rol de vigilancia y conciencia situacional espacial (SSA)
  para Colombia. https://www.fac.mil.co
- **World Economic Forum — Space Sustainability Rating** — iniciativa de calificación de
  sostenibilidad para operadores de satélites. https://www.weforum.org/projects/space-sustainability-rating

## Cifras e indicadores (por verificar contra el informe original antes de citarlas en el pitch)

- ESA suele reportar del orden de **decenas de miles de objetos rastreados mayores a 10 cm** y
  estimaciones de **cientos de miles a millones de fragmentos menores a 1 cm** — cifra exacta
  variable entre informes/años; usar el valor exacto del ESA Space Environment Report del año
  vigente en el corpus, no una cifra de memoria.
- El número de satélites activos en LEO ha crecido de forma marcada en los últimos años por el
  despliegue de constelaciones comerciales — verificar cifra exacta contra UCS Satellite Database
  o el reporte de la ESA correspondiente al año del corpus.
- No hay consenso público sobre el número exacto de eventos de "conjunción" (acercamiento cercano)
  gestionados por año; distintas fuentes (ESA, agencias nacionales) usan metodologías distintas —
  aclarar la fuente exacta si se presenta esta cifra.

## Perspectiva global / regional / Colombia

- **Global**: la responsabilidad de la congestión orbital es asimétrica (pocos países/empresas
  concentran los lanzamientos), pero el riesgo de colisión es un bien común afectado por todos;
  tensión entre innovación comercial (constelaciones de banda ancha) y sostenibilidad a largo plazo.
- **Regional (ALC)**: la región es mayoritariamente usuaria de servicios satelitales (comunicaciones,
  observación de la Tierra) más que operadora de constelaciones propias; Brasil y Argentina tienen
  programas espaciales más desarrollados; la ALC participa en foros de la ONU (COPUOS) pero con
  capacidad limitada de vigilancia espacial (SSA) propia.
- **Colombia**: cuenta con el satélite FACSAT (Fuerza Aeroespacial) y participa en COPUOS; depende
  de capacidades de SSA de terceros (EE. UU., ESA) para conciencia situacional; la Agencia Espacial
  Colombiana es de reciente creación y su rol regulatorio en tráfico espacial es incipiente.

## Preguntas probables del jurado

- ¿Cómo distingue el asistente entre datos de un informe (ESA, IADC) y una estimación no oficial?
- ¿Qué pasa si dos fuentes dan cifras distintas del número de objetos en órbita? ¿El sistema lo
  señala o elige una sin explicar la discrepancia?
- ¿Qué papel tiene Colombia en la gobernanza espacial internacional según las fuentes indexadas?
- ¿El módulo de analítica visual puede mostrar la tendencia temporal de crecimiento de desechos, o
  solo fotos estáticas de un informe?

## Visualizaciones sugeridas

- Serie de tiempo del número de objetos rastreados en órbita (por tamaño: >10 cm, 1-10 cm, <1 cm)
  según los informes anuales de la ESA/NASA disponibles en el corpus.
- Gráfico de barras de satélites activos por país/operador (usando UCS Satellite Database si está
  en el corpus, o cifras citadas en informes).
- Mapa conceptual/grafo de actores de gobernanza espacial (UNOOSA, IADC, COPUOS, agencias
  nacionales) y sus relaciones normativas, reutilizando el grafo GLiNER de la Etapa 1.
- Línea de tiempo de eventos relevantes de generación de desechos (pruebas ASAT conocidas,
  colisiones documentadas) según fuentes de los informes indexados.
- Gráfico comparativo de participación regional (ALC) vs. global en lanzamientos y operación de
  satélites, si los informes lo desagregan por región.
