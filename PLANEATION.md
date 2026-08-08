# 📌 PLANEATION.md — Planeación de Funcionalidades

Este archivo contiene el registro de características, funciones y mejoras planificadas para **Ariri Blog**, organizadas por prioridad (futuro cercano y futuro lejano).

---

## 📻 1. Futuro Cercano (En desarrollo)

### 🗓️ Sistema de Publicaciones Automáticas
- **Asignación automática de fecha (Inalterable):** La fecha de publicación se asigna automáticamente con el sello de tiempo actual (`serverTimestamp()`) al presionar "Publicar". La fecha es estrictamente inalterable, incluso para el usuario administrador.
- **Programación de publicaciones (`scheduled`):** Permite redactar entradas y programar su liberación para una fecha y hora futuras. Permanecen ocultas al público hasta alcanzar el tiempo estipulado.
- **Estados del Documento (`status`):** Tres estados principales: `'published'` (publicado), `'scheduled'` (programado) y `'draft'` (borrador). Compatibilidad retroactiva garantizada considerando posts existentes sin propiedad `status` como `'published'`.
- **Filtrado en Cliente / Firestore Query:** Las consultas públicas en el frontend filtran los posts donde `publishedAt <= now()` y `status == 'published'`, haciendo visibles las publicaciones programadas de forma automática sin requerir servidores o cronjobs externos.
- **Panel de Administración por Pestañas:** Pestañas de navegación en el panel de control (`/settings/admin`): `[ Publicados | Programados | Borradores ]`, ofreciendo vistas organizadas e indicadores del tiempo restante para la liberación de contenidos programados.

---

## 📻 2. Futuro Lejano (Opcionales)

### 📱 Aplicación Móvil (Android Nativo)
- Crear una app móvil de código abierto (Open Source) para el proyecto, desarrollada nativamente con **Kotlin y Jetpack Compose**.
- (Por definir): Determinar si la app funcionará exclusivamente como panel de administración para gestionar publicaciones, o si también incluirá una vista pública para que los usuarios puedan navegar y leer los posts desde su teléfono.
