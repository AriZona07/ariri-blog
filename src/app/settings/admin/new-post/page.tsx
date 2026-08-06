"use client";

/**
 * /settings/admin/new-post/page.tsx — Formulario de creación/edición de posts y borradores
 *
 * Ubicado dentro de la sección de ajustes /settings/admin.
 *
 * Modos de operación:
 *   - Sin query param `draft` → Formulario en blanco para post nuevo.
 *   - Con query param `?draft=<id>` → Carga el borrador desde `drafts/<id>`
 *     y trabaja en modo edición de borrador.
 *
 * Botones de acción:
 *   - "★ Publicar post ★"  → Guarda en `posts`, elimina el borrador si existe.
 *   - "💾 Guardar borrador" → Guarda/actualiza en `drafts`. Si es nuevo, añade
 *                             `?draft=<id>` a la URL para evitar duplicados.
 *   - "🗑 Eliminar borrador" → Elimina de `drafts` y redirige al panel admin.
 *
 * Seguridad: Firestore Rules bloquea escritura si el token no tiene claim `admin: true`.
 */

import { useState, useEffect, Suspense }   from "react";
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
import ImageUploader                        from "@/components/ui/ImageUploader";
import { markForDeletion, processScheduledDeletions } from "@/lib/deletion-queue";

