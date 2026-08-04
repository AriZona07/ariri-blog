"use client";

import { useState, useEffect, useRef, useCallback } from "react";

/* ─── Tipos para la IFrame API de YouTube ─────────────────────────────── */

interface YTVideoData {
  title?: string;
  author?: string;
  video_id?: string;
}

interface YTPlayer {
  playVideo: () => void;
  pauseVideo: () => void;
  nextVideo: () => void;
  previousVideo: () => void;
  playVideoAt: (index: number) => void;
  getPlaylist: () => string[];
  getPlaylistIndex: () => number;
  getVideoData: () => YTVideoData;
  destroy: () => void;
}

interface YTEvent {
  target: YTPlayer;
  data?: number;
}

interface YTNamespace {
  Player: new (elementId: string, config: unknown) => YTPlayer;
}

declare global {
  interface Window {
    YT?: YTNamespace;
    onYouTubeIframeAPIReady?: () => void;
  }
}

interface PlaylistItem {
  id: string;
  title: string;
}

/* ─── Props ────────────────────────────────────────────────────────────── */

interface MusicPlayerProps {
  /** ID de la playlist de YouTube que se reproducirá */
  playlistId?: string;
}

/**
 * MusicPlayer — Reproductor de audio retro que usa la IFrame API de YouTube.
 * Renderiza un iframe oculto (solo audio) y expone controles personalizados.
 *
 * @param playlistId - ID de la playlist pública de YouTube (sin "PL" es válido).
 */
