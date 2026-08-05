"use client";

/**
 * PostModal — Popup de lectura completa de un post.
 *
 * Funcionalidad:
 * - Ocupa casi toda la pantalla con margen para que el fondo sea visible.
 * - El fondo queda oscurecido y con blur (backdrop-filter).
 * - Solo el contenido del modal es scrolleable; el scroll del body está bloqueado.
 * - Botón ✕ en la esquina superior derecha para cerrar.
 * - Tecla Escape también cierra.
 * - Clic en el overlay (fuera del modal) cierra.
 * - Barra de navegación (PaginationNavWidget) que navega entre TODOS los posts.
 */

import { useEffect }    from "react";
import Image            from "next/image";
import PaginationNavWidget from "@/components/widgets/PaginationNavWidget";
import MusicPlayerWidget   from "@/components/widgets/MusicPlayerWidget";
import CommentsWidget   from "@/components/widgets/CommentsWidget";
import { extractYouTubePlaylistId } from "@/lib/youtube";
import type { Post }    from "@/app/page";

interface PostModalProps {
  /** Array completo de posts (para navegar entre ellos) */
  posts:        Post[];
  /** Índice del post actualmente mostrado en el modal (0-indexed) */
  currentIndex: number;
  /** Cierra el modal */
  onClose:      () => void;
  /** Cambia el post mostrado */
  onNavigate:   (index: number) => void;
}

export default function PostModal({ posts, currentIndex, onClose, onNavigate }: PostModalProps) {
  const post = posts[currentIndex];

  /* Bloquear scroll del body mientras el modal está abierto */
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, []);

  /* Cerrar al presionar Escape */
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onClose]);

  if (!post) return null;

  return (
    /* Overlay oscuro con blur — clic fuera cierra */
    <div
      className="post-modal-overlay"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={`Leyendo: ${post.title}`}
    >
      {/* Contenedor del modal: clic aquí no propaga al overlay */}
      <div className="post-modal" onClick={(e) => e.stopPropagation()}>

        {/* Botón de cierre ✕ */}
        <button
          id="post-modal-close"
          className="post-modal__close"
          onClick={onClose}
          aria-label="Cerrar publicación"
          title="Cerrar (Esc)"
        >
          ✕
        </button>

        {/* Encabezado con meta y título */}
        <div className="post-modal__header">
          <div className="post-card__meta">
            {post.date && (
              <span className="post-card__meta-item">
                <span className="post-card__meta-icon">📅</span> {post.date}
              </span>
            )}
            {post.mood && (
              <span className="post-card__meta-item">
                <span className="post-card__meta-icon">💭</span> Mood: {post.mood}
              </span>
            )}
            {post.song && (
              <span className="post-card__meta-item" style={{ display: "inline-flex", alignItems: "center", gap: "0.3rem" }}>
                {post.songCover ? (
                  <Image
                    src={post.songCover}
                    alt={`Portada de ${post.song}`}
                    width={18}
                    height={18}
                    style={{ borderRadius: "3px", objectFit: "cover", width: "auto", height: "auto" }}
                  />
                ) : (
                  <span className="post-card__meta-icon">🎵</span>
                )}
                Escuchando: {post.song}
              </span>
            )}
          </div>
          <h2 className="post-modal__title">{post.title}</h2>
        </div>

        {/* Cuerpo scrolleable */}
        <div className="post-modal__body">
          <p className="welcome-text" style={{ color: "var(--color-text-secondary)", marginBottom: "1rem", whiteSpace: "pre-wrap" }}>
            {post.content || post.excerpt}
          </p>

          {(post.playlistId || post.playlist) && (
            <div style={{ marginTop: "1rem", marginBottom: "1rem" }}>
              <MusicPlayerWidget
                playlistId={post.playlistId || extractYouTubePlaylistId(post.playlist)}
                title={`🎵 Playlist: ${post.title}`}
              />
            </div>
          )}

          {post.cover && (
            <footer style={{ marginTop: "1rem", paddingTop: "0.8rem", borderTop: "1px dashed var(--color-border)" }}>
              <Image
                src={post.cover}
                alt={`Imagen de ${post.title}`}
                width={1200}
                height={630}
                style={{
                  width: "100%",
                  maxWidth: "100%",
                  height: "auto",
                  borderRadius: "var(--radius-sm)",
                  border: "1px solid var(--color-border)",
                  display: "block",
                }}
              />
            </footer>
          )}
          {/* Sección de comentarios del post */}
          <CommentsWidget postSlug={post.slug ?? post.title} />

        </div>

        {/* Navegación entre posts (reutiliza PaginationNavWidget con idPrefix distinto) */}
        <div className="post-modal__nav">
          <PaginationNavWidget
            currentPage={currentIndex + 1}
            totalPages={posts.length}
            onPageChange={(page) => onNavigate(page - 1)}
            idPrefix="post-modal-nav"
          />
        </div>

      </div>
    </div>
  );
}
