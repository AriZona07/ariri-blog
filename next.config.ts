/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export', // Genera la carpeta /out en el build
  images: {
    unoptimized: true, // Necesario para sitios estáticos sin servidor de Node
  },
};

export default nextConfig; 