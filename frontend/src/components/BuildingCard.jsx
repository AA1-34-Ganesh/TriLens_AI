import { useState } from "react";
import { ConfirmationModal } from "./ConfirmationModal";
import { FloorAccordion } from "./FloorAccordion";
import { deleteBuilding, updateBuilding, addFloor, deleteFloor } from "../services/adminService";

export function BuildingCard({ building, onRefresh, onViewSpaces }) {
  const [expanded, setExpanded] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editedName, setEditedName] = useState(building.buildingName);
  const [savingName, setSavingName] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showAddFloor, setShowAddFloor] = useState(false);
  const [floorForm, setFloorForm] = useState({ floorLevel: "", totalSpaces: "" });
  const [floorFormError, setFloorFormError] = useState("");
  const [addingFloor, setAddingFloor] = useState(false);
  const [floorToDelete, setFloorToDelete] = useState(null);

  const totalSpaces = building.floors.reduce((s, f) => s + f.totalSpaces, 0);
  const totalOccupied = building.floors.reduce((s, f) => s + f.occupiedSpaces, 0);

  const saveBuildingName = async () => {
    if (!editedName.trim()) return;
    setSavingName(true);
    try {
      await updateBuilding(building._id, editedName.trim());
      onRefresh();
      setEditMode(false);
    } catch {
      setEditedName(building.buildingName);
    } finally {
      setSavingName(false);
    }
  };

  const confirmDeleteBuilding = async () => {
    try {
      await deleteBuilding(building._id);
      onRefresh();
    } catch {
      setShowDeleteConfirm(false);
    }
  };

  const submitAddFloor = async (e) => {
    e.preventDefault();
    setFloorFormError("");
    setAddingFloor(true);
    try {
      await addFloor(building._id, floorForm.floorLevel, floorForm.totalSpaces);
      setFloorForm({ floorLevel: "", totalSpaces: "" });
      setShowAddFloor(false);
      onRefresh();
    } catch (err) {
      setFloorFormError(err.response?.data?.message || "Failed to add floor");
    } finally {
      setAddingFloor(false);
    }
  };

  const confirmDeleteFloor = async () => {
    if (!floorToDelete) return;
    try {
      await deleteFloor(building._id, floorToDelete._id);
      setFloorToDelete(null);
      onRefresh();
    } catch {
      setFloorToDelete(null);
    }
  };

  return (
    <div className="building-card">
      <div className="building-card__header">
        {editMode ? (
          <div className="building-card__edit-row">
            <input
              id={`edit-building-name-${building._id}`}
              className="field-input"
              value={editedName}
              onChange={(e) => setEditedName(e.target.value)}
              autoFocus
              onKeyDown={(e) => e.key === "Enter" && saveBuildingName()}
            />
            <button
              className="btn-primary btn-sm"
              onClick={saveBuildingName}
              disabled={savingName}
            >
              {savingName ? "Saving..." : "Save"}
            </button>
            <button
              className="btn-secondary btn-sm"
              onClick={() => {
                setEditedName(building.buildingName);
                setEditMode(false);
              }}
            >
              Cancel
            </button>
          </div>
        ) : (
          <div className="building-card__title-row">
            <div>
              <p className="building-card__name">{building.buildingName}</p>
              <p className="building-card__meta">
                {building.floors.length} floor{building.floors.length !== 1 ? "s" : ""} &middot;{" "}
                {totalOccupied}/{totalSpaces} occupied
              </p>
            </div>
            <div className="building-card__actions">
              <button
                id={`edit-building-${building._id}`}
                className="btn-text"
                onClick={() => setEditMode(true)}
                aria-label={`Edit ${building.buildingName}`}
              >
                Edit
              </button>
              <button
                id={`delete-building-${building._id}`}
                className="btn-text btn-text--danger"
                onClick={() => setShowDeleteConfirm(true)}
                aria-label={`Delete ${building.buildingName}`}
              >
                Delete
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="building-card__stats">
        <div className="inline-stat">
          <span className="inline-stat__label">Floors</span>
          <span className="inline-stat__value">{building.floors.length}</span>
        </div>
        <div className="inline-stat">
          <span className="inline-stat__label">Total Spaces</span>
          <span className="inline-stat__value">{totalSpaces}</span>
        </div>
        <div className="inline-stat">
          <span className="inline-stat__label">Occupied</span>
          <span className="inline-stat__value inline-stat__value--occupied">{totalOccupied}</span>
        </div>
        <div className="inline-stat">
          <span className="inline-stat__label">Available</span>
          <span className="inline-stat__value inline-stat__value--available">
            {totalSpaces - totalOccupied}
          </span>
        </div>
      </div>

      <button
        id={`toggle-floors-${building._id}`}
        className="btn-expand"
        onClick={() => setExpanded(!expanded)}
        aria-expanded={expanded}
      >
        {expanded ? "Hide Floors" : "View Floors"}
      </button>

      {expanded && (
        <div className="floor-list">
          {building.floors.length === 0 ? (
            <p className="floor-list__empty">No floors added yet.</p>
          ) : (
            building.floors.map((floor) => (
              <FloorAccordion
                key={floor._id}
                floor={floor}
                buildingName={building.buildingName}
                onViewSpaces={onViewSpaces}
                onDeleteFloor={() => setFloorToDelete(floor)}
              />
            ))
          )}

          {!showAddFloor && (
            <button
              id={`add-floor-${building._id}`}
              className="btn-dashed"
              onClick={() => setShowAddFloor(true)}
            >
              + Add Floor
            </button>
          )}

          {showAddFloor && (
            <form className="inline-form" onSubmit={submitAddFloor}>
              <p className="inline-form__title">New Floor</p>
              <div className="field-group">
                <label className="field-label" htmlFor={`floor-name-${building._id}`}>
                  Floor Name
                </label>
                <input
                  id={`floor-name-${building._id}`}
                  className="field-input"
                  placeholder="e.g. Ground Floor, Floor 1"
                  value={floorForm.floorLevel}
                  onChange={(e) => setFloorForm({ ...floorForm, floorLevel: e.target.value })}
                  required
                />
              </div>
              <div className="field-group">
                <label className="field-label" htmlFor={`floor-spaces-${building._id}`}>
                  Total Spaces
                </label>
                <input
                  id={`floor-spaces-${building._id}`}
                  type="number"
                  min="1"
                  max="500"
                  className="field-input"
                  placeholder="e.g. 20"
                  value={floorForm.totalSpaces}
                  onChange={(e) => setFloorForm({ ...floorForm, totalSpaces: e.target.value })}
                  required
                />
              </div>
              {floorFormError && <p className="field-error">{floorFormError}</p>}
              <div className="inline-form__row">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => {
                    setShowAddFloor(false);
                    setFloorFormError("");
                    setFloorForm({ floorLevel: "", totalSpaces: "" });
                  }}
                >
                  Cancel
                </button>
                <button
                  id={`submit-floor-${building._id}`}
                  type="submit"
                  className="btn-primary"
                  disabled={addingFloor}
                >
                  {addingFloor ? "Adding..." : "Add Floor"}
                </button>
              </div>
            </form>
          )}
        </div>
      )}

      {showDeleteConfirm && (
        <ConfirmationModal
          title="Delete Building?"
          description={`This will permanently remove ${building.buildingName} and all its floors and parking spaces. This action cannot be undone.`}
          confirmLabel="Delete"
          onConfirm={confirmDeleteBuilding}
          onCancel={() => setShowDeleteConfirm(false)}
        />
      )}

      {floorToDelete && (
        <ConfirmationModal
          title="Delete Floor?"
          description={`This will permanently remove ${floorToDelete.floorLevel} and all its parking spaces. This action cannot be undone.`}
          confirmLabel="Delete"
          onConfirm={confirmDeleteFloor}
          onCancel={() => setFloorToDelete(null)}
        />
      )}
    </div>
  );
}
