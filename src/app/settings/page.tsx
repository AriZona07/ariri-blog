import { redirect } from "next/navigation";

/**
 * /settings/page.tsx — Redirección automática de la raíz de ajustes a /settings/account
 */
export default function SettingsRootPage() {
  redirect("/settings/account");
}
