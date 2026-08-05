"use client";

/**
 * AccountWidget.tsx — Panel de gestión de cuenta del usuario
 *
 * Funciones:
 *   - Editar apodo (displayName)
 *   - Actualizar foto de perfil (URL externa o upload a Firebase Storage)
 *   - Cambiar contraseña
 *   - Ver correo y proveedor vinculado (Google / Email)
 *   - Acceso a /admin (solo si isAdmin === true)
 */

import { useState, useEffect }           from "react";
import Image                              from "next/image";
import Link                               from "next/link";
import {
  updateProfile,
  updatePassword,
  EmailAuthProvider,
  reauthenticateWithCredential,
} from "firebase/auth";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage }                           from "@/lib/firebase";
import { useAuth }                           from "@/lib/auth-context";
import {
  getUserNotificationPrefs,
  setUserNotificationPrefs,
  requestBrowserNotificationPermission,
} from "@/lib/notifications";

export default function AccountWidget() {
  const { user, isAdmin, reloadUser } = useAuth();

  // Campos del formulario
  const [displayName, setDisplayName] = useState(user?.displayName ?? "");
  const [photoMode,   setPhotoMode]   = useState<"url" | "file">("url");
  const [photoURL,    setPhotoURL]    = useState(user?.photoURL   ?? "");
  const [photoFile,   setPhotoFile]   = useState<File | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [currentPass, setCurrentPass] = useState("");

  // Notificaciones
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [browserPerm, setBrowserPerm] = useState<string>(() => {
    if (typeof window !== "undefined" && "Notification" in window) {
      return Notification.permission;
    }
    return "default";
  });

  // Estado de UI
  const [saving,    setSaving]    = useState(false);
  const [success,   setSuccess]   = useState<string | null>(null);
  const [error,     setError]     = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    let isMounted = true;
    if (user) {
      getUserNotificationPrefs(user.uid).then((pref) => {
        if (isMounted) setNotificationsEnabled(pref);
      });
    }
    return () => {
      isMounted = false;
    };
  }, [user]);

  async function handleToggleNotifications(enabled: boolean) {
    if (!user) return;
    setNotificationsEnabled(enabled);
    setSuccess(null);
    setError(null);
    try {
      await setUserNotificationPrefs(user.uid, enabled);
      setSuccess(`Notificaciones ${enabled ? "activadas" : "desactivadas"} correctamente.`);
    } catch {
      setError("No se pudieron guardar las preferencias de notificaciones.");
    }
  }

  async function handleRequestBrowserPerm() {
    const perm = await requestBrowserNotificationPermission();
    setBrowserPerm(perm);
    if (perm === "granted") {
      setSuccess("Permisos de notificación del navegador concedidos.");
    } else if (perm === "denied") {
      setError("Permisos de notificación bloqueados en el navegador.");
    }
  }

  if (!user) return null;

  // Captura non-null para que TypeScript no falle dentro de los callbacks async
  const currentUser = user;

  // ¿El usuario inició sesión con Email/Password? (permite cambio de contraseña)
  const hasEmailProvider = currentUser.providerData.some(
    (p) => p.providerId === "password"
  );

  /* --- Guardar cambios de perfil (nombre + foto URL o archivo local) --- */
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

  /* --- Cambiar contraseña (requiere re-autenticación) --- */
  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault();
    if (!newPassword || !currentPass) return;
    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      // Re-autenticar antes de cambiar la contraseña (requisito de Firebase)
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

      {/* ─── Sección: Configuración de Notificaciones ──── */}
      <div>
        <p className="account-section-title">🔔 Configuración de Notificaciones</p>
        <div className="notification-settings-card">
          <label className="notification-toggle-label">
            <input
              type="checkbox"
              className="notification-toggle-checkbox"
              checked={notificationsEnabled}
              onChange={(e) => handleToggleNotifications(e.target.checked)}
              id="acc-notifications-toggle"
            />
            <span className="notification-toggle-text">
              Recibir notificaciones cuando haya un nuevo post / publicación
            </span>
          </label>

          <div className="notification-browser-status">
            <span>
              Avisos del navegador:{" "}
              <strong>
                {browserPerm === "granted"
                  ? "Permitidos ✅"
                  : browserPerm === "denied"
                  ? "Bloqueados ❌"
                  : "Sin solicitar"}
              </strong>
            </span>
            {browserPerm !== "granted" && (
              <button
                type="button"
                className="notification-perm-btn"
                onClick={handleRequestBrowserPerm}
                id="acc-request-notifications-btn"
              >
                Activar avisos
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ─── Acceso Admin (solo para administradores) ── */}
      {isAdmin && (
        <>
          <p className="account-section-title">⚙ Panel de Administración</p>
          <Link href="/admin" className="account-admin-link" id="acc-admin-link">
            ★ Ir al Panel Admin ★
          </Link>
        </>
      )}

    </div>
  );
}
