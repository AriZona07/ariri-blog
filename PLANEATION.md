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
- **Modo de Salida:** Route Handler dinámico `src/app/feed.xml/route.ts` — requiere servidor Node.js (Vercel).
- **Autodescubrimiento:** `<link rel="alternate" type="application/rss+xml" href="/feed.xml" />` en `src/app/layout.tsx`.

---

#### 🔔 5. Sistema de Notificaciones & Preferencias de Usuario (Firestore + Web Push)

- **Emisión de Notificaciones:** Al publicar una nueva entrada en `/admin/new-post`, se crea automáticamente un registro en la colección `notifications` de Cloud Firestore.
- **Campana & Avisos en Tiempo Real:** Icono de campana 🔔 en el encabezado con contador badge de no leídas, panel desplegable de publicaciones recientes y avisos toast flotantes.
- **Notificaciones Web Push:** Integración opcional con la API nativa de notificaciones del navegador (`Notification.requestPermission()`).
- **Control en Cuenta (`/account`):** Sección "Configuración de Notificaciones" en `AccountWidget.tsx` que permite activar/desactivar el envío de alertas y gestionar permisos del navegador.

---

#### 🏗️ Decisiones de Arquitectura (Confirmadas)

| Aspecto | Decisión |
| :--- | :--- |
| **Hosting** | Migrar de GitHub Pages → **Vercel** (plan gratuito, necesario para Route Handlers y SSR parcial) |
| **RSS** | Dinámico y **unificado**: Markdown local + posts de Firestore en tiempo real |
| **Slug de posts (Admin)** | **Manual** — campo editable en el formulario de `/admin/new-post` |
| **Foto de perfil** | URL externa + subida a **Firebase Storage** |

---

#### 📋 Plan de Acción Integrado

1. **Configuración de Firebase:** Inicializar proyecto en Google Firebase Console, configurar Firestore, Firebase Auth (Email/Google) y Firebase Storage.
2. **Módulo Cliente (`src/lib/firebase.ts`):** Variables de entorno `.env.local` y conexión de Firebase SDK (cliente + Admin SDK para el servidor).
3. **Módulo de Autenticación & Perfil:**
   - Componentes `AuthModal.tsx` / `LoginForm.tsx` / `RegisterForm.tsx`.
   - Vista de gestión de cuenta `AccountWidget.tsx`.
4. **Protección de Rutas & Roles Admin:** Implementación de guardia de rutas en `/admin` y configuración de *Firestore Security Rules*.
5. **Panel Admin de Posts:** Formulario `/admin/new-post` para redactar y guardar artículos en Firestore (slug manual).
6. **Sistema de Comentarios & Libro de Visitas:** Componentes `CommentsWidget.tsx` y `GuestbookWidget.tsx`.
7. **Route Handler RSS 2.0:** Creación de `src/app/feed.xml/route.ts` unificando Markdown local + Firestore (dinámico en Vercel).
8. **Migración a Vercel:** Actualizar `next.config.ts` (quitar `output: 'export'`), configurar variables de entorno en Vercel Dashboard y desconectar GitHub Pages.
9. **Pruebas y Verificación:** `npm run build` sin errores y comprobación del sitio en Vercel.

---

#### 🛠️ 6. Fase Activa: Solución de Errores y Afinamiento de la Implementación

Con las características principales estructuradas, la atención del proyecto pasa formalmente a esta fase de pulido y verificación:

- **🐞 Depuración y Corrección de Bugs:**
  - Resolución de errores en manejo de imágenes externas e imágenes de perfil con Next.js `Image` (`remotePatterns`).
  - Validación de estados de sesión y persistencia en Firebase Auth (`onAuthStateChanged`).
  - Manejo de excepciones en escrituras/lecturas de Cloud Firestore y Firebase Storage.
- **🎨 Afinamiento Estético y de UX:**
  - Pulido de la interfaz visual retro Emo/Scene 2000s en modales, widgets y avisos toast.
  - Verificación de responsividad en móviles y pantallas de diferentes tamaños.
  - Asegurar mensajes de error claros y amigables para el usuario.
- **⚡ Optimización y Verificación:**
  - Revisión estricta de tipos TypeScript y cero advertencias de compilación (`npm run build`).
  - Verificación de rendimiento y prevención de renders innecesarios.

---

#### 🗒️ 7. Sistema de Borradores (Drafts) — **Implementado**

- **Colección Firestore:** `drafts` — separada de `posts` para que la lista pública nunca los muestre.
- **Panel Admin (`/admin`):** Botón "📄 Borradores" con badge de contador. Popup modal con lista de borradores (acento cian). Click en borrador → navega al formulario con el borrador cargado.
- **Formulario (`/admin/new-post`):**
  - Query param `?draft=<id>` carga el borrador al montar.
  - **"💾 Guardar borrador"** → crea o actualiza en `drafts`. Si es nuevo, actualiza la URL con `?draft=<id>` para evitar duplicados.
  - **"★ Publicar post ★"** → publica en `posts` y elimina el borrador si existe.
  - **"🗑 Eliminar borrador"** → solo visible con borrador activo; elimina y redirige al panel.
  - Toast visual amarillo de confirmación al guardar.

---

#### ⚙️ 8. Arquitectura de Rutas `/settings/*` & Sidebars Dinámicas — **Implementado**

- **Reestructuración de Rutas:** Migración de `/account` hacia la estructura base `/settings/*` con sub-rutas dedicadas (`/settings/account` para perfil y credenciales, `/settings/notifications` para preferencias de alertas).
- **Redirección de Compatibilidad:** `/account` y `/settings` redirigen automáticamente a `/settings/account`.
- **Sidebar Izquierda Dinámica (`SidebarLeft.tsx`):** Al navegar dentro de `/settings/*`, la barra lateral izquierda reemplaza los widgets de perfil por un menú de navegación de ajustes (`SettingsSidebarWidget.tsx`) con resalte de ruta activa.
- **Ocultamiento de Sidebar Derecha (`SidebarRight.tsx`):** Al estar en `/settings/*`, la barra lateral derecha se oculta automáticamente para dar mayor espacio visual al panel de configuración.

---

### 🎨 Resaltado de Sintaxis en Bloques de Código
- **Concepto:** Coloreado de código para artículos técnicos o tutoriales.
- **Dependencias a evaluar:** `rehype-highlight` + `highlight.js`.
- **Condición:** Se implementará si se comienzan a redactar posts con contenido técnico/código frecuentemente.

