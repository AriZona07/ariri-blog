/**
 * youtube.ts — Utilidad para procesar y extraer IDs de playlists o videos de YouTube.
 */

/**
 * Extrae el ID de una playlist de YouTube a partir de una URL completa o ID.
 *
 * Ejemplos de entrada soportados:
 * - https://youtube.com/playlist?list=PLb_cyNEBFTVA&si=yp9oyBjWbnEdDQIJ -> PLb_cyNEBFTVA
 * - https://www.youtube.com/playlist?list=PLb_cyNEBFTVA -> PLb_cyNEBFTVA
 * - https://www.youtube.com/watch?v=xxx&list=PLb_cyNEBFTVA -> PLb_cyNEBFTVA
 * - PLb_cyNEBFTVA -> PLb_cyNEBFTVA
 */
export function extractYouTubePlaylistId(urlOrId: string | null | undefined): string {
  if (!urlOrId) return "";
  const trimmed = urlOrId.trim();
  if (!trimmed) return "";

  // Si contiene "list=" (sea ?list= o &list=)
  if (trimmed.includes("list=")) {
    const afterList = trimmed.split(/[\?&]list=/)[1];
    if (afterList) {
      // Extrae solo el valor del parámetro 'list' descartando parámetros extra como &si= o #
      const cleanId = afterList.split(/[&\#]/)[0].trim();
      if (cleanId) return cleanId;
    }
  }

  // Si la cadena contiene parámetros de URL pegados tipo "PLb_cyNEBFTVA&si=..."
  if (trimmed.includes("&")) {
    return trimmed.split("&")[0].trim();
  }

  return trimmed;
}

/**
 * Extrae el ID de un video individual de YouTube a partir de una URL o ID directo.
 */
export function extractYouTubeVideoId(urlOrId: string | null | undefined): string {
  if (!urlOrId) return "";
  const trimmed = urlOrId.trim();
  if (!trimmed) return "";

  // 1. URLs cortas tipo https://youtu.be/WuwfNgugVEI
  if (trimmed.includes("youtu.be/")) {
    const parts = trimmed.split("youtu.be/")[1];
    if (parts) return parts.split(/[\?&#]/)[0].trim();
  }

  // 2. URLs de watch tipo https://www.youtube.com/watch?v=WuwfNgugVEI
  if (trimmed.includes("v=")) {
    const parts = trimmed.split(/[\?&]v=/)[1];
    if (parts) return parts.split(/[\?&#]/)[0].trim();
  }

  return trimmed;
}

/**
 * Convierte un enlace de canción de YouTube o ID a la imagen de portada (thumbnail),
 * o devuelve la URL tal cual si ya es una imagen directa.
 */
export function processSongCoverUrl(urlOrId: string | null | undefined): string | null {
  if (!urlOrId) return null;
  const trimmed = urlOrId.trim();
  if (!trimmed) return null;

  if (trimmed.includes("youtube.com") || trimmed.includes("youtu.be") || trimmed.includes("v=")) {
    const videoId = extractYouTubeVideoId(trimmed);
    if (videoId) {
      return `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
    }
  }

  return trimmed;
}

