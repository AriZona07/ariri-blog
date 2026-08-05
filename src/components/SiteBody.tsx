"use client";

/**
 * SiteBody.tsx — Envoltorio dinámico del cuerpo principal del sitio (sidebars + contenido central)
 *
 * Aplica la clase .site-body--no-right-sidebar cuando se navega en rutas de configuración (/settings/* o /account),
 * permitiendo que el área de contenido principal se expanda y consuma todo el espacio disponible.
 * En móviles renderiza la barra flotante de navegación inferior (MobileSettingsNav).
 */

import { usePathname }     from "next/navigation";
import SidebarLeft         from "@/components/SidebarLeft";
import SidebarRight        from "@/components/SidebarRight";
import MobileSettingsNav  from "@/components/widgets/MobileSettingsNav";

interface SiteBodyProps {
  children: React.ReactNode;
}

export default function SiteBody({ children }: SiteBodyProps) {
  const pathname = usePathname();
  const isSettingsPage = pathname?.startsWith("/settings") || pathname?.startsWith("/account");

  return (
    <div className={`site-body ${isSettingsPage ? "site-body--no-right-sidebar" : ""}`}>
      <SidebarLeft />

      <main className="site-content" id="main-content" role="main">
        {children}
      </main>

      <SidebarRight />

      {isSettingsPage && <MobileSettingsNav />}
    </div>
  );
}
