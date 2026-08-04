/**
 * PostListSection — Lista de entradas del blog.
 *
 * Por ahora muestra un placeholder; en fases futuras recibirá los posts
 * como prop (array de objetos generados desde /content/posts/ con gray-matter).
 *
 * Plantilla de tarjeta (usar cuando haya posts reales):
 *
 *   <article className="post-card">
 *     <div className="post-card__header">
 *       <div className="post-card__meta">
 *         <span className="post-card__meta-item"><span className="post-card__meta-icon">📅</span> 15 de julio, 2026</span>
 *         <span className="post-card__meta-item"><span className="post-card__meta-icon">💭</span> Mood: curiosa y emocionada</span>
 *         <span className="post-card__meta-item"><span className="post-card__meta-icon">🎵</span> Escuchando: MCR — Welcome to the Black Parade</span>
 *       </div>
 *       <h2 className="post-card__title">
 *         <a href="/posts/mi-post">¡Título de tu publicación aquí! 🌸</a>
 *       </h2>
 *     </div>
 *     <div className="post-card__body">
 *       <p className="post-card__excerpt">Aquí va el resumen o extracto de tu artículo...</p>
 *       <a href="/posts/mi-post" className="post-card__read-more">Leer más →</a>
 *     </div>
 *   </article>
 */
export default function PostListSection() {
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
