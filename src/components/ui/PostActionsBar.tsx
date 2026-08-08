"use client";

/**
 * PostActionsBar.tsx — Barra de botones de acción para el formulario de administración de publicaciones.
 *
 * Ubicación: src/components/ui/PostActionsBar.tsx
 */

interface PostActionsBarProps {
  saving:          boolean;
  savingDraft:     boolean;
  revertingDraft:  boolean;
  deletingDraft:   boolean;
  isEditing:       boolean;
  isDraft:         boolean;
  publishLabel?:   string;
  onSaveDraft:     () => void;
  onRevertToDraft: () => void;
  onDeleteDraft:   () => void;
}

export default function PostActionsBar({
  saving,
  savingDraft,
  revertingDraft,
  deletingDraft,
  isEditing,
  isDraft,
  publishLabel,
  onSaveDraft,
  onRevertToDraft,
  onDeleteDraft,
}: PostActionsBarProps) {
  const isBusy = saving || savingDraft || revertingDraft || deletingDraft;

  const defaultLabel = isEditing ? "★ Guardar cambios ★" : "★ Publicar post ★";
  const labelText = saving ? "Guardando…" : publishLabel || defaultLabel;

  return (
    <div className="new-post-actions-bar">
      <button
        type="submit"
        className="auth-btn-primary"
        disabled={isBusy}
        id="np-publish-btn"
      >
        {labelText}
      </button>

      <button
        type="button"
        className="admin-btn-draft-action"
        disabled={isBusy}
        onClick={onSaveDraft}
        id="np-save-draft-btn"
      >
        {savingDraft ? "Guardando…" : "💾 Guardar borrador"}
      </button>

      {isEditing && (
        <button
          type="button"
          className="admin-btn-draft-action"
          style={{ border: "2px solid #ffff00", color: "#ffff00" }}
          disabled={isBusy}
          onClick={onRevertToDraft}
          id="np-revert-draft-btn"
        >
          {revertingDraft ? "Moviendo…" : "↩️ Regresar a borrador"}
        </button>
      )}

      {isDraft && (
        <button
          type="button"
          className="admin-btn-delete-draft"
          disabled={isBusy}
          onClick={onDeleteDraft}
          id="np-delete-draft-btn"
        >
          {deletingDraft ? "Eliminando…" : "🗑 Eliminar borrador"}
        </button>
      )}
    </div>
  );
}
