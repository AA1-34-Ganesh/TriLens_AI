import { useState, useEffect } from "react";
import { createBuilding, deleteBuilding, updateBuilding, addFloor, deleteFloor, fetchBuildings, fetchSpaces, fetchBlocks } from "../services/adminService";
import QRCode from "qrcode";
import { QRModal } from "../components/QRModal";

function FloorRow({ floor, buildingId, buildingName, onRefresh, onViewSpaces }) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const available = floor.totalSpaces - floor.occupiedSpaces;
  const pct = floor.totalSpaces > 0 ? Math.round((floor.occupiedSpaces / floor.totalSpaces) * 100) : 0;

  const handleDelete = async () => {
    setDeleting(true);
    try { await deleteFloor(buildingId, floor._id); onRefresh(); } catch { setDeleting(false); setConfirmDelete(false); }
  };

  return (
    <div className="bg-[#0F172A] border border-[#334155] rounded-md px-3 py-2.5">
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0">
          <p className="text-[#F8FAFC] text-sm font-medium">{floor.floorLevel}</p>
          <div className="flex items-center gap-3 mt-1">
            <span className="text-[#94A3B8] text-xs">{floor.totalSpaces} total</span>
            <span className="text-[#22C55E] text-xs">{available} free</span>
            <span className="text-[#EF4444] text-xs">{floor.occupiedSpaces} occupied</span>
          </div>
          <div className="progress-track mt-1.5 w-24">
            <div className={`progress-fill ${pct > 80 ? "progress-fill--red" : "progress-fill--green"}`} style={{ width: `${pct}%` }} />
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button id={`view-spaces-${floor._id}`} className="btn-ghost btn-sm" onClick={() => onViewSpaces(buildingName, floor.floorLevel)}>Spaces</button>
          {confirmDelete ? (
            <div className="flex gap-1">
              <button className="btn btn-danger btn-sm" onClick={handleDelete} disabled={deleting}>{deleting ? "..." : "Confirm"}</button>
              <button className="btn-ghost btn-sm" onClick={() => setConfirmDelete(false)}>Cancel</button>
            </div>
          ) : (
            <button id={`delete-floor-${floor._id}`} className="btn-ghost btn-sm text-[#EF4444] hover:text-[#EF4444]" onClick={() => setConfirmDelete(true)}>Delete</button>
          )}
        </div>
      </div>
    </div>
  );
}

