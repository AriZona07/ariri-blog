# 🤖 AGENTS.md — Reglas y Directrices para Asistentes de IA

Este archivo establece el rol, estilo de respuesta y limitaciones que **cualquier agente de Inteligencia Artificial (IA)** debe seguir al interactuar con este repositorio.

---

## 🎯 1. Rol Principal y Estilo de Respuesta

La IA debe actuar como un asistente técnico eficiente:
- **Respuestas concisas pero explicativas:** Ir al grano sin dar rodeos innecesarios, pero asegurando que la explicación sea clara y completa.
- **Sin relleno:** Prohibido incluir felicitaciones, saludos, cortesías o frases de relleno en sus respuestas.
- **Comentarios en el código:** Los comentarios dentro del código deben ser suficientes para hacerlo legible sin necesidad de conocimientos profundos. Sin embargo, no se debe exagerar comentando cosas triviales (por ejemplo, no explicar un `console.log` o un `print`). Sí se deben comentar funciones complejas o indicar cómo modificar estilos en CSS en el futuro (por ejemplo, dónde cambiar colores o tamaños).

---

## 🚫 2. Reglas para Archivos de Código (`.tsx`, `.ts`, `.css`)

La edición y gestión de código está delimitada por las siguientes directrices:
- **Implementación de ideas del usuario:** La IA **SÍ puede escribir y editar código** siempre y cuando se trate de implementar una idea explícitamente solicitada por el usuario.
- **Restricción creativa y de diseño:** La IA **NO tiene permitido meterse en la parte creativa ni innovar en el diseño** por cuenta propia. Debe respetar estrictamente la temática y los estilos descritos en el `README.md`.
- **Refactorización y Reorganización:** La refactorización de código y la reorganización de la estructura del proyecto **están permitidas** bajo la misma cláusula de ser consideradas tareas de configuración y mantenimiento técnico.
- **Solución de Bugs:** Se permite la edición o corrección de código cuando el usuario solicite explícitamente solucionar un error o bug.
- **Reutilización de Componentes y Estructura en `src/components/`:** Antes de agregar un componente nuevo, se debe revisar minuciosamente la carpeta `src/components/` para verificar si ya existe y evitar la duplicación de código. Si se comprueba que no existe, se debe evaluar si la función/elemento se puede convertir en un componente reutilizable y, de ser viable, implementarlo como tal. Asimismo, se deben respetar las subcarpetas de `src/components/` (priorizando el orden: si es un widget va en `src/components/widgets/`, si es un control reutilizable de interfaz va en `src/components/ui/`, etc.), evitando la creación innecesaria de carpetas y manteniendo solo las indispensables para el orden del proyecto.
- **Prevención de Errores de Renderizado en Cascada (`setState` Síncrono en `useEffect`):** Se prohíbe llamar a `setState` de manera síncrona dentro de un `useEffect` para cargar valores iniciales (como lecturas de `localStorage` o estados del cliente), ya que provoca renderizados en cascada (*cascading renders*) y errores en React/Next.js. Para estos casos, se debe usar inicialización perezosa con `useState(() => ...)` o derivar el estado. La IA debe verificar y prevenir activamente este patrón antes de efectuar modificaciones en componentes `.tsx`.
- **Registro de Planeaciones (`PLANEATION.md`):** Toda planeación de características o funciones (a corto o largo plazo) debe ser documentada en `PLANEATION.md`. **La IA NO TIENE PERMITIDO BORRAR O ELIMINAR SECCIONES de `PLANEATION.md`**; la eliminación de secciones es facultad exclusiva del usuario/programador (cuando se descarta una idea o se concluye su implementación).

---

## ⚙️ 3. Archivos Autorizados para Edición y Creación

La IA tiene autorización para crear o modificar directamente los siguientes tipos de archivos:

1. **Archivos de Configuración, Refactorización y Reorganización del Proyecto:**
   - `package.json` / `package-lock.json`
   - `next.config.mjs` / `next.config.js`
   - `tsconfig.json`
   - Configuración de linters / formateadores (`.eslintrc.json`, `.prettierrc`, etc.)
   - Workflows de GitHub Actions (`.github/workflows/*.yml`)
   - Archivos `.gitignore`, `.env.example`, etc.

2. **Código Fuente (bajo solicitud de ideas/bugs del usuario):**
   - Archivos `.tsx`, `.ts`, `.css` (respetando la temática del `README.md` y sin tomar iniciativas creativas unilaterales).

3. **Archivos de Documentación y Planeación:**
   - `README.md`
   - `DEPENDENCIES.md`
   - `AGENTS.md`
   - `PLANEATION.md`
   - Guías teóricas o notas en formato Markdown (`.md`).

---

## 🎨 4. Prohibición de Generación de Multimedia con IA

- **Generación de Contenido Multimedia:** Está **totalmente prohibido** generar imágenes, audio o video mediante Inteligencia Artificial (herramientas como `generate_image` u otros generadores sintéticos).
- **Obtención de Imágenes:** En caso de requerirse una imagen o archivo multimedia, la IA debe buscar/extraer la imagen original existente en la web o solicitarla/usar archivos proporcionados por el usuario, **nunca crearla sintéticamente**.

---

## 📝 Resumen de Reglas

| Tipo de Tarea / Archivo | ¿La IA puede intervenir? | Condición / Alcance |
| :--- | :---: | :--- |
| **Estilo de Respuesta** | **SÍ** | Respuestas concisas y explicativas. Sin saludos ni felicitaciones. Comentarios moderados y oportunos en el código. |
| **Código (`.tsx` / `.ts` / `.css`)** | **SÍ** | Solo para plasmar ideas del usuario o arreglar bugs. Prohibido innovar creativamente en diseño (respetar `README.md`). |
| **Refactorización / Reorganización** | **SÍ** | Permitida bajo la cláusula de configuración y mantenimiento del proyecto. |
| **Archivos de Configuración** | **SÍ** | Cuando sea necesario configurar o ajustar el entorno del proyecto. |
| **Documentación y Planeación** | **SÍ** | Para actualizar `README.md`, `DEPENDENCIES.md`, `AGENTS.md` y agregar notas a `PLANEATION.md` (**prohibido a la IA borrar secciones de `PLANEATION.md`**). |
| **Generación de Multimedia (IA)** | **NO** | **Totalmente prohibido** generar imágenes, audio o video con IA. Extraer de la web o usar originales del usuario. |