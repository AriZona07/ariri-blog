"use client";

/**
 * SongSection.tsx — Sección de entrada de "Canción del Día" y su portada vinculada en layout side-by-side.
 *
 * Ubicación: src/components/ui/SongSection.tsx
 */

import ImageUploader from "@/components/ui/ImageUploader";

interface SongSectionProps {
  song:                   string;
  onSongChange:           (val: string) => void;
  songCoverMode:          "url" | "file";
  onSongCoverModeChange:  (mode: "url" | "file") => void;
  songCoverUrl:           string;
  onSongCoverUrlChange:   (val: string) => void;
  songCoverFile:          File | null;
  onSongCoverFileChange:  (file: File | null) => void;
  existingSongCoverUrl:   string;
  onClearSongCover:       () => void;
}

export default function SongSection({
  song,
  onSongChange,
  songCoverMode,
  onSongCoverModeChange,
  songCoverUrl,
  onSongCoverUrlChange,
  songCoverFile,
  onSongCoverFileChange,
  existingSongCoverUrl,
  onClearSongCover,
}: SongSectionProps) {
  return (
    <div className="song-field-row">
      <div className="auth-field" style={{ margin: 0 }}>
        <label htmlFor="np-song" className="auth-field__label">Canción del día</label>
        <input
          id="np-song"
          type="text"
          className="auth-field__input"
          value={song}
          onChange={(e) => onSongChange(e.target.value)}
          placeholder="ej: My Chemical Romance — Helena"
        />
      </div>

      {song.trim().length > 0 ? (
        <ImageUploader
          label="Portada de la canción"
          id="np-song-cover-uploader"
          mode={songCoverMode}
          onModeChange={onSongCoverModeChange}
          urlValue={songCoverUrl}
          onUrlChange={onSongCoverUrlChange}
          fileValue={songCoverFile}
          onFileChange={onSongCoverFileChange}
          minWidth={100}
          minHeight={100}
          maxWidth={4000}
          maxHeight={4000}
          maxSizeMB={10}
          cropShape="square"
          cropAspectRatio={1}
          existingUrl={existingSongCoverUrl}
          onClear={onClearSongCover}
        />
      ) : (
        <div className="song-field-row__disabled-hint">
          🎵 Escribe el nombre de la canción del día a la izquierda para adjuntar la imagen de su portada.
        </div>
      )}
    </div>
  );
}
