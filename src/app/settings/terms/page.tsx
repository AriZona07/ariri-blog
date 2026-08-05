"use client";

/**
 * /settings/terms/page.tsx — Página de Términos y Condiciones
 *
 * Estructura limpia preparada para agregar los términos en el futuro.
 */

import Link from "next/link";

export default function TermsPage() {
  return (
    <div className="retro-box">
      <div className="retro-box__header">📜 Términos y Condiciones</div>
      <div className="retro-box__body" style={{ padding: "1.5rem" }}>

        <div style={{ marginBottom: "1.25rem" }}>
          <Link
            href="/settings/account"
            style={{
              fontSize: "0.8rem",
              color: "var(--color-text-muted)",
              textDecoration: "none",
              display: "inline-flex",
              alignItems: "center",
              gap: "0.4rem",
            }}
          >
            ← Volver a Cuenta
          </Link>
        </div>

        <h2 style={{
          color: "var(--color-accent-pink)",
          fontSize: "1.2rem",
          marginBottom: "1rem",
          fontFamily: "var(--font-main)",
        }}>
          📜 Términos y Condiciones de Uso
        </h2>

        <div className="terms-content" style={{
          fontSize: "0.9rem",
          color: "var(--color-text-secondary)",
          lineHeight: "1.6",
          border: "1px dashed var(--color-border)",
          padding: "1.25rem",
          borderRadius: "var(--radius-sm)",
          background: "rgba(0, 0, 0, 0.2)",
        }}>
          <p>
            <em>Sección preparada. Próximamente se detallarán los términos y condiciones de uso del blog.</em>
          </p>
        </div>

      </div>
    </div>
  );
}
