export function ConfirmationModal({ title, description, onConfirm, onCancel, confirmLabel = "Delete", dangerous = true }) {
  return (
    <div className="modal-backdrop" onClick={onCancel}>
      <div className="modal-box" onClick={(e) => e.stopPropagation()}>
        <p className="modal-title">{title}</p>
        <p className="modal-description">{description}</p>
        <div className="modal-actions">
          <button
            id="modal-cancel-btn"
            type="button"
            className="btn-secondary"
            onClick={onCancel}
          >
            Cancel
          </button>
          <button
            id="modal-confirm-btn"
            type="button"
            className={dangerous ? "btn-danger" : "btn-primary"}
            onClick={onConfirm}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
