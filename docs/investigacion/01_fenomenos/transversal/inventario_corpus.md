# Inventario del corpus procesado

Fuente: `C:/Programacion/ANDES/data/processed/docs.jsonl`. Cada registro aporta `doc_id`, ruta en `fuente`, fenómeno y formato. El inventario contiene **1.825** documentos; los textos extraídos se encuentran en `data/processed/text/<doc_id>.txt`.

| Fenómeno | Documentos | Organizaciones (documentos) |
|---|---:|---|
| F1 IA y capacidades estratégicas | 459 | AI Index Stanford 65; Atlantic Council 186; CENIA 27; CSET Georgetown 127; DAIO 35; Defensa21 LatAm 2; ILIA Latam 10; Ruta N/GEIAL 7. |
| F2 Seguridad del entorno espacial | 478 | CSIS Aerospace 214; ESA Space Debris 40; INPE 59; SWF Counterspace 134; UNOOSA 31. |
| F3 Dinámicas territoriales | 888 | Alertas Tempranas 425; Amazon Underworld 75; CEEEP 80; CEOBS 38; MAPP/OEA 35; RESDAL 107; SIPRI 128. |

## Formatos

| Formato de `docs.jsonl` | Cantidad | Lectura analítica |
|---|---:|---|
| JSON | 954 | Principalmente artículos, catálogos y registros web; puede contener campos estructurados, pero hay que inspeccionar cada esquema. |
| PDF | 759 | Informes, estudios y atlas; evidencia textual y tablas que requieren extracción. |
| PBF | 73 | Teselas vectoriales de Amazon Underworld: datos geoespaciales para mapa, no texto de cita. |
| CSV | 26 | Datos estructurados, candidatos directos a tablas, series y gráficos. |
| JPG / image | 8 | Figuras; usar solo si se verifica el contexto original. |
| XLSX | 4 | Hojas estructuradas de AI Index, aptas para indicadores. |
| TXT | 1 | Texto completo del reporte SWF 2026. |

## Año e idioma: inferencia conservadora

El metadato no contiene campos normalizados de año ni idioma. Se pueden inferir de manera fiable cuando aparecen en la ruta/nombre; en los demás casos se deben leer metadatos o texto antes de citarlos.

- **Series fechadas identificables:** AI Index 2017–2026 (`F1-AIINDEX-015` a `F1-AIINDEX-023`); ILIA 2023–2025 (`F1-ILIA-001` a `F1-ILIA-009`); Space Environment Report ESA 2017–2026 (`F2-ESA-028` a `F2-ESA-038`); CSIS Space Threat Assessment 2019–2025 (p. ej. `F2-CSIS-035`, `F2-CSIS-122`); SWF Global Counterspace 2018–2026 (p. ej. `F2-SWF-078`, `F2-SWF-124`); Atlas RESDAL 2024 (`F3-RESDAL-001` a `F3-RESDAL-030`); MAPP/OEA 2008–2026 (p. ej. `F3-MAPPOEA-001`, `F3-MAPPOEA-019`).
- **Idiomas claramente inferibles de la ruta:** español en documentos con `esp`, `español`, nombres españoles o fuentes colombianas/peruanas; inglés en `eng`, `english` y la mayoría de AI Index, CSIS, CSET, ESA, SWF y SIPRI; también hay ejemplares en chino, francés, árabe, ruso y portugués en SWF. Esta es una señal de archivo, no una clasificación exhaustiva.
- **No inferible sin lectura:** archivos de nombre opaco (por ejemplo, buena parte de CSET, Alertas y CEOBS) y JSON cuyo título no declara año/idioma. Estado: **por verificar**.

## Cobertura funcional

- F1 combina indicadores de IA con estudios sobre tecnología y defensa. Las fuentes regionales son ILIA y Ruta N; su alcance no sustituye evidencia propia de las Fuerzas Militares de Colombia.
- F2 concentra los datos de amenaza en SWF/CSIS y los ambientales en ESA; INPE aporta la perspectiva brasileña y UNOOSA la normativa.
- F3 concentra evidencia colombiana en Alertas y MAPP/OEA, comparabilidad regional en RESDAL y geografía transfronteriza en Amazon Underworld.

Los archivos estructurados y su uso se detallan en [datos_graficables.md](datos_graficables.md).
