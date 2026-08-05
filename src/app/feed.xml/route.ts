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
import path             from "path";
import fs               from "fs";
import matter           from "gray-matter";

/* --- Tipos internos --- */
interface FeedItem {
  title:   string;
  slug:    string;
  date:    string;
  excerpt: string;
  source:  "markdown" | "firestore";
}

/* URL base del sitio */
const SITE_URL  = "https://ariri.app";
const SITE_NAME = "Ariri Blog";
const SITE_DESC = "Blog personal de Ariri — videojuegos, manga, linux, punk y más.";

export async function GET() {
  const items: FeedItem[] = [];

  /* ── 1. Leer posts Markdown locales ──────────────────── */
  const contentDir = path.join(process.cwd(), "src", "content");
  if (fs.existsSync(contentDir)) {
    const files = fs.readdirSync(contentDir).filter((f) => f.endsWith(".md"));
    for (const file of files) {
      const raw = fs.readFileSync(path.join(contentDir, file), "utf-8");
      const { data, content } = matter(raw);
      items.push({
        title:   String(data.title   ?? file.replace(".md", "")),
        slug:    file.replace(".md", ""),
        date:    String(data.date    ?? ""),
        excerpt: String(data.excerpt ?? content.slice(0, 200).replace(/\n/g, " ")),
        source:  "markdown",
      });
    }
  }

  /* ── 2. Leer posts de Firestore (con Firebase Admin SDK) ─
   *
   * NOTA: Esta sección requiere instalar `firebase-admin` y configurar
   * las variables de entorno de la Service Account en Vercel.
   * Mientras no estén configuradas, solo se incluyen los posts Markdown.
   *
   * Para activarlo en el futuro, descomenta el bloque de abajo e instala:
   *   npm install firebase-admin
   *
   * import { initializeApp, getApps, cert } from "firebase-admin/app";
   * import { getFirestore }                 from "firebase-admin/firestore";
   *
   * if (!getApps().length) {
   *   initializeApp({
   *     credential: cert({
   *       projectId:   process.env.FIREBASE_PROJECT_ID,
   *       clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
   *       privateKey:  process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
   *     }),
   *   });
   * }
   * const adminDb   = getFirestore();
   * const snapshot  = await adminDb.collection("posts").orderBy("date", "desc").get();
   * for (const doc of snapshot.docs) {
   *   const d = doc.data();
   *   items.push({
   *     title:   d.title   ?? "(Sin título)",
   *     slug:    d.slug    ?? doc.id,
   *     date:    d.date    ?? "",
   *     excerpt: d.content?.slice(0, 200).replace(/\n/g, " ") ?? "",
   *     source:  "firestore",
   *   });
   * }
   ────────────────────────────────────────────────────── */

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
