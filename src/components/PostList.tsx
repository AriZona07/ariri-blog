"use client";

/**
 * PostList — Lista de entradas del blog con paginación en el cliente.
 *
 * Cada tarjeta muestra el contenido clampado a un alto máximo con un fade
 * al pie. El botón "Leer más" o clic en el título navega a la página /posts/[slug].
 */

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { collection, query, orderBy, onSnapshot, type DocumentData } from "firebase/firestore";
import { db } from "@/lib/firebase";
import PaginationNavWidget from "@/components/widgets/PaginationNavWidget";
import MusicPlayerWidget   from "@/components/widgets/MusicPlayerWidget";
import { extractYouTubePlaylistId } from "@/lib/youtube";
import { renderMarkdown }           from "@/lib/markdown";
import type { Post } from "@/app/page";

/** Posts visibles por página */
const POSTS_PER_PAGE = 3;

export default function PostList() {
  const [allPosts, setAllPosts]       = useState<Post[]>([]);
  const [currentPage, setCurrentPage] = useState(1);

  /* Suscripción en tiempo real a la colección `posts` de Firestore */
  useEffect(() => {
    const q = query(collection(db, "posts"), orderBy("date", "desc"));
    const unsub = onSnapshot(
      q,
      (snap) => {
        const nowMs = Date.now();
        const fsPosts: Post[] = snap.docs
          .filter((doc: DocumentData) => {
            const d = doc.data();
            const status = d.status ?? "published";
            if (status === "draft") return false;

            if (status === "scheduled") {
              const scheduledTime = d.scheduledAt && typeof d.scheduledAt.toDate === "function"
                ? d.scheduledAt.toDate().getTime()
                : null;
              if (scheduledTime && scheduledTime > nowMs) {
                return false;
              }
            }
            return true;
          })
          .map((doc: DocumentData) => {
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
      },
      (err) => {
        console.error("Error al obtener publicaciones de Firestore:", err);
      }
    );

    return () => unsub();
  }, []);

  if (allPosts.length === 0) {
    return (
      <section aria-label="Entradas del blog">
        <div className="retro-box" style={{ textAlign: "center", padding: "1.5rem 1rem" }}>
          <p style={{ color: "var(--color-text-secondary)", fontSize: "var(--fs-sm)" }}>
            📝 <em>Aún no hay publicaciones publicadas. ¡Pronto nuevos artículos!</em>
          </p>
        </div>
      </section>
    );
  }

  const totalPages = Math.ceil(allPosts.length / POSTS_PER_PAGE);
  const start      = (currentPage - 1) * POSTS_PER_PAGE;
  const pagePosts  = allPosts.slice(start, start + POSTS_PER_PAGE);

  return (
    <>
      {/* Widget de paginación superior */}
      <PaginationNavWidget
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
        idPrefix="list-top"
      />

      <section
        aria-label="Entradas del blog"
        style={{ display: "flex", flexDirection: "column", gap: "var(--gap-lg)" }}
      >
        {pagePosts.map((post) => {
          const postUrl = `/posts/${encodeURIComponent(post.slug)}`;

          return (
            <article key={post.slug} className="post-card">
              <div className="post-card__header">
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
                <h2 className="post-card__title">
                  {/* El título navega a la página del post */}
                  <Link href={postUrl}>
                    {post.title}
                  </Link>
                </h2>
              </div>
              <div className="post-card__body">
                {/* Contenido clampado con fade al pie */}
                <div className="post-card__content-clamp">
                  <div className="welcome-text" style={{ color: "var(--color-text-secondary)" }}>
                    {renderMarkdown(post.content || post.excerpt)}
                  </div>

                  {(post.playlistId || post.playlist) && (
                    <div style={{ marginTop: "1rem" }}>
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
                </div>

                {/* "Leer más" navega a la página del post */}
                <div style={{ marginTop: "1.1rem" }}>
                  <Link
                    href={postUrl}
                    className="post-card__read-more"
                    aria-label={`Leer publicación completa: ${post.title}`}
                  >
                    Leer más →
                  </Link>
                </div>
              </div>
            </article>
          );
        })}
      </section>

      {/* Widget de paginación inferior */}
      <PaginationNavWidget
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
        idPrefix="list-bottom"
      />
    </>
  );
}
