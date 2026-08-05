import MusicPlayer from "@/components/MusicPlayer";

interface MusicPlayerWidgetProps {
  /** Título que aparece en el encabezado de la caja retro */
  title?: string;
  /** ID de la playlist de YouTube (requerido) */
  playlistId: string;
}

/**
 * MusicPlayerWidget — Envuelve MusicPlayer dentro de una retro-box.
 * Uso en sidebar:     <MusicPlayerWidget />
 * Uso en publicación: <MusicPlayerWidget playlistId="PLxxxx" title="🎵 Mi playlist" />
 */
export default function MusicPlayerWidget({
  title = "🎵 Now Playing",
  playlistId,
}: MusicPlayerWidgetProps) {
  return (
    <section aria-label="Reproductor de música">
      <div className="retro-box">
        <div className="retro-box__header">
          <span className="retro-box__title">{title}</span>
        </div>
        {/* padding: 0 para que el player ocupe todo el ancho de la caja */}
        <div className="retro-box__body" style={{ padding: 0 }}>
          <MusicPlayer playlistId={playlistId} />
        </div>
      </div>
    </section>
  );
}
