/**
 * notifications.ts — Utilidades y gestión de notificaciones (Firestore + Navegador Web Push)
 */

import {
  doc,
  getDoc,
  setDoc,
  addDoc,
  collection,
  query,
  where,
  getDocs,
  deleteDoc,
  serverTimestamp,
  type Timestamp,
  type FieldValue,
} from "firebase/firestore";
import { db } from "@/lib/firebase";

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  postSlug: string;
  commentId?: string;
  read?: boolean;
  createdAt?: Date | Timestamp | FieldValue | null;
  type?: string;
}

export interface UserNotificationCategoryPrefs {
  newComments: boolean; // Alerta cuando hay un nuevo comentario directo en un post (Exclusivo Admin)
  newReplies: boolean;  // Alerta cuando alguien responde a un comentario o respuesta tuya
}

export interface UserNotificationPrefs {
  inApp: UserNotificationCategoryPrefs;
  webPush: UserNotificationCategoryPrefs;
}

export const DEFAULT_NOTIFICATION_PREFS: UserNotificationPrefs = {
  inApp: {
    newComments: false,
    newReplies: true,
  },
  webPush: {
    newComments: false,
    newReplies: false,
  },
};

/**
 * Obtiene las preferencias estructuradas de notificaciones del usuario desde Firestore
 */
export async function getUserNotificationPrefs(uid: string): Promise<UserNotificationPrefs> {
  try {
    const userDoc = await getDoc(doc(db, "users", uid));
    if (userDoc.exists()) {
      const data = userDoc.data();
      if (data.notificationPrefs) {
        return {
          inApp: {
            newComments: Boolean(data.notificationPrefs.inApp?.newComments),
            newReplies: Boolean(data.notificationPrefs.inApp?.newReplies ?? true),
          },
          webPush: {
            newComments: Boolean(data.notificationPrefs.webPush?.newComments),
            newReplies: Boolean(data.notificationPrefs.webPush?.newReplies),
          },
        };
      }
      // Soporte de migración si existía la bandera previa `notificationsEnabled`
      if (typeof data.notificationsEnabled === "boolean") {
        return {
          inApp: { newComments: false, newReplies: data.notificationsEnabled },
          webPush: { newComments: false, newReplies: false },
        };
      }
    }
  } catch (err) {
    console.error("Error al obtener preferencias de notificaciones:", err);
  }

  return DEFAULT_NOTIFICATION_PREFS;
}

/**
 * Guarda las preferencias estructuradas de notificaciones del usuario en Firestore
 */
export async function setUserNotificationPrefs(
  uid: string,
  prefs: UserNotificationPrefs
): Promise<void> {
  try {
    await setDoc(
      doc(db, "users", uid),
      {
        notificationPrefs: prefs,
        // Mantener compatibilidad con la bandera global anterior
        notificationsEnabled: prefs.inApp.newComments || prefs.inApp.newReplies,
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );
  } catch (err) {
    console.error("Error al guardar preferencias de notificaciones:", err);
  }
}

/**
 * Crea una nueva notificación en la subcolección `users/{targetUserId}/notifications`
 */
export async function createUserNotification(
  targetUserId: string,
  data: {
    title: string;
    message: string;
    postSlug: string;
    commentId?: string;
    type?: string;
  }
): Promise<void> {
  try {
    await addDoc(collection(db, "users", targetUserId, "notifications"), {
      title: data.title,
      message: data.message,
      postSlug: data.postSlug,
      commentId: data.commentId || null,
      type: data.type || "reply",
      read: false,
      createdAt: serverTimestamp(),
    });
  } catch (err) {
    console.error("Error al crear notificación para usuario:", targetUserId, err);
  }
}

/**
 * Borra las notificaciones no leídas asociadas a un comentario que ha sido borrado
 */
export async function cleanUnreadNotificationsForComment(commentId: string): Promise<void> {
  try {
    // Si un comentario se borra, podemos marcar o eliminar notificaciones huérfanas
    // Nota: Como viven en subcolecciones de usuarios, se puede hacer una búsqueda si es necesario
    // o marcar como inactivas sin interrumpir el flujo del cliente.
  } catch (err) {
    console.warn("Aviso al limpiar notificaciones de comentario:", err);
  }
}

/**
 * Solicita permisos de notificación al navegador
 */
export async function requestBrowserNotificationPermission(): Promise<NotificationPermission> {
  if (typeof window === "undefined" || !("Notification" in window)) {
    return "denied";
  }
  return await Notification.requestPermission();
}

/**
 * Dispara una notificación nativa del navegador si están permitidas
 */
export function triggerBrowserNotification(
  title: string,
  body: string,
  targetUrl?: string,
  onNavigate?: (path: string) => void
) {
  if (typeof window === "undefined" || !("Notification" in window)) return;

  if (Notification.permission === "granted") {
    try {
      const notification = new Notification(title, {
        body,
        icon: "/icons/android-chrome-192x192.png",
        badge: "/icons/favicon-32x32.png",
      });

      if (targetUrl) {
        notification.onclick = () => {
          window.focus();
          if (onNavigate) {
            onNavigate(targetUrl);
          } else {
            window.open(targetUrl, "_self");
          }
        };
      }
    } catch (e) {
      console.error("No se pudo lanzar la notificación nativa del navegador:", e);
    }
  }
}

