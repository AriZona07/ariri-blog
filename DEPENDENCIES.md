# 📦 Guía de Dependencias — Blog Retro 2000s

Este documento detalla todas las dependencias del proyecto, clasificadas entre **dependencias activas e instaladas** y **dependencias propuestas / evaluables para el futuro**.

---

## 🟢 1. Dependencias Actualmente Instaladas y En Uso

### `next`, `react`, `react-dom`
- **Estado:** ✅ Instaladas (`next@16.3.0`, `react@19.2.8`, `react-dom@19.2.8`)
- **¿Qué hace?:** Núcleo del framework para la generación estática (SSG) y la renderización de componentes React.

### `typescript` & `@types/*`
- **Estado:** ✅ Instaladas (`typescript@^5`, `@types/node`, `@types/react`, `@types/react-dom`)
- **¿Qué hace?:** Tipado estático y autocompletado en todo el código base.

### `highlight.js`
- **Estado:** ✅ Instalada (`highlight.js`)
- **¿Qué hace?:** Motor de resaltado de sintaxis para bloques de código en Markdown (`src/lib/markdown.tsx`) con el tema oscuro Tokyo Night.

---

## 🟡 2. Dependencias Propuestas / Opcionales para el Futuro

### `next-mdx-remote`
- **Estado:** ⏳ Opcional (No requerida actualmente)
- **Comando de instalación:** `npm install next-mdx-remote`
- **¿Qué hace?:** Permite renderizar archivos MDX (`.mdx`) con componentes React dinámicos dentro de los artículos.
- **Evaluación actual:** El blog renderiza texto plano y HTML estándar directamente desde `.md` sin necesidad de la sobrecarga de MDX. Se instalará solo si en el futuro se requiere incrustar widgets interactivos de React directamente dentro del cuerpo de un post.

---

### `rss` (y `@types/rss`)
- **Estado:** 🚫 **No requerida / No instalada.**
- **¿Qué hace?:** Generador externo de feeds RSS 2.0 XML.
- **Evaluación actual:** No está instalada en `package.json` porque la ruta [/feed.xml](file:///home/fer_anarchy/Code/ariri-blog/src/app/feed.xml/route.ts) ya se encuentra completamente implementada de forma nativa en `src/app/feed.xml/route.ts` mediante `NextResponse` y plantillas XML estándar sin sobrecarga de librerías de terceros.

---

### `98.css` *(Opcional)*
- **Estado:** ⏳ Opcional / Referencia de Estilos
- **Comando de instalación:** `npm install 98.css`
- **¿Qué hace?:** Archivo CSS puro que imita la apariencia de controles de **Windows 98**.
- **Evaluación actual:** Actualmente el blog utiliza su propio sistema de estilos CSS retro en `src/styles/` (temática Emo/Scene 2000s con `.retro-box`). Solo se instalará si se decide agregar diálogos o ventanas flotantes imitando el sistema operativo Windows 98.

---

## 📋 Resumen de Comandos de Instalación

### Instalación de dependencias activas (ya presentes en `package.json`):
```bash
npm install
```

### Comandos para incorporar dependencias futuras (cuando sean necesarias):
```bash
# Para estilos de componentes tipo Windows 98 (opcional):
npm install 98.css
```

