import { useState, useEffect } from "react";
import { fetchBlocks, createBlock, deleteBlock, regenerateBlockQR, createBlockAdmin } from "../services/adminService";
import { QRModal } from "../components/QRModal";

function BlockRow({ block, onViewQR, onRegenQR, onDelete }) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const availPct = block.totalSpaces > 0 ? Math.round((block.totalAvailable / block.totalSpaces) * 100) : 0;

  const handleDelete = async () => {
    setDeleting(true);
    try { await onDelete(); } catch { setDeleting(false); setConfirmDelete(false); }
  };

  return (
    <div className="data-row">
      <div className="data-row__header">
        <div className="min-w-0">
          <p className="data-row__title">{block.blockName}</p>
          <p className="data-row__meta">ID: {block.blockId} &middot; {block.buildingCount} building{block.buildingCount !== 1 ? "s" : ""}</p>
          <div className="kv-list mt-2">
            <div className="kv-item"><span className="kv-label">Total</span><span className="kv-value">{block.totalSpaces}</span></div>
            <div className="kv-item"><span className="kv-label">Available</span><span className="kv-value kv-value--green">{block.totalAvailable}</span></div>
            <div className="kv-item"><span className="kv-label">Occupied</span><span className="kv-value kv-value--red">{block.totalOccupied}</span></div>
          </div>
          <div className="progress-track mt-2 w-32">
            <div className="progress-fill progress-fill--green" style={{ width: `${availPct}%` }} />
          </div>
        </div>
        <div className="data-row__actions">
          <button id={`view-qr-${block.blockId}`} className="btn-ghost btn-sm" onClick={onViewQR}>QR Code</button>
          <button id={`regen-qr-${block.blockId}`} className="btn-ghost btn-sm" onClick={onRegenQR}>Regenerate</button>
          {confirmDelete ? (
            <div className="flex gap-1">
              <button className="btn btn-danger btn-sm" onClick={handleDelete} disabled={deleting}>{deleting ? "..." : "Confirm"}</button>
              <button className="btn-ghost btn-sm" onClick={() => setConfirmDelete(false)}>Cancel</button>
            </div>
          ) : (
            <button id={`delete-block-${block.blockId}`} className="btn-ghost btn-sm text-[#EF4444] hover:text-[#EF4444]" onClick={() => setConfirmDelete(true)}>Delete</button>
          )}
        </div>
      </div>
    </div>
  );
}

function CreateBlockForm({ onSaved, onCancel }) {
  const [form, setForm] = useState({ blockId: "", blockName: "", description: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try { await createBlock(form); onSaved(); }
    catch (err) { setError(err.response?.data?.message || "Failed to create block"); }
    finally { setLoading(false); }
  };

  return (
    <form className="inline-panel" onSubmit={handleSubmit}>
      <p className="inline-panel__title">New Block</p>
      <div className="grid grid-cols-2 gap-3">
        <div className="form-group">
          <label className="form-label" htmlFor="block-id-input">Block ID</label>
          <input id="block-id-input" className="form-input uppercase" placeholder="e.g. A" value={form.blockId}
            onChange={(e) => setForm({ ...form, blockId: e.target.value.toUpperCase() })} required />
        </div>
        <div className="form-group">
          <label className="form-label" htmlFor="block-name-input">Block Name</label>
          <input id="block-name-input" className="form-input" placeholder="e.g. Block A" value={form.blockName}
            onChange={(e) => setForm({ ...form, blockName: e.target.value })} required />
        </div>
      </div>
      <div className="form-group">
        <label className="form-label" htmlFor="block-desc-input">Description (optional)</label>
        <input id="block-desc-input" className="form-input" placeholder="e.g. North Wing" value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })} />
      </div>
      {error && <p className="form-error">{error}</p>}
      <div className="inline-panel__row">
        <button type="button" className="btn btn-secondary" onClick={onCancel}>Cancel</button>
        <button id="create-block-btn" type="submit" className="btn btn-primary" disabled={loading}>{loading ? "Creating..." : "Create Block"}</button>
      </div>
    </form>
  );
}

