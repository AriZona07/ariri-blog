/**
 * deletion-queue.ts — Módulo genérico y reutilizable para la gestión de cola de eliminaciones programadas
 *
 * Permite marcar cualquier recurso (imágenes, publicaciones, comentarios, borradores, etc.) para su
 * desvinculación inmediata en la UI y su eliminación física definitiva en Firebase Storage/Firestore
 * el día 1 de cada mes.
 */

import {
  collection,
  addDoc,
  getDocs,
  query,
  where,
  deleteDoc,
  doc,
  updateDoc,
  serverTimestamp,
} from "firebase/firestore";
import { ref, deleteObject } from "firebase/storage";
import { db, storage } from "@/lib/firebase";

export type ResourceType = "image" | "post" | "comment" | "draft" | "file" | string;

export interface DeletionPayload {
  resourceType: ResourceType;
  url?: string | null;
  firestoreCollection?: string;
  firestoreDocId?: string;
  reason?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Registra un recurso en la cola de eliminaciones pendientes (`pending_deletions`).
 */
export async function markForDeletion(payload: DeletionPayload): Promise<void> {
  const cleanUrl = payload.url?.trim() || null;
  const docId = payload.firestoreDocId?.trim() || null;

  if (!cleanUrl && !docId) {
    return;
  }

  const isStorage = Boolean(
    cleanUrl &&
      (cleanUrl.includes("firebasestorage.googleapis.com") ||
        cleanUrl.includes("storage.googleapis.com"))
  );

  try {
    await addDoc(collection(db, "pending_deletions"), {
      resourceType: payload.resourceType,
      url: cleanUrl,
      firestoreCollection: payload.firestoreCollection || null,
      firestoreDocId: docId,
      isStorage,
      reason: payload.reason || "user_removed",
      metadata: payload.metadata || null,
      status: "pending",
      requestedAt: serverTimestamp(),
    });
  } catch (err: unknown) {
    console.warn("Aviso al registrar recurso en pending_deletions (se procederá sin interrumpir al usuario):", err);
  }
}

/**
 * Procesa y elimina físicamente todos los recursos marcados en `pending_deletions`.
 * Se ejecuta automáticamente si es el día 1 del mes, o de forma manual si `forceRun === true`.
 */
export async function processScheduledDeletions(forceRun: boolean = false): Promise<number> {
  const isFirstDayOfMonth = new Date().getDate() === 1;

  if (!isFirstDayOfMonth && !forceRun) {
    return 0;
  }

  try {
    const q = query(collection(db, "pending_deletions"), where("status", "==", "pending"));
    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      return 0;
    }

    let processedCount = 0;

    for (const itemDoc of snapshot.docs) {
      const data = itemDoc.data();

      // 1. Eliminar archivo de Firebase Storage si aplica
      if (data.url && data.isStorage) {
        try {
          const storageRef = ref(storage, data.url);
          await deleteObject(storageRef);
        } catch (storageErr: unknown) {
          console.warn(`Aviso al eliminar archivo de Storage (${data.url}):`, storageErr);
        }
      }

      // 2. Eliminar documento de Firestore si aplica
      if (data.firestoreCollection && data.firestoreDocId) {
        try {
          await deleteDoc(doc(db, data.firestoreCollection, data.firestoreDocId));
        } catch (fsErr) {
          console.warn(`Aviso al eliminar documento Firestore (${data.firestoreCollection}/${data.firestoreDocId}):`, fsErr);
        }
      }

      // 3. Marcar el registro como procesado en la cola
      try {
        await updateDoc(doc(db, "pending_deletions", itemDoc.id), {
          status: "processed",
          processedAt: serverTimestamp(),
        });
        processedCount++;
      } catch (updateErr) {
        console.warn(`Aviso al actualizar estado en pending_deletions (${itemDoc.id}):`, updateErr);
      }
    }

    return processedCount;
  } catch (err: unknown) {
    console.warn("Aviso al procesar la cola de eliminaciones programadas (posiblemente bloqueado por reglas de Firestore):", err);
    return 0;
  }
}
