"use client";

/**
 * /admin/page.tsx — Panel de administración (acceso exclusivo para admin)
 *
 * Protección doble:
 *   1. Cliente: redirige a "/" si no hay sesión o si isAdmin es false.
 *   2. Servidor: Firestore Security Rules rechazan escrituras sin claim admin.
 *
 * Muestra la lista de posts de Firestore y un botón para crear nuevas entradas.
 */

import { useEffect, useState } from "react";
import { useRouter }           from "next/navigation";
import Link                    from "next/link";
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  type DocumentData,
} from "firebase/firestore";
import { db }      from "@/lib/firebase";
import { useAuth } from "@/lib/auth-context";

interface FirestorePost {
  id:    string;
  title: string;
  date:  string;
  slug:  string;
}

export default function AdminPage() {
  const { user, isAdmin, loading } = useAuth();
  const router = useRouter();

  const [posts,    setPosts]    = useState<FirestorePost[]>([]);
  const [fetching, setFetching] = useState(true);

  /* Redirección de seguridad lado cliente */
  useEffect(() => {
    if (!loading && (!user || !isAdmin)) {
      router.replace("/");
    }
  }, [user, isAdmin, loading, router]);

  /* Suscripción en tiempo real a la colección `posts` de Firestore */
  useEffect(() => {
    if (!isAdmin) return;

    const q = query(collection(db, "posts"), orderBy("date", "desc"));
    const unsub = onSnapshot(q, (snap) => {
      const data: FirestorePost[] = snap.docs.map((doc: DocumentData) => ({
        id:    doc.id,
        title: doc.data().title ?? "(Sin título)",
        date:  doc.data().date  ?? "",
        slug:  doc.data().slug  ?? doc.id,
      }));
      setPosts(data);
      setFetching(false);
    });

    return () => unsub();
  }, [isAdmin]);

  /* Pantalla de carga / acceso denegado */
  if (loading || (!loading && !isAdmin)) {
    return (
      <div className="retro-box">
        <div className="retro-box__header">Panel Admin</div>
        <div className="admin-access-denied">
          <span className="admin-access-denied__icon">🚫</span>
          Acceso denegado. Redirigiendo…
        </div>
      </div>
    );
  }

  return (
    <div className="retro-box">
      <div className="retro-box__header">⚙ Panel de Administración</div>
      <div className="retro-box__body">
        <div className="admin-page">

          <div className="admin-page__header">
            <h2 className="admin-page__title">Entradas en Firestore</h2>
            <Link href="/admin/new-post" className="admin-btn-new" id="admin-new-post-link">
              + Nueva Entrada
            </Link>
          </div>

          {fetching ? (
            <p className="admin-empty">Cargando entradas…</p>
          ) : posts.length === 0 ? (
            <p className="admin-empty">
              No hay entradas publicadas aún. ¡Crea la primera!
            </p>
          ) : (
            <div className="admin-post-list">
              {posts.map((post) => (
                <div key={post.id} className="admin-post-item">
                  <span className="admin-post-item__title">{post.title}</span>
                  <span className="admin-post-item__date">{post.date}</span>
                </div>
              ))}
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
