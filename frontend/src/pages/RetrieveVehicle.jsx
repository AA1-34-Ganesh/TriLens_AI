import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import AIHintCard from "../components/AIHintCard";
import FloorScanner from "../components/FloorScanner";
import InteractiveMap from "../components/InteractiveMap";
import { getAIContext, clearAIContext } from "../utils/aiVision";
import api from "../utils/api";
import { useAuth } from "../context/AuthContext";

export default function RetrieveVehicle() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [aiCtx, setAiCtx] = useState(null);
  const [activeLog, setActiveLog] = useState(null);
  const [loadingLog, setLoadingLog] = useState(true);
  const [showFloorScanner, setShowFloorScanner] = useState(false);
  const [checkingOut, setCheckingOut] = useState(false);
  const [checkOutResult, setCheckOutResult] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const ctx = getAIContext();
    setAiCtx(ctx);

    api.get("/parking/active")
      .then(res => setActiveLog(res.data.log))
      .catch(() => setActiveLog(null))
      .finally(() => setLoadingLog(false));
  }, []);

  const handleFloorScanCheckout = (data) => {
    clearAIContext();
    setCheckOutResult(data);
    setActiveLog(null);
    setShowFloorScanner(false);
  };

  const doDirectCheckOut = async () => {
    setCheckingOut(true);
    setError("");
    try {
      const res = await api.post("/parking/checkout");
      clearAIContext();
      setCheckOutResult({ ...res.data, spaceId: res.data.log?.spaceId });
      setActiveLog(null);
    } catch (err) {
      setError(err.response?.data?.message || "Check-out failed");
    } finally {
      setCheckingOut(false);
    }
  };

  if (loadingLog) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 border-2 border-accent border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <div className="text-slate-400 text-sm">Loading your session...</div>
        </div>
      </div>
    );
  }

  if (showFloorScanner) {
    return (
      <div className="min-h-screen bg-surface">
        <div className="page-header">
          <button
            id="retrieve-scanner-back-btn"
            onClick={() => setShowFloorScanner(false)}
            className="text-white text-xl px-1"
          >
            ←
          </button>
          <h1 className="text-white font-bold text-base flex-1">Scan Floor Exit QR</h1>
        </div>
        <div className="px-4 py-4">
          <FloorScanner
            mode="checkout"
            onSuccess={handleFloorScanCheckout}
            onCancel={() => setShowFloorScanner(false)}
          />
        </div>
      </div>
    );
  }

  if (checkOutResult) {
    return (
      <div className="min-h-screen bg-surface px-4 py-6 flex flex-col">
        <div className="page-header mb-0">
          <button
            id="retrieve-done-back-btn"
            onClick={() => navigate("/dashboard")}
            className="text-white text-xl px-1"
          >
            ←
          </button>
          <h1 className="text-white font-bold text-base flex-1">Vehicle Retrieved</h1>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center px-4 space-y-4 mt-6">
          <div className="card text-center border border-available/30 w-full">
            <span className="text-5xl block mb-2">🏁</span>
            <h2 className="text-available font-bold text-xl">See You Later!</h2>
            <p className="text-slate-400 text-sm mt-1">Vehicle checked out successfully.</p>
          </div>
          <div className="card w-full">
            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="bg-muted rounded-xl py-3">
                <p className="text-slate-500 text-xs">Space</p>
                <p className="text-accent font-bold mt-1">{checkOutResult.spaceId || checkOutResult.log?.spaceId}</p>
              </div>
              <div className="bg-muted rounded-xl py-3">
                <p className="text-slate-500 text-xs">Duration</p>
                <p className="text-white font-bold mt-1">{checkOutResult.duration}</p>
              </div>
              <div className="bg-muted rounded-xl py-3">
                <p className="text-slate-500 text-xs">Vehicle</p>
                <p className="text-white text-xs font-semibold mt-1">{user?.vehicleNumber}</p>
              </div>
            </div>
          </div>
          <button
            id="retrieve-done-btn"
            onClick={() => navigate("/dashboard")}
            className="btn-primary w-full"
          >
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface pb-8">
      <div className="page-header">
        <button
          id="retrieve-back-btn"
          onClick={() => navigate("/dashboard")}
          className="text-white text-xl px-1"
        >
          ←
        </button>
        <h1 className="text-white font-bold text-base flex-1">Retrieve Vehicle</h1>
      </div>

      <div className="px-4 py-4 space-y-4">
        {!activeLog ? (
          <div className="card text-center py-10">
            <span className="text-4xl block mb-3"></span>
            <p className="text-white font-semibold">No active parking session</p>
            <p className="text-slate-400 text-sm mt-1">You haven't checked in a vehicle.</p>
            <button
              id="go-park-btn"
              onClick={() => navigate("/parking")}
              className="btn-primary mt-4 max-w-xs mx-auto"
            >
              Park Now
            </button>
          </div>
        ) : (
          <>
            <div className="card border border-accent/30">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <span className="badge-accent">Parked</span>
                  <p className="text-white font-bold text-xl mt-2">{activeLog.spaceId}</p>
                  <p className="text-slate-400 text-sm">{activeLog.buildingName} · {activeLog.floorLevel}</p>
                </div>
                <div className="text-right">
                  <p className="text-slate-400 text-sm font-medium">{activeLog.vehicleNumber}</p>
                  <p className="text-slate-500 text-xs mt-1">
                    {new Date(activeLog.timestampIn).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </p>
                </div>
              </div>
            </div>

            {aiCtx && (
              <AIHintCard
                hint={aiCtx.hint}
                imageDataUrl={aiCtx.imageDataUrl}
                spaceId={aiCtx.spaceId}
                buildingName={activeLog.buildingName}
                floorLevel={activeLog.floorLevel}
              />
            )}

            {!aiCtx && activeLog.aiLandmarkHint && (
              <div className="card border border-accent/20">
                <div className="flex items-start gap-3">
                  <span className="text-2xl"></span>
                  <div>
                    <p className="text-accent text-sm font-semibold mb-1">Visual Guide</p>
                    <p className="text-slate-300 text-sm">{activeLog.aiLandmarkHint}</p>
                  </div>
                </div>
              </div>
            )}

            <div>
              <p className="text-slate-400 text-xs font-medium mb-2 px-1"> Your location on the floor map</p>
              <InteractiveMap
                buildingName={activeLog.buildingName}
                mySpaceId={activeLog.spaceId}
                myFloorLevel={activeLog.floorLevel}
                autoRefreshMs={30000}
              />
            </div>

            {error && (
              <div className="bg-occupied/10 border border-occupied/30 text-occupied px-4 py-3 rounded-xl text-sm fade-in">
                {error}
              </div>
            )}

            <div className="card space-y-3">
              <p className="text-white font-semibold text-sm">Ready to leave?</p>
              <p className="text-slate-400 text-xs">
                Scan the same floor QR code at the exit ramp, or check out directly.
              </p>
              <button
                id="scan-exit-floor-btn"
                onClick={() => setShowFloorScanner(true)}
                className="btn-primary"
              >
                Scan Floor Exit QR
              </button>
              <button
                id="direct-checkout-btn"
                onClick={doDirectCheckOut}
                disabled={checkingOut}
                className="btn-outline"
              >
                {checkingOut ? "Checking out..." : "Direct Check Out"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
