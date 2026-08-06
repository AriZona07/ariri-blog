"use client";

/**
 * MarkdownEditor.tsx — Editor de Markdown con accesos rápidos y previsualización en vivo
 *
 * Ubicación: src/components/ui/MarkdownEditor.tsx
 *
 * Características:
 * - Pestañas "✍️ Escribir" y "👁️ Previsualizar" (ideal para pantallas móviles).
 * - Barra de accesos rápidos para insertar sintaxis común de Markdown.
 * - Manipulación nativa de selección de texto en textarea (selectionStart / selectionEnd).
 */

import { useState, useRef } from "react";

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
  const [activeTab, setActiveTab] = useState<"write" | "preview">("write");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

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

    onChange(newContent);

    // Ajustar el foco y el rango de selección después de insertar
    setTimeout(() => {
      el.focus();
      const newCursorStart = start + prefix.length;
      const newCursorEnd = newCursorStart + textToInsert.length;
      el.setSelectionRange(newCursorStart, newCursorEnd);
    }, 0);
  };

  return (
    <div className="md-editor">
      {/* Pestañas superiores */}
      <div className="md-editor__tabs">
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

      {activeTab === "write" ? (
        <div className="md-editor__write-container">
          {/* Barra de accesos rápidos */}
          <div className="md-editor__toolbar" role="toolbar" aria-label="Accesos rápidos de Markdown">
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
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            required={required}
          />
        </div>
      ) : (
        /* Vista previa en vivo */
        <div className="md-editor__preview-container">
          {value.trim() ? (
            <div className="md-editor__preview-content welcome-text">
              {value}
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
