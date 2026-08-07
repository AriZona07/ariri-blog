"use client";

/**
 * PaginationNavWidget — Widget de navegación de paginación estilo manga/ebook (TMO).
 *
 * Controles:
 *   ◀  Página anterior
 *   [input] Escribe un número y presiona Enter para saltar a esa página.
 *           - Solo acepta dígitos (filtra letras y símbolos en tiempo real).
 *           - Al presionar Enter: clamp automático → min 1, max totalPages.
 *   ▶  Página siguiente
 *
 * El input es NO CONTROLADO con key={currentPage}: cuando la página cambia
 * desde los botones ◀/▶, React desmonta y remonta el input reseteando su
 * valor a defaultValue. Sin useState, sin useEffect, sin refs en render.
 */

import { useRef } from "react";

interface PaginationNavWidgetProps {
  /** Página actualmente visible (1-indexed) */
  currentPage:  number;
  /** Total de páginas calculado por el padre */
  totalPages:   number;
  /** Callback para cambiar la página en el padre */
  onPageChange: (page: number) => void;
  /**
   * Prefijo para los IDs del DOM.
   * Cambiarlo cuando haya más de una instancia visible a la vez para evitar IDs duplicados.
   * Por defecto: "pagination".
   */
  idPrefix?: string;
}

export default function PaginationNavWidget({
  currentPage,
  totalPages,
  onPageChange,
  idPrefix = "pagination",
}: PaginationNavWidgetProps) {
  /* Ref para leer el valor del input al presionar Enter (uncontrolled) */
  const inputRef = useRef<HTMLInputElement>(null);

  /** Aplica el clamp de límites y notifica al padre */
  function goToPage(raw: number) {
    let target = raw;
    if (isNaN(target) || target < 1) target = 1;
    if (target > totalPages)         target = totalPages;
    onPageChange(target);
  }

  /** Filtro de entrada: solo dígitos, sin letras ni símbolos */
  function handleInput(e: React.FormEvent<HTMLInputElement>) {
    const el = e.currentTarget;
    el.value = el.value.replace(/\D/g, "");
  }

  /** Al presionar Enter en el campo, navegar a la página indicada */
  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      goToPage(parseInt(e.currentTarget.value, 10));
      e.currentTarget.blur();
    }
  }

  const isFirst = currentPage <= 1;
  const isLast  = currentPage >= totalPages;

  return (
    <nav className="pagination-nav" aria-label="Paginación de posts">

      {/* Botón: página anterior */}
      <button
        id={`${idPrefix}-prev`}
        className={`pagination-nav__btn ${isFirst ? "pagination-nav__btn--disabled" : ""}`}
        onClick={() => goToPage(currentPage - 1)}
        disabled={isFirst}
        aria-label="Página anterior"
        title="Página anterior"
      >
        « Página Anterior
      </button>

      {/* Selector de página: escribe número + Enter */}
      <span className="pagination-nav__info">
        <span className="pagination-nav__selector">
          <input
            key={currentPage}
            ref={inputRef}
            id={`${idPrefix}-page-input`}
            className="pagination-nav__input"
            type="text"
            inputMode="numeric"
            defaultValue={String(currentPage)}
            onInput={handleInput}
            onKeyDown={handleKeyDown}
            aria-label={`Página actual, ${currentPage} de ${totalPages}`}
            title="Escribe el número de página y presiona Enter"
          />
          <span className="pagination-nav__total">/ {totalPages}</span>
        </span>
      </span>

      {/* Botón: página siguiente */}
      <button
        id={`${idPrefix}-next`}
        className={`pagination-nav__btn ${isLast ? "pagination-nav__btn--disabled" : ""}`}
        onClick={() => goToPage(currentPage + 1)}
        disabled={isLast}
        aria-label="Página siguiente"
        title="Página siguiente"
      >
        Página Siguiente »
      </button>

    </nav>
  );
}
