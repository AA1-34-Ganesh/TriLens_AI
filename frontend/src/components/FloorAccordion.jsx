export function FloorAccordion({ floor, buildingName, onViewSpaces, onDeleteFloor }) {
  const available = floor.totalSpaces - floor.occupiedSpaces;
  const occupancyWidth =
    floor.totalSpaces > 0
      ? Math.round((floor.occupiedSpaces / floor.totalSpaces) * 100)
      : 0;

  return (
    <div className="floor-row">
      <div className="floor-row__header">
        <div className="floor-row__info">
          <p className="floor-row__name">{floor.floorLevel}</p>
          <p className="floor-row__meta">
            {floor.totalSpaces} spaces &middot; {floor.occupiedSpaces} occupied &middot; {available} free
          </p>
          <div className="floor-occupancy-bar">
            <div
              className="floor-occupancy-bar__fill"
              style={{ width: `${occupancyWidth}%` }}
              aria-label={`${occupancyWidth}% occupied`}
            />
          </div>
        </div>
        <div className="floor-row__actions">
          <button
            id={`view-spaces-${floor._id}`}
            className="btn-text"
            onClick={() => onViewSpaces(buildingName, floor.floorLevel)}
            aria-label={`View spaces for ${floor.floorLevel}`}
          >
            Spaces
          </button>
          <button
            id={`delete-floor-${floor._id}`}
            className="btn-text btn-text--danger"
            onClick={onDeleteFloor}
            aria-label={`Delete ${floor.floorLevel}`}
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}
