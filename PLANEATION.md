# 📌 PLANEATION.md — Planeación de Funcionalidades

Este archivo contiene el registro de características, funciones y mejoras planificadas para **Ariri Blog**, organizadas por prioridad (futuro cercano y futuro lejano).

> [!IMPORTANT]
> **REGLA FUNDAMENTAL PARA AGENTES DE IA Y DESARROLLADORES:**
> 1. Cada vez que se solicite o elabore una planeación técnica o de diseño para una nueva funcionalidad, las notas, arquitectura y plan de acción deben registrarse en este archivo.
> 2. **LA IA NO TIENE PERMITIDO BORRAR O ELIMINAR SECCIONES DE ESTE ARCHIVO.** La única persona autorizada para borrar o remover una sección es el **programador/usuario humano** (por ejemplo, cuando se decida descartar una idea o cuando una característica se haya implementado por completo y no se requiera mantener la planeación).

---

## 📻 1. Futuro Cercano (Prioritario)

### 🚀 Ecosistema Dinámico Firebase + Sindicación RSS 2.0

#### 🎯 Descripción & Visión General
Implementación de un **JAMstack Híbrido** combinando la compilación estática en **GitHub Pages ($0 USD)** con la potencia de **Google Firebase (Firestore + Firebase Auth)**. Esta arquitectura permitirá contar con autenticación de usuarios, sistema de comentarios, panel de publicación de blogs sin *Pull Requests* y sindicación RSS 2.0 unificada.

---

#### 🔐 1. Sistema de Autenticación & Gestión de Cuenta (`Firebase Auth`)

##### 📝 Registros & Inicio de Sesión
- **Métodos de Autenticación:**
  1. Correo Electrónico + Contraseña.
  2. Proveedor de Identidad Google (*Google Sign-In*).
- **Formularios UI (Estética Emo/Scene 2000s):**
  - Formulario de Registro con validación de campos.
  - Formulario de Login.

##### 👤 Pantalla / Modal de Control de Cuenta (`/account` o `/profile`)
- **Usuario Normal (Amigos / Visitantes):**
  - Edición de Nombre de Usuario / Apodo.
  - Actualización de Foto de Perfil (URL o avatar personalizado).
  - Gestión de credenciales: Cambio de Correo, Cambio de Contraseña y visualización de cuenta vinculada (Google / Email).
- **Usuario Administrador (Creador del Blog):**
  - Todas las funciones de usuario normal.
  - Botón de acceso exclusivo al **Panel de Publicación de Posts** (`/admin`).

##### 🛡️ Protección de Rutas & Control de Acceso (Seguridad Admin)
- **Control Lado Cliente (Next.js):**
  - Las URLs administrativas (ej. `/admin`, `/admin/new-post`) estarán protegidas. Si un usuario no autenticado o sin rol `admin` intenta acceder directamente escribiendo la URL en la barra de direcciones, será redirigido de inmediato a la página principal `/` con una notificación de acceso denegado.
- **Control Lado Servidor (Firestore Security Rules):**
  - Reglas de seguridad estrictas en la base de datos:
    ```javascript
    // Solo el token con claims de admin puede crear/modificar publicaciones
    allow write: if request.auth != null && request.auth.token.admin == true;
    ```

---

#### 📝 2. Publicación de Posts desde la Web (Sin Pull Requests)

- **Panel de Administración (`/admin`):** Formulario visual para redactar publicaciones de blog.
- **Campos del Post:** Título, slug, contenido en Markdown, metadatos (`mood`, `song`, `songCover`, `cover`, fecha).
- **Almacenamiento:** Escritura directa en la colección `posts` de Cloud Firestore.
- **Independencia de Git:** No requiere crear *Pull Requests*, modificar archivos `.md` en local ni ejecutar comandos terminales para publicar un nuevo artículo.

---

#### 💬 3. Sistema de Comentarios & Libro de Visitas (Firestore)

- **Comentarios en Entradas:** Los amigos y usuarios registrados podrán dejar comentarios bajo cada artículo del blog utilizando su foto de perfil y nombre configurados.
- **Libro de Visitas (Guestbook):** Widget / sección dedicada donde cualquier usuario autenticado puede firmar y dejar un mensaje en el blog.
- **Reglas de Seguridad:** Lectura pública de comentarios/firmas; creación restringida a usuarios autenticados (`request.auth != null`).

---

#### 🛰️ 4. Sindicación RSS 2.0 Unificada (`/feed.xml`)

- **Procesamiento de Fuentes:** El generador de RSS 2.0 unificará tanto las publicaciones locales en archivos Markdown (`src/content/`) como las publicaciones dinámicas almacenadas en Cloud Firestore.
- **Modo de Salida:** Creación del XML en `src/app/feed.xml/route.ts` manteniendo compatibilidad estática y autodescubrimiento en `<head>` (`src/app/layout.tsx`).

---

#### 📋 Plan de Acción Integrado

1. **Configuración de Firebase:** Inicializar proyecto en Google Firebase Console, configurar Firestore y Firebase Auth (Email/Google).
2. **Módulo Cliente (`src/lib/firebase.ts`):** Variables de entorno `.env.local` y conexión de Firebase SDK.
3. **Módulo de Autenticación & Perfil:**
   - Componentes `AuthModal.tsx` / `LoginForm.tsx` / `RegisterForm.tsx`.
   - Vista de gestión de cuenta `AccountWidget.tsx`.
4. **Protección de Rutas & Roles Admin:** Implementación de guardia de rutas en `/admin` y configuración de *Firestore Security Rules*.
5. **Panel Admin de Posts:** Formulario `/admin/new-post` para redactar y guardar artículos en Firestore.
6. **Sistema de Comentarios & Libro de Visitas:** Componentes `CommentsWidget.tsx` y `GuestbookWidget.tsx`.
7. **Route Handler RSS 2.0:** Creación de `src/app/feed.xml/route.ts` unificando Markdown local + Firestore.
8. **Pruebas y Verificación:** `npm run build` y comprobación en GitHub Pages.

---

## 🔮 2. Futuro Lejano / En Evaluación

### 🎨 Resaltado de Sintaxis en Bloques de Código
- **Concepto:** Coloreado de código para artículos técnicos o tutoriales.
- **Dependencias a evaluar:** `rehype-highlight` + `highlight.js`.
- **Condición:** Se implementará si se comienzan a redactar posts con contenido técnico/código frecuentemente.
