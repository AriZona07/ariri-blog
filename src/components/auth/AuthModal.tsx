"use client";

/**
 * AuthModal.tsx — Modal de autenticación con tabs Login / Registro
 *
 * Se muestra como overlay cuando el usuario hace clic en el botón del header.
 * Gestiona qué formulario (LoginForm / RegisterForm) está activo.
 *
 * Props:
 *   onClose — callback para cerrar el modal (limpia el estado del header)
 */

import { useState } from "react";
import LoginForm    from "./LoginForm";
import RegisterForm from "./RegisterForm";

interface AuthModalProps {
  onClose: () => void;
}

type Tab = "login" | "register";

export default function AuthModal({ onClose }: AuthModalProps) {
  const [activeTab, setActiveTab] = useState<Tab>("login");

  /* Cierra al hacer clic en el overlay exterior */
  function handleOverlayClick(e: React.MouseEvent<HTMLDivElement>) {
    if (e.target === e.currentTarget) onClose();
  }

  return (
    <div
      className="auth-overlay"
      role="dialog"
      aria-modal="true"
      aria-label="Ventana de inicio de sesión"
      onClick={handleOverlayClick}
    >
      <div className="auth-modal">

        {/* Barra de título retro */}
        <div className="auth-modal__header">
          <span className="auth-modal__title">
            {activeTab === "login" ? "★ Iniciar Sesión ★" : "★ Crear Cuenta ★"}
          </span>
          <button
            className="auth-modal__close"
            onClick={onClose}
            aria-label="Cerrar ventana de sesión"
            id="auth-modal-close-btn"
          >
            ×
          </button>
        </div>

        {/* Tabs de navegación */}
        <div className="auth-modal__tabs" role="tablist">
          <button
            role="tab"
            aria-selected={activeTab === "login"}
            className={`auth-modal__tab${activeTab === "login" ? " auth-modal__tab--active" : ""}`}
            onClick={() => setActiveTab("login")}
            id="auth-tab-login"
          >
            Entrar
          </button>
          <button
            role="tab"
            aria-selected={activeTab === "register"}
            className={`auth-modal__tab${activeTab === "register" ? " auth-modal__tab--active" : ""}`}
            onClick={() => setActiveTab("register")}
            id="auth-tab-register"
          >
            Registrarse
          </button>
        </div>

        {/* Formulario activo */}
        <div className="auth-modal__body">
          {activeTab === "login"
            ? <LoginForm    onSuccess={onClose} />
            : <RegisterForm onSuccess={onClose} />
          }
        </div>

      </div>
    </div>
  );
}
