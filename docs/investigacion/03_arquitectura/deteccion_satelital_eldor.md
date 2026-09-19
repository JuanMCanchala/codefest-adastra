# Detección de minería ilegal y cobertura boscosa sobre imágenes (ELDOR)

Evaluación de viabilidad y registro de la implementación en la rama
`mineria-forestacion-demo`. Todo número de esta página se midió en este repositorio; los
que vienen del paper o de la ficha del modelo se marcan como tales.

---

## 1. Qué se evaluó

Cinco recursos de observación de la Tierra propuestos para detectar minería ilegal y
deforestación:

| Recurso                      | Qué es                                                                 | Veredicto                                                                |
| ---------------------------- | ---------------------------------------------------------------------- | ------------------------------------------------------------------------ |
| **IRSC/ELDOR-checkpoints**   | 100+ checkpoints de segmentación y clasificación entrenados con ELDOR | **Integrado.** El único con pesos ya entrenados para minería ilegal     |
| **Dataset ELDOR**            | 12 ortomosaicos de dron de minas de oro en Madre de Dios (Perú)        | **Integrado.** Aporta las imágenes y la verdad de terreno                |
| **TerraMind 1.0**            | Modelo base multimodal (Sentinel-1/2, RGB, elevación)                  | Descartado: exige _fine-tuning_ con etiquetas propias                     |
| **Prithvi EO 2.0**           | Base geoespacial de IBM/NASA para análisis multitemporal               | Descartado por lo mismo. Es la vía correcta para medir _cambio_ en el tiempo |
| **SatlasPretrain**           | _Backbone_ para Sentinel/Landsat y alta resolución                     | Descartado: el repositorio de Hugging Face responde 401                   |

La decisión sale de una restricción simple: ELDOR trae pesos entrenados para la tarea
exacta; los otros tres son bases que habría que entrenar.

## 2. Lo que se verificó antes de escribir código

| Comprobación                      | Resultado                                                        |
| --------------------------------- | ---------------------------------------------------------------- |
| ¿El repositorio existe y es abierto? | Sí. `IRSC/ELDOR-checkpoints`, sin _gating_, 0 descargas         |
| ¿Hay imágenes para inferir?       | Sí. `IRSC/ELDOR`, 12 sitios con imagen y máscara                 |
| ¿El checkpoint carga?             | Sí, **tras dos correcciones** (§4)                                |
| ¿Corre sin GPU?                   | Sí. **361 ms/tile** de 512×512 con 8 hilos de CPU                |
| ¿Cuánto tarda un sitio?           | Anel (18.274×18.420 px = 1.296 tiles) ≈ **22 min** en CPU        |

### Elección del checkpoint

Del `summary.md` del repositorio (métricas **del paper**, sobre el test completo):

| Modelo                                    | Parámetros | `test_miou_present` |
| ----------------------------------------- | ---------: | ------------------: |
| **SegFormer MiT-B2, `weighted_ce+dice`**  | **27,4 M** |          **0,4010** |
| MANet ResNet-50, `focal+dice`             |     35,9 M |              0,3999 |
| UNetFormer ResNet-18                      |     11,7 M |              0,3941 |
| DeepLabV3+ ConvNeXt-Tiny                  |     29,3 M |              0,3895 |
| SegNeXt MSCAN-Tiny                        |      4,2 M |              0,2682 |

Se eligió SegFormer MiT-B2: el mejor mIoU del benchmark con una arquitectura que
`transformers` ya construye. Los demás exigen `mmsegmentation`, GeoSeg o `mamba-ssm`, y
las variantes Mamba necesitan CUDA.

## 3. Resultado medido en este repositorio

Recorte de 2.048×2.048 px del sitio Anel, contra su máscara anotada:

| Clase                       |   IoU |
| --------------------------- | ----: |
| Suelo desnudo               | 0,665 |
| Cuerpos de agua             | 0,664 |
| Montículos de cascajo       | 0,606 |
| Regeneración natural tipo 1 | 0,415 |
| Regeneración natural tipo 2 | 0,396 |
| Balsa minera                | 0,318 |
| **mIoU (clases presentes)** | **0,255** |
| **Exactitud por píxel**     | **0,664** |

Coherente con el 0,34-0,40 del paper: esto es un recorte, no el test completo, y el mIoU
castiga las clases raras que casi no aparecen en él.

**Cómo leer esto.** Dos de cada tres píxeles quedan bien clasificados, y las clases de
área grande —suelo desnudo, agua, cascajo— superan 0,6 de IoU. Alcanza para medir
**extensión** con el orden de magnitud correcto. No alcanza para contar objetos pequeños:
tolvas y maquinaria pesada están por debajo del 0,01 % del área del conjunto.

## 4. Dos trampas del checkpoint

Ninguna está documentada en el repositorio de origen, y las dos hacen que el modelo
_parezca_ funcionar mientras produce basura.

1. **Nomenclatura de claves.** El checkpoint se entrenó con `transformers` 4.x. La 5.x
   renombró el árbol de SegFormer: `segformer.encoder.block.{s}.{b}` →
   `segformer.stages.{s}.blocks.{b}`, `mlp.dense1` → `mlp.fc1`,
   `attention.self.query` → `attention.q_proj`, entre otros. Con
   `load_state_dict(strict=False)` las 372 claves se descartan **en silencio** y el
   modelo predice con pesos aleatorios: exactitud por píxel **0,007**.
   `app/eldor/modelo.py` hace el remapeo y después **exige** 0 claves faltantes y 0
   sobrantes; si no encajan, lanza una excepción en vez de seguir.

