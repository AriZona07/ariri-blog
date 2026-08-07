"use client";

/**
 * ImageUploader.tsx — Componente reutilizable para carga y recorte de imágenes
 *
 * Características:
 *   - Selección exclusiva entre URL Externa y Archivo desde Dispositivo.
 *   - Validación estricta de formatos (PNG, JPG, JPEG, WEBP, GIF, HEIC, HEIF, AVIF; bloquea SVG y archivos no válidos).
 *   - Validación de peso máximo en MB (por defecto 10 MB).
 *   - Validación de dimensiones mínimas y máximas en píxeles.
 *   - Modal de Recorte / Ajuste de encuadre interactivo (zoom y arrastre) sin alterar la imagen original hasta confirmar.
 */

import { useState, useEffect, useRef, useCallback, useMemo } from "react";

export interface ImageUploaderProps {
  label: string;
  id: string;
  mode: "url" | "file";
  onModeChange: (mode: "url" | "file") => void;
  urlValue: string;
  onUrlChange: (url: string) => void;
  fileValue: File | null;
  onFileChange: (file: File | null) => void;
  minWidth?: number;
  maxWidth?: number;
  minHeight?: number;
  maxHeight?: number;
  maxSizeMB?: number; // Por defecto 10 MB
  cropShape?: "circle" | "square" | "rect";
  cropAspectRatio?: number; // Ancho / Alto (ej. 1 para cuadrado/círculo, 1.777 para 16:9)
  existingUrl?: string;
  onClear?: () => void;
}

const ALLOWED_EXTENSIONS = [".png", ".jpg", ".jpeg", ".webp", ".avif"];

