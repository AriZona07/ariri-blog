import ProfileWidget      from "@/components/widgets/ProfileWidget";
import SocialLinksWidget  from "@/components/widgets/SocialLinksWidget";
import RoleBadgesWidget   from "@/components/widgets/RoleBadgesWidget";
import GuestbookWidget    from "@/components/widgets/GuestbookWidget";

/**
 * SidebarLeft — Barra lateral izquierda.
 * Solo organiza los widgets; la lógica y datos de cada uno viven en su propio archivo.
 */
export default function SidebarLeft() {
  return (
    <aside className="sidebar-left" role="complementary" aria-label="Perfil y redes sociales">
      <ProfileWidget />
      <SocialLinksWidget />
      <RoleBadgesWidget />
      <GuestbookWidget />
    </aside>
  );
}