export default function MusicPlayer({
  playlistId = "PLb_cyNEBFTVA",
}: MusicPlayerProps) {
  const [isPlaying,      setIsPlaying]      = useState(false);
  const [songTitle,      setSongTitle]      = useState("Cargando lista...");
  const [isReady,        setIsReady]        = useState(false);
  const [playlistTracks, setPlaylistTracks] = useState<PlaylistItem[]>([]);
  const [currentIndex,   setCurrentIndex]   = useState<number>(0);
  const playerRef = useRef<YTPlayer | null>(null);

  /* Actualiza el título y el índice de la canción activa */
  const updateTrackInfo = useCallback((player: YTPlayer | null) => {
    if (!player) return;
    try {
      const videoData = player.getVideoData();
      if (videoData?.title) setSongTitle(videoData.title);
      if (typeof player.getPlaylistIndex === "function") {
        setCurrentIndex(player.getPlaylistIndex());
      }
    } catch {
      setSongTitle("Pista de la lista");
    }
  }, []);

  /* Obtiene los títulos de la playlist vía noembed (no requiere API key) */
  const loadPlaylistTitles = useCallback(async (player: YTPlayer) => {
    try {
      if (typeof player.getPlaylist !== "function") return;
      const ids: string[] = player.getPlaylist() || [];
      if (ids.length === 0) return;

      const items: PlaylistItem[] = await Promise.all(
        ids.map(async (id) => {
          try {
            const res  = await fetch(`https://noembed.com/embed?url=https://www.youtube.com/watch?v=${id}`);
            const data = await res.json();
            return { id, title: data.title || `Pista ${id}` };
          } catch {
            return { id, title: `Pista ${id}` };
          }
        })
      );

      setPlaylistTracks(items);
    } catch (e) {
      console.log("Error al obtener títulos de la lista:", e);
    }
  }, []);

  /* Inicializa el player de YouTube una vez que la API esté lista */
  useEffect(() => {
    // Inyecta el script de la IFrame API si aún no está en el DOM
    if (!window.YT) {
      const tag = document.createElement("script");
      tag.src   = "https://www.youtube.com/iframe_api";
      const firstScript = document.getElementsByTagName("script")[0];
      firstScript?.parentNode?.insertBefore(tag, firstScript);
    }

    const initPlayer = () => {
      if (!window.YT) return;
      playerRef.current = new window.YT.Player("hidden-youtube-player", {
        height: "0",
        width:  "0",
        playerVars: {
          listType: "playlist",
          list:     playlistId,
          autoplay: 0,
          controls: 0,
        },
        events: {
          onReady: (event: YTEvent) => {
            setIsReady(true);
            updateTrackInfo(event.target);
            loadPlaylistTitles(event.target);
          },
          onStateChange: (event: YTEvent) => {
            // YT.PlayerState: PLAYING = 1, PAUSED = 2, ENDED = 0
            if (event.data === 1) {
              setIsPlaying(true);
              updateTrackInfo(event.target);
            } else if (event.data === 2 || event.data === 0) {
              setIsPlaying(false);
            }
          },
        },
      });
    };

    if (window.YT?.Player) {
      initPlayer();
    } else {
      window.onYouTubeIframeAPIReady = initPlayer;
    }

    return () => {
      if (typeof playerRef.current?.destroy === "function") {
        playerRef.current.destroy();
      }
    };
  }, [playlistId, updateTrackInfo, loadPlaylistTitles]);

  /* ─── Controles ──────────────────────────────────────────────────────── */

  const togglePlay = () => {
    if (!playerRef.current || !isReady) return;
    if (isPlaying) {
      playerRef.current.pauseVideo();
    } else {
      playerRef.current.playVideo();
    }
  };

  const nextTrack = () => {
    if (!playerRef.current || !isReady) return;
    playerRef.current.nextVideo();
  };

  const prevTrack = () => {
    if (!playerRef.current || !isReady) return;
    playerRef.current.previousVideo();
  };

  const selectTrack = (index: number) => {
    if (!playerRef.current || !isReady) return;
    playerRef.current.playVideoAt(index);
  };

  /* ─── Render ─────────────────────────────────────────────────────────── */

  return (
    <div className="music-player">
      {/* IFrame de YouTube completamente oculto (solo audio) */}
      <div id="hidden-youtube-player" style={{ display: "none" }} />

      {/* Pantalla LCD retro */}
      <div className="music-player__screen">
        <span className="music-player__marquee">
          {isPlaying
            ? "♪ ♫ Reproduciendo audio de YouTube Music ♫ ♪"
            : "♪ ♫ Pausado — Presiona ▶ para reproducir ♫ ♪"}
        </span>
        <span className="music-player__track">
          {isReady ? songTitle : "Cargando reproductor..."}
        </span>
      </div>

      {/* Botones de control */}
      <div className="music-player__controls">
        <button className="music-player__btn" onClick={prevTrack}  aria-label="Anterior" title="Anterior" disabled={!isReady}>⏮</button>
        <button className="music-player__btn" onClick={togglePlay} aria-label={isPlaying ? "Pausa" : "Reproducir"} title={isPlaying ? "Pausa" : "Play"} disabled={!isReady}>
          {isPlaying ? "⏸" : "▶"}
        </button>
        <button className="music-player__btn" onClick={nextTrack}  aria-label="Siguiente" title="Siguiente" disabled={!isReady}>⏭</button>
      </div>

      {/* Lista de canciones (se muestra cuando la playlist está cargada) */}
      {playlistTracks.length > 0 && (
        <div style={{ marginTop: "0.6rem", borderTop: "1px dashed var(--color-border)", paddingTop: "0.5rem", maxHeight: "150px", overflowY: "auto" }}>
          <ul className="retro-box__list" style={{ gap: "0.25rem" }}>
            {playlistTracks.map((item, idx) => {
              const isCurrent = idx === currentIndex;
              return (
                <li
                  key={item.id + idx}
                  onClick={() => selectTrack(idx)}
                  title={`Reproducir: ${item.title}`}
                  style={{
                    cursor: "pointer",
                    fontSize: "var(--fs-sidebar-detail)",
                    color: isCurrent ? "var(--color-accent-pink)" : "var(--color-text-secondary)",
                    fontWeight: isCurrent ? "bold" : "normal",
                    display: "flex",
                    alignItems: "center",
                    gap: "0.3rem",
                  }}
                >
                  <span>{isCurrent && isPlaying ? "▶" : `${idx + 1}.`}</span>
                  <span style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {item.title}
                  </span>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
