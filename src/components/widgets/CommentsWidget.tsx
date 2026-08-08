"use client";

/**
 * CommentsWidget.tsx — Sistema Avanzado de Comentarios y Respuestas (Estilo TikTok / Reddit / WhatsApp)
 *
 * Características:
 * - Carga manual y paginada (10 en 10 para principales, 3 en 3 para respuestas).
 * - Uso de count() en Firestore para totalizadores livianos.
 * - Formato de fecha: "Hoy a las HH:MM" o "DD/MM/AAAA".
 * - Likes con corazones y actualización optimista.
 * - Borrado estilo Reddit (preserva respuestas huérfanas) vs Cola de Eliminaciones (`pending_deletions`).
 * - Respuestas estilo TikTok (desplegar / ocultar hilos).
 * - Respuestas estilo WhatsApp (previsualización de comentario referenciado con scrollIntoView).
 * - Sorteo por prioridad de hash URL (`#comment-xyz`).
 */

import { useState, useEffect } from "react";
import Image from "next/image";
import { useAuth } from "@/lib/auth-context";
import {
  getTopLevelComments,
  getRepliesForComment,
  addComment,
  addReply,
  toggleCommentLike,
  deleteComment,
  formatCommentDate,
  getCommentCount,
  type TopLevelComment,
  type CommentReply,
  type ReplyToTarget,
} from "@/lib/comments";

interface CommentsWidgetProps {
  postSlug: string;
  fontFamily?: string;
}

