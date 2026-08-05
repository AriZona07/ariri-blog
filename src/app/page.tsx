/**
 * page.tsx — Página de inicio (ruta "/")
 *
 * Server Component: lee todos los archivos .md de /src/content/ con gray-matter,
 * los ordena de más reciente a más antiguo (por el campo `date` del frontmatter)
 * y los pasa a PostList para que gestione la paginación en el cliente.
 */

import path   from "path";
import fs     from "fs";
import matter from "gray-matter";

import PostList from "@/components/PostList";
import { extractYouTubePlaylistId } from "@/lib/youtube";

export interface Post {
  slug:        string;
  title:       string;
  date:        string;   /* ISO 8601: "YYYY-MM-DD" */
  mood:        string;
  song:        string;
  songCover?:  string;
  playlist?:   string;
  playlistId?: string;
  cover?:      string;
  excerpt:     string;
  content:     string;
}

/** Lee y ordena todos los posts de /src/content/ */
function getAllPosts(): Post[] {
  const contentDir = path.join(process.cwd(), "src", "content");

  /* Si la carpeta no existe o está vacía, devuelve array vacío */
  if (!fs.existsSync(contentDir)) return [];

  const files = fs.readdirSync(contentDir).filter((f) => f.endsWith(".md"));

  const posts: Post[] = files.map((filename) => {
    const slug    = filename.replace(/\.md$/, "");
    const raw     = fs.readFileSync(path.join(contentDir, filename), "utf-8");
    const { data, content } = matter(raw);

    const playlistRaw = data.playlist ? String(data.playlist) : undefined;
    const playlistId  = playlistRaw ? extractYouTubePlaylistId(playlistRaw) : undefined;

    return {
      slug,
      title:      String(data.title   ?? slug),
      date:       String(data.date    ?? ""),
      mood:       String(data.mood    ?? ""),
      song:       String(data.song    ?? ""),
      songCover:  data.songCover ? String(data.songCover) : undefined,
      playlist:   playlistRaw,
      playlistId: playlistId,
      cover:      data.cover ? String(data.cover) : undefined,
      excerpt:    String(data.excerpt ?? ""),
      content:    content.trim(),
    };
  });

  /* Orden cronológico inverso: más reciente primero (página 1) */
  return posts.sort((a, b) => {
    if (!a.date && !b.date) return 0;
    if (!a.date) return 1;
    if (!b.date) return -1;
    return b.date.localeCompare(a.date);
  });
}

export default function HomePage() {
  const posts = getAllPosts();

  return <PostList posts={posts} />;
}
