"use client";

/**
 * MarkdownEditor.tsx — Editor de Markdown con accesos rápidos, deshacer/rehacer inteligente por palabra/pausa y previsualización en vivo.
 *
 * Ubicación: src/components/ui/MarkdownEditor.tsx
 *
 * Características:
 * - Pestañas "✍️ Escribir" y "👁️ Previsualizar" (ideal para pantallas móviles).
 * - Deshacer / Rehacer inteligente: agrupa por palabra (espacios, puntuación, saltos de línea) y pausas de tipeo.
 * - Atajos de teclado para Ctrl+Z (Deshacer) y Ctrl+Y / Ctrl+Shift+Z (Rehacer).
 * - Barra de accesos rápidos para insertar sintaxis común de Markdown.
 * - Manipulación nativa de selección de texto en textarea (selectionStart / selectionEnd).
 * - Cumplimiento estricto de React 19 (sin setState dentro de useEffect).
 */

import { useState, useRef }         from "react";
import { renderMarkdown }           from "@/lib/markdown";
import { useAuth }                  from "@/lib/auth-context";

interface MarkdownEditorProps {
  id:           string;
  value:        string;
  onChange:     (val: string) => void;
  placeholder?: string;
  rows?:        number;
  required?:    boolean;
}

export default function MarkdownEditor({
  id,
  value,
  onChange,
  placeholder = "Escribe el contenido en Markdown…",
  rows = 12,
  required = false,
}: MarkdownEditorProps) {
  const { preferredFont }           = useAuth();
  const [activeTab, setActiveTab]   = useState<"write" | "preview">("write");
  const [overrideFont, setOverrideFont] = useState<"japan" | "comic" | "book" | null>(null);
  const editorFont = overrideFont ?? preferredFont;

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const fontFamilies = {
    japan: "var(--font-main)",
    comic: "var(--font-comic)",
    book:  "var(--font-merriweather)",
  };

  // Pilas de historial para Deshacer y Rehacer (límite de 50 estados por palabras/bloques)
  const [past, setPast]           = useState<string[]>([]);
  const [future, setFuture]       = useState<string[]>([]);
  const [lastCheckpoint, setLastCheckpoint] = useState<string>("");

  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Derivación del punto de control base actual (sin provocar rendiciones en cascada en useEffect)
  const currentBase = (past.length === 0 && lastCheckpoint === "") ? value : lastCheckpoint;

  /**
   * Confirma un punto de control explícito en la pila 'past' y limpia 'future'.
   */
  const commitCheckpoint = (checkpointVal: string) => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = null;
    }
    if (checkpointVal !== currentBase) {
      setPast((prev) => [...prev.slice(-49), currentBase]);
      setLastCheckpoint(checkpointVal);
      setFuture([]);
    }
    onChange(checkpointVal);
  };

  /**
   * Maneja los cambios de texto introducidos por el usuario con agrupación inteligente por palabra/pausa.
   */
  const handleTextareaChange = (newVal: string) => {
    onChange(newVal);

    // Detectar fin de palabra, puntuación o salto de línea (espacio, coma, punto, enter, etc.)
    const isWordBoundary = /[\s\n.,!?;:()[\]{}'"]/.test(newVal.slice(-1));

    if (isWordBoundary) {
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
      if (newVal !== currentBase) {
        setPast((prev) => [...prev.slice(-49), currentBase]);
        setLastCheckpoint(newVal);
        setFuture([]);
      }
    } else {
      // Programar punto de control por pausa de tipeo (800ms de inactividad)
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = setTimeout(() => {
        if (newVal !== currentBase) {
          setPast((prev) => [...prev.slice(-49), currentBase]);
          setLastCheckpoint(newVal);
          setFuture([]);
        }
      }, 800);
    }
  };

  /**
   * Ejecuta la acción de Deshacer inteligente (Ctrl+Z).
   */
  const handleUndo = () => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = null;
    }

    // Si hay una palabra o cambios en progreso sin haber llegado a un checkpoint, revertimos al checkpoint base
    if (currentBase !== value) {
      setFuture((prev) => [value, ...prev]);
      onChange(currentBase);
      return;
    }

    if (past.length === 0) return;
    const previous = past[past.length - 1];
    const newPast  = past.slice(0, past.length - 1);
    setPast(newPast);
    setFuture((prev) => [value, ...prev]);
    setLastCheckpoint(previous);
    onChange(previous);
  };

  /**
   * Ejecuta la acción de Rehacer inteligente (Ctrl+Y / Ctrl+Shift+Z).
   */
  const handleRedo = () => {
    if (future.length === 0) return;
    const next = future[0];
    const newFuture = future.slice(1);
    setFuture(newFuture);
    setPast((prev) => [...prev.slice(-49), value]);
    setLastCheckpoint(next);
    onChange(next);
  };

  /**
   * Intercepta atajos de teclado para Ctrl+Z y Ctrl+Y / Ctrl+Shift+Z en el textarea.
   */
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    const isMod = e.ctrlKey || e.metaKey;

    if (isMod && !e.shiftKey && e.key.toLowerCase() === "z") {
      e.preventDefault();
      handleUndo();
    } else if (
      (isMod && e.key.toLowerCase() === "y") ||
      (isMod && e.shiftKey && e.key.toLowerCase() === "z")
    ) {
      e.preventDefault();
      handleRedo();
    }
  };

  /**
   * Inserta o envuelve el texto seleccionado con una sintaxis de Markdown dada.
   */
  const insertSyntax = (prefix: string, suffix: string = "", defaultText: string = "texto") => {
    const el = textareaRef.current;
    if (!el) return;

    const start = el.selectionStart;
    const end   = el.selectionEnd;
    const selected = value.substring(start, end);
    const textToInsert = selected || defaultText;

    const newContent =
      value.substring(0, start) + prefix + textToInsert + suffix + value.substring(end);

    commitCheckpoint(newContent);

    // Ajustar el foco y el rango de selección después de insertar
    setTimeout(() => {
      el.focus();
      const newCursorStart = start + prefix.length;
      const newCursorEnd = newCursorStart + textToInsert.length;
      el.setSelectionRange(newCursorStart, newCursorEnd);
    }, 0);
  };

  const canUndo = past.length > 0 || currentBase !== value;
  const canRedo = future.length > 0;

  return (
    <div className="md-editor">
      {/* Pestañas superiores */}
      <div className="md-editor__tabs" style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", gap: "0.2rem" }}>
          <button
            type="button"
            className={`md-editor__tab ${activeTab === "write" ? "md-editor__tab--active" : ""}`}
            onClick={() => setActiveTab("write")}
          >
            ✍️ Escribir
          </button>
          <button
            type="button"
            className={`md-editor__tab ${activeTab === "preview" ? "md-editor__tab--active" : ""}`}
            onClick={() => setActiveTab("preview")}
          >
            👁️ Previsualizar
          </button>
        </div>

        <div style={{ paddingRight: "0.5rem", display: "flex", alignItems: "center", gap: "0.3rem" }}>
          <label htmlFor={`${id}-font-select`} style={{ fontSize: "0.75rem", color: "var(--color-text-secondary)", fontWeight: "bold" }}>
            🔤 Fuente:
          </label>
          <select
            id={`${id}-font-select`}
            value={editorFont}
            onChange={(e) => setOverrideFont(e.target.value as "japan" | "comic" | "book")}
            style={{
              background: "#0f0b14",
              color: "var(--color-accent-pink)",
              border: "1px solid var(--color-accent-pink)",
              borderRadius: "3px",
              padding: "0.15rem 0.4rem",
              fontSize: "0.75rem",
              fontWeight: "bold",
              cursor: "pointer",
            }}
          >
            <option value="japan">Simple Japan (Por defecto)</option>
            <option value="comic">Comic Sans (Divertida)</option>
            <option value="book">Merriweather (Lectura Clásica)</option>
          </select>
        </div>
      </div>

      {activeTab === "write" ? (
        <div className="md-editor__write-container">
          {/* Barra de accesos rápidos */}
          <div className="md-editor__toolbar" role="toolbar" aria-label="Accesos rápidos de Markdown">
            <button
              type="button"
              className="md-editor__tool-btn"
              title="Deshacer (Ctrl+Z) — Deshace por palabra/pausa"
              disabled={!canUndo}
              onClick={handleUndo}
              style={{ opacity: canUndo ? 1 : 0.4 }}
            >
              ↩️ Deshacer
            </button>
            <button
              type="button"
              className="md-editor__tool-btn"
              title="Rehacer (Ctrl+Y o Ctrl+Shift+Z)"
              disabled={!canRedo}
              onClick={handleRedo}
              style={{ opacity: canRedo ? 1 : 0.4 }}
            >
              ↪️ Rehacer
            </button>

            <span style={{ display: "inline-block", width: "1px", height: "16px", background: "var(--color-border)", margin: "0 0.2rem", alignSelf: "center" }} />

            <button
              type="button"
              className="md-editor__tool-btn"
              title="Título H1"
              onClick={() => insertSyntax("# ", "", "Encabezado")}
            >
              H1
            </button>
            <button
              type="button"
              className="md-editor__tool-btn"
              title="Subtítulo H2"
              onClick={() => insertSyntax("## ", "", "Subtítulo")}
            >
              H2
            </button>
            <button
              type="button"
              className="md-editor__tool-btn"
              title="Negrita"
              onClick={() => insertSyntax("**", "**", "texto en negrita")}
            >
              <b>B</b>
            </button>
            <button
              type="button"
              className="md-editor__tool-btn"
              title="Cursiva"
              onClick={() => insertSyntax("*", "*", "texto en cursiva")}
            >
              <i>I</i>
            </button>
            <button
              type="button"
              className="md-editor__tool-btn"
              title="Lista de viñetas"
              onClick={() => insertSyntax("- ", "", "Elemento de lista")}
            >
              • Lista
            </button>
            <button
              type="button"
              className="md-editor__tool-btn"
              title="Enlace"
              onClick={() => insertSyntax("[", "](https://ejemplo.com)", "texto del enlace")}
            >
              🔗 Enlace
            </button>
            <button
              type="button"
              className="md-editor__tool-btn"
              title="Imagen"
              onClick={() => insertSyntax("![", "](https://ejemplo.com/imagen.jpg)", "descripción imagen")}
            >
              🖼️ Imagen
            </button>
            <button
              type="button"
              className="md-editor__tool-btn"
              title="Cita"
              onClick={() => insertSyntax("> ", "", "Cita textual")}
            >
              💬 Cita
            </button>
            <button
              type="button"
              className="md-editor__tool-btn"
              title="Bloque de código"
              onClick={() => insertSyntax("```\n", "\n```", "código aquí")}
            >
              <code>&lt;/&gt;</code>
            </button>
          </div>

          {/* Área de texto */}
          <textarea
            ref={textareaRef}
            id={id}
            className="auth-field__input md-editor__textarea"
            rows={rows}
            value={value}
            onChange={(e) => handleTextareaChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            required={required}
            style={{ fontFamily: fontFamilies[editorFont] }}
          />
        </div>
      ) : (
        /* Vista previa en vivo */
        <div className="md-editor__preview-container">
          {value.trim() ? (
            <div className="md-editor__preview-content welcome-text" style={{ fontFamily: fontFamilies[editorFont] }}>
              {renderMarkdown(value)}
            </div>
          ) : (
            <p className="md-editor__preview-empty">
              <em>Nada que previsualizar aún. Escribe algo en la pestaña &quot;✍️ Escribir&quot;.</em>
            </p>
          )}
        </div>
      )}
    </div>
  );
}
