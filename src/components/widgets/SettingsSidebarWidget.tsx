"use client";

/**
 * SettingsSidebarWidget.tsx — Barra lateral de navegación para la sección de Configuración (/settings/*)
 *
 * Muestra el menú de opciones para cambiar entre las sub-rutas de ajustes
 * de cuenta, perfil, notificaciones y el panel de admin (solo para administradores).
 */

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth }     from "@/lib/auth-context";

interface SettingsNavItem {
  href: string;
  icon: string;
  label: string;
}

export default function SettingsSidebarWidget() {
  const pathname = usePathname();
  const { isAdmin } = useAuth();

  const navItems: SettingsNavItem[] = [
    { href: "/settings/account",       icon: "👤", label: "Cuenta" },
    { href: "/settings/notifications", icon: "🔔", label: "Notificaciones" },
  ];

  if (isAdmin) {
    navItems.push({
      href: "/settings/admin",
      icon: "⚙️",
      label: "Panel de Admin",
    });
  }

  return (
    <section aria-label="Navegación de configuración">
      <div className="retro-box">
        <div className="retro-box__header">
          <span className="retro-box__title">⚙️ Ajustes</span>
        </div>
        <div className="retro-box__body">
          <nav aria-label="Menú de configuración">
            <ul className="settings-sidebar-nav" role="list">
              {navItems.map(({ href, icon, label }) => {
                const isActive = pathname === href || pathname?.startsWith(href + "/");
                return (
                  <li key={href}>
                    <Link
                      href={href}
                      className={`settings-sidebar-link ${isActive ? "settings-sidebar-link--active" : ""}`}
                    >
                      <span className="settings-sidebar-link__icon">{icon}</span>
                      <span className="settings-sidebar-link__label">{label}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>

            <div className="settings-sidebar-divider" />

            <Link href="/" className="settings-sidebar-back-link">
              <span>🏠</span> Volver al Blog
            </Link>
          </nav>
        </div>
      </div>
    </section>
  );
}