2. **Desfase de clases.** El head tiene 14 salidas para las etiquetas canónicas
   **1..14**: `0=Background` se entrena como `ignore_index`. El índice `i` del `argmax`
   corresponde a la clase `i+1`. Sin el desplazamiento, cada predicción cae en la clase
   contigua —el agua se reporta como maquinaria pesada— y la exactitud se queda en 0,007
   aunque los pesos estén bien cargados.

El síntoma de las dos es idéntico, y por eso conviene dejarlo escrito: una exactitud
absurda con el modelo «cargado correctamente».

## 5. Cómo quedó integrado

```
scripts/eldor_precalcular.py     fuera de línea: segmenta y escribe la evidencia
  └── agent/datos/eldor/*.json   áreas por clase + procedencia + validación
agent/app/eldor/
  ├── sitios.py                  metadatos espaciales y mapa de clases
  ├── modelo.py                  carga del checkpoint, remapeo y barrido por tiles
  └── evidencia.py               lectura de los JSON y agregaciones
agent/app/agents.py              AgenteSatelital (cuarto agente)
agent/app/graph.py               ruta `satelital` en el orquestador
```

**El agente no ejecuta el modelo.** La segmentación es fuera de línea; en tiempo de
respuesta solo se leen los JSON. Tres consecuencias: la latencia del chat no cambia, la
imagen del agente no carga `torch` ni `Pillow`, y las cifras son reproducibles corriendo
otra vez el script sobre el mismo ortomosaico.

**Degradación.** Si no hay JSON en `agent/datos/eldor/`, el agente no se registra en el
grafo y la ruta `satelital` cae al agente de corpus, que sí tiene evidencia textual sobre
monitoreo satelital (`F3-CEOBS-008`, `F2-INPE-055`). El sistema se comporta igual que
antes de esta rama. Hay una prueba que lo fija.

### Trazabilidad

Un fragmento del corpus se cita con `doc_id` + `chunk_id`. Una medición sobre imagen se
cita con su equivalente espacial, que `Deteccion.referencia()` arma en una línea:

```
ELDOR/Anel · EPSG:32719 · lon [-69.714044, -69.699976] lat [-12.713767, -12.701071]
· vuelo 2022-04-08 · SegFormer MiT-B2 (segformer_b2_baseline2_augv2_weighted_ce_dice/best.pt)
```

Sitio, sistema de referencia, rectángulo geográfico, fecha de vuelo y checkpoint exacto.
Los resúmenes entran a `evaluacion.retrieval_context`, así que la fidelidad de la
respuesta se mide contra las mediciones igual que contra los fragmentos (§2.5, bloque A).

## 6. Límites que hay que decir en voz alta

No son detalles: cambian lo que se puede afirmar frente al jurado.

- **Los sitios son peruanos, no colombianos.** Los 12 ortomosaicos están en Madre de Dios
  (Perú), entre −69,6° y −70,7° de longitud. Son evidencia de minería aluvial amazónica,
  no del territorio colombiano. El prompt del agente lo obliga a aclararlo cuando la
  pregunta menciona Colombia.
- **Son imágenes de dron, no satelitales.** La resolución va de 3 a 7,5 cm/píxel. El
  modelo no sirve para Sentinel-2 (10 m/píxel): son tres órdenes de magnitud de
  diferencia. Aplicarlo a imagen satelital exige reentrenar, y ahí es donde entrarían
  Prithvi EO 2.0 o TerraMind.
- **No mide deforestación, mide cobertura.** Cada sitio tiene **un solo vuelo**. Se puede
  decir cuánta superficie no es bosque primario hoy; no cuánta se perdió, porque no hay
  dos fechas del mismo sitio. `area_intervenida_ha` es una resta entre áreas medidas, no
  un índice ponderado: encaja con la prohibición de puntajes inventados del Anexo B.2.5.
- **Una foto de un día.** Las capturas son de 2022. No son monitoreo vivo.
- **El dato no cruza con el corpus.** No hay forma de unir un polígono peruano con las
  fichas de alertas del corpus, que son municipios colombianos con DIVIPOLA. Son dos
  cuerpos de evidencia que se presentan juntos, no una fusión.

## 7. Relación con la vía que ya existía

El corpus ya sostiene el tema sin modelo de visión: las fichas de Alertas Tempranas traen
economías ilícitas, con **55 alertas** que mencionan minería ilegal y **5** tala ilegal,
georreferenciadas por DIVIPOLA y trazables a `doc_id`/`chunk_id`. Eso se consulta con
`mapa_colombia` filtrando por `economia`, y responde la pregunta **colombiana**.

Las dos vías responden cosas distintas y conviene no confundirlas:

| Pregunta                                        | Vía                                       |
| ----------------------------------------------- | ------------------------------------------ |
| ¿Dónde se reporta minería ilegal en Colombia?   | Corpus: `mapa_colombia`, filtro `economia` |
| ¿Cuánta superficie ocupa una mina de oro amazónica? | ELDOR: agente satelital                |
| ¿Cómo se detecta minería ilegal desde el espacio? | Corpus: `F3-CEOBS-008`, `F2-INPE-055`    |

## 8. Siguiente paso natural

Un componente de tablero para los polígonos ELDOR. No se construyó en esta rama porque el
tablero resuelve sus datos contra `dashboard.db` con trazabilidad a `doc_id`/`chunk_id`, y
estas detecciones usan otro esquema de procedencia; meterlas sin diseñar antes ese
contrato rompería la regla dura del Anexo B.1.3. Los JSON ya tienen la forma necesaria
para alimentarlo cuando el contrato exista.

## 9. Reproducir

```bash
pip install -r scripts/requirements-eldor.txt
python scripts/eldor_precalcular.py --todos-test --hilos 8
cd agent && python -m pytest tests/test_eldor.py -q
```

El script descarga el checkpoint (329 MB) y los ortomosaicos (Anel pesa 724 MB), y omite
los sitios que ya tengan su JSON.
