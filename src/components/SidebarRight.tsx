import MusicPlayerWidget from "@/components/widgets/MusicPlayerWidget";
import SketchBoardWidget  from "@/components/widgets/SketchBoardWidget";
import GuestbookWidget   from "@/components/widgets/GuestbookWidget";

/**
 * SidebarRight — Barra lateral derecha.
 * Solo organiza los widgets; la lógica y datos de cada uno viven en su propio archivo.
 */
export default function SidebarRight() {
  return (
    <aside className="sidebar-right" role="complementary" aria-label="Widgets interactivos">
      <MusicPlayerWidget playlistId="PLb_cyNEBFTVA" />
      <SketchBoardWidget />
      <GuestbookWidget />
    </aside>
  );
}
