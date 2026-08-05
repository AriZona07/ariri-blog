/**
 * page.tsx — Página de inicio (ruta "/")
 *
 * Muestra las publicaciones del blog leídas dinámicamente desde Firestore
 * a través de PostList.
 */

import PostList from "@/components/PostList";

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

export default function HomePage() {
  return <PostList />;
}
