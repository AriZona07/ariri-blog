interface SiteHeaderProps {
  /** Título principal del sitio */
  title?: string;
  /** Subtítulo o tagline */
  subtitle?: string;
}

/**
 * SiteHeader — Encabezado global del blog.
 * Acepta título y subtítulo como props para poder reutilizarse en distintos sitios.
 */
export default function SiteHeader({
  title = "aRIRI BLOG",
  subtitle = "videojuegos · manga · punk",
}: SiteHeaderProps) {
  return (
    <header className="site-header" role="banner">
      <h1 className="site-header__title">{title}</h1>
      <p className="site-header__subtitle">{subtitle}</p>
    </header>
  );
}
