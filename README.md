# 🌐 Ariri Blog — Retro 2000s Web

Un blog personal con estética de los años 2000 (Emo / Scene / Blogger / MySpace), construido con **Next.js 16 (App Router)**, **TypeScript** y **CSS Puro modular** para máxima velocidad, libertad visual y optimización SEO.

Este documento sirve como **guía técnica y de diseño** tanto para desarrolladores humanos como para **agentes de IA** que colaboren en el proyecto.

---

## 🎯 1. Visión General del Proyecto

- **Dominio Personalizado:** [`ariri.app`](https://ariri.app) (Dominio configurado con CNAME)
- **Alojamiento & Despliegue:** GitHub Pages + GitHub Actions (CI/CD estático con `npm run build`)
- **Enfoque SEO:** Metadatos OpenGraph/Twitter Card, sitemap dinámico (`src/app/sitemap.ts`), `public/robots.txt` y `public/site.webmanifest`.
- **Stack Tecnológico Principal:**
  - **Framework:** Next.js 16 (App Router, Exportación Estática SSG)
  - **Lenguaje:** TypeScript 5
  - **Estilos:** CSS Puro Modular (`src/styles/`), sin Tailwind ni frameworks CSS externos.
  - **Contenido:** Gestión dinámica desde Firestore mediante el panel de administración (/settings/admin).
- **Licencia & Código Abierto:** Software libre bajo la [Licencia MIT](/LICENSE.md).

---

## 📐 2. Especificación de Diseño y Maquetación (Layout Flotante & Estética 2000s)

El sitio evoca la nostalgia web de los años 2000 con un contenedor central flotante sobre un fondo de pantalla estilizado.

### 🖼️ Esquema Estructural

```text
+-----------------------------------------------------------------------+
|  Fondo General (Fondo repetido emo_scene_purple_bg_512px.png)         |
|                                                                       |
|   +---------------------------------------------------------------+   |
|   |  CONTENEDOR FLOTANTE (.page-wrapper con margen 2rem / 5%-10%) |   |
|   | +-----------------------------------------------------------+ |   |
|   | | 1. ENCABEZADO (SiteHeader 100% ancho)                     | |   |
|   | +-----------------------------------------------------------+ |   |
|   | | 3. BARRA IZQ  | 2. CUERPO PRINCIPAL       | 4. BARRA DER  | |   |
|   | |  (SidebarLeft)|    (PostList / Modal)     | (SidebarRight)| |   |
|   | |               |                           |               | |   |
|   | | - Profile     | - Tarjetas con clamp      | - MusicPlayer | |   |
|   | | - SocialLinks | - Modal de lectura        | - SketchBoard | |   |
|   | | - RoleBadges  | - Paginación interactiva  |               | |   |
|   | +---------------+---------------------------+---------------+ |   |
|   | | 5. PIE DE PÁGINA (SiteFooter con Banners 88x31)           | |   |
|   | +-----------------------------------------------------------+ |   |
|   +---------------------------------------------------------------+   |
|                                                                       |
+-----------------------------------------------------------------------+
```

### 📜 Reglas de Comportamiento Visual & Layout Responsive
1. **Efecto Flotante:** Contenedor central elevado (`.page-wrapper`) con bordes dobles retro, sombras sólidas y margen que permite ver el fondo general detrás (`emo_scene_purple_bg_512px.png`).
2. **Scroll Global:** El scroll corre por toda la ventana del navegador (sin scrolls internos forzados en la estructura principal).
3. **Distribución en 3 Columnas (Desktop):**
   - **Header (`SiteHeader`):** Título principal y estética de cabecera retro.
   - **Sidebar Izquierda (`SidebarLeft`):**
     - **`ProfileWidget`:** Foto de perfil flotante integrada con texto en envolvente (estilo periódico/revista), biografía "Sobre mí".
     - **`SocialLinksWidget`:** Enlaces a redes sociales y plataformas.
     - **`RoleBadgesWidget`:** Badges / Etiquetas de intereses personalizadas.
   - **Cuerpo Central (`PostList` & `PostModal`):**
     - Muestra las publicaciones en tarjetas con vista previa clampada y fade gradual al pie.
     - Paginación dinámica superior e inferior (`PaginationNavWidget`).
     - Botón "Leer más" o clic en título abre el modal interactivo de lectura completa (`PostModal`) con navegación entre artículos (Anterior / Siguiente).
   - **Sidebar Derecha (`SidebarRight`):**
     - **`MusicPlayerWidget` & `MusicPlayer`:** Reproductor de audio retro sin video visible usando la **YouTube IFrame API**. Soporta playlists, portada de canción (`noembed`), aleatorio (Fisher-Yates), modos de bucle (desactivado, playlist, pista individual) y pausa automática entre reproductores.
     - **`SketchBoardWidget`:** Pizarrón interactivo en HTML5 Canvas con paleta Emo/Scene, borrador, 3 grosores de pincel (2px, 6px, 12px), botón de limpieza y soporte mouse/táctil con preservación de dibujo en redimensionamiento.
4. **Adaptabilidad Móvil (<768px):** En dispositivos móviles, las 3 columnas se reorganizan verticalmente en una sola columna (*Header ➔ Cuerpo Principal ➔ Sidebar Izquierda ➔ Sidebar Derecha*).

---

## 🎨 3. Estilos Visuales, Temática & Sistema de Diseño

- **Estética Base:** Cultura **Emo / Scene / Myspace / Blogger de los 2000s**.
- **Paleta de Colores:**
  - Fondos Oscuros: Negro Absoluto (`#000000`) ![#000000](https://placehold.co/15x15/000000/000000.png), Carbón Retro (`#16131d`) ![#16131d](https://placehold.co/15x15/16131d/16131d.png).
  - Acentos Vibrantes: **Hot Pink (`#ff1493`)** ![#ff1493](https://placehold.co/15x15/ff1493/ff1493.png), **Magenta (`#b80058`)** ![#b80058](https://placehold.co/15x15/b80058/b80058.png), **Verde Neón (`#00ff66`)** ![#00ff66](https://placehold.co/15x15/00ff66/00ff66.png), **Cian (`#00f0ff`)** ![#00f0ff](https://placehold.co/15x15/00f0ff/00f0ff.png), **Amarillo (`#ffff00`)** ![#ffff00](https://placehold.co/15x15/ffff00/ffff00.png).
- **Detalles UI & Microinteracciones:**
  - **Cursor Personalizado:** Calavera Emo rosa integrada en CSS global (`globals.css`) obtenida de [cursors-4u.com](https://www.cursors-4u.com).
  - **Scrollbar Personalizada:** Barra de desplazamiento delgada en verde neón con fondo oscuro.
  - **Cajas Retro (`.retro-box`):** Contenedores con encabezado rosa/magenta, bordes marcados de 2px a 3px y fondo oscuro.
- **Tipografías:**
  - Principal: [`public/fonts/simple-japan.ttf`](/public/fonts/simple-japan.ttf) (usada en body, menús, títulos y componentes).
  - Especial: [`public/fonts/special-punk.ttf`](/public/fonts/special-punk.ttf) (fuente estilo recortes de revista punk).

---

## 📂 4. Arquitectura de Código y Estructura de Carpetas

### 🌲 Árbol de Carpetas del Proyecto

```text
public/                       <-- Archivos estáticos servidos directamente
├── backgrounds/              (Texturas y fondos mosaico retro en PNG: 256px, 512px, 1024px)
├── banners/                  (Banners retro 88x31 e imagen OpenGraph og-image.png)
├── fonts/                    (Fuentes tipográficas locales .ttf: simple-japan, special-punk)
└── icons/                    (Favicons, apple-touch-icon, iconos PWA e iconos enmascarables)

src/                          <-- Código fuente del proyecto
├── app/                      <-- Rutas del App Router de Next.js
│   ├── settings/             (Sub-rutas de configuración: /account, /admin, /notifications, /terms)
│   ├── layout.tsx            (Layout raíz con HTML, metadatos, fuentes y AuthProvider)
│   └── page.tsx              (Página principal conectada dinámicamente a Cloud Firestore)
│
├── components/               <-- Componentes React modularizados
│   ├── auth/                 (Formularios y modales de sesión: AuthModal, LoginForm, RegisterForm)
│   ├── ui/                   (Controles de interfaz reutilizables: ImageUploader)
│   └── widgets/              (Widgets independientes: Profile, MusicPlayer, SketchBoard, etc.)
│
├── lib/                      <-- Utilidades, SDKs y lógica de estado
│   ├── firebase.ts           (Conexión e inicialización del SDK de Firebase)
│   └── youtube.ts            (Integración con YouTube IFrame API para el reproductor)
│
└── styles/                   <-- Estilos CSS Puro organizados modularmente
    ├── globals.css           (Variables de color/tokens, reset HTML y clases retro compartidas)
    └── layout.css            (Contenedor principal flotante y grid de 3 columnas)
```

### 📐 Principios de Organización y Arquitectura

1. **Reutilización y Desacoplamiento de Componentes (`src/components/`):**
   - **Reutilización estricta:** Antes de crear un componente nuevo, se debe verificar si ya existe uno similar en `src/components/` para evitar duplicación.
   - **Organización por carpetas:**
     - `widgets/`: Widgets interactivos y laterales con lógica autónoma.
     - `ui/`: Componentes reutilizables de UI (ej. controles de carga de imágenes).
     - `auth/`: Modales y formularios dedicados al flujo de usuarios y sesión.
     - Raíz (`src/components/`): Componentes contenedores o estructurales de la maquetación base.

2. **Modularización de Estilos (`src/styles/`):**
   - Se prohíbe el uso de CSS inline o un único archivo masivo de estilos.
   - `globals.css` alberga únicamente los tokens del sistema de diseño (variables HSL/hex), resets globales, tipografías `@font-face` y utilidades retro transversales (`.retro-box`, cursores personalizables, scrollbars).
   - Cada área funcional o pantalla posee su propio archivo CSS dedicado (`account.css`, `admin.css`, `comments.css`, etc.). Si un estilo o botón es compartido entre múltiples pantallas, se abstrae en `globals.css` o `widgets.css`.

3. **Separación de Lógica y SDKs (`src/lib/`):**
   - La lógica de negocio, integración con APIs externas (Firebase, YouTube API) y contextos de React residen exclusivamente en `src/lib/`, manteniendo los componentes puramente enfocados en el renderizado y la UX.

4. **Clasificación Estricta de Recursos Estáticos (`public/`):**
   - Todos los recursos estáticos se distribuyen en carpetas dedicadas según su categoría (`backgrounds/`, `fonts/`, `icons/`, `banners/`) para asegurar orden en el mantenimiento y carga optimizada.

---

## 🤖 5. Guía para Programadores y Agentes de IA

Cualquier edición de código en este repositorio **debe cumplir estrictamente** las reglas definidas en [`AGENTS.md`](/AGENTS.md):

1. **Estilos:** Usar exclusivamente CSS Puro. Todas las clases y tokens globales deben organizarse dentro de `src/styles/` reutilizando las variables definidas en `globals.css` (`var(--color-accent-pink)`, `var(--color-bg-dark)`, etc.). **No agregar Tailwind CSS ni inline styles innecesarios**.
2. **Encapsulamiento y Reutilización de Widgets:** Los widgets interactivos deben mantenerse desacoplados en `src/components/widgets/`, con interfaces TypeScript claras para sus props. Dentro de lo posible, **todos los widgets deben ser fácilmente reutilizables en otras áreas** (por ejemplo, el widget MP3 con diferentes playlists).
3. **Respeto a la Temática:** Mantener el lenguaje visual Emo/Scene 2000s. No modificar unilateralmente la estética general.
4. **Comentarios Oportunos:** Explicar funciones complejas o indicar dónde ajustar variables de estilo sin sobrecargar con explicaciones de código trivial.
5. **Registro de Planeación (`PLANEATION.md`):** Toda planeación solicitada debe registrarse en [`PLANEATION.md`](/PLANEATION.md). **Únicamente el usuario/programador tiene permitido borrar o remover secciones de `PLANEATION.md`**; la IA no debe eliminar secciones existentes.
6. **Opción Exclusiva para Carga de Imágenes:** Siempre que exista una función para 'subir imagen', se debe proporcionar tanto la opción de ingresar un enlace URL externo como la de subir el archivo desde el dispositivo local. No se debe permitir subir una imagen seleccionando ambas formas a la vez; se debe elegir estrictamente solo 1 forma de subir la imagen.

---

## 📦 6. Dependencias

Para la descripción detallada de cada paquete, consulta la [Guía de Dependencias](/DEPENDENCIES.md).

- **Instaladas y Activas:**
  - `next` (16.x), `react` (19.x), `typescript` (5.x), `firebase` (11.x).
- **Propuestas / Evaluables para el Futuro:**
  - `next-mdx-remote`: Si se requiere renderizar componentes de React directamente dentro de los posts.
  - `rehype-highlight` + `highlight.js`: Para coloreado de bloques de código en los artículos.
  - `rss`: Para generación de feed XML RSS 2.0.

---

## 🛠️ 7. Guía Técnica y Comandos

### 🚀 Entorno de Desarrollo
Para iniciar el servidor de desarrollo local:

```bash
npm run dev
```
Abre [http://localhost:3000](http://localhost:3000) en tu navegador.

### 🏗️ Compilación Estática (Build)
Para verificar la compilación estática antes de subir cambios:

```bash
npm run build
```

---

## 🗺️ 8. Estado del Proyecto & Gestión de Planeación

Toda la planificación de características, arquitectura y seguimiento del roadmap se gestiona de forma centralizada en [`PLANEATION.md`](/PLANEATION.md).

### 📌 Estructura de `PLANEATION.md`

El documento está organizado en dos secciones principales:

1. **📻 Futuro Cercano (Prioritario & En Desarrollo):** Contiene las características en desarrollo activo o planificadas a corto plazo.
2. **📻 Futuro Lejano (Opcionales & Evaluables):** Ideas opcionales (algunas vagamente detalladas y otras bien detalladas) que podrían o no realizarse en el futuro.

### 🔄 Fases de Implementación (Futuro Cercano)

Toda nueva función dentro de la sección de **Futuro Cercano** atraviesa las siguientes fases de desarrollo:

- **📋 1. Fase de Planeación:** Se planifica detalladamente cada aspecto (backend y frontend), evaluando implicaciones en la arquitectura del proyecto, dependencias necesarias, pros, contras y otros detalles técnicos.
- **🛠️ 2. Fase de Implementación:** Se realiza todo lo relacionado a la materialización de lo planificado. Incluye escribir código, crear y/o buscar recursos necesarios (imágenes, iconos, etc.) y cualquier tarea requerida para concretar la idea.
- **🧪 3. Fase de Corrección de Bugs + Perfeccionamiento:** Con la implementación en producción, se realizan pruebas finales para solucionar errores o bugs pequeños no detectados en la fase anterior. Asimismo, se perfecciona la idea inicial añadiendo detalles o mejoras que no estaban planeadas originalmente pero que se consideran valiosas tras ver la función en marcha.

---

## 📜 9. Licencia & Uso de Código Abierto

Este proyecto es software de **código abierto** distribuido bajo la [Licencia MIT](/LICENSE.md).

> [!NOTE]
> **Uso como base para tu propio blog:**
> El código está disponible de manera libre para que cualquiera pueda tomarlo como punto de partida para crear su propio blog personal con estética retro de los años 2000.
>
> Ten en cuenta que **no se trata de una plantilla en blanco**, ya que este mismo repositorio es el que se utiliza directamente para subir y desplegar el sitio [`ariri.app`](https://ariri.app) en **GitHub Pages**. Debido a esto, en caso de querer usarlo como base, el esfuerzo inicial de re-personalización (removiendo entradas de prueba, datos personales y assets específicos) puede ser elevado.
>
> Sin embargo, te beneficiará al no tener que construir desde cero:
> - La maquetación en 3 columnas responsiva y el sistema de diseño en CSS puro.
> - Los widgets interactivos ya desarrollados (reproductor MP3 retro con la API de YouTube, pizarrón interactivo en HTML5 Canvas, perfil, badges y paginación).
> - La configuración completa del motor de blog con Markdown/`gray-matter` y la automatización del despliegue en **GitHub Actions + GitHub Pages**.

