"use client";

/**
 * [slug]/page.tsx — Página dedicada de lectura de publicación en /posts/[slug]
 *
 * Reemplaza el modal (PostModal) ofreciendo una lectura completa por permalink.
 * Permite cambiar entre Modo Tradicional y Modo Documento (PDF/Docs),
 * ofrece navegación entre publicaciones (Anterior / Siguiente) y comentarios.
 */

import { useState, useEffect, use } from "react";
import Link from "next/link";
import Image from "next/image";
import { collection, query, orderBy, onSnapshot, type DocumentData } from "firebase/firestore";
import { db } from "@/lib/firebase";
import MusicPlayerWidget   from "@/components/widgets/MusicPlayerWidget";
import CommentsWidget      from "@/components/widgets/CommentsWidget";
import { extractYouTubePlaylistId } from "@/lib/youtube";
import { renderMarkdown }           from "@/lib/markdown";
import type { Post } from "@/app/page";

interface PostPageProps {
  params: Promise<{ slug: string }>;
}

export default function SinglePostPage({ params }: PostPageProps) {
  const resolvedParams = use(params);
  const rawSlug = resolvedParams?.slug;
  const currentSlug = rawSlug ? decodeURIComponent(rawSlug) : "";

  const [allPosts, setAllPosts] = useState<Post[]>([]);
  const [loading, setLoading]   = useState(true);
  const [readingMode, setReadingMode] = useState<"traditional" | "document">("traditional");

  /* Suscripción a Firestore para obtener los posts y permitir navegación entre ellos */
  useEffect(() => {
    const q = query(collection(db, "posts"), orderBy("date", "desc"));
    const unsub = onSnapshot(
      q,
      (snap) => {
        const fsPosts: Post[] = snap.docs.map((doc: DocumentData) => {
          const d = doc.data();
          const playlistRaw = d.playlist ? String(d.playlist) : undefined;
          const playlistId  = d.playlistId ?? (playlistRaw ? extractYouTubePlaylistId(playlistRaw) : undefined);

          return {
            slug:       String(d.slug       ?? doc.id),
            title:      String(d.title      ?? "(Sin título)"),
            date:       String(d.date       ?? ""),
            mood:       String(d.mood       ?? ""),
            song:       String(d.song       ?? ""),
            songCover:  d.songCover ? String(d.songCover) : undefined,
            playlist:   playlistRaw,
            playlistId: playlistId,
            cover:      d.cover ? String(d.cover) : undefined,
            excerpt:    d.content ? String(d.content).slice(0, 160) + "…" : "",
            content:    String(d.content    ?? ""),
          };
        });

        setAllPosts(fsPosts);
        setLoading(false);
      },
      (err) => {
        console.error("Error al cargar publicación:", err);
        setLoading(false);
      }
    );

    return () => unsub();
  }, []);

  if (loading) {
    return (
      <div className="retro-box" style={{ textAlign: "center", padding: "2rem" }}>
        <p style={{ color: "var(--color-text-secondary)", fontSize: "var(--fs-sm)" }}>
          ⌛ <em>Cargando artículo…</em>
        </p>
      </div>
    );
  }

  const currentIndex = allPosts.findIndex((p) => p.slug === currentSlug);
  const post = currentIndex !== -1 ? allPosts[currentIndex] : null;

  if (!post) {
    return (
      <div className="retro-box" style={{ textAlign: "center", padding: "2rem" }}>
        <h2 style={{ color: "var(--color-accent-pink)", marginBottom: "1rem" }}>404 — Entrada no encontrada</h2>
        <p style={{ color: "var(--color-text-secondary)", marginBottom: "1.5rem" }}>
          La publicación que buscas no existe o ha sido movida.
        </p>
        <Link href="/" className="post-card__read-more" style={{ display: "inline-block" }}>
          ← Volver al Inicio
        </Link>
      </div>
    );
  }

  /* Post anterior y posterior en el feed */
  const prevPost = currentIndex > 0 ? allPosts[currentIndex - 1] : null;
  const nextPost = currentIndex < allPosts.length - 1 ? allPosts[currentIndex + 1] : null;

  return (
    <article className={`post-detail-page ${readingMode === "document" ? "post-detail-page--doc-mode" : ""}`}>

      {/* Barra de navegación superior: Volver + Modos de lectura */}
      <nav className="post-detail__top-bar" aria-label="Opciones de lectura">
        <Link href="/" className="post-detail__back-link">
          ← Volver al feed
        </Link>

        <div className="post-detail__mode-selector" role="group" aria-label="Modo de lectura">
          <button
            type="button"
            className={`post-detail__mode-btn ${readingMode === "traditional" ? "post-detail__mode-btn--active" : ""}`}
            onClick={() => setReadingMode("traditional")}
            title="Vista tradicional del blog"
          >
            📑 Tradicional
          </button>
          <button
            type="button"
            className={`post-detail__mode-btn ${readingMode === "document" ? "post-detail__mode-btn--active" : ""}`}
            onClick={() => setReadingMode("document")}
            title="Vista tipo documento / hoja de lectura"
          >
            📄 Modo Documento
          </button>
        </div>
      </nav>

      {/* Contenido principal de la publicación */}
      <div className="post-detail__card retro-box">
        <header className="post-detail__header">
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
          <h1 className="post-detail__title">{post.title}</h1>
        </header>

        {/* NAVEGACIÓN COMPACTA ENTRE ARTÍCULOS */}
        <div className="post-detail__post-nav">
          {prevPost ? (
            <Link href={`/posts/${encodeURIComponent(prevPost.slug)}`} className="post-detail__nav-btn">
              « Post Posterior ({prevPost.title})
            </Link>
          ) : (
            <span className="post-detail__nav-btn post-detail__nav-btn--disabled">« Publicación más reciente</span>
          )}

          <span className="post-detail__nav-info">
            {currentIndex + 1} / {allPosts.length}
          </span>

          {nextPost ? (
            <Link href={`/posts/${encodeURIComponent(nextPost.slug)}`} className="post-detail__nav-btn">
              Post Anterior ({nextPost.title}) »
            </Link>
          ) : (
            <span className="post-detail__nav-btn post-detail__nav-btn--disabled">Publicación más antigua »</span>
          )}
        </div>

        <div className="post-detail__body">
          <div className="welcome-text" style={{ color: "var(--color-text-secondary)", marginBottom: "1.2rem" }}>
            {renderMarkdown(post.content || post.excerpt)}
          </div>

          {(post.playlistId || post.playlist) && (
            <div style={{ marginTop: "1.5rem", marginBottom: "1.5rem" }}>
              <MusicPlayerWidget
                playlistId={post.playlistId || extractYouTubePlaylistId(post.playlist)}
                title={`🎵 Playlist: ${post.title}`}
              />
            </div>
          )}

          {post.cover && (
            <div style={{ marginTop: "1.5rem", paddingTop: "1rem", borderTop: "1px dashed var(--color-border)" }}>
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
            </div>
          )}
        </div>

        {/* NAVEGACIÓN INFERIOR DE PUBLICACIÓN */}
        <div className="post-detail__post-nav" style={{ borderTop: "1px dashed var(--color-border)", borderBottom: "none" }}>
          {prevPost ? (
            <Link href={`/posts/${encodeURIComponent(prevPost.slug)}`} className="post-detail__nav-btn">
              « Post Posterior
            </Link>
          ) : (
            <span className="post-detail__nav-btn post-detail__nav-btn--disabled">« Más reciente</span>
          )}

          <span className="post-detail__nav-info">
            {currentIndex + 1} de {allPosts.length}
          </span>

          {nextPost ? (
            <Link href={`/posts/${encodeURIComponent(nextPost.slug)}`} className="post-detail__nav-btn">
              Post Anterior »
            </Link>
          ) : (
            <span className="post-detail__nav-btn post-detail__nav-btn--disabled">Más antigua »</span>
          )}
        </div>

        {/* Sección de comentarios al pie de la entrada */}
        <section style={{ marginTop: "2rem", paddingTop: "1.5rem", borderTop: "2px solid var(--color-accent-pink)" }}>
          <CommentsWidget postSlug={post.slug} />
        </section>
      </div>

    </article>
  );
}
