"use client";

import { usePathname }    from "next/navigation";
import MusicPlayerWidget from "@/components/widgets/MusicPlayerWidget";
import SketchBoardWidget  from "@/components/widgets/SketchBoardWidget";
import GuestbookWidget   from "@/components/widgets/GuestbookWidget";

/**
 * SidebarRight — Barra lateral derecha.
 * Se oculta automáticamente (retorna null) en las páginas de configuración (/settings/*).
 */
export default function SidebarRight() {
  const pathname = usePathname();
  const isSettingsPage = pathname?.startsWith("/settings");

  if (isSettingsPage) {
    return null;
  }

  return (
    <aside className="sidebar-right" role="complementary" aria-label="Widgets interactivos">
      <MusicPlayerWidget />
      <SketchBoardWidget />
      <GuestbookWidget />
    </aside>
  );
}

