interface RoleBadge {
  /** Texto + emoji del badge */
  label: string;
  /** Clase CSS modificadora, e.g. "gaming", "manga" */
  variant: string;
}

interface RoleBadgesWidgetProps {
  /** Lista de badges/etiquetas a mostrar */
  badges?: RoleBadge[];
  /** Título del widget */
  title?: string;
}

/** Badges por defecto de Ariri */
const DEFAULT_BADGES: RoleBadge[] = [
  { label: "🎮 Gaming",           variant: "gaming"        },
  { label: "📖 Manga GL",         variant: "manga"         },
  { label: "🎸 Punk",             variant: "punk"          },
  { label: "🧱 Roblox",           variant: "roblox"        },
  { label: "⛏️ Minecraft",        variant: "minecraft"     },
  { label: "🗡️ Hollow Knight",   variant: "hollow-knight" },
];

/**
 * RoleBadgesWidget — Caja retro con badges/etiquetas de intereses.
 * Genera clases CSS como `role-badge--gaming` a partir del campo `variant`.
 */
export default function RoleBadgesWidget({
  badges = DEFAULT_BADGES,
  title = "✨ Etiquetas",
}: RoleBadgesWidgetProps) {
  return (
    <section aria-label="Intereses y etiquetas">
      <div className="retro-box">
        <div className="retro-box__header">
          <span className="retro-box__title">{title}</span>
        </div>
        <div className="retro-box__body">
          <div className="role-badges">
            {badges.map(({ label, variant }) => (
              <span key={variant} className={`role-badge role-badge--${variant}`}>
                {label}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
