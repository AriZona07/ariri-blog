"use client";

import { useState, useEffect, useRef, useCallback, useId } from "react";
import Image from "next/image";

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
  setVolume: (volume: number) => void;
  setLoop: (loopPlaylists: boolean) => void;
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

type LoopMode = "none" | "playlist" | "track";

/* ─── Props ────────────────────────────────────────────────────────────── */

interface MusicPlayerProps {
  /** ID de la playlist de YouTube que se reproducirá (requerido) */
  playlistId: string;
}

/**
 * MusicPlayer — Reproductor de audio retro que usa la IFrame API de YouTube.
 * Renderiza un iframe oculto (solo audio) y expone controles personalizados.
 *
 * @param playlistId - ID de la playlist pública de YouTube.
 *   Cada instancia puede tener su propia playlist pasándola como prop.
 */
export default function MusicPlayer({
  playlistId,
}: MusicPlayerProps) {
  const uid = useId(); // ID único por instancia — evita colisiones si hay 2 widgets en la misma página
  const playerId = `yt-player-${uid.replace(/:/g, "")}`;

  const [isPlaying,      setIsPlaying]      = useState(false);
  const [songTitle,      setSongTitle]      = useState("Cargando lista...");
  const [isReady,        setIsReady]        = useState(false);
  const [playlistTracks, setPlaylistTracks] = useState<PlaylistItem[]>([]);
  const [currentIndex,   setCurrentIndex]   = useState<number>(0);

  // Controles de playback extra
  const [volume,       setVolume]       = useState<number>(50);
  const [loopMode,     setLoopMode]     = useState<LoopMode>("none");
  const [isShuffled,   setIsShuffled]   = useState<boolean>(false);
  const [shuffleOrder,  setShuffleOrder]  = useState<number[]>([]);
  const [thumbnailUrl,  setThumbnailUrl]  = useState<string>("");

  const playerRef = useRef<YTPlayer | null>(null);

  /* ─── Helpers ─────────────────────────────────────────────────────────── */

  /** Genera un orden aleatorio con el algoritmo Fisher-Yates */
  const buildShuffleOrder = (length: number, startIndex: number): number[] => {
    const order = Array.from({ length }, (_, i) => i);
    for (let i = order.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [order[i], order[j]] = [order[j], order[i]];
    }
    // Mueve el índice actual al frente para que la canción actual siga sonando
    const pos = order.indexOf(startIndex);
    if (pos !== -1) {
      order.splice(pos, 1);
      order.unshift(startIndex);
    }
    return order;
  };

  /* Actualiza el título, índice y portada de la canción activa */
  const updateTrackInfo = useCallback((player: YTPlayer | null) => {
    if (!player) return;
    try {
      const videoData = player.getVideoData();
      if (videoData?.title) setSongTitle(videoData.title);
      // Thumbnail de YouTube: URL pública, no requiere API key
      if (videoData?.video_id) {
        setThumbnailUrl(`https://img.youtube.com/vi/${videoData.video_id}/mqdefault.jpg`);
      }
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

  /* ─── Inicialización del player ───────────────────────────────────────── */

  useEffect(() => {
    if (!window.YT) {
      const tag = document.createElement("script");
      tag.src   = "https://www.youtube.com/iframe_api";
      const firstScript = document.getElementsByTagName("script")[0];
      firstScript?.parentNode?.insertBefore(tag, firstScript);
    }

    const initPlayer = () => {
      if (!window.YT) return;
      playerRef.current = new window.YT.Player(playerId, {
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
            event.target.setVolume(50); // volumen inicial
            updateTrackInfo(event.target);
            loadPlaylistTitles(event.target);
          },
          onStateChange: (event: YTEvent) => {
            // YT.PlayerState: PLAYING = 1, PAUSED = 2, ENDED = 0
            if (event.data === 1) {
              setIsPlaying(true);
              updateTrackInfo(event.target);
              // Notifica a otras instancias del widget para que se pausen
              window.dispatchEvent(
                new CustomEvent("music-player:activated", { detail: { id: playerId } })
              );
            } else if (event.data === 2) {
              setIsPlaying(false);
            } else if (event.data === 0) {
              // Canción terminó — loop de track se gestiona aquí
              setIsPlaying(false);
              setLoopMode((currentLoop) => {
                if (currentLoop === "track") {
                  setCurrentIndex((ci) => {
                    event.target.playVideoAt(ci);
                    return ci;
                  });
                }
                return currentLoop;
              });
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
  // playerId es estable por useId, no necesita ser dependencia
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playlistId, updateTrackInfo, loadPlaylistTitles]);

  /* Sincroniza el loop de playlist con la API de YouTube */
  useEffect(() => {
    if (!playerRef.current || !isReady) return;
    playerRef.current.setLoop(loopMode === "playlist");
  }, [loopMode, isReady]);

  /*
   * Reproducción exclusiva: si otro player emite 'music-player:activated'
   * con un ID distinto al propio, este player se pausa automáticamente.
   * Así nunca pueden sonar dos reproductores al mismo tiempo.
   */
  useEffect(() => {
    const handleOtherActivated = (e: Event) => {
      const { id } = (e as CustomEvent<{ id: string }>).detail;
      if (id !== playerId && playerRef.current) {
        playerRef.current.pauseVideo();
      }
    };
    window.addEventListener("music-player:activated", handleOtherActivated);
    return () => window.removeEventListener("music-player:activated", handleOtherActivated);
  }, [playerId]);

  /* ─── Controles ───────────────────────────────────────────────────────── */

  const togglePlay = () => {
    if (!playerRef.current || !isReady) return;
    if (isPlaying) {
      playerRef.current.pauseVideo();
    } else {
      playerRef.current.playVideo();
    }
  };

  /**
   * Avanza a la siguiente pista.
   * Si shuffle está activo, sigue el shuffleOrder oculto sin alterar la lista visual.
   */
  const nextTrack = () => {
    if (!playerRef.current || !isReady) return;
    if (isShuffled && shuffleOrder.length > 0) {
      const pos     = shuffleOrder.indexOf(currentIndex);
      const nextPos = (pos + 1) % shuffleOrder.length;
      playerRef.current.playVideoAt(shuffleOrder[nextPos]);
    } else {
      playerRef.current.nextVideo();
    }
  };

  const prevTrack = () => {
    if (!playerRef.current || !isReady) return;
    if (isShuffled && shuffleOrder.length > 0) {
      const pos     = shuffleOrder.indexOf(currentIndex);
      const prevPos = (pos - 1 + shuffleOrder.length) % shuffleOrder.length;
      playerRef.current.playVideoAt(shuffleOrder[prevPos]);
    } else {
      playerRef.current.previousVideo();
    }
  };

  const selectTrack = (index: number) => {
    if (!playerRef.current || !isReady) return;
    playerRef.current.playVideoAt(index);
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = Number(e.target.value);
    setVolume(val);
    playerRef.current?.setVolume(val);
  };

  /** Cicla entre los modos de loop: none → playlist → track → none */
  const cycleLoopMode = () => {
    setLoopMode((prev) => {
      if (prev === "none")     return "playlist";
      if (prev === "playlist") return "track";
      return "none";
    });
  };

  /** Activa o desactiva shuffle. Al activar, construye el orden oculto. */
  const toggleShuffle = () => {
    setIsShuffled((prev) => {
      if (!prev && playlistTracks.length > 0) {
        setShuffleOrder(buildShuffleOrder(playlistTracks.length, currentIndex));
      }
      return !prev;
    });
  };

  /* Etiquetas de estado para el botón de loop */
  const loopLabel =
    loopMode === "none"     ? "🔁" :
    loopMode === "playlist" ? "🔁" : "🔂";

  const loopTitle =
    loopMode === "none"     ? "Loop: Desactivado" :
    loopMode === "playlist" ? "Loop: Playlist"    : "Loop: Canción";

  /* ─── Render ─────────────────────────────────────────────────────────── */

  return (
    <div className="music-player">
      {/* IFrame de YouTube completamente oculto (solo audio) */}
      <div id={playerId} style={{ display: "none" }} />

      {/* Pantalla LCD retro */}
      <div className="music-player__screen">
        {/* Portada de la canción — se actualiza en cada cambio de pista */}
        {thumbnailUrl && (
          <div className="music-player__thumb">
            <Image src={thumbnailUrl} alt={songTitle} width={120} height={90} unoptimized />
          </div>
        )}
        {/* Estado y título de la pista */}
        <div className="music-player__screen-text">
          <span className="music-player__marquee">
            {isPlaying
              ? "♪ ♫ Reproduciendo audio de YouTube Music ♫ ♪"
              : "♪ ♫ Pausado — Presiona ▶ para reproducir ♫ ♪"}
          </span>
          <span className="music-player__track">
            {isReady ? songTitle : "Cargando reproductor..."}
          </span>
        </div>
      </div>

      {/* Botones de control */}
      <div className="music-player__controls">
        {/* Shuffle */}
        <button
          className={`music-player__mode-btn${isShuffled ? " music-player__mode-btn--active" : ""}`}
          onClick={toggleShuffle}
          aria-label="Aleatorio"
          title={isShuffled ? "Aleatorio: Activado" : "Aleatorio: Desactivado"}
          disabled={!isReady}
        >
          🔀
        </button>

        <button className="music-player__btn" onClick={prevTrack}  aria-label="Anterior"  title="Anterior"  disabled={!isReady}>⏮</button>
        <button className="music-player__btn" onClick={togglePlay} aria-label={isPlaying ? "Pausa" : "Reproducir"} title={isPlaying ? "Pausa" : "Play"} disabled={!isReady}>
          {isPlaying ? "⏸" : "▶"}
        </button>
        <button className="music-player__btn" onClick={nextTrack}  aria-label="Siguiente" title="Siguiente" disabled={!isReady}>⏭</button>

        {/* Loop — cicla entre none / playlist / track */}
        <button
          className={`music-player__mode-btn${loopMode !== "none" ? " music-player__mode-btn--active" : ""}`}
          onClick={cycleLoopMode}
          aria-label={loopTitle}
          title={loopTitle}
          disabled={!isReady}
        >
          {loopLabel}
          {/* Superíndice "1" cuando el loop es de canción individual */}
          {loopMode === "track" && <sup style={{ fontSize: "0.55rem", lineHeight: 1 }}>1</sup>}
        </button>
      </div>

      {/* Barra de volumen */}
      <div className="music-player__volume">
        <span className="music-player__volume-icon" aria-hidden="true">
          {volume === 0 ? "🔇" : volume < 50 ? "🔉" : "🔊"}
        </span>
        <input
          id={`${playerId}-volume`}
          className="music-player__volume-slider"
          type="range"
          min={0}
          max={100}
          value={volume}
          onChange={handleVolumeChange}
          aria-label="Volumen"
          disabled={!isReady}
        />
        <span className="music-player__volume-value">{volume}</span>
      </div>

      {/* Lista de canciones */}
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
