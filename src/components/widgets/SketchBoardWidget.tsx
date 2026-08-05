"use client";

import { useRef, useState, useEffect, useCallback } from "react";

interface SketchBoardWidgetProps {
  /** Título que aparece en el encabezado de la caja retro */
  title?: string;
  /** Altura del área de dibujo en px */
  canvasHeight?: number;
}

/**
 * Paleta de colores emo / scene de los 2000s según README.md
 * Colores vibrantes y neón para contrastar sobre el fondo oscuro del pizarrón.
 */
const EMO_COLORS = [
  { bg: "#ff1493", label: "Hot Pink" },
  { bg: "#00ff66", label: "Verde Neón" },
  { bg: "#00f0ff", label: "Cian Neón" },
  { bg: "#b80058", label: "Magenta" },
  { bg: "#ffff00", label: "Amarillo" },
  { bg: "#ffffff", label: "Blanco" },
];

/** Opciones de grosor de trazo (en píxeles) para pincel y borrador */
const THICKNESS_OPTIONS = [
  { value: 2, label: "Fino (2px)" },
  { value: 6, label: "Medio (6px)" },
  { value: 12, label: "Grueso (12px)" },
];

/**
 * SketchBoardWidget — Pizarrón interactivo de dibujo en Canvas.
 * Permite seleccionar colores de la temática emo/scene, borrador, grosores de trazo
 * y limpiar el contenido del pizarrón.
 */
