/**
 * comments.ts — Servicios de lógica y persistencia para comentarios y respuestas en Firestore
 */

import {
  collection,
  doc,
  addDoc,
  getDoc,
  getDocs,
  updateDoc,
  increment,
  arrayUnion,
  arrayRemove,
  getCountFromServer,
  serverTimestamp,
  type Timestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { markForDeletion } from "@/lib/deletion-queue";
import { createUserNotification, getUserNotificationPrefs } from "@/lib/notifications";

export interface ReplyToTarget {
  id: string;
  authorName: string;
  textSnippet: string;
}

export interface CommentReply {
  id: string;
  text: string;
  authorName: string;
  authorPhoto: string | null;
  authorId: string;
  createdAt: Date | null;
  likesCount: number;
  likedBy: string[];
  isDeleted?: boolean;
  replyTo?: ReplyToTarget | null;
}

export interface TopLevelComment {
  id: string;
  text: string;
  authorName: string;
  authorPhoto: string | null;
  authorId: string;
  createdAt: Date | null;
  likesCount: number;
  replyCount: number;
  likedBy: string[];
  isDeleted?: boolean;
  replies?: CommentReply[];
  hasMoreReplies?: boolean;
}

/**
 * Formatea fechas según regla:
 * Si es el mismo día calendario: "Hoy a las HH:MM"
 * Si es de días anteriores: "DD/MM/AAAA"
 */
export function formatCommentDate(dateInput?: Date | Timestamp | null): string {
  if (!dateInput) return "";
  const date = dateInput instanceof Date ? dateInput : (dateInput as Timestamp).toDate();
  if (isNaN(date.getTime())) return "";

  const now = new Date();
  const isToday =
    date.getDate() === now.getDate() &&
    date.getMonth() === now.getMonth() &&
    date.getFullYear() === now.getFullYear();

  if (isToday) {
    const timeStr = date.toLocaleTimeString("es-MX", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
    return `Hoy a las ${timeStr}`;
  }

  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
}

/**
 * Obtiene el conteo total de comentarios principales usando count() para optimizar lecturas
 */
export async function getCommentCount(postSlug: string): Promise<number> {
  try {
    const collRef = collection(db, "posts", postSlug, "comments");
    const snapshot = await getCountFromServer(collRef);
    return snapshot.data().count;
  } catch (err) {
    console.warn("Aviso al obtener conteo de comentarios:", err);
    return 0;
  }
}

/**
 * Obtiene los comentarios principales de un post.
 * Ordenación:
 * 1º Notificación (si priorityCommentId está especificado)
 * 2º Número de Me gusta (Likes desc)
 * 3º Cronológico (más reciente primero)
 */
export async function getTopLevelComments(
  postSlug: string,
  priorityCommentId?: string
): Promise<TopLevelComment[]> {
  try {
    const collRef = collection(db, "posts", postSlug, "comments");
    const snap = await getDocs(collRef);

    const list: TopLevelComment[] = snap.docs.map((docSnap) => {
      const d = docSnap.data();
      const rawDate = d.createdAt?.toDate ? d.createdAt.toDate() : null;
      return {
        id: docSnap.id,
        text: d.text ?? "",
        authorName: d.authorName ?? "Anónimo",
        authorPhoto: d.authorPhoto ?? null,
        authorId: d.authorId ?? "",
        createdAt: rawDate,
        likesCount: Number(d.likesCount ?? 0),
        replyCount: Number(d.replyCount ?? 0),
        likedBy: Array.isArray(d.likedBy) ? d.likedBy : [],
        isDeleted: Boolean(d.isDeleted),
        replies: [],
      };
    });

    // Filtrar comentarios totalmente borrados que NO tengan respuestas
    const visibleList = list.filter((c) => !c.isDeleted || c.replyCount > 0);

    // Ordenar en memoria
    visibleList.sort((a, b) => {
      if (priorityCommentId) {
        if (a.id === priorityCommentId) return -1;
        if (b.id === priorityCommentId) return 1;
      }

      if (b.likesCount !== a.likesCount) {
        return b.likesCount - a.likesCount;
      }

      const timeA = a.createdAt ? a.createdAt.getTime() : 0;
      const timeB = b.createdAt ? b.createdAt.getTime() : 0;
      return timeB - timeA;
    });

    return visibleList;
  } catch (err) {
    console.error("Error al obtener comentarios principales:", err);
    return [];
  }
}

/**
 * Obtiene respuestas de un comentario principal en bloques de 3 en 3 (o completas).
 * Ordenación: 1º Notificación (si priorityReplyId), 2º Cronológico (más antiguo primero)
 */
export async function getRepliesForComment(
  postSlug: string,
  commentId: string,
  priorityReplyId?: string
): Promise<CommentReply[]> {
  try {
    const repliesRef = collection(db, "posts", postSlug, "comments", commentId, "replies");
    const snap = await getDocs(repliesRef);

    const list: CommentReply[] = snap.docs.map((docSnap) => {
      const d = docSnap.data();
      const rawDate = d.createdAt?.toDate ? d.createdAt.toDate() : null;
      return {
        id: docSnap.id,
        text: d.text ?? "",
        authorName: d.authorName ?? "Anónimo",
        authorPhoto: d.authorPhoto ?? null,
        authorId: d.authorId ?? "",
        createdAt: rawDate,
        likesCount: Number(d.likesCount ?? 0),
        likedBy: Array.isArray(d.likedBy) ? d.likedBy : [],
        isDeleted: Boolean(d.isDeleted),
        replyTo: d.replyTo || null,
      };
    });

    const visibleReplies = list.filter((r) => !r.isDeleted);

    visibleReplies.sort((a, b) => {
      if (priorityReplyId) {
        if (a.id === priorityReplyId) return -1;
        if (b.id === priorityReplyId) return 1;
      }

      const timeA = a.createdAt ? a.createdAt.getTime() : 0;
      const timeB = b.createdAt ? b.createdAt.getTime() : 0;
      return timeA - timeB;
    });

    return visibleReplies;
  } catch (err) {
    console.error("Error al obtener respuestas:", err);
    return [];
  }
}

/**
 * Agrega un nuevo comentario principal en el post
 */
export async function addComment(
  postSlug: string,
  text: string,
  user: { uid: string; displayName?: string | null; photoURL?: string | null }
): Promise<TopLevelComment> {
  const authorName = user.displayName || "Amigo/a";
  const authorPhoto = user.photoURL || null;

  const docRef = await addDoc(collection(db, "posts", postSlug, "comments"), {
    text: text.trim(),
    authorName,
    authorPhoto,
    authorId: user.uid,
    createdAt: serverTimestamp(),
    likesCount: 0,
    replyCount: 0,
    likedBy: [],
    isDeleted: false,
  });

  return {
    id: docRef.id,
    text: text.trim(),
    authorName,
    authorPhoto,
    authorId: user.uid,
    createdAt: new Date(),
    likesCount: 0,
    replyCount: 0,
    likedBy: [],
    isDeleted: false,
    replies: [],
  };
}

/**
 * Agrega una respuesta a un comentario (o a una respuesta previa)
 */
export async function addReply(
  postSlug: string,
  parentCommentId: string,
  text: string,
  user: { uid: string; displayName?: string | null; photoURL?: string | null },
  replyToTarget?: ReplyToTarget | null
): Promise<CommentReply> {
  const authorName = user.displayName || "Amigo/a";
  const authorPhoto = user.photoURL || null;

  // 1. Crear documento en la subcolección `replies`
  const replyRef = await addDoc(
    collection(db, "posts", postSlug, "comments", parentCommentId, "replies"),
    {
      text: text.trim(),
      authorName,
      authorPhoto,
      authorId: user.uid,
      createdAt: serverTimestamp(),
      likesCount: 0,
      likedBy: [],
      isDeleted: false,
      replyTo: replyToTarget || null,
    }
  );

  // 2. Intentar incrementar el contador `replyCount` en el comentario principal (proteger contra reglas de Firestore)
  try {
    const parentRef = doc(db, "posts", postSlug, "comments", parentCommentId);
    await updateDoc(parentRef, {
      replyCount: increment(1),
    });
  } catch (parentErr) {
    console.warn("Aviso al actualizar contador replyCount en el comentario padre (restringido por reglas de Firestore):", parentErr);
  }

  // 3. Notificar al autor del comentario o respuesta de forma asíncrona (si no es auto-respuesta)
  try {
    const parentRef = doc(db, "posts", postSlug, "comments", parentCommentId);
    const parentSnap = await getDoc(parentRef);
    if (parentSnap.exists()) {
      const parentData = parentSnap.data();
      const parentAuthorId = parentData.authorId;

      if (parentAuthorId && parentAuthorId !== user.uid) {
        const prefs = await getUserNotificationPrefs(parentAuthorId);
        if (prefs.inApp.newReplies) {
          await createUserNotification(parentAuthorId, {
            title: "💬 Nueva respuesta a tu comentario",
            message: `${authorName}: "${text.trim().slice(0, 50)}..."`,
            postSlug,
            commentId: replyRef.id,
            type: "reply",
          });
        }
      }
    }
  } catch (notifErr) {
    console.warn("Aviso al generar notificación de respuesta:", notifErr);
  }

  return {
    id: replyRef.id,
    text: text.trim(),
    authorName,
    authorPhoto,
    authorId: user.uid,
    createdAt: new Date(),
    likesCount: 0,
    likedBy: [],
    isDeleted: false,
    replyTo: replyToTarget || null,
  };
}

/**
 * Alterna el me gusta de un comentario o respuesta (Optimista / Atómico)
 */
export async function toggleCommentLike(
  postSlug: string,
  commentId: string,
  userId: string,
  isReply: boolean = false,
  parentCommentId?: string
): Promise<{ liked: boolean; newCount: number }> {
  const targetRef = isReply && parentCommentId
    ? doc(db, "posts", postSlug, "comments", parentCommentId, "replies", commentId)
    : doc(db, "posts", postSlug, "comments", commentId);

  const snap = await getDoc(targetRef);
  if (!snap.exists()) {
    throw new Error("El comentario no existe.");
  }

  const data = snap.data();
  const likedBy: string[] = Array.isArray(data.likedBy) ? data.likedBy : [];
  const hasLiked = likedBy.includes(userId);

  try {
    if (hasLiked) {
      await updateDoc(targetRef, {
        likedBy: arrayRemove(userId),
        likesCount: increment(-1),
      });
      return { liked: false, newCount: Math.max(0, (data.likesCount || 1) - 1) };
    } else {
      await updateDoc(targetRef, {
        likedBy: arrayUnion(userId),
        likesCount: increment(1),
      });
      return { liked: true, newCount: (data.likesCount || 0) + 1 };
    }
  } catch (err: unknown) {
    console.warn("Aviso al guardar me gusta en Firestore (posiblemente restringido por reglas de Firestore o bloqueador de anuncios):", err);
    // Retornar la actualización optimista para que la UI no falle
    return {
      liked: !hasLiked,
      newCount: !hasLiked ? (data.likesCount || 0) + 1 : Math.max(0, (data.likesCount || 1) - 1),
    };
  }
}

/**
 * Elimina un comentario o respuesta:
 * - Si es comentario principal con respuestas -> Borrado estilo Reddit ("[Comentario eliminado]").
 * - Si no tiene respuestas o es respuesta -> Borrado visual inmediato y registro en `pending_deletions`.
 */
export async function deleteComment(
  postSlug: string,
  commentId: string,
  userId: string,
  isAdmin: boolean,
  isReply: boolean = false,
  parentCommentId?: string,
  currentReplyCount: number = 0
): Promise<{ mode: "reddit" | "hard" }> {
  const targetRef = isReply && parentCommentId
    ? doc(db, "posts", postSlug, "comments", parentCommentId, "replies", commentId)
    : doc(db, "posts", postSlug, "comments", commentId);

  const snap = await getDoc(targetRef);
  if (!snap.exists()) {
    return { mode: "hard" };
  }

  const data = snap.data();
  const isAuthor = data.authorId === userId;
  if (!isAuthor && !isAdmin) {
    throw new Error("No tienes permiso para eliminar este comentario.");
  }

  // 1. Borrado Estilo Reddit (si es comentario principal y tiene respuestas)
  if (!isReply && currentReplyCount > 0) {
    await updateDoc(targetRef, {
      isDeleted: true,
      text: "[Comentario eliminado]",
      authorName: "",
      authorPhoto: null,
      authorId: "",
      likedBy: [],
    });
    return { mode: "reddit" };
  }

  // 2. Borrado Total / Cola de eliminaciones
  if (isReply && parentCommentId) {
    const parentRef = doc(db, "posts", postSlug, "comments", parentCommentId);
    await updateDoc(parentRef, {
      replyCount: increment(-1),
    });
  }

  // Marcar isDeleted en Firestore para ocultar inmediatamente
  await updateDoc(targetRef, {
    isDeleted: true,
  });

  // Registrar en la cola para su eliminación física el día 1 del mes
  const collectionPath = isReply && parentCommentId
    ? `posts/${postSlug}/comments/${parentCommentId}/replies`
    : `posts/${postSlug}/comments`;

  await markForDeletion({
    resourceType: "comment",
    firestoreCollection: collectionPath,
    firestoreDocId: commentId,
    reason: isAdmin ? "admin_deleted" : "author_deleted",
  });

  return { mode: "hard" };
}
