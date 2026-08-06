"use client";

/**
 * MobileGeneralNav.tsx — Barra de navegación flotante fija en la parte inferior para vistas públicas en móvil (<768px)
 *
 * Muestra accesos directos a: Sobre mí (/about-me), Inicio (/) y Widgets (/widgets).
 */

import Link from "next/link";
import { usePathname } from "next/navigation";

interface NavItem {
  href: string;
  icon: string;
  label: string;
}

export default function MobileGeneralNav() {
  const pathname = usePathname();

  const items: NavItem[] = [
    { href: "/about-me", icon: "👤", label: "Sobre mí" },
    { href: "/",         icon: "🏠", label: "Inicio" },
    { href: "/widgets",  icon: "🧩", label: "Widgets" },
  ];

  return (
    <nav className="mobile-general-nav" aria-label="Navegación general móvil">
      {items.map(({ href, icon, label }) => {
        const isActive = href === "/"
          ? pathname === "/"
          : (pathname === href || pathname?.startsWith(href + "/"));

        return (
          <Link
            key={href}
            href={href}
            className={`mobile-general-nav__item ${isActive ? "mobile-general-nav__item--active" : ""}`}
          >
            <span className="mobile-general-nav__icon">{icon}</span>
            <span className="mobile-general-nav__label">{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
