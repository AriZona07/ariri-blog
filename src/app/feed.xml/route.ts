/**
 * src/app/feed.xml/route.ts — Route Handler para el feed RSS 2.0
 *
 * Genera dinámicamente el XML del feed combinando:
 *   1. Posts Markdown locales (src/content/*.md), leídos con gray-matter en servidor.
 *   2. Posts de Firestore (publicados desde /admin), leídos con Firebase Admin SDK.
 *
 * Al estar en Vercel (sin output: 'export'), este route handler se ejecuta
 * en cada petición como una serverless function de Node.js.
 *
 * Para añadir Firebase Admin SDK (necesario para leer Firestore en servidor):
 *   npm install firebase-admin
 * Y configurar las variables de entorno en Vercel:
 *   FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY
 */

import { NextResponse } from "next/server";

/* --- Tipos internos --- */
interface FeedItem {
  title:   string;
  slug:    string;
  date:    string;
  excerpt: string;
}

/* URL base del sitio */
const SITE_URL  = "https://ariri.app";
const SITE_NAME = "Ariri Blog";
const SITE_DESC = "Blog personal de Ariri — videojuegos, manga, linux, punk y más.";

export async function GET() {
  const items: FeedItem[] = [];

  /* ── 1. Leer publicaciones desde la API REST pública de Firestore ─ */
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  if (projectId) {
    try {
      const res = await fetch(
        `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/posts`,
        { next: { revalidate: 3600 } }
      );
      if (res.ok) {
        const data = await res.json();
        if (data.documents && Array.isArray(data.documents)) {
          const nowMs = Date.now();
          for (const doc of data.documents) {
            const fields = doc.fields || {};
            const status = fields.status?.stringValue || "published";

            if (status === "draft") continue;
            if (status === "scheduled") {
              const scheduledStr = fields.scheduledAt?.timestampValue;
              if (scheduledStr) {
                const scheduledTime = new Date(scheduledStr).getTime();
                if (scheduledTime > nowMs) continue;
              }
            }

            const title   = fields.title?.stringValue   || "(Sin título)";
            const slug    = fields.slug?.stringValue    || doc.name.split("/").pop() || "";
            const date    = fields.date?.stringValue    || "";
            const content = fields.content?.stringValue || "";
            items.push({
              title,
              slug,
              date,
              excerpt: content.slice(0, 200).replace(/\n/g, " "),
            });
          }
        }
      }
    } catch (err) {
      console.error("Error al obtener publicaciones para el feed RSS:", err);
    }
  }

  /* Ordenar todo por fecha descendente */
  items.sort((a, b) => {
    if (!a.date && !b.date) return 0;
    if (!a.date) return 1;
    if (!b.date) return -1;
    return b.date.localeCompare(a.date);
  });

  /* ── 3. Generar XML RSS 2.0 ──────────────────────────── */
  const itemsXml = items
    .map((item) => {
      const link    = `${SITE_URL}/#post-${item.slug}`;
      const pubDate = item.date ? new Date(item.date).toUTCString() : new Date().toUTCString();
      return `
    <item>
      <title><![CDATA[${item.title}]]></title>
      <link>${link}</link>
      <guid isPermaLink="true">${link}</guid>
      <pubDate>${pubDate}</pubDate>
      <description><![CDATA[${item.excerpt}]]></description>
      <source url="${SITE_URL}/feed.xml">${SITE_NAME}</source>
    </item>`;
    })
    .join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${SITE_NAME}</title>
    <link>${SITE_URL}</link>
    <description>${SITE_DESC}</description>
    <language>es-mx</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <atom:link href="${SITE_URL}/feed.xml" rel="self" type="application/rss+xml"/>
    ${itemsXml}
  </channel>
</rss>`;

  return new NextResponse(xml, {
    status: 200,
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      // Cache de 1 hora en Vercel Edge
      "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
    },
  });
}
