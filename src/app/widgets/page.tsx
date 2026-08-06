/**
 * page.tsx — Ruta dedicada /widgets
 *
 * Muestra los widgets interactivos del blog: reproductor musical, pizarrón de dibujo y libro de visitas.
 */

import MusicPlayerWidget from "@/components/widgets/MusicPlayerWidget";
import SketchBoardWidget  from "@/components/widgets/SketchBoardWidget";
import GuestbookWidget   from "@/components/widgets/GuestbookWidget";

export const metadata = {
  title: "Widgets Interactivos",
  description: "Reproductor MP3 retro, pizarrón de dibujo HTML5 Canvas y libro de visitas en Ariri Blog.",
};

export default function WidgetsPage() {
  return (
    <section aria-label="Widgets interactivos" style={{ display: "flex", flexDirection: "column", gap: "var(--gap-lg)" }}>
      <MusicPlayerWidget playlistId="PLRUBc5sTzob8" />
      <SketchBoardWidget />
      <GuestbookWidget />
    </section>
  );
}
