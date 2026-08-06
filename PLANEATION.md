# 📌 PLANEATION.md — Planeación de Funcionalidades

Este archivo contiene el registro de características, funciones y mejoras planificadas para **Ariri Blog**, organizadas por prioridad (futuro cercano y futuro lejano).

> [!IMPORTANT]
> **REGLA FUNDAMENTAL PARA AGENTES DE IA Y DESARROLLADORES:**
> 1. Cada vez que se solicite o elabore una planeación técnica o de diseño para una nueva funcionalidad, las notas, arquitectura y plan de acción deben registrarse en este archivo.
> 2. **LA IA NO TIENE PERMITIDO BORRAR O ELIMINAR SECCIONES DE ESTE ARCHIVO.** La única persona autorizada para borrar o remover una sección es el **programador/usuario humano** (por ejemplo, cuando se decida descartar una idea o cuando una característica se haya implementado por completo y no se requiera mantener la planeación).

> [!NOTE]
> **ESTADO ACTUAL DEL PROYECTO (FASE ACTIVA):**
> Se ha ingresado oficialmente a la **Fase de Solución de Errores y Afinamiento de la Implementación**. Esta etapa está enfocada en corregir bugs, pulir la experiencia de usuario (UX/UI), optimizar el comportamiento de los componentes existentes (Firebase Auth, Firestore, Notificaciones, Perfiles, RSS) y asegurar la estabilidad general antes del despliegue final.

---

## 📻 1. Futuro Cercano (Ya en planeación, pendiente de implementación)


## 📻 2. Futuro Lejano (Opcionales)

### 🎨 Resaltado de Sintaxis en Bloques de Código
- **Concepto:** Coloreado de código para artículos técnicos o tutoriales.
- **Dependencias a evaluar:** `rehype-highlight` + `highlight.js`.
- **Condición:** Se implementará si se comienzan a redactar posts con contenido técnico/código frecuentemente.

### 🔗 Gestión de Slugs Duplicados en Firestore
- **Concepto:** Validación de slugs duplicados en `/settings/admin` al crear o editar entradas de blog para evitar sobreescribir publicaciones existentes involuntariamente.
- **Condición:** Evaluar e implementar si se incrementa la frecuencia de publicación.

