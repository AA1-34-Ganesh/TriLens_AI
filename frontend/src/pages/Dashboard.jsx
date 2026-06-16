import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import FloorAvailability from "../components/FloorAvailability";
import api from "../utils/api";
import Header from "../components/Header";

function timeAgo(ts) {
  const diff = Date.now() - new Date(ts).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  return `${hrs}h ${mins % 60}m ago`;
}

export default function Dashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [buildings, setBuildings] = useState([]);
  const [loadingBuildings, setLoadingBuildings] = useState(true);
  const [activeSession, setActiveSession] = useState(null);
  const [loadingSession, setLoadingSession] = useState(true);
  const fetchBuildings = useCallback(async () => {
    try {
      setLoadingBuildings(true);
      const res = await api.get("/parking/availability");
      setBuildings(res.data);
    } catch {
      setBuildings([]);
    } finally {
      setLoadingBuildings(false);
    }
  }, []);

  const fetchSession = useCallback(async () => {
    try {
      const res = await api.get("/parking/active");
      setActiveSession(res.data.log);
    } catch {
      setActiveSession(null);
    } finally {
      setLoadingSession(false);
    }
  }, []);

  useEffect(() => {
    fetchBuildings();
    fetchSession();
  }, [fetchBuildings, fetchSession]);

  useEffect(() => {
    const timer = setInterval(() => fetchBuildings(), 30000);
    return () => clearInterval(timer);
  }, [fetchBuildings]);


  const currentPage = "home";

  return (
    <div className="min-h-screen bg-[#0F172A] pb-20">
      <Header />

      <div className="px-4 py-4 space-y-4 max-w-2xl mx-auto">
        {!loadingSession && (
          activeSession ? (
            <div className="card border-[#2563EB]/40">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <span className="badge badge-blue">Active Session</span>
                  <p className="text-[#F8FAFC] font-bold text-lg mt-2">{activeSession.spaceId}</p>
                  <p className="text-[#94A3B8] text-sm">{activeSession.buildingName} &middot; {activeSession.floorLevel}</p>
                </div>
                <div className="text-right">
                  <p className="text-[#94A3B8] text-xs">{timeAgo(activeSession.timestampIn)}</p>
                  <p className="text-[#94A3B8] text-xs mt-1">{activeSession.vehicleNumber}</p>
                </div>
              </div>
              {activeSession.aiLandmarkHint && (
                <div className="bg-[#0F172A] border border-[#334155] rounded-md px-3 py-2 mb-3">
                  <p className="text-[#94A3B8] text-xs">{activeSession.aiLandmarkHint}</p>
                </div>
              )}
              <div className="grid grid-cols-2 gap-2">
                <button id="goto-retrieve-btn" onClick={() => navigate("/retrieve")} className="btn btn-primary w-full">
                  Retrieve Vehicle
                </button>
                <button id="goto-parking-btn" onClick={() => navigate("/parking")} className="btn btn-secondary w-full">
                  Parking Info
                </button>
              </div>
            </div>
          ) : (
            <div className="card border-dashed border-[#334155] text-center py-8">
              <p className="text-[#F8FAFC] font-semibold">No Active Parking</p>
              <p className="text-[#94A3B8] text-sm mt-1">Scan a QR to park your vehicle</p>
              <button id="checkin-now-btn" onClick={() => navigate("/parking")} className="btn btn-primary mt-4 mx-auto">
                Park Now
              </button>
            </div>
          )
        )}

        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-[#F8FAFC] text-base font-semibold">Live Availability</h2>
            <button id="refresh-btn" onClick={fetchBuildings} className="text-[#2563EB] text-sm font-medium">Refresh</button>
          </div>
          <FloorAvailability buildings={buildings} loading={loadingBuildings} />
        </div>

        <div className="card">
          <h2 className="text-[#F8FAFC] text-sm font-semibold mb-3">Quick Actions</h2>
          <div className="grid grid-cols-2 gap-3">
            <button id="scan-entry-btn" onClick={() => navigate("/parking?mode=entry")}
              className="bg-[#0F172A] border border-[#334155] rounded-md p-4 text-left hover:border-[#2563EB] transition-colors">
              <p className="text-[#F8FAFC] font-semibold text-sm">Scan Entry QR</p>
              <p className="text-[#94A3B8] text-xs mt-0.5">Check availability</p>
            </button>
            <button id="scan-spot-btn" onClick={() => navigate("/parking")}
              className="bg-[#0F172A] border border-[#334155] rounded-md p-4 text-left hover:border-[#2563EB] transition-colors">
              <p className="text-[#F8FAFC] font-semibold text-sm">Check In</p>
              <p className="text-[#94A3B8] text-xs mt-0.5">Scan spot QR</p>
            </button>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-[#2563EB] rounded-full flex items-center justify-center text-white text-xs font-semibold shrink-0">
              {user?.name ? user.name.charAt(0).toUpperCase() : "?"}
            </div>
            <div className="min-w-0">
              <p className="text-[#F8FAFC] font-semibold text-sm">{user?.name}</p>
              <p className="text-[#94A3B8] text-xs">{user?.studentId} &middot; {user?.vehicleNumber}</p>
            </div>
          </div>
        </div>
      </div>

      <nav className="fixed bottom-0 left-0 right-0 z-30 bg-[#1E293B] border-t border-[#334155] flex items-center justify-around px-2 pb-safe">
        {[
          { id: "nav-home", label: "Home", path: "/dashboard", key: "home" },
          { id: "nav-park", label: "Park", path: "/parking", key: "park" },
          { id: "nav-retrieve", label: "Retrieve", path: "/retrieve", key: "retrieve" },
        ].map((item) => (
          <button
            key={item.id}
            id={item.id}
            onClick={() => navigate(item.path)}
            className={`flex flex-col items-center gap-0.5 py-2.5 px-4 rounded-lg transition-colors cursor-pointer ${
              currentPage === item.key ? "text-[#2563EB]" : "text-[#94A3B8]"
            }`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.75} viewBox="0 0 24 24">
              {item.key === "home" && <><path d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-4 0a1 1 0 01-1-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 01-1 1" /></>}
              {item.key === "park" && <><rect x="3" y="3" width="18" height="18" rx="2" /><path d="M9 17V7h4a3 3 0 010 6H9" /></>}
              {item.key === "retrieve" && <><circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" /></>}
            </svg>
            <span className="text-[10px] font-medium">{item.label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}
