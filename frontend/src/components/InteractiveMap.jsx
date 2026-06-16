import { useState, useEffect, useCallback, useRef } from "react";
import api from "../utils/api";

const SLOT_SIZE = 52;
const SLOT_GAP = 6;
const COLS = 5;

function CountdownTimer({ expiresAt }) {
  const [remaining, setRemaining] = useState("");

  useEffect(() => {
    const tick = () => {
      const diff = new Date(expiresAt) - Date.now();
      if (diff <= 0) {
        setRemaining("Expired");
        return;
      }
      const mins = Math.floor(diff / 60000);
      const secs = Math.floor((diff % 60000) / 1000);
      setRemaining(`${mins}:${secs.toString().padStart(2, "0")}`);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [expiresAt]);

  return <span className="font-mono text-xs text-locked">{remaining}</span>;
}

function FloorPanel({ floorData, selectedSpaceId, onSelect, mySpaceId }) {
  const spaces = floorData.spaces || [];

  const rows = Math.ceil(spaces.length / COLS);
  const gridW = COLS * (SLOT_SIZE + SLOT_GAP) - SLOT_GAP;
  const gridH = rows * (SLOT_SIZE + SLOT_GAP) - SLOT_GAP;

  const available = spaces.filter(s => s.status === "available").length;
  const occupiedCount = spaces.filter(s => s.status === "occupied").length;
  const lockedCount = spaces.filter(s => s.status === "locked").length;

  return (
    <div className="flex-shrink-0 flex flex-col" style={{ minWidth: gridW + 32 }}>
      <div className="mb-3 px-1">
        <p className="text-white font-bold text-sm">{floorData.floorLevel}</p>
        <div className="flex gap-2 mt-1 flex-wrap">
          <span className="text-xs text-available font-medium">{available} free</span>
          <span className="text-slate-600 text-xs">·</span>
          <span className="text-xs text-occupied font-medium">{occupiedCount} taken</span>
          {lockedCount > 0 && (
            <>
              <span className="text-slate-600 text-xs">·</span>
              <span className="text-xs text-locked font-medium">{lockedCount} hold</span>
            </>
          )}
        </div>
      </div>

      <div className="relative" style={{ width: gridW, height: gridH }}>
        {spaces.map((space, idx) => {
          const col = idx % COLS;
          const row = Math.floor(idx / COLS);
          const x = col * (SLOT_SIZE + SLOT_GAP);
          const y = row * (SLOT_SIZE + SLOT_GAP);

          const isMySpot = space.spaceId === mySpaceId;
          const isSelected = space.spaceId === selectedSpaceId && !mySpaceId;
          const isAvailable = space.status === "available";
          const isOccupied = space.status === "occupied";
          const isLocked = space.status === "locked";

          let bg, border, textColor, cursor;
          if (isMySpot) {
            bg = "bg-accent";
            border = "border-white border-2";
            textColor = "text-surface";
            cursor = "cursor-default";
          } else if (isSelected) {
            bg = "bg-accent";
            border = "border-white border-2";
            textColor = "text-surface";
            cursor = "cursor-pointer";
          } else if (isAvailable) {
            bg = "bg-available/20 hover:bg-available/40";
            border = "border-available/60 hover:border-available border";
            textColor = "text-available";
            cursor = "cursor-pointer";
          } else if (isLocked) {
            bg = "bg-locked/20";
            border = "border-locked/50 border";
            textColor = "text-locked";
            cursor = "cursor-not-allowed";
          } else {
            bg = "bg-occupied/20";
            border = "border-occupied/40 border";
            textColor = "text-occupied/70";
            cursor = "cursor-not-allowed";
          }

          const shortLabel = space.spaceId.includes("-")
            ? space.spaceId.split("-").slice(1).join("-")
            : space.spaceId;

          return (
            <div
              key={space.spaceId}
              role={cursor === "cursor-pointer" ? "button" : "img"}
              tabIndex={cursor === "cursor-pointer" ? 0 : -1}
              aria-label={`Space ${space.spaceId}, ${space.status}`}
              onClick={() => {
                if (isAvailable && onSelect && !mySpaceId) onSelect(space);
              }}
              onKeyDown={(e) => {
                if ((e.key === "Enter" || e.key === " ") && isAvailable && onSelect && !mySpaceId) onSelect(space);
              }}
              className={`absolute rounded-xl flex flex-col items-center justify-center transition-all duration-150 active:scale-95 ${bg} ${border} ${cursor}`}
              style={{
                left: x,
                top: y,
                width: SLOT_SIZE,
                height: SLOT_SIZE
              }}
              title={space.spaceId}
            >
              {isMySpot ? (
                <>
                  <span className="text-surface text-xs mb-0.5">🚗</span>
                  <span className={`font-bold text-xs leading-none ${textColor}`}>{shortLabel}</span>
                </>
              ) : isLocked ? (
                <>
                  <span className="text-locked text-xs mb-0.5">🔒</span>
                  <span className={`font-semibold text-xs leading-none ${textColor}`}>{shortLabel}</span>
                  {space.lockExpiresAt && (
                    <CountdownTimer expiresAt={space.lockExpiresAt} />
                  )}
                </>
              ) : isOccupied ? (
                <>
                  <span className="text-occupied/60 text-xs mb-0.5">🔴</span>
                  <span className={`font-semibold text-xs leading-none ${textColor}`}>{shortLabel}</span>
                </>
              ) : (
                <>
                  <span className="text-available text-xs mb-0.5">🟢</span>
                  <span className={`font-bold text-xs leading-none ${textColor}`}>{shortLabel}</span>
                </>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function InteractiveMap({ buildingName, onSelect, mySpaceId, myFloorLevel, autoRefreshMs = 15000 }) {
  const [layout, setLayout] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedSpaceId, setSelectedSpaceId] = useState(null);
  const scrollRef = useRef(null);
  const intervalRef = useRef(null);

  const fetchLayout = useCallback(() => {
    if (!buildingName) return;
    api.get(`/parking/layout?buildingName=${encodeURIComponent(buildingName)}`)
      .then(res => {
        setLayout(res.data);
        setError("");
      })
      .catch(() => {
        setError("Could not load building map. Please retry.");
      })
      .finally(() => setLoading(false));
  }, [buildingName]);

  useEffect(() => {
    setLoading(true);
    setSelectedSpaceId(null);
    fetchLayout();
    intervalRef.current = setInterval(fetchLayout, autoRefreshMs);
    return () => clearInterval(intervalRef.current);
  }, [fetchLayout, autoRefreshMs]);

  useEffect(() => {
    if (myFloorLevel && scrollRef.current && layout) {
      const idx = layout.floors.findIndex(f => f.floorLevel === myFloorLevel);
      if (idx > 0) {
        scrollRef.current.scrollLeft = idx * 260;
      }
    }
  }, [myFloorLevel, layout]);

  const handleSelect = (space, floorLevel) => {
    setSelectedSpaceId(space.spaceId);
    if (onSelect) {
      onSelect({ ...space, floorLevel, buildingName });
    }
  };

  if (loading) {
    return (
      <div className="card flex flex-col items-center justify-center gap-3 py-10">
        <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
        <p className="text-slate-400 text-sm">Loading {buildingName} map…</p>
      </div>
    );
  }

  if (error || !layout) {
    return (
      <div className="card text-center py-8">
        <span className="text-3xl block mb-2">🗺️</span>
        <p className="text-slate-400 text-sm mb-3">{error || "No layout data."}</p>
        <button onClick={fetchLayout} className="text-accent text-sm font-semibold hover:underline">
          ↻ Retry
        </button>
      </div>
    );
  }

  const totalAvailable = layout.floors.reduce((sum, f) => sum + f.spaces.filter(s => s.status === "available").length, 0);
  const totalSpaces = layout.floors.reduce((sum, f) => sum + f.spaces.length, 0);

  return (
    <div className="card space-y-4">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-white font-bold text-base">{layout.buildingName}</p>
          <p className="text-slate-400 text-xs mt-0.5">{totalAvailable} of {totalSpaces} spaces available</p>
        </div>
        <button onClick={fetchLayout} className="text-accent text-xs font-semibold">↻</button>
      </div>

      <div className="flex items-center gap-4 text-xs">
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-md bg-available/30 border border-available/60 inline-block" />
          <span className="text-slate-400">Free</span>
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-md bg-occupied/20 border border-occupied/40 inline-block" />
          <span className="text-slate-400">Taken</span>
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-md bg-locked/20 border border-locked/50 inline-block" />
          <span className="text-slate-400">Hold (5m)</span>
        </span>
        {(mySpaceId || selectedSpaceId) && (
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-md bg-accent inline-block" />
            <span className="text-slate-400">{mySpaceId ? "Yours" : "Selected"}</span>
          </span>
        )}
      </div>

      <div
        ref={scrollRef}
        className="overflow-x-auto hide-scrollbar"
      >
        <div className="flex gap-6 pb-2" style={{ minWidth: "max-content" }}>
          {layout.floors.map((floor, fi) => (
            <div key={floor.floorLevel} className="relative">
              {fi < layout.floors.length - 1 && (
                <div
                  className="absolute top-0 bottom-0 right-0 w-px bg-slate-700/50"
                  style={{ right: -12 }}
                />
              )}
              <FloorPanel
                floorData={floor}
                selectedSpaceId={selectedSpaceId}
                onSelect={(space) => handleSelect(space, floor.floorLevel)}
                mySpaceId={mySpaceId}
              />
            </div>
          ))}
        </div>
      </div>

      {selectedSpaceId && !mySpaceId && (
        <div className="bg-accent/10 border border-accent/30 rounded-xl px-4 py-3 fade-in">
          <p className="text-accent text-sm font-semibold">
            ✅ Selected: <span className="text-white">{selectedSpaceId}</span>
          </p>
          <p className="text-slate-400 text-xs mt-0.5">
            This slot will be locked for 5 minutes once you proceed.
          </p>
        </div>
      )}

      {mySpaceId && (
        <div className="bg-accent/10 border border-accent/30 rounded-xl px-4 py-3">
          <p className="text-accent text-sm font-semibold">
            🅿️ Your space: <span className="text-white">{mySpaceId}</span>
          </p>
        </div>
      )}
    </div>
  );
}
