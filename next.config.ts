/** @type {import('next').NextConfig} */
const nextConfig = {
  // Se eliminó `output: 'export'` para habilitar Route Handlers (RSS dinámico)
  // y SSR parcial en Vercel. En desarrollo local sigue funcionando con `next dev`.
  images: {
    // Dominios permitidos para Next/Image (Firebase Storage + avatars externos)
    remotePatterns: [
      { protocol: "https", hostname: "firebasestorage.googleapis.com" },
      { protocol: "https", hostname: "lh3.googleusercontent.com" }, // Avatars de Google
    ],
  },
};

export default nextConfig;