/**
 * page.tsx — Página de inicio (ruta "/")
 *
 * Next.js inyecta este componente dentro del <main> del layout.
 * Muestra el bloque de bienvenida, la lista de posts y la paginación.
 * En fases futuras los posts vendrán de /content/posts/ (Markdown + gray-matter).
 */

import WelcomeSection   from "@/components/sections/WelcomeSection";
import PostListSection  from "@/components/sections/PostListSection";
import PaginationNav    from "@/components/sections/PaginationNav";

export default function HomePage() {
  return (
    <>
      <WelcomeSection />
      <PostListSection />
      <PaginationNav />
    </>
  );
}
