"use client";

/**
 * LoginForm.tsx — Formulario de inicio de sesión
 *
 * Soporta dos métodos:
 *   1. Email + Contraseña (signInWithEmailAndPassword)
 *   2. Google Sign-In (signInWithPopup + GoogleAuthProvider)
 *
 * Props:
 *   onSuccess — callback que se invoca tras un login exitoso (cierra el modal)
 */

import { useState } from "react";
import {
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
} from "firebase/auth";
import { auth } from "@/lib/firebase";

interface LoginFormProps {
  onSuccess: () => void;
}

// Instancia del proveedor de Google (se reutiliza)
const googleProvider = new GoogleAuthProvider();

export default function LoginForm({ onSuccess }: LoginFormProps) {
  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [error,    setError]    = useState<string | null>(null);
  const [loading,  setLoading]  = useState(false);

  /* --- Login con Email/Password --- */
  async function handleEmailLogin(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      onSuccess();
    } catch (err: unknown) {
      setError(friendlyError(err));
    } finally {
      setLoading(false);
    }
  }

  /* --- Login con Google --- */
  async function handleGoogleLogin() {
    setError(null);
    setLoading(true);
    try {
      await signInWithPopup(auth, googleProvider);
      onSuccess();
    } catch (err: unknown) {
      setError(friendlyError(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleEmailLogin} noValidate>

      {error && <p className="auth-error" role="alert">{error}</p>}

      <div className="auth-field">
        <label htmlFor="login-email" className="auth-field__label">Correo Electrónico</label>
        <input
          id="login-email"
          type="email"
          className="auth-field__input"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="tu@correo.com"
          required
          autoComplete="email"
        />
      </div>

      <div className="auth-field">
        <label htmlFor="login-password" className="auth-field__label">Contraseña</label>
        <input
          id="login-password"
          type="password"
          className="auth-field__input"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
          required
          autoComplete="current-password"
        />
      </div>

      <button
        type="submit"
        className="auth-btn-primary"
        disabled={loading}
        id="login-submit-btn"
      >
        {loading ? "Entrando..." : "Iniciar Sesión"}
      </button>

      <div className="auth-divider">o</div>

      <button
        type="button"
        className="auth-btn-google"
        onClick={handleGoogleLogin}
        disabled={loading}
        id="login-google-btn"
      >
        {/* Ícono SVG de Google (sin imágenes externas) */}
        <svg className="auth-btn-google__icon" viewBox="0 0 48 48" aria-hidden="true">
          <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
          <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
          <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
          <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
        </svg>
        Continuar con Google
      </button>

    </form>
  );
}

/* --- Traduce códigos de error de Firebase a mensajes amigables --- */
function friendlyError(err: unknown): string {
  const code = (err as { code?: string })?.code ?? "";
  const map: Record<string, string> = {
    "auth/user-not-found":       "No existe cuenta con ese correo.",
    "auth/wrong-password":       "Contraseña incorrecta.",
    "auth/invalid-email":        "El correo no es válido.",
    "auth/invalid-credential":   "Correo o contraseña incorrectos.",
    "auth/too-many-requests":    "Demasiados intentos. Espera un momento.",
    "auth/popup-closed-by-user": "Cerraste la ventana de Google antes de terminar.",
  };
  return map[code] ?? "Ocurrió un error. Intenta de nuevo.";
}
