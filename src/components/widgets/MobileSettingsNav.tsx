"use client";

/**
 * MobileSettingsNav.tsx — Barra de navegación flotante fija en la parte inferior para vistas móviles en /settings/*
 *
 * Se muestra únicamente en pantallas móviles (<= 768px) al estar dentro de cualquier sub-ruta de configuración.
 * Permite cambiar entre vistas (Cuenta, Notificaciones, Panel Admin, Inicio) estilo App Móvil.
 */

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth }     from "@/lib/auth-context";

interface NavItem {
  href: string;
  icon: string;
  label: string;
}

export default function MobileSettingsNav() {
  const pathname = usePathname();
  const { isAdmin } = useAuth();

  const items: NavItem[] = [
    { href: "/settings/account",       icon: "👤", label: "Cuenta" },
    { href: "/settings/notifications", icon: "🔔", label: "Avisos" },
  ];

  if (isAdmin) {
    items.push({
      href: "/settings/admin",
      icon: "⚙️",
      label: "Admin",
    });
  }

  items.push({
    href: "/",
    icon: "🏠",
    label: "Inicio",
  });

  return (
    <nav className="mobile-settings-nav" aria-label="Navegación móvil de ajustes">
      {items.map(({ href, icon, label }) => {
        const isActive = href === "/"
          ? false
          : (pathname === href || pathname?.startsWith(href + "/"));

        return (
          <Link
            key={href}
            href={href}
            className={`mobile-settings-nav__item ${isActive ? "mobile-settings-nav__item--active" : ""}`}
          >
            <span className="mobile-settings-nav__icon">{icon}</span>
            <span className="mobile-settings-nav__label">{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
