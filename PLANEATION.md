# 📌 PLANEATION.md — Planeación de Funcionalidades

Este archivo contiene el registro de características, funciones y mejoras planificadas para **Ariri Blog**, organizadas por prioridad (futuro cercano y futuro lejano).

---

## 📻 1. Futuro Cercano (En desarrollo)

### 💬 Sistema Avanzado de Comentarios (Estilo TikTok / Reddit / WhatsApp)
- **Visualización:**
  - UI de comentario: Foto, Nombre, Texto, Fecha, "Responder", Icono de Corazón (Likes).
  - Paginación y Carga: Los comentarios principales se cargan de 10 en 10. Las respuestas de 3 en 3. No se usa tiempo real (`onSnapshot`) para evitar saltos; se hace una carga manual al abrir y se actualiza la UI de forma optimista/local al interactuar. (Se usa `count()` primero para no gastar lecturas completas si no se cargan).
  - Formato de Fecha: Si es el mismo día dice "Hoy a las HH:MM", si es de días anteriores dice "DD/MM/AAAA".
  - Ordenación principal de Comentarios: 1º Notificación (si se accedió por link), 2º por número de Corazones (Likes), 3º Cronológico (más reciente primero).
- **Respuestas (Estilo TikTok):**
  - Ordenación de Respuestas: 1º Notificación, 2º Cronológico (más antiguo primero).
  - Las respuestas a un comentario principal se cargan en bloques de 3 en 3 mediante un texto de "Ver más respuestas".
  - Botón de "Ocultar" para colapsar las respuestas desplegadas.
- **Respuestas a Respuestas (Estilo WhatsApp):**
  - Se mantienen en el mismo hilo (no anidan más).
  - Incluyen una previsualización (1 línea) del comentario al que responden. Al dar clic en esta previsualización, hace scroll hacia esa respuesta original.
- **Sistema de Likes:**
  - Uso de corazones para indicar me gusta (sin dislikes).
  - Limitado a 1 like por cuenta (se guarda un arreglo `likedBy` con los IDs de usuario).
- **Administración y Borrado:**
  - Usuarios comunes pueden borrar sus propios comentarios.
  - Administradores pueden borrar cualquier comentario.
  - Borrado Estilo Reddit (Respuestas Huérfanas): Si un comentario tiene respuestas válidas, al borrarse no desaparece de la BD, sino que se transforma en "[Comentario eliminado]", se borra su nombre, foto e id, inhabilitando los likes pero preservando las respuestas debajo de él. (Igual para cuentas eliminadas: se desvincula el autor pero quedan los likes y el texto).
  - Borrado Total / Cola de Eliminación: Si el comentario NO tiene respuestas (o se fuerza borrado total), se marca como borrado para dejar de pedirse/mostrarse inmediatamente y se añade a la cola genérica de eliminaciones (`deletion-queue.ts`) para eliminarse físicamente de Firestore el día 1 del mes.
- **Notificaciones (In-App y Web Push) Ligadas a cuenta de usuario:**
  - Desactivadas por defecto. El usuario debe activarlas/gestionarlas desde un panel de ajustes (`/settings/notifications`).
  - Divididas en 2 categorías de entrega: **In-App** (campanita en la web) y **Web Push** (notificaciones del navegador).
  - Opciones para ambas categorías:
    1. **Nuevos comentarios (Exclusivo Admin):** Alerta cuando hay un nuevo comentario directo en un post.
    2. **Nuevas respuestas (General):** Alerta cuando alguien responde a un comentario o respuesta tuya.
  - No hay auto-spam (si te respondes a ti mismo o el admin comenta en su post, no hay notificación).
  - Si un comentario se borra, las notificaciones asociadas que no hayan sido leídas también se borran.

- **Detalles Arquitectónicos para la Ejecución:**
  - **Base de Datos (Comentarios):** Las respuestas vivirán en una subcolección `replies` dentro de cada comentario principal (`posts/{slug}/comments/{id}/replies`). Cada comentario tendrá `likesCount`, `replyCount` y un arreglo `likedBy`.
  - **Base de Datos (Notificaciones):** Las preferencias se guardarán en el documento del usuario (`users/{userId}`) divididas en objetos `inApp` y `webPush`. Las notificaciones generadas irán a una subcolección `notifications` dentro del usuario.
  - **Navegación:** Las notificaciones guardarán el ID del comentario destino para redirigir a la URL con un hash (ej. `/post/slug#comment-123`), lo cual forzará al frontend a scrollear hacia él y colocarlo como prioridad 1 en la ordenación visual.

---

## 📻 2. Futuro Lejano (Opcionales)

### 🗓️ Sistema de Publicaciones Automáticas
- Hacer que la fecha de publicación se asigne automáticamente con la fecha del día en el momento que se le da en "Publicar", en lugar de forma manual.
- Añadir un sistema para programar publicaciones (poder terminar de escribir un post, guardarlo en Firebase pero programarlo para que se publique y sea visible hasta cierto día y hora).

### 📱 Aplicación Móvil (Android Nativo)
- Crear una app móvil de código abierto (Open Source) para el proyecto, desarrollada nativamente con **Kotlin y Jetpack Compose**.
- (Por definir): Determinar si la app funcionará exclusivamente como panel de administración para gestionar publicaciones, o si también incluirá una vista pública para que los usuarios puedan navegar y leer los posts desde su teléfono.
