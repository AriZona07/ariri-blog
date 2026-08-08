"use client";

/**
 * /settings/admin/new-post/page.tsx — Formulario de creación/edición de posts y borradores
 *
 * Ubicado dentro de la sección de ajustes /settings/admin.
 *
 * Modos de operación:
 *   - Sin query param → Formulario en blanco para post nuevo.
 *   - Con query param `?draft=<id>` → Carga el borrador desde `drafts/<id>` y trabaja en modo edición de borrador.
 *   - Con query param `?edit=<id>` → Carga el post publicado desde `posts/<id>` y trabaja en modo edición de post.
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
  getDocs,
  query,
  where,
  deleteDoc,
  doc,
  serverTimestamp,
  Timestamp,
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { db, storage }      from "@/lib/firebase";
import { useAuth }          from "@/lib/auth-context";
import { extractYouTubePlaylistId, processSongCoverUrl } from "@/lib/youtube";
import ImageUploader                        from "@/components/ui/ImageUploader";
import MarkdownEditor                       from "@/components/ui/MarkdownEditor";
import SlugInput, { sanitizeSlug }          from "@/components/ui/SlugInput";
import SongSection                          from "@/components/ui/SongSection";
import PostActionsBar                       from "@/components/ui/PostActionsBar";
import { markForDeletion, processScheduledDeletions } from "@/lib/deletion-queue";

/** Convierte un objeto Date a string para el input datetime-local (YYYY-MM-DDTHH:mm) */
function toLocalDateTimeString(d: Date): string {
  const pad = (n: number) => n.toString().padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function SettingsNewPostForm() {
  const { user, isAdmin, loading } = useAuth();
  const router       = useRouter();
  const searchParams = useSearchParams();

  // ID del borrador o post activo — se inicializan desde los query params.
  const [draftId, setDraftId] = useState<string | null>(() => searchParams.get("draft"));
  const [editId,  setEditId]  = useState<string | null>(() => searchParams.get("edit"));

  // Campos del formulario
  const [title,     setTitle]     = useState("");
  const [slug,      setSlug]      = useState("");
  const [content,   setContent]   = useState("");
  const [mood,      setMood]      = useState("");
  const [song,      setSong]      = useState("");
  const [playlist,  setPlaylist]  = useState("");
  const [date,      setDate]      = useState(new Date().toISOString().split("T")[0]);

  // Modo de publicación: inmediata vs programada
  const [publishMode,       setPublishMode]       = useState<"immediate" | "scheduled">("immediate");
  const [scheduledDateTime, setScheduledDateTime] = useState<string>(() => {
    const nextHour = new Date();
    nextHour.setHours(nextHour.getHours() + 1, 0, 0, 0);
    return toLocalDateTimeString(nextHour);
  });

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
  const [revertingDraft,setRevertingDraft]= useState(false);
  const [deletingDraft, setDeletingDraft] = useState(false);
  const [loadingData,   setLoadingData]   = useState(Boolean(draftId || editId));
  const [success,       setSuccess]       = useState(false);
  const [error,         setError]         = useState<string | null>(null);
  const [slugWarning,   setSlugWarning]   = useState<string | null>(null);
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
          if (d.status === "scheduled" || d.scheduledAt) {
            setPublishMode("scheduled");
            if (d.scheduledAt && typeof d.scheduledAt.toDate === "function") {
              setScheduledDateTime(toLocalDateTimeString(d.scheduledAt.toDate()));
            }
          } else {
            setPublishMode("immediate");
          }
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
        if (isMounted) setLoadingData(false);
      }
    }

    fetchDraft();
    return () => { isMounted = false; };
  }, [draftId, isAdmin]);

  /* Si hay `editId`, carga los datos del post publicado desde Firestore */
  useEffect(() => {
    if (!editId || !isAdmin) return;

    let isMounted = true;
    async function fetchPost() {
      try {
        const snap = await getDoc(doc(db, "posts", editId!));
        if (snap.exists() && isMounted) {
          const d = snap.data();
          setTitle(d.title ?? "");
          setSlug(d.slug ?? "");
          setContent(d.content ?? "");
          setMood(d.mood ?? "");
          setSong(d.song ?? "");
          setPlaylist(d.playlist ?? "");
          if (d.date) setDate(d.date);
          if (d.status === "scheduled" || d.scheduledAt) {
            setPublishMode("scheduled");
            if (d.scheduledAt && typeof d.scheduledAt.toDate === "function") {
              setScheduledDateTime(toLocalDateTimeString(d.scheduledAt.toDate()));
            }
          } else {
            setPublishMode("immediate");
          }
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
        console.error("Error al cargar post para editar:", err);
        if (isMounted) setError("No se pudo cargar el post para edición.");
      } finally {
        if (isMounted) setLoadingData(false);
      }
    }

    fetchPost();
    return () => { isMounted = false; };
  }, [editId, isAdmin]);

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
    if (!song.trim()) return null;

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

  /* Verifica si un slug ya existe en publicaciones de Firestore */
  async function isSlugDuplicate(candidateSlug: string, currentPostId?: string | null): Promise<boolean> {
    if (!candidateSlug) return false;
    try {
      const q = query(collection(db, "posts"), where("slug", "==", candidateSlug));
      const snap = await getDocs(q);
      const matches = snap.docs.filter((d) => d.id !== currentPostId);
      return matches.length > 0;
    } catch (err) {
      console.warn("Error al verificar duplicidad de slug:", err);
      return false;
    }
  }

  /* Handler para blur de título o slug para alertar duplicados en tiempo real */
  async function handleSlugBlur() {
    const cleanSlug = sanitizeSlug(slug.trim() || title.trim()).replace(/^-+|-+$/g, "");

    if (cleanSlug) {
      const duplicate = await isSlugDuplicate(cleanSlug, editId);
      if (duplicate) {
        setSlugWarning(`⚠️ El slug "${cleanSlug}" ya pertenece a otra publicación activa. Por favor modifícalo.`);
      } else {
        setSlugWarning(null);
      }
    }
  }

  /* Construye el objeto de datos formateado */
  async function buildPostData() {
    const finalCover     = await resolveCover();
    const finalSongCover = await resolveSongCover();

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

    const cleanSlug = sanitizeSlug(slug.trim() || title.trim()).replace(/^-+|-+$/g, "");
    const extractedPlaylist = extractYouTubePlaylistId(playlist);

    let statusValue: "published" | "scheduled" = "published";
    let scheduledTimestamp = null;
    let publishedTimestamp: unknown = serverTimestamp();
    let postDateStr = date;

    if (publishMode === "scheduled" && scheduledDateTime) {
      const scheduledDateObj = new Date(scheduledDateTime);
      if (scheduledDateObj.getTime() > Date.now()) {
        statusValue = "scheduled";
        scheduledTimestamp = Timestamp.fromDate(scheduledDateObj);
        publishedTimestamp = Timestamp.fromDate(scheduledDateObj);
        postDateStr = scheduledDateTime.split("T")[0];
      } else {
        statusValue = "published";
        publishedTimestamp = serverTimestamp();
        postDateStr = scheduledDateTime.split("T")[0];
      }
    } else {
      statusValue = "published";
      publishedTimestamp = serverTimestamp();
      postDateStr = new Date().toISOString().split("T")[0];
    }

    const rawData = {
      title:       title.trim()      || "(Sin título)",
      slug:        cleanSlug         || `post-${Date.now()}`,
      content:     content.trim(),
      date:        postDateStr,
      status:      statusValue,
      publishedAt: publishedTimestamp,
      scheduledAt: scheduledTimestamp,
      author:      user?.displayName  || "Ariri",
      authorUid:   user?.uid         || "",
      mood:        mood.trim()       || null,
      song:        song.trim()       || null,
      songCover:   finalSongCover    || null,
      playlist:    extractedPlaylist || null,
      cover:       finalCover        || null,
    };

    return Object.fromEntries(
      Object.entries(rawData).filter(([, val]) => val !== undefined)
    );
  }

  /* Parsea errores de Firestore / Storage */
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

  /* Publicar o Actualizar post en `posts` */
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

      const duplicate = await isSlugDuplicate(String(data.slug), editId);
      if (duplicate) {
        setError(`El slug "${data.slug}" ya está asignado a otra publicación. Por favor modifica el slug.`);
        setSaving(false);
        return;
      }

      if (editId) {
        await setDoc(doc(db, "posts", editId), {
          ...data,
          updatedAt: serverTimestamp(),
        }, { merge: true });
      } else {
        await addDoc(collection(db, "posts"), {
          ...data,
          createdAt: serverTimestamp(),
        });

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
      }

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
      setError(formatFirestoreError(err, "Error al guardar publicación"));
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
      const draftPayload = {
        ...data,
        status:    "draft",
        authorUid: user!.uid,
        savedAt:   serverTimestamp(),
      };

      if (draftId) {
        await setDoc(doc(db, "drafts", draftId), draftPayload);
      } else {
        const ref = await addDoc(collection(db, "drafts"), draftPayload);
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

  /* Convertir post publicado a borrador */
  async function handleRevertToDraft() {
    if (!window.confirm("¿Regresar esta publicación a borradores? Se despublicará del blog hasta que la vuelvas a publicar.")) return;

    setRevertingDraft(true);
    setError(null);
    try {
      const data = await buildPostData();

      const newDraftRef = await addDoc(collection(db, "drafts"), {
        ...data,
        authorUid: user!.uid,
        savedAt:   serverTimestamp(),
      });

      if (editId) {
        await deleteDoc(doc(db, "posts", editId));
      }

      router.push(`/settings/admin/new-post?draft=${newDraftRef.id}`);
    } catch (err: unknown) {
      console.error("Error al convertir a borrador:", err);
      setError(formatFirestoreError(err, "Error al regresar a borrador"));
      setRevertingDraft(false);
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
    setEditId(null);
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
    setSlugWarning(null);
  }

  if (success) {
    return (
      <div className="retro-box">
        <div className="retro-box__header">⚙ Publicación Guardada</div>
        <div className="retro-box__body" style={{ padding: "1.5rem" }}>
          <p className="new-post-success">
            ✅ Post {editId ? "actualizado" : "publicado"} correctamente en Firestore.
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
          {editId ? "⚙ Editando post publicado" : draftId ? "⚙ Editando borrador" : "⚙ Nuevo post"}
        </div>
        <div className="retro-box__body">
          <div className="admin-page" style={{ maxWidth: "100%" }}>

            <Link
              href="/settings/admin"
              style={{ fontSize: "0.75rem", color: "var(--color-text-muted)", marginBottom: "1rem", display: "inline-block" }}
            >
              ← Volver al Panel
            </Link>

            {editId && (
              <div className="draft-active-banner" style={{ borderLeftColor: "#00ff66" }}>
                <span>✏️ Editando publicación <strong>#{editId.slice(0, 8)}</strong></span>
                <span className="draft-active-banner__note">Los cambios reemplazarán el contenido activo en el blog.</span>
              </div>
            )}

            {draftId && (
              <div className="draft-active-banner">
                <span>📄 Editando borrador <strong>#{draftId.slice(0, 8)}</strong></span>
                <span className="draft-active-banner__note">Los cambios no son públicos hasta que presiones &quot;Publicar post&quot;.</span>
              </div>
            )}

            {loadingData ? (
              <p className="admin-empty">Cargando publicación…</p>
            ) : (
              <form onSubmit={handleSubmit}>
                {error && <p className="auth-error" role="alert">{error}</p>}

                {/* Fila horizontal: Título + Slug manual */}
                <div className="title-slug-row">
                  <div className="auth-field" style={{ margin: 0 }}>
                    <label htmlFor="np-title" className="auth-field__label">Título *</label>
                    <input
                      id="np-title"
                      type="text"
                      className="auth-field__input"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      onBlur={handleSlugBlur}
                      placeholder="Escribe un título genial…"
                      required
                    />
                  </div>

                  <SlugInput
                    id="np-slug"
                    value={slug}
                    onChange={(val) => {
                      setSlug(val);
                      if (slugWarning) setSlugWarning(null);
                    }}
                    onBlur={handleSlugBlur}
                    warning={slugWarning}
                  />
                </div>

                {/* Opciones de Publicación: Inmediata vs Programada */}
                <div className="auth-field">
                  <label className="auth-field__label">Opciones de Publicación</label>
                  <div className="publish-mode-selector">
                    <div
                      className={`publish-mode-option ${publishMode === "immediate" ? "publish-mode-option--active" : ""}`}
                      onClick={() => setPublishMode("immediate")}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") setPublishMode("immediate"); }}
                    >
                      <span style={{ fontSize: "1.2rem" }}>⚡</span>
                      <div>
                        <div style={{ color: publishMode === "immediate" ? "#00ff66" : "var(--color-text-primary)", fontWeight: "bold" }}>
                          Publicar Inmediatamente
                        </div>
                        <div style={{ fontSize: "0.7rem", color: "var(--color-text-muted)" }}>
                          Fecha asignada automáticamente al presionar publicar
                        </div>
                      </div>
                    </div>

                    <div
                      className={`publish-mode-option ${publishMode === "scheduled" ? "publish-mode-option--active-scheduled" : ""}`}
                      onClick={() => setPublishMode("scheduled")}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") setPublishMode("scheduled"); }}
                    >
                      <span style={{ fontSize: "1.2rem" }}>🗓️</span>
                      <div>
                        <div style={{ color: publishMode === "scheduled" ? "#ffaa00" : "var(--color-text-primary)", fontWeight: "bold" }}>
                          Programar Publicación
                        </div>
                        <div style={{ fontSize: "0.7rem", color: "var(--color-text-muted)" }}>
                          Establecer fecha y hora futuras para su liberación
                        </div>
                      </div>
                    </div>
                  </div>

                  {publishMode === "scheduled" && (
                    <div className="scheduled-date-picker">
                      <label htmlFor="np-scheduled-datetime" className="auth-field__label" style={{ color: "#ffaa00" }}>
                        📅 Fecha y Hora de Liberación Programada *
                      </label>
                      <input
                        id="np-scheduled-datetime"
                        type="datetime-local"
                        className="auth-field__input"
                        style={{ borderColor: "#ffaa00", background: "#161021" }}
                        value={scheduledDateTime}
                        onChange={(e) => setScheduledDateTime(e.target.value)}
                        required={publishMode === "scheduled"}
                      />
                      <small style={{ color: "var(--color-text-muted)", fontSize: "0.75rem", marginTop: "0.2rem" }}>
                        La publicación permanecerá oculta para los visitantes del blog hasta alcanzar esta fecha y hora.
                      </small>
                    </div>
                  )}
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

                {/* Row horizontal flex: Canción del día + Portada de canción */}
                <SongSection
                  song={song}
                  onSongChange={setSong}
                  songCoverMode={songCoverMode}
                  onSongCoverModeChange={setSongCoverMode}
                  songCoverUrl={songCoverUrl}
                  onSongCoverUrlChange={setSongCoverUrl}
                  songCoverFile={songCoverFile}
                  onSongCoverFileChange={setSongCoverFile}
                  existingSongCoverUrl={existingSongCoverUrl}
                  onClearSongCover={() => {
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

                {/* Contenido en Markdown con editor enriquecido */}
                <div className="auth-field">
                  <label htmlFor="np-content" className="auth-field__label">Contenido en Markdown *</label>
                  <MarkdownEditor
                    id="np-content"
                    value={content}
                    onChange={setContent}
                    placeholder="Escribe la entrada en Markdown…"
                    required
                  />
                </div>

                {/* Barra de botones de acción */}
                <PostActionsBar
                  saving={saving}
                  savingDraft={savingDraft}
                  revertingDraft={revertingDraft}
                  deletingDraft={deletingDraft}
                  isEditing={Boolean(editId)}
                  isDraft={Boolean(draftId)}
                  publishLabel={publishMode === "scheduled" ? "★ Programar publicación ★" : undefined}
                  onSaveDraft={handleSaveDraft}
                  onRevertToDraft={handleRevertToDraft}
                  onDeleteDraft={handleDeleteDraft}
                />

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
