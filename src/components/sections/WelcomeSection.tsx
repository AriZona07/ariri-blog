import Image from "next/image";

interface WelcomeSectionProps {
  /** Canción que se está escuchando (opcional) */
  listening?: string;
}

/**
  * WelcomeSection — Bloque de bienvenida con canción actual.
  * Se muestra al inicio de la página principal.
  */
export default function WelcomeSection({
  listening = "Muñecas - Dillom",
}: WelcomeSectionProps) {
  return (
    <section aria-label="Bienvenida">
      <div className="retro-box">
        <div className="retro-box__header">
          <span className="retro-box__title">★ ¡Buenas! Bienvenidx a mi blog ★</span>
        </div>
        <div className="retro-box__body">
          <p className="welcome-text" style={{ color: "var(--color-text-secondary)" }}>
            ✦ ¡Bienvenidx a mi Blog :D! Acá vas a encontrar posts sobre Videojuegos, GL/Yuri, 
            y cosas random que se me ocurren en el día. Pásale y ponte cómodx 🦇✦
          </p>
          <div style={{ marginTop: "0.8rem", display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "var(--fs-xs)", color: "var(--color-text-muted)" }}>
            <Image
              src="/dillom_por_cesarea.png"
              alt="Portada Por Cesárea - Dillom"
              width={22}
              height={22}
              style={{ borderRadius: "3px", objectFit: "cover", display: "inline-block" }}
            />
            <span>Escuchando: <strong style={{ color: "var(--color-text-primary)" }}>{listening}</strong></span>
          </div>
        </div>
      </div>
    </section>
  );
}