function AddFloorForm({ buildingId, onSaved, onCancel }) {
  const [form, setForm] = useState({ floorLevel: "", totalSpaces: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await addFloor(buildingId, form.floorLevel, form.totalSpaces);
      onSaved();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to add floor");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className="inline-panel" onSubmit={handleSubmit}>
      <p className="inline-panel__title">Add Floor</p>
      <div className="grid grid-cols-2 gap-3">
        <div className="form-group">
          <label className="form-label" htmlFor={`fl-name-${buildingId}`}>Floor Name</label>
          <input id={`fl-name-${buildingId}`} className="form-input" placeholder="e.g. Ground Floor" value={form.floorLevel}
            onChange={(e) => setForm({ ...form, floorLevel: e.target.value })} required />
        </div>
        <div className="form-group">
          <label className="form-label" htmlFor={`fl-spaces-${buildingId}`}>Spaces</label>
          <input id={`fl-spaces-${buildingId}`} type="number" min="1" max="500" className="form-input" placeholder="e.g. 20"
            value={form.totalSpaces} onChange={(e) => setForm({ ...form, totalSpaces: e.target.value })} required />
        </div>
      </div>
      {error && <p className="form-error">{error}</p>}
      <div className="inline-panel__row">
        <button type="button" className="btn btn-secondary" onClick={onCancel}>Cancel</button>
        <button id={`submit-floor-${buildingId}`} type="submit" className="btn btn-primary" disabled={loading}>{loading ? "Adding..." : "Add Floor"}</button>
      </div>
    </form>
  );
}

function BuildingRow({ building, blocks, onRefresh, onViewSpaces }) {
  const [expanded, setExpanded] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editedName, setEditedName] = useState(building.buildingName);
  const [editedBlockId, setEditedBlockId] = useState(building.blockId || "");
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [showAddFloor, setShowAddFloor] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [savingName, setSavingName] = useState(false);
  const [showBuildingQR, setShowBuildingQR] = useState(false);

  const totalSpaces = building.floors.reduce((s, f) => s + f.totalSpaces, 0);
  const totalOccupied = building.floors.reduce((s, f) => s + f.occupiedSpaces, 0);

  const saveName = async () => {
    if (!editedName.trim()) return;
    setSavingName(true);
    try { await updateBuilding(building._id, editedName.trim(), editedBlockId); onRefresh(); setEditMode(false); }
    catch { setEditedName(building.buildingName); setEditedBlockId(building.blockId || ""); }
    finally { setSavingName(false); }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try { await deleteBuilding(building._id); onRefresh(); }
    catch { setDeleting(false); setConfirmDelete(false); }
  };

  return (
    <div className="data-row">
      <div className="data-row__header">
        {editMode ? (
          <div className="flex items-center gap-2 flex-1">
            <input className="form-input flex-1" value={editedName} onChange={(e) => setEditedName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && saveName()} autoFocus />
            <select className="form-select flex-1" value={editedBlockId} onChange={(e) => setEditedBlockId(e.target.value)}>
              <option value="">No Block</option>
              {blocks.map(b => (
                <option key={b.blockId} value={b.blockId}>Block {b.blockId}</option>
              ))}
            </select>
            <button className="btn btn-primary btn-sm" onClick={saveName} disabled={savingName}>{savingName ? "..." : "Save"}</button>
            <button className="btn btn-secondary btn-sm" onClick={() => { setEditedName(building.buildingName); setEditedBlockId(building.blockId || ""); setEditMode(false); }}>Cancel</button>
          </div>
        ) : (
          <div className="min-w-0">
            <p className="data-row__title">{building.buildingName}</p>
            <div className="kv-list">
              <div className="kv-item"><span className="kv-label">Floors</span><span className="kv-value">{building.floors.length}</span></div>
              <div className="kv-item"><span className="kv-label">Block</span><span className="kv-value text-[#2563EB]">{building.blockId || "Unassigned"}</span></div>
              <div className="kv-item"><span className="kv-label">Spaces</span><span className="kv-value">{totalSpaces}</span></div>
              <div className="kv-item"><span className="kv-label">Occupied</span><span className="kv-value kv-value--red">{totalOccupied}</span></div>
              <div className="kv-item"><span className="kv-label">Available</span><span className="kv-value kv-value--green">{totalSpaces - totalOccupied}</span></div>
            </div>
          </div>
        )}
        {!editMode && (
          <div className="data-row__actions">
            <button id={`expand-building-${building._id}`} className="btn-ghost btn-sm" onClick={() => setExpanded(!expanded)}>
              {expanded ? "Hide" : "Floors"}
            </button>
            <button id={`edit-building-${building._id}`} className="btn-ghost btn-sm" onClick={() => setEditMode(true)}>Edit</button>
            {confirmDelete ? (
              <div className="flex gap-1">
                <button className="btn btn-danger btn-sm" onClick={handleDelete} disabled={deleting}>{deleting ? "..." : "Confirm"}</button>
                <button className="btn-ghost btn-sm" onClick={() => setConfirmDelete(false)}>Cancel</button>
              </div>
            ) : (
              <button id={`delete-building-${building._id}`} className="btn-ghost btn-sm text-[#EF4444] hover:text-[#EF4444]" onClick={() => setConfirmDelete(true)}>Delete</button>
            )}
          </div>
        )}
      </div>

      {expanded && (
        <div className="data-row__body space-y-2 fade-in">
          {building.floors.length === 0 ? (
            <p className="text-[#94A3B8] text-xs py-1">No floors added.</p>
          ) : (
            building.floors.map((floor) => (
              <FloorRow key={floor._id} floor={floor} buildingId={building._id} buildingName={building.buildingName}
                onRefresh={onRefresh} onViewSpaces={onViewSpaces} />
            ))
          )}
          {!showAddFloor && (
            <button id={`add-floor-${building._id}`} className="btn-dashed" onClick={() => setShowAddFloor(true)}>
              + Add Floor
            </button>
          )}
          {showAddFloor && (
            <AddFloorForm buildingId={building._id}
              onSaved={() => { setShowAddFloor(false); onRefresh(); }}
              onCancel={() => setShowAddFloor(false)} />
          )}
          <button className="btn-ghost btn-sm mt-2" onClick={() => setShowBuildingQR(true)}>Show Building QR</button>
          {showBuildingQR && (
            <QRModal title={building.buildingName} subtitle="Building QR — post at building entrance"
              payload={JSON.stringify({ buildingName: building.buildingName })}
              downloadFilename={`BuildingQR-${building.buildingName}.png`} onClose={() => setShowBuildingQR(false)} />
          )}
        </div>
      )}
    </div>
  );
}

