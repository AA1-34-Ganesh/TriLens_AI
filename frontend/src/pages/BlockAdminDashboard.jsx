import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../utils/api";
import axios from "axios";
import Header from "../components/Header";


function VehicleRow({ log, onCheckout, highlighted }) {
  const timeAgo = (ts) => {
    const diff = Date.now() - new Date(ts).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "just now";
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    return `${hrs}h ${mins % 60}m`;
  };

  const checkInTime = new Date(log.timestampIn).toLocaleTimeString("en-IN", {
    hour: "2-digit", minute: "2-digit", hour12: true
  });

  return (
    <div
      id={`vehicle-row-${log._id}`}
      className={`bg-[#1e293b] rounded-xl px-4 py-3 border transition-all duration-500 ${
        highlighted
          ? "border-blue-400 blink-highlight"
          : "border-slate-700/60"
      }`}
    >
      <div className="flex items-start justify-between mb-2">
        <div>
          <p className="text-[#F5C518] font-bold text-base">{log.vehicleNumber}</p>
          <p className="text-white text-sm font-medium">{log.ownerName || "—"}</p>
        </div>
        <div className="text-right">
          <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
            log.userType === "resident"
              ? "bg-blue-500/20 text-blue-400"
              : "bg-purple-500/20 text-purple-400"
          }`}>
            {log.userType === "resident" ? "Resident" : "Visitor"}
          </span>
          <p className="text-slate-500 text-xs mt-1">{timeAgo(log.timestampIn)}</p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 mb-3">
        {[
          { label: "Floor", value: log.floorLevel },
          { label: "Slot", value: log.spaceId },
          { label: "Type", value: log.vehicleType === "bike" ? "🏍️ Bike" : "🚗 Car" }
        ].map(item => (
          <div key={item.label} className="bg-[#0f172a] rounded-lg py-1.5 px-2 text-center">
            <p className="text-slate-500 text-[10px]">{item.label}</p>
            <p className="text-white text-xs font-semibold mt-0.5">{item.value}</p>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between">
        <p className="text-slate-500 text-xs">In: {checkInTime} · {log.mobileNumber || "—"}</p>
        <button
          id={`checkout-${log._id}`}
          onClick={() => onCheckout(log._id)}
          className="bg-red-500/20 border border-red-500/30 text-red-400 text-xs font-semibold px-3 py-1.5 rounded-lg active:scale-95 transition-transform"
        >
          Check Out
        </button>
      </div>
    </div>
  );
}


function SearchResults({ results, onHighlight, onCheckout }) {
  if (results.length === 0) {
    return (
      <div className="text-center py-8 text-slate-400">
        <span className="text-3xl block mb-2">🔍</span>
        No vehicles found.
      </div>
    );
  }
  return (
    <div className="space-y-3">
      {results.map(log => (
        <VehicleRow
          key={log._id}
          log={log}
          onCheckout={onCheckout}
          highlighted={false}
        />
      ))}
    </div>
  );
}


export default function BlockAdminDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("overview"); 
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState(null);
  const [searching, setSearching] = useState(false);
  const [highlightedLog, setHighlightedLog] = useState(null);
  const [checkingOut, setCheckingOut] = useState(null);
  const [checkoutMsg, setCheckoutMsg] = useState("");

  const fetchDashboard = useCallback(async () => {
    try {
      const res = await api.get("/blocks/admin/dashboard");
      setDashboard(res.data);
    } catch {
     
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboard();
    const interval = setInterval(fetchDashboard, 15000);
    return () => clearInterval(interval);
  }, [fetchDashboard]);

  const handleSearch = async (e) => {
    e?.preventDefault();
    if (!searchQuery || searchQuery.trim().length < 2) return;
    setSearching(true);
    setSearchResults(null);
    try {
      const res = await api.get(`/blocks/admin/vehicles/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchResults(res.data);
    } catch {
      setSearchResults([]);
    } finally {
      setSearching(false);
    }
  };

  const handleHighlightOnMap = (log) => {
    setHighlightedLog(log);
    setTab("map");
  };

  const handleCheckout = async (logId) => {
    if (!window.confirm("Check out this vehicle?")) return;
    setCheckingOut(logId);
    try {
      const res = await api.post(`/blocks/admin/vehicles/${logId}/checkout`);
      setCheckoutMsg(`${res.data.log.vehicleNumber} checked out (${res.data.duration})`);
      setTimeout(() => setCheckoutMsg(""), 4000);
      fetchDashboard();
      if (searchResults) handleSearch();
    } catch (err) {
      alert(err.response?.data?.message || "Checkout failed");
    } finally {
      setCheckingOut(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0f172a] flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 border-2 border-[#F5C518] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-slate-400 text-sm">Loading Block Admin...</p>
        </div>
      </div>
    );
  }

  const block = dashboard || {};
  const availPct = block.totalSpaces > 0
    ? Math.round((block.totalAvailable / block.totalSpaces) * 100)
    : 0;

  return (
    <div className="min-h-screen bg-[#0f172a] pb-24">
      <Header />

      {checkoutMsg && (
        <div className="mx-4 mt-3 bg-green-500/20 border border-green-500/30 text-green-400 px-4 py-3 rounded-xl text-sm fade-in">
          {checkoutMsg}
        </div>
      )}

      <div className="px-4 py-4 space-y-4">
        {/* Stats Row */}
        <div className="grid grid-cols-2 gap-3">
          {[
            { label: "Total Spaces", value: block.totalSpaces || 0, icon: "", color: "text-slate-300" },
            { label: "Active Vehicles", value: block.activeVehicles?.length || 0, icon: "", color: "text-[#F5C518]" },
            { label: "Available", value: block.totalAvailable || 0, icon: "", color: "text-green-400" },
            { label: "Occupied", value: block.totalOccupied || 0, icon: "", color: "text-red-400" }
          ].map(s => (
            <div key={s.label} className="bg-[#1e293b] rounded-2xl p-4 border border-slate-700/60">
              <span className="text-xl block mb-1">{s.icon}</span>
              <p className={`text-2xl font-extrabold ${s.color}`}>{s.value}</p>
              <p className="text-slate-500 text-xs">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Occupancy bar */}
        <div className="bg-[#1e293b] rounded-2xl p-4 border border-slate-700/60">
          <div className="flex justify-between text-xs mb-2">
            <span className="text-slate-400">Block Occupancy</span>
            <span className="text-slate-300 font-semibold">{100 - availPct}% filled</span>
          </div>
          <div className="w-full bg-slate-700 rounded-full h-2 overflow-hidden">
            <div
              className="h-2 rounded-full transition-all duration-700"
              style={{
                width: `${100 - availPct}%`,
                background: availPct > 30 ? "#22c55e" : availPct > 10 ? "#f59e0b" : "#ef4444"
              }}
            />
          </div>
        </div>

        {/* Tab buttons */}
        <div className="flex gap-2 overflow-x-auto hide-scrollbar">
          {[
            { id: "tab-overview", key: "overview", label: " Overview" },
            { id: "tab-vehicles", key: "vehicles", label: " Vehicles" },
            { id: "tab-search", key: "search", label: "🔍 Search" },
            { id: "tab-map", key: "map", label: "🗺️ Map" }
          ].map(t => (
            <button
              key={t.key}
              id={t.id}
              onClick={() => setTab(t.key)}
              className={`flex-shrink-0 px-4 py-2 rounded-xl text-xs font-semibold border transition-all ${
                tab === t.key
                  ? "bg-[#F5C518]/20 border-[#F5C518] text-[#F5C518]"
                  : "bg-[#1e293b] border-slate-600 text-slate-400"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* ── OVERVIEW tab ── */}
        {tab === "overview" && (
          <div className="fade-in space-y-3">
            <h3 className="text-white font-semibold text-sm">Floor Breakdown</h3>
            {(block.floors || []).map((f, i) => (
              <div key={i} className="bg-[#1e293b] rounded-xl px-4 py-3 border border-slate-700/60">
                <div className="flex justify-between mb-1.5">
                  <div>
                    <p className="text-white text-sm font-medium">
                      {block.floors.some(fl => fl.buildingName !== f.buildingName)
                        ? `${f.buildingName} · ${f.floorLevel}`
                        : f.floorLevel}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-green-400 text-xs font-semibold">{f.availableSpaces} free</span>
                    <span className="text-slate-500 text-xs"> / {f.totalSpaces}</span>
                  </div>
                </div>
                <div className="w-full bg-slate-700 rounded-full h-1.5 overflow-hidden">
                  <div
                    className="h-1.5 rounded-full"
                    style={{
                      width: `${f.totalSpaces > 0 ? (f.availableSpaces / f.totalSpaces) * 100 : 0}%`,
                      background: f.availableSpaces > 0 ? "#22c55e" : "#ef4444"
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── VEHICLES tab ── */}
        {tab === "vehicles" && (
          <div className="fade-in space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-white font-semibold text-sm">
                Active Vehicles ({block.activeVehicles?.length || 0})
              </h3>
              <button onClick={fetchDashboard} className="text-[#F5C518] text-sm font-medium">↻</button>
            </div>
            {(block.activeVehicles || []).length === 0 ? (
              <div className="text-center py-10 text-slate-400">
                <span className="text-4xl block mb-2">🅿️</span>
                No active vehicles in this block.
              </div>
            ) : (
              block.activeVehicles.map(log => (
                <VehicleRow
                  key={log._id}
                  log={log}
                  onCheckout={handleCheckout}
                  highlighted={highlightedLog?._id === log._id}
                />
              ))
            )}
          </div>
        )}

        {/* ── SEARCH tab ── */}
        {tab === "search" && (
          <div className="fade-in space-y-4">
            <form onSubmit={handleSearch} className="flex gap-2">
              <input
                id="vehicle-search-input"
                className="input-field flex-1 py-3"
                placeholder="Vehicle number or owner name..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
              <button
                id="search-btn"
                type="submit"
                disabled={searching}
                className="bg-[#F5C518] text-[#0f172a] font-bold px-4 py-3 rounded-xl active:scale-95 transition-transform"
              >
                {searching ? "..." : "🔍"}
              </button>
            </form>

            {searchResults !== null && (
              <div className="fade-in">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-slate-400 text-sm">{searchResults.length} result(s)</p>
                  {searchResults.length > 0 && (
                    <button
                      id="locate-on-map-btn"
                      onClick={() => handleHighlightOnMap(searchResults[0])}
                      className="bg-blue-500/20 border border-blue-500/30 text-blue-400 text-xs font-semibold px-3 py-1.5 rounded-lg"
                    >
                     Locate on Map
                    </button>
                  )}
                </div>
                <SearchResults
                  results={searchResults}
                  onHighlight={handleHighlightOnMap}
                  onCheckout={handleCheckout}
                />
              </div>
            )}
          </div>
        )}

        {/* ── MAP tab ── */}
        {tab === "map" && (
          <div className="fade-in">
            {highlightedLog && (
              <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl px-4 py-3 mb-3 flex items-center justify-between">
                <div>
                  <p className="text-blue-300 text-xs font-semibold">Locating Vehicle</p>
                  <p className="text-white font-bold">{highlightedLog.vehicleNumber}</p>
                  <p className="text-slate-400 text-xs">{highlightedLog.floorLevel} · Slot {highlightedLog.spaceId}</p>
                </div>
                <button
                  onClick={() => setHighlightedLog(null)}
                  className="text-slate-400 text-lg"
                >
                  ✕
                </button>
              </div>
            )}

            <div className="bg-[#1e293b] rounded-2xl p-4 border border-slate-700/60">
              <p className="text-white font-semibold text-sm mb-3">Block Parking Map</p>
              <BlockAdminMap
                blockId={user?.assignedBlock}
                highlightSpaceId={highlightedLog?.spaceId}
              />
            </div>
          </div>
        )}
      </div>

      {/* Bottom Nav */}
      <nav className="nav-bottom">
        {[
          { id: "nav-overview", key: "overview", icon: "", label: "Overview" },
          { id: "nav-vehicles", key: "vehicles", icon: "", label: "Vehicles" },
          { id: "nav-search", key: "search", icon: "", label: "Search" },
          { id: "nav-map", key: "map", icon: "", label: "Map" }
        ].map(item => (
          <button
            key={item.key}
            id={item.id}
            onClick={() => setTab(item.key)}
            className={`nav-item ${tab === item.key ? "text-[#F5C518]" : "text-slate-500"}`}
          >
            <span className="text-xl">{item.icon}</span>
            <span className="text-xs">{item.label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}

function BlockAdminMap({ blockId, highlightSpaceId }) {
  const [mapData, setMapData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeBldg, setActiveBldg] = useState(null);
  const [activeFloor, setActiveFloor] = useState(null);

  useEffect(() => {
    if (!blockId) return;
    loadBlockMapData(blockId, setMapData, setLoading, setActiveBldg, setActiveFloor);
    const interval = setInterval(() => loadBlockMapData(blockId, setMapData, setLoading, setActiveBldg, setActiveFloor), 15000);
    return () => clearInterval(interval);
  }, [blockId]);

  if (loading) return <div className="text-slate-400 text-sm text-center py-8">Loading map...</div>;
  if (!mapData || mapData.buildings.length === 0) return <div className="text-slate-500 text-sm text-center py-8">No map data.</div>;

  const currentBldg = mapData.buildings.find(b => b.buildingName === activeBldg) || mapData.buildings[0];
  const currentFloor = currentBldg?.floors.find(f => f.floorLevel === activeFloor) || currentBldg?.floors[0];

  return (
    <div>
      {mapData.buildings.length > 1 && (
        <div className="flex gap-2 mb-3 overflow-x-auto hide-scrollbar">
          {mapData.buildings.map(b => (
            <button key={b.buildingName} onClick={() => { setActiveBldg(b.buildingName); setActiveFloor(b.floors[0]?.floorLevel); }}
              className={`flex-shrink-0 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${activeBldg === b.buildingName ? "bg-[#F5C518]/20 border-[#F5C518] text-[#F5C518]" : "bg-[#0f172a] border-slate-600 text-slate-400"}`}>
              {b.buildingName}
            </button>
          ))}
        </div>
      )}

      {currentBldg && currentBldg.floors.length > 1 && (
        <div className="flex gap-2 mb-3 overflow-x-auto hide-scrollbar">
          {currentBldg.floors.map(f => (
            <button key={f.floorLevel} onClick={() => setActiveFloor(f.floorLevel)}
              className={`flex-shrink-0 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${activeFloor === f.floorLevel ? "bg-[#F5C518]/20 border-[#F5C518] text-[#F5C518]" : "bg-[#0f172a] border-slate-600 text-slate-400"}`}>
              {f.floorLevel}
            </button>
          ))}
        </div>
      )}

      <div className="flex gap-3 mb-3 px-1">
        {[["#22c55e", "Available"], ["#ef4444", "Occupied"], ["#3b82f6", "Located"], ["#f59e0b", "Reserved"]].map(([c, l]) => (
          <div key={l} className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-sm" style={{ background: c }} />
            <span className="text-slate-400 text-[10px]">{l}</span>
          </div>
        ))}
      </div>

      {currentFloor && (
        <div className="grid gap-2" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(60px, 1fr))" }}>
          {currentFloor.spaces.map(space => {
            const isHighlighted = highlightSpaceId === space.spaceId;
            const bgColor = isHighlighted ? "#3b82f6" : space.status === "available" ? "#22c55e" : space.status === "occupied" ? "#ef4444" : "#f59e0b";
            return (
              <div
                key={space.spaceId}
                id={`admin-space-${space.spaceId}`}
                role="img"
                aria-label={`Space ${space.spaceId}, ${isHighlighted ? "Highlighted" : space.status}`}
                className={`rounded-lg py-2 px-1 text-center ${isHighlighted ? "blink-highlight" : ""}`}
                style={{ backgroundColor: `${bgColor}20`, border: `1px solid ${bgColor}` }}
              >
                <p className="text-white font-bold text-[10px]">{space.spaceId}</p>
                <p className="text-[9px] font-medium mt-0.5" style={{ color: bgColor }}>
                  {isHighlighted ? "HERE" : space.status === "available" ? "Free" : space.status === "occupied" ? "Taken" : "Res."}
                </p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}


async function loadBlockMapData(blockId, setMapData, setLoading, setActiveBldg, setActiveFloor) {
  try {
    const res = await axios.get(`/api/blocks/${blockId}/map`);
    const data = res.data;
    setMapData(data);
    if (data.buildings.length > 0) {
      setActiveBldg(prev => prev || data.buildings[0].buildingName);
      setActiveFloor(prev => prev || data.buildings[0].floors[0]?.floorLevel);
    }
  } catch {
    // silent
  } finally {
    setLoading(false);
  }
}
