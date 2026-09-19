# F3 — Dinámicas Territoriales y amenazas regionales en América Latina

Investigación de fondo sobre el tercer fenómeno del CODEFEST AD ASTRA 2026: conflicto, crimen
organizado, economías ilícitas, gobernanza, migración, violencia y medio ambiente en América
Latina y el Caribe, con foco en Colombia.

Fuente principal: el corpus oficial del reto (`C:/Programacion/ANDES/data/processed/`), 888
documentos clasificados como fenómeno 3. Cada dato del corpus se cita con su `doc_id`
(formato `F3-<ORG>-NNN`). Los datos tomados de la web se citan con URL y año.

## Archivos

| Archivo | Contenido |
|---|---|
| [`fuentes_corpus.md`](fuentes_corpus.md) | Las 7 organizaciones del corpus F3, qué contiene cada una, cómo está estructurada y para qué sirve |
| [`cifras_clave.md`](cifras_clave.md) | Tabla `dato \| valor \| año \| fuente`, ordenada por tema |
| [`global.md`](global.md) | Perspectiva global: crimen organizado transnacional, gasto militar y transferencias de armas (SIPRI), seguridad ambiental y conflicto (CEOBS) |
| [`regional.md`](regional.md) | América Latina y el Caribe: homicidios, Amazonía y economías ilícitas transfronterizas, migración venezolana, defensa comparada (RESDAL), Perú/Ecuador/Brasil |
| [`colombia.md`](colombia.md) | Colombia: grupos armados y presencia territorial, paz total, economías ilícitas, **tabla por departamento de las alertas tempranas** (apta para mapa) |
| [`preguntas.md`](preguntas.md) | Las 18 preguntas de `queries.jsonl` que tocan F3 (q033–q050), respuesta desde el corpus con `doc_id` de soporte, más preguntas probables adicionales |

## Estructura del fenómeno

Tres ejes que el corpus cubre de forma desigual y que conviene tratar por separado:

1. **Actores armados y control territorial.** Quién está dónde, con qué capacidades y sobre qué
   población. El corpus es muy fuerte aquí para Colombia (425 documentos de Alertas Tempranas de
   la Defensoría del Pueblo + 35 informes de la MAPP/OEA) y medio para la Amazonía
   transfronteriza (dataset georreferenciado de Amazon Underworld, 987 municipios de 6 países).
2. **Economías ilícitas y medio ambiente.** Narcotráfico, minería ilegal de oro, deforestación,
   ataques a infraestructura petrolera. El corpus documenta el mecanismo (cómo financia y
   cómo se ejerce control) mejor que las magnitudes; las magnitudes hay que complementarlas con
   fuentes externas (UNODC, IDEAM).
3. **Gasto militar, armas y gobernanza.** SIPRI (128 docs) da las series de gasto militar y
   transferencias de armas; RESDAL (107 docs) da el marco institucional comparado de la defensa
   en América Latina y el Caribe; CEEEP (80 docs, Perú) aporta análisis estratégico regional.

## Advertencias metodológicas

- **El texto extraído de los 363 registros JSON de alertas tempranas es parcial.** Corresponde a
  la ficha web de cada alerta (mapa, veredas, resguardos, grupos armados, escenario de riesgo,
  poblaciones en riesgo, tipo de alerta, municipios), no al documento completo de la alerta. Los
  62 PDF de `pdfs/Informes` sí son documentos completos, pero su OCR es irregular. Ver
  [`fuentes_corpus.md`](fuentes_corpus.md).
- **Las tablas de los PDF de SIPRI y del Atlas RESDAL pierden los valores numéricos** al
  extraerse a texto plano: las columnas quedan separadas de los encabezados. Los datos numéricos
  de SIPRI usados aquí provienen del texto corrido de los *fact sheets*, no de sus tablas.
- **Una alerta temprana puede cubrir muchos departamentos.** Las alertas de alcance nacional
  (p. ej. sobre líderes sociales o ciclos electorales) advierten sobre decenas de municipios en
  más de 20 departamentos. El conteo por departamento mide *cobertura de advertencia*, no
  intensidad del riesgo en ese departamento.
- **El corpus llega hasta mediados de 2026.** Documentos como el Informe Periódico 40 de la
  MAPP/OEA (`F3-MAPPOEA-019`, 22 de mayo de 2026) o el *fact sheet* de gasto militar de SIPRI
  (`F3-SIPRI-076`, abril de 2026) son las fuentes más actuales disponibles.
- Se distingue explícitamente entre **hecho** (dato con fuente) e **interpretación** (lectura
  propia, marcada como tal). Lo no verificado se marca `por verificar`.
