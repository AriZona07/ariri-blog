"use client";

/**
 * NotificationBell.tsx — Campana de notificaciones con menú desplegable y avisos en tiempo real
 */

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { collection, query, orderBy, limit, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/lib/auth-context";
import {
  getUserNotificationPrefs,
  setUserNotificationPrefs,
  triggerBrowserNotification,
  type NotificationItem
} from "@/lib/notifications";

const READ_KEY = "ariri_notifications_read_at";
const ENABLED_KEY = "ariri_notifications_enabled";

export default function NotificationBell() {
  const { user } = useAuth();
  const router = useRouter();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState<boolean>(false);
  const [lastReadTime, setLastReadTime] = useState<number>(0);
  const [toastNotification, setToastNotification] = useState<NotificationItem | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Cargar estado inicial desde localStorage al montar en el cliente (usando microtarea para evitar setState síncrono en useEffect)
  useEffect(() => {
    if (typeof window !== "undefined") {
      queueMicrotask(() => {
        setNotificationsEnabled(localStorage.getItem(ENABLED_KEY) === "true");

        const storedRead = localStorage.getItem(READ_KEY);
        if (storedRead) {
          setLastReadTime(parseInt(storedRead, 10));
        } else {
          const now = Date.now();
          localStorage.setItem(READ_KEY, now.toString());
          setLastReadTime(now);
        }
      });
    }
  }, []);

  // Sincronizar preferencia asíncrona del usuario desde Firestore cuando 'user' existe
  useEffect(() => {
    let isMounted = true;
    if (user) {
      getUserNotificationPrefs(user.uid).then((enabled) => {
        if (isMounted) {
          setNotificationsEnabled(enabled);
          if (typeof window !== "undefined") {
            localStorage.setItem(ENABLED_KEY, enabled ? "true" : "false");
          }
        }
      });
    }
    return () => {
      isMounted = false;
    };
  }, [user]);

  // Escuchar notificaciones en tiempo real desde Firestore
  useEffect(() => {
    const q = query(
      collection(db, "notifications"),
      orderBy("createdAt", "desc"),
      limit(10)
    );

    let isInitialLoad = true;

    const unsubscribe = onSnapshot(q, async (snapshot) => {
      const list: NotificationItem[] = snapshot.docs.map((docSnap) => {
        const data = docSnap.data();
        return {
          id: docSnap.id,
          title: data.title || "Notificación",
          message: data.message || "",
          postSlug: data.postSlug || "",
          type: data.type || "info",
          createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(),
        };
      });

      setNotifications(list);

      // Si se añade una nueva notificación mientras la app está abierta
      if (!isInitialLoad && list.length > 0) {
        const latest = list[0];
        const latestTime = latest.createdAt instanceof Date ? latest.createdAt.getTime() : Date.now();

        let enabled = notificationsEnabled;
        if (user) {
          enabled = await getUserNotificationPrefs(user.uid);
        }

        // Solo notificar si las notificaciones están activadas y el post es posterior a la última lectura
        if (enabled && latestTime > lastReadTime) {
          setToastNotification(latest);
          triggerBrowserNotification(
            latest.title,
            latest.message,
            latest.postSlug,
            (path) => router.push(path)
          );
        }
      }

      isInitialLoad = false;
    });

    return () => unsubscribe();
  }, [user, router, notificationsEnabled, lastReadTime]);

  // Bloquear scroll del body cuando el modal de notificaciones está abierto
  useEffect(() => {
    if (!isOpen) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, [isOpen]);

  // Cerrar al presionar Escape
  useEffect(() => {
    if (!isOpen) return;
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setIsOpen(false);
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  // Solo mostrar notificaciones posteriores a la última lectura/activación si notificaciones están activadas
  const visibleNotifications = notificationsEnabled
    ? notifications.filter((n) => {
        const nTime = n.createdAt instanceof Date ? n.createdAt.getTime() : 0;
        return nTime > lastReadTime;
      })
    : [];

  const unreadCount = visibleNotifications.length;

  // Marcar todas como leídas (actualiza timestamp y limpia la lista visible)
  function handleMarkAllRead() {
    const now = Date.now();
    setLastReadTime(now);
    if (typeof window !== "undefined") {
      localStorage.setItem(READ_KEY, now.toString());
    }
  }

  // Activar notificaciones desde el modal
  async function handleEnableNotifications() {
    const now = Date.now();
    setLastReadTime(now);
    if (typeof window !== "undefined") {
      localStorage.setItem(READ_KEY, now.toString());
      localStorage.setItem(ENABLED_KEY, "true");
    }
    setNotificationsEnabled(true);
    if (user) {
      await setUserNotificationPrefs(user.uid, true);
    }
  }

  return (
    <div className="notification-bell-container" ref={dropdownRef}>
      {/* Botón de la campana */}
      <button
        type="button"
        className="notification-bell-btn"
        onClick={() => setIsOpen((v) => !v)}
        aria-label="Notificaciones"
        title="Notificaciones de nuevas publicaciones"
        id="notification-bell-btn"
      >
        🔔
        {unreadCount > 0 && (
          <span className="notification-badge" id="notification-unread-count">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {/* Modal Pop-up Global de Notificaciones */}
      {isOpen && (
        <div
          className="notification-modal-overlay"
          onClick={() => setIsOpen(false)}
          role="dialog"
          aria-modal="true"
          aria-label="Notificaciones del blog"
        >
          <div
            className="notification-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="notification-modal__header">
              <span className="notification-modal__title">🔔 Notificaciones</span>
              <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                {notificationsEnabled && visibleNotifications.length > 0 && (
                  <button
                    type="button"
                    className="notification-dropdown__clear-btn"
                    onClick={handleMarkAllRead}
                  >
                    Marcar leídas
                  </button>
                )}
                <button
                  type="button"
                  className="notification-modal__close-btn"
                  onClick={() => setIsOpen(false)}
                  aria-label="Cerrar notificaciones"
                >
                  ✕
                </button>
              </div>
            </div>

            <div className="notification-modal__list">
              {!notificationsEnabled ? (
                <div className="notification-disabled-box">
                  <div style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>🔕</div>
                  <p style={{ fontWeight: "bold", fontSize: "0.85rem", color: "var(--color-text-primary)", marginBottom: "0.3rem" }}>
                    Notificaciones desactivadas
                  </p>
                  <p style={{ fontSize: "0.75rem", color: "var(--color-text-muted)", marginBottom: "1rem", maxWidth: "260px" }}>
                    Activa las notificaciones para recibir avisos en tiempo real cuando se publiquen nuevos artículos en el blog.
                  </p>
                  <button
                    type="button"
                    className="notification-enable-btn"
                    onClick={handleEnableNotifications}
                  >
                    🔔 Activar notificaciones
                  </button>
                </div>
              ) : visibleNotifications.length === 0 ? (
                <div className="notification-dropdown__empty">
                  No hay notificaciones recientes.
                </div>
              ) : (
                visibleNotifications.map((item) => (
                  <Link
                    key={item.id}
                    href={item.postSlug ? `/?post=${item.postSlug}` : "/"}
                    className="notification-item notification-item--unread"
                    onClick={() => {
                      handleMarkAllRead();
                      setIsOpen(false);
                    }}
                    role="menuitem"
                  >
                    <span className="notification-item__icon" aria-hidden>📰</span>
                    <div className="notification-item__content">
                      <div className="notification-item__title">{item.title}</div>
                      <div className="notification-item__message">{item.message}</div>
                      <div className="notification-item__date">
                        {item.createdAt instanceof Date
                          ? item.createdAt.toLocaleDateString("es-MX", {
                              month: "short",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })
                          : ""}
                      </div>
                    </div>
                  </Link>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Toast Flotante cuando llega un nuevo post */}
      {toastNotification && (
        <div className="notification-toast" role="status">
          <span style={{ fontSize: "1.3rem" }}>📢</span>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: "bold", fontSize: "0.8rem", color: "var(--color-accent-pink)" }}>
              {toastNotification.title}
            </div>
            <div style={{ fontSize: "0.75rem", color: "var(--color-text-primary)", marginTop: "2px" }}>
              {toastNotification.message}
            </div>
            {toastNotification.postSlug && (
              <Link
                href={`/?post=${toastNotification.postSlug}`}
                style={{ fontSize: "0.7rem", color: "var(--color-accent-green)", fontWeight: "bold", display: "inline-block", marginTop: "4px" }}
                onClick={() => setToastNotification(null)}
              >
                ★ Leer publicación →
              </Link>
            )}
          </div>
          <button
            type="button"
            className="notification-toast__close"
            onClick={() => setToastNotification(null)}
            aria-label="Cerrar aviso"
          >
            ✕
          </button>
        </div>
      )}
    </div>
  );
}
