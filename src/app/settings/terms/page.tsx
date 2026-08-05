"use client";

/**
 * /settings/terms/page.tsx — Página de Términos y Condiciones
 *
 * Muestra el documento legal completo en una tarjeta estéticamente adaptada
 * para máxima legibilidad.
 */

import Link from "next/link";
import { TERMS_AND_CONDITIONS_HTML } from "@/lib/terms-html";

export default function TermsPage() {
  return (
    <div className="retro-box">
      <div className="retro-box__header">📜 Términos y Condiciones</div>
      <div className="retro-box__body" style={{ padding: "1.5rem" }}>

        <div style={{ marginBottom: "1.25rem" }}>
          <Link
            href="/settings/account"
            style={{
              fontSize: "0.85rem",
              color: "var(--color-accent-pink)",
              textDecoration: "none",
              display: "inline-flex",
              alignItems: "center",
              gap: "0.4rem",
              fontWeight: 600,
            }}
          >
            ← Volver a Cuenta
          </Link>
        </div>

        {/* Tarjeta de papel oficial para el documento de Términos y Condiciones */}
        <div
          className="terms-paper-container"
          style={{
            background: "#ffffff",
            color: "#111111",
            padding: "2rem 1.5rem",
            borderRadius: "var(--radius-sm)",
            boxShadow: "0 4px 20px rgba(0, 0, 0, 0.5), 0 0 0 2px #000000",
            overflowX: "auto",
          }}
          dangerouslySetInnerHTML={{ __html: TERMS_AND_CONDITIONS_HTML }}
        />

      </div>
    </div>
  );
}
