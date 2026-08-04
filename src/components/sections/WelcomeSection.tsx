interface WelcomeSectionProps {
  /** Estado de ánimo actual (opcional) */
  mood?: string;
  /** Canción que se está escuchando (opcional) */
  listening?: string;
}

/**
 * WelcomeSection — Bloque de bienvenida con mood y canción actual.
 * Se muestra al inicio de la página principal.
 */
export default function WelcomeSection({
  mood      = "nostálgica y con café",
  listening = "Paramore - Misery Business",
}: WelcomeSectionProps) {
  return (
    <section aria-label="Bienvenida">
      <div className="retro-box">
        <div className="retro-box__header">
          <span className="retro-box__title">✨ ¡Bienvenidx al blog!</span>
        </div>
        <div className="retro-box__body">
          <p className="welcome-text" style={{ color: "var(--color-text-secondary)" }}>
            Este es mi rincón personal en la web. Escribo sobre videojuegos, manga GL,
            software libre, filosofía anarquista y lo que se me ocurra. ¡Espero que
            encuentres algo que te guste! 🦇✦
          </p>
          <p style={{ marginTop: "0.6rem", fontSize: "var(--fs-xs)", color: "var(--color-text-muted)", fontStyle: "italic" }}>
            <span>💭 Mood actual:</span> <strong>{mood}</strong>
            {" · "}
            <span>🎵 Escuchando:</span> <strong>{listening}</strong>
          </p>
        </div>
      </div>
    </section>
  );
}
