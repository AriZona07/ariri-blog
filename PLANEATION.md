# 📌 PLANEATION.md — Planeación de Funcionalidades

Este archivo contiene el registro de características, funciones y mejoras planificadas para **Ariri Blog**, organizadas por prioridad (futuro cercano y futuro lejano).

---

## 📻 1. Futuro Cercano (En desarrollo)

### 📖📱 Rediseño de la Experiencia de Lectura, Navegación Móvil (<768px) & Enrutamiento por Rutas
- **Concepto:** Propuesta integral para transformar la lectura y navegación del blog, pasando de modales emergentes y sidebars apiladas en móvil a páginas independientes por URL dinámicas, eliminación definitiva de `PostModal`, modos de lectura y un sistema dual de barras de navegación inferior fija.
- **Análisis de Factibilidad:** **Alta.** Arquitectura basada en rutas dinámicas del App Router de Next.js.
- **Detalles del diseño y arquitectura:**
  - **Navegación e Independencia por Rutas:**
    - 📖 **`/posts/[slug]`:** Transición 100% a permalinks por URL. Cada artículo se leerá en su propia página dedicada utilizando el slug manual del post (o id como fallback), eliminando el modal flotante (`PostModal`).
    - 🏠 **`/` (Inicio):** Feed/cuerpo principal de publicaciones. En móvil (`<768px`), las sidebars laterales no se apilarán al final del feed.
    - 👤 **`/about-me` (Sobre mí):** Ruta dedicada con vista limpia de los widgets de perfil (`ProfileWidget`, `RoleBadgesWidget`, `SocialLinksWidget`).
    - 🧩 **`/widgets` (Widgets):** Ruta dedicada con vista limpia de los widgets interactivos (`MusicPlayerWidget`, `SketchBoardWidget`, `GuestbookWidget`).
    - ⚙️ **`/settings/*` (Ajustes):** Sección de ajustes accedida desde el menú desplegable del header.
  - **Sistema Dual de Barras Flotantes Inferiores en Móvil (`<768px`):**
    - 🌐 **Barra General (`MobileGeneralNav`):** Presente en `/`, `/about-me`, `/widgets` y `/posts/[slug]`.
      - **Orden de pestañas:** `[1. 👤 Sobre mí (/about-me), 2. 🏠 Inicio (/), 3. 🧩 Widgets (/widgets)]` *(Icono de rompecabezas 🧩)*.
    - ⚙️ **Barra de Ajustes (`MobileSettingsNav`):** Se activa exclusivamente dentro de `/settings/*` reemplazando la barra general.
      - **Pestañas:** `[1. 👤 Cuenta, 2. 🔔 Avisos, 3. 👩‍💻 Admin, 4. 🏠 Inicio]` *(Icono de desarrolladora 👩‍💻 para Admin)*.
  - **Ajustes en el Menú Desplegable de Usuario (`SiteHeader`):**
    - Cambiar la opción de menú `👤 Mi Cuenta` a **`⚙️ Ajustes`**.
    - Cambiar el icono de `⚙️ Panel de Admin` a **`👩‍💻 Panel de Admin`**.
  - **Comportamiento en Lectura de Posts (`/posts/[slug]`):**
    - Encabezado scrolleable de forma natural junto con el cuerpo del texto para maximizar el área de lectura en móvil.
    - Barra compacta e integrada de navegación entre publicaciones (Anterior / Siguiente).
    - Selector entre 2 modos de lectura: **Modo Tradicional** (integración visual estándar del blog) y **Modo Documento (PDF / Docs)** (hoja tipo papel retro, márgenes delimitados, sombra limpia y tipografía/interlineado optimizados).
    - Integración de comentarios (`CommentsWidget`) al pie del artículo.

---

## 📻 2. Futuro Lejano (Opcionales)

