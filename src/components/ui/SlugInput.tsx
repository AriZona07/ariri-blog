"use client";

/**
 * SlugInput.tsx — Campo de entrada para slugs de URL permalink con sanitización estricta.
 *
 * Ubicación: src/components/ui/SlugInput.tsx
 *
 * Reglas de sanitización:
 * - Todo en minúsculas (a-z)
 * - Conserva dígitos numéricos (0-9)
 * - Convierte espacios en guiones (-)
 * - Remueve acentos y diacríticos (á -> a, ñ -> n)
 * - Elimina símbolos especiales (@, !, #, $, %, etc.)
 * - Colapsa guiones consecutivos
 */

/**
 * Sanitiza un string para formatearlo automáticamente como slug.
 */
export function sanitizeSlug(input: string): string {
  return input
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-");
}

interface SlugInputProps {
  id?:          string;
  value:        string;
  onChange:     (val: string) => void;
  onBlur?:      () => void;
  warning?:     string | null;
  placeholder?: string;
}

export default function SlugInput({
  id = "np-slug",
  value,
  onChange,
  onBlur,
  warning,
  placeholder = "ej: mi-nuevo-post (opcional, se auto-genera si se omite)",
}: SlugInputProps) {
  return (
    <div className="auth-field" style={{ margin: 0 }}>
      <label htmlFor={id} className="auth-field__label">
        Slug manual (URL permalink)
      </label>
      <input
        id={id}
        type="text"
        className="auth-field__input"
        value={value}
        onChange={(e) => onChange(sanitizeSlug(e.target.value))}
        onBlur={onBlur}
        placeholder={placeholder}
      />
      <span style={{ fontSize: "0.7rem", color: "var(--color-text-muted)", marginTop: "0.25rem", display: "block" }}>
        Formato automático: minúsculas, números (0-9), espacios como &quot;-&quot;, sin acentos ni símbolos especiales.
      </span>
      {warning && (
        <p style={{ color: "#ffff00", fontSize: "var(--fs-xs)", marginTop: "0.3rem" }}>
          {warning}
        </p>
      )}
    </div>
  );
}
