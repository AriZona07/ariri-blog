interface PaginationNavProps {
  /** Página actual */
  currentPage?: number;
  /** Total de páginas */
  totalPages?: number;
}

/**
 * PaginationNav — Navegación de paginación entre páginas de posts.
 * Placeholder estático hasta que haya suficientes posts para paginar.
 */
export default function PaginationNav({
  currentPage = 1,
  totalPages  = 1,
}: PaginationNavProps) {
  return (
    <nav aria-label="Paginación de posts" style={{ textAlign: "center", paddingBottom: "1rem" }}>
      <p style={{ fontSize: "var(--fs-sm)", color: "var(--color-text-muted)", fontStyle: "italic" }}>
        — Página {currentPage} de {totalPages} · Más posts próximamente —
      </p>
    </nav>
  );
}
