"use client";

/**
 * /settings/account/page.tsx — Página de gestión de cuenta y perfil de usuario
 *
 * Protegida: redirige a "/" si el usuario no tiene sesión iniciada.
 */

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth }   from "@/lib/auth-context";
import AccountWidget from "@/components/widgets/AccountWidget";

export default function SettingsAccountPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/");
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="retro-box">
        <div className="retro-box__header">Mi Cuenta y Perfil</div>
        <div className="account-loading">Cargando sesión…</div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="retro-box">
      <div className="retro-box__header">★ Mi Cuenta y Perfil ★</div>
      <div className="retro-box__body">
        <AccountWidget />
      </div>
    </div>
  );
}
