"use client";

/**
 * /admin/new-post/page.tsx — Formulario de creación de nueva entrada
 *
 * Guarda el post en la colección `posts` de Cloud Firestore.
 * Campos: título, slug (manual), contenido Markdown, mood, song, songCover, cover, fecha.
 *
 * Seguridad: Firestore Rules bloquea la escritura si el token no tiene claim `admin: true`.
 */

import { useState }            from "react";
import { useRouter }           from "next/navigation";
import Link                    from "next/link";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db }      from "@/lib/firebase";
import { useAuth } from "@/lib/auth-context";

export default function NewPostPage() {
  const { user, isAdmin, loading } = useAuth();
  const router = useRouter();

  // Campos del formulario
  const [title,     setTitle]     = useState("");
  const [slug,      setSlug]      = useState("");
  const [content,   setContent]   = useState("");
  const [mood,      setMood]      = useState("");
  const [song,      setSong]      = useState("");
  const [songCover, setSongCover] = useState("");
  const [cover,     setCover]     = useState("");
  const [date,      setDate]      = useState(new Date().toISOString().split("T")[0]);

  const [saving,  setSaving]  = useState(false);
  const [success, setSuccess] = useState(false);
  const [error,   setError]   = useState<string | null>(null);

  /* Acceso denegado si no es admin */
  if (!loading && (!user || !isAdmin)) {
    router.replace("/");
    return null;
  }

  /* Auto-generar slug al escribir el título (como sugerencia editable) */
  function handleTitleChange(val: string) {
    setTitle(val);
    // Solo auto-sugiere si el usuario no ha tocado el slug manualmente
    if (!slug || slug === slugify(title)) {
      setSlug(slugify(val));
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!slug.trim() || !title.trim() || !content.trim()) {
      setError("Título, slug y contenido son obligatorios.");
      return;
    }

    setSaving(true);
    setError(null);
    try {
      await addDoc(collection(db, "posts"), {
        title:      title.trim(),
        slug:       slug.trim(),
        content:    content.trim(),
        mood:       mood.trim()      || null,
        song:       song.trim()      || null,
        songCover:  songCover.trim() || null,
        cover:      cover.trim()     || null,
        date,
        source:     "firestore",        // Distingue los posts de Firestore vs. Markdown
        authorUid:  user!.uid,
        createdAt:  serverTimestamp(),
      });
      setSuccess(true);
    } catch {
      setError("Error al publicar. Verifica tu conexión y permisos.");
    } finally {
      setSaving(false);
    }
  }

  if (success) {
    return (
      <div className="retro-box">
        <div className="retro-box__header">⚙ Nueva Entrada</div>
        <div className="retro-box__body" style={{ padding: "1.5rem" }}>
          <p className="new-post-success">
            ✅ Entrada publicada correctamente en Firestore.
          </p>
          <div style={{ display: "flex", gap: "0.75rem", marginTop: "1rem" }}>
            <Link href="/admin" className="admin-btn-new">← Volver al Panel</Link>
            <button
              className="admin-btn-new"
              style={{ background: "#221b2e", color: "#00ff66", border: "2px solid #00ff66" }}
              onClick={() => { setSuccess(false); setTitle(""); setSlug(""); setContent(""); }}
            >
              + Otra Entrada
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="retro-box">
      <div className="retro-box__header">⚙ Nueva Entrada de Blog</div>
      <div className="retro-box__body">
        <div className="admin-page" style={{ maxWidth: "100%" }}>

          <Link href="/admin" style={{ fontSize: "0.75rem", color: "var(--color-text-muted)", marginBottom: "1rem", display: "inline-block" }}>
            ← Volver al Panel
          </Link>

          {error && <p className="auth-error" role="alert">{error}</p>}

          <form onSubmit={handleSubmit} className="new-post-form">

            <div className="new-post-form__field">
              <label htmlFor="np-title" className="new-post-form__label">Título *</label>
              <input
                id="np-title"
                type="text"
                className="new-post-form__input"
                value={title}
                onChange={(e) => handleTitleChange(e.target.value)}
                placeholder="Mi nueva entrada del blog"
                required
              />
            </div>

            <div className="new-post-form__field">
              <label htmlFor="np-slug" className="new-post-form__label">
                Slug * <small style={{ color: "var(--color-text-muted)" }}>(URL amigable, editable)</small>
              </label>
              <input
                id="np-slug"
                type="text"
                className="new-post-form__input"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                placeholder="mi-nueva-entrada"
                required
              />
            </div>

            <div className="new-post-form__field">
              <label htmlFor="np-content" className="new-post-form__label">Contenido (Markdown) *</label>
              <textarea
                id="np-content"
                className="new-post-form__textarea"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Escribe el contenido en Markdown…"
                required
              />
            </div>

            {/* Metadatos opcionales */}
            <div className="new-post-form__meta-row">
              <div className="new-post-form__field">
                <label htmlFor="np-mood" className="new-post-form__label">Mood</label>
                <input id="np-mood" type="text" className="new-post-form__input"
                  value={mood} onChange={(e) => setMood(e.target.value)}
                  placeholder="feliz, nostálgico…" />
              </div>
              <div className="new-post-form__field">
                <label htmlFor="np-date" className="new-post-form__label">Fecha</label>
                <input id="np-date" type="date" className="new-post-form__input"
                  value={date} onChange={(e) => setDate(e.target.value)} />
              </div>
            </div>

            <div className="new-post-form__meta-row">
              <div className="new-post-form__field">
                <label htmlFor="np-song" className="new-post-form__label">Canción</label>
                <input id="np-song" type="text" className="new-post-form__input"
                  value={song} onChange={(e) => setSong(e.target.value)}
                  placeholder="Artista — Título" />
              </div>
              <div className="new-post-form__field">
                <label htmlFor="np-song-cover" className="new-post-form__label">URL Portada Canción</label>
                <input id="np-song-cover" type="url" className="new-post-form__input"
                  value={songCover} onChange={(e) => setSongCover(e.target.value)}
                  placeholder="https://…" />
              </div>
            </div>

            <div className="new-post-form__field">
              <label htmlFor="np-cover" className="new-post-form__label">URL Imagen de Portada del Post</label>
              <input id="np-cover" type="url" className="new-post-form__input"
                value={cover} onChange={(e) => setCover(e.target.value)}
                placeholder="https://…" />
            </div>

            <button
              type="submit"
              className="new-post-form__submit"
              disabled={saving}
              id="np-submit-btn"
            >
              {saving ? "Publicando…" : "★ Publicar Entrada ★"}
            </button>

          </form>
        </div>
      </div>
    </div>
  );
}

/* Convierte un título a slug URL-amigable */
function slugify(str: string): string {
  return str
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")  // Elimina acentos
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}
