/**
 * page.tsx — Ruta dedicada /about-me
 *
 * Muestra la información de perfil, redes sociales y badges de rol.
 */

import ProfileWidget     from "@/components/widgets/ProfileWidget";
import SocialLinksWidget from "@/components/widgets/SocialLinksWidget";
import RoleBadgesWidget  from "@/components/widgets/RoleBadgesWidget";

export const metadata = {
  title: "Sobre Mí",
  description: "Perfil personal, intereses y redes sociales de Ariri.",
};

export default function AboutMePage() {
  return (
    <section aria-label="Sobre mí" style={{ display: "flex", flexDirection: "column", gap: "var(--gap-lg)" }}>
      <ProfileWidget />
      <SocialLinksWidget />
      <RoleBadgesWidget />
    </section>
  );
}
