import type { Metadata } from "next";
import '@/styles/globals.css';

export const metadata: Metadata = {
  // Metadatos básicos de la página
  title: "Blog de Ariri",
  description: "Blog de Ariri",

  // Conexión con el archivo manifest de tu favicon
  manifest: '/site.webmanifest',

  // --- CONFIGURACIÓN DE OPEN GRAPH ---
  openGraph: {
    title: 'Blog de Ariri', // Título que se muestra en la tarjeta
    description: 'Mi vida y aficiones en un blog retro.', // Descripción corta
    url: 'https://ariri.app', // URL canónica de tu sitio
    siteName: 'ariri.app', // Nombre de la marca o sitio web
    locale: 'es_MX', // Idioma y región (ej. español)
    type: 'website', // Tipo de contenido (usualmente 'website' o 'article')
    
    // Lista de imágenes para la vista previa al compartir el enlace
    images: [
      {
        url: 'https://ariri.app/og-image.png', // Debe ser la ruta absoluta a tu imagen
        width: 1200, // Ancho recomendado por el estándar
        height: 630, // Alto recomendado por el estándar
        alt: 'Vista previa del Blog de Ariri',
      },
    ],
  },

  // --- CONFIGURACIÓN EXTRA PARA TWITTER / X ---
  twitter: {
    card: 'summary_large_image', // Muestra una tarjeta grande con imagen arriba
    title: 'Blog de Ariri',
    description: 'Mi vida y aficiones en un blog retro.',
    images: ['https://ariri.app/og-image.png'],
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
