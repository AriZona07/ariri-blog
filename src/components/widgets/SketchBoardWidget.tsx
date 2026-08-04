interface SketchBoardWidgetProps {
  /** Título que aparece en el encabezado de la caja retro */
  title?: string;
  /** Altura del área de dibujo en px */
  canvasHeight?: number;
}

/**
 * SketchBoardWidget — Pizarrón visual (placeholder).
 * La lógica de dibujo real se implementará en una fase futura;
 * por ahora muestra la barra de colores y el área vacía.
 */
export default function SketchBoardWidget({
  title = "✏️ Pizarrón",
  canvasHeight = 120,
}: SketchBoardWidgetProps) {
  /** Paleta de colores predefinida */
  const colors = [
    { bg: "#2c1f3f", label: "Morado", selected: true  },
    { bg: "#e080c0", label: "Rosa",   selected: false },
    { bg: "#40b0a0", label: "Verde",  selected: false },
    { bg: "#f0c040", label: "Amarillo", selected: false },
  ];

  return (
    <section aria-label="Pizarrón de visitantes">
      <div className="retro-box">
        <div className="retro-box__header">
          <span className="retro-box__title">{title}</span>
        </div>
        <div className="retro-box__body" style={{ padding: 0 }}>
          <div className="sketch-board">

            {/* Barra de herramientas de colores */}
            <div className="sketch-board__toolbar">
              {colors.map(({ bg, label, selected }) => (
                <button
                  key={label}
                  className={`sketch-board__tool-btn${selected ? " selected" : ""}`}
                  style={{ backgroundColor: bg }}
                  aria-label={`Color ${label}`}
                  title={label}
                />
              ))}
              {/* Botón de borrador */}
              <button
                className="sketch-board__tool-btn"
                style={{ backgroundColor: "#ffffff", border: "2px solid #ccc" }}
                aria-label="Borrador"
                title="Borrador"
              >
                ⬜
              </button>
            </div>

            {/* Área de dibujo (aún sin canvas interactivo) */}
            <div
              style={{
                width: "100%",
                height: `${canvasHeight}px`,
                background: "#faf8f0",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
              aria-label="Área de dibujo (próximamente)"
            >
              <p style={{ color: "#8a789a", fontSize: "0.75rem", fontStyle: "italic" }}>
                ✏️ Pizarrón próximamente...
              </p>
            </div>

            <p className="sketch-board__hint">¡Deja tu huella en el pizarrón!</p>
          </div>
        </div>
      </div>
    </section>
  );
}
