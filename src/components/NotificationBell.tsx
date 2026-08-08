"use client";

/**
 * NotificationBell.tsx — Campana de notificaciones del sitio y avisos en tiempo real
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
  DEFAULT_NOTIFICATION_PREFS,
  type NotificationItem,
  type UserNotificationPrefs,
} from "@/lib/notifications";

const READ_KEY = "ariri_notifications_read_at";

export default function NotificationBell() {
  const { user } = useAuth();
  const router = useRouter();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [prefs, setPrefs] = useState<UserNotificationPrefs>(DEFAULT_NOTIFICATION_PREFS);
  const [lastReadTime, setLastReadTime] = useState<number>(0);
  const [toastNotification, setToastNotification] = useState<NotificationItem | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      queueMicrotask(() => {
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

  // Escuchar notificaciones globales o dirigidas desde la colección `notifications`
  useEffect(() => {
    const q = query(
      collection(db, "notifications"),
      orderBy("createdAt", "desc"),
      limit(20)
    );

    let isInitialLoad = true;

    const unsubscribe = onSnapshot(
      q,
      async (snapshot) => {
        const list: NotificationItem[] = snapshot.docs
          .map((docSnap) => {
            const data = docSnap.data();
            return {
              id: docSnap.id,
              targetUserId: data.targetUserId || null,
              title: data.title || "Notificación",
              message: data.message || "",
              postSlug: data.postSlug || "",
              commentId: data.commentId || undefined,
              read: Boolean(data.read),
              type: data.type || "info",
              createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(),
            };
          })
          .filter((item: NotificationItem) => {
            // Notificación dirigida a un usuario específico
            if (item.targetUserId) {
              return user && item.targetUserId === user.uid;
            }
            // Notificación global (nuevos posts)
            return true;
          });

        setNotifications(list);

        // Disparar aviso emergente o Web Push si llega una nueva notificación tras la carga inicial
        if (!isInitialLoad && list.length > 0 && user) {
          const latest = list[0];
          const latestTime = latest.createdAt instanceof Date ? latest.createdAt.getTime() : Date.now();

          const currentPrefs = await getUserNotificationPrefs(user.uid);

          if (latestTime > lastReadTime) {
            if (currentPrefs.inApp.newReplies || currentPrefs.inApp.newComments) {
              setToastNotification(latest);
            }

            if (currentPrefs.webPush.newReplies || currentPrefs.webPush.newComments) {
              const targetUrl = latest.commentId
                ? `/posts/${latest.postSlug}#comment-${latest.commentId}`
                : `/posts/${latest.postSlug}`;

              triggerBrowserNotification(
                latest.title,
                latest.message,
                targetUrl,
                (path) => router.push(path)
              );
            }
          }
        }

        isInitialLoad = false;
      },
      (err) => {
        console.warn("Aviso al consultar notificaciones en Firestore:", err);
      }
    );

    return () => unsubscribe();
  }, [user, router, lastReadTime]);

  // Bloquear scroll del body cuando el modal está abierto
  useEffect(() => {
    if (!isOpen) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, [isOpen]);

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

  const hasInAppEnabled = prefs.inApp.newComments || prefs.inApp.newReplies;

  const visibleNotifications = hasInAppEnabled
    ? notifications.filter((n) => {
        const nTime = n.createdAt instanceof Date ? n.createdAt.getTime() : 0;
        return nTime > lastReadTime && !n.read;
      })
    : [];

  const unreadCount = visibleNotifications.length;

  function handleMarkAllRead() {
    const now = Date.now();
    setLastReadTime(now);
    if (typeof window !== "undefined") {
      localStorage.setItem(READ_KEY, now.toString());
    }
  }

  return (
    <div className="notification-bell-container" ref={dropdownRef}>
      <button
        type="button"
        className="notification-bell-btn"
        onClick={() => setIsOpen((v) => !v)}
        aria-label="Notificaciones"
        title="Notificaciones"
        id="notification-bell-btn"
      >
        🔔
        {unreadCount > 0 && (
          <span className="notification-badge" id="notification-unread-count">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div
          className="notification-modal-overlay"
          onClick={() => setIsOpen(false)}
          role="dialog"
          aria-modal="true"
          aria-label="Notificaciones"
        >
          <div
            className="notification-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="notification-modal__header">
              <span className="notification-modal__title">🔔 Notificaciones</span>
              <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                {visibleNotifications.length > 0 && (
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
              {!user ? (
                <div className="notification-disabled-box">
                  <p style={{ fontSize: "0.85rem", color: "var(--color-text-secondary)" }}>
                    Inicia sesión para ver tus notificaciones.
                  </p>
                </div>
              ) : !hasInAppEnabled ? (
                <div className="notification-disabled-box">
                  <div style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>🔕</div>
                  <p style={{ fontWeight: "bold", fontSize: "0.85rem", color: "var(--color-text-primary)", marginBottom: "0.3rem" }}>
                    Notificaciones en el sitio desactivadas
                  </p>
                  <p style={{ fontSize: "0.75rem", color: "var(--color-text-muted)", marginBottom: "1rem", maxWidth: "260px" }}>
                    Actívalas en la pantalla de ajustes para enterarte cuando respondan tus comentarios.
                  </p>
                  <Link
                    href="/settings/notifications"
                    className="notification-enable-btn"
                    onClick={() => setIsOpen(false)}
                  >
                    ⚙️ Configurar Notificaciones
                  </Link>
                </div>
              ) : visibleNotifications.length === 0 ? (
                <div className="notification-dropdown__empty">
                  No hay notificaciones sin leer.
                </div>
              ) : (
                visibleNotifications.map((item) => {
                  const targetHref = item.commentId
                    ? `/posts/${encodeURIComponent(item.postSlug)}#comment-${item.commentId}`
                    : `/posts/${encodeURIComponent(item.postSlug)}`;

                  return (
                    <Link
                      key={item.id}
                      href={targetHref}
                      className="notification-item notification-item--unread"
                      onClick={() => {
                        handleMarkAllRead();
                        setIsOpen(false);
                      }}
                      role="menuitem"
                    >
                      <span className="notification-item__icon" aria-hidden>💬</span>
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

      {toastNotification && (
        <div className="notification-toast" role="status">
          <span style={{ fontSize: "1.3rem" }}>💬</span>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: "bold", fontSize: "0.8rem", color: "var(--color-accent-pink)" }}>
              {toastNotification.title}
            </div>
            <div style={{ fontSize: "0.75rem", color: "var(--color-text-primary)", marginTop: "2px" }}>
              {toastNotification.message}
            </div>
            {toastNotification.postSlug && (
              <Link
                href={
                  toastNotification.commentId
                    ? `/posts/${encodeURIComponent(toastNotification.postSlug)}#comment-${toastNotification.commentId}`
                    : `/posts/${encodeURIComponent(toastNotification.postSlug)}`
                }
                style={{ fontSize: "0.7rem", color: "var(--color-accent-green)", fontWeight: "bold", display: "inline-block", marginTop: "4px" }}
                onClick={() => setToastNotification(null)}
              >
                ★ Ver comentario →
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

