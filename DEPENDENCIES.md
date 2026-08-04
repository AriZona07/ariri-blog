# 📦 Guía de Dependencias — Blog Retro 2000s

Este documento detalla todas las dependencias recomendadas para construir un blog estático con estética de los años 2000 utilizando **Next.js**, **TypeScript** y **CSS puro**.

---

## 🛠️ 1. Procesamiento de Contenido (Markdown & Metadata)

### `gray-matter`
- **Comando de instalación:** `npm install gray-matter`
- **¿Qué hace?:** Lee y extrae los metadatos escritos en formato YAML al inicio de los archivos Markdown (el bloque conocido como *frontmatter*).
- **¿Para qué sirve en este blog?:** Permite definir propiedades como el título del post, fecha de publicación, etiquetas, y metadatos retro como el estado de ánimo (*Mood*) o la música que estabas escuchando al escribir (*Listening to*).
- **Ejemplo de uso:**
  ```markdown
  ---
  title: "Mi primer post en el blog"
  date: "2004-05-18"
  mood: "nostalgic"
  music: "Green Day - Boulevard of Broken Dreams"
  ---
  ¡Hola a todos! Bienvenidos a mi rincón en la web...
  ```

---

### `next-mdx-remote`
- **Comando de instalación:** `npm install next-mdx-remote`
- **¿Qué hace?:** Permite cargar y renderizar archivos Markdown (`.md`) o MDX (`.mdx`) de forma dinámica en páginas creadas con Next.js (App Router).
- **¿Para qué sirve en este blog?:** Transforma el texto plano de tus artículos en HTML y componentes de React interactivos de manera eficiente durante la generación estática (SSG).

---

## 🎨 2. Resaltado de Sintaxis para Bloques de Código

### `rehype-highlight` & `highlight.js`
- **Comando de instalación:** `npm install rehype-highlight highlight.js`
- **¿Qué hace?:** Un plugin de procesamiento de HTML (`rehype`) junto con la librería de coloreado de código `highlight.js`.
- **¿Para qué sirve en este blog?:** Detecta los bloques de código dentro de tus posts (por ejemplo, ```javascript ... ```) y les aplica clases CSS para que se vean con sintaxis resaltada estilo retro o terminal.

---

## 📻 3. Sindicación RSS (Lector de Noticias)

### `rss` (y sus tipos para TypeScript)
- **Comando de instalación:** 
  ```bash
  npm install rss
  npm install --save-dev @types/rss
  ```
- **¿Qué hace?:** Generador de archivos de feed XML estándar RSS 2.0.
- **¿Para qué sirve en este blog?:** Un blog de los 2000s no está completo sin un feed RSS. Genera un archivo `feed.xml` durante el build para que la gente se suscriba a tus publicaciones mediante lectores RSS.

---

## 🕹️ 4. Estilos y Librerías Retro (Opcionales)

### `98.css` *(Opcional)*
- **Comando de instalación:** `npm install 98.css`
- **¿Qué hace?:** Un archivo CSS puro que imita fielmente la apariencia visual de los controles e interfaces de **Windows 98**.
- **¿Para qué sirve en este blog?:** Si deseas componentes instantáneos con estilo retro (ventanas con barra de título azul, botones biselados en 3D, cajas de diálogo) sin escribir todo el CSS desde cero.

---

## 📋 Resumen de Instalación Rápida

Para instalar las dependencias principales de una sola vez, ejecuta en tu terminal:

```bash
npm install gray-matter next-mdx-remote rehype-highlight highlight.js rss
npm install --save-dev @types/rss
```
