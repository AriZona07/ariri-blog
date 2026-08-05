"use client";

/**
 * CommentsWidget.tsx — Sistema de comentarios por post
 *
 * Escucha en tiempo real la subcolección `posts/{postSlug}/comments` en Firestore.
 * Permite a usuarios autenticados dejar comentarios bajo cada entrada.
 *
 * Props:
 *   postSlug — identificador del post (se usa como ID del documento en Firestore)
 */

import { useState, useEffect } from "react";
import Image                   from "next/image";
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

interface Comment {
  id:         string;
  text:       string;
  authorName: string;
  authorPhoto: string | null;
  authorId:   string;
  createdAt:  string;
}

interface CommentsWidgetProps {
  postSlug: string;
}

export default function CommentsWidget({ postSlug }: CommentsWidgetProps) {
  const { user } = useAuth();
  const [comments, setComments] = useState<Comment[]>([]);
  const [text,     setText]     = useState("");
  const [sending,  setSending]  = useState(false);
  const [error,    setError]    = useState<string | null>(null);

  /* Suscripción en tiempo real a los comentarios del post */
  useEffect(() => {
    const commentsRef = collection(db, "posts", postSlug, "comments");
    const q = query(commentsRef, orderBy("createdAt", "asc"));

    const unsub = onSnapshot(q, (snap) => {
      const data: Comment[] = snap.docs.map((doc: DocumentData) => ({
        id:          doc.id,
        text:        doc.data().text        ?? "",
        authorName:  doc.data().authorName  ?? "Anónimo",
        authorPhoto: doc.data().authorPhoto ?? null,
        authorId:    doc.data().authorId    ?? "",
        createdAt:   formatDate(doc.data().createdAt?.toDate()),
      }));
      setComments(data);
    });

    return () => unsub();
  }, [postSlug]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user || !text.trim()) return;

    setSending(true);
    setError(null);
    try {
      await addDoc(collection(db, "posts", postSlug, "comments"), {
        text:        text.trim(),
        authorName:  user.displayName ?? "Amigo/a",
        authorPhoto: user.photoURL    ?? null,
        authorId:    user.uid,
        createdAt:   serverTimestamp(),
      });
      setText("");
    } catch {
      setError("No se pudo enviar el comentario.");
    } finally {
      setSending(false);
    }
  }

  return (
    <section className="comments-widget" aria-label="Comentarios">
      <h3 className="comments-widget__title">
        ★ Comentarios {comments.length > 0 && `(${comments.length})`}
      </h3>

      {/* Lista de comentarios */}
      {comments.length > 0 && (
        <div className="comments-list" role="list">
          {comments.map((c) => (
            <article key={c.id} className="comment-item" role="listitem">
              {c.authorPhoto ? (
                <Image
                  src={c.authorPhoto}
                  alt={c.authorName}
                  width={36}
                  height={36}
                  className="comment-item__avatar"
                />
              ) : (
                <div className="comment-item__avatar-placeholder" aria-hidden>👤</div>
              )}
              <div className="comment-item__body">
                <div className="comment-item__header">
                  <span className="comment-item__author">{c.authorName}</span>
                  <span className="comment-item__date">{c.createdAt}</span>
                </div>
                <p className="comment-item__text">{c.text}</p>
              </div>
            </article>
          ))}
        </div>
      )}

      {/* Formulario o aviso de login */}
      {user ? (
        <form onSubmit={handleSubmit} className="comments-form">
          {error && <p className="auth-error" role="alert">{error}</p>}
          <textarea
            className="comments-form__textarea"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Escribe tu comentario…"
            maxLength={500}
            id={`comment-input-${postSlug}`}
            aria-label="Escribe un comentario"
          />
          <button
            type="submit"
            className="comments-form__submit"
            disabled={sending || !text.trim()}
            id={`comment-submit-${postSlug}`}
          >
            {sending ? "Enviando…" : "★ Comentar"}
          </button>
        </form>
      ) : (
        <p className="comments-login-prompt">
          Inicia sesión para dejar un comentario.
        </p>
      )}
    </section>
  );
}

function formatDate(date?: Date): string {
  if (!date) return "";
  return date.toLocaleDateString("es-MX", {
    year: "numeric", month: "short", day: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}
