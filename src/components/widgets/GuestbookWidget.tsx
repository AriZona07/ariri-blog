"use client";

/**
 * GuestbookWidget.tsx — Libro de Visitas
 *
 * Lee y escribe en la colección `guestbook` de Firestore.
 * Usuarios autenticados pueden dejar un mensaje y su nombre.
 * La lista se muestra en tiempo real con onSnapshot.
 *
 * Uso: colocar en SidebarLeft o en cualquier página pública.
 */

import { useState, useEffect } from "react";
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  addDoc,
  serverTimestamp,
  type DocumentData,
} from "firebase/firestore";
import { db }      from "@/lib/firebase";
import { useAuth } from "@/lib/auth-context";

interface GuestbookEntry {
  id:         string;
  message:    string;
  authorName: string;
  createdAt:  string;
}

export default function GuestbookWidget() {
  const { user, preferredFont } = useAuth();

  const [entries,  setEntries]  = useState<GuestbookEntry[]>([]);
  const [message,  setMessage]  = useState("");
  const [sending,  setSending]  = useState(false);
  const [error,    setError]    = useState<string | null>(null);

  const fontFamilies = {
    japan: "var(--font-main)",
    comic: "var(--font-comic)",
    book:  "var(--font-merriweather)",
  };

  const prefFont = preferredFont;

  /* Suscripción en tiempo real al guestbook */
  useEffect(() => {
    const q = query(
      collection(db, "guestbook"),
      orderBy("createdAt", "desc")
    );
    const unsub = onSnapshot(
      q,
      (snap) => {
        const data: GuestbookEntry[] = snap.docs.map((doc: DocumentData) => ({
          id: doc.id,
          message: doc.data().message ?? "",
          authorName: doc.data().authorName ?? "Anónimo",
          createdAt: formatDate(doc.data().createdAt?.toDate()),
        }));
        setEntries(data);
      },
      (err) => {
        console.warn("Aviso al escuchar libro de visitas:", err);
      }
    );
    return () => unsub();
  }, []);

  async function handleSign(e: React.FormEvent) {
    e.preventDefault();
    if (!user || !message.trim()) return;

    setSending(true);
    setError(null);
    try {
      await addDoc(collection(db, "guestbook"), {
        message:    message.trim(),
        authorName: user.displayName ?? "Amigo/a",
        authorId:   user.uid,
        createdAt:  serverTimestamp(),
      });
      setMessage("");
    } catch {
      setError("No se pudo firmar. Inténtalo de nuevo.");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="retro-box guestbook-widget">
      <div className="retro-box__header">✍ Libro de Visitas</div>
      <div className="retro-box__body">

        {/* Lista de firmas */}
        {entries.length === 0 ? (
          <p className="guestbook-empty">¡Sé el primero en firmar! ★</p>
        ) : (
          <div className="guestbook-list" role="list">
            {entries.map((e) => (
              <div key={e.id} className="guestbook-item" role="listitem">
                <div className="guestbook-item__header">
                  <span className="guestbook-item__author">{e.authorName}</span>
                  <span className="guestbook-item__date">{e.createdAt}</span>
                </div>
                <p className="guestbook-item__message" style={{ fontFamily: fontFamilies[prefFont] }}>{e.message}</p>
              </div>
            ))}
          </div>
        )}

        {/* Formulario de firma */}
        {user ? (
          <form onSubmit={handleSign} className="guestbook-form">
            {error && <p className="auth-error" role="alert" style={{ fontSize: "0.7rem" }}>{error}</p>}
            <input
              type="text"
              className="guestbook-form__input"
              style={{ fontFamily: fontFamilies[prefFont] }}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Deja tu firma aquí ✨"
              maxLength={200}
              id="guestbook-message-input"
              aria-label="Tu mensaje en el libro de visitas"
            />
            <button
              type="submit"
              className="guestbook-form__submit"
              disabled={sending || !message.trim()}
              id="guestbook-sign-btn"
            >
              {sending ? "Firmando…" : "★ Firmar"}
            </button>
          </form>
        ) : (
          <p className="guestbook-empty">
            Inicia sesión para firmar el libro.
          </p>
        )}

      </div>
    </div>
  );
}

function formatDate(date?: Date): string {
  if (!date) return "";
  return date.toLocaleDateString("es-MX", {
    month: "short", day: "numeric", year: "numeric",
  });
}
