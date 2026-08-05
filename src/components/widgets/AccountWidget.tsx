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

import { useState, useRef, useEffect }        from "react";
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
  const [photoURL,    setPhotoURL]    = useState(user?.photoURL   ?? "");
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
  const [saving,   setSaving]   = useState(false);
  const [success,  setSuccess]  = useState<string | null>(null);
  const [error,    setError]    = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

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

  /* --- Guardar cambios de perfil (nombre + foto URL) --- */
  async function handleSaveProfile(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      await updateProfile(currentUser, {
        displayName: displayName.trim() || currentUser.displayName,
        photoURL:    photoURL.trim()    || undefined,
      });
      await reloadUser();
      setSuccess("Perfil actualizado correctamente.");
    } catch (err) {
      console.error("Error al actualizar perfil:", err);
      setError("No se pudo actualizar el perfil.");
    } finally {
      setSaving(false);
    }
  }

  /* --- Subir imagen a Firebase Storage y obtener URL --- */
  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError(null);
    setSuccess(null);
    try {
      // Ruta: avatars/{uid}/{filename}
      const storageRef = ref(storage, `avatars/${currentUser.uid}/${file.name}`);
      const snapshot   = await uploadBytes(storageRef, file);
      const url        = await getDownloadURL(snapshot.ref);
      setPhotoURL(url);
      await updateProfile(currentUser, {
        displayName: displayName.trim() || currentUser.displayName,
        photoURL:    url,
      });
      await reloadUser();
      setSuccess("Imagen subida y perfil actualizado con éxito.");
    } catch (err) {
      console.error("Error al subir imagen:", err);
      setError("No se pudo subir la imagen.");
    } finally {
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
          <label htmlFor="acc-photo" className="auth-field__label">URL de Foto de Perfil</label>
          <input
            id="acc-photo"
            type="url"
            className="auth-field__input"
            value={photoURL}
            onChange={(e) => setPhotoURL(e.target.value)}
            placeholder="https://ejemplo.com/mi-foto.png"
          />
        </div>

        {/* Subida directa a Firebase Storage */}
        <div className="auth-field">
          <label className="auth-field__label">
            — O sube una imagen —
          </label>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            style={{ display: "none" }}
            id="acc-upload"
            onChange={handleImageUpload}
          />
          <button
            type="button"
            className="auth-btn-primary"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            id="acc-upload-btn"
          >
            {uploading ? "Subiendo..." : "Subir imagen desde mi PC"}
          </button>
        </div>

        <button
          type="submit"
          className="auth-btn-primary"
          disabled={saving}
          id="acc-save-profile-btn"
        >
          {saving ? "Guardando..." : "Guardar Cambios"}
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
