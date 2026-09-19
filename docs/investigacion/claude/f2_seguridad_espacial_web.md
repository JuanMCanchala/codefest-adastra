# Fenómeno 2: seguridad del entorno espacial y órbita baja terrestre (LEO)

Investigación web para la final del CODEFEST AD ASTRA 2026. Fecha de corte: 18 de septiembre de 2026. Se priorizan fuentes de 2024 a 2026.

**Convenciones**

- **[H]** es un hecho tomado de la fuente citada. **[I]** es interpretación o análisis de este documento.
- **Por verificar** indica que el dato no se pudo confirmar en una fuente primaria abierta durante la investigación, o que las fuentes se contradicen.
- Todas las URL se abrieron con WebFetch, salvo las marcadas "(solo buscador)": esas se vieron únicamente en el resumen del buscador y su dato queda "por verificar".
- Las métricas de "satélites activos" cambian según quién cuenta y cómo define "activo" (ver 3.1). No se deben mezclar sin aclarar la fuente.

---

## 1. Resumen ejecutivo: 10 hallazgos

1. **[H] La población orbital crece más rápido que nunca.** Según el modelo MASTER-8 de ESA (febrero de 2026) hay unos 68.450 objetos de más de 10 cm, 1,5 millones entre 1 y 10 cm y 230 millones entre 1 mm y 1 cm. Las redes de vigilancia siguen de forma regular unos 46.870 objetos (ESA DISCOS, 31 de julio de 2026).
2. **[H] ESA dice que el entorno empeoró "un orden de magnitud" en un año.** El Informe del Entorno Espacial 2026 (14 de septiembre de 2026) reporta que su índice de salud pasó de aproximadamente 4 a 50 y que ESA acortó su horizonte de proyección de 200 a 100 años. En 2025 hubo más de 300 lanzamientos y más de 4.000 cargas útiles nuevas.
3. **[H] Starlink domina LEO.** Tenía 11.127 satélites en órbita, 11.112 de ellos operativos, al 17 de septiembre de 2026 (catálogo de J. McDowell). Entre diciembre de 2025 y mayo de 2026 hizo 207.152 maniobras de evasión, y más de 355.000 en doce meses.
4. **[H] El margen de error se redujo a días.** El "CRASH Clock" estima cuánto tardaría una colisión catastrófica en LEO si todos los satélites dejaran de maniobrar. Pasó de 164 días (2018) a 5,5 días (2025), según Thiele et al. (arXiv), y marca 2,2 días según el Outer Space Institute (15 de agosto de 2026).
5. **[H] China inició dos megaconstelaciones, con alrededor de 28.000 satélites planeados entre ambas.** Guowang tiene unos 186 en órbita y Qianfan unos 238 (septiembre de 2026). Qianfan opera entre unos 800 y 1.160 km, donde los restos pueden durar décadas. La etapa superior Long March 6A que lanzó a Qianfan se fragmentó en agosto de 2024 y dejó al menos 283 piezas rastreables.
6. **[H] Las pruebas ASAT destructivas dejan herencias de larga duración.** La prueba china de 2007 (865 km) generó 3.531 fragmentos catalogados, y 2.319 seguían rastreados en julio de 2026. Las pruebas de India en 2019 y Rusia en 2021 se hicieron a menor altitud y hoy dejan 0 y 4 fragmentos, respectivamente. La ONU adoptó en diciembre de 2022 la resolución 77/41 contra estas pruebas (155 votos a favor, 9 en contra, 9 abstenciones).
7. **[H] El contraespacio se usa hoy mediante medios no destructivos.** SWF 2025 documenta más de 10.000 eventos de interferencia satelital entre febrero de 2024 y febrero de 2025. CSIS 2026 destaca operaciones de proximidad, recarga de combustible en GEO por China y _spoofing_ de GPS contra terminales Starlink.
8. **[H] La gobernanza avanza pero sigue fragmentada y en gran parte es voluntaria.** Incluye el Tratado de 1967, las directrices IADC/COPUOS de 2007, las 21 directrices de sostenibilidad a largo plazo (LTS) de 2019, la regla de 5 años de la FCC (vigente desde el 29 de septiembre de 2024), la Carta Zero Debris (228 firmantes, 21 de ellos Estados, mayo de 2026) y la propuesta de EU Space Act (25 de junio de 2025). El sistema civil de tráfico espacial de EE. UU. (TraCSS) sigue en fase piloto por falta de presupuesto.
9. **[H] América Latina está fragmentada institucionalmente.** ALCE celebró su primera Asamblea el 20 de febrero de 2026 con 6 miembros; Brasil, Colombia y Uruguay asistieron como observadores. México disolvió su agencia espacial (AEM) en 2025. La región depende de activos envejecidos, como el Túpac Katari boliviano (vida útil hasta 2030) y PeruSat-1 (lanzado en 2016), y de proveedores extranjeros de LEO.
10. **[H/I] Colombia tiene capacidad propia pequeña pero real, y su identidad institucional está en disputa.** Operó FACSAT-1 (2018 a 2023) y opera FACSAT-2 (desde 2023) desde el SpOC de Cali (2022). Tiene un acuerdo de conciencia situacional con el Comando Espacial de EE. UU. y firmó los Acuerdos Artemis (2022). Ratificó el Tratado de 1967 mediante la Ley 2107 de 2021, declarada exequible en la sentencia C-206/22. El 21 de agosto de 2026 el nuevo gobierno anunció que volverá al nombre "Fuerza Aérea Colombiana". **[I]** La mayor vulnerabilidad del país no es un ataque directo. Es su dependencia de servicios satelitales ajenos (GNSS, comunicaciones LEO, imágenes) y de datos de vigilancia espacial suministrados por terceros.

---

## 2. Cifras clave

