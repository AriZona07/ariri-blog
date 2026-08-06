"use client";

/**
 * NotificationSettingsWidget.tsx — Vista de ajustes de notificaciones del usuario (/settings/notifications)
 */

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import {
  getUserNotificationPrefs,
  setUserNotificationPrefs,
  requestBrowserNotificationPermission,
} from "@/lib/notifications";

const ENABLED_KEY = "ariri_notifications_enabled";
const READ_KEY = "ariri_notifications_read_at";

export default function NotificationSettingsWidget() {
  const { user } = useAuth();
  const [notificationsEnabled, setNotificationsEnabled] = useState<boolean>(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem(ENABLED_KEY) === "true";
    }
    return false;
  });
  const [browserPerm, setBrowserPerm] = useState<string>(() => {
    if (typeof window !== "undefined" && "Notification" in window) {
      return Notification.permission;
    }
    return "default";
  });
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError]     = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    if (user) {
      getUserNotificationPrefs(user.uid).then((pref) => {
        if (isMounted) {
          setNotificationsEnabled(pref);
          if (typeof window !== "undefined") {
            localStorage.setItem(ENABLED_KEY, pref ? "true" : "false");
          }
        }
      });
    }
    return () => {
      isMounted = false;
    };
  }, [user]);

  async function handleToggleNotifications(enabled: boolean) {
    setNotificationsEnabled(enabled);
    setSuccess(null);
    setError(null);
    if (typeof window !== "undefined") {
      localStorage.setItem(ENABLED_KEY, enabled ? "true" : "false");
      if (enabled) {
        localStorage.setItem(READ_KEY, Date.now().toString());
      }
    }
    if (!user) return;
    try {
      await setUserNotificationPrefs(user.uid, enabled);
      setSuccess(`Notificaciones ${enabled ? "activadas" : "desactivadas"} correctamente.`);
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

      <div className="notification-settings-card">
        <p className="account-section-title">Preferencias de Alertas</p>
        <label className="notification-toggle-label">
          <input
            type="checkbox"
            className="notification-toggle-checkbox"
            checked={notificationsEnabled}
            onChange={(e) => handleToggleNotifications(e.target.checked)}
            id="acc-notifications-toggle"
          />
          <span className="notification-toggle-text">
            Recibir notificaciones en tiempo real cuando haya un nuevo post o publicación en el blog
          </span>
        </label>

        <div className="notification-browser-status" style={{ marginTop: "1rem" }}>
          <span>
            Avisos del navegador:{" "}
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
              Activar avisos
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