export default function BuildingsPage() {
  const [buildings, setBuildings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState("");
  const [selectedBlockId, setSelectedBlockId] = useState("");
  const [blocks, setBlocks] = useState([]);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState("");
  const [spacesPanel, setSpacesPanel] = useState(null);

  const loadBuildings = async () => {
    setLoading(true);
    try { const data = await fetchBuildings(); setBuildings(data); }
    catch { setBuildings([]); }
    finally { setLoading(false); }
  };

  useEffect(() => { 
    loadBuildings(); 
    fetchBlocks().then(setBlocks).catch(() => {});
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    setCreateError("");
    setCreating(true);
    try { await createBuilding(newName.trim(), selectedBlockId); setNewName(""); setSelectedBlockId(""); setShowCreate(false); loadBuildings(); }
    catch (err) { setCreateError(err.response?.data?.message || "Failed to create"); }
    finally { setCreating(false); }
  };

  const filtered = buildings.filter((b) => b.buildingName.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="max-w-4xl mx-auto space-y-5">
      <div className="page-header-row">
        <div className="page-heading">
          <h1 className="page-title">Buildings</h1>
          <p className="page-subtitle">Manage buildings and floors</p>
        </div>
        <div className="page-actions">
          <button id="add-building-btn" className="btn btn-primary" onClick={() => setShowCreate(!showCreate)}>
            Add Building
          </button>
        </div>
      </div>

      {showCreate && (
        <form className="inline-panel" onSubmit={handleCreate}>
          <p className="inline-panel__title">New Building</p>
          <div className="form-group">
            <label className="form-label" htmlFor="new-building-name">Building Name</label>
            <input id="new-building-name" className="form-input" placeholder="e.g. Block A, Main Block"
              value={newName} onChange={(e) => setNewName(e.target.value)} required autoFocus />
          </div>
          <div className="form-group mt-3">
            <label className="form-label" htmlFor="new-building-block">Assign to Block (Optional)</label>
            <select id="new-building-block" className="form-select" value={selectedBlockId} onChange={e => setSelectedBlockId(e.target.value)}>
              <option value="">None / Unassigned</option>
              {blocks.map(b => (
                <option key={b.blockId} value={b.blockId}>Block {b.blockId} ({b.blockName})</option>
              ))}
            </select>
          </div>
          {createError && <p className="form-error">{createError}</p>}
          <div className="inline-panel__row">
            <button type="button" className="btn btn-secondary" onClick={() => { setShowCreate(false); setCreateError(""); setNewName(""); setSelectedBlockId(""); }}>Cancel</button>
            <button id="create-building-btn" type="submit" className="btn btn-primary" disabled={creating}>{creating ? "Creating..." : "Create"}</button>
          </div>
        </form>
      )}

      <div>
        <input id="search-buildings" className="search-box mb-4" placeholder="Search buildings..." value={search}
          onChange={(e) => setSearch(e.target.value)} type="search" />
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => <div key={i} className="skeleton-card"><div className="skeleton-line w-1/2" /><div className="skeleton-line w-1/3" /></div>)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="empty-box">
          <p className="empty-title">{search ? "No buildings match your search" : "No Buildings Added Yet"}</p>
          <p className="empty-desc">{search ? "Try a different search term." : "Create your first building to begin managing parking spaces."}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((b) => (
            <BuildingRow key={b._id} building={b} blocks={blocks} onRefresh={loadBuildings} onViewSpaces={(bn, fl) => setSpacesPanel({ buildingName: bn, floorLevel: fl })} />
          ))}
        </div>
      )}

      {spacesPanel && (
        <SpacesPanelOverlay buildingName={spacesPanel.buildingName} floorLevel={spacesPanel.floorLevel}
          onClose={() => setSpacesPanel(null)} />
      )}
    </div>
  );
}