| Dato                                                                                   | Valor                                                      | Año / fecha         | Fuente (URL)                                                                                                                                                                                                                                          |
| -------------------------------------------------------------------------------------- | ---------------------------------------------------------- | ------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Objetos rastreados regularmente                                                        | ~46.870                                                    | 31 jul 2026         | https://sdup.esoc.esa.int/discosweb/statistics/                                                                                                                                                                                                       |
| Satélites aún en el espacio / en funcionamiento                                        | ~18.840 / ~16.000                                          | 31 jul 2026         | https://sdup.esoc.esa.int/discosweb/statistics/                                                                                                                                                                                                       |
| Satélites puestos en órbita desde 1957                                                 | ~27.490                                                    | 31 jul 2026         | https://sdup.esoc.esa.int/discosweb/statistics/                                                                                                                                                                                                       |
| Masa total en órbita                                                                   | >17.000 t                                                  | 31 jul 2026         | https://sdup.esoc.esa.int/discosweb/statistics/                                                                                                                                                                                                       |
| Eventos de fragmentación estimados (histórico)                                         | >660                                                       | 31 jul 2026         | https://sdup.esoc.esa.int/discosweb/statistics/                                                                                                                                                                                                       |
| Objetos >10 cm (modelo MASTER-8)                                                       | ~68.450 (incluye ~11.300 cargas activas)                   | feb 2026            | https://sdup.esoc.esa.int/discosweb/statistics/ ; https://newspaceeconomy.ca/2026/09/14/what-does-the-2026-space-environment-report-reveal-about-the-future-of-space-debris/                                                                          |
| Objetos de 1 a 10 cm                                                                   | ~1,5 millones                                              | feb 2026            | https://sdup.esoc.esa.int/discosweb/statistics/                                                                                                                                                                                                       |
| Objetos de 1 mm a 1 cm                                                                 | ~230 millones                                              | feb 2026            | https://sdup.esoc.esa.int/discosweb/statistics/                                                                                                                                                                                                       |
| Informe ESA 2025: objetos rastreados / cargas activas                                  | ~40.000 / ~11.000                                          | datos 2024          | https://www.esa.int/Space_Safety/Space_Debris/ESA_Space_Environment_Report_2025                                                                                                                                                                       |
| Informe ESA 2025: objetos >1 cm / >10 cm                                               | >1,2 millones / >50.000                                    | datos 2024          | https://www.esa.int/Space_Safety/Space_Debris/ESA_Space_Environment_Report_2025                                                                                                                                                                       |
| Objetos rastreados añadidos por fragmentaciones en 2024                                | >3.000                                                     | 2024                | https://www.esa.int/Space_Safety/Space_Debris/ESA_Space_Environment_Report_2025                                                                                                                                                                       |
| Lanzamientos / cargas nuevas en 2025                                                   | >300 / >4.000 (~10 cargas al día)                          | 2025                | https://www.esa.int/Space_Safety/Space_Debris/ESA_Space_Environment_Report_2026                                                                                                                                                                       |
| Reentradas de objetos intactos                                                         | >3 al día en promedio                                      | 2025                | https://www.esa.int/Space_Safety/Space_Debris/ESA_Space_Environment_Report_2026                                                                                                                                                                       |
| Reentradas de objetos intactos en 2025                                                 | ~1.200                                                     | 2025                | https://newspaceeconomy.ca/2026/09/14/what-does-the-2026-space-environment-report-reveal-about-the-future-of-space-debris/ (secundaria)                                                                                                               |
| Índice de salud del entorno de ESA                                                     | de ~4 a ~50 en un año                                      | informe 2026        | https://www.esa.int/Space_Safety/Space_Debris/ESA_Space_Environment_Report_2026                                                                                                                                                                       |
| Cumplimiento de la regla de 25 años (cuerpos de cohete en LEO) / de la regla de 5 años | ~90% / ~80%                                                | datos 2024          | https://www.esa.int/Space_Safety/Space_Debris/ESA_Space_Environment_Report_2025                                                                                                                                                                       |
| Starlink: en órbita / operativos / reentrados / lanzados                               | 11.127 / 11.112 / 1.808 / 12.935                           | 17 sep 2026         | https://planet4589.org/space/con/star/stats.html                                                                                                                                                                                                      |
| Maniobras de evasión de Starlink                                                       | 207.152 (dic 2025 a may 2026); 148.696 (jun a nov 2025)    | 2025-2026           | https://starpath.global/news/starlink-satellites-now-dodging-collisions-almost-weekly-as-maneuvers-triple-in-a-year/                                                                                                                                  |
| Umbral de maniobra de Starlink                                                         | Pc > 3 en 10 millones                                      | 2026                | https://starpath.global/news/starlink-satellites-now-dodging-collisions-almost-weekly-as-maneuvers-triple-in-a-year/                                                                                                                                  |
| CRASH Clock                                                                            | 164 días (2018) a 5,5 días (2025)                          | ene 2026            | https://arxiv.org/html/2512.09643v2                                                                                                                                                                                                                   |
| CRASH Clock                                                                            | 2,2 días (102 en 2020; 11 en 2023)                         | 15 ago 2026         | https://outerspaceinstitute.ca/crashclock/                                                                                                                                                                                                            |
| Acercamientos de menos de 1 km en LEO                                                  | ~1 cada 36 s (1 cada 47 s con Starlink)                    | 2025-2026           | https://arxiv.org/html/2512.09643v2                                                                                                                                                                                                                   |
| Amazon Leo (antes Kuiper): en órbita / planeados                                       | 396 / 3.236                                                | 2 jul 2026          | https://www.aboutamazon.com/news/innovation-at-amazon/project-kuiper-satellite-rocket-launch-progress-updates                                                                                                                                         |
| Guowang: en órbita / planeados                                                         | 186 / ~13.000                                              | sep 2026            | https://orbitalradar.com/satellite-internet/guowang-qianfan                                                                                                                                                                                           |
| Qianfan: en órbita / planeados                                                         | 238 / ~15.000                                              | sep 2026            | https://orbitalradar.com/satellite-internet/guowang-qianfan                                                                                                                                                                                           |
| Solicitud de SpaceX ante la FCC para "centros de datos orbitales"                      | hasta 1.000.000 de satélites, 500 a 2.000 km               | 30 ene 2026         | https://satnews.com/2026/01/31/spacex-files-fcc-application-for-million-satellite-orbital-data-center/                                                                                                                                                |
| Satélites activos (CSIS)                                                               | >15.000                                                    | 2026                | https://www.csis.org/analysis/what-are-biggest-space-threats-2026                                                                                                                                                                                     |
| Incidentes cibernéticos contra sistemas espaciales                                     | 161                                                        | 2022-2025           | https://www.csis.org/analysis/what-are-biggest-space-threats-2026                                                                                                                                                                                     |
| Eventos de interferencia satelital documentados                                        | >10.000                                                    | feb 2024 a feb 2025 | https://www.swfound.org/publications-and-reports/2025-global-counterspace-capabilities-report (solo buscador); anuncio: https://www.swfound.org/news/swf-announces-the-release-of-the-2025-global-counterspace-capabilities-an-open-source-assessment |
| Países evaluados por SWF                                                               | 12 (4 con pruebas ASAT destructivas)                       | abr 2025            | https://www.swfound.org/news/swf-announces-the-release-of-the-2025-global-counterspace-capabilities-an-open-source-assessment                                                                                                                         |
| ASAT China 2007: fragmentos catalogados / aún rastreados                               | 3.531 / 2.319                                              | jul 2026            | https://keeptrack.space/top-10/10-anti-satellite-tests                                                                                                                                                                                                |
| ASAT India 2019 (283 km): catalogados / aún rastreados                                 | 129 / 0                                                    | jul 2026            | https://keeptrack.space/top-10/10-anti-satellite-tests                                                                                                                                                                                                |
| ASAT Rusia 2021 (480 km): catalogados / aún rastreados                                 | 1.806 / 4                                                  | jul 2026            | https://keeptrack.space/top-10/10-anti-satellite-tests                                                                                                                                                                                                |
| Resolución ONU 77/41 (moratoria ASAT)                                                  | 155 a favor, 9 en contra, 9 abstenciones                   | 7 dic 2022          | https://spacepolicyonline.com/news/u-n-approves-resolution-not-to-conduct-destructive-asat-tests/                                                                                                                                                     |
| Países con compromiso nacional de moratoria ASAT                                       | 38                                                         | 5 nov 2024          | https://www.swfound.org/publications-and-reports/multilateral-space-security-initiatives                                                                                                                                                              |
| Firmantes de la Carta Zero Debris                                                      | 228 de 34 países (21 Estados)                              | may 2026            | https://blogs.esa.int/spacesafety-community/2026/05/26/zero-debris-webinar-4-zero-debris-policy-governance/                                                                                                                                           |
| Signatarios de los Acuerdos Artemis                                                    | 72 (Yibuti, el más reciente)                               | 14 sep 2026         | https://spaceinafrica.com/2026/09/14/djibouti-becomes-eighth-african-nation-to-sign-the-artemis-accords/                                                                                                                                              |
| TraCSS                                                                                 | >70 operadores y >10 gobiernos en piloto; cribado cada 4 h | ago 2026            | https://www.satellitetoday.com/government-military/2026/08/26/tracss-traffic-coordination-system-remains-in-pilot-mode-due-to-budget-uncertainty/                                                                                                     |
| Costo proyectado por desechos (WEF)                                                    | USD 25.800 a 42.300 millones en 10 años                    | 29 ene 2026         | https://payloadspace.com/wefs-space-debris-report-projects-significant-costs/                                                                                                                                                                         |
| Colombia: FACSAT-2, resolución / área cubierta en su primer año                        | 4,7 m/píxel / 37.525 km² (5.653 órbitas)                   | abr 2024            | https://www.fac.mil.co/es/noticias/un-ano-en-orbita-cumple-el-segundo-satelite-colombiano-facsat-ii-chiribiquete                                                                                                                                      |
| Colombia: FACSAT-1, lanzamiento / decaimiento                                          | 29 nov 2018 / 3 jun 2023                                   | 2018-2023           | https://en.wikipedia.org/wiki/FACSAT-1 (secundaria)                                                                                                                                                                                                   |
| Colombia: crecimiento anual de accesos fijos satelitales                               | +111,4% (total de accesos fijos: 10,3 millones)            | cierre de 2025      | https://forbes.co/2026/05/20/tecnologia/colombia-cerro-2025-con-4975-millones-de-accesos-a-internet-movil-segun-la-crc/                                                                                                                               |
| Colombia: participación satelital en zonas de conectividad limitada                    | ~12% de las conexiones                                     | T1 2025             | https://www.telesemana.com/blog/2026/09/01/colombia-estudia-la-integracion-de-los-satelites-y-otras-plataformas-aereas-con-las-redes-moviles                                                                                                          |
| Colombia: aporte de la FAC a FACSAT-3 (convenio con CODALTEC)                          | ~COP 91.400 millones                                       | por verificar       | solo buscador (defensa.com); no confirmado                                                                                                                                                                                                            |

**Nota metodológica [I].** Hay tres formas de contar "satélites activos" y no deben confundirse:

- ESA MASTER cuenta unos 11.300 como "cargas activas" en su modelo a febrero de 2026.
- ESA DISCOS cuenta unos 16.000 satélites "en funcionamiento".
- CSIS habla de más de 15.000 satélites activos.

Las diferencias se deben a definiciones y fechas de corte distintas. Por la misma razón, una fuente secundaria (FODNews) da unos 54.000 objetos mayores de 10 cm, que no coincide con los 68.450 de ESA DISCOS. Se usa la cifra de ESA.

---

## 3. Perspectiva global

### 3.1 Estado del entorno orbital (ESA 2025 y 2026)