function SettingsNewPostForm() {
  const { user, isAdmin, loading } = useAuth();
  const router       = useRouter();
  const searchParams = useSearchParams();

  // ID del borrador activo — se inicializa desde el query param ?draft=<id>.
  const [draftId, setDraftId] = useState<string | null>(() => searchParams.get("draft"));

  // Campos del formulario
  const [title,     setTitle]     = useState("");
  const [slug,      setSlug]      = useState("");
  const [content,   setContent]   = useState("");
  const [mood,      setMood]      = useState("");
  const [song,      setSong]      = useState("");
  const [playlist,  setPlaylist]  = useState("");
  const [date,      setDate]      = useState(new Date().toISOString().split("T")[0]);

  // Selección de portada del post (exclusiva: URL vs. archivo local)
  const [coverMode, setCoverMode] = useState<"url" | "file">("url");
  const [coverUrl,  setCoverUrl]  = useState("");
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [existingCoverUrl, setExistingCoverUrl] = useState("");

  // Selección de portada de canción (exclusiva: URL vs. archivo local)
  const [songCoverMode, setSongCoverMode] = useState<"url" | "file">("url");
  const [songCoverUrl,  setSongCoverUrl]  = useState("");
  const [songCoverFile, setSongCoverFile] = useState<File | null>(null);
  const [existingSongCoverUrl, setExistingSongCoverUrl] = useState("");

  // Estado de UI
  const [saving,        setSaving]        = useState(false);
  const [savingDraft,   setSavingDraft]   = useState(false);
  const [deletingDraft, setDeletingDraft] = useState(false);
  const [loadingDraft,  setLoadingDraft]  = useState(Boolean(draftId));
  const [success,       setSuccess]       = useState(false);
  const [error,         setError]         = useState<string | null>(null);
  const [draftToast,    setDraftToast]    = useState<string | null>(null);

  /* Redirección de seguridad lado cliente y comprobación de limpieza mensual */
  useEffect(() => {
    if (!loading && (!user || !isAdmin)) {
      router.replace("/");
    } else if (isAdmin) {
      processScheduledDeletions();
    }
  }, [user, isAdmin, loading, router]);

  /* Si hay `draftId`, carga los datos del borrador desde Firestore */
  useEffect(() => {
    if (!draftId || !isAdmin) return;

    let isMounted = true;
    async function fetchDraft() {
      try {
        const snap = await getDoc(doc(db, "drafts", draftId!));
        if (snap.exists() && isMounted) {
          const d = snap.data();
          setTitle(d.title ?? "");
          setSlug(d.slug ?? "");
          setContent(d.content ?? "");
          setMood(d.mood ?? "");
          setSong(d.song ?? "");
          setPlaylist(d.playlist ?? "");
          if (d.date) setDate(d.date);
          if (d.songCover) {
            setExistingSongCoverUrl(d.songCover);
            setSongCoverMode("url");
            setSongCoverUrl(d.songCover);
          }
          if (d.cover) {
            setExistingCoverUrl(d.cover);
            setCoverMode("url");
            setCoverUrl(d.cover);
          }
        }
      } catch (err) {
        console.error("Error al cargar borrador:", err);
        if (isMounted) setError("No se pudo cargar el borrador seleccionado.");
      } finally {
        if (isMounted) setLoadingDraft(false);
      }
    }

    fetchDraft();
    return () => { isMounted = false; };
  }, [draftId, isAdmin]);

  /* Resuelve la URL de la imagen de portada del post */
  async function resolveCover(): Promise<string> {
    if (coverMode === "file" && coverFile) {
      const storageRef = ref(storage, `covers/${Date.now()}_${coverFile.name}`);
      const snapshot   = await uploadBytes(storageRef, coverFile);
      return getDownloadURL(snapshot.ref);
    }
    if (coverMode === "url" && coverUrl.trim()) {
      return coverUrl.trim();
    }
    return existingCoverUrl;
  }

  /* Resuelve la URL de la portada de la canción */
  async function resolveSongCover(): Promise<string | null> {
    if (songCoverMode === "file" && songCoverFile) {
      const storageRef = ref(storage, `song-covers/${Date.now()}_${songCoverFile.name}`);
      const snapshot   = await uploadBytes(storageRef, songCoverFile);
      return getDownloadURL(snapshot.ref);
    }
    if (songCoverMode === "url" && songCoverUrl.trim()) {
      return processSongCoverUrl(songCoverUrl.trim());
    }
    return existingSongCoverUrl;
  }

  /* Construye el objeto de datos formateado (sin valores undefined incompatibles con Firestore) */
  async function buildPostData() {
    const finalCover     = await resolveCover();
    const finalSongCover = await resolveSongCover();

    // Registrar en la cola de eliminación si las imágenes anteriores fueron sustituidas o quitadas
    if (existingCoverUrl && existingCoverUrl !== finalCover) {
      await markForDeletion({
        resourceType: "image",
        url: existingCoverUrl,
        reason: finalCover ? "cover_replaced" : "cover_removed",
      });
    }

    if (existingSongCoverUrl && existingSongCoverUrl !== finalSongCover) {
      await markForDeletion({
        resourceType: "image",
        url: existingSongCoverUrl,
        reason: finalSongCover ? "song_cover_replaced" : "song_cover_removed",
      });
    }

    const cleanSlug = (slug.trim() || title.trim())
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");

    const extractedPlaylist = extractYouTubePlaylistId(playlist);

    const rawData = {
      title:     title.trim()      || "(Sin título)",
      slug:      cleanSlug         || `post-${Date.now()}`,
      content:   content.trim(),
      date,
      author:    user?.displayName  || "Ariri",
      authorUid: user?.uid         || "",
      mood:      mood.trim()       || null,
      song:      song.trim()       || null,
      songCover: finalSongCover    || null,
      playlist:  extractedPlaylist || null,
      cover:     finalCover        || null,
    };

    // Firestore rechaza valores 'undefined'. Garantizamos que solo se envíen valores válidos.
    return Object.fromEntries(
      Object.entries(rawData).filter(([, val]) => val !== undefined)
    );
  }

  /* Parsea y personaliza errores de Firestore / Storage para la interfaz */
  function formatFirestoreError(err: unknown, contextMsg: string): string {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.includes("permission-denied")) {
      return "Acceso denegado: tu cuenta no tiene permisos de administrador en Firestore.";
    }
    if (msg.includes("Unsupported field value") || msg.includes("invalid data")) {
      const fieldMatch = msg.match(/found in field ([a-zA-Z0-9_-]+)/);
      const fieldInfo = fieldMatch ? ` (campo con problema: '${fieldMatch[1]}')` : "";
      return `Error en los datos: hay un campo no válido o mal formateado${fieldInfo}.`;
    }
    if (msg.includes("storage/")) {
      return "Error al subir la imagen a Firebase Storage. Verifica la conexión o el archivo.";
    }
    return `${contextMsg}: ${msg || "Verifica tu conexión y permisos."}`;
  }

  /* Publicar post en `posts` */
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !content.trim()) {
      const missing = [];
      if (!title.trim()) missing.push("Título");
      if (!content.trim()) missing.push("Contenido");
      setError(`Campo(s) obligatorio(s) faltante(s): ${missing.join(", ")}.`);
      return;
    }

    setSaving(true);
    setError(null);
    try {
      const data = await buildPostData();

      await addDoc(collection(db, "posts"), {
        ...data,
        createdAt: serverTimestamp(),
      });

      // Crear notificación para avisar a los lectores
      try {
        await addDoc(collection(db, "notifications"), {
          title: "Nuevo post en Ariri Blog",
          message: `Mira la nueva entrada: "${data.title}"`,
          postSlug: data.slug,
          type: "new_post",
          createdAt: serverTimestamp(),
        });
      } catch (notifErr) {
        console.warn("No se pudo crear el registro de notificación:", notifErr);
      }

      // Si estábamos trabajando sobre un borrador, lo eliminamos tras publicar
      if (draftId) {
        try {
          await deleteDoc(doc(db, "drafts", draftId));
        } catch (delErr) {
          console.warn("No se pudo eliminar el borrador tras publicar:", delErr);
        }
      }

      setSuccess(true);
    } catch (err: unknown) {
      console.error("Error al guardar post:", err);
      setError(formatFirestoreError(err, "Error al publicar"));
    } finally {
      setSaving(false);
    }
  }

  /* Guardar borrador en `drafts` */
  async function handleSaveDraft() {
    if (!title.trim() && !content.trim()) {
      setError("Faltan datos: Escribe al menos el título o el contenido antes de guardar el borrador.");
      return;
    }

    setSavingDraft(true);
    setError(null);
    try {
      const data = await buildPostData();

      if (draftId) {
        await setDoc(doc(db, "drafts", draftId), {
          ...data,
          authorUid: user!.uid,
          savedAt:   serverTimestamp(),
        });
      } else {
        const ref = await addDoc(collection(db, "drafts"), {
          ...data,
          authorUid: user!.uid,
          savedAt:   serverTimestamp(),
        });
        setDraftId(ref.id);
        window.history.replaceState({}, "", `/settings/admin/new-post?draft=${ref.id}`);
      }

      setDraftToast("💾 Borrador guardado");
      setTimeout(() => setDraftToast(null), 2600);
    } catch (err: unknown) {
      console.error("Error al guardar borrador:", err);
      setError(formatFirestoreError(err, "Error al guardar borrador"));
    } finally {
      setSavingDraft(false);
    }
  }

  /* Eliminar borrador */
  async function handleDeleteDraft() {
    if (!draftId) return;
    if (!window.confirm("¿Eliminar este borrador? Esta acción no se puede deshacer.")) return;

    setDeletingDraft(true);
    setError(null);
    try {
      if (existingCoverUrl) {
        await markForDeletion({
          resourceType: "image",
          url: existingCoverUrl,
          reason: "draft_deleted",
        });
      }
      if (existingSongCoverUrl) {
        await markForDeletion({
          resourceType: "image",
          url: existingSongCoverUrl,
          reason: "draft_deleted",
        });
      }

      await deleteDoc(doc(db, "drafts", draftId));
      router.push("/settings/admin");
    } catch (err: unknown) {
      console.error("Error al eliminar borrador:", err);
      setError(formatFirestoreError(err, "Error al eliminar borrador"));
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
    setSongCoverUrl("");
    setSongCoverFile(null);
    setSongCoverMode("url");
    setExistingSongCoverUrl("");
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
            <Link href="/settings/admin" className="admin-btn-new">← Volver al Panel</Link>
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
        <div className="retro-box__header">
          {draftId ? "⚙ Editando borrador" : "⚙ Nuevo post"}
        </div>
        <div className="retro-box__body">
          <div className="admin-page" style={{ maxWidth: "100%" }}>

            <Link
              href="/settings/admin"
              style={{ fontSize: "0.75rem", color: "var(--color-text-muted)", marginBottom: "1rem", display: "inline-block" }}
            >
              ← Volver al Panel
            </Link>

            {draftId && (
              <div className="draft-active-banner">
                <span>📄 Editando borrador <strong>#{draftId.slice(0, 8)}</strong></span>
                <span className="draft-active-banner__note">Los cambios no son públicos hasta que presiones &quot;Publicar post&quot;.</span>
              </div>
            )}

            {loadingDraft ? (
              <p className="admin-empty">Cargando borrador…</p>
            ) : (
              <form onSubmit={handleSubmit}>
                {error && <p className="auth-error" role="alert">{error}</p>}

                {/* Título */}
                <div className="auth-field">
                  <label htmlFor="np-title" className="auth-field__label">Título *</label>
                  <input
                    id="np-title"
                    type="text"
                    className="auth-field__input"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Escribe un título genial…"
                    required
                  />
                </div>

                {/* Slug manual */}
                <div className="auth-field">
                  <label htmlFor="np-slug" className="auth-field__label">
                    Slug manual (URL permalink)
                  </label>
                  <input
                    id="np-slug"
                    type="text"
                    className="auth-field__input"
                    value={slug}
                    onChange={(e) => setSlug(e.target.value)}
                    placeholder="ej: mi-nuevo-post (opcional, se auto-genera si se omite)"
                  />
                </div>

                {/* Fecha */}
                <div className="auth-field">
                  <label htmlFor="np-date" className="auth-field__label">Fecha *</label>
                  <input
                    id="np-date"
                    type="date"
                    className="auth-field__input"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    required
                  />
                </div>

                {/* Estado de ánimo */}
                <div className="auth-field">
                  <label htmlFor="np-mood" className="auth-field__label">Mood / Estado de ánimo</label>
                  <input
                    id="np-mood"
                    type="text"
                    className="auth-field__input"
                    value={mood}
                    onChange={(e) => setMood(e.target.value)}
                    placeholder="ej: 🎧 Emo / Melancólica"
                  />
                </div>

                {/* Canción escuachando */}
                <div className="auth-field">
                  <label htmlFor="np-song" className="auth-field__label">Canción del día</label>
                  <input
                    id="np-song"
                    type="text"
                    className="auth-field__input"
                    value={song}
                    onChange={(e) => setSong(e.target.value)}
                    placeholder="ej: My Chemical Romance — Helena"
                  />
                </div>

                {/* Portada de la canción */}
                <ImageUploader
                  label="Portada de la canción"
                  id="np-song-cover-uploader"
                  mode={songCoverMode}
                  onModeChange={setSongCoverMode}
                  urlValue={songCoverUrl}
                  onUrlChange={setSongCoverUrl}
                  fileValue={songCoverFile}
                  onFileChange={setSongCoverFile}
                  minWidth={100}
                  minHeight={100}
                  maxWidth={4000}
                  maxHeight={4000}
                  maxSizeMB={10}
                  cropShape="square"
                  cropAspectRatio={1}
                  existingUrl={existingSongCoverUrl}
                  onClear={() => {
                    setSongCoverUrl("");
                    setSongCoverFile(null);
                    setExistingSongCoverUrl("");
                  }}
                />

                {/* Playlist de YouTube */}
                <div className="auth-field">
                  <label htmlFor="np-playlist" className="auth-field__label">Playlist de YouTube (Winamp)</label>
                  <input
                    id="np-playlist"
                    type="text"
                    className="auth-field__input"
                    value={playlist}
                    onChange={(e) => setPlaylist(e.target.value)}
                    placeholder="ID o URL de la playlist"
                  />
                </div>

                {/* Portada principal del post */}
                <ImageUploader
                  label="Imagen de Portada del Post"
                  id="np-cover-uploader"
                  mode={coverMode}
                  onModeChange={setCoverMode}
                  urlValue={coverUrl}
                  onUrlChange={setCoverUrl}
                  fileValue={coverFile}
                  onFileChange={setCoverFile}
                  minWidth={200}
                  minHeight={200}
                  maxWidth={5000}
                  maxHeight={5000}
                  maxSizeMB={10}
                  cropShape="rect"
                  cropAspectRatio={1.777}
                  existingUrl={existingCoverUrl}
                  onClear={() => {
                    setCoverUrl("");
                    setCoverFile(null);
                    setExistingCoverUrl("");
                  }}
                />

                {/* Contenido en Markdown */}
                <div className="auth-field">
                  <label htmlFor="np-content" className="auth-field__label">Contenido en Markdown *</label>
                  <textarea
                    id="np-content"
                    className="auth-field__input new-post-textarea"
                    rows={12}
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="Escribe la entrada en Markdown…"
                    required
                  />
                </div>

                {/* Barra de botones de acción */}
                <div className="new-post-actions-bar">
                  <button
                    type="submit"
                    className="auth-btn-primary"
                    disabled={saving || savingDraft}
                    id="np-publish-btn"
                  >
                    {saving ? "Publicando…" : "★ Publicar post ★"}
                  </button>

                  <button
                    type="button"
                    className="admin-btn-draft-action"
                    disabled={saving || savingDraft}
                    onClick={handleSaveDraft}
                    id="np-save-draft-btn"
                  >
                    {savingDraft ? "Guardando…" : "💾 Guardar borrador"}
                  </button>

                  {draftId && (
                    <button
                      type="button"
                      className="admin-btn-delete-draft"
                      disabled={saving || savingDraft || deletingDraft}
                      onClick={handleDeleteDraft}
                      id="np-delete-draft-btn"
                    >
                      {deletingDraft ? "Eliminando…" : "🗑 Eliminar borrador"}
                    </button>
                  )}
                </div>

              </form>
            )}

          </div>
        </div>
      </div>

      {/* Toast emergente de confirmación */}
      {draftToast && (
        <div className="draft-toast" role="status">
          {draftToast}
        </div>
      )}
    </>
  );
}

export default function SettingsNewPostPage() {
  return (
    <Suspense
      fallback={
        <div className="retro-box">
          <div className="retro-box__header">⚙ Publicaciones y Borradores</div>
          <div className="account-loading">Cargando formulario…</div>
        </div>
      }
    >
      <SettingsNewPostForm />
    </Suspense>
  );
}
