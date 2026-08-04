import MusicPlayer from "@/components/MusicPlayer";

interface MusicPlayerWidgetProps {
  /** Título que aparece en el encabezado de la caja retro */
  title?: string;
}

/**
 * MusicPlayerWidget — Envuelve MusicPlayer dentro de una retro-box.
 * Separa la lógica del reproductor (MusicPlayer) de su presentación en la sidebar.
 */
export default function MusicPlayerWidget({
  title = "🎵 Now Playing",
}: MusicPlayerWidgetProps) {
  return (
    <section aria-label="Reproductor de música">
      <div className="retro-box">
        <div className="retro-box__header">
          <span className="retro-box__title">{title}</span>
        </div>
        {/* padding: 0 para que el player ocupe todo el ancho de la caja */}
        <div className="retro-box__body" style={{ padding: 0 }}>
          <MusicPlayer />
        </div>
      </div>
    </section>
  );
}
