"use client";

import { useEffect, useState } from "react";
import { doc, onSnapshot }    from "firebase/firestore";
import { db }                 from "@/lib/firebase";
import MusicPlayer            from "@/components/MusicPlayer";

interface MusicPlayerWidgetProps {
  /** Título que aparece en el encabezado de la caja retro */
  title?: string;
  /** ID de la playlist de YouTube (opcional: si no se especifica, carga la playlist global de Firestore) */
  playlistId?: string;
}

/**
 * MusicPlayerWidget — Envuelve MusicPlayer dentro de una retro-box.
 * Uso en sidebar:     <MusicPlayerWidget />
 * Uso en publicación: <MusicPlayerWidget playlistId="PLxxxx" title="🎵 Mi playlist" />
 */
export default function MusicPlayerWidget({
  title = "🎵 Now Playing",
  playlistId: explicitPlaylistId,
}: MusicPlayerWidgetProps) {
  const [dynamicPlaylistId, setDynamicPlaylistId] = useState<string>("");

  useEffect(() => {
    // Si se pasa un playlistId explícito como prop, no consultar Firestore
    if (explicitPlaylistId) return;

    const unsub = onSnapshot(
      doc(db, "settings", "music"),
      (snap) => {
        if (snap.exists()) {
          const data = snap.data();
          if (data?.playlistId && typeof data.playlistId === "string") {
            setDynamicPlaylistId(data.playlistId.trim());
          } else {
            setDynamicPlaylistId("");
          }
        } else {
          setDynamicPlaylistId("");
        }
      },
      (err) => {
        console.warn("No se pudo cargar la playlist desde Firestore settings/music:", err);
      }
    );

    return () => unsub();
  }, [explicitPlaylistId]);

  const effectivePlaylistId = explicitPlaylistId || dynamicPlaylistId;

  return (
    <section aria-label="Reproductor de música">
      <div className="retro-box">
        <div className="retro-box__header">
          <span className="retro-box__title">{title}</span>
        </div>
        {/* padding: 0 para que el player ocupe todo el ancho de la caja */}
        <div className="retro-box__body" style={{ padding: effectivePlaylistId ? 0 : "1rem" }}>
          {effectivePlaylistId ? (
            <MusicPlayer key={effectivePlaylistId} playlistId={effectivePlaylistId} />
          ) : (
            <div style={{ textAlign: "center", fontSize: "var(--fs-xs)", color: "var(--color-text-muted)" }}>
              🎵 Sin playlist configurada.
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
