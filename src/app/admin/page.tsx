import { redirect } from "next/navigation";

/**
 * /admin/page.tsx — Redirección de compatibilidad hacia /settings/admin
 */
export default function AdminLegacyRedirectPage() {
  redirect("/settings/admin");
}
