# Investigación — CODEFEST AD ASTRA 2026, Final (Etapa 2)

Índice de la investigación de soporte para los Retos 1 y 2, construida sobre la base vectorial de
la Etapa 1 (`C:/Programacion/ANDES`, solo lectura).

## Documentos

| Documento | Contenido |
|---|---|
| [`fenomeno1_ia_militar.md`](fenomeno1_ia_militar.md) | IA e innovación en entornos militares: actores, fuentes, cifras, perspectivas y visualizaciones sugeridas |
| [`fenomeno2_seguridad_espacial.md`](fenomeno2_seguridad_espacial.md) | Seguridad espacial y órbita baja (LEO): congestión orbital, basura espacial, gobernanza |
| [`fenomeno3_dinamicas_territoriales.md`](fenomeno3_dinamicas_territoriales.md) | Dinámicas territoriales en América Latina: conflicto, desigualdad, migración, Colombia |
| [`arquitectura_multiagente.md`](arquitectura_multiagente.md) | Patrones y frameworks multiagente con RAG para el Reto 1, comparativa de GUIs, reutilización de la base vectorial |
| [`analitica_visual_agente.md`](analitica_visual_agente.md) | Cómo un agente genera visualizaciones desde lenguaje natural (Reto 2) e integración con el Reto 1 |
| [`nicolas/`](nicolas/README.md) | Investigación previa de Nicolás (arquitectura multiagente, catálogo de visualizaciones, notas de despliegue en Coolify) subida como respaldo e insumo adicional |

## Resumen ejecutivo

Los tres fenómenos del reto —IA militar, seguridad espacial/LEO y dinámicas territoriales en
América Latina— comparten una estructura común útil para el diseño de la solución: cada uno tiene
fuentes autorizadas claras a nivel global (**SIPRI** https://www.sipri.org, **OTAN**
https://www.nato.int/cps/en/natohq/topics_184303.htm, **AI Index de Stanford**
https://aiindex.stanford.edu; **ESA** https://www.esa.int/Space_Safety/Space_Debris,
**UNOOSA** https://www.unoosa.org, **IADC** https://www.iadc-home.org; **CEPAL**
https://www.cepal.org, **PNUD** https://hdr.undp.org, **UNODC**
https://www.unodc.org/unodc/en/data-and-analysis/global-study-on-homicide.html), fuentes u
observatorios propios de la región y de Colombia (**FAC** https://www.fac.mil.co,
**Agencia Espacial Colombiana** https://www.aec.gov.co, **JEP** https://www.jep.gov.co,
**Unidad para las Víctimas** https://www.unidadvictimas.gov.co, **DANE**
https://www.dane.gov.co), y admiten el mismo tipo de contraste multinivel (global → regional →
nacional) que el jurado puede pedir explícitamente en preguntas. Ninguna cifra puntual debe
presentarse en el pitch sin verificarla contra el informe original citado en cada documento de
fenómeno: varias quedaron marcadas como "por verificar" precisamente para evitar inventar números
en la demo.

La base vectorial de la Etapa 1 (BGE-M3 + FAISS + reranker + grafo GLiNER) ya resuelve la parte más
costosa del Reto 1 y del Reto 2: recuperación multilingüe de alta calidad y un grafo de entidades
reutilizable para visualización de redes. El trabajo nuevo real es (a) añadir una capa de
generación conversacional con LLM sobre esos fragmentos recuperados —prohibida deliberadamente en
la Etapa 1— envuelta en agentes especializados, y (b) exponer esa misma base como fuente de datos
para un agente de analítica visual.

## Recomendación concreta de arquitectura

**Reto 1**: orquestador construido en **LangGraph** que enruta cada consulta a un agente
especialista por fenómeno (filtrando por el campo `fenomeno` ya presente en la metadata de la Etapa
1), seguido de un agente verificador de citas que usa el cross-encoder reranker (`bge-reranker-v2-m3`)
ya disponible para confirmar que la respuesta generada está respaldada por los fragmentos citados.
GUI en **Streamlit** con interfaz de chat. Esto da 3+ agentes con roles diferenciados, superando
holgadamente el mínimo de dos exigido.

**Reto 2**: un agente de analítica visual, invocado por el orquestador del Reto 1 como herramienta
(tool-calling) cuando detecta intención de visualización, con un catálogo predefinido de 8-12
visualizaciones (series de tiempo, mapas coropléticos de ALC, grafos de entidades desde
`grafo.graphml`, comparativas global/regional/Colombia) como estrategia principal, y generación de
código Python en sandbox como respaldo para preguntas fuera del catálogo. Renderizado con
**Plotly** y **PyVis/NetworkX** para grafos, embebido en la misma app de Streamlit del Reto 1 para
cumplir el requisito de integración en un solo asistente.

Esta combinación reutiliza el 100 % del índice, metadata y grafo de la Etapa 1 sin modificarlos,
añade solo las capas de generación, agentes y visualización que el reto exige, y es viable de
construir en el tiempo restante porque cada pieza (LangGraph, Streamlit, Plotly/PyVis) tiene
curvas de adopción cortas y documentación madura.
