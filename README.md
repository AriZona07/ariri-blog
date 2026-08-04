# 🌐 Ariri Blog — Retro 2000s Web

Un blog personal con estética nostálgica de los años 2000, construido con tecnología moderna para máxima velocidad, libertad de código y optimización SEO.

---

## 🎯 1. Visión General del Proyecto

- **Dominio Personalizado:** [`ariri.app`](https://ariri.app) (Dominio de estudiante en Name.com)
- **Alojamiento & Despliegue:** GitHub Pages + GitHub Actions (CI/CD automático)
- **Enfoque SEO:** Optimizado para motores de búsqueda (Google Search Console, sitemap estático, metadatos OpenGraph/Twitter).
- **Stack Tecnológico:**
  - **Framework:** Next.js (App Router, SSG / Exportación Estática)
  - **Lenguaje:** TypeScript
  - **Estilos:** CSS Puro
  - **Contenido:** Markdown / MDX (`gray-matter` + `next-mdx-remote`)

---

## 📐 2. Especificación de Diseño y Maquetación (Layout Flotante)

El diseño busca replicar la experiencia retro de blogs de los años 2000 (Blogger / Myspace / Geocities) con un contenedor flotante sobre un fondo de pantalla.

### 🖼️ Esquema Estructural

```text
+-----------------------------------------------------------------------+
|  Fondo General (Imagen / Gradient provisional)                        |
|                                                                       |
|   +---------------------------------------------------------------+   |
|   |  CONTENEDOR FLOTANTE (Margen de 5% - 10% respecto a pantalla) |   |
|   | +-----------------------------------------------------------+ |   |
|   | | 1. ENCABEZADO (Header 100% ancho, altura fija)             | |   |
|   | +-----------------------------------------------------------+ |   |
|   | | 3. BARRA IZQ  | 2. CUERPO PRINCIPAL       | 4. BARRA DER  | |   |
|   | |   (10% - 20%) |    (60% - 80%)            |   (10% - 20%) | |   |
|   | |               |                           |               | |   |
|   | | - Perfil/Bio  | - Posts en Markdown       | - Libro de    | |   |
|   | | - Músic player| - Título y metadatos      |   Visitas     | |   |
|   | | - Banners 88x31| - Contenido de artículo   | - Categorías  | |   |
|   | +---------------+---------------------------+---------------+ |   |
|   +---------------------------------------------------------------+   |
|                                                                       |
+-----------------------------------------------------------------------+
```

### 📜 Reglas de Comportamiento Visual
1. **Efecto Flotante:** Un contenedor central elevado con `margin: 2rem auto` (o 5% - 10% de separación) para que siempre sea visible el fondo detrás.
2. **Scroll Global:** El scroll **no es interno** de la estructura. La estructura crece verticalmente según la longitud del contenido, permitiendo hacer scroll por toda la página.
3. **Distribución en 3 Columnas:**
   - **Header:** Ocupa el 100% del ancho del contenedor flotante.
   - **Sidebar Izquierda (Perfil & Identidad):**
     - **Sección "Sobre mí":** Foto de perfil integrada al estilo revista/periódico (la foto actúa como letra inicial capital a la izquierda, rodeada por el texto arriba a la derecha y continuada por debajo).
     - **Redes Sociales.**
     - **Badges / Roles (Estilo Roles de Discord):** Etiquetas estilizadas para representar gustos e intereses.
   - **Cuerpo Central (60% - 80%):** Posts en Markdown / MDX, metadatos y contenido principal.
   - **Sidebar Derecha (Widgets Interactivos):**
     - **Reproductor MP3 Retro:** Integración de playlists de YouTube en formato de reproductor de audio retro sin video visible.
     - **Pizarrón Interactivo:** Dibujo o notas dinámicas.
     - Espacio reservado para futuros widgets.
4. **Adaptabilidad (Responsive Mobile):** Diseñado primeramente para escritorio. En pantallas móviles (<768px), las 3 columnas se reorganizan verticalmente en una sola columna (*Header ➔ Cuerpo ➔ Sidebar Izquierda ➔ Sidebar Derecha*).

### 🎨 Estilos Visuales, Temática & Personalidad

- **Estética Base:** Blogger / Web 2.0 (2004-2008) — Bordes redondeados suaves, degradados pastel y brillantes, sombras ligeras (*soft glow*).
- **Archivos de Estilo:** CSS Puro estándar (sin `.module.css`).
- **Temática e Intereses Personales:**
  - 🎮 **Videojuegos:** Minecraft, Roblox, Hollow Knight.
  - 📖 **Manga / GL:** *"El Chico Que Me Gusta No Es Un Chico"*, contenido GL / Sáficos en general.
  - 🐧 **Filosofía & Cultura:** Anarquismo, estética Punk, Software Libre, Linux.
  - 🦇 **Fantasía & Nicho:** Vampiros.
- **Tipografía General ([`public/fonts/simple-japan.ttf`](/public/fonts/simple-japan.ttf)):** Fuente principal para títulos, subtítulos, cuerpo de texto y menús.
- **Tipografía Especial ([`public/fonts/special-punk.ttf`](/public/fonts/special-punk.ttf)):** Fuente punk estilo letras recortadas de revista, reservada para detalles especiales o títulos decorativos.

---

## 📂 3. Arquitectura y Estructura de Carpetas

```text
src/
├── app/                  <-- SOLO archivos de rutas/páginas
│   ├── layout.tsx
│   ├── page.tsx
│   └── sitemap.ts
│
├── styles/               <-- Tu CSS organizado
│   ├── globals.css       (Mueves globals.css aquí)
│   └── retro.css         (Tus estilos 2000s)
│
├── components/           <-- Tus componentes React (Widgets, Navbar, etc.)
│   ├── Guestbook.tsx
│   └── MusicPlayer.tsx
│
└── content/              <-- Tus publicaciones en Markdown (.md)
    ├── primer-post.md
    └── hola-mundo.md
```

---

## 📦 4. Dependencias y Herramientas

Para ver la explicación detallada de cada librería, consulta la [Guía de Dependencias](/DEPENDENCIES.md).

- **Procesamiento de Contenido:** `gray-matter`, `next-mdx-remote`
- **Resaltado de Código:** `rehype-highlight`, `highlight.js`
- **Sindicación:** `rss`
- **Estilos Retro (Opcional):** `98.css`

---

## 🛠️ 5. Guía Técnica y Comandos

### 🚀 Entorno de Desarrollo
Para iniciar el servidor de desarrollo local:

```bash
npm run dev
```
Abre [http://localhost:3000](http://localhost:3000) en tu navegador para ver el resultado.

### 🏗️ Compilación y Exportación Estática
Para generar el sitio estático para GitHub Pages:

```bash
npm run build
```

---

## 🗺️ 6. Plan de Trabajo / Roadmap

- [ ] **Fase 1: Maquetación Base (HTML + CSS Puro)**
  - Implementar contenedor flotante con márgenes y fondo provisional.
  - Crear layout grid/flex (Header, Sidebar Izquierda, Cuerpo, Sidebar Derecha).
  - Añadir media queries básicas para versión móvil.
- [ ] **Fase 2: Motor de Blog (Markdown & MDX)**
  - Configurar carpeta de entradas `/content/posts/`.
  - Crear funciones helper con `gray-matter` para leer archivos Markdown.
  - Implementar página dinámicas `/posts/[slug]`.
- [ ] **Fase 3: Estética Retro & Widgets**
  - Añadir tipografías nostálgicas y paleta de colores de los 2000s.
  - Implementar widgets (Reproductor de música de fondo / falso, botones 88x31, libro de visitas).
- [ ] **Fase 4: SEO, RSS & Despliegue**
  - Configurar sitemap, `robots.txt` y metadatos SEO.
  - Configurar GitHub Action para despliegue automático en `ariri.app`.
