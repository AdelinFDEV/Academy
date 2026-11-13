# GUÍAS PENDIENTES — lo que queremos lanzar

Aquí se apuntan las **guías que queremos hacer en el futuro**: el tema, la búsqueda que queremos ganar y qué le resuelve al lector. Cómo se monta una guía no está aquí: la fuente de verdad es el panel `/admin/guias-instrucciones`, y la auditoría SEO, [`AUDITORIA-SEO.md`](./AUDITORIA-SEO.md).

**Cómo se usa:**

- Una idea entra aquí cuando el admin la quiere tener en cuenta, aunque no tenga fecha.
- Cuando se empieza a montar, **se mueve a `TAREAS.md`** y **se borra de aquí** en el mismo commit. Lo publicado no se queda en esta lista.
- Todas las guías son **gratuitas** (desde el 31-10-2026). Una guía nueva lleva su `[slug].css`, su alta en `GUIDES` con su fecha de `publicada` y la auditoría SEO, y no se publica sin el «sí» del admin.

Para ver las que ya existen:

```bash
grep -h '  slug: "' src/lib/guides.ts
```

---

## Formato de cada idea

```
### Título de trabajo

| | |
|---|---|
| **Búsqueda objetivo** | la consulta que queremos ganar en Google |
| **Para quién** | |
| **Qué le resuelve** | |
| **Enlaza con** | cursos, guías y fichas del diccionario relacionados |

Notas: rivales que ya la cubren, el hueco que dejan, datos que hay que comprobar.
```

---

## Las ideas

Salen de repasar los cursos (13-11-2026): temas que encajan mejor como guía que como curso. Sin búsqueda objetivo todavía; se fija con la Fase 0 de la auditoría SEO al empezar.

### Qué pasa con tus criptomonedas si te pasa algo

| | |
|---|---|
| **Búsqueda objetivo** | por decidir (algo como «herencia criptomonedas») |
| **Para quién** | Quien guarda sus criptomonedas en una cartera propia |
| **Qué le resuelve** | Cómo dejar un plan para que su familia pueda recuperarlas sin entregarle hoy sus claves |
| **Enlaza con** | curso *Seguridad cripto* (lección 3.3, «Passphrase y herencia»), fichas `seed-phrase` y `clave-privada` |

Notas: el curso lo toca en una lección; aquí se desarrolla entero. Ojo con la parte legal de la herencia, que depende del país: se explica el plan práctico y se remite a un profesional para lo jurídico.

### MiCA: qué protege al inversor y qué no

| | |
|---|---|
| **Búsqueda objetivo** | por decidir (algo como «qué es MiCA») |
| **Para quién** | Quien compra en un exchange y quiere saber si está protegido |
| **Qué le resuelve** | Qué cambia con el reglamento europeo, cómo comprobar si un exchange está autorizado y qué riesgos siguen siendo suyos |
| **Enlaza con** | la idea de curso «Tu primera compra de cripto» (`CURSOS-PENDIENTES.md`), curso *Seguridad cripto* |

Notas: tema muy regulatorio y que cambia; cada dato, con la fuente oficial (EUR-Lex, ESMA, CNMV) y su fecha.
