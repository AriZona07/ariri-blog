"use client";

/**
 * auth-context.tsx — Contexto global de autenticación Firebase
 *
 * Provee al árbol completo de componentes el estado de sesión:
 *   - user:    objeto FirebaseUser | null
 *   - isAdmin: true si el token JWT tiene el custom claim `admin: true`
 *   - loading: true mientras se determina el estado inicial de sesión
 *
 * Incluye la cancelación automática de solicitud de eliminación de cuenta (período de gracia de 15 días)
 * al volver a iniciar sesión.
 */

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { onAuthStateChanged, type User } from "firebase/auth";
import { doc, getDoc, setDoc }            from "firebase/firestore";
import { auth, db }                       from "@/lib/firebase";

/* --- Tipos del contexto --- */

interface AuthContextValue {
  user:       User | null;
  isAdmin:    boolean;
  loading:    boolean;
  reloadUser: () => Promise<void>;
}

/* --- Creación del contexto con valores por defecto seguros --- */

const AuthContext = createContext<AuthContextValue>({
  user:       null,
  isAdmin:    false,
  loading:    true,
  reloadUser: async () => {},
});

/* --- Provider: envuelve la app en layout.tsx --- */

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user,                   setUser]                   = useState<User | null>(null);
  const [isAdmin,                setIsAdmin]                = useState(false);
  const [loading,                setLoading]                = useState(true);
  const [deletionRestoredNotice, setDeletionRestoredNotice] = useState<string | null>(null);

  // Recarga el objeto de usuario desde Firebase Auth
  async function reloadUser() {
    if (auth.currentUser) {
      await auth.currentUser.reload();
      setUser(Object.assign(Object.create(Object.getPrototypeOf(auth.currentUser)), auth.currentUser));
    }
  }

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);

      if (firebaseUser) {
        // Leer el custom claim `admin` del JWT
        const tokenResult = await firebaseUser.getIdTokenResult();
        setIsAdmin(tokenResult.claims["admin"] === true);

        // Comprobar si existía una solicitud de eliminación de cuenta activa
        try {
          const userRef = doc(db, "users", firebaseUser.uid);
          const snap    = await getDoc(userRef);
          if (snap.exists() && snap.data()?.eliminar_cuenta === true) {
            // Cancela automáticamente la eliminación al iniciar sesión dentro del período de 15 días
            await setDoc(userRef, {
              eliminar_cuenta: false,
              eliminar_cuenta_at: null,
            }, { merge: true });

            setDeletionRestoredNotice(
              "¡Bienvenid@ de nuevo! Tu solicitud de eliminación de cuenta ha sido cancelada automáticamente y tu cuenta seguirá activa."
            );
          }
        } catch (err) {
          console.warn("No se pudo consultar el estado de eliminación de cuenta:", err);
        }
      } else {
        setIsAdmin(false);
      }

      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ user, isAdmin, loading, reloadUser }}>
      {children}

      {/* Aviso emergente de cancelación automática de eliminación de cuenta */}
      {deletionRestoredNotice && (
        <div className="account-deletion-restored-toast" role="status">
          <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
            <span style={{ fontSize: "1.2rem" }}>🎉</span>
            <div style={{ flex: 1 }}>{deletionRestoredNotice}</div>
            <button
              type="button"
              className="notification-toast__close"
              onClick={() => setDeletionRestoredNotice(null)}
              aria-label="Cerrar aviso"
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </AuthContext.Provider>
  );
}

/* --- Hook de consumo: useAuth() --- */

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (ctx === undefined) {
    throw new Error("useAuth debe usarse dentro de <AuthProvider>");
  }
  return ctx;
}
