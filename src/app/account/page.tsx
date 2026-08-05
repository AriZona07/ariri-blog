import { redirect } from "next/navigation";

/**
 * /account/page.tsx — Redirección de compatibilidad hacia /settings/account
 */
export default function AccountLegacyRedirectPage() {
  redirect("/settings/account");
}
