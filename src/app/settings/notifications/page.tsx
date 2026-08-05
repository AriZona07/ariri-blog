"use client";

/**
 * /settings/notifications/page.tsx — Página de ajustes de notificaciones
 *
 * Protegida: redirige a "/" si el usuario no tiene sesión iniciada.
 */

import { useEffect }                from "react";
import { useRouter }                from "next/navigation";
import { useAuth }                  from "@/lib/auth-context";
import NotificationSettingsWidget from "@/components/widgets/NotificationSettingsWidget";

export default function SettingsNotificationsPage() {
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
        <div className="retro-box__header">Notificaciones</div>
        <div className="account-loading">Cargando sesión…</div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="retro-box">
      <div className="retro-box__header">★ Configuración de Notificaciones ★</div>
      <div className="retro-box__body">
        <NotificationSettingsWidget />
      </div>
    </div>
  );
}