function CreateAdminForm({ blocks, onCancel }) {
  const [form, setForm] = useState({ studentId: "", name: "", password: "", assignedBlock: "" });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(""); setSuccess("");
    setLoading(true);
    try {
      await createBlockAdmin(form);
      setSuccess(`Block Admin created for Block ${form.assignedBlock}`);
      setForm({ studentId: "", name: "", password: "", assignedBlock: "" });
    } catch (err) { setError(err.response?.data?.message || "Failed to create admin"); }
    finally { setLoading(false); }
  };

  return (
    <form className="inline-panel" onSubmit={handleSubmit}>
      <p className="inline-panel__title">New Block Admin</p>
      {success && <div className="alert-success">{success}</div>}
      {error && <p className="form-error">{error}</p>}
      <div className="grid grid-cols-2 gap-3">
        <div className="form-group">
          <label className="form-label" htmlFor="ba-login-id">Login ID</label>
          <input id="ba-login-id" className="form-input" placeholder="e.g. BLOCKA_ADMIN" value={form.studentId}
            onChange={(e) => setForm({ ...form, studentId: e.target.value })} required />
        </div>
        <div className="form-group">
          <label className="form-label" htmlFor="ba-name">Admin Name</label>
          <input id="ba-name" className="form-input" placeholder="Full name" value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })} required />
        </div>
        <div className="form-group">
          <label className="form-label" htmlFor="ba-password">Password</label>
          <input id="ba-password" type="password" className="form-input" value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })} required />
        </div>
        <div className="form-group">
          <label className="form-label" htmlFor="ba-block">Assign Block</label>
          <select id="ba-block" className="form-select" value={form.assignedBlock}
            onChange={(e) => setForm({ ...form, assignedBlock: e.target.value })} required>
            <option value="">Select...</option>
            {blocks.map((b) => <option key={b.blockId} value={b.blockId}>{b.blockName} ({b.blockId})</option>)}
          </select>
        </div>
      </div>
      <div className="inline-panel__row">
        <button type="button" className="btn btn-secondary" onClick={onCancel}>Cancel</button>
        <button id="create-ba-btn" type="submit" className="btn btn-primary" disabled={loading}>{loading ? "Creating..." : "Create Admin"}</button>
      </div>
    </form>
  );
}

export default function BlocksPage() {
  const [blocks, setBlocks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [showAdminForm, setShowAdminForm] = useState(false);
  const [blockQR, setBlockQR] = useState(null);
  const [activeTab, setActiveTab] = useState("blocks");

  const loadBlocks = async () => {
    setLoading(true);
    try { const data = await fetchBlocks(); setBlocks(data); }
    catch { setBlocks([]); }
    finally { setLoading(false); }
  };

  useEffect(() => { loadBlocks(); }, []);

  const handleDelete = async (id) => {
    await deleteBlock(id);
    loadBlocks();
  };

  const handleRegenQR = async (block) => {
    try { const res = await regenerateBlockQR(block._id); setBlockQR(res.block || block); loadBlocks(); } catch (err) { console.error(err); }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-5">
      <div className="page-header-row">
        <div className="page-heading">
          <h1 className="page-title">Blocks & QR</h1>
          <p className="page-subtitle">Manage blocks and generate QR codes</p>
        </div>
        <div className="page-actions">
          {activeTab === "blocks" && (
            <button id="add-block-btn" className="btn btn-primary" onClick={() => setShowCreate(!showCreate)}>Add Block</button>
          )}
          {activeTab === "admins" && (
            <button id="add-admin-btn" className="btn btn-secondary" onClick={() => setShowAdminForm(!showAdminForm)}>Add Block Admin</button>
          )}
        </div>
      </div>

      <div className="tab-bar">
        {[{ key: "blocks", label: "Blocks" }, { key: "admins", label: "Block Admins" }].map((t) => (
          <button key={t.key} id={`tab-${t.key}`}
            className={`tab-btn ${activeTab === t.key ? "tab-btn--active" : "tab-btn--inactive"}`}
            onClick={() => setActiveTab(t.key)}>{t.label}</button>
        ))}
      </div>

      {activeTab === "blocks" && (
        <div className="space-y-4 fade-in">
          {showCreate && <CreateBlockForm onSaved={() => { setShowCreate(false); loadBlocks(); }} onCancel={() => setShowCreate(false)} />}
          {loading ? (
            <div className="space-y-3">{[1, 2].map((i) => <div key={i} className="skeleton-card"><div className="skeleton-line w-1/2" /><div className="skeleton-line w-1/3" /></div>)}</div>
          ) : blocks.length === 0 ? (
            <div className="empty-box"><p className="empty-title">No Blocks Created</p><p className="empty-desc">Add a block to group buildings and generate a shared entry QR.</p></div>
          ) : (
            <div className="space-y-3">
              {blocks.map((block) => (
                <BlockRow key={block._id} block={block}
                  onViewQR={() => setBlockQR(block)}
                  onRegenQR={() => handleRegenQR(block)}
                  onDelete={() => handleDelete(block._id)} />
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === "admins" && (
        <div className="space-y-4 fade-in">
          {showAdminForm && <CreateAdminForm blocks={blocks} onCancel={() => setShowAdminForm(false)} />}
          <div className="empty-box">
            <p className="empty-title">Block Admins</p>
            <p className="empty-desc">Create block-scoped admin accounts using the button above.</p>
          </div>
        </div>
      )}

      {blockQR && (
        <QRModal
          title={`${blockQR.blockName} — Block QR`}
          subtitle={`Block ID: ${blockQR.blockId} — post at block entrance`}
          payload={`${window.location.origin}/block/${blockQR.blockId}`}
          downloadFilename={`BlockQR-${blockQR.blockId}.png`}
          onClose={() => setBlockQR(null)} />
      )}
    </div>
  );
}
