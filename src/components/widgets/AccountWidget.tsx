"use client";

/**
 * AccountWidget.tsx — Formulario de gestión de perfil y credenciales del usuario (/settings/account)
 *
 * Funciones:
 *   - Editar apodo (displayName)
 *   - Actualizar foto de perfil (URL externa o subir imagen a Firebase Storage)
 *   - Cambiar contraseña (solo usuarios registrados con Email/Password)
 *   - Solicitud de eliminación de cuenta con período de gracia de 15 días
 *   - Enlace a Términos y Condiciones (/settings/terms)
 */

import { useState }                         from "react";
import Image                                from "next/image";
import Link                                 from "next/link";
import {
  updateProfile,
  updatePassword,
  EmailAuthProvider,
  reauthenticateWithCredential,
  signOut,
} from "firebase/auth";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { doc, setDoc, serverTimestamp }     from "firebase/firestore";
import { auth, storage, db }                from "@/lib/firebase";
import { useAuth }                          from "@/lib/auth-context";

export default function AccountWidget() {
  const { user, isAdmin, reloadUser } = useAuth();

  // Campos del formulario
  const [displayName, setDisplayName] = useState(user?.displayName ?? "");
  const [photoMode,   setPhotoMode]   = useState<"url" | "file">("url");
  const [photoURL,    setPhotoURL]    = useState(user?.photoURL   ?? "");
  const [photoFile,   setPhotoFile]   = useState<File | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [currentPass, setCurrentPass] = useState("");

  // Estado de eliminación de cuenta
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingAccount, setDeletingAccount] = useState(false);

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
          // Validar tamaño máximo del archivo (5 MB)
          if (photoFile.size > 5 * 1024 * 1024) {
            setError("El archivo es demasiado grande. El límite para la foto de perfil es 5 MB.");
            setSaving(false);
            return;
          }

          setUploading(true);
          const cleanFileName = photoFile.name.replace(/[^a-zA-Z0-9._-]/g, "_");
          const storageRef    = ref(storage, `avatars/${currentUser.uid}/${Date.now()}_${cleanFileName}`);
          const snapshot      = await uploadBytes(storageRef, photoFile);
          finalPhotoURL       = await getDownloadURL(snapshot.ref);
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
    } catch (err: unknown) {
      console.error("Error al actualizar perfil:", err);
      const errMsg = err instanceof Error ? err.message : String(err);
      if (errMsg.includes("storage/unauthorized") || errMsg.includes("permission-denied")) {
        setError("Error de permisos en Firebase Storage: Asegúrate de tener las reglas activas en la consola de Firebase.");
      } else if (errMsg.includes("storage/retry-limit-exceeded") || errMsg.includes("network")) {
        setError("Error de conexión al subir la imagen. Verifica tu red e inténtalo de nuevo.");
      } else {
        setError(`No se pudo actualizar el perfil: ${errMsg || "Error desconocido."}`);
      }
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

  /* --- Confirmar solicitud de eliminación de cuenta --- */
  async function handleConfirmDeleteAccount() {
    setDeletingAccount(true);
    try {
      // Registrar la propiedad eliminar_cuenta: true y marca de tiempo en Firestore
      await setDoc(doc(db, "users", currentUser.uid), {
        eliminar_cuenta:    true,
        eliminar_cuenta_at: serverTimestamp(),
        email:              currentUser.email,
      }, { merge: true });

      // Cerrar sesión
      await signOut(auth);
    } catch (err) {
      console.error("Error al solicitar eliminación de cuenta:", err);
      setError("No se pudo procesar la solicitud de eliminación de cuenta.");
      setDeletingAccount(false);
      setShowDeleteModal(false);
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
            style={{ width: "auto", height: "auto" }}
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

      {/* ─── Sección: Borrado de Cuenta (Zona de Peligro) ─ */}
      <div style={{ marginTop: "2rem" }}>
        <p className="account-section-title" style={{ color: "#ff4444", borderColor: "#ff4444" }}>
          ⚠️ Zona de Peligro
        </p>

        <button
          type="button"
          className="account-delete-btn"
          onClick={() => setShowDeleteModal(true)}
          id="acc-delete-account-btn"
        >
          🗑️ Eliminar mi cuenta
        </button>
      </div>

      {/* ─── Enlace a Términos y Condiciones (al final) ── */}
      <div style={{ marginTop: "2rem", textTransform: "center", textAlign: "center" }}>
        <Link href="/settings/terms" className="account-terms-link" id="acc-terms-link">
          📜 Términos y Condiciones
        </Link>
      </div>

      {/* ─── Modal Pop-up de Confirmación de Eliminación de Cuenta ─ */}
      {showDeleteModal && (
        <div
          className="drafts-modal-overlay"
          onClick={() => setShowDeleteModal(false)}
          role="dialog"
          aria-modal="true"
          aria-label="Confirmar eliminación de cuenta"
        >
          <div
            className="drafts-modal"
            style={{ maxWidth: "520px" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="drafts-modal__header" style={{ background: "linear-gradient(90deg, #8b0000 0%, #4a0000 100%)" }}>
              <span className="drafts-modal__title">⚠️ Eliminar Cuenta</span>
              <button
                type="button"
                className="drafts-modal__close"
                onClick={() => setShowDeleteModal(false)}
                aria-label="Cerrar modal"
              >
                ✕
              </button>
            </div>

            <div className="drafts-modal__body" style={{ padding: "1.25rem" }}>
              <div style={{ fontSize: "0.85rem", color: "var(--color-text-primary)", lineHeight: "1.5" }}>
                <p style={{ fontWeight: "bold", color: "#ff4444", marginBottom: "0.75rem" }}>
                  ¿Estás seguro de que deseas solicitar la eliminación de tu cuenta?
                </p>

                <div style={{
                  background: "rgba(255, 0, 0, 0.1)",
                  border: "1px dashed #ff4444",
                  padding: "0.85rem",
                  borderRadius: "var(--radius-sm)",
                  marginBottom: "1rem"
                }}>
                  <p style={{ margin: "0 0 0.5rem 0", fontWeight: "bold" }}>
                    🔒 Información sobre la eliminación y privacidad de tus datos:
                  </p>
                  <ul style={{ paddingLeft: "1.2rem", margin: 0 }}>
                    <li>
                      Toda tu información personal, perfil y configuraciones serán eliminados definitivamente <strong>después de 15 días</strong>.
                    </li>
                    <li>
                      Este periodo de 15 días evita la sobrecarga en servidores y te brinda tiempo por si decides regresar.
                    </li>
                  </ul>
                </div>

                <div style={{
                  background: "rgba(0, 255, 102, 0.08)",
                  border: "1px solid #00ff66",
                  padding: "0.85rem",
                  borderRadius: "var(--radius-sm)",
                  marginBottom: "1rem"
                }}>
                  <p style={{ margin: "0 0 0.4rem 0", color: "#00ff66", fontWeight: "bold" }}>
                    💡 ¿Cómo cancelar la eliminación y recuperar tu cuenta?
                  </p>
                  <p style={{ margin: 0, fontSize: "0.8rem", color: "var(--color-text-secondary)" }}>
                    Si en algún momento dentro de los próximos 15 días vuelves a <strong>iniciar sesión</strong>, la solicitud de eliminación se cancelará automáticamente y tu cuenta permanecerá 100% activa.
                  </p>
                </div>
              </div>

              <div style={{ display: "flex", gap: "0.75rem", marginTop: "1.25rem", justifyContent: "flex-end" }}>
                <button
                  type="button"
                  className="auth-btn-primary"
                  style={{ background: "#333", color: "#fff", flex: 1 }}
                  onClick={() => setShowDeleteModal(false)}
                  disabled={deletingAccount}
                >
                  Cancelar
                </button>

                <button
                  type="button"
                  className="account-delete-btn"
                  style={{ flex: 1.5, marginTop: 0 }}
                  onClick={handleConfirmDeleteAccount}
                  disabled={deletingAccount}
                  id="acc-confirm-delete-btn"
                >
                  {deletingAccount ? "Procesando…" : "Confirmar (15 días)"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
