"use client";

/**
 * NotificationSettingsWidget.tsx — Vista de ajustes de notificaciones del usuario (/settings/notifications)
 *
 * Permite configurar individualmente:
 *   1. Notificaciones In-App (Campanita en el sitio)
 *   2. Notificaciones Web Push (Alertas del navegador)
 *   Opciones por categoría:
 *     - Nuevos comentarios en publicaciones (Exclusivo Administrador)
 *     - Nuevas respuestas a tus comentarios
 */

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import {
  getUserNotificationPrefs,
  setUserNotificationPrefs,
  requestBrowserNotificationPermission,
  DEFAULT_NOTIFICATION_PREFS,
  type UserNotificationPrefs,
} from "@/lib/notifications";

export default function NotificationSettingsWidget() {
  const { user, isAdmin } = useAuth();
  const [prefs, setPrefs] = useState<UserNotificationPrefs>(DEFAULT_NOTIFICATION_PREFS);
  const [browserPerm, setBrowserPerm] = useState<string>("default");
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError]     = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      queueMicrotask(() => {
        if ("Notification" in window) {
          setBrowserPerm(Notification.permission);
        }
      });
    }
  }, []);

  useEffect(() => {
    let isMounted = true;
    if (user) {
      getUserNotificationPrefs(user.uid).then((p) => {
        if (isMounted) {
          setPrefs(p);
        }
      });
    }
    return () => {
      isMounted = false;
    };
  }, [user]);

  async function updatePref(
    channel: "inApp" | "webPush",
    key: "newComments" | "newReplies",
    val: boolean
  ) {
    const updated: UserNotificationPrefs = {
      ...prefs,
      [channel]: {
        ...prefs[channel],
        [key]: val,
      },
    };

    setPrefs(updated);
    setSuccess(null);
    setError(null);

    if (!user) return;
    try {
      await setUserNotificationPrefs(user.uid, updated);
      setSuccess("Preferencias de notificaciones guardadas correctamente.");
    } catch {
      setError("No se pudieron guardar las preferencias de notificaciones.");
    }
  }

  async function handleRequestBrowserPerm() {
    const perm = await requestBrowserNotificationPermission();
    setBrowserPerm(perm);
    if (perm === "granted") {
      setSuccess("Permisos de notificación del navegador concedidos.");
    } else if (perm === "denied") {
      setError("Permisos de notificación bloqueados en el navegador.");
    }
  }

  if (!user) return null;

  return (
    <div className="account-page">
      <div className="retro-box__header" style={{ marginBottom: "1rem" }}>
        <span className="retro-box__title" style={{ fontSize: "1.2rem" }}>
          🔔 Configuración de Notificaciones
        </span>
      </div>

      {success && <p className="account-success" role="status">{success}</p>}
      {error   && <p className="auth-error"      role="alert">{error}</p>}

      {/* Sección 1: Notificaciones In-App (Campanita en la web) */}
      <div className="notification-settings-card">
        <p className="account-section-title">🔔 Notificaciones en el Sitio (In-App)</p>
        <p className="notification-section-desc">
          Alertas que aparecen en la campanita superior cuando navegas en Ariri Blog.
        </p>

        {isAdmin && (
          <label className="notification-toggle-label">
            <input
              type="checkbox"
              className="notification-toggle-checkbox"
              checked={prefs.inApp.newComments}
              onChange={(e) => updatePref("inApp", "newComments", e.target.checked)}
              id="notif-inapp-newcomments"
            />
            <span className="notification-toggle-text">
              <strong>Nuevos comentarios (Admin):</strong> Recibir alertas cuando alguien comente directamente en una publicación.
            </span>
          </label>
        )}

        <label className="notification-toggle-label" style={{ marginTop: "0.5rem" }}>
          <input
            type="checkbox"
            className="notification-toggle-checkbox"
            checked={prefs.inApp.newReplies}
            onChange={(e) => updatePref("inApp", "newReplies", e.target.checked)}
            id="notif-inapp-newreplies"
          />
          <span className="notification-toggle-text">
            <strong>Nuevas respuestas:</strong> Recibir alertas cuando alguien responda a tus comentarios o tus respuestas.
          </span>
        </label>
      </div>

      {/* Sección 2: Notificaciones Web Push (Navegador) */}
      <div className="notification-settings-card" style={{ marginTop: "1rem" }}>
        <p className="account-section-title">🌐 Notificaciones del Navegador (Web Push)</p>
        <p className="notification-section-desc">
          Avisos flotantes en la pantalla de tu dispositivo enviados por el navegador.
        </p>

        <div className="notification-browser-status" style={{ marginBottom: "1rem" }}>
          <span>
            Estado en este navegador:{" "}
            <strong>
              {browserPerm === "granted"
                ? "Permitidos ✅"
                : browserPerm === "denied"
                ? "Bloqueados ❌"
                : "Sin solicitar"}
            </strong>
          </span>
          {browserPerm !== "granted" && (
            <button
              type="button"
              className="notification-perm-btn"
              onClick={handleRequestBrowserPerm}
              id="acc-request-notifications-btn"
            >
              Activar permisos
            </button>
          )}
        </div>

        {isAdmin && (
          <label className="notification-toggle-label">
            <input
              type="checkbox"
              className="notification-toggle-checkbox"
              checked={prefs.webPush.newComments}
              onChange={(e) => updatePref("webPush", "newComments", e.target.checked)}
              disabled={browserPerm !== "granted"}
              id="notif-webpush-newcomments"
            />
            <span className="notification-toggle-text">
              <strong>Nuevos comentarios (Admin):</strong> Recibir aviso emergente en pantalla al haber un nuevo comentario.
            </span>
          </label>
        )}

        <label className="notification-toggle-label" style={{ marginTop: "0.5rem" }}>
          <input
            type="checkbox"
            className="notification-toggle-checkbox"
            checked={prefs.webPush.newReplies}
            onChange={(e) => updatePref("webPush", "newReplies", e.target.checked)}
            disabled={browserPerm !== "granted"}
            id="notif-webpush-newreplies"
          />
          <span className="notification-toggle-text">
            <strong>Nuevas respuestas:</strong> Recibir aviso emergente en pantalla al recibir respuestas.
          </span>
        </label>
      </div>
    </div>
  );
}

