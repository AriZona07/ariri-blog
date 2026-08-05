"use client";

/**
 * /admin/new-post/page.tsx — Redirección de compatibilidad hacia /settings/admin/new-post
 */

import { Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";

function LegacyRedirectContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const draft = searchParams.get("draft");
    if (draft) {
      router.replace(`/settings/admin/new-post?draft=${draft}`);
    } else {
      router.replace("/settings/admin/new-post");
    }
  }, [router, searchParams]);

  return (
    <div className="retro-box">
      <div className="retro-box__header">Redirigiendo…</div>
      <div className="account-loading">Redirigiendo al formulario de publicaciones en Ajustes…</div>
    </div>
  );
}

export default function LegacyNewPostRedirectPage() {
  return (
    <Suspense
      fallback={
        <div className="retro-box">
          <div className="retro-box__header">Redirigiendo…</div>
          <div className="account-loading">Cargando…</div>
        </div>
      }
    >
      <LegacyRedirectContent />
    </Suspense>
  );
}
