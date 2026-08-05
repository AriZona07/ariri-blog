"use client";

/**
 * /admin/new-post/page.tsx — Formulario de creación/edición de posts y borradores
 *
 * Modos de operación:
 *   - Sin query param `draft` → Formulario en blanco para post nuevo.
 *   - Con query param `?draft=<id>` → Carga el borrador desde `drafts/<id>`
 *     y trabaja en modo edición de borrador.
 *
 * Botones de acción (globales para ambos modos):
 *   - "★ Publicar post ★"  → Guarda en `posts`, elimina el borrador si existe.
 *   - "💾 Guardar borrador" → Guarda/actualiza en `drafts`. Si es nuevo, añade
 *                             `?draft=<id>` a la URL para que subsecuentes guardadas
 *                             actualicen el mismo documento (evita duplicados).
 *   - "🗑 Eliminar borrador" → Solo visible si hay draftId activo. Elimina de `drafts`
 *                              y redirige al panel admin.
 *
 * Seguridad: Firestore Rules bloquea escritura si el token no tiene claim `admin: true`.
 */

import { useState, useEffect } from "react";
import { useRouter, useSearchParams }        from "next/navigation";
import Link                                  from "next/link";
import {
  collection,
  addDoc,
  setDoc,
  getDoc,
  deleteDoc,
  doc,
  serverTimestamp,
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { db, storage }      from "@/lib/firebase";
import { useAuth }          from "@/lib/auth-context";
import { extractYouTubePlaylistId, processSongCoverUrl } from "@/lib/youtube";

export default function NewPostPage() {
  const { user, isAdmin, loading } = useAuth();
  const router       = useRouter();
  const searchParams = useSearchParams();

  // ID del borrador activo — se inicializa desde el query param ?draft=<id>.
  // Usar lazy initializer evita llamar setState dentro de un effect.
  const [draftId, setDraftId] = useState<string | null>(() => searchParams.get("draft"));

  // Campos del formulario
  const [title,     setTitle]     = useState("");
  const [slug,      setSlug]      = useState("");
  const [content,   setContent]   = useState("");
  const [mood,      setMood]      = useState("");
  const [song,      setSong]      = useState("");
  const [songCover, setSongCover] = useState("");
  const [playlist,  setPlaylist]  = useState("");
  const [date,      setDate]      = useState(new Date().toISOString().split("T")[0]);

  // Selección de portada del post (exclusiva: URL vs. archivo local)
  const [coverMode, setCoverMode] = useState<"url" | "file">("url");
  const [coverUrl,  setCoverUrl]  = useState("");
  const [coverFile, setCoverFile] = useState<File | null>(null);
  // URL final de la portada (guardada en el borrador / post publicado)
  const [existingCoverUrl, setExistingCoverUrl] = useState("");

  // Estados de UI
  const [saving,       setSaving]       = useState(false);
  const [savingDraft,  setSavingDraft]  = useState(false);
  const [deletingDraft, setDeletingDraft] = useState(false);
  const [success,      setSuccess]      = useState(false);
  const [error,        setError]        = useState<string | null>(null);
  const [draftLoading, setDraftLoading] = useState(false);
  // Toast al guardar borrador ("null" = oculto)
  const [draftToast,   setDraftToast]   = useState<string | null>(null);

  /* Carga el borrador al montar si el query param ?draft estaba presente.
   * La lógica vive dentro del effect como función async interna para que
   * los setState ocurran en callbacks async (tras await), no sincronamente. */
  useEffect(() => {
    const id = searchParams.get("draft");
    if (!id) return;

    async function fetchDraft() {
      setDraftLoading(true);
      try {
        const snap = await getDoc(doc(db, "drafts", id!));
        if (!snap.exists()) {
          setError("El borrador no existe o fue eliminado.");
          return;
        }
        const d = snap.data();
        setTitle(    d.title     ?? "");
        setSlug(     d.slug      ?? "");
        setContent(  d.content   ?? "");
        setMood(     d.mood      ?? "");
        setSong(     d.song      ?? "");
        setSongCover(d.songCover ?? "");
        setPlaylist( d.playlist  ?? "");
        setDate(     d.date      ?? new Date().toISOString().split("T")[0]);
        if (d.cover) {
          setExistingCoverUrl(d.cover);
          setCoverMode("url");
          setCoverUrl(d.cover);
        }
      } catch (err) {
        console.error("Error cargando borrador:", err);
        setError("No se pudo cargar el borrador. Verifica tu conexión.");
      } finally {
        setDraftLoading(false);
      }
    }

    fetchDraft();
  // searchParams es estable durante el ciclo de vida de la página
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* Acceso denegado si no es admin */
  if (!loading && (!user || !isAdmin)) {
    router.replace("/");
    return null;
  }

  /* Auto-generar slug al escribir el título (editable manualmente) */
  function handleTitleChange(val: string) {
    setTitle(val);
    if (!slug || slug === slugify(title)) {
      setSlug(slugify(val));
    }
  }

  /* Resuelve la portada final (sube a Storage si es archivo, o usa la URL) */
  async function resolveCover(): Promise<string | null> {
    if (coverMode === "file" && coverFile) {
      const storageRef = ref(storage, `post-covers/${Date.now()}_${coverFile.name}`);
      const snapshot   = await uploadBytes(storageRef, coverFile);
      return await getDownloadURL(snapshot.ref);
    }
    if (coverMode === "url" && coverUrl.trim()) return coverUrl.trim();
    if (existingCoverUrl) return existingCoverUrl;
    return null;
  }

  /* Construye el objeto de datos común para post y borrador */
  async function buildPostData(finalCover: string | null) {
    const playlistTrimmed     = playlist.trim();
    const playlistIdExtracted = playlistTrimmed ? extractYouTubePlaylistId(playlistTrimmed) : null;
    const finalSongCover      = processSongCoverUrl(songCover);

    return {
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
    };
  }

  /* Publicar post → guarda en `posts`, elimina el borrador si existe */
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!slug.trim() || !title.trim() || !content.trim()) {
      setError("Título, slug y contenido son obligatorios.");
      return;
    }

    setSaving(true);
    setError(null);
    try {
      const finalCover = await resolveCover();
      const data       = await buildPostData(finalCover);

      await addDoc(collection(db, "posts"), {
        ...data,
        source:    "firestore",
        authorUid: user!.uid,
        createdAt: serverTimestamp(),
      });

      // Notificación de nuevo post
      await addDoc(collection(db, "notifications"), {
        title:     "¡Nuevo post de blog!",
        message:   title.trim(),
        postSlug:  slug.trim(),
        createdAt: serverTimestamp(),
        type:      "new_post",
      });

      // Elimina el borrador si el post fue creado desde uno
      if (draftId) {
        await deleteDoc(doc(db, "drafts", draftId));
      }

      setSuccess(true);
    } catch (err: unknown) {
      console.error("Error al publicar post:", err);
      const errMsg = err instanceof Error ? err.message : String(err);
      if (errMsg.includes("CORS") || errMsg.toLowerCase().includes("failed to fetch") || errMsg.toLowerCase().includes("network")) {
        setError("🚫 Error de CORS al subir imagen a Firebase Storage. Usa la opción 'Enlace URL Externo', o aplica cors.json en tu proyecto Firebase.");
      } else {
        setError(`Error al publicar: ${errMsg || "Verifica tu conexión y permisos de admin."}`);
      }
    } finally {
      setSaving(false);
    }
  }

  /* Guardar borrador → crea o actualiza en `drafts` */
  async function handleSaveDraft() {
    if (!title.trim() && !content.trim()) {
      setError("Escribe al menos el título o contenido antes de guardar el borrador.");
      return;
    }

    setSavingDraft(true);
    setError(null);
    try {
      const finalCover = await resolveCover();
      const data       = await buildPostData(finalCover);

      if (draftId) {
        // Actualiza el borrador existente sin crear uno nuevo
        await setDoc(doc(db, "drafts", draftId), {
          ...data,
          authorUid: user!.uid,
          savedAt:   serverTimestamp(),
        });
      } else {
        // Crea un borrador nuevo y actualiza la URL para futuras guardadas
        const ref = await addDoc(collection(db, "drafts"), {
          ...data,
          authorUid: user!.uid,
          savedAt:   serverTimestamp(),
        });
        setDraftId(ref.id);
        // Añade el query param a la URL sin recargar la página
        window.history.replaceState({}, "", `/admin/new-post?draft=${ref.id}`);
      }

      // Muestra toast de confirmación y lo oculta a los 2.5s
      setDraftToast("💾 Borrador guardado");
      setTimeout(() => setDraftToast(null), 2600);
    } catch (err: unknown) {
      console.error("Error al guardar borrador:", err);
      const errMsg = err instanceof Error ? err.message : String(err);
      setError(`Error al guardar borrador: ${errMsg || "Verifica tu conexión."}`);
    } finally {
      setSavingDraft(false);
    }
  }

  /* Eliminar borrador → borra de `drafts` y regresa al panel */
  async function handleDeleteDraft() {
    if (!draftId) return;
    if (!window.confirm("¿Eliminar este borrador? Esta acción no se puede deshacer.")) return;

    setDeletingDraft(true);
    setError(null);
    try {
      await deleteDoc(doc(db, "drafts", draftId));
      router.push("/admin");
    } catch (err: unknown) {
      console.error("Error al eliminar borrador:", err);
      const errMsg = err instanceof Error ? err.message : String(err);
      setError(`Error al eliminar borrador: ${errMsg}`);
      setDeletingDraft(false);
    }
  }

  function resetForm() {
    setSuccess(false);
    setDraftId(null);
    setTitle("");
    setSlug("");
    setContent("");
    setPlaylist("");
    setSong("");
    setSongCover("");
    setCoverUrl("");
    setCoverFile(null);
    setCoverMode("url");
    setExistingCoverUrl("");
    setMood("");
  }

  if (success) {
    return (
      <div className="retro-box">
        <div className="retro-box__header">⚙ Nuevo post</div>
        <div className="retro-box__body" style={{ padding: "1.5rem" }}>
          <p className="new-post-success">
            ✅ Post publicado correctamente en Firestore.
          </p>
          <div style={{ display: "flex", gap: "0.75rem", marginTop: "1rem" }}>
            <Link href="/admin" className="admin-btn-new">← Volver al Panel</Link>
            <button
              className="admin-btn-new"
              style={{ background: "#221b2e", color: "#00ff66", border: "2px solid #00ff66" }}
              onClick={resetForm}
            >
              + Otro post
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="retro-box">
        {/* Header: indica si estamos editando un borrador existente */}
        <div className="retro-box__header">
          {draftId ? "⚙ Editando borrador" : "⚙ Nuevo post"}
        </div>
        <div className="retro-box__body">
          <div className="admin-page" style={{ maxWidth: "100%" }}>

            <Link
              href="/admin"
              style={{ fontSize: "0.75rem", color: "var(--color-text-muted)", marginBottom: "1rem", display: "inline-block" }}
            >
              ← Volver al Panel
            </Link>

            {/* Indicador de modo borrador */}
            {draftId && (
              <p style={{ fontSize: "0.78rem", color: "#00f0ff", marginBottom: "0.75rem",
                          background: "rgba(0,240,255,0.07)", border: "1px solid #00f0ff",
                          borderRadius: "var(--radius-sm)", padding: "0.4rem 0.7rem" }}>
                📄 Editando borrador guardado. Publica para hacerlo público, o guárdalo de nuevo para actualizar.
              </p>
            )}

            {draftLoading ? (
              <p style={{ color: "var(--color-text-muted)", padding: "1rem 0" }}>
                Cargando borrador…
              </p>
            ) : (
              <>
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
                      placeholder="Mi nuevo post del blog"
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
                      placeholder="mi-nuevo-post"
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

                  {/* Imagen de portada con selector exclusivo */}
                  <div
                    className="new-post-form__field"
                    style={{ padding: "0.85rem", background: "rgba(255, 255, 255, 0.03)",
                             border: "1px dashed var(--color-border)", borderRadius: "var(--radius-sm)" }}
                  >
                    <label className="new-post-form__label" style={{ marginBottom: "0.4rem", display: "block" }}>
                      Imagen de Portada del Post <small style={{ color: "var(--color-text-muted)" }}>(Solo 1 opción activa)</small>
                    </label>

                    {/* Muestra la portada guardada si viene de un borrador */}
                    {existingCoverUrl && coverMode === "url" && !coverUrl && (
                      <p style={{ fontSize: "0.75rem", color: "#00f0ff", marginBottom: "0.5rem" }}>
                        ✓ Portada guardada en borrador: <span style={{ wordBreak: "break-all" }}>{existingCoverUrl}</span>
                      </p>
                    )}

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

                  {/* Fila de botones de acción */}
                  <div className="new-post-form__actions">
                    {/* Guardar borrador — siempre visible */}
                    <button
                      type="button"
                      className="new-post-form__save-draft"
                      onClick={handleSaveDraft}
                      disabled={savingDraft || saving || deletingDraft}
                      id="np-save-draft-btn"
                    >
                      {savingDraft ? "Guardando…" : "💾 Guardar borrador"}
                    </button>

                    {/* Publicar post */}
                    <button
                      type="submit"
                      className="new-post-form__submit"
                      disabled={saving || savingDraft || deletingDraft}
                      id="np-submit-btn"
                    >
                      {saving ? "Publicando…" : "★ Publicar post ★"}
                    </button>

                    {/* Eliminar borrador — solo si hay draftId activo */}
                    {draftId && (
                      <button
                        type="button"
                        className="new-post-form__delete-draft"
                        onClick={handleDeleteDraft}
                        disabled={saving || savingDraft || deletingDraft}
                        id="np-delete-draft-btn"
                      >
                        {deletingDraft ? "Eliminando…" : "🗑 Eliminar borrador"}
                      </button>
                    )}
                  </div>

                </form>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Toast de confirmación al guardar borrador */}
      {draftToast && (
        <div className="draft-toast" role="status" aria-live="polite">
          {draftToast}
        </div>
      )}
    </>
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
