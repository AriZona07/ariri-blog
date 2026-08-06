/**
 * layout.tsx — Layout raíz de la aplicación
 *
 * En Next.js App Router, este archivo envuelve TODAS las páginas del sitio.
 * Los componentes aquí (header, nav, sidebars, footer) aparecen en cada ruta.
 * El contenido específico de cada página llega a través de "children".
 */

import type { Metadata } from "next";
import "@/styles/globals.css";
import "@/styles/auth.css";
import "@/styles/account.css";
import "@/styles/admin.css";
import "@/styles/comments.css";
import "@/styles/notifications.css";

import { AuthProvider }  from "@/lib/auth-context";
import SiteHeader        from "@/components/SiteHeader";
import SiteBody          from "@/components/SiteBody";
import SiteFooter        from "@/components/SiteFooter";

/* Metadatos SEO: title, description, Open Graph y Twitter Card */
export const metadata: Metadata = {
  title: {
    default: "Ariri Blog",
    template: "%s | Ariri Blog",
  },
  description: "Blog personal de Ariri — videojuegos, manga, linux, punk y más. Estética retro de los 2000s.",
  keywords: ["blog", "retro", "linux", "manga", "gaming", "anarquismo", "software libre"],
  manifest: "/site.webmanifest",
  openGraph: {
    title: "Ariri Blog",
    description: "Mi vida y aficiones en un blog retro de los 2000s.",
    url: "https://ariri.app",
    siteName: "ariri.app",
    locale: "es_MX",
    type: "website",
    images: [{ url: "https://ariri.app/og-image.png", width: 1200, height: 630, alt: "Vista previa del Blog de Ariri" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Ariri Blog",
    description: "Mi vida y aficiones en un blog retro de los 2000s.",
    images: ["https://ariri.app/og-image.png"],
  },
};

interface RootLayoutProps {
  children: React.ReactNode;
}

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="es" data-scroll-behavior="smooth">
      <head>
        {/* Autodescubrimiento del feed RSS para lectores y agregadores */}
        <link
          rel="alternate"
          type="application/rss+xml"
          title="Ariri Blog — Feed RSS"
          href="/feed.xml"
        />
      </head>
      <body>
        {/* AuthProvider provee el estado de sesión a todo el árbol de componentes */}
        <AuthProvider>
          <div className="page-wrapper">

            <SiteHeader />

            {/* Layout dinámico de columnas: adaptativo en rutas /settings/* */}
            <SiteBody>
              {children}
            </SiteBody>

            <SiteFooter />

          </div>
        </AuthProvider>
      </body>
    </html>
  );
}
