import React from "react";
import Image from "next/image";
import hljs from "highlight.js";
import "highlight.js/styles/tokyo-night-dark.css";

/**
 * markdown.tsx — Utilería de formateo y renderizado nativo de Markdown a elementos React.
 *
 * Soporta:
 * - Encabezados: # H1, ## H2, ### H3
 * - Énfasis: **negrita**, *cursiva*
 * - Código: `código en línea` y ```bloques de código``` con resaltado de sintaxis (highlight.js)
 * - Listas de viñetas: - elemento o * elemento
 * - Enlaces: [texto](url)
 * - Imágenes: ![descripción](url) con Next.js Image
 * - Citas: > texto de cita
 */

/**
 * Resalta sintaxis en bloques de código utilizando highlight.js.
 */
function highlightCode(code: string, language?: string): string {
  if (language && hljs.getLanguage(language)) {
    try {
      return hljs.highlight(code, { language }).value;
    } catch {
      // Fallback si falla el lenguaje especificado
    }
  }
  try {
    return hljs.highlightAuto(code).value;
  } catch {
    return code
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  }
}

/**
 * Formatea texto inline con sintaxis Markdown (negrita, cursiva, código, enlaces e imágenes).
 */
function parseInlineMarkdown(text: string): React.ReactNode[] {
  const regex = /(!\[([^\]]*)\]\(([^)]+)\))|(\[([^\]]+)\]\(([^)]+)\))|(\*\*([^*]+)\*\*)|(\*([^*]+)\*)|(`([^`]+)`)/g;

  const nodes: React.ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      nodes.push(text.substring(lastIndex, match.index));
    }

    if (match[1]) {
      // Imagen Markdown: ![alt](url)
      const alt = match[2];
      const src = match[3];
      nodes.push(
        <Image
          key={`img-${match.index}`}
          src={src}
          alt={alt || "Imagen de la publicación"}
          width={1200}
          height={630}
          style={{ maxWidth: "100%", height: "auto", borderRadius: "4px", margin: "0.5rem 0", display: "block" }}
          unoptimized
        />
      );
    } else if (match[4]) {
      // Enlace Markdown: [label](url)
      const label = match[5];
      const href = match[6];
      nodes.push(
        <a
          key={`link-${match.index}`}
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          style={{ color: "#00f0ff", textDecoration: "underline", fontWeight: 600 }}
        >
          {label}
        </a>
      );
    } else if (match[7]) {
      // Negrita: **texto**
      nodes.push(<strong key={`b-${match.index}`}>{match[8]}</strong>);
    } else if (match[9]) {
      // Cursiva: *texto*
      nodes.push(<em key={`i-${match.index}`}>{match[10]}</em>);
    } else if (match[11]) {
      // Código en línea: `código`
      nodes.push(
        <code
          key={`code-${match.index}`}
          style={{
            background: "#1e172a",
            color: "#00ff66",
            padding: "0.1rem 0.35rem",
            borderRadius: "3px",
            fontSize: "0.85em",
            fontFamily: "var(--font-mono)",
            border: "1px solid rgba(0, 255, 102, 0.2)",
          }}
        >
          {match[12]}
        </code>
      );
    }

    lastIndex = regex.lastIndex;
  }

  if (lastIndex < text.length) {
    nodes.push(text.substring(lastIndex));
  }

  return nodes;
}

/**
 * Renderiza un documento de Markdown completo como elementos React maquetados.
 */
export function renderMarkdown(content: string): React.ReactNode {
  if (!content || !content.trim()) return null;

  // 1. Extraer bloques de código (```lang ... ```)
  const codeBlockRegex = /```([a-zA-Z0-9_-]*)\n?([\s\S]*?)```/g;
  const blocks: { type: "code" | "text"; language?: string; content: string }[] = [];
  let lastIdx = 0;
  let codeMatch: RegExpExecArray | null;

  while ((codeMatch = codeBlockRegex.exec(content)) !== null) {
    if (codeMatch.index > lastIdx) {
      blocks.push({ type: "text", content: content.substring(lastIdx, codeMatch.index) });
    }
    const lang = codeMatch[1].trim();
    const code = codeMatch[2];
    blocks.push({ type: "code", language: lang, content: code });
    lastIdx = codeBlockRegex.lastIndex;
  }
  if (lastIdx < content.length) {
    blocks.push({ type: "text", content: content.substring(lastIdx) });
  }

  const elements: React.ReactNode[] = [];
  let keyCounter = 0;

  blocks.forEach((block) => {
    if (block.type === "code") {
      const highlightedHtml = highlightCode(block.content, block.language);
      elements.push(
        <pre
          key={`code-block-${keyCounter++}`}
          style={{
            background: "#09060f",
            border: "1px solid var(--color-border)",
            borderLeft: "3px solid #00ff66",
            borderRadius: "4px",
            padding: "0.85rem 1rem",
            overflowX: "auto",
            fontFamily: "var(--font-mono)",
            fontSize: "0.85rem",
            lineHeight: "1.45",
            margin: "0.85rem 0",
          }}
        >
          <code
            className={`hljs ${block.language ? `language-${block.language}` : ""}`}
            dangerouslySetInnerHTML={{ __html: highlightedHtml }}
          />
        </pre>
      );
    } else {
      const lines = block.content.split("\n");
      let listItems: string[] = [];

      const flushList = () => {
        if (listItems.length > 0) {
          elements.push(
            <ul key={`ul-${keyCounter++}`} style={{ paddingLeft: "1.4rem", margin: "0.6rem 0" }}>
              {listItems.map((item, i) => (
                <li key={i} style={{ marginBottom: "0.25rem", color: "var(--color-text-secondary)" }}>
                  {parseInlineMarkdown(item)}
                </li>
              ))}
            </ul>
          );
          listItems = [];
        }
      };

      lines.forEach((line) => {
        const trimmed = line.trim();

        // Viñetas de lista (- elemento o * elemento)
        if (/^[-*]\s+/.test(trimmed)) {
          listItems.push(trimmed.replace(/^[-*]\s+/, ""));
          return;
        } else {
          flushList();
        }

        if (!trimmed) return;

        // Encabezados
        if (trimmed.startsWith("### ")) {
          elements.push(
            <h3 key={`h3-${keyCounter++}`} style={{ fontSize: "1.1rem", color: "#00ff66", margin: "1rem 0 0.4rem", fontWeight: 700 }}>
              {parseInlineMarkdown(trimmed.replace(/^###\s+/, ""))}
            </h3>
          );
        } else if (trimmed.startsWith("## ")) {
          elements.push(
            <h2 key={`h2-${keyCounter++}`} style={{ fontSize: "1.3rem", color: "#00ff66", margin: "1.2rem 0 0.5rem", fontWeight: 700 }}>
              {parseInlineMarkdown(trimmed.replace(/^##\s+/, ""))}
            </h2>
          );
        } else if (trimmed.startsWith("# ")) {
          elements.push(
            <h1 key={`h1-${keyCounter++}`} style={{ fontSize: "1.5rem", color: "#00ff66", margin: "1.4rem 0 0.6rem", fontWeight: 700 }}>
              {parseInlineMarkdown(trimmed.replace(/^#\s+/, ""))}
            </h1>
          );
        } else if (trimmed.startsWith("> ")) {
          // Citas
          elements.push(
            <blockquote
              key={`quote-${keyCounter++}`}
              style={{
                borderLeft: "3px solid #00f0ff",
                background: "rgba(0, 240, 255, 0.04)",
                padding: "0.5rem 0.85rem",
                borderRadius: "0 4px 4px 0",
                color: "var(--color-text-muted)",
                fontStyle: "italic",
                margin: "0.6rem 0",
              }}
            >
              {parseInlineMarkdown(trimmed.replace(/^>\s+/, ""))}
            </blockquote>
          );
        } else {
          // Párrafos normales
          elements.push(
            <p key={`p-${keyCounter++}`} style={{ margin: "0.5rem 0", lineHeight: "1.6" }}>
              {parseInlineMarkdown(line)}
            </p>
          );
        }
      });

      flushList();
    }
  });

  return <>{elements}</>;
}
