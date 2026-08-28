# SPEC-[ID] — [Título descriptivo de la funcionalidad o bug]

## Metadatos

| Campo | Valor |
|-------|-------|
| ID | SPEC-[ID] |
| Tipo | feature / bug / chore |
| Estado | draft / ready / in-progress / done |
| Prioridad | alta / media / baja |
| Agentes asignados | @orchestrator, @qa, @backend/@frontend |
| Fecha de creación | YYYY-MM-DD |
| Sprint | Sprint-XX |

---

## Descripción

[Explica qué problema resuelve esta spec o qué comportamiento incorrecto corrige.
Escribe como si se lo explicaras a alguien sin contexto técnico.]

---

## Contexto y antecedentes

[¿Por qué es necesario este cambio ahora? ¿Qué lo desencadenó?
Si es un bug: ¿cuándo se detectó y en qué condiciones se reproduce?]

---

## Historia de usuario

Como [tipo de usuario],
quiero [acción o funcionalidad],
para [beneficio o resultado esperado].

---

## Criterios de aceptación

- [ ] AC-01: [Criterio concreto y verificable — evita ambigüedades]
- [ ] AC-02: [Criterio concreto y verificable]
- [ ] AC-03: [Criterio concreto y verificable]

> Cada criterio de aceptación debe poder responderse con SÍ o NO.
> Si no puede, es demasiado vago — refínalo.

---

## Referencias visuales

[Si tienes capturas de pantalla, añádelas en specs/assets/ y referencialas aquí.]

Captura del comportamiento actual (bug):
![Descripción del bug](./assets/SPEC-[ID]-actual.png)

Captura del comportamiento esperado (si aplica):
![Descripción del esperado](./assets/SPEC-[ID]-esperado.png)

---

## Flujo del usuario

[Describe paso a paso cómo interactúa el usuario con la funcionalidad.
Usa numeración. Sé específico.]

1. El usuario accede a [pantalla/sección]
2. El usuario hace [acción]
3. El sistema responde con [resultado esperado]
4. ...

---

## Fuera de scope

[Lista explícita de lo que NO entra en esta spec, aunque pueda parecer relacionado.]

- NO incluye: [X]
- NO incluye: [Y]

---

## Notas técnicas para los agentes

[Información adicional relevante para la implementación.
Si conoces el módulo o fichero afectado, indícalo aquí.]

- Módulo probable: [src/...]
- Dependencias externas involucradas: [ninguna / nombre]
- Riesgo de regresión: bajo / medio / alto — [justificación breve]

---

## Casos de test sugeridos

[El @qa los formalizará, pero puedes adelantar los casos más obvios.]

- Test unitario: [descripción del caso]
- Test E2E: [descripción del flujo completo]
- Test @smoke: [el caso más crítico para verificación rápida]

---

## Historial de cambios

| Fecha | Autor | Cambio |
|-------|-------|--------|
| YYYY-MM-DD | [nombre] | Creación de la spec |
