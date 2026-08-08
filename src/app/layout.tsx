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
import "@/styles/uploader.css";

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
  description: "Blog personal de Ariri — Vida personal, reseñas a mangas y series. Estética retro de los 2000s.",
  keywords: ["blog", "retro", "manga", "anime", "musica", "reseñas", "red social", "personal", "Arianna Torres", "Ariri"],
  manifest: "/site.webmanifest",
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/icons/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
      { url: '/icons/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/icons/android-chrome-192x192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icons/android-chrome-512x512.png', sizes: '512x512', type: 'image/png' }
    ],
    shortcut: '/favicon.ico',
    apple: [
      { url: '/icons/apple-touch-icon.png', sizes: '180x180', type: 'image/png' }
    ]
  },
  openGraph: {
    title: "Ariri Blog",
    description: "Mi vida y aficiones en un blog retro de los 2000s.",
    url: "https://ariri.app",
    siteName: "Ariri Blog | Expresandome a las 3am",
    locale: "es_MX",
    type: "website",
    images: [{ url: "https://ariri.app/banners/og-image.png", width: 1200, height: 630, alt: "Vista previa del Blog de Ariri" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Ariri Blog | Expresandome a las 3am",
    description: "Mi vida y aficiones en un blog retro de los 2000s.",
    images: ["https://ariri.app/banners/og-image.png"],
  },
};

interface RootLayoutProps {
  children: React.ReactNode;
}

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="es" data-scroll-behavior="smooth" suppressHydrationWarning>
      <head>
        {/* Autodescubrimiento del feed RSS para lectores y agregadores */}
        <link
          rel="alternate"
          type="application/rss+xml"
          title="Ariri Blog — Feed RSS"
          href="/feed.xml"
        />
        {/* Esquema de datos estructurados JSON-LD para definir 'Ariri Blog' como Nombre de Sitio oficial en Google */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebSite",
              "name": "Ariri Blog",
              "alternateName": ["ariri.app"],
              "url": "https://ariri.app"
            })
          }}
        />
      </head>
      <body suppressHydrationWarning>
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