export default function SketchBoardWidget({
  title = "✏️ Pizarrón",
  canvasHeight = 150,
}: SketchBoardWidgetProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Herramienta activa: 'brush' (pincel) o 'eraser' (borrador)
  const [activeTool, setActiveTool] = useState<"brush" | "eraser">("brush");

  // Color actual de pincel seleccionado
  const [color, setColor] = useState<string>("#ff1493");

  // Grosor de pincel/borrador (en píxeles)
  const [thickness, setThickness] = useState<number>(6);

  // Control de estado de dibujo continuo
  const isDrawing = useRef<boolean>(false);
  const lastPos = useRef<{ x: number; y: number } | null>(null);

  /**
   * Inicializa o ajusta el tamaño del canvas manteniendo el contenido previo.
   * Modificar el ancho/alto en el DOM limpia el canvas por defecto en la API HTML5,
   * por lo que usamos un canvas auxiliar para respaldar el dibujo durante redimensionados.
   */
  const initCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const parent = canvas.parentElement;
    if (!parent) return;

    const width = parent.clientWidth || 250;
    const height = canvasHeight;

    if (canvas.width === width && canvas.height === height) return;

    // Crear canvas temporal para salvar trazos actuales si la ventana cambia de tamaño
    const tempCanvas = document.createElement("canvas");
    tempCanvas.width = canvas.width;
    tempCanvas.height = canvas.height;
    const tempCtx = tempCanvas.getContext("2d");
    if (tempCtx && canvas.width > 0 && canvas.height > 0) {
      tempCtx.drawImage(canvas, 0, 0);
    }

    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      if (tempCanvas.width > 0 && tempCanvas.height > 0) {
        ctx.drawImage(tempCanvas, 0, 0);
      }
    }
  }, [canvasHeight]);

  useEffect(() => {
    initCanvas();
    window.addEventListener("resize", initCanvas);
    return () => window.removeEventListener("resize", initCanvas);
  }, [initCanvas]);

  /**
   * Obtiene la posición x, y relativa al canvas desde eventos de mouse o touch.
   */
  const getCoordinates = (
    e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>
  ): { x: number; y: number } | null => {
    const canvas = canvasRef.current;
    if (!canvas) return null;

    const rect = canvas.getBoundingClientRect();
    let clientX = 0;
    let clientY = 0;

    if ("touches" in e) {
      if (e.touches.length === 0) return null;
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    return {
      x: clientX - rect.left,
      y: clientY - rect.top,
    };
  };

  /**
   * Inicia el trazo cuando se presiona el click o la pantalla táctil.
   */
  const startDrawing = (
    e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>
  ) => {
    const coords = getCoordinates(e);
    if (!coords) return;

    isDrawing.current = true;
    lastPos.current = coords;
    draw(e);
  };

  /**
   * Dibuja líneas continuas o borra según la herramienta activa.
   */
  const draw = (
    e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>
  ) => {
    if (!isDrawing.current || !canvasRef.current) return;

    const coords = getCoordinates(e);
    if (!coords) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.beginPath();
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.lineWidth = thickness;

    if (activeTool === "eraser") {
      // Modo borrador: borra píxeles del canvas
      ctx.globalCompositeOperation = "destination-out";
    } else {
      // Modo pincel: dibuja con el color seleccionado
      ctx.globalCompositeOperation = "source-over";
      ctx.strokeStyle = color;
    }

    const prev = lastPos.current || coords;
    ctx.moveTo(prev.x, prev.y);
    ctx.lineTo(coords.x, coords.y);
    ctx.stroke();

    lastPos.current = coords;
  };

  /**
   * Detiene el proceso de dibujo.
   */
  const stopDrawing = () => {
    isDrawing.current = false;
    lastPos.current = null;
  };

  /**
   * Limpia todo el contenido del pizarrón.
   */
  const handleClear = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
  };

  return (
    <section aria-label="Pizarrón interactivo">
      <div className="retro-box">
        <div className="retro-box__header">
          <span className="retro-box__title">{title}</span>
        </div>
        <div className="retro-box__body" style={{ padding: 0 }}>
          <div className="sketch-board">
            {/* Barra de herramientas principal: Paleta de colores, Borrador y Limpiar */}
            <div className="sketch-board__toolbar">
              <div className="sketch-board__colors" aria-label="Colores de pincel">
                {EMO_COLORS.map(({ bg, label }) => {
                  const isSelected = activeTool === "brush" && color === bg;
                  return (
                    <button
                      key={bg}
                      className={`sketch-board__color-btn${isSelected ? " selected" : ""}`}
                      style={{ backgroundColor: bg }}
                      aria-label={`Color ${label}`}
                      aria-pressed={isSelected}
                      title={`Pincel: ${label}`}
                      onClick={() => {
                        setActiveTool("brush");
                        setColor(bg);
                      }}
                    />
                  );
                })}
              </div>

              {/* Botón Herramienta Borrador */}
              <button
                className={`sketch-board__tool-btn${activeTool === "eraser" ? " selected" : ""}`}
                aria-label="Herramienta Borrador"
                aria-pressed={activeTool === "eraser"}
                title="Borrador"
                onClick={() => setActiveTool("eraser")}
              >
                🧹
              </button>

              {/* Botón de Limpiar Todo el Pizarrón */}
              <button
                className="sketch-board__clear-btn"
                aria-label="Limpiar todo el pizarrón"
                title="Limpiar todo"
                onClick={handleClear}
              >
                🗑️ Limpiar
              </button>
            </div>

            {/* Sub-barra de herramientas: Selección de Grosor del trazo */}
            <div className="sketch-board__subtoolbar">
              <span className="sketch-board__label">Grosor:</span>
              <div className="sketch-board__thickness-group">
                {THICKNESS_OPTIONS.map(({ value, label }) => {
                  const isSelected = thickness === value;
                  return (
                    <button
                      key={value}
                      className={`sketch-board__thickness-btn${isSelected ? " selected" : ""}`}
                      onClick={() => setThickness(value)}
                      title={`Grosor ${label}`}
                      aria-label={`Grosor ${label}`}
                      aria-pressed={isSelected}
                    >
                      <span
                        className="sketch-board__thickness-preview"
                        style={{
                          width: `${Math.min(value + 2, 12)}px`,
                          height: `${Math.min(value + 2, 12)}px`,
                          backgroundColor: activeTool === "eraser" ? "#ffffff" : color,
                        }}
                      />
                      {value}px
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Área del lienzo interactivo */}
            <div className="sketch-board__canvas-container" style={{ height: `${canvasHeight}px` }}>
              <canvas
                ref={canvasRef}
                className="sketch-board__canvas"
                onMouseDown={startDrawing}
                onMouseMove={draw}
                onMouseUp={stopDrawing}
                onMouseLeave={stopDrawing}
                onTouchStart={startDrawing}
                onTouchMove={draw}
                onTouchEnd={stopDrawing}
                aria-label="Lienzo para dibujar"
              />
            </div>

            <p className="sketch-board__hint">✨ Dibuja o escribe una nota en el pizarrón</p>
          </div>
        </div>
      </div>
    </section>
  );
}

