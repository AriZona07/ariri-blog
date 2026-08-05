"use client";

/**
 * /account/page.tsx — Página de gestión de cuenta
 *
 * Protección: si no hay sesión activa, redirige a "/" al cargar.
 * Renderiza el AccountWidget dentro del contenedor retro-box estándar.
 */

import { useEffect }     from "react";
import { useRouter }     from "next/navigation";
import { useAuth }       from "@/lib/auth-context";
import AccountWidget     from "@/components/widgets/AccountWidget";

export default function AccountPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  // Redirige a inicio si no hay sesión (espera a que loading termine)
  useEffect(() => {
    if (!loading && !user) {
      router.replace("/");
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="retro-box">
        <div className="retro-box__header">Mi Cuenta</div>
        <div className="account-loading">Cargando sesión…</div>
      </div>
    );
  }

  if (!user) return null; // Redirigiendo, no renderiza nada

  return (
    <div className="retro-box">
      <div className="retro-box__header">★ Mi Cuenta ★</div>
      <div className="retro-box__body">
        <AccountWidget />
      </div>
    </div>
  );
}
