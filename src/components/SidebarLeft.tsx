"use client";

import { usePathname }        from "next/navigation";
import ProfileWidget          from "@/components/widgets/ProfileWidget";
import SocialLinksWidget      from "@/components/widgets/SocialLinksWidget";
import RoleBadgesWidget       from "@/components/widgets/RoleBadgesWidget";
import SettingsSidebarWidget  from "@/components/widgets/SettingsSidebarWidget";

/**
 * SidebarLeft — Barra lateral izquierda.
 * Muestra el menú de navegación de ajustes cuando se encuentra en rutas de configuración (/settings/*),
 * o los widgets de perfil estándar en el resto del sitio.
 */
export default function SidebarLeft() {
  const pathname = usePathname();
  const isSettingsPage = pathname?.startsWith("/settings");

  return (
    <aside className="sidebar-left" role="complementary" aria-label="Perfil y navegación">
      {isSettingsPage ? (
        <SettingsSidebarWidget />
      ) : (
        <>
          <ProfileWidget />
          <SocialLinksWidget />
          <RoleBadgesWidget />
        </>
      )}
    </aside>
  );
}

