# 📌 PLANEATION.md — Planeación de Funcionalidades

Este archivo contiene el registro de características, funciones y mejoras planificadas para **Ariri Blog**, organizadas por prioridad (futuro cercano y futuro lejano).

> [!IMPORTANT]
> **REGLA FUNDAMENTAL PARA AGENTES DE IA Y DESARROLLADORES:**
> 1. Cada vez que se solicite o elabore una planeación técnica o de diseño para una nueva funcionalidad, las notas, arquitectura y plan de acción deben registrarse en este archivo.
> 2. **LA IA NO TIENE PERMITIDO BORRAR O ELIMINAR SECCIONES DE ESTE ARCHIVO.** La única persona autorizada para borrar o remover una sección es el **programador/usuario humano** (por ejemplo, cuando se decida descartar una idea o cuando una característica se haya implementado por completo y no se requiera mantener la planeación).

---

## 📻 1. Futuro Cercano (Prioritario)

### 🛰️ Sindicación RSS 2.0 (`/feed.xml`)

#### 🎯 Descripción & Relevancia Retro
El RSS (Really Simple Syndication) es un estándar en formato XML ampliamente difundido en la web de los 2000s. Permite a los lectores suscribirse a un blog mediante aplicaciones cliente (Feedly, Thunderbird, NetNewsWire, etc.) para recibir notificaciones de nuevos artículos sin depender de algoritmos ni redes sociales centralizadas.

#### 🏗️ Arquitectura Técnica & Despliegue Estático
- **Ubicación de la Ruta:** `src/app/feed.xml/route.ts` (Next.js App Router Route Handler).
- **Modo de Compilación:** Configurado con `export const dynamic = "force-static"`. Al ejecutar `npm run build`, Next.js exportará directamente el archivo estático `out/feed.xml`, 100% compatible con GitHub Pages y `output: 'export'`.
- **Dependencias:** Paquete `rss` y tipos `@types/rss`.
- **Procesamiento:** El Route Handler leerá todos los archivos `.md` de `/src/content/` usando `gray-matter`, extraerá los metadatos (`title`, `date`, `excerpt`, `mood`, `song`) y generará el árbol XML validado en formato RSS 2.0.

#### 🎨 Integración Visual & SEO
- **Autodescubrimiento en `<head>`:** Adición de la etiqueta `<link rel="alternate" type="application/rss+xml" title="Ariri Blog RSS Feed" href="https://ariri.app/feed.xml" />` en `src/app/layout.tsx`.
- **UI Retro:** Botón / enlace retro con icono clásico de RSS en el pie de página (`SiteFooter.tsx`).

#### 📋 Plan de Acción
1. Instalación de dependencias: `npm install rss` y `npm install --save-dev @types/rss`.
2. Actualización de `DEPENDENCIES.md`.
3. Creación del Route Handler `src/app/feed.xml/route.ts`.
4. Configuración de metadatos RSS en `src/app/layout.tsx`.
5. Incorporación del botón/enlace en `SiteFooter.tsx`.
6. Verificación con `npm run build` y validación del XML resultante.

---

## 🔮 2. Futuro Lejano / En Evaluación

### 💬 Libro de Visitas (Guestbook Interactivo)
- **Concepto:** Permitir a los visitantes dejar firmas, mensajes y comentarios retro en el blog.
- **Alternativas a evaluar:** Integración ligera con GitHub Discussions API, Supabase, o un backend serverless sin comprometer la velocidad ni la exportación estática en GitHub Pages.

### 🎨 Resaltado de Sintaxis en Bloques de Código
- **Concepto:** Coloreado de código para artículos técnicos o tutoriales.
- **Dependencias a evaluar:** `rehype-highlight` + `highlight.js`.
- **Condición:** Se implementará si se comienzan a redactar posts con contenido técnico/código frecuentemente.
