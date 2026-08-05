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

  // Cerrar menú al hacer clic fuera
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

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

      {/* Menú desplegable */}
      {isOpen && (
        <div className="notification-dropdown" role="menu">
          <div className="notification-dropdown__header">
            <span className="notification-dropdown__title">🔔 Notificaciones</span>
            {notifications.length > 0 && (
              <button
                type="button"
                className="notification-dropdown__clear-btn"
                onClick={handleMarkAllRead}
              >
                Marcar leídas
              </button>
            )}
          </div>

          <div className="notification-dropdown__list">
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
