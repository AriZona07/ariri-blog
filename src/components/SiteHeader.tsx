"use client";

/**
 * SiteHeader.tsx — Encabezado global del blog
 *
 * Muestra el título, subtítulo y el botón de autenticación.
 * El botón cambia según el estado de sesión:
 *   - Sin sesión: abre el AuthModal (login/registro)
 *   - Con sesión: muestra avatar + nombre y enlace a /account
 *   - Admin: también muestra acceso rápido a /admin
 */

import { useState }  from "react";
import Link          from "next/link";
import Image         from "next/image";
import { signOut }   from "firebase/auth";
import { auth }      from "@/lib/firebase";
import { useAuth }   from "@/lib/auth-context";
import AuthModal     from "@/components/auth/AuthModal";
import NotificationBell from "@/components/NotificationBell";

interface SiteHeaderProps {
  title?:    string;
  subtitle?: string;
}

export default function SiteHeader({
  title    = "aRIRI BLOG",
  subtitle = "videojuegos · manga · punk",
}: SiteHeaderProps) {
  const { user, isAdmin, loading } = useAuth();
  const [showAuth,    setShowAuth]    = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  async function handleSignOut() {
    setShowUserMenu(false);
    await signOut(auth);
  }

  return (
    <>
      <header className="site-header" role="banner">
        <div className="site-header__content">
          <h1 className="site-header__title">
            <Link href="/" className="site-header__title-link">
              {title}
            </Link>
          </h1>
          <p  className="site-header__subtitle">{subtitle}</p>
        </div>

        {/* --- Zona de autenticación y notificaciones (esquina derecha del header) --- */}
        <div className="site-header__auth" style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
          <NotificationBell />

          {loading ? null : !user ? (
            /* Botón visible cuando no hay sesión */
            <button
              className="header-auth-btn"
              onClick={() => setShowAuth(true)}
              id="header-login-btn"
            >
              ★ Entrar
            </button>
          ) : (
            /* Menú desplegable cuando hay sesión */
            <div className="header-user-menu">
              <button
                className="header-auth-btn"
                onClick={() => setShowUserMenu((v) => !v)}
                id="header-user-menu-btn"
                aria-haspopup="true"
                aria-expanded={showUserMenu}
              >
                {user.photoURL && (
                  <Image
                    src={user.photoURL}
                    alt="avatar"
                    width={28}
                    height={28}
                    className="header-auth-btn__avatar"
                    style={{ width: "auto", height: "auto" }}
                  />
                )}
                {user.displayName?.split(" ")[0] ?? "Cuenta"} ▾
              </button>

              {showUserMenu && (
                <div className="header-user-menu__dropdown" role="menu">
                  <Link
                    href="/"
                    className="header-user-menu__item"
                    onClick={() => setShowUserMenu(false)}
                    role="menuitem"
                    id="header-home-btn"
                  >
                    🏠 Inicio
                  </Link>
                  <Link
                    href="/settings/account"
                    className="header-user-menu__item"
                    onClick={() => setShowUserMenu(false)}
                    role="menuitem"
                  >
                    👤 Mi Cuenta
                  </Link>
                  {isAdmin && (
                    <Link
                      href="/settings/admin"
                      className="header-user-menu__item header-user-menu__item--admin"
                      onClick={() => setShowUserMenu(false)}
                      role="menuitem"
                    >
                      ⚙️ Panel de Admin
                    </Link>
                  )}
                  <button
                    className="header-user-menu__item header-user-menu__item--danger"
                    onClick={handleSignOut}
                    role="menuitem"
                    id="header-signout-btn"
                  >
                    ✕ Cerrar Sesión
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </header>

      {/* Modal de auth (fuera del header para evitar problemas de z-index) */}
      {showAuth && <AuthModal onClose={() => setShowAuth(false)} />}
    </>
  );
}