export default function ImageUploader({
  label,
  id,
  mode,
  onModeChange,
  urlValue,
  onUrlChange,
  fileValue,
  onFileChange,
  minWidth,
  maxWidth,
  minHeight,
  maxHeight,
  maxSizeMB = 10,
  cropShape = "square",
  cropAspectRatio = 1,
  existingUrl,
  onClear,
}: ImageUploaderProps) {
  // Estado para dimensiones cargadas asíncronamente
  const [loadedDimensions, setLoadedDimensions] = useState<{ width: number; height: number; src: string } | null>(null);

  // Estado para el modal de recorte
  const [showCropModal, setShowCropModal] = useState(false);
  const [cropZoom, setCropZoom] = useState(1);
  const [cropPan, setCropPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [modalImgDims, setModalImgDims] = useState<{ width: number; height: number } | null>(null);
  const dragStartRef = useRef({ x: 0, y: 0 });
  const panStartRef = useRef({ x: 0, y: 0 });
  const cropImageRef = useRef<HTMLImageElement | null>(null);

  // Calcular dimensiones dinámicas del viewport según el aspect ratio
  const viewportW = cropShape === "rect" ? Math.min(360, Math.round(280 * (cropAspectRatio || 1.777))) : 280;
  const viewportH = Math.round(viewportW / (cropAspectRatio || 1));

  // Validar formato de archivo / URL
  const isFormatAllowed = useCallback((nameOrUrl: string, mimeType?: string): boolean => {
    const lower = nameOrUrl.toLowerCase().split("?")[0];
    if (lower.endsWith(".svg") || (mimeType && mimeType.includes("svg"))) {
      return false;
    }
    if (mimeType && mimeType.startsWith("image/")) {
      return !mimeType.includes("svg");
    }
    return ALLOWED_EXTENSIONS.some((ext) => lower.endsWith(ext));
  }, []);

  // Validar dimensiones en memoria
  const validateDimensions = useCallback(
    (w: number, h: number): string | null => {
      const errs: string[] = [];
      if (minWidth && w < minWidth) errs.push(`ancho mínimo ${minWidth}px`);
      if (maxWidth && w > maxWidth) errs.push(`ancho máximo ${maxWidth}px`);
      if (minHeight && h < minHeight) errs.push(`alto mínimo ${minHeight}px`);
      if (maxHeight && h > maxHeight) errs.push(`alto máximo ${maxHeight}px`);

      if (errs.length > 0) {
        return `Las dimensiones (${w}x${h} px) no cumplen los requisitos: ${errs.join(", ")}.`;
      }
      return null;
    },
    [minWidth, maxWidth, minHeight, maxHeight]
  );

  // 1. Validaciones síncronas derivadas del renderizado (Regla React: cero useEffect/setState síncrono)
  let formatError: string | null = null;
  let sizeError: string | null = null;

  if (mode === "file" && fileValue) {
    if (!isFormatAllowed(fileValue.name, fileValue.type)) {
      formatError = "Formato no permitido. Utiliza PNG, JPG, JPEG, WEBP o AVIF (SVG u otros no están permitidos).";
    } else if (fileValue.size > maxSizeMB * 1024 * 1024) {
      sizeError = `El archivo pesa ${(fileValue.size / (1024 * 1024)).toFixed(2)} MB, lo cual supera el límite de ${maxSizeMB} MB.`;
    }
  } else if (mode === "url" && urlValue.trim()) {
    if (!isFormatAllowed(urlValue.trim())) {
      formatError = "Formato no permitido en el enlace URL. Utiliza imágenes PNG, JPG, JPEG, WEBP o AVIF.";
    }
  }

  // 2. Generación de ObjectURL memorizada sin setState
  const objectUrlSrc = useMemo(() => {
    if (mode === "file" && fileValue && !formatError && !sizeError) {
      return URL.createObjectURL(fileValue);
    }
    return null;
  }, [mode, fileValue, formatError, sizeError]);

  // Limpieza de memoria de ObjectURL
  useEffect(() => {
    return () => {
      if (objectUrlSrc) {
        URL.revokeObjectURL(objectUrlSrc);
      }
    };
  }, [objectUrlSrc]);

  const previewSrc = mode === "file" ? objectUrlSrc : mode === "url" && urlValue.trim() ? urlValue.trim() : null;
  const activeSrc = previewSrc || existingUrl;

  // 3. Precarga asíncrona de dimensiones de la imagen (únicamente dentro de img.onload)
  useEffect(() => {
    if (!previewSrc || formatError || sizeError) return;

    let isMounted = true;
    const img = new window.Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      if (isMounted) {
        setLoadedDimensions({ width: img.naturalWidth, height: img.naturalHeight, src: previewSrc });
      }
    };
    img.onerror = () => {
      if (isMounted) {
        setLoadedDimensions(null);
      }
    };
    img.src = previewSrc;

    return () => {
      isMounted = false;
    };
  }, [previewSrc, formatError, sizeError]);

  // Derivar dimensiones y errores de dimensiones síncronamente durante el renderizado
  const imageDimensions = loadedDimensions && loadedDimensions.src === previewSrc && !formatError && !sizeError
    ? { width: loadedDimensions.width, height: loadedDimensions.height }
    : null;

  const dimensionError = imageDimensions
    ? validateDimensions(imageDimensions.width, imageDimensions.height)
    : null;

  // Derivar dimensiones naturales de la imagen y la escala base (baseScale) para encuadrarla por defecto sin zoom excesivo
  const naturalImgW = modalImgDims?.width || imageDimensions?.width || 300;
  const naturalImgH = modalImgDims?.height || imageDimensions?.height || 300;

  // Escala base requerida para cubrir todo el viewport a zoom 1.0
  const baseScale = Math.max(viewportW / naturalImgW, viewportH / naturalImgH);
  const displayedWidth = naturalImgW * baseScale;
  const displayedHeight = naturalImgH * baseScale;

  const error = formatError || sizeError || dimensionError;

  // Manejo de arrastre (pan) en el modal de recorte
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    dragStartRef.current = { x: e.clientX, y: e.clientY };
    panStartRef.current = { ...cropPan };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    const dx = e.clientX - dragStartRef.current.x;
    const dy = e.clientY - dragStartRef.current.y;
    setCropPan({
      x: panStartRef.current.x + dx,
      y: panStartRef.current.y + dy,
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      setIsDragging(true);
      dragStartRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      panStartRef.current = { ...cropPan };
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging || e.touches.length !== 1) return;
    const dx = e.touches[0].clientX - dragStartRef.current.x;
    const dy = e.touches[0].clientY - dragStartRef.current.y;
    setCropPan({
      x: panStartRef.current.x + dx,
      y: panStartRef.current.y + dy,
    });
  };

  // Aplicar recorte y generar nuevo archivo desde Canvas
  const handleApplyCrop = () => {
    if (!previewSrc) return;

    const img = new window.Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      // Dimensiones de exportación del Canvas (Alta calidad)
      const exportW = cropShape === "rect" ? Math.round(500 * (cropAspectRatio || 1.777)) : 500;
      const exportH = 500;

      canvas.width = exportW;
      canvas.height = exportH;

      ctx.clearRect(0, 0, exportW, exportH);

      const naturalW = img.naturalWidth;
      const naturalH = img.naturalHeight;

      // Escala base requerida para encuadrar en el viewport de la interfaz
      const calcBaseScale = Math.max(viewportW / naturalW, viewportH / naturalH);

      // Dimensiones renderizadas a zoom 1.0
      const dispW = naturalW * calcBaseScale;
      const dispH = naturalH * calcBaseScale;

      // Dimensiones reales renderizadas según el zoom del usuario
      const currentW = dispW * cropZoom;
      const currentH = dispH * cropZoom;

      // Esquina superior izquierda de la imagen respecto al centro del viewport
      const imgLeft = (viewportW - currentW) / 2 + cropPan.x;
      const imgTop = (viewportH - currentH) / 2 + cropPan.y;

      // Proporción de escala entre Canvas de alta resolución y Viewport de la interfaz
      const scaleRatio = exportW / viewportW;

      // Dibujar imagen exacta en el canvas
      const drawX = imgLeft * scaleRatio;
      const drawY = imgTop * scaleRatio;
      const drawW = currentW * scaleRatio;
      const drawH = currentH * scaleRatio;

      ctx.drawImage(img, drawX, drawY, drawW, drawH);

      canvas.toBlob((blob) => {
        if (!blob) return;
        const croppedFile = new File([blob], `cropped_${Date.now()}.png`, { type: "image/png" });

        onModeChange("file");
        onFileChange(croppedFile);
        setShowCropModal(false);
      }, "image/png");
    };
    img.src = previewSrc;
  };

  const handleRemoveImage = () => {
    onUrlChange("");
    onFileChange(null);
    if (onClear) {
      onClear();
    }
  };

  return (
    <div className="img-uploader">
      <label className="img-uploader__label">{label}</label>

      {/* Selector exclusivo de modalidad */}
      <div className="img-uploader__modes">
        <label className="img-uploader__radio-label">
          <input
            type="radio"
            name={`mode-${id}`}
            value="url"
            checked={mode === "url"}
            onChange={() => {
              onModeChange("url");
              onFileChange(null);
            }}
          />
          🔗 Enlace URL Externo
        </label>

        <label className="img-uploader__radio-label" style={{ color: "#00ff66" }}>
          <input
            type="radio"
            name={`mode-${id}`}
            value="file"
            checked={mode === "file"}
            onChange={() => {
              onModeChange("file");
              onUrlChange("");
            }}
          />
          📁 Subir desde dispositivo
        </label>
      </div>

      {/* Campos según modo seleccionado */}
      {mode === "url" ? (
        <input
          id={id}
          type="url"
          className="auth-field__input"
          value={urlValue}
          onChange={(e) => onUrlChange(e.target.value)}
          placeholder="https://ejemplo.com/imagen.png"
        />
      ) : (
        <div>
          <input
            id={id}
            key={fileValue ? fileValue.name : "empty-file-input"}
            type="file"
            accept="image/png, image/jpeg, image/jpg, image/webp, image/avif"
            className="auth-field__input"
            onChange={(e) => {
              if (e.target.files && e.target.files[0]) {
                onFileChange(e.target.files[0]);
              }
            }}
          />
          {fileValue && !error && (
            <div className="img-uploader__info">
              <span>✓ Archivo: <strong>{fileValue.name}</strong> ({Math.round(fileValue.size / 1024)} KB)</span>
              {imageDimensions && <span>Dimensiones: {imageDimensions.width}x{imageDimensions.height} px</span>}
            </div>
          )}
        </div>
      )}

      {/* Mensaje de error si la validación falla */}
      {error && <div className="img-uploader__error">⚠️ {error}</div>}

      {/* Requisitos informativos */}
      <div style={{ fontSize: "0.72rem", color: "var(--color-text-secondary, #aaa)", marginTop: "0.1rem" }}>
        Formato: PNG, JPG, WEBP, AVIF (Máx. {maxSizeMB} MB
        {minWidth || minHeight ? ` | Mín: ${minWidth ?? 0}x${minHeight ?? 0}px` : ""}
        {maxWidth || maxHeight ? ` | Máx: ${maxWidth ?? "∞"}x${maxHeight ?? "∞"}px` : ""})
      </div>

      {/* Vista previa y botones de Recorte / Quitar imagen */}
      {activeSrc && !error && (
        <div className="img-uploader__thumbnail-preview">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={activeSrc}
            alt="Vista previa"
            className={`img-uploader__thumb ${cropShape === "circle" ? "img-uploader__thumb--circle" : ""}`}
          />

          <div>
            <div style={{ fontSize: "0.78rem", color: "#fff", fontWeight: "bold" }}>Vista previa de la imagen</div>
            <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", marginTop: "0.4rem" }}>
              <button
                type="button"
                className="img-uploader__crop-trigger-btn"
                style={{ marginTop: 0 }}
                onClick={() => {
                  setCropZoom(1);
                  setCropPan({ x: 0, y: 0 });
                  setShowCropModal(true);
                }}
              >
                ✂️ Recortar / Ajustar encuadre
              </button>

              <button
                type="button"
                className="img-uploader__remove-btn"
                style={{ marginTop: 0, marginLeft: 0 }}
                onClick={handleRemoveImage}
              >
                🗑️ Quitar imagen
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Interactivo de Recorte / Ajuste */}
      {showCropModal && previewSrc && (
        <div className="img-crop-overlay" role="dialog" aria-modal="true" aria-label="Modal de recorte">
          <div className="img-crop-modal">
            <div className="img-crop-modal__header">
              <span>✂️ Recortar / Ajustar encuadre</span>
              <button
                type="button"
                className="img-crop-modal__close"
                onClick={() => setShowCropModal(false)}
                aria-label="Cerrar modal"
              >
                ✕
              </button>
            </div>

            <div className="img-crop-modal__body">
              <p className="img-crop-instruction">
                Arrastra la imagen con el ratón o táctil para moverla y usa el control de zoom para seleccionar el encuadre perfecto.
              </p>

              <div
                className="img-crop-viewport"
                style={{ width: `${viewportW}px`, height: `${viewportH}px` }}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleMouseUp}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  ref={cropImageRef}
                  src={previewSrc}
                  alt="Ajuste de recorte"
                  className="img-crop-viewport__image"
                  onLoad={(e) => {
                    const target = e.currentTarget;
                    setModalImgDims({ width: target.naturalWidth, height: target.naturalHeight });
                  }}
                  style={{
                    width: `${displayedWidth}px`,
                    height: `${displayedHeight}px`,
                    transform: `translate(-50%, -50%) translate(${cropPan.x}px, ${cropPan.y}px) scale(${cropZoom})`,
                  }}
                />
                <div className={`img-crop-mask img-crop-mask--${cropShape}`} />
              </div>

              <div className="img-crop-controls">
                <div className="img-crop-slider-group">
                  <span>Zoom:</span>
                  <input
                    type="range"
                    min="0.5"
                    max="3"
                    step="0.05"
                    value={cropZoom}
                    onChange={(e) => setCropZoom(parseFloat(e.target.value))}
                  />
                  <span>{(cropZoom * 100).toFixed(0)}%</span>
                  <button
                    type="button"
                    className="img-crop-reset-btn"
                    onClick={() => {
                      setCropZoom(1);
                      setCropPan({ x: 0, y: 0 });
                    }}
                    title="Restablecer encuadre y zoom por defecto"
                  >
                    ↺ Restablecer
                  </button>
                </div>
              </div>

              <div className="img-crop-modal__actions">
                <button
                  type="button"
                  className="img-crop-btn-cancel"
                  onClick={() => setShowCropModal(false)}
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  className="img-crop-btn-save"
                  onClick={handleApplyCrop}
                >
                  ✓ Aplicar Recorte
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
