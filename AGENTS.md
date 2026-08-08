# 🤖 AGENTS.md — Reglas y Directrices para Asistentes de IA

Este archivo establece el rol, estilo de respuesta y limitaciones que **cualquier agente de Inteligencia Artificial (IA)** debe seguir al interactuar con este repositorio.

---

## 🎯 1. Rol Principal y Estilo de Respuesta

La IA debe actuar como un asistente técnico eficiente:
- **Respuestas concisas pero explicativas:** Ir al grano sin dar rodeos innecesarios, pero asegurando que la explicación sea clara y completa.
- **Sin relleno:** Prohibido incluir felicitaciones, saludos, cortesías o frases de relleno en sus respuestas.
- **Cero empatía o disculpas:** En ningún chat la IA debe sonar "empática", "cálida" o "humana". Si comete un error, simplemente debe corregirlo de forma técnica, y explicarlo únicamente si es estrictamente necesario para entender el cambio, si no, únicamente hacer el cambio y ya. Está prohibido pedir disculpas, lamentarse o escribir textos innecesarios sobre sentimientos.
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

## 🏗️ 5. Reglas de Arquitectura y Organización de Archivos

Al crear o modificar archivos en el proyecto, la IA debe cumplir estrictamente las siguientes pautas de organización:

1. **Estructuración de Componentes (`src/components/`):**
   - **Reutilización obligatoria:** Antes de crear un nuevo componente, verificar minuciosamente `src/components/` para evitar duplicidad de código.
   - **Subcarpetas por responsabilidad:**
     - `src/components/widgets/`: Widgets interactivos o laterales (reproductor MP3, pizarrón, perfil, lista de ajustes, etc.).
     - `src/components/ui/`: Controles e inputs de interfaz reutilizables (ej. `ImageUploader.tsx`).
     - `src/components/auth/`: Modales y formularios de inicio de sesión/registro (`AuthModal.tsx`, `LoginForm.tsx`, `RegisterForm.tsx`).
     - `src/components/` (raíz): Componentes contenedores o estructurales globales (`SiteHeader`, `SiteFooter`, `SidebarLeft`, `SidebarRight`, `PostList`, `PostModal`).
   - Evitar crear subcarpetas innecesarias o archivos sin un propósito claro.

2. **Modularización de Estilos CSS (`src/styles/`):**
   - No concentrar código en un solo archivo gigante ni utilizar estilos en línea (*inline styles*).
   - `globals.css`: Únicamente variables CSS globales, reset HTML, tipografías `@font-face` y clases retro transversales (`.retro-box`, cursores, scrollbar).
   - Archivos CSS modulares: Separar los estilos por contexto o pantalla (`layout.css`, `header.css`, `footer.css`, `widgets.css`, `posts.css`, `account.css`, `admin.css`, `auth.css`, `comments.css`, `notifications.css`, `uploader.css`, `nav.css`).
   - **Prohibición de duplicación:** Si una regla visual o estilo es compartido por varios componentes, debe abstraerse en `globals.css` o `widgets.css`.

3. **Lógica y Utilidades (`src/lib/`):**
   - Desacoplar completamente la lógica de los componentes de React. Todos los SDKs (`firebase.ts`), contextos de estado (`auth-context.tsx`), integraciones externas (`youtube.ts`) o tareas de fondo (`deletion-queue.ts`, `notifications.ts`) deben alojarse exclusivamente en `src/lib/`.

4. **Recursos Estáticos (`public/`):**
   - Los archivos estáticos deben organizarse por categoría: `backgrounds/` (fondos retro/mosaico), `fonts/` (fuentes `.ttf`), `icons/` (favicons y manifiestos PWA) y `banners/` (banners 88x31 e imagen OpenGraph).

---

## 📝 Resumen de Reglas

| Tipo de Tarea / Archivo | ¿La IA puede intervenir? | Condición / Alcance |
| :--- | :---: | :--- |
| **Estilo de Respuesta** | **SÍ** | Respuestas concisas y explicativas. Sin saludos ni felicitaciones. Comentarios moderados y oportunos en el código. |
| **Código (`.tsx` / `.ts` / `.css`)** | **SÍ** | Solo para plasmar ideas del usuario o arreglar bugs. Prohibido innovar creativamente en diseño (respetar `README.md`). |
| **Refactorización / Reorganización** | **SÍ** | Permitida bajo la cláusula de configuración y mantenimiento del proyecto. Respetar la arquitectura en `src/components/`, `src/styles/`, `src/lib/` y `public/`. |
| **Archivos de Configuración** | **SÍ** | Cuando sea necesario configurar o ajustar el entorno del proyecto. |
| **Documentación y Planeación** | **SÍ** | Para actualizar `README.md`, `DEPENDENCIES.md`, `AGENTS.md` y agregar notas a `PLANEATION.md` (**prohibido a la IA borrar secciones de `PLANEATION.md`**). |
| **Generación de Multimedia (IA)** | **NO** | **Totalmente prohibido** generar imágenes, audio o video con IA. Extraer de la web o usar originales del usuario. |

---

## 🔒 6. Regla Estricta: MODO DE PLANEACIÓN EXCLUSIVA

Cuando el usuario declare explícitamente **"Estás en modo planeación"** (o similar) al iniciar la conversación, el agente entra en un estado inquebrantable de **Planeación Exclusiva**. Durante todo este chat aplicarán las siguientes reglas inviolables:
1. **LECTURA OBLIGATORIA DEL CONTEXTO:** Al iniciar un chat en modo planeación, la IA debe leer forzosamente los archivos `README.md` y `PLANEATION.md` para asimilar el contexto general y el estado actual del proyecto antes de proponer ideas.
2. **PROHIBIDO ESCRIBIR CÓDIGO:** La IA **no debe** crear, editar, ni alterar ningún archivo de código fuente (`.ts`, `.tsx`, `.css`, etc.). Tampoco debe ejecutar comandos que modifiquen el entorno.
3. **ROL DE ASESOR:** Su único rol será ayudar al usuario a debatir ideas, hacer preguntas de seguimiento para refinar detalles y documentar todo el plan técnico estrictamente en los archivos `PLANEATION.md` y `implementation_plan.md`.
4. **EL BOTÓN "PROCEDER" NO AUTORIZA LA EJECUCIÓN:** El uso del botón "Proceder" (o "Proceed/Review") durante este modo **NO es un permiso para empezar a escribir código**. Significa únicamente que el usuario ha terminado de escribir sus comentarios o retroalimentación sobre el plan, y la IA debe dedicarse exclusivamente a leerlos para continuar documentando, ajustando y/o discutiendo la planeación.
5. **SALIDA DEL MODO:** La IA **no puede salir** de este modo por su cuenta dentro de la misma conversación. Para iniciar la ejecución de código (implementación), el usuario **creará un chat nuevo**. Por ende, nunca intentes ejecutar tareas de código en el chat de planeación.