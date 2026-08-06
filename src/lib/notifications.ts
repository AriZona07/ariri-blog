/**
 * notifications.ts — Utilidades y gestión de notificaciones (Firestore + Navegador Web Push)
 */

import { doc, getDoc, setDoc, serverTimestamp, type Timestamp, type FieldValue } from "firebase/firestore";
import { db } from "@/lib/firebase";

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  postSlug?: string;
  createdAt?: Date | Timestamp | FieldValue | null;
  type?: string;
}

/**
 * Obtiene la preferencia de notificaciones del usuario desde Firestore / localStorage
 */
export async function getUserNotificationPrefs(uid: string): Promise<boolean> {
  try {
    const userDoc = await getDoc(doc(db, "users", uid));
    if (userDoc.exists() && typeof userDoc.data().notificationsEnabled === "boolean") {
      return userDoc.data().notificationsEnabled;
    }
  } catch (err) {
    console.error("Error al obtener preferencias de notificaciones:", err);
  }
  
  // Por defecto, notificaciones desactivadas
  return false;
}

/**
 * Guarda la preferencia de notificaciones del usuario en Firestore
 */
export async function setUserNotificationPrefs(uid: string, enabled: boolean): Promise<void> {
  try {
    await setDoc(
      doc(db, "users", uid),
      { notificationsEnabled: enabled, updatedAt: serverTimestamp() },
      { merge: true }
    );
  } catch (err) {
    console.error("Error al guardar preferencias de notificaciones:", err);
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
  slug?: string,
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

      if (slug) {
        notification.onclick = () => {
          window.focus();
          const targetPath = `/?post=${slug}`;
          if (onNavigate) {
            onNavigate(targetPath);
          } else {
            window.open(targetPath, "_self");
          }
        };
      }
    } catch (e) {
      console.error("No se pudo lanzar la notificación nativa del navegador:", e);
    }
  }
}