function SpacesPanelOverlay({ buildingName, floorLevel, onClose }) {
  const [spaces, setSpaces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSpace, setSelectedSpace] = useState(null);
  const [showFloorQR, setShowFloorQR] = useState(false);

  useEffect(() => {
    fetchSpaces(buildingName, floorLevel)
      .then(setSpaces).catch(() => setSpaces([]))
      .finally(() => setLoading(false));
  }, [buildingName, floorLevel]);

  const downloadAll = async () => {
    for (const sp of spaces) {
      const payload = JSON.stringify({ buildingName: sp.buildingName, floorLevel: sp.floorLevel, spaceId: sp.spaceId });
      const url = await QRCode.toDataURL(payload, { width: 240, margin: 2 });
      const a = document.createElement("a"); a.href = url; a.download = `QR-${sp.spaceId}.png`; a.click();
      await new Promise((r) => setTimeout(r, 80));
    }
  };

  return (
    <div className="spaces-panel" role="dialog" aria-label={`${buildingName} — ${floorLevel} spaces`}>
      <div className="spaces-panel__bar">
        <button className="btn-ghost btn-sm" onClick={onClose}>Back</button>
        <div className="flex-1">
          <p className="text-[#F8FAFC] text-sm font-semibold">{buildingName} — {floorLevel}</p>
          <p className="text-[#94A3B8] text-xs">{spaces.length} spaces</p>
        </div>
        <div className="flex gap-2">
          <button id="show-floor-qr-btn" className="btn btn-secondary btn-sm" onClick={() => setShowFloorQR(true)}>Floor QR</button>
          <button id="download-all-qr-btn" className="btn-ghost btn-sm" onClick={downloadAll}>Download All</button>
        </div>
      </div>
      <div className="spaces-panel__body">
        {loading ? <p className="text-[#94A3B8] text-sm text-center py-10">Loading...</p> : (
          <div className="spaces-grid">
            {spaces.map((sp) => (
              <button key={sp.spaceId} id={`space-${sp.spaceId}`}
                className={`space-chip ${sp.status === "occupied" ? "space-chip--occupied" : "space-chip--free"}`}
                onClick={() => setSelectedSpace(sp)}
                aria-label={`Space ${sp.spaceId}, ${sp.status === "occupied" ? "Occupied" : "Free"}`}>
                <p className="space-chip__id">{sp.spaceId}</p>
                <p className={sp.status === "occupied" ? "space-chip__status--occupied" : "space-chip__status--free"}>
                  {sp.status === "occupied" ? "Occupied" : "Free"}
                </p>
                <p className="space-chip__hint">View QR</p>
              </button>
            ))}
          </div>
        )}
      </div>
      {selectedSpace && (
        <QRModal title={selectedSpace.spaceId} subtitle={`${selectedSpace.buildingName} — ${selectedSpace.floorLevel}`}
          payload={JSON.stringify({ buildingName: selectedSpace.buildingName, floorLevel: selectedSpace.floorLevel, spaceId: selectedSpace.spaceId })}
          downloadFilename={`QR-${selectedSpace.spaceId}.png`} onClose={() => setSelectedSpace(null)} />
      )}
      {showFloorQR && (
        <QRModal title={`${buildingName} — ${floorLevel}`} subtitle="Floor QR — post at floor entrance"
          payload={JSON.stringify({ buildingName, floorLevel })}
          downloadFilename={`FloorQR-${buildingName}-${floorLevel}.png`} onClose={() => setShowFloorQR(false)} />
      )}
    </div>
  );
}
