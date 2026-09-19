# etapa1 — recuperación de la Etapa 1

Copia del paquete `src/` del repositorio de la Etapa 1
([codefest-adastra-2026](https://github.com/JuanMCanchala/codefest-adastra-2026), commit `a88941d`),
reducida a lo necesario para *consultar* la base vectorial: esquema, encoders BGE-M3, índices FAISS
y disperso, fusión RRF, reranking, agregación por documento y recuperación por grafo.

No incluye extracción, OCR, chunking de indexación ni construcción del grafo: la base ya está
construida y se monta en el contenedor (`BASE_VECTORIAL_DIR`).

Cambios respecto al original, solo de calidad de código (sin cambio de comportamiento):
`assert` reemplazados por `ValueError`, excepciones capturadas de forma específica, `zip(strict=False)`
explícito y formato `ruff`.
