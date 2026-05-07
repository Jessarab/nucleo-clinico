---
name: llm-council
description: Deliberación multi-agente de 3 etapas inspirada en llm-council de Karpathy. Úsalo cuando el usuario quiera una respuesta de alta calidad a una pregunta compleja, necesite análisis profundo, revisión de código, evaluación de decisiones arquitectónicas, o cuando sea valioso obtener perspectivas múltiples e independientes antes de dar una respuesta definitiva.
---

# LLM Council — Deliberación Multi-Agente

Implementa el flujo de 3 etapas de llm-council (https://github.com/karpathy/llm-council) usando subagentes nativos de Claude Code.

## Workflow

Crea un TodoList con las 3 etapas y trabájalas secuencialmente.

### Etapa 1 — Opiniones independientes (paralelo)

Lanza **3 agentes `general-purpose` EN PARALELO** (en un solo mensaje) con instrucciones distintas. Cada agente responde la pregunta del usuario de forma completamente independiente, sin ver las respuestas de los otros.

Asigna a cada agente un rol diferente:

- **Agente A — Analítico:** Responde con enfoque en hechos, datos, razonamiento estructurado paso a paso y solidez técnica.
- **Agente B — Creativo:** Responde explorando perspectivas no convencionales, alternativas, enfoques innovadores y ángulos que se suelen pasar por alto.
- **Agente C — Crítico:** Responde identificando riesgos, limitaciones, casos borde, supuestos cuestionables y posibles problemas de la solución más obvia.

Adapta los roles al dominio de la pregunta. Ejemplos:
- Para código: "corrección/robustez", "rendimiento/elegancia", "seguridad/mantenibilidad"
- Para decisiones de negocio: "datos/métricas", "experiencia de usuario", "riesgos/operaciones"
- Para arquitectura: "escalabilidad", "simplicidad/deuda técnica", "seguridad/costos"

Guarda las 3 respuestas completas. Muestra al usuario un breve aviso de que las 3 perspectivas están listas.

### Etapa 2 — Revisión cruzada (paralelo)

Lanza **3 agentes `general-purpose` EN PARALELO** para que cada uno evalúe las respuestas de los otros dos (nunca la suya propia).

Cada agente recibe:
- La pregunta original
- Las respuestas de los otros dos agentes etiquetadas como "Respuesta X" y "Respuesta Y" (sin revelar qué agente las generó ni sus roles)
- Instrucción: identifica los puntos más valiosos de cada respuesta, señala debilidades o errores, y determina cuál es más útil en general y por qué.

Guarda los 3 análisis de revisión completos.

### Etapa 3 — Síntesis final (Chairman)

Sintetiza tú mismo (sin lanzar agente adicional) una respuesta final que:
- Incorpora los mejores puntos de las 3 respuestas originales
- Toma en cuenta las evaluaciones cruzadas de la Etapa 2
- Resuelve contradicciones entre perspectivas con criterio claro
- Es más completa y matizada que cualquier respuesta individual

## Presentación al usuario

Estructura la respuesta final así:

```
## Respuesta (LLM Council)

[Síntesis completa de alta calidad]

---
<details>
<summary>Proceso de deliberación</summary>

**Perspectiva Analítica:** [resumen breve, 2-3 líneas]
**Perspectiva Creativa:** [resumen breve, 2-3 líneas]
**Perspectiva Crítica:** [resumen breve, 2-3 líneas]

*Revisión cruzada destacó: [insight clave que emergió de las revisiones]*
</details>
```

## Notas

- Si la pregunta es simple o factual, responde directamente sin activar el proceso completo
- El proceso completo es más valioso para: decisiones arquitectónicas, debugging complejo, análisis de trade-offs, revisiones de código importantes
- Los 3 agentes de Etapa 1 DEBEN lanzarse en paralelo (mismo mensaje), igual los 3 de Etapa 2
