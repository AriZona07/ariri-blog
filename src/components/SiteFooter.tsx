interface SiteFooterProps {
  /** Texto del enlace al repositorio */
  repoLabel?: string;
  /** URL del repositorio */
  repoHref?: string;
}

/**
 * SiteFooter — Pie de página global del blog.
 * Muestra un enlace al repositorio de código fuente.
 */
export default function SiteFooter({
  repoLabel = "GitHub 🐙",
  repoHref = "https://github.com/AriZona07/ariri-blog",
}: SiteFooterProps) {
  return (
    <footer className="site-footer" role="contentinfo">
      <p className="site-footer__text">
        Código fuente en{" "}
        <a href={repoHref} target="_blank" rel="noopener noreferrer">
          {repoLabel}
        </a>
      </p>
    </footer>
  );
}