- **[H]** El informe ESA 2025, con datos de 2024, reportaba unos 40.000 objetos rastreados, de los cuales unos 11.000 eran cargas activas. También reportaba más de 1,2 millones de objetos mayores de 1 cm y más de 50.000 mayores de 10 cm. Hacia los 550 km ya hay "el mismo orden de magnitud" de desechos peligrosos que de satélites activos. En 2024 las fragmentaciones añadieron más de 3.000 objetos rastreados. Fuente: https://www.esa.int/Space_Safety/Space_Debris/ESA_Space_Environment_Report_2025
- **[H]** El informe ESA 2026 se publicó el 14 de septiembre de 2026 con datos hasta el cierre de 2025. Sus puntos principales:
  - Más de 300 lanzamientos y más de 4.000 cargas en 2025.
  - Más de 3 reentradas de objetos intactos al día.
  - El índice de salud pasó de aproximadamente 4 a 50 en un año.
  - Crece la brecha entre lo que se detecta y lo que se cataloga (más objetos de "clasificación no identificada").
  - Horizonte de proyección reducido de 200 a 100 años, aun así con cifras "mucho más altas".

  Fuentes: https://www.esa.int/Space_Safety/Space_Debris/ESA_Space_Environment_Report_2026 ; https://www.esa.int/ESA_Multimedia/Images/2026/09/Number_of_objects_will_skyrocket_-_2026_Space_environment_report

- **[H]** Según un análisis secundario del informe 2026:
  - Había 44.964 objetos catalogados al cierre de 2025, de ellos 16.946 cargas útiles y 2.080 cuerpos de cohete.
  - El 96% del riesgo ambiental en órbita baja proviene de objetos inactivos.
  - Controlar la reentrada de un satélite grande solo tiene éxito entre el 5% y el 50% de las veces.

  Fuente: https://newspaceeconomy.ca/2026/09/14/what-does-the-2026-space-environment-report-reveal-about-the-future-of-space-debris/ (secundaria; **por verificar** contra el PDF de ESA).

- **[H]** Resumen estadístico de ESA DISCOS (31 de julio de 2026):
  - Unos 46.870 objetos rastreados.
  - Unos 16.000 satélites funcionando.
  - Más de 17.000 t de masa en órbita.
  - Más de 660 fragmentaciones históricas.

  Fuente: https://sdup.esoc.esa.int/discosweb/statistics/

- **[I]** El dato más importante para el reto es el aumento de la masa y del número de objetos inactivos en las capas más densas (500 a 600 km). Allí compiten las megaconstelaciones y también los pequeños satélites de países emergentes como Colombia.

### 3.2 Megaconstelaciones y congestión

- **[H] Starlink.** Tenía 12.935 satélites lanzados, 11.127 en órbita, 11.112 operativos y 1.808 reentrados al 17 de septiembre de 2026. Fuente: https://planet4589.org/space/con/star/stats.html
- **[H] Maniobras de Starlink.** Hizo 148.696 maniobras entre junio y noviembre de 2025 y 207.152 entre diciembre de 2025 y mayo de 2026. Eso supone más de 355.000 en un año, más del triple que en 2024, y más de 40 por satélite al año. El umbral de maniobra es una probabilidad de colisión mayor de 3 en 10 millones. Se proyecta 1 millón de maniobras acumuladas hacia junio de 2027. Hugh Lewis, de la Universidad de Birmingham, dijo que el aumento es "una certeza predecible". Fuente: https://starpath.global/news/starlink-satellites-now-dodging-collisions-almost-weekly-as-maneuvers-triple-in-a-year/ (basada en los informes semestrales de SpaceX a la FCC; el informe original no se consultó directamente).
- **[H] Amazon Leo (antes Project Kuiper, renombrado en noviembre de 2025).** Tenía 396 satélites tras la misión LA-08 del 2 de julio de 2026, de 3.236 planeados. Fuente: https://www.aboutamazon.com/news/innovation-at-amazon/project-kuiper-satellite-rocket-launch-progress-updates
- **[H] China.** Guowang tenía unos 186 satélites en órbita de unos 13.000 planeados, entre 508 y 1.145 km. Qianfan tenía unos 238 de unos 15.000 planeados, entre unos 800 y 1.160 km. Qianfan pausó sus lanzamientos en 2025 por fallas de propulsores y giróscopos y los reanudó en abril de 2026. Fuente: https://orbitalradar.com/satellite-internet/guowang-qianfan
- **[H] Nuevas solicitudes extremas.** El 30 de enero de 2026 SpaceX pidió a la FCC autorización para hasta 1.000.000 de satélites "centro de datos orbital" entre 500 y 2.000 km. Fuente: https://satnews.com/2026/01/31/spacex-files-fcc-application-for-million-satellite-orbital-data-center/
- **[I]** Las constelaciones chinas a más de 800 km son más preocupantes para el largo plazo que Starlink (unos 550 km). A esa altitud un satélite que falla puede tardar décadas en reentrar, mientras que a unos 550 km tarda años.

### 3.3 Fragmentaciones y pruebas ASAT

