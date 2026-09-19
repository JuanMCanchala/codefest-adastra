# Investigación de Nicolás — material previo a la especificación FINAL

Estos documentos se produjeron **antes** de recibir `CODEFEST_2026_Etapa2_FINAL.pdf` (ver
`docs/especificacion/`), a partir de las imágenes del reto y de la Etapa 1
(`ad-astra-retrieval/`). Se suben como respaldo e insumo adicional; el análisis ya vigente y
contrastado contra la especificación oficial vive en
[`../contraste_especificacion.md`](../contraste_especificacion.md) y
[`../sintesis.md`](../sintesis.md).

| Documento | Contenido | Estado |
|---|---|---|
| [`investigacion_sistema_multiagente.md`](investigacion_sistema_multiagente.md) | Investigación profunda de arquitectura multiagente, GUI, catálogo de visualización, escenarios sobre restricción de modelos generativos, herramientas 2026 | Mayormente reemplazado por `contraste_especificacion.md`; conserva valor en catálogo de visualizaciones (§5.2), ideas de valor agregado (§9) y preguntas para el jurado/tutor (§11) |
| [`reto_texto_de_las_imagenes.txt`](reto_texto_de_las_imagenes.txt) | Texto crudo extraído de las imágenes del reto, desordenado | Histórico; tenía la fecha de entrega equivocada (18 en vez de 19 de septiembre), ya corregida en la especificación oficial |
| [`resumen_ad-astra-retrieval.pdf`](resumen_ad-astra-retrieval.pdf) | Resumen técnico del sistema de recuperación de la Etapa 1 | Vigente como referencia rápida de la arquitectura Etapa 1 |
| [`coolify_setup.md`](coolify_setup.md) | Notas de instalación de Coolify en WSL2 para pruebas locales de despliegue | Vigente; complementa el Anexo A de la especificación (despliegue en Coolify) |

## Explicación clara del reto FINAL (Etapa 2)

Fuente: `docs/especificacion/CODEFEST_2026_Etapa2_FINAL.pdf`, versión 1.0, julio 2026, 28 páginas.

- **Objetivo:** construir, sobre la base vectorial de la Etapa 1, un producto analítico
  interactivo con dos componentes: un asistente conversacional (Reto 1) y un dashboard de
  analítica visual (Reto 2), ambos soportados por una arquitectura multiagente.
- **Reto 1** exige mínimo tres agentes (orquestador, agente de corpus, agente de
  visualización), un endpoint `POST /chat` que responde con el contrato JSON exacto de
  la sección 2.4 (bloques `respuesta`, `evaluacion`, `metadata`), y una ficha del agente
  (`agent card`) en JSON con el formato propio de ADL.
- **Reto 2** exige un dashboard que el propio sistema multiagente pueble dinámicamente
  (no vistas fijas), con trazabilidad obligatoria a `doc_id`/`chunk_id` y sin puntajes o
  índices inventados.
- **Evaluación del Reto 1:** 40 % calidad de respuesta, 20 % eficiencia/costo, 20 %
  seguridad (75 % resistencia a prompt injection, 25 % análisis estático), 20 % diseño.
- **Evaluación del Reto 2:** 40 % propuesta de diseño, 55 % ejecución dinámica (el jurado
  pregunta en vivo y evalúa si el agente activa el componente correcto), 5 % calidad de
  código.
- **Despliegue:** Coolify con Dockerfile, repositorio privado en GitHub con ADL y
  evaluadores como colaboradores, modelos exclusivamente vía Amazon Bedrock con bolsa de
  USD 100 por equipo.
