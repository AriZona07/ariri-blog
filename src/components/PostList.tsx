"use client";

/**
 * PostList — Lista de entradas del blog con paginación en el cliente.
 *
 * Recibe los posts desde page.tsx y gestiona internamente qué página está visible
 * (3 posts por página). Renderiza las tarjetas .post-card y la navegación mediante
 * PaginationNavWidget.
 */

import { useState } from "react";
import PaginationNavWidget from "@/components/widgets/PaginationNavWidget";
import type { Post } from "@/app/page";

interface PostListProps {
  posts?: Post[];
}

/** Posts visibles por página */
const POSTS_PER_PAGE = 3;

export default function PostList({ posts = [] }: PostListProps) {
  const [currentPage, setCurrentPage] = useState(1);

  if (posts.length === 0) {
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

  const totalPages = Math.ceil(posts.length / POSTS_PER_PAGE);

  /* Slice de posts para la página actual */
  const start     = (currentPage - 1) * POSTS_PER_PAGE;
  const pagePosts = posts.slice(start, start + POSTS_PER_PAGE);

  return (
    <>
      {/* Widget de paginación superior */}
      <PaginationNavWidget
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
      />

      <section
        aria-label="Entradas del blog"
        style={{ display: "flex", flexDirection: "column", gap: "var(--gap-lg)" }}
      >
        {pagePosts.map((post) => (
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
                  <span className="post-card__meta-item">
                    <span className="post-card__meta-icon">🎵</span> Escuchando: {post.song}
                  </span>
                )}
              </div>
              <h2 className="post-card__title">
                <a href={`/posts/${post.slug}`}>{post.title}</a>
              </h2>
            </div>
            <div className="post-card__body">
              <p className="post-card__excerpt">{post.excerpt}</p>
              <a href={`/posts/${post.slug}`} className="post-card__read-more">Leer más →</a>
            </div>
          </article>
        ))}
      </section>

      {/* Widget de paginación inferior */}
      <PaginationNavWidget
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
      />
    </>
  );
}
