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
import { ref, uploadBytes, getDownloadURL }    from "firebase/storage";
import { db, storage }      from "@/lib/firebase";
import { useAuth }          from "@/lib/auth-context";
import { extractYouTubePlaylistId, processSongCoverUrl } from "@/lib/youtube";

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
  const [playlist,  setPlaylist]  = useState("");
  const [date,      setDate]      = useState(new Date().toISOString().split("T")[0]);

  // Selección de Portada del Post (Exclusiva: Enlace URL vs. Archivo desde la computadora)
  const [coverMode, setCoverMode] = useState<"url" | "file">("url");
  const [coverUrl,  setCoverUrl]  = useState("");
  const [coverFile, setCoverFile] = useState<File | null>(null);

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
      const playlistTrimmed = playlist.trim();
      const playlistIdExtracted = playlistTrimmed ? extractYouTubePlaylistId(playlistTrimmed) : null;
      
      // Procesa la portada de canción: si pusieron un link de YouTube, extrae la miniatura hqdefault
      const finalSongCover = processSongCoverUrl(songCover);

      // Procesa la portada del post (subida a Firebase Storage si es archivo o URL estática)
      let finalCover: string | null = null;
      if (coverMode === "file" && coverFile) {
        const storageRef = ref(storage, `post-covers/${Date.now()}_${coverFile.name}`);
        const snapshot   = await uploadBytes(storageRef, coverFile);
        finalCover       = await getDownloadURL(snapshot.ref);
      } else if (coverMode === "url" && coverUrl.trim()) {
        finalCover       = coverUrl.trim();
      }

      await addDoc(collection(db, "posts"), {
        title:      title.trim(),
        slug:       slug.trim(),
        content:    content.trim(),
        mood:       mood.trim()       || null,
        song:       song.trim()       || null,
        songCover:  finalSongCover,
        playlist:   playlistTrimmed   || null,
        playlistId: playlistIdExtracted,
        cover:      finalCover,
        date,
        source:     "firestore",        // Distingue los posts de Firestore vs. Markdown
        authorUid:  user!.uid,
        createdAt:  serverTimestamp(),
      });

      // Crear registro de notificación para avisar a los suscriptores del blog
      await addDoc(collection(db, "notifications"), {
        title:     "¡Nueva entrada de blog!",
        message:   title.trim(),
        postSlug:  slug.trim(),
        createdAt: serverTimestamp(),
        type:      "new_post",
      });

      setSuccess(true);
    } catch (err: unknown) {
      console.error("Error al publicar entrada:", err);
      const errMsg = err instanceof Error ? err.message : String(err);
      if (errMsg.includes("CORS") || errMsg.toLowerCase().includes("failed to fetch") || errMsg.toLowerCase().includes("network")) {
        setError("🚫 Error de CORS al subir la imagen a Firebase Storage. Aplica la configuración cors.json en tu proyecto de Firebase/Google Cloud, o utiliza la opción 'Enlace URL Externo'.");
      } else {
        setError(`Error al publicar: ${errMsg || "Verifica tu conexión y permisos de admin."}`);
      }
    } finally {
      setSaving(false);
    }
  }

  function resetForm() {
    setSuccess(false);
    setTitle("");
    setSlug("");
    setContent("");
    setPlaylist("");
    setSong("");
    setSongCover("");
    setCoverUrl("");
    setCoverFile(null);
    setCoverMode("url");
    setMood("");
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
              onClick={resetForm}
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
                <label htmlFor="np-song-cover" className="new-post-form__label">
                  Portada Canción <small style={{ color: "var(--color-text-muted)" }}>(URL de imagen o link de YouTube)</small>
                </label>
                <input id="np-song-cover" type="text" className="new-post-form__input"
                  value={songCover} onChange={(e) => setSongCover(e.target.value)}
                  placeholder="https://... o https://youtube.com/watch?v=..." />
              </div>
            </div>

            <div className="new-post-form__field">
              <label htmlFor="np-playlist" className="new-post-form__label">
                Playlist de YouTube <small style={{ color: "var(--color-text-muted)" }}>(URL o ID opcional para reproductor)</small>
              </label>
              <input id="np-playlist" type="text" className="new-post-form__input"
                value={playlist} onChange={(e) => setPlaylist(e.target.value)}
                placeholder="https://youtube.com/playlist?list=PLb_cyNEBFTVA…" />
            </div>

            {/* Imagen de portada del post con selector exclusivo */}
            <div className="new-post-form__field" style={{ padding: "0.85rem", background: "rgba(255, 255, 255, 0.03)", border: "1px dashed var(--color-border)", borderRadius: "var(--radius-sm)" }}>
              <label className="new-post-form__label" style={{ marginBottom: "0.4rem", display: "block" }}>
                Imagen de Portada del Post <small style={{ color: "var(--color-text-muted)" }}>(Solo 1 opción activa)</small>
              </label>

              <div style={{ display: "flex", gap: "1.25rem", marginBottom: "0.75rem" }}>
                <label style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem", fontSize: "0.8rem", color: "var(--color-text-primary)", cursor: "pointer" }}>
                  <input
                    type="radio"
                    name="coverMode"
                    value="url"
                    checked={coverMode === "url"}
                    onChange={() => { setCoverMode("url"); setCoverFile(null); }}
                  />
                  🔗 Enlace URL Externo
                </label>

                <label style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem", fontSize: "0.8rem", color: "#00ff66", cursor: "pointer" }}>
                  <input
                    type="radio"
                    name="coverMode"
                    value="file"
                    checked={coverMode === "file"}
                    onChange={() => { setCoverMode("file"); setCoverUrl(""); }}
                  />
                  📁 Archivo Local (Subir a Firebase)
                </label>
              </div>

              {coverMode === "url" ? (
                <input
                  id="np-cover-url"
                  type="url"
                  className="new-post-form__input"
                  value={coverUrl}
                  onChange={(e) => setCoverUrl(e.target.value)}
                  placeholder="https://ejemplo.com/imagen-de-portada.png"
                />
              ) : (
                <div>
                  <input
                    id="np-cover-file"
                    type="file"
                    accept="image/*"
                    className="new-post-form__input"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        setCoverFile(e.target.files[0]);
                      }
                    }}
                  />
                  {coverFile && (
                    <p style={{ fontSize: "0.75rem", color: "#00ff66", marginTop: "0.4rem" }}>
                      ✓ Archivo seleccionado: <strong>{coverFile.name}</strong> ({Math.round(coverFile.size / 1024)} KB)
                    </p>
                  )}
                </div>
              )}
            </div>

            <button
              type="submit"
              className="new-post-form__submit"
              disabled={saving}
              id="np-submit-btn"
            >
              {saving ? "Publicando y Subiendo…" : "★ Publicar Entrada ★"}
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
