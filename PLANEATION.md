# 📌 PLANEATION.md — Planeación de Funcionalidades

Este archivo contiene el registro de características, funciones y mejoras planificadas para **Ariri Blog**, organizadas por prioridad (futuro cercano y futuro lejano).

---

## 📻 1. Futuro Cercano (Ya en planeación, pendiente de implementación)

### ✏️ 1. Edición de Posts Publicados
- **Concepto:** Añadir la capacidad de editar entradas que ya han sido publicadas en Firestore.
- **Análisis de Factibilidad:** **100% Factible.** Se reutilizará el formulario de `/settings/admin/new-post` soportando el parámetro `?edit=<postId>`. Al guardar, actualizará el documento existente en la colección `posts` de Firestore usando `setDoc` / `updateDoc`.
- **Detalles técnicos:**
  - Cargar los campos existentes (título, contenido, mood, canción, portadas, playlist, fecha).
  - Preservar la fecha original de publicación o permitir actualizarla.
  - **Ubicación de controles:** Los botones de "Editar post" aparecerán **exclusivamente dentro del Panel de Administración (`/settings/admin`)** en la lista de publicaciones.

### ↩️ 2. Función "Regresar a Borradores"
- **Concepto:** Permitir convertir una entrada previamente publicada de vuelta en borrador sin tener que eliminarla y volverla a redactar desde cero.
- **Análisis de Factibilidad:** **100% Factible.** Operación en Firestore que traslada los datos del documento de `posts/{id}` a `drafts/{newId}` y elimina la entrada original en `posts/{id}`.
- **Detalles técnicos:**
  - Opción disponible tanto en el panel admin como en el formulario de edición de post.
  - Al ejecutar "Regresar a borrador", redirigir al usuario al formulario de edición de ese borrador (`/settings/admin/new-post?draft=<id>`).

### 🎵 3. Vinculación y Maquetación de "Canción del Día" con su Imagen de Portada
- **Concepto:** Integración visual y funcional entre la entrada de texto "Canción del Día" y la carga de su portada correspondiente.
- **Análisis de Factibilidad:** **100% Factible.** Cambios a nivel de maquetación CSS (layout horizontal de 2 columnas / flex side-by-side) y lógica en React (`song.trim().length > 0`).
- **Detalles técnicos:**
  - Ubicación horizontal: colocar el input de "Canción del Día" y el selector de imagen lado a lado.
  - Condición de visibilidad/activación: si no se ha escrito nada en "Canción del Día", el control de portada estará oculto o deshabilitado.
  - Al renderizar el post, solo mostrar la portada de la canción si existe texto en "Canción del Día".

### 📝 4. Editor de Markdown Enriquecido (Barra de Accesos Rápidos y Previsualización por Pestañas)
- **Concepto:** Mejorar el campo de "Contenido en Markdown" pasando de un `textarea` simple a un editor con barra de accesos rápidos y pestañas para alternar entre la edición y la previsualización en vivo.
- **Análisis de Factibilidad:** **100% Factible y optimizado para móvil.** Se implementará con React y sintaxis nativa de manipulación de texto en `textarea` (`selectionStart`, `selectionEnd`).
- **Detalles técnicos:**
  - **Selector de Pestañas (Tab Switcher):** Botones superiores "✍️ Escribir" y "👁️ Previsualizar" para alternar vistas (diseño cómodo e ideal para pantallas móviles).
  - **Barra de Accesos Rápidos:** Botones interactivos para insertar sintaxis Markdown común (`#` Encabezados, `**` Negrita, `*` Cursiva, `-` Lista de viñetas, `[enlace](url)`, `![imagen](url)`, `> Cita`, ```` Carga de código ````).

### 🔗 5. Gestión de Slugs Duplicados en Firestore
- **Concepto:** Validación de slugs duplicados en `/settings/admin` al crear o editar entradas de blog para evitar sobreescribir publicaciones existentes involuntariamente.
- **Análisis de Factibilidad:** **100% Factible.** Al guardar un post o borrador, consultar la colección `posts` en Firestore (excluyendo el docId actual si se está en modo edición) para verificar si ya existe una entrada activa con el mismo `slug`. Si existe conflicto, notificar en el formulario para modificar el slug o auto-sugerir un sufijo.

### 🔄 Fases de Desarrollo (Actualización General)
- 📋 **Fase de Planeación:** Completada. Todas las características han sido definidas, maquetadas conceptualmente y su factibilidad técnica evaluada.
- 🛠️ **Fase de Implementación:** Completada. Todas las 5 características del Futuro Cercano han sido implementadas e integradas.
- 🧪 **Fase de Corrección de Bugs + Perfeccionamiento:** En proceso / Verificación.

---

## 📻 2. Futuro Lejano (Opcionales)

### 📖📱 Rediseño de la Experiencia de Lectura, Navegación Móvil (<768px) & Enrutamiento por Rutas
- **Concepto:** Propuesta integral para transformar la lectura y navegación del blog, pasando de modales emergentes y sidebars apiladas en móvil a páginas independientes por URL con una barra de navegación inferior fija.
- **Análisis de Factibilidad:** **Alta.** Arquitectura basada en rutas dinámicas del App Router de Next.js.
- **Detalles del diseño:**
  - **Navegación e Independencia por Rutas:**
    - 📖 **`/posts/[slug]`:** En lugar de abrir un pop-up modal, cada artículo se leerá en su propia URL dedicada utilizando el slug manual del post.
    - 🏠 **`/` (Inicio):** Feed/cuerpo principal del blog.
    - 👤 **`/about-me` (Sidebar Izquierda):** Página móvil dedicada con el encabezado, perfil, redes sociales, badges de roles, pie de página y la barra de navegación inferior.
    - 🎵 **`/widgets` (Sidebar Derecha):** Página móvil dedicada con el encabezado, reproductor MP3 Winamp, SketchBoard Canvas, pie de página y la barra de navegación inferior.
    - ⚙️ **`/settings`:** Sección de ajustes (con aislamiento de la barra inferior para evitar conflictos con la navegación interna de configuración).
  - **Comportamiento en Lectura de Posts:**
    - Encabezado desplazable de forma natural junto con el cuerpo del texto para maximizar la visibilidad.
    - Barra de navegación entre publicaciones (Anterior / Siguiente) rediseñada a un formato compacto y discreto.
    - Exploración de 2 modos de lectura: modo vertical tradicional adaptado a la pantalla y modo documento (estilo PDF / Google Docs para móvil).
  - **Comportamiento Móvil:**
    - La barra de navegación inferior se mantendrá fija en pantalla (*fixed bottom bar*), mientras que el contenido (encabezado, cuerpo y footer) scrolleará normalmente.

### 🎨 Resaltado de Sintaxis en Bloques de Código
- **Concepto:** Coloreado de código para artículos técnicos o tutoriales.
- **Dependencias a evaluar:** `rehype-highlight` + `highlight.js`.
- **Condición:** Se implementará si se comienzan a redactar posts con contenido técnico/código frecuentemente.
