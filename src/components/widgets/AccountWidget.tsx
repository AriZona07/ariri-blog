"use client";

/**
 * AccountWidget.tsx — Formulario de gestión de perfil y credenciales del usuario (/settings/account)
 *
 * Funciones:
 *   - Editar apodo (displayName)
 *   - Actualizar foto de perfil (URL externa o subir imagen a Firebase Storage)
 *   - Cambiar contraseña (solo usuarios registrados con Email/Password)
 */

import { useState }                         from "react";
import Image                                from "next/image";
import {
  updateProfile,
  updatePassword,
  EmailAuthProvider,
  reauthenticateWithCredential,
} from "firebase/auth";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage }                           from "@/lib/firebase";
import { useAuth }                           from "@/lib/auth-context";

export default function AccountWidget() {
  const { user, isAdmin, reloadUser } = useAuth();

  // Campos del formulario
  const [displayName, setDisplayName] = useState(user?.displayName ?? "");
  const [photoMode,   setPhotoMode]   = useState<"url" | "file">("url");
  const [photoURL,    setPhotoURL]    = useState(user?.photoURL   ?? "");
  const [photoFile,   setPhotoFile]   = useState<File | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [currentPass, setCurrentPass] = useState("");

  // Estado de UI
  const [saving,    setSaving]    = useState(false);
  const [success,   setSuccess]   = useState<string | null>(null);
  const [error,     setError]     = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  if (!user) return null;

  const currentUser = user;

  // ¿El usuario inició sesión con Email/Password?
  const hasEmailProvider = currentUser.providerData.some(
    (p) => p.providerId === "password"
  );

  /* --- Guardar cambios de perfil (nombre + foto) --- */
  async function handleSaveProfile(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      let finalPhotoURL: string | undefined = currentUser.photoURL ?? undefined;

      if (photoMode === "file") {
        if (photoFile) {
          setUploading(true);
          const storageRef = ref(storage, `avatars/${currentUser.uid}/${photoFile.name}`);
          const snapshot   = await uploadBytes(storageRef, photoFile);
          finalPhotoURL    = await getDownloadURL(snapshot.ref);
          setPhotoURL(finalPhotoURL);
        } else if (!photoURL) {
          finalPhotoURL = undefined;
        }
      } else {
        finalPhotoURL = photoURL.trim() || undefined;
      }

      await updateProfile(currentUser, {
        displayName: displayName.trim() || currentUser.displayName,
        photoURL:    finalPhotoURL,
      });
      await reloadUser();
      setSuccess("Perfil actualizado correctamente.");
    } catch (err) {
      console.error("Error al actualizar perfil:", err);
      setError("No se pudo actualizar el perfil.");
    } finally {
      setSaving(false);
      setUploading(false);
    }
  }

  /* --- Cambiar contraseña --- */
  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault();
    if (!newPassword || !currentPass) return;
    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      const credential = EmailAuthProvider.credential(currentUser.email!, currentPass);
      await reauthenticateWithCredential(currentUser, credential);
      await updatePassword(currentUser, newPassword);
      setNewPassword("");
      setCurrentPass("");
      setSuccess("Contraseña actualizada correctamente.");
    } catch {
      setError("La contraseña actual es incorrecta o la nueva es muy débil.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="account-page">

      {/* --- Avatar + Info del usuario --- */}
      <div className="account-avatar-section">
        {user.photoURL ? (
          <Image
            src={user.photoURL}
            alt="foto de perfil"
            width={72}
            height={72}
            className="account-avatar"
          />
        ) : (
          <div className="account-avatar-placeholder" aria-hidden>👤</div>
        )}
        <div className="account-user-info">
          <p className="account-user-info__name">{user.displayName || "Sin apodo"}</p>
          <p className="account-user-info__email">{user.email}</p>
          {isAdmin && (
            <span className="account-user-info__badge">⚙ Admin</span>
          )}
        </div>
      </div>

      {/* --- Feedback global --- */}
      {success && <p className="account-success" role="status">{success}</p>}
      {error   && <p className="auth-error"      role="alert">{error}</p>}

      {/* ─── Sección: Perfil ────────────────────────── */}
      <form onSubmit={handleSaveProfile}>
        <p className="account-section-title">✎ Editar Perfil</p>

        <div className="auth-field">
          <label htmlFor="acc-name" className="auth-field__label">Apodo / Nombre</label>
          <input
            id="acc-name"
            type="text"
            className="auth-field__input"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="xX_tu_apodo_Xx"
            autoComplete="nickname"
          />
        </div>

        <div className="auth-field">
          <label className="auth-field__label">Foto de Perfil</label>

          <div style={{ display: "flex", gap: "1.25rem", marginBottom: "0.75rem", marginTop: "0.4rem" }}>
            <label style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem", fontSize: "0.8rem", color: "var(--color-text-primary)", cursor: "pointer" }}>
              <input
                type="radio"
                name="photoMode"
                value="url"
                checked={photoMode === "url"}
                onChange={() => {
                  setPhotoMode("url");
                  setPhotoFile(null);
                }}
              />
              🔗 Enlace URL Externo
            </label>

            <label style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem", fontSize: "0.8rem", color: "#00ff66", cursor: "pointer" }}>
              <input
                type="radio"
                name="photoMode"
                value="file"
                checked={photoMode === "file"}
                onChange={() => {
                  setPhotoMode("file");
                  setPhotoURL("");
                }}
              />
              📁 Subir imagen desde mi dispositivo
            </label>
          </div>

          {photoMode === "url" ? (
            <input
              id="acc-photo"
              type="url"
              className="auth-field__input"
              value={photoURL}
              onChange={(e) => setPhotoURL(e.target.value)}
              placeholder="https://ejemplo.com/mi-foto.png"
            />
          ) : (
            <div>
              <input
                id="acc-upload"
                type="file"
                accept="image/*"
                className="auth-field__input"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    setPhotoFile(e.target.files[0]);
                  }
                }}
              />
              {photoFile && (
                <p style={{ fontSize: "0.75rem", color: "#00ff66", marginTop: "0.4rem" }}>
                  ✓ Archivo seleccionado: <strong>{photoFile.name}</strong> ({Math.round(photoFile.size / 1024)} KB)
                </p>
              )}
            </div>
          )}
        </div>

        <button
          type="submit"
          className="auth-btn-primary"
          disabled={saving || uploading}
          id="acc-save-profile-btn"
        >
          {saving || uploading ? "Guardando..." : "Guardar Cambios"}
        </button>
      </form>

      {/* ─── Sección: Cambio de Contraseña (solo Email) ─ */}
      {hasEmailProvider && (
        <form onSubmit={handleChangePassword}>
          <p className="account-section-title">🔒 Cambiar Contraseña</p>

          <div className="auth-field">
            <label htmlFor="acc-curr-pass" className="auth-field__label">Contraseña Actual</label>
            <input
              id="acc-curr-pass"
              type="password"
              className="auth-field__input"
              value={currentPass}
              onChange={(e) => setCurrentPass(e.target.value)}
              placeholder="••••••••"
              autoComplete="current-password"
            />
          </div>

          <div className="auth-field">
            <label htmlFor="acc-new-pass" className="auth-field__label">Nueva Contraseña</label>
            <input
              id="acc-new-pass"
              type="password"
              className="auth-field__input"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="mín. 6 caracteres"
              autoComplete="new-password"
            />
          </div>

          <button
            type="submit"
            className="auth-btn-primary"
            disabled={saving || !currentPass || !newPassword}
            id="acc-change-pass-btn"
          >
            {saving ? "Actualizando..." : "Actualizar Contraseña"}
          </button>
        </form>
      )}

    </div>
  );
}
