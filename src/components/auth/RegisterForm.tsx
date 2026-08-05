"use client";

/**
 * RegisterForm.tsx — Formulario de creación de cuenta
 *
 * Crea la cuenta con Email + Contraseña y asigna el displayName inicial.
 * Requiere la aceptación obligatoria de los Términos y Condiciones antes de registrarse.
 * También ofrece registro rápido con Google.
 *
 * Props:
 *   onSuccess — callback invocado tras el registro exitoso (cierra el modal)
 */

import { useState } from "react";
import Link         from "next/link";
import {
  createUserWithEmailAndPassword,
  updateProfile,
  signInWithPopup,
  GoogleAuthProvider,
} from "firebase/auth";
import { auth } from "@/lib/firebase";

interface RegisterFormProps {
  onSuccess: () => void;
}

const googleProvider = new GoogleAuthProvider();

export default function RegisterForm({ onSuccess }: RegisterFormProps) {
  const [name,          setName]          = useState("");
  const [email,         setEmail]         = useState("");
  const [password,      setPassword]      = useState("");
  const [confirm,       setConfirm]       = useState("");
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [error,         setError]         = useState<string | null>(null);
  const [loading,       setLoading]       = useState(false);

  /* --- Registro con Email/Password --- */
  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!acceptedTerms) {
      setError("Debes aceptar los Términos y Condiciones para poder registrarte.");
      return;
    }
    if (password !== confirm) {
      setError("Las contraseñas no coinciden.");
      return;
    }
    if (password.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres.");
      return;
    }

    setLoading(true);
    try {
      const { user } = await createUserWithEmailAndPassword(auth, email, password);
      // Asigna el nombre de usuario en el perfil de Firebase Auth
      await updateProfile(user, { displayName: name.trim() || "Amigo/a" });
      onSuccess();
    } catch (err: unknown) {
      setError(friendlyError(err));
    } finally {
      setLoading(false);
    }
  }

  /* --- Registro rápido con Google --- */
  async function handleGoogleRegister() {
    setError(null);
    if (!acceptedTerms) {
      setError("Debes aceptar los Términos y Condiciones para poder registrarte.");
      return;
    }

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
    <form onSubmit={handleRegister} noValidate>

      {error && <p className="auth-error" role="alert">{error}</p>}

      <div className="auth-field">
        <label htmlFor="reg-name" className="auth-field__label">Apodo / Nombre</label>
        <input
          id="reg-name"
          type="text"
          className="auth-field__input"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="xX_tu_apodo_Xx"
          autoComplete="nickname"
        />
      </div>

      <div className="auth-field">
        <label htmlFor="reg-email" className="auth-field__label">Correo Electrónico</label>
        <input
          id="reg-email"
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
        <label htmlFor="reg-password" className="auth-field__label">Contraseña</label>
        <input
          id="reg-password"
          type="password"
          className="auth-field__input"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="mín. 6 caracteres"
          required
          autoComplete="new-password"
        />
      </div>

      <div className="auth-field">
        <label htmlFor="reg-confirm" className="auth-field__label">Confirmar Contraseña</label>
        <input
          id="reg-confirm"
          type="password"
          className="auth-field__input"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          placeholder="repite la contraseña"
          required
          autoComplete="new-password"
        />
      </div>

      {/* Casilla obligatoria de Términos y Condiciones */}
      <div className="auth-terms-checkbox-field">
        <label className="auth-terms-label">
          <input
            type="checkbox"
            className="auth-terms-checkbox"
            checked={acceptedTerms}
            onChange={(e) => setAcceptedTerms(e.target.checked)}
            id="register-terms-checkbox"
            required
          />
          <span>
            He leído y acepto los{" "}
            <Link
              href="/settings/terms"
              target="_blank"
              rel="noopener noreferrer"
              className="auth-terms-link"
            >
              Términos y Condiciones
            </Link>
          </span>
        </label>
      </div>

      <button
        type="submit"
        className="auth-btn-primary"
        disabled={loading || !acceptedTerms}
        id="register-submit-btn"
      >
        {loading ? "Creando cuenta..." : "Crear Cuenta"}
      </button>

      <div className="auth-divider">o</div>

      <button
        type="button"
        className="auth-btn-google"
        onClick={handleGoogleRegister}
        disabled={loading || !acceptedTerms}
        id="register-google-btn"
      >
        <svg className="auth-btn-google__icon" viewBox="0 0 48 48" aria-hidden="true">
          <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
          <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
          <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
          <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
        </svg>
        Registrarse con Google
      </button>

    </form>
  );
}

function friendlyError(err: unknown): string {
  const code = (err as { code?: string })?.code ?? "";
  const map: Record<string, string> = {
    "auth/email-already-in-use":  "Ya existe una cuenta con ese correo.",
    "auth/invalid-email":         "El correo no tiene formato válido.",
    "auth/weak-password":         "La contraseña es demasiado débil.",
    "auth/popup-closed-by-user":  "Cerraste la ventana de Google antes de terminar.",
  };
  return map[code] ?? "Ocurrió un error. Intenta de nuevo.";
}
