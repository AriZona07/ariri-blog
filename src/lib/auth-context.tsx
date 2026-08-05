"use client";

/**
 * auth-context.tsx — Contexto global de autenticación Firebase
 *
 * Provee al árbol completo de componentes el estado de sesión:
 *   - user:    objeto FirebaseUser | null
 *   - isAdmin: true si el token JWT tiene el custom claim `admin: true`
 *   - loading: true mientras se determina el estado inicial de sesión
 *
 * Para marcar a alguien como admin, debes usar Firebase Admin SDK
 * (Cloud Functions o script server-side) y llamar a:
 *   admin.auth().setCustomUserClaims(uid, { admin: true })
 */

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { onAuthStateChanged, type User } from "firebase/auth";
import { auth } from "@/lib/firebase";

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
  const [user,    setUser]    = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  // Recarga el objeto de usuario desde Firebase Auth para actualizar photoURL, displayName, etc. en tiempo real
  async function reloadUser() {
    if (auth.currentUser) {
      await auth.currentUser.reload();
      // Forzar una nueva referencia del objeto user para actualizar los componentes dependientes
      setUser(Object.assign(Object.create(Object.getPrototypeOf(auth.currentUser)), auth.currentUser));
    }
  }

  useEffect(() => {
    // onAuthStateChanged dispara en login, logout y recarga de página
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);

      if (firebaseUser) {
        // Leer el custom claim `admin` del JWT
        const tokenResult = await firebaseUser.getIdTokenResult();
        setIsAdmin(tokenResult.claims["admin"] === true);
      } else {
        setIsAdmin(false);
      }

      setLoading(false);
    });

    return () => unsubscribe(); // Limpieza al desmontar
  }, []);

  return (
    <AuthContext.Provider value={{ user, isAdmin, loading, reloadUser }}>
      {children}
    </AuthContext.Provider>
  );
}

/* --- Hook de consumo: useAuth() --- */

/**
 * useAuth — devuelve { user, isAdmin, loading } desde cualquier Client Component.
 * Lanza error si se usa fuera del AuthProvider.
 */
export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (ctx === undefined) {
    throw new Error("useAuth debe usarse dentro de <AuthProvider>");
  }
  return ctx;
}