export default function CommentsWidget({ postSlug, fontFamily }: CommentsWidgetProps) {
  const { user, isAdmin } = useAuth();

  const [totalCount, setTotalCount] = useState<number>(0);
  const [comments, setComments] = useState<TopLevelComment[]>([]);
  const [loading, setLoading] = useState(true);

  // Estados de formularios
  const [mainText, setMainText] = useState("");
  const [sendingMain, setSendingMain] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Estado para responder a un comentario o respuesta
  const [replyingTo, setReplyingTo] = useState<{
    parentCommentId: string;
    targetReply?: CommentReply;
    targetAuthorName: string;
  } | null>(null);
  const [replyText, setReplyText] = useState("");
  const [sendingReply, setSendingReply] = useState(false);

  // Paginación para comentarios principales (10 en 10)
  const [visibleCount, setVisibleCount] = useState(10);

  // ID del comentario destino desde el hash (#comment-xyz)
  const [targetCommentId] = useState<string | null>(() => {
    if (typeof window !== "undefined" && window.location.hash) {
      const hash = window.location.hash;
      if (hash.startsWith("#comment-")) {
        return hash.replace("#comment-", "");
      }
    }
    return null;
  });

  // Cargar datos iniciales de comentarios (asíncrono con desuscripción limpia)
  useEffect(() => {
    let isCancelled = false;

    async function fetchInitialComments() {
      try {
        const count = await getCommentCount(postSlug);
        const fetched = await getTopLevelComments(postSlug, targetCommentId || undefined);

        if (!isCancelled) {
          setTotalCount(count);
          setComments(fetched);
        }
      } catch (err) {
        if (!isCancelled) {
          console.error("Error al cargar comentarios:", err);
        }
      } finally {
        if (!isCancelled) {
          setLoading(false);
        }
      }
    }

    fetchInitialComments();

    return () => {
      isCancelled = true;
    };
  }, [postSlug, targetCommentId]);

  // Scrollear y resaltar el comentario destino si se accedió vía hash
  useEffect(() => {
    if (!targetCommentId || loading) return;

    const timer = setTimeout(() => {
      const el = document.getElementById(`comment-${targetCommentId}`);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "center" });
        el.classList.add("comment-item--highlighted");
        setTimeout(() => {
          el.classList.remove("comment-item--highlighted");
        }, 3000);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [targetCommentId, loading, comments]);

  // Desplegar / ocultar respuestas de un comentario principal (Estilo TikTok)
  async function handleToggleReplies(commentId: string) {
    const parentIndex = comments.findIndex((c) => c.id === commentId);
    if (parentIndex === -1) return;

    const parent = comments[parentIndex];
    if (parent.replies && parent.replies.length > 0) {
      // Colapsar respuestas
      const updated = [...comments];
      updated[parentIndex] = { ...parent, replies: [] };
      setComments(updated);
      return;
    }

    // Obtener respuestas de Firestore
    try {
      const replies = await getRepliesForComment(postSlug, commentId);
      const updated = [...comments];
      updated[parentIndex] = { ...parent, replies };
      setComments(updated);
    } catch (err) {
      console.error("Error al cargar respuestas:", err);
    }
  }

  // Cargar más respuestas
  async function handleLoadMoreReplies(commentId: string) {
    const parentIndex = comments.findIndex((c) => c.id === commentId);
    if (parentIndex === -1) return;

    const parent = comments[parentIndex];
    try {
      const allReplies = await getRepliesForComment(postSlug, commentId);
      const updated = [...comments];
      updated[parentIndex] = { ...parent, replies: allReplies };
      setComments(updated);
    } catch (err) {
      console.error("Error al cargar más respuestas:", err);
    }
  }

  // Enviar con Enter en teclados físicos de escritorio (Shift+Enter para salto de línea)
  function handleKeyDownSubmit(
    e: React.KeyboardEvent<HTMLTextAreaElement>,
    submitFn: (e: React.SyntheticEvent) => void
  ) {
    if (e.key === "Enter" && !e.shiftKey) {
      const isMobile =
        typeof window !== "undefined" &&
        (window.matchMedia("(pointer: coarse)").matches ||
          "ontouchstart" in window ||
          navigator.maxTouchPoints > 0);

      if (!isMobile) {
        e.preventDefault();
        submitFn(e);
      }
    }
  }

  // Enviar comentario principal
  async function handleSubmitMain(e: React.SyntheticEvent) {
    e.preventDefault();
    if (!user || !mainText.trim()) return;

    setSendingMain(true);
    setError(null);
    try {
      const newC = await addComment(postSlug, mainText, user);
      setComments((prev) => [newC, ...prev]);
      setTotalCount((prev) => prev + 1);
      setMainText("");
    } catch {
      setError("No se pudo enviar el comentario.");
    } finally {
      setSendingMain(false);
    }
  }

  // Enviar respuesta a comentario o respuesta
  async function handleSubmitReply(e: React.SyntheticEvent) {
    e.preventDefault();
    if (!user || !replyingTo || !replyText.trim()) return;

    setSendingReply(true);
    setError(null);

    const { parentCommentId, targetReply } = replyingTo;
    const replyToTarget: ReplyToTarget | null = targetReply
      ? {
          id: targetReply.id,
          authorName: targetReply.authorName,
          textSnippet: targetReply.text.slice(0, 40) + (targetReply.text.length > 40 ? "…" : ""),
        }
      : null;

    try {
      const newReply = await addReply(
        postSlug,
        parentCommentId,
        replyText,
        user,
        replyToTarget
      );

      // Actualizar estado local de forma optimista
      setComments((prev) =>
        prev.map((c) => {
          if (c.id === parentCommentId) {
            const existingReplies = c.replies || [];
            return {
              ...c,
              replyCount: Math.max(c.replyCount + 1, existingReplies.length + 1),
              replies: [...existingReplies, newReply],
            };
          }
          return c;
        })
      );

      setReplyText("");
      setReplyingTo(null);
    } catch (err: unknown) {
      console.warn("Aviso al enviar respuesta:", err);
      setError("No se pudo enviar la respuesta.");
    } finally {
      setSendingReply(false);
    }
  }

  // Alternar Me gusta (❤️)
  async function handleLike(
    commentId: string,
    isReply = false,
    parentCommentId?: string
  ) {
    if (!user) return;

    // Actualización optimista de la UI
    setComments((prev) =>
      prev.map((c) => {
        if (!isReply && c.id === commentId) {
          const hasLiked = c.likedBy.includes(user.uid);
          const newLikedBy = hasLiked
            ? c.likedBy.filter((id) => id !== user.uid)
            : [...c.likedBy, user.uid];
          return {
            ...c,
            likedBy: newLikedBy,
            likesCount: hasLiked ? Math.max(0, c.likesCount - 1) : c.likesCount + 1,
          };
        }
        if (isReply && c.id === parentCommentId && c.replies) {
          const updatedReplies = c.replies.map((r) => {
            if (r.id === commentId) {
              const hasLiked = r.likedBy.includes(user.uid);
              const newLikedBy = hasLiked
                ? r.likedBy.filter((id) => id !== user.uid)
                : [...r.likedBy, user.uid];
              return {
                ...r,
                likedBy: newLikedBy,
                likesCount: hasLiked ? Math.max(0, r.likesCount - 1) : r.likesCount + 1,
              };
            }
            return r;
          });
          return { ...c, replies: updatedReplies };
        }
        return c;
      })
    );

    try {
      await toggleCommentLike(postSlug, commentId, user.uid, isReply, parentCommentId);
    } catch (err) {
      console.warn("Error al guardar me gusta:", err);
    }
  }

  // Eliminar comentario
  async function handleDelete(
    commentId: string,
    isReply = false,
    parentCommentId?: string,
    currentReplyCount = 0
  ) {
    if (!user) return;
    if (!window.confirm("¿Seguro que deseas eliminar este comentario?")) return;

    try {
      const res = await deleteComment(
        postSlug,
        commentId,
        user.uid,
        isAdmin,
        isReply,
        parentCommentId,
        currentReplyCount
      );

      setComments((prev) =>
        prev
          .map((c) => {
            if (!isReply && c.id === commentId) {
              if (res.mode === "reddit") {
                return {
                  ...c,
                  isDeleted: true,
                  text: "[Comentario eliminado]",
                  authorName: "",
                  authorPhoto: null,
                  authorId: "",
                  likedBy: [],
                };
              }
              return null;
            }
            if (isReply && c.id === parentCommentId && c.replies) {
              const updatedReplies = c.replies.filter((r) => r.id !== commentId);
              return {
                ...c,
                replyCount: Math.max(0, c.replyCount - 1),
                replies: updatedReplies,
              };
            }
            return c;
          })
          .filter(Boolean) as TopLevelComment[]
      );

      if (!isReply && res.mode === "hard") {
        setTotalCount((prev) => Math.max(0, prev - 1));
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error al eliminar comentario.");
    }
  }

  // Scroll hacia la previsualización del comentario referenciado (Estilo WhatsApp)
  function handleScrollToSnippet(targetId: string) {
    const el = document.getElementById(`comment-${targetId}`);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
      el.classList.add("comment-item--highlighted");
      setTimeout(() => el.classList.remove("comment-item--highlighted"), 2500);
    }
  }

  const visibleComments = comments.slice(0, visibleCount);

  return (
    <section className="comments-widget" aria-label="Comentarios" style={fontFamily ? { fontFamily } : undefined}>
      <h3 className="comments-widget__title">
        ★ Comentarios {totalCount > 0 && `(${totalCount})`}
      </h3>

      {error && <p className="auth-error" role="alert">{error}</p>}

      {/* Formulario de comentario principal */}
      {user ? (
        <form onSubmit={handleSubmitMain} className="comments-form" style={{ marginBottom: "1.25rem" }}>
          <textarea
            className="comments-form__textarea"
            style={fontFamily ? { fontFamily } : undefined}
            value={mainText}
            onChange={(e) => setMainText(e.target.value)}
            onKeyDown={(e) => handleKeyDownSubmit(e, handleSubmitMain)}
            placeholder="Escribe tu comentario…"
            maxLength={500}
            id={`comment-input-${postSlug}`}
            aria-label="Escribe un comentario"
          />
          <button
            type="submit"
            className="comments-form__submit"
            disabled={sendingMain || !mainText.trim()}
            id={`comment-submit-${postSlug}`}
          >
            {sendingMain ? "Enviando…" : "★ Comentar"}
          </button>
        </form>
      ) : (
        <p className="comments-login-prompt" style={{ marginBottom: "1.25rem" }}>
          Inicia sesión para dejar un comentario.
        </p>
      )}

      {/* Lista de comentarios */}
      {loading ? (
        <p style={{ color: "var(--color-text-muted)", fontSize: "0.8rem", textAlign: "center", padding: "1rem" }}>
          ⌛ Cargando comentarios…
        </p>
      ) : visibleComments.length === 0 ? (
        <p style={{ color: "var(--color-text-muted)", fontSize: "0.8rem", textAlign: "center", padding: "1rem" }}>
          Aún no hay comentarios. ¡Sé el primero en opinar!
        </p>
      ) : (
        <div className="comments-list" role="list">
          {visibleComments.map((c) => {
            const isAuthor = user && c.authorId === user.uid;
            const canDelete = (isAuthor || isAdmin) && !c.isDeleted;
            const hasLiked = user ? c.likedBy.includes(user.uid) : false;

            return (
              <div key={c.id} className="comment-block">
                <article
                  id={`comment-${c.id}`}
                  className={`comment-item ${c.isDeleted ? "comment-item--deleted" : ""}`}
                  role="listitem"
                >
                  {!c.isDeleted && c.authorPhoto ? (
                    <Image
                      src={c.authorPhoto}
                      alt={c.authorName}
                      width={36}
                      height={36}
                      unoptimized
                      className="comment-item__avatar"
                      style={{ width: "36px", height: "36px" }}
                    />
                  ) : (
                    <div className="comment-item__avatar-placeholder" aria-hidden>
                      {c.isDeleted ? "👻" : "👤"}
                    </div>
                  )}

                  <div className="comment-item__body">
                    <div className="comment-item__header">
                      <span className="comment-item__author">
                        {c.isDeleted ? "Anónimo" : c.authorName}
                      </span>
                      <span className="comment-item__date">
                        {formatCommentDate(c.createdAt)}
                      </span>
                    </div>

                    <p className="comment-item__text" style={fontFamily ? { fontFamily } : undefined}>
                      {c.text}
                    </p>

                    {/* Acciones del comentario */}
                    {!c.isDeleted && (
                      <div className="comment-item__actions">
                        <button
                          type="button"
                          className={`comment-action-btn ${hasLiked ? "comment-action-btn--liked" : ""}`}
                          onClick={() => handleLike(c.id, false)}
                          disabled={!user}
                          title={user ? "Me gusta" : "Inicia sesión para dar me gusta"}
                        >
                          {hasLiked ? "❤️" : "🤍"} {c.likesCount > 0 && c.likesCount}
                        </button>

                        {user && (
                          <button
                            type="button"
                            className="comment-action-btn"
                            onClick={() =>
                              setReplyingTo({
                                parentCommentId: c.id,
                                targetAuthorName: c.authorName,
                              })
                            }
                          >
                            💬 Responder
                          </button>
                        )}

                        {canDelete && (
                          <button
                            type="button"
                            className="comment-action-btn comment-action-btn--delete"
                            onClick={() => handleDelete(c.id, false, undefined, c.replyCount)}
                          >
                            🗑️ Borrar
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </article>

                {/* Formulario de respuesta desplegable */}
                {replyingTo && replyingTo.parentCommentId === c.id && (
                  <form onSubmit={handleSubmitReply} className="reply-form">
                    <div className="reply-form__header">
                      <span>Respondiendo a <strong>@{replyingTo.targetAuthorName}</strong></span>
                      <button
                        type="button"
                        className="reply-form__cancel"
                        onClick={() => setReplyingTo(null)}
                      >
                        ✕ Cancelar
                      </button>
                    </div>
                    <textarea
                      className="comments-form__textarea"
                      style={fontFamily ? { fontFamily } : undefined}
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      onKeyDown={(e) => handleKeyDownSubmit(e, handleSubmitReply)}
                      placeholder="Escribe tu respuesta..."
                      maxLength={300}
                      rows={2}
                      autoFocus
                    />
                    <button
                      type="submit"
                      className="comments-form__submit"
                      disabled={sendingReply || !replyText.trim()}
                    >
                      {sendingReply ? "Enviando…" : "★ Responder"}
                    </button>
                  </form>
                )}

                {/* Contenedor de respuestas (Estilo TikTok) */}
                {c.replyCount > 0 && (
                  <div className="comment-replies-container">
                    {(!c.replies || c.replies.length === 0) ? (
                      <button
                        type="button"
                        className="comment-replies-toggle-btn"
                        onClick={() => handleToggleReplies(c.id)}
                      >
                        ─── Ver {c.replyCount} {c.replyCount === 1 ? "respuesta" : "respuestas"} ▾
                      </button>
                    ) : (
                      <div className="comment-replies-list">
                        {c.replies.map((r) => {
                          const isReplyAuthor = user && r.authorId === user.uid;
                          const canDeleteReply = isReplyAuthor || isAdmin;
                          const hasLikedReply = user ? r.likedBy.includes(user.uid) : false;

                          return (
                            <article
                              key={r.id}
                              id={`comment-${r.id}`}
                              className="comment-item comment-item--reply"
                            >
                              {r.authorPhoto ? (
                                <Image
                                  src={r.authorPhoto}
                                  alt={r.authorName}
                                  width={28}
                                  height={28}
                                  unoptimized
                                  className="comment-item__avatar comment-item__avatar--sm"
                                  style={{ width: "28px", height: "28px" }}
                                />
                              ) : (
                                <div className="comment-item__avatar-placeholder comment-item__avatar-placeholder--sm" aria-hidden>👤</div>
                              )}

                              <div className="comment-item__body">
                                <div className="comment-item__header">
                                  <span className="comment-item__author">{r.authorName}</span>
                                  <span className="comment-item__date">{formatCommentDate(r.createdAt)}</span>
                                </div>

                                {/* Previsualización estilo WhatsApp para respuestas a respuestas */}
                                {r.replyTo && (
                                  <div
                                    className="reply-preview-box"
                                    onClick={() => handleScrollToSnippet(r.replyTo!.id)}
                                    title="Haz clic para ir a la respuesta original"
                                  >
                                    <span className="reply-preview-author">@{r.replyTo.authorName}:</span>{" "}
                                    <span className="reply-preview-text">&ldquo;{r.replyTo.textSnippet}&rdquo;</span>
                                  </div>
                                )}

                                <p className="comment-item__text" style={fontFamily ? { fontFamily } : undefined}>
                                  {r.text}
                                </p>

                                <div className="comment-item__actions">
                                  <button
                                    type="button"
                                    className={`comment-action-btn ${hasLikedReply ? "comment-action-btn--liked" : ""}`}
                                    onClick={() => handleLike(r.id, true, c.id)}
                                    disabled={!user}
                                  >
                                    {hasLikedReply ? "❤️" : "🤍"} {r.likesCount > 0 && r.likesCount}
                                  </button>

                                  {user && (
                                    <button
                                      type="button"
                                      className="comment-action-btn"
                                      onClick={() =>
                                        setReplyingTo({
                                          parentCommentId: c.id,
                                          targetReply: r,
                                          targetAuthorName: r.authorName,
                                        })
                                      }
                                    >
                                      💬 Responder
                                    </button>
                                  )}

                                  {canDeleteReply && (
                                    <button
                                      type="button"
                                      className="comment-action-btn comment-action-btn--delete"
                                      onClick={() => handleDelete(r.id, true, c.id)}
                                    >
                                      🗑️ Borrar
                                    </button>
                                  )}
                                </div>
                              </div>
                            </article>
                          );
                        })}

                        <div style={{ display: "flex", gap: "1rem", marginTop: "0.5rem" }}>
                          {c.replies.length < c.replyCount && (
                            <button
                              type="button"
                              className="comment-replies-toggle-btn"
                              onClick={() => handleLoadMoreReplies(c.id)}
                            >
                              ─── Ver más respuestas ▾
                            </button>
                          )}
                          <button
                            type="button"
                            className="comment-replies-toggle-btn"
                            onClick={() => handleToggleReplies(c.id)}
                          >
                            ▲ Ocultar respuestas
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}

          {/* Botón para cargar más comentarios principales */}
          {visibleCount < comments.length && (
            <button
              type="button"
              className="comments-load-more-btn"
              onClick={() => setVisibleCount((prev) => prev + 10)}
            >
              ★ Cargar más comentarios ({comments.length - visibleCount} restantes)
            </button>
          )}
        </div>
      )}
    </section>
  );
}
