"use client";

/**
 * /settings/admin/page.tsx — Panel de administración integrado en la sección de Ajustes (/settings/admin)
 *
 * Protección:
 *   - Lado cliente: si no hay sesión o isAdmin es false, redirige a "/".
 *   - Lado servidor: Firestore Security Rules previenen modificaciones no autorizadas.
 *
 * Permite gestionar publicaciones de Firestore y abrir el popup modal de borradores guardados.
 */

import { useEffect, useState } from "react";
import { useRouter }           from "next/navigation";
import Link                    from "next/link";
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  getDoc,
  setDoc,
  addDoc,
  deleteDoc,
  doc,
  serverTimestamp,
  type DocumentData,
} from "firebase/firestore";
import { db }                       from "@/lib/firebase";
import { useAuth }                  from "@/lib/auth-context";
import { extractYouTubePlaylistId } from "@/lib/youtube";

interface FirestorePost {
  id:    string;
  title: string;
  date:  string;
  slug:  string;
}

interface FirestoreDraft {
  id:      string;
  title:   string;
  savedAt: string;
}

export default function SettingsAdminPage() {
  const { user, isAdmin, loading } = useAuth();
  const router = useRouter();

  const [posts,          setPosts]          = useState<FirestorePost[]>([]);
  const [drafts,         setDrafts]         = useState<FirestoreDraft[]>([]);
  const [fetching,       setFetching]       = useState(true);
  const [draftsOpen,     setDraftsOpen]     = useState(false);
  const [fetchingDrafts, setFetchingDrafts] = useState(true);
  const [actionError,    setActionError]    = useState<string | null>(null);

  // Estado para la playlist del widget MP3
  const [musicPlaylistInput, setMusicPlaylistInput] = useState("");
  const [musicPlaylistId,    setMusicPlaylistId]    = useState("");
  const [savingMusic,        setSavingMusic]        = useState(false);
  const [musicSuccess,       setMusicSuccess]       = useState<string | null>(null);
  const [musicError,         setMusicError]         = useState<string | null>(null);

  /* Redirección de seguridad lado cliente */
  useEffect(() => {
    if (!loading && (!user || !isAdmin)) {
      router.replace("/");
    }
  }, [user, isAdmin, loading, router]);

  /* Suscripción en tiempo real a la configuración de la playlist de música */
  useEffect(() => {
    if (!isAdmin) return;
    const unsub = onSnapshot(doc(db, "settings", "music"), (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        if (data?.playlistUrl) setMusicPlaylistInput(data.playlistUrl);
        if (data?.playlistId)  setMusicPlaylistId(data.playlistId);
      }
    });
    return () => unsub();
  }, [isAdmin]);

  /* Suscripción a colección posts */
  useEffect(() => {
    if (!isAdmin) return;

    const q = query(collection(db, "posts"), orderBy("date", "desc"));
    const unsub = onSnapshot(q, (snap) => {
      const data: FirestorePost[] = snap.docs.map((doc: DocumentData) => ({
        id:    doc.id,
        title: doc.data().title ?? "(Sin título)",
        date:  doc.data().date  ?? "",
        slug:  doc.data().slug  ?? doc.id,
      }));
      setPosts(data);
      setFetching(false);
    });

    return () => unsub();
  }, [isAdmin]);

  /* Suscripción a colección drafts */
  useEffect(() => {
    if (!isAdmin) return;

    const q = query(collection(db, "drafts"), orderBy("savedAt", "desc"));
    const unsub = onSnapshot(q, (snap) => {
      const data: FirestoreDraft[] = snap.docs.map((doc: DocumentData) => {
        const ts = doc.data().savedAt;
        let dateStr = "";
        if (ts && typeof ts.toDate === "function") {
          dateStr = ts.toDate().toLocaleDateString("es-MX", {
            day: "2-digit", month: "short", year: "numeric",
          });
        }
        return {
          id:      doc.id,
          title:   doc.data().title ?? "(Sin título)",
          savedAt: dateStr,
        };
      });
      setDrafts(data);
      setFetchingDrafts(false);
    });

    return () => unsub();
  }, [isAdmin]);

  /* Cierre modal borradores con Escape */
  useEffect(() => {
    if (!draftsOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") setDraftsOpen(false);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [draftsOpen]);

  /* Mover un post publicado a la colección de borradores */
  async function handleMoveToDraft(postId: string) {
    if (!window.confirm("¿Regresar esta publicación a borradores? Se despublicará del blog hasta que la vuelvas a publicar.")) return;

    setActionError(null);
    try {
      const postRef = doc(db, "posts", postId);
      const snap = await getDoc(postRef);
      if (!snap.exists()) {
        setActionError("No se encontró la publicación en Firestore.");
        return;
      }

      const postData = snap.data();
      const draftRef = await addDoc(collection(db, "drafts"), {
        ...postData,
        authorUid: user?.uid ?? "",
        savedAt:   serverTimestamp(),
      });

      await deleteDoc(postRef);
      router.push(`/settings/admin/new-post?draft=${draftRef.id}`);
    } catch (err: unknown) {
      console.error("Error al trasladar publicación a borrador:", err);
      setActionError("Ocurrió un error al regresar la publicación a borrador.");
    }
  }

  /* Guardar nueva playlist de YouTube en Firestore */
  async function handleSaveMusicPlaylist(e: React.FormEvent) {
    e.preventDefault();
    setSavingMusic(true);
    setMusicSuccess(null);
    setMusicError(null);

    const extractedId = extractYouTubePlaylistId(musicPlaylistInput);

    if (!extractedId) {
      setMusicError("Enlace de playlist de YouTube no válido. Por favor ingresa una URL o ID válido (ej. https://www.youtube.com/playlist?list=PL...).");
      setSavingMusic(false);
      return;
    }

    try {
      await setDoc(doc(db, "settings", "music"), {
        playlistUrl: musicPlaylistInput.trim(),
        playlistId:  extractedId,
        updatedAt:   serverTimestamp(),
      }, { merge: true });

      setMusicPlaylistId(extractedId);
      setMusicSuccess("Playlist del reproductor MP3 actualizada correctamente.");
    } catch (err) {
      console.error("Error al guardar la playlist en Firestore:", err);
      setMusicError("No se pudo guardar la playlist en Firestore. Revisa las reglas de seguridad.");
    } finally {
      setSavingMusic(false);
    }
  }

  if (loading || (!loading && !isAdmin)) {
    return (
      <div className="retro-box">
        <div className="retro-box__header">Panel Admin</div>
        <div className="admin-access-denied">
          <span className="admin-access-denied__icon">🚫</span>
          Acceso denegado. Redirigiendo…
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="retro-box">
        <div className="retro-box__header">⚙ Panel de Administración</div>
        <div className="retro-box__body">
          <div className="admin-page">

            {/* --- Sección: Playlist del Reproductor MP3 --- */}
            <div className="admin-music-card">
              <h3 className="admin-music-card__title">🎵 Playlist del Reproductor MP3 (Sidebar)</h3>
              <p className="admin-music-card__desc">
                Pega aquí el enlace o ID de la playlist de YouTube para actualizar la música de la barra lateral en todo el blog.
              </p>

              {musicSuccess && <p className="account-success" role="status" style={{ marginBottom: "0.8rem" }}>{musicSuccess}</p>}
              {musicError   && <p className="auth-error"      role="alert"  style={{ marginBottom: "0.8rem" }}>{musicError}</p>}

              <form onSubmit={handleSaveMusicPlaylist} className="admin-music-card__form">
                <div className="admin-music-card__row">
                  <input
                    type="text"
                    className="auth-field__input"
                    style={{ flex: 1 }}
                    value={musicPlaylistInput}
                    onChange={(e) => setMusicPlaylistInput(e.target.value)}
                    placeholder="https://www.youtube.com/playlist?list=PL..."
                    id="admin-music-playlist-input"
                  />
                  <button
                    type="submit"
                    className="admin-btn-new"
                    disabled={savingMusic || !musicPlaylistInput.trim()}
                    id="admin-save-music-btn"
                  >
                    {savingMusic ? "Guardando…" : "Guardar Playlist"}
                  </button>
                </div>
                {musicPlaylistId && (
                  <p style={{ fontSize: "var(--fs-xs)", color: "#00ff66", margin: "0.2rem 0 0 0" }}>
                    ✔ Playlist activa actualmente: <strong>{musicPlaylistId}</strong>
                  </p>
                )}
              </form>
            </div>

            <div className="admin-page__header">
              <h2 className="admin-page__title">Posts en Firestore</h2>

              <div style={{ display: "flex", gap: "0.6rem", alignItems: "center", flexWrap: "wrap" }}>
                <button
                  className="admin-btn-drafts"
                  id="admin-drafts-btn"
                  onClick={() => setDraftsOpen(true)}
                  aria-label="Ver borradores guardados"
                >
                  📄 Borradores
                  {drafts.length > 0 && (
                    <span className="admin-btn-drafts__badge">{drafts.length}</span>
                  )}
                </button>

                <Link href="/settings/admin/new-post" className="admin-btn-new" id="admin-new-post-link">
                  + Nuevo post
                </Link>
              </div>
            </div>

            {actionError && (
              <p className="auth-error" style={{ marginBottom: "1rem" }} role="alert">
                {actionError}
              </p>
            )}

            {fetching ? (
              <p className="admin-empty">Cargando posts…</p>
            ) : posts.length === 0 ? (
              <p className="admin-empty">
                No hay posts publicados aún. ¡Crea el primero!
              </p>
            ) : (
              <div className="admin-post-list">
                {posts.map((post) => (
                  <div key={post.id} className="admin-post-item">
                    <span className="admin-post-item__title">{post.title}</span>
                    <span className="admin-post-item__date">{post.date}</span>

                    <div className="admin-post-item__actions">
                      <Link
                        href={`/settings/admin/new-post?edit=${post.id}`}
                        className="admin-btn-action-edit"
                        title="Editar este post"
                      >
                        ✏️ Editar
                      </Link>

                      <button
                        type="button"
                        className="admin-btn-action-draft"
                        title="Regresar post a borradores"
                        onClick={() => handleMoveToDraft(post.id)}
                      >
                        ↩️ A borrador
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

          </div>
        </div>
      </div>

      {/* Modal popup de lista de borradores */}
      {draftsOpen && (
        <div
          className="drafts-modal-overlay"
          onClick={(e) => { if (e.target === e.currentTarget) setDraftsOpen(false); }}
          role="dialog"
          aria-modal="true"
          aria-label="Lista de borradores"
        >
          <div className="drafts-modal">
            <div className="drafts-modal__header">
              <span className="drafts-modal__title">📄 Borradores</span>
              <button
                className="drafts-modal__close"
                onClick={() => setDraftsOpen(false)}
                aria-label="Cerrar popup de borradores"
              >
                ✕
              </button>
            </div>

            <div className="drafts-modal__body">
              {fetchingDrafts ? (
                <p className="drafts-modal__empty">Cargando borradores…</p>
              ) : drafts.length === 0 ? (
                <p className="drafts-modal__empty">
                  ✏️ No hay borradores guardados.
                  <br />
                  <small>Al crear o editar un post, usa &quot;Guardar borrador&quot; para continuar después.</small>
                </p>
              ) : (
                drafts.map((draft) => (
                  <div
                    key={draft.id}
                    className="draft-item"
                    role="button"
                    tabIndex={0}
                    onClick={() => {
                      setDraftsOpen(false);
                      router.push(`/settings/admin/new-post?draft=${draft.id}`);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        setDraftsOpen(false);
                        router.push(`/settings/admin/new-post?draft=${draft.id}`);
                      }
                    }}
                  >
                    <span className="draft-item__title">{draft.title || "(Sin título)"}</span>
                    <div className="draft-item__meta">
                      {draft.savedAt && (
                        <span className="draft-item__date">{draft.savedAt}</span>
                      )}
                      <span className="draft-item__badge">BORRADOR</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
