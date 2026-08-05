/** @type {import('next').NextConfig} */
const nextConfig = {
  // Se eliminó `output: 'export'` para habilitar Route Handlers (RSS dinámico)
  // y SSR parcial en Vercel. En desarrollo local sigue funcionando con `next dev`.
  images: {
    // Dominios permitidos para Next/Image (Firebase Storage + avatars externos de cualquier origen)
    remotePatterns: [
      { protocol: "https", hostname: "**" },
      { protocol: "http", hostname: "**" },
    ],
  },
};

export default nextConfig;