- **[H] Pruebas ASAT destructivas** (fuente: https://keeptrack.space/top-10/10-anti-satellite-tests, 6 de agosto de 2026):

  | Prueba                                | Altitud | Fragmentos catalogados | Aún rastreados (jul 2026) |
  | ------------------------------------- | ------- | ---------------------- | ------------------------- |
  | China 2007 (Fengyun-1C)               | 865 km  | 3.531                  | 2.319                     |
  | EE. UU. 2008 (Burnt Frost)            | 247 km  | 174                    | 0                         |
  | India 2019 (Mission Shakti)           | 283 km  | 129                    | 0                         |
  | Rusia 2021 (Cosmos 1408, misil Nudol) | 480 km  | 1.806                  | 4                         |

- **[I]** La lección técnica es que la altitud manda. A menos de unos 500 km la atmósfera limpia los restos en pocos años. A más de 800 km el daño dura generaciones.
- **[H] Fragmentaciones accidentales de 2024.**
  - Junio: se fragmentó el satélite ruso RESURS-P1 (más de 100 piezas).
  - Julio: se fragmentó un satélite DMSP retirado.
  - 6 de agosto: se fragmentó la etapa superior del Long March 6A tras lanzar el primer lote de Qianfan (al menos 283 piezas rastreables, a unos 800 km).
  - 20 de octubre: se fragmentó Intelsat 33e en GEO (al menos 20 piezas).

  Fuente: https://theconversation.com/4-300-tonnes-of-space-junk-and-rising-another-satellite-breakup-adds-to-orbital-debris-woes-241790

- **[H] Impacto sobre una nave tripulada.** El 5 de noviembre de 2025 se encontraron grietas en una ventana de la nave Shenzhou-20, atribuidas a un posible impacto de desecho. La tripulación regresó el 14 de noviembre en la Shenzhou-21. Fuentes: https://spacenews.com/china-delays-shenzhou-20-crew-return-after-suspected-space-debris-impact/ (solo buscador; **por verificar**) y cobertura múltiple en el buscador.
- **[H] Pérdida de control en GEO.** En 2020 Venezuela perdió el control del VENESAT-1 mientras intentaba llevarlo a órbita cementerio. Fuente: https://abae.gob.ve/venesat-1-satelite-simon-bolivar/ (solo buscador; **por verificar** la fecha exacta).

### 3.4 Síndrome de Kessler e indicadores de riesgo

- **[H]** Kessler y Cour-Palais (1978, _Journal of Geophysical Research_ 83:2637-2646) advirtieron que cada colisión genera fragmentos que aumentan la probabilidad de nuevas colisiones y que así podría formarse un "cinturón de desechos". Fuente: https://agupubs.onlinelibrary.wiley.com/doi/abs/10.1029/JA083iA06p02637 (solo buscador; el resumen en ADS devolvió error 405).
- **[H]** ESA 2026 afirma que "las colisiones llevan a colisiones" y que se necesita remoción activa de desechos para frenar el crecimiento. Fuente: https://www.esa.int/ESA_Multimedia/Images/2026/09/Number_of_objects_will_skyrocket_-_2026_Space_environment_report
- **[H] CRASH Clock** (Collision Realization And Significant Harm). Mide el tiempo esperado hasta una colisión catastrófica en LEO si cesan todas las maniobras, por ejemplo tras una tormenta solar severa o una falla de software:
  - Thiele, Heiland, Boley y Lawler (arXiv 2512.09643, v2 del 8 de enero de 2026): 164 días en 2018 y 5,5 días en 2025. Fuente: https://arxiv.org/html/2512.09643v2
  - Outer Space Institute: 2,2 días al 15 de agosto de 2026 (102 en 2020, 11 en 2023). Fuente: https://outerspaceinstitute.ca/crashclock/
- **[I]** El indicador no predice una colisión. Mide cuánto depende la órbita baja de que las operaciones sigan funcionando sin errores. Es un argumento directo para exigir capacidad nacional de conciencia situacional espacial y de respuesta ante fallas, incluidas las tormentas geomagnéticas.

### 3.5 Contraespacio

- **[H] Secure World Foundation, _Global Counterspace Capabilities_ 2025** (publicado el 3 de abril de 2025, octava edición):
  - Evalúa 12 países: EE. UU., Rusia, China e India (que han hecho pruebas ASAT destructivas) y Australia, Francia, Irán, Israel, Japón, Corea del Norte, Corea del Sur y Reino Unido.
  - Cubre cinco categorías: ascenso directo, co-orbital, guerra electrónica, energía dirigida y ciberespacio.

  Fuente: https://www.swfound.org/news/swf-announces-the-release-of-the-2025-global-counterspace-capabilities-an-open-source-assessment

- **[H]** El informe SWF 2025 también señala que solo se usan capacidades no destructivas en conflictos activos. Menciona más de 10.000 eventos de interferencia y un sistema ruso, "Kalinka", dirigido contra Starlink. Fuente: https://www.swfound.org/publications-and-reports/2025-global-counterspace-capabilities-report (solo buscador; **por verificar** el detalle en el PDF).
- **[H] CSIS, _Space Threat Assessment_ 2026** (séptima edición, presentada el 22 de mayo de 2026 junto con el informe SWF 2026). Identifica tres amenazas crecientes:
  - Operaciones de encuentro y proximidad. Ejemplos: recarga de combustible en GEO por los satélites chinos SJ-21 y SJ-25, y satélites rusos Kosmos coplanares cerca de objetivos en LEO.
  - Guerra electrónica. Ejemplo: _spoofing_ de GPS atribuido a Irán contra terminales Starlink.
  - Ciberoperaciones: 161 incidentes entre 2022 y 2025.

  El informe también reporta más de 15.000 satélites activos y 6 países con nueva doctrina espacial militar. Fuente: https://www.csis.org/analysis/what-are-biggest-space-threats-2026

- **[H]** Los hallazgos específicos del informe SWF 2026 no se pudieron abrir: la página del evento no los detalla (https://www.swfound.org/events/understanding-counterspace-threats-2026-report-launch-with-swf-csis). **Por verificar.**
- **[I]** Para un país como Colombia el riesgo real del contraespacio es la interferencia y el _spoofing_ de GNSS y de enlaces satelitales comerciales, más que un misil ASAT. Estos efectos ya aparecen en conflictos cercanos a sus intereses y son baratos de producir.

### 3.6 Gobernanza

- **[H] Tratado del Espacio Ultraterrestre (1967).** Es el marco básico: el espacio no puede ser objeto de apropiación nacional, los Estados responden por sus actividades y el uso debe ser pacífico. Fuente: https://www.unoosa.org/oosa/en/ourwork/spacelaw/treaties/outerspacetreaty.html (solo buscador; la página de estado de tratados de UNOOSA devolvió error 404).
- **[H] Directrices IADC y COPUOS.** El IADC emitió sus directrices en 2002. COPUOS adoptó las suyas en 2007 sin incluir la regla de 25 años, y la Asamblea General las respaldó en la resolución 62/217. Solo alrededor del 50% de los satélites se retira de órbita cuando debe. Fuente: https://www.theregreview.org/2025/10/07/conrad-orbital-debris-mitigation-guidelines/
- **[H] Directrices de sostenibilidad a largo plazo (LTS).** COPUOS adoptó 21 directrices voluntarias en junio de 2019, y la Asamblea General las acogió en la resolución 74/82. En 2021 se creó un grupo de trabajo con mandato de 5 años. Fuente: https://ui.adsabs.harvard.edu/abs/2021JSSE....8...98M/abstract (solo buscador; las páginas de UNOOSA y UNIS devolvieron error 403). **Por verificar** en la fuente primaria.
- **[H] Moratoria de ASAT destructivos.** EE. UU. se comprometió en abril de 2022. La ONU adoptó la resolución 77/41 el 7 de diciembre de 2022 con 155 votos a favor, 9 en contra y 9 abstenciones. En contra votaron Bielorrusia, Bolivia, República Centroafricana, China, Cuba, Irán, Nicaragua, Rusia y Siria. Fuente: https://spacepolicyonline.com/news/u-n-approves-resolution-not-to-conduct-destructive-asat-tests/. Para noviembre de 2024 había 38 países con compromiso nacional. Fuente: https://www.swfound.org/publications-and-reports/multilateral-space-security-initiatives
- **[H] Regla de 5 años de la FCC** (Second Report and Order FCC 22-74, 29 de septiembre de 2022). Exige retirar de órbita en un máximo de 5 años tras el fin de la misión a los satélites en LEO (por debajo de 2.000 km). Está vigente desde el 29 de septiembre de 2024. Fuente: https://spacenews.com/fcc-adopts-new-5-year-rule-for-deorbiting-satellites/ (solo buscador; fcc.gov devolvió error 403). **Por verificar** en la fuente primaria.
- **[H] Carta Zero Debris de ESA.** Busca que no se generen desechos para 2030. En 2025 tenía 19 países y más de 150 entidades firmantes (https://www.esa.int/Space_Safety/Space_Debris/ESA_Space_Environment_Report_2025). En mayo de 2026 tenía 228 firmantes de 34 países, 21 de ellos Estados (https://blogs.esa.int/spacesafety-community/2026/05/26/zero-debris-webinar-4-zero-debris-policy-governance/).
- **[H] EU Space Act.** La Comisión Europea la propuso el 25 de junio de 2025 con tres pilares: seguridad (rastreo de objetos y mitigación de desechos), resiliencia (ciberseguridad) y sostenibilidad (huella ambiental). Se aplicaría también a operadores de fuera de la UE que den servicio en Europa y sigue en negociación. Fuente: https://defence-industry-space.ec.europa.eu/eu-space-act_en

### 3.7 Gestión del tráfico espacial (STM)

- **[H] TraCSS (Oficina de Comercio Espacial de EE. UU.).** Estado en agosto de 2026:
  - Sigue en fase piloto, con más de 70 operadores y más de 10 gobiernos.
  - Hace un cribado de conjunciones cada 4 horas con el catálogo del Departamento de Defensa y las efemérides que entregan los operadores.
  - Las compras de datos comerciales están suspendidas.
  - La propuesta de presupuesto para el año fiscal 2026 quería eliminarlo, y el Congreso restauró los fondos.

  Fuentes: https://www.satellitetoday.com/government-military/2026/08/26/tracss-traffic-coordination-system-remains-in-pilot-mode-due-to-budget-uncertainty/ ; https://breakingdefense.com/2025/07/appropriators-restore-funding-for-commerces-tracss-spacewatch-effort/ (solo buscador).

- **[H]** ESA pide compartir más datos sobre los planes de lanzamiento para mejorar la gestión del tráfico. Fuente: https://www.esa.int/ESA_Multimedia/Images/2026/09/Number_of_objects_will_skyrocket_-_2026_Space_environment_report
- **[I]** No existe una autoridad global de tráfico espacial. La coordinación depende de servicios nacionales (TraCSS, EU SST) y de acuerdos bilaterales. Los países sin sensores propios, como Colombia, reciben alertas pero no pueden verificarlas de forma independiente.

### 3.8 Costo económico

- **[H]** El informe del WEF _Clear Orbit, Secure Future_ (29 de enero de 2026) proyecta un costo de USD 25.800 a 42.300 millones en 10 años, sin contar colisiones mayores. El monto se reparte así: anomalías (14.200 a 30.700 millones), maniobras (560 millones) y pérdida de infraestructura o servicios (11.100 millones). Fuente: https://payloadspace.com/wefs-space-debris-report-projects-significant-costs/

---

## 4. Perspectiva regional (América Latina)

### 4.1 ALCE (Agencia Latinoamericana y Caribeña del Espacio)

- **[H]** La primera Asamblea General se celebró el 20 de febrero de 2026 en Querétaro, México.
  - Miembros: Cuba, México, Nicaragua, Paraguay, República Dominicana y Venezuela.
  - Observadores: **Brasil, Colombia**, Haití, Honduras, Italia y Uruguay.
  - Se eligió a México para la primera presidencia anual y se designó un Secretario General por 4 años.

  Fuente: https://iila.org/es/iila-participa-en-la-primera-asamblea-general-de-la-agencia-latinoamericana-y-caribena-del-espacio-alce-mexico-20-de-febrero-de-2026/

- **[H]** El convenio constitutivo entró en vigor en 2024. Fuente: https://mision.sre.gob.mx/oea/comunicados/48-comunicados-2024/1009-entra-en-vigor-convenio-constitutivo-de-la-agencia-latinoamericana-y-caribena-del-espacio-26-oct-24 (solo buscador; la página devolvió error 404). **Por verificar** la fecha exacta.
- **[I]** Sin Brasil, Argentina, Chile ni Colombia como miembros plenos, ALCE reúne sobre todo a países con poca capacidad técnica. Hoy su peso es más político que operativo.

### 4.2 Brasil (AEB e INPE)

- **[H]** Amazonia-1 se lanzó el 28 de febrero de 2021. Brasil y China firmaron el protocolo para CBERS-6 (Decreto 12.496/2025 del 9 de junio de 2025). Fuente: https://www.gov.br/inpe/pt-br/assuntos/ultimas-noticias/decreto-presidencial-oficializa-parceria-brasil-china-para-o-satelite-cbers-6 (solo buscador).
- **[H]** El Ministerio de Ciencia (MCTI) reporta varias inversiones:
  - Cerca de R$ 1.000 millones contratados, con la perspectiva de superar R$ 5.500 millones.
  - R$ 250 millones para la plataforma multimisión de CBERS-6.
  - R$ 416 millones para tres vehículos lanzadores.
  - R$ 220 millones para un satélite óptico submétrico (SAT VHR).
  - Amazonia-1B en el marco de la constelación Sabia-Mar con Argentina.

  Fuente: https://mundogeo.com/2025/10/22/mcti-destaca-investimentos-para-fortalecer-programa-espacial-brasileiro/

- **[H]** El presupuesto autorizado de la AEB para 2026 sería de unos R$ 139,5 millones. Fuente: solo buscador. **Por verificar.**

### 4.3 Argentina (CONAE)

- **[H]** La constelación SAOCOM tiene dos satélites de radar SAR en banda L: SAOCOM 1A (octubre de 2018) y SAOCOM 1B (30 de agosto de 2020, desde Cabo Cañaveral). Está integrada con Italia en el sistema SIASGE. Fuente: https://www.argentina.gob.ar/noticias/argentina-lanzo-el-satelite-saocom-1b-y-completo-la-mision-espacial-mas-importante-del-pais
  - _Nota:_ la herramienta de extracción devolvió "2026" como año del lanzamiento de SAOCOM 1B. Es un error evidente, porque la nota cita al presidente Alberto Fernández (2019-2023). Se usa 2020.
- **[H]** SAOCOM-2A y 2B estaban planeados para 2025 y 2026. Fuente: https://www.eoportal.org/satellite-missions/saocom (solo buscador). **Por verificar** su estado actual.

### 4.4 México

- **[H]** La Agencia Espacial Mexicana (AEM) fue disuelta. Sus funciones pasaron a la Agencia de Transformación Digital y Telecomunicaciones (ATDT), junto con Mexsat. El director de la AEM renunció en enero de 2025. Fuente: https://expansion.mx/tecnologia/2025/01/29/agencia-espacial-mexicana-desaparecera-y-sera-sustituida

### 4.5 Chile

- **[H]** FASat-Delta se lanzó el 12 de junio de 2023 en un Falcon 9. Pesa 90 kg, orbita a 550 km, tiene resolución de 0,7 m y una vida útil de 5 años. Reemplaza al FASat-Charlie (5,8 m) y forma parte del Sistema Nacional Satelital (SNSat). Fuente: https://www.latercera.com/que-pasa/noticia/usando-un-cohete-de-space-x-chile-pone-en-orbita-su-tercer-satelite-espacial-el-fasat-delta/P63WKSLJTZDIZD4QYBGSLHTUIA/
- **[H]** FASat-Delta sería "el primero de diez" satélites del SNSat. Fuente: solo buscador (fach.mil.cl devolvió error 403). **Por verificar.**

### 4.6 Perú (CONIDA)

- **[H]** PeruSat-1 se lanzó el 15 de septiembre de 2016 en un Vega y tenía 10 años de vida de diseño. Ha entregado más de 130.000 imágenes, con un ahorro estimado de USD 634 millones. Airbus recibió un contrato de 4.023.000 euros para darle soporte entre julio de 2026 y abril de 2028. PerúSAT-2 sigue en estudio. Fuente: https://www.infodefensa.com/texto-diario/mostrar/5967270/peru-confirma-extension-anos-vida-util-satelite-optico-perusat-1

### 4.7 Bolivia (ABE)

- **[H]** El satélite de comunicaciones geoestacionario TKSAT-1 (Túpac Katari) se lanzó desde China en diciembre de 2013. Costó USD 302 millones, el 85% financiado por el Banco de Desarrollo de China. Su vida útil se extiende hasta 2030 y quedan entre USD 40 y 50 millones por pagar. Los analistas lo consideran inferior a los proveedores de LEO como Starlink, y el presidente Rodrigo Paz ordenó auditarlo. Fuente: https://correodelsur.com/seguridad/20260208/el-satelite-tupac-katari-tiene-vida-util-hasta-2030.html

### 4.8 Venezuela (ABAE)

- **[H]** Venezuela opera los satélites de observación VRSS-1 "Miranda" y VRSS-2 "Sucre". El 14 de marzo de 2026 ABAE informó que hace monitoreo de conjunciones y maniobras correctivas, y citó el síndrome de Kessler como riesgo. Fuente: https://abae.gob.ve/venezuela-avanza-hacia-una-gestion-orbital-responsable-frente-al-riesgo-de-los-desechos-espaciales/
- **[H]** VRSS-2 se lanzó el 9 de octubre de 2017 desde Jiuquan, China, con 5 años de vida de diseño. Fuente: https://abae.gob.ve/vrss-2-satelite-sucre/ (solo buscador).

### 4.9 Dependencia regional de servicios satelitales

- **[H]** 11 países latinoamericanos figuran entre los 72 signatarios de los Acuerdos Artemis: Argentina, Brasil, Chile, Colombia, Ecuador, México, Panamá, Paraguay, Perú, República Dominicana y Uruguay. Fuente: https://spaceinafrica.com/2026/09/14/djibouti-becomes-eighth-african-nation-to-sign-the-artemis-accords/ (el total de 72); la lista de países viene del buscador. **Por verificar** la lista completa en nasa.gov.
- **[I]** El patrón regional se repite:
  - Pocos satélites nacionales, casi todos de observación, de fabricación extranjera y lanzados en cohetes extranjeros.
  - La conectividad rural se traslada rápidamente a proveedores de LEO extranjeros, como Starlink y pronto Amazon Leo.
  - Hay cooperación dividida entre bloques: China con Bolivia, Venezuela y Brasil (CBERS), y EE. UU. con Artemis.

  Esto deja a la región expuesta a decisiones regulatorias y comerciales externas y a la interferencia de GNSS.

---

## 5. Colombia

### 5.1 Institucionalidad y nombre de la fuerza

- **[H] Historia del cambio de nombre:**
  - Julio de 2023: la Ley 2302 cambió el nombre de la institución a "Fuerza Aeroespacial Colombiana".
  - Marzo de 2024: la Corte Constitucional declaró inexequible ese cambio (sentencia C-080/24) porque requería una reforma constitucional.
  - 8 de noviembre de 2024: un Acto Legislativo que modificó el artículo 217 de la Constitución adoptó el nombre "Fuerza Aeroespacial Colombiana".

  Fuentes: https://www.infodefensa.com/texto-diario/mostrar/5990663/140-colombia-colombia-devuelve-fuerza-aerea-denominacion-historica ; resultados del buscador sobre la Ley 2302 y la sentencia C-080/24.

- **[H] Novedad de 2026.** El 21 de agosto de 2026 el presidente Abelardo de la Espriella anunció que la institución retomará el nombre "Fuerza Aérea Colombiana (FAC)". El Tiempo señala, citando a un constitucionalista, que como el nombre está en la Constitución el cambio exige un nuevo acto legislativo. Infodefensa aclara que el cambio "no implica necesariamente abandonar las capacidades espaciales". Fuentes: https://www.eltiempo.com/justicia/investigacion/la-fuerza-aerea-colombiana-fac-volvera-a-su-nombre-original-tras-dos-anos-como-fuerza-aeroespacial-3579950 ; https://www.infodefensa.com/texto-diario/mostrar/5990663/140-colombia-colombia-devuelve-fuerza-aerea-denominacion-historica
  - **Por verificar:** si ya se radicó o aprobó el acto legislativo. Al 18 de septiembre de 2026 el nombre constitucional vigente seguiría siendo "Fuerza Aeroespacial Colombiana".
  - **[I]** Recomendación para la final: usar la sigla "FAC", válida con ambos nombres, y mencionar el anuncio. La organización del reto usa el nombre "Fuerza Aeroespacial Colombiana".
- **[H] Política espacial.** El CONPES 3983 "Política de Desarrollo Espacial: condiciones habilitantes para el impulso de la competitividad nacional" se aprobó el 13 de enero de 2020 y fue la primera política pública espacial del país. Fuente: https://colaboracion.dnp.gov.co/CDT/Conpes/Econ%C3%B3micos/3983.pdf (solo buscador; el dato se confirma en varios resultados).
- **[H] Agencia espacial propuesta.** El 21 de agosto de 2025 el Ministerio de Defensa radicó un proyecto de ley para crear la Agencia Espacial de la República de Colombia (AESCOL), el PL 179/2025. Sería un organismo autónomo adscrito a la Presidencia y reemplazaría a la Comisión Colombiana del Espacio. Fuentes: https://www.eltiempo.com/politica/gobierno/gobierno-de-petro-propone-crear-la-nasa-colombiana-este-es-el-proyecto-de-ley-que-se-radico-para-la-agencia-espacial-3483392 ; texto: https://leyes.senado.gov.co/p-ley/2025-2026/PL%20179-25%20-%20AGENCIA%20ESPACIAL%20DE%20LA%20REPUBLICA%20DE%20COLOMBIA.pdf (solo buscador). **Por verificar** el estado del trámite: no se encontró evidencia de aprobación, y con el cambio de gobierno y de legislatura podría haberse archivado.
- **[H] Comisión Colombiana del Espacio (CCE).** Es la instancia intersectorial existente, con secretaría técnica en el IGAC (https://cce.igac.gov.co/, solo buscador). La propia existencia del proyecto AESCOL indica que su capacidad de coordinación se considera insuficiente [I].

### 5.2 Activos espaciales

- **[H] FACSAT-1.** Es un CubeSat 3U de GomSpace (contratado en 2014). Se lanzó el 29 de noviembre de 2018 en el PSLV-C43 de India, tenía resolución de unos 30 m y decayó el 3 de junio de 2023. Fuentes: https://en.wikipedia.org/wiki/FACSAT-1 (secundaria) ; https://www.fac.mil.co/es/noticias/inaugurado-centro-de-operaciones-espaciales-de-la-fuerza-aerea-colombiana
  - **[H/I] Lección técnica útil.** Un estudio de 2021 (Portilla y Murcia, Redalyc) proyectaba su reentrada para el primer semestre de 2030. También observaba que el decaimiento se había acelerado de unos 8 m al día a unos 18 m al día por la actividad solar. Fuente: https://www.redalyc.org/journal/6735/673570962001/html/. El satélite reentró en 2023, siete años antes de lo proyectado. [I] Probablemente influyó el máximo del ciclo solar 25, pero esto está **por verificar**. Muestra lo sensibles que son los pequeños satélites de LEO al clima espacial y lo inciertas que son las predicciones de vida orbital.
  - _Discrepancia:_ una fuente de búsqueda indica una órbita de 505 km y el estudio de Redalyc indica unos 636 km iniciales. **Por verificar.**
- **[H] FACSAT-2 "Chiribiquete".** Se lanzó el 15 de abril de 2023 en la misión Transporter-7 de Falcon 9 desde Vandenberg. Tiene resolución de 4,7 m/píxel y un sensor de gases de efecto invernadero. En su primer año completó 5.653 órbitas y cubrió 37.525 km². Sus imágenes se usan para vigilancia ambiental, deforestación, cultivos ilícitos y fronteras. Fuentes: https://www.fac.mil.co/es/noticias/un-ano-en-orbita-cumple-el-segundo-satelite-colombiano-facsat-ii-chiribiquete ; https://www.fac.mil.co/index.php/es/noticias/colombia-y-estados-unidos-fortalecen-cooperacion-espacial-y-de-seguridad
  - Wikipedia lo registra como activo (COSPAR 2023-054AD, SATCAT 56205). Fuente: https://es.wikipedia.org/wiki/FACSAT-2. **Por verificar** su estado operativo a septiembre de 2026.
- **[H] FACSAT-3.** Es una constelación planeada de 3 satélites (3A, 3B y 3C) de observación, desarrollada en convenio con CODALTEC a 72 meses, con fin hacia diciembre de 2029. El aporte de la FAC sería de unos COP 91.400 millones. Fuentes: solo buscador (defensa.com y Revista UIS Ingenierías). **Por verificar.**
- **[H] Centro de Operaciones Espaciales (SpOC).** Lo inauguró el presidente Iván Duque el 28 de julio de 2022 en la Escuela Militar de Aviación de Cali. Opera 24/7 y se encarga del comando y control satelital, la planeación de misiones, el monitoreo del riesgo espacial y el análisis geoespacial con _big data_. Usa el sistema "Horus" para seguimiento y predicción orbital. Fuentes: https://www.fac.mil.co/es/noticias/inaugurado-centro-de-operaciones-espaciales-de-la-fuerza-aerea-colombiana ; https://www.fac.mil.co/es/noticias/un-ano-en-orbita-cumple-el-segundo-satelite-colombiano-facsat-ii-chiribiquete

### 5.3 Marco jurídico internacional y cooperación

- **[H] Tratado del Espacio de 1967.** Fue aprobado por la Ley 2107 del 22 de julio de 2021. La Corte Constitucional lo declaró exequible en la sentencia C-206/22 del 9 de junio de 2022. Esa sentencia incluye una **declaración interpretativa**: Colombia reafirma que "el segmento de la órbita geoestacionaria que le corresponde forma parte del territorio colombiano" (artículo 101 de la Constitución). Fuente: https://www.corteconstitucional.gov.co/relatoria/2022/C-206-22.htm
  - **Por verificar:** la fecha de depósito del instrumento de ratificación (15 de abril de 2024 según el buscador) y las objeciones de otros Estados a la declaración (el buscador menciona a Suecia y Países Bajos). Las páginas de UNOOSA y del Departamento de Estado no abrieron.
  - **[I]** Esta reivindicación ecuatorial, heredera de la Declaración de Bogotá de 1976, choca con el principio de no apropiación. Es un posible punto débil en foros multilaterales.
- **[H] Acuerdos Artemis.** Colombia los firmó el 10 de mayo de 2022 como el signatario número 19 y el tercero de América Latina. Firmó la vicepresidenta y canciller Marta Lucía Ramírez. Fuente: https://www.nasa.gov/humans-in-space/nasa-welcomes-vice-president-of-colombia-for-artemis-accords-signing/
- **[H] Cooperación con EE. UU. en conciencia situacional espacial:**
  - 21 de octubre de 2021: memorando de entendimiento entre el Comando Espacial de EE. UU. (Gral. James Dickinson) y la FAC (Gral. Ramsés Rueda) para seguridad del vuelo espacial y servicios de información SSA. Cubre planificación de maniobras, anomalías orbitales e interferencia electromagnética. Fuente: https://www.infoespacial.com/texto-diario/mostrar/3565729/colombia-eeuu-profundizan-cooperacion-materia-espacial
  - La FAC menciona un acuerdo de _Space Domain Awareness_ (SDA) firmado en 2022 y la participación en los ejercicios Global Sentinel y Resolute Sentinel (nota del 30 de julio de 2024). Fuente: https://www.fac.mil.co/index.php/es/noticias/colombia-y-estados-unidos-fortalecen-cooperacion-espacial-y-de-seguridad
  - _Discrepancia 2021/2022:_ **por verificar** si son dos instrumentos distintos.
- **[H] ALCE.** Colombia es observadora, no miembro (febrero de 2026). Fuente: https://iila.org/es/iila-participa-en-la-primera-asamblea-general-de-la-agencia-latinoamericana-y-caribena-del-espacio-alce-mexico-20-de-febrero-de-2026/
- **Moratoria ASAT.** Colombia no figura entre los votos en contra ni entre las abstenciones de la resolución 77/41 (fuente: https://spacepolicyonline.com/news/u-n-approves-resolution-not-to-conduct-destructive-asat-tests/). [I] Se infiere que votó a favor o no votó. **Por verificar** su voto exacto y si hizo un compromiso nacional; no se encontró evidencia de ese compromiso.
- **Carta Zero Debris.** No se encontró evidencia de que Colombia la haya firmado. **Por verificar.**

### 5.4 Dependencia de servicios satelitales

- **[H]** Al cierre de 2025, la tecnología satelital fue la de mayor crecimiento anual en internet fijo (+111,4%), aunque desde una base pequeña. El total de accesos fijos fue de 10,3 millones. Fuente: https://forbes.co/2026/05/20/tecnologia/colombia-cerro-2025-con-4975-millones-de-accesos-a-internet-movil-segun-la-crc/ (datos de la CRC).
- **[H]** El servicio satelital representa cerca del 12% de las conexiones en zonas de conectividad limitada (T1 2025). El 1 de septiembre de 2026 la CRC abrió una consulta, hasta el 2 de octubre de 2026, sobre la integración satélite-móvil (incluido el servicio directo a celular, D2D) con horizonte a 2035. Fuente: https://www.telesemana.com/blog/2026/09/01/colombia-estudia-la-integracion-de-los-satelites-y-otras-plataformas-aereas-con-las-redes-moviles
- **[I]** La conectividad rural, la vigilancia ambiental, la navegación aérea y marítima (GNSS) y la sincronización de tiempo de redes financieras y eléctricas dependen de activos que Colombia no controla. La mayor parte de su conciencia situacional orbital también viene de terceros (Comando Espacial de EE. UU. y, potencialmente, TraCSS).

---

## 6. Oportunidades, brechas y riesgos para Colombia [I]

_Toda esta sección es interpretación basada en los hechos de las secciones 3 a 5._

### Oportunidades

1. **Conciencia situacional espacial como servicio nacional y regional.** El SpOC de Cali ya existe. Puede combinar los catálogos públicos (Space-Track, TraCSS cuando publique datos abiertos en 2026) con los datos de EE. UU. para generar alertas de conjunción, predicción de reentradas y reportes para operadores nacionales. También podría ofrecer ese servicio a países observadores de ALCE.
2. **Analítica con IA sobre datos orbitales.** Esto encaja con el reto:

- Detectar anomalías de maniobra, como operaciones de proximidad, a partir de elementos orbitales (TLE) históricos.
- Priorizar conjunciones.
- Predecir el decaimiento orbital con datos de clima espacial. El caso de FACSAT-1, que reentró en 2023 cuando se proyectaba 2030, sirve como ejemplo.

3. **Diplomacia normativa de bajo costo.** Colombia podría asumir un compromiso nacional de moratoria ASAT, firmar la Carta Zero Debris e implementar formalmente las directrices LTS. Son compromisos que ya asumieron 38 países (ASAT) y 21 Estados (Zero Debris), y reforzarían la credibilidad de Colombia como signataria de Artemis.
4. **Diseño responsable de FACSAT-3.** Puede incorporar desde el diseño la eliminación al final de la vida útil en menos de 5 años, pasivación y efemérides compartidas. Esto facilita tener seguro, obtener licencias y cooperar con Europa, donde aplicará la EU Space Act.
5. **Regulación de LEO comercial.** La consulta de la CRC hacia 2035 permite exigir a los operadores de LEO que dan servicio en Colombia criterios de resiliencia, continuidad y sostenibilidad.

### Brechas

- No hay agencia espacial: AESCOL está pendiente y su estado está por verificar. La institucionalidad está dispersa entre la CCE, la FAC, el MinTIC y el IGAC.
- El nombre y la misión de la FAC son inestables (2023 a 2026). Eso genera incertidumbre sobre la continuidad del mandato espacial.
- No hay sensores propios de vigilancia espacial (radar o telescopio). La dependencia de datos extranjeros es total.
- La flota es mínima: un satélite activo, FACSAT-2, de clase nanosatélite, sin redundancia hasta FACSAT-3 (hacia 2029).
- La posición sobre la órbita geoestacionaria (declaración interpretativa al Tratado) puede generar fricción diplomática.

### Riesgos

- **Pérdida del único activo.** FACSAT-2 orbita en la capa más congestionada de LEO. El índice de riesgo de ESA se multiplicó y el CRASH Clock está en unos 2 días.
- **Interferencia y _spoofing_ de GNSS.** Afectarían a la aviación, las operaciones militares y la infraestructura crítica. Ya son la principal forma de contraespacio en uso, con más de 10.000 eventos en 12 meses según SWF.
- **Dependencia de LEO comercial extranjero para conectividad rural.** Se corren riesgos de interrupción, de uso con fines de presión y de soberanía de datos.
- **Efecto indirecto de un evento tipo Kessler en 500-600 km.** Degradaría los servicios de los que depende Colombia sin que el país haya contribuido al problema.
- **Reentradas no controladas.** Hay más de 3 al día a nivel global. Colombia está en la franja ecuatorial, y la probabilidad de caída de restos varía con la latitud (**por verificar** con un análisis específico).

---

## 7. Tendencias y escenarios 2026-2035 [I]

### Tendencias con base factual

- **Crecimiento sostenido de lanzamientos y cargas.** En 2025 hubo más de 300 lanzamientos y más de 4.000 cargas. Starlink busca ampliar su constelación y pidió autorización para hasta 1 millón de satélites de cómputo. Guowang proyecta 310 satélites en 2026, 900 en 2027 y 3.600 al año desde 2028 (dato solo del buscador, **por verificar**).
- **Las maniobras de evasión crecen más rápido que la flota.** Se proyecta más de 1 millón al año hacia 2030, según la fuente sobre Starlink.
- **La regulación se endurece de forma unilateral** (FCC 5 años, EU Space Act) mientras el marco de la ONU sigue siendo voluntario.
- **El contraespacio es cada vez más "normal"**: operaciones de proximidad, recarga en órbita, guerra electrónica y ciberataques, sin nuevas pruebas ASAT destructivas desde 2021.

### Escenarios 2035 (cualitativos, no probabilísticos)

| Escenario                                      | Qué tiene que ocurrir                                                                                           | Implicación para Colombia                                                                                       |
| ---------------------------------------------- | --------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| **A. Congestión gestionada**                   | Las reglas de 5 años se extienden, se remueven activamente algunos desechos y TraCSS y EU SST comparten datos   | Colombia accede a datos abiertos; su SpOC se vuelve nodo regional de análisis                                   |
| **B. Deterioro progresivo** (tendencia actual) | Siguen las fragmentaciones accidentales y las constelaciones a más de 800 km no se retiran bien                 | Seguros más caros, más maniobras; la vida útil de FACSAT-3 se acorta                                            |
| **C. Evento disruptivo**                       | Una colisión mayor o una tormenta solar extrema (CRASH Clock de unos 2 días) desencadena cascadas en 500-600 km | Se pierden servicios LEO de conectividad y observación y aumenta la dependencia de GEO y de sistemas terrestres |
| **D. Militarización abierta**                  | Uso de ASAT o de armas co-orbitales en un conflicto entre potencias                                             | Las capacidades comerciales de las que depende Colombia quedan degradadas o condicionadas                       |

**Señales tempranas que conviene monitorear:**

- El valor del CRASH Clock.
- El índice de salud de ESA.
- Las maniobras semestrales de Starlink ante la FCC.
- Las fragmentaciones en más de 800 km.
- La aprobación de la EU Space Act.
- La entrada en operación plena de TraCSS.
- El acto legislativo sobre el nombre de la FAC y el proyecto AESCOL.

---

## 8. Fuentes

**Fuentes abiertas con WebFetch**

1. ESA Space Environment Report 2025. https://www.esa.int/Space_Safety/Space_Debris/ESA_Space_Environment_Report_2025
2. ESA Space Environment Report 2026. https://www.esa.int/Space_Safety/Space_Debris/ESA_Space_Environment_Report_2026
3. ESA DISCOS, Space Environment Statistics (31 de julio de 2026). https://sdup.esoc.esa.int/discosweb/statistics/
4. ESA, "Number of objects will skyrocket" (2026). https://www.esa.int/ESA_Multimedia/Images/2026/09/Number_of_objects_will_skyrocket_-_2026_Space_environment_report
5. ESA, "Payloads and objects" (2026). https://www.esa.int/ESA_Multimedia/Images/2026/09/Payloads_and_objects_-_2026_Space_environment_report
6. New Space Economy, análisis del informe ESA 2026 (14 de septiembre de 2026). https://newspaceeconomy.ca/2026/09/14/what-does-the-2026-space-environment-report-reveal-about-the-future-of-space-debris/
7. FODNews, informe ESA 2026 (secundaria, con cifras inconsistentes). https://fodnews.com/esa-space-environment-report-2026-leo-debris-collision-risk/
8. ESA Space Safety blog, Zero Debris Webinar 4 (26 de mayo de 2026). https://blogs.esa.int/spacesafety-community/2026/05/26/zero-debris-webinar-4-zero-debris-policy-governance/
9. J. McDowell, estadísticas de Starlink (17 de septiembre de 2026). https://planet4589.org/space/con/star/stats.html
10. Starpath, maniobras de Starlink (2026). https://starpath.global/news/starlink-satellites-now-dodging-collisions-almost-weekly-as-maneuvers-triple-in-a-year/
11. Thiele et al., "An Orbital House of Cards", arXiv 2512.09643v2 (8 de enero de 2026). https://arxiv.org/html/2512.09643v2
12. Outer Space Institute, CRASH Clock (15 de agosto de 2026). https://outerspaceinstitute.ca/crashclock/
13. Amazon, actualizaciones de Amazon Leo (2 de julio de 2026). https://www.aboutamazon.com/news/innovation-at-amazon/project-kuiper-satellite-rocket-launch-progress-updates
14. Orbital Radar, Guowang y Qianfan (septiembre de 2026). https://orbitalradar.com/satellite-internet/guowang-qianfan
15. SatNews, solicitud de SpaceX para 1 millón de satélites (31 de enero de 2026). https://satnews.com/2026/01/31/spacex-files-fcc-application-for-million-satellite-orbital-data-center/
16. KeepTrack, "10 Anti-Satellite Tests" (6 de agosto de 2026). https://keeptrack.space/top-10/10-anti-satellite-tests
17. The Conversation, fragmentaciones de 2024 (octubre de 2024). https://theconversation.com/4-300-tonnes-of-space-junk-and-rising-another-satellite-breakup-adds-to-orbital-debris-woes-241790
18. SWF, anuncio del informe Counterspace 2025 (3 de abril de 2025). https://www.swfound.org/news/swf-announces-the-release-of-the-2025-global-counterspace-capabilities-an-open-source-assessment
19. SWF, evento de lanzamiento del informe 2026. https://www.swfound.org/events/understanding-counterspace-threats-2026-report-launch-with-swf-csis
20. SWF, Multilateral Space Security Initiatives. https://www.swfound.org/publications-and-reports/multilateral-space-security-initiatives
21. CSIS, "What Are the Biggest Space Threats in 2026?" https://www.csis.org/analysis/what-are-biggest-space-threats-2026
22. SpacePolicyOnline, resolución 77/41 de la ONU (diciembre de 2022). https://spacepolicyonline.com/news/u-n-approves-resolution-not-to-conduct-destructive-asat-tests/
23. The Regulatory Review, directrices de mitigación (7 de octubre de 2025). https://www.theregreview.org/2025/10/07/conrad-orbital-debris-mitigation-guidelines/
24. Comisión Europea, EU Space Act. https://defence-industry-space.ec.europa.eu/eu-space-act_en
25. Via Satellite, TraCSS (26 de agosto de 2026). https://www.satellitetoday.com/government-military/2026/08/26/tracss-traffic-coordination-system-remains-in-pilot-mode-due-to-budget-uncertainty/
26. Payload, informe del WEF sobre desechos (29 de enero de 2026). https://payloadspace.com/wefs-space-debris-report-projects-significant-costs/
27. IILA, primera Asamblea de ALCE (20 de febrero de 2026). https://iila.org/es/iila-participa-en-la-primera-asamblea-general-de-la-agencia-latinoamericana-y-caribena-del-espacio-alce-mexico-20-de-febrero-de-2026/
28. MundoGEO, inversiones del programa espacial brasileño (22 de octubre de 2025). https://mundogeo.com/2025/10/22/mcti-destaca-investimentos-para-fortalecer-programa-espacial-brasileiro/
29. Argentina.gob.ar, lanzamiento de SAOCOM 1B. https://www.argentina.gob.ar/noticias/argentina-lanzo-el-satelite-saocom-1b-y-completo-la-mision-espacial-mas-importante-del-pais
30. Expansión, disolución de la AEM (29 de enero de 2025). https://expansion.mx/tecnologia/2025/01/29/agencia-espacial-mexicana-desaparecera-y-sera-sustituida
31. La Tercera, FASat-Delta (junio de 2023). https://www.latercera.com/que-pasa/noticia/usando-un-cohete-de-space-x-chile-pone-en-orbita-su-tercer-satelite-espacial-el-fasat-delta/P63WKSLJTZDIZD4QYBGSLHTUIA/
32. Infodefensa, PeruSat-1 y contrato con Airbus (2026). https://www.infodefensa.com/texto-diario/mostrar/5967270/peru-confirma-extension-anos-vida-util-satelite-optico-perusat-1
33. Correo del Sur, Túpac Katari (8 de febrero de 2026). https://correodelsur.com/seguridad/20260208/el-satelite-tupac-katari-tiene-vida-util-hasta-2030.html
34. ABAE, gestión orbital responsable (14 de marzo de 2026). https://abae.gob.ve/venezuela-avanza-hacia-una-gestion-orbital-responsable-frente-al-riesgo-de-los-desechos-espaciales/
35. El Tiempo, regreso al nombre Fuerza Aérea (21 de agosto de 2026). https://www.eltiempo.com/justicia/investigacion/la-fuerza-aerea-colombiana-fac-volvera-a-su-nombre-original-tras-dos-anos-como-fuerza-aeroespacial-3579950
36. Infodefensa, Colombia devuelve a su Fuerza Aérea su denominación histórica (25 de agosto de 2026). https://www.infodefensa.com/texto-diario/mostrar/5990663/140-colombia-colombia-devuelve-fuerza-aerea-denominacion-historica
37. El Tiempo, proyecto AESCOL (agosto de 2025). https://www.eltiempo.com/politica/gobierno/gobierno-de-petro-propone-crear-la-nasa-colombiana-este-es-el-proyecto-de-ley-que-se-radico-para-la-agencia-espacial-3483392
38. FAC, "Un año en órbita cumple FACSAT II" (15 de abril de 2024). https://www.fac.mil.co/es/noticias/un-ano-en-orbita-cumple-el-segundo-satelite-colombiano-facsat-ii-chiribiquete
39. FAC, inauguración del SpOC (28 de julio de 2022). https://www.fac.mil.co/es/noticias/inaugurado-centro-de-operaciones-espaciales-de-la-fuerza-aerea-colombiana
40. FAC, cooperación espacial con EE. UU. (30 de julio de 2024). https://www.fac.mil.co/index.php/es/noticias/colombia-y-estados-unidos-fortalecen-cooperacion-espacial-y-de-seguridad
41. Infoespacial, memorando SSA Colombia-EE. UU. (octubre de 2021). https://www.infoespacial.com/texto-diario/mostrar/3565729/colombia-eeuu-profundizan-cooperacion-materia-espacial
42. Portilla y Murcia, evolución orbital de FACSAT-1 (Redalyc, 2021). https://www.redalyc.org/journal/6735/673570962001/html/
43. Wikipedia, FACSAT-1 (secundaria). https://en.wikipedia.org/wiki/FACSAT-1
44. Wikipedia, FACSAT-2 (secundaria). https://es.wikipedia.org/wiki/FACSAT-2
45. Corte Constitucional, sentencia C-206/22. https://www.corteconstitucional.gov.co/relatoria/2022/C-206-22.htm
46. NASA, firma de los Acuerdos Artemis por Colombia (10 de mayo de 2022). https://www.nasa.gov/humans-in-space/nasa-welcomes-vice-president-of-colombia-for-artemis-accords-signing/
47. Infobae, Colombia y Artemis (10 de abril de 2026). https://www.infobae.com/colombia/2026/04/10/colombia-en-la-mision-artemis-de-la-nasa-este-es-el-acuerdo-que-pacto-con-estados-unidos-y-que-lo-sumo-a-la-nueva-carrera-espacial/
48. Space in Africa, Yibuti como signatario 72 de Artemis (14 de septiembre de 2026). https://spaceinafrica.com/2026/09/14/djibouti-becomes-eighth-african-nation-to-sign-the-artemis-accords/
49. Forbes Colombia, datos de la CRC al cierre de 2025 (20 de mayo de 2026). https://forbes.co/2026/05/20/tecnologia/colombia-cerro-2025-con-4975-millones-de-accesos-a-internet-movil-segun-la-crc/
50. TeleSemana, consulta de la CRC sobre integración satélite-móvil (1 de septiembre de 2026). https://www.telesemana.com/blog/2026/09/01/colombia-estudia-la-integracion-de-los-satelites-y-otras-plataformas-aereas-con-las-redes-moviles

**Fuentes vistas solo en el buscador (sus datos quedan "por verificar")**

- SWF, informe completo 2025: https://www.swfound.org/publications-and-reports/2025-global-counterspace-capabilities-report
- SpaceNews, regla de 5 años de la FCC: https://spacenews.com/fcc-adopts-new-5-year-rule-for-deorbiting-satellites/
- SpaceNews, Shenzhou-20: https://spacenews.com/china-delays-shenzhou-20-crew-return-after-suspected-space-debris-impact/
- Kessler y Cour-Palais (1978): https://agupubs.onlinelibrary.wiley.com/doi/abs/10.1029/JA083iA06p02637
- Directrices LTS de COPUOS: https://ui.adsabs.harvard.edu/abs/2021JSSE....8...98M/abstract
- UNOOSA, Tratado del Espacio: https://www.unoosa.org/oosa/en/ourwork/spacelaw/treaties/outerspacetreaty.html
- CONPES 3983: https://colaboracion.dnp.gov.co/CDT/Conpes/Econ%C3%B3micos/3983.pdf
- Texto del PL 179/2025: https://leyes.senado.gov.co/p-ley/2025-2026/PL%20179-25%20-%20AGENCIA%20ESPACIAL%20DE%20LA%20REPUBLICA%20DE%20COLOMBIA.pdf
- INPE, CBERS-6: https://www.gov.br/inpe/pt-br/assuntos/ultimas-noticias/decreto-presidencial-oficializa-parceria-brasil-china-para-o-satelite-cbers-6
- eoPortal, SAOCOM: https://www.eoportal.org/satellite-missions/saocom
- ABAE, VRSS-2 y VENESAT-1: https://abae.gob.ve/vrss-2-satelite-sucre/ ; https://abae.gob.ve/venesat-1-satelite-simon-bolivar/
- Breaking Defense, financiación de TraCSS: https://breakingdefense.com/2025/07/appropriators-restore-funding-for-commerces-tracss-spacewatch-effort/
- SRE México, entrada en vigor de ALCE (la página devolvió error 404): https://mision.sre.gob.mx/oea/comunicados/48-comunicados-2024/1009-entra-en-vigor-convenio-constitutivo-de-la-agencia-latinoamericana-y-caribena-del-espacio-26-oct-24
