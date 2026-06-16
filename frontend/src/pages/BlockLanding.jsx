import { useState, useEffect, useCallback } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import Footer from "../components/Footer";

const BASE = "/api";

const statusLabel = (s) => {
  if (s === "available") return "Free";
  if (s === "occupied") return "Taken";
  return "Reserved";
};


function VehicleForm({ space, blockId, onSuccess, onCancel }) {
  const [form, setForm] = useState({
    ownerName: "",
    mobileNumber: "",
    vehicleNumber: "",
    vehicleType: "car",
    userType: "visitor"
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const submit = async (e) => {
    e.preventDefault();
    if (form.mobileNumber.replace(/\D/g, "").length < 10) {
      setError("Please enter a valid 10-digit mobile number");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await axios.post(`${BASE}/blocks/${blockId}/park`, {
        buildingName: space.buildingName,
        floorLevel: space.floorLevel,
        spaceId: space.spaceId,
        ...form,
        vehicleNumber: form.vehicleNumber.toUpperCase()
      });
      onSuccess(res.data);
    } catch (err) {
      setError(err.response?.data?.message || "Slot unavailable. Please select another.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal-box" style={{ maxWidth: '400px' }} onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <p className="modal-title">Enter Vehicle Details</p>
            <p className="text-[#94A3B8] text-xs mt-0.5">
              {space.buildingName} &middot; {space.floorLevel} &middot; <span className="text-[#2563EB] font-semibold">{space.spaceId}</span>
            </p>
          </div>
          <button onClick={onCancel} className="btn-ghost btn-icon">✕</button>
        </div>

        <div className="modal-body">
          <form onSubmit={submit} className="space-y-4">
            <div className="form-group">
              <label className="form-label">Owner Name *</label>
              <input
                className="form-input"
                placeholder="e.g. Arun Kumar"
                value={form.ownerName}
                onChange={e => setForm({ ...form, ownerName: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Mobile Number *</label>
              <input
                className="form-input"
                type="tel"
                placeholder="e.g. 9876543210"
                value={form.mobileNumber}
                onChange={e => setForm({ ...form, mobileNumber: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Vehicle Number *</label>
              <input
                className="form-input uppercase"
                placeholder="e.g. TN07AB1234"
                value={form.vehicleNumber}
                onChange={e => setForm({ ...form, vehicleNumber: e.target.value.toUpperCase() })}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Vehicle Type</label>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { v: "bike", label: "🏍️ Bike" },
                  { v: "car", label: "🚗 Car" }
                ].map(opt => (
                  <button
                    key={opt.v}
                    type="button"
                    onClick={() => setForm({ ...form, vehicleType: opt.v })}
                    className={`py-2 rounded-md border text-sm transition-all ${
                      form.vehicleType === opt.v
                        ? "bg-[#2563EB]/15 border-[#2563EB] text-[#2563EB] font-semibold"
                        : "bg-[#0F172A] border-[#334155] text-[#94A3B8]"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">User Type</label>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { v: "resident", label: " Resident" },
                  { v: "visitor", label: " Visitor" }
                ].map(opt => (
                  <button
                    key={opt.v}
                    type="button"
                    onClick={() => setForm({ ...form, userType: opt.v })}
                    className={`py-2 rounded-md border text-sm transition-all ${
                      form.userType === opt.v
                        ? "bg-[#2563EB]/15 border-[#2563EB] text-[#2563EB] font-semibold"
                        : "bg-[#0F172A] border-[#334155] text-[#94A3B8]"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {error && <div className="alert-error" role="alert">{error}</div>}

            <div className="flex gap-3 pt-2">
              <button type="button" onClick={onCancel} className="btn-secondary w-full">Cancel</button>
              <button type="submit" className="btn-primary w-full" disabled={loading}>
                {loading ? "Parking..." : "Confirm Park"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}


function SuccessScreen({ result, blockName, onDone }) {
  return (
    <div className="auth-shell">
      <div className="auth-card">
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-[#22C55E]/15 border border-[#22C55E]/30 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-[#22C55E]" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path d="M5 13l4 4L19 7" /></svg>
          </div>
          <h1 className="text-[#F8FAFC] text-2xl font-bold mb-1">Parked Successfully!</h1>
          <p className="text-[#94A3B8] text-sm">{blockName}</p>
        </div>

        <div className="card space-y-3 mb-5">
          {[
            { label: "Space ID", value: result.spaceId, accent: true },
            { label: "Building / Floor", value: `${result.buildingName} · ${result.floorLevel}` },
            { label: "Vehicle Number", value: result.vehicleNumber },
            { label: "Owner", value: result.ownerName },
            { label: "Check-In Time", value: new Date(result.timestampIn).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true }) }
          ].map(row => (
            <div key={row.label} className="flex justify-between items-center">
              <span className="text-[#94A3B8] text-xs">{row.label}</span>
              <span className={`font-semibold text-sm ${row.accent ? "text-[#2563EB]" : "text-[#F8FAFC]"}`}>{row.value}</span>
            </div>
          ))}
        </div>

        <div className="alert-info mb-5 justify-center text-center">
           Screenshot this confirmation for your records. No login required.
        </div>

        <button onClick={onDone} className="btn-primary w-full">Done</button>
      </div>
    </div>
  );
}


function BlockMap({ blockId, onSelectSpace, highlightSpaceId }) {
  const [mapData, setMapData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeBldg, setActiveBldg] = useState(null);
  const [activeFloor, setActiveFloor] = useState(null);

  const fetchMap = useCallback(async () => {
    try {
      const res = await axios.get(`${BASE}/blocks/${blockId}/map`);
      const data = res.data;
      setMapData(data);
      if (!activeBldg && data.buildings.length > 0) {
        setActiveBldg(data.buildings[0].buildingName);
        if (data.buildings[0].floors.length > 0) {
          setActiveFloor(data.buildings[0].floors[0].floorLevel);
        }
      }
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, [blockId, activeBldg]);

  useEffect(() => {
    fetchMap();
    const interval = setInterval(fetchMap, 15000);
    return () => clearInterval(interval);
  }, [fetchMap]);

  if (loading) return <div className="text-center py-12 text-[#94A3B8] text-sm animate-pulse">Loading map...</div>;
  if (!mapData || mapData.buildings.length === 0) return <div className="text-center py-12 text-[#94A3B8]">No spaces available in this block.</div>;

  const currentBldg = mapData.buildings.find(b => b.buildingName === activeBldg) || mapData.buildings[0];
  const currentFloor = currentBldg?.floors.find(f => f.floorLevel === activeFloor) || currentBldg?.floors[0];

  return (
    <div className="fade-in">
      {mapData.buildings.length > 1 && (
        <div className="flex gap-2 mb-3 overflow-x-auto hide-scroll pb-1">
          {mapData.buildings.map(b => (
            <button
              key={b.buildingName}
              onClick={() => { setActiveBldg(b.buildingName); setActiveFloor(b.floors[0]?.floorLevel || null); }}
              className={`flex-shrink-0 px-3 py-1.5 rounded-md text-xs font-semibold border transition-all ${
                activeBldg === b.buildingName ? "bg-[#2563EB]/15 border-[#2563EB] text-[#2563EB]" : "bg-[#0F172A] border-[#334155] text-[#94A3B8]"
              }`}
            >
              {b.buildingName}
            </button>
          ))}
        </div>
      )}

      {currentBldg && currentBldg.floors.length > 1 && (
        <div className="flex gap-2 mb-3 overflow-x-auto hide-scroll pb-1">
          {currentBldg.floors.map(f => (
            <button
              key={f.floorLevel}
              onClick={() => setActiveFloor(f.floorLevel)}
              className={`flex-shrink-0 px-3 py-1.5 rounded-md text-xs font-semibold border transition-all ${
                activeFloor === f.floorLevel ? "bg-[#2563EB]/15 border-[#2563EB] text-[#2563EB]" : "bg-[#0F172A] border-[#334155] text-[#94A3B8]"
              }`}
            >
              {f.floorLevel}
              <span className={`ml-1.5 ${f.availableSpaces > 0 ? "text-[#22C55E]" : "text-[#EF4444]"}`}>({f.availableSpaces})</span>
            </button>
          ))}
        </div>
      )}

      <div className="flex gap-4 mb-3 px-1">
        {[
          { color: "#22c55e", label: "Available" },
          { color: "#ef4444", label: "Occupied" },
          { color: "#3b82f6", label: "Selected" },
          { color: "#f59e0b", label: "Reserved" }
        ].map(l => (
          <div key={l.label} className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-sm" style={{ background: l.color }} />
            <span className="text-[#94A3B8] text-[10px]">{l.label}</span>
          </div>
        ))}
      </div>

      {currentFloor ? (
        <div className="grid gap-2" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(64px, 1fr))" }}>
          {currentFloor.spaces.map(space => {
            const isSelected = highlightSpaceId === space.spaceId;
            const isAvailable = space.status === "available";
            const bgColor = isSelected ? "#3b82f6" : space.status === "available" ? "#22c55e" : space.status === "occupied" ? "#ef4444" : "#f59e0b";

            return (
              <button
                key={space.spaceId}
                onClick={() => isAvailable && onSelectSpace({ spaceId: space.spaceId, buildingName: activeBldg || currentBldg.buildingName, floorLevel: activeFloor || currentFloor.floorLevel })}
                disabled={!isAvailable && !isSelected}
                className={`rounded-md py-2 px-1 text-center transition-all duration-150 active:scale-95 ${isAvailable ? "cursor-pointer hover:opacity-80" : "cursor-not-allowed opacity-60"}`}
                style={{ backgroundColor: `${bgColor}15`, border: `1px solid ${bgColor}50` }}
                aria-label={`Space ${space.spaceId}, ${isAvailable ? "Available" : space.status}`}
              >
                <p className="text-[#F8FAFC] font-semibold text-[10px] leading-tight">{space.spaceId}</p>
                <p className="text-[9px] mt-0.5 font-medium" style={{ color: bgColor }}>{statusLabel(space.status)}</p>
              </button>
            );
          })}
        </div>
      ) : (
        <p className="text-[#94A3B8] text-sm text-center py-6">No spaces on this floor.</p>
      )}
      <p className="text-[#475569] text-[10px] text-center mt-3">Auto-refreshes every 15 seconds</p>
    </div>
  );
}


export default function BlockLanding() {
  const { blockId } = useParams();
  const [overview, setOverview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [view, setView] = useState("overview");
  const [selectedSpace, setSelectedSpace] = useState(null);
  const [successData, setSuccessData] = useState(null);

  const fetchOverview = useCallback(async () => {
    try {
      const res = await axios.get(`${BASE}/blocks/${blockId}/overview`);
      setOverview(res.data);
    } catch (err) {
      setError(err.response?.data?.message || "Block not found");
    } finally {
      setLoading(false);
    }
  }, [blockId]);

  useEffect(() => {
    fetchOverview();
    const interval = setInterval(fetchOverview, 15000);
    return () => clearInterval(interval);
  }, [fetchOverview]);

  if (view === "success" && successData) {
    return <SuccessScreen result={successData} blockName={overview?.blockName || blockId} onDone={() => { setView("overview"); setSuccessData(null); setSelectedSpace(null); fetchOverview(); }} />;
  }

  if (loading) return <div className="min-h-screen bg-[#0F172A] flex items-center justify-center"><div className="text-[#94A3B8] text-sm animate-pulse">Loading {blockId}...</div></div>;
  if (error) return <div className="min-h-screen bg-[#0F172A] flex items-center justify-center"><div className="empty-box"><p className="empty-title">Block Not Found</p><p className="empty-desc">{error}</p></div></div>;

  const availPct = overview.totalSpaces > 0 ? Math.round((overview.totalAvailable / overview.totalSpaces) * 100) : 0;
  const statusColor = availPct > 30 ? "#22c55e" : availPct > 10 ? "#f59e0b" : "#ef4444";

  return (
    <div className="min-h-screen bg-[#0F172A] pb-10">
      <header className="sticky top-0 z-30 bg-[#1E293B] border-b border-[#334155] px-4 py-3 flex items-center gap-3">
        {view !== "overview" && <button onClick={() => setView(view === "form" ? "map" : "overview")} className="text-[#94A3B8] hover:text-[#F8FAFC]">←</button>}
        <div className="w-8 h-8 bg-[#2563EB]/15 rounded-md flex items-center justify-center text-[#2563EB] font-semibold text-xs shrink-0">BL</div>
        <div className="flex-1 min-w-0">
          <h1 className="text-[#F8FAFC] font-semibold text-sm truncate">{overview.blockName}</h1>
          <p className="text-[#94A3B8] text-xs">ParkSys</p>
        </div>
        <div className="badge-green">{overview.totalAvailable} free</div>
      </header>

      <div className="p-4 max-w-2xl mx-auto space-y-4">
        {view === "overview" && (
          <div className="fade-in space-y-4">
            <div className="card border-[#2563EB]/30 bg-[#2563EB]/5">
              <div className="flex justify-between items-center mb-4">
                <div>
                  <h2 className="text-[#F8FAFC] font-bold text-xl">{overview.blockName}</h2>
                  <p className="text-[#94A3B8] text-xs mt-0.5">Live availability</p>
                </div>
                <div className="text-center">
                  <span className="text-3xl font-bold" style={{ color: statusColor }}>{overview.totalAvailable}</span>
                  <p className="text-[#94A3B8] text-[10px] font-semibold uppercase">Free</p>
                </div>
              </div>
              <div className="progress-track mb-4"><div className="progress-fill" style={{ width: `${availPct}%`, background: statusColor }} /></div>
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-[#0F172A] border border-[#334155] rounded-md p-2 text-center"><p className="text-[#F8FAFC] font-semibold">{overview.totalSpaces}</p><p className="text-[#94A3B8] text-[10px]">Total</p></div>
                <div className="bg-[#0F172A] border border-[#334155] rounded-md p-2 text-center"><p className="text-[#22C55E] font-semibold">{overview.totalAvailable}</p><p className="text-[#94A3B8] text-[10px]">Available</p></div>
                <div className="bg-[#0F172A] border border-[#334155] rounded-md p-2 text-center"><p className="text-[#EF4444] font-semibold">{overview.totalOccupied}</p><p className="text-[#94A3B8] text-[10px]">Occupied</p></div>
              </div>
            </div>

            {overview.floors.length > 0 && (
              <div className="card">
                <h3 className="card-title mb-3">Floor Availability</h3>
                <div className="space-y-3">
                  {overview.floors.map((f, i) => (
                    <div key={i}>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-[#F8FAFC]">{f.buildingName !== overview.blockName && overview.buildings?.length > 1 ? `${f.buildingName} · ${f.floorLevel}` : f.floorLevel}</span>
                        <span><span className="text-[#22C55E] font-semibold">{f.availableSpaces}</span><span className="text-[#94A3B8]"> / {f.totalSpaces}</span></span>
                      </div>
                      <div className="progress-track h-1.5"><div className="progress-fill" style={{ width: `${f.totalSpaces > 0 ? (f.availableSpaces / f.totalSpaces) * 100 : 0}%`, background: f.availableSpaces > 0 ? "#22c55e" : "#ef4444" }} /></div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <button onClick={() => setView("map")} className="btn-secondary py-3">View Map</button>
              <button onClick={() => setView("map")} disabled={overview.totalAvailable === 0} className="btn-primary py-3">Park Now</button>
            </div>

            {overview.totalAvailable === 0 && <div className="alert-error justify-center" role="alert">This block is full.</div>}
            <div className="alert-info justify-center text-[11px]">No login required. Select a space on the map.</div>
          </div>
        )}

        {view === "map" && (
          <div className="fade-in space-y-4">
            <div className="card">
              <div className="flex justify-between items-center mb-3">
                <p className="card-title">Interactive Map</p>
                <span className="badge-green">{overview.totalAvailable} Available</span>
              </div>
              <p className="text-[#94A3B8] text-xs mb-4">Tap an available (green) space to select.</p>
              <BlockMap blockId={blockId} onSelectSpace={(s) => { setSelectedSpace(s); setView("form"); }} highlightSpaceId={selectedSpace?.spaceId} />
            </div>
            {selectedSpace && <button onClick={() => setView("form")} className="btn-primary w-full py-3">Proceed with {selectedSpace.spaceId}</button>}
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
}
