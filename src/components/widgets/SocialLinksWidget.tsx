interface SocialLink {
  href: string;
  icon: string;
  label: string;
}

interface SocialLinksWidgetProps {
  /** Lista de redes sociales a mostrar */
  links?: SocialLink[];
  /** Título del widget */
  title?: string;
}

/** Redes sociales por defecto de Ariri */
const DEFAULT_LINKS: SocialLink[] = [
  { href: "https://www.instagram.com/safos.arianna/",           icon: "📸", label: "Instagram" },
  { href: "https://www.tiktok.com/@safos.arianna",              icon: "📱", label: "TikTok"    },
  { href: "https://mx.pinterest.com/safos_arianna/",            icon: "📌", label: "Pinterest" },
  { href: "https://open.spotify.com/user/qw3p144mgwlaf453m5gir7wum?si=f905c64b87104786", icon: "🎧", label: "Spotify" },
  { href: "https://discord.gg/AaVASS2ZRQ",                      icon: "💬", label: "Discord"   },
  { href: "https://www.roblox.com/es/users/2039938641/profile", icon: "🧱", label: "Roblox"    },
  { href: "https://steamcommunity.com/id/fernandaaa07/",        icon: "🎮", label: "Steam"     },
  { href: "https://github.com/AriZona07",                       icon: "🐙", label: "GitHub"    },
];

/**
 * SocialLinksWidget — Caja retro con lista de enlaces a redes sociales.
 * Acepta un array de links personalizado para poder reutilizarse en otros blogs.
 */
export default function SocialLinksWidget({
  links = DEFAULT_LINKS,
  title = "🌐 Redes",
}: SocialLinksWidgetProps) {
  return (
    <section aria-label="Redes sociales">
      <div className="retro-box">
        <div className="retro-box__header">
          <span className="retro-box__title">{title}</span>
        </div>
        <div className="retro-box__body">
          <nav aria-label="Redes sociales">
            <ul className="social-links" role="list">
              {links.map(({ href, icon, label }) => (
                <li key={label}>
                  <a
                    href={href}
                    className="social-link"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <span className="social-link__icon">{icon}</span>
                    {label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      </div>
    </section>
  );
}
