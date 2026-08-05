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
  triggerBrowserNotification,
  type NotificationItem
} from "@/lib/notifications";

const READ_KEY = "ariri_notifications_read_at";

export default function NotificationBell() {
  const { user } = useAuth();
  const router = useRouter();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [lastReadTime, setLastReadTime] = useState<number>(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem(READ_KEY);
      if (stored) {
        return parseInt(stored, 10);
      }
    }
    return 0;
  });
  const [toastNotification, setToastNotification] = useState<NotificationItem | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

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

      // Si se añade una nueva notificación mientras la app está abierta (no en carga inicial)
      if (!isInitialLoad && list.length > 0) {
        const latest = list[0];
        // Verificar si el usuario tiene notificaciones habilitadas
        let enabled = true;
        if (user) {
          enabled = await getUserNotificationPrefs(user.uid);
        }

        if (enabled) {
          // Mostrar aviso toast flotante
          setToastNotification(latest);
          // Disparar notificación nativa del navegador
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
  }, [user, router]);

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

  // Calcular cantidad de no leídas
  const unreadCount = notifications.filter((n) => {
    const nTime = n.createdAt instanceof Date ? n.createdAt.getTime() : 0;
    return nTime > lastReadTime;
  }).length;

  // Marcar todas como leídas
  function handleMarkAllRead() {
    const now = Date.now();
    setLastReadTime(now);
    if (typeof window !== "undefined") {
      localStorage.setItem(READ_KEY, now.toString());
    }
  }

  function toggleOpen() {
    if (!isOpen) {
      handleMarkAllRead();
    }
    setIsOpen((v) => !v);
  }

  return (
    <div className="notification-bell-container" ref={dropdownRef}>
      {/* Botón de la campana */}
      <button
        type="button"
        className="notification-bell-btn"
        onClick={toggleOpen}
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
                {notifications.length > 0 && (
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
              {notifications.length === 0 ? (
                <div className="notification-dropdown__empty">
                  No hay notificaciones recientes.
                </div>
              ) : (
                notifications.map((item) => {
                  const itemTime = item.createdAt instanceof Date ? item.createdAt.getTime() : 0;
                  const isUnread = itemTime > lastReadTime;

                  return (
                    <Link
                      key={item.id}
                      href={item.postSlug ? `/?post=${item.postSlug}` : "/"}
                      className={`notification-item ${isUnread ? "notification-item--unread" : ""}`}
                      onClick={() => setIsOpen(false)}
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
                  );
                })
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
