# Análisis transversal del corpus

## Alcance y método

Análisis de los metadatos de `docs.jsonl`, las 50 consultas de `queries.jsonl` y el libro `Indice_Datos_Codefest.xlsx`, todos del corpus oficial. Las referencias con formato `F#-...` son `doc_id` del corpus. No se incorporaron cifras externas: los documentos de detalle identifican la evidencia que debe citarse al responder.

## Qué parece evaluar el jurado

Las consultas se distribuyen en tres bloques cerrados: F1 (`q001–q016`), F2 (`q017–q032`) y F3 (`q033–q050`). Todas están en español, pero la evidencia combina materiales en español e inglés. Predominan las preguntas explicativas/factuales; las de riesgos, implicaciones y oportunidades requieren una respuesta analítica sustentada, no una afirmación causal sin fuente.

- **F1:** empleo operacional de IA, autonomía, drones, inteligencia/targeting, ciberseguridad, cómputo, chips, talento, dependencia y DIH. Colombia aparece explícitamente en `q005`, `q008`, `q011`, `q012` y `q014–q015`; el corpus aporta contexto regional mediante ILIA y Ruta N, no una fuente militar colombiana específica.
- **F2:** contraespacio, interferencia y spoofing, RPO, energía dirigida, armas antisatélite y basura orbital. La fuente de referencia transversal es la serie Global Counterspace Capabilities de SWF (2025–2026); CSIS complementa incidentes/estrategia y ESA cuantifica entorno y mitigación de desechos.
- **F3:** control territorial y economías ilícitas en América Latina, con un segmento colombiano muy definido (`q041–q049`). Alertas Tempranas y MAPP/OEA son las fuentes más pertinentes para Colombia; Amazon Underworld permite dimensión geoespacial transfronteriza.

## Prioridad de recuperación

1. Para hechos fechados, recuperar primero los informes 2025–2026: `F2-SWF-124`, `F2-CSIS-122`, `F2-ESA-028`, `F3-MAPPOEA-019`, `F3-SIPRI-075`.
2. Para Colombia, filtrar los textos de Alertas Tempranas por departamento, municipio, GAO/GAOR/GDO y economía ilícita; citar el `doc_id` individual, no solo la colección.
3. Separar evidencia de inferencia. Por ejemplo, los informes pueden documentar una capacidad, pero su impacto para Colombia es una interpretación que debe presentarse como tal.
4. Para visualizaciones, comenzar por los archivos explícitamente estructurados enumerados en [datos_graficables.md](datos_graficables.md); PDF/JSON narrativos requieren extracción y normalización.

## Cobertura y discrepancia

`docs.jsonl` contiene **1.825** documentos: F1 459, F2 478 y F3 888. El índice XLSX reporta **1.826** (F1 459, F2 479, F3 888); la diferencia es un registro de F2. Se usa `docs.jsonl` como catálogo operativo porque entrega `doc_id` y ruta para los textos extraídos. Véanse [preguntas_jurado.md](preguntas_jurado.md), [indice_datos.md](indice_datos.md), [inventario_corpus.md](inventario_corpus.md), [datos_graficables.md](datos_graficables.md) y [conexiones.md](conexiones.md).
