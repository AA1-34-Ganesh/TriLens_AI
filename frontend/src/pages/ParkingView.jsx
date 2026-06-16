import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import FloorScanner from "../components/FloorScanner";
import InteractiveMap from "../components/InteractiveMap";
import AIHintCard from "../components/AIHintCard";
import { runAIDetection, storeAIContext } from "../utils/aiVision";
import api from "../utils/api";
import { useAuth } from "../context/AuthContext";

const STEPS = {
  HOME: "home",
  FLOOR_SCAN: "floor_scan",
  MAP: "map",
  LOCK_CONFIRM: "lock_confirm",
  AI: "ai",
  DONE: "done"
};

function LockCountdown({ expiresAt, onExpired }) {
  const [remaining, setRemaining] = useState(300);

  useEffect(() => {
    const tick = () => {
      const diff = Math.max(0, Math.floor((new Date(expiresAt) - Date.now()) / 1000));
      setRemaining(diff);
      if (diff === 0 && onExpired) onExpired();
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [expiresAt, onExpired]);

  const mins = Math.floor(remaining / 60);
  const secs = remaining % 60;
  const pct = (remaining / 300) * 100;

  return (
    <div className="card border border-locked/30 bg-locked/5">
      <div className="flex items-center justify-between mb-2">
        <p className="text-white font-semibold text-sm"> Space Reserved</p>
        <span className="font-mono text-locked font-bold text-lg">{mins}:{secs.toString().padStart(2, "0")}</span>
      </div>
      <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
        <div
          className="h-2 rounded-full bg-locked transition-all duration-1000"
          style={{ width: `${pct}%` }}
        />
      </div>
      <p className="text-slate-400 text-xs mt-2">
        Ride to your spot and capture the AI landmark before the timer expires.
      </p>
    </div>
  );
}

export default function ParkingView() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(STEPS.HOME);
  const [selectedSpace, setSelectedSpace] = useState(null);
  const [selectedBuilding, setSelectedBuilding] = useState("");
  const [lockData, setLockData] = useState(null);
  const [lockError, setLockError] = useState("");
  const [locking, setLocking] = useState(false);
  const [aiState, setAiState] = useState({ loading: false, hint: "", image: "", error: "" });
  const [confirming, setConfirming] = useState(false);
  const [confirmError, setConfirmError] = useState("");
  const [result, setResult] = useState(null);
  const [buildings, setBuildings] = useState([]);
  const videoRef = useRef(null);
  const streamRef = useRef(null);

  useEffect(() => {
    api.get("/parking/availability").then(res => setBuildings(res.data)).catch(() => {});
  }, []);

  const handleFloorScanSuccess = (data) => {
    setResult({
      log: data.log,
      hint: data.landmarkHint || "",
      image: "",
      spaceId: data.spaceId,
      buildingName: data.buildingName,
      floorLevel: data.floorLevel
    });
    setStep(STEPS.DONE);
  };

  const handleMapSelect = (space) => {
    setSelectedSpace(space);
    setLockError("");
  };

  const handleLockSpace = async () => {
    if (!selectedSpace) return;
    setLocking(true);
    setLockError("");
    try {
      const res = await api.post("/parking/lock", {
        buildingName: selectedSpace.buildingName,
        floorLevel: selectedSpace.floorLevel,
        spaceId: selectedSpace.spaceId
      });
      setLockData(res.data);
      setStep(STEPS.AI);
    } catch (err) {
      setLockError(err.response?.data?.message || "Failed to reserve space. Try another slot.");
    } finally {
      setLocking(false);
    }
  };

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment", width: { ideal: 1280 }, height: { ideal: 720 } }
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
    } catch {
      setAiState(s => ({ ...s, error: "Camera unavailable. AI will be skipped." }));
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
  };

  useEffect(() => {
    if (step === STEPS.AI) startCamera();
    return () => stopCamera();
  }, [step]);

  const handleLockExpired = () => {
    setLockError("Your 5-minute hold expired. Please select a new space.");
    setLockData(null);
    setSelectedSpace(null);
    setStep(STEPS.MAP);
  };

  const runAI = async () => {
    if (!videoRef.current) {
      await doConfirmParking("");
      return;
    }
    setAiState({ loading: true, hint: "", image: "", error: "" });
    try {
      const { hint, imageDataUrl } = await runAIDetection(videoRef.current);
      stopCamera();
      storeAIContext(selectedSpace?.spaceId, hint, imageDataUrl);
      setAiState({ loading: false, hint, image: imageDataUrl, error: "" });
      await doConfirmParking(hint, imageDataUrl);
    } catch {
      stopCamera();
      setAiState({ loading: false, hint: "", image: "", error: "AI detection failed. Confirming without hint." });
      await doConfirmParking("");
    }
  };

  const skipAI = async () => {
    stopCamera();
    await doConfirmParking("");
  };

  const doConfirmParking = async (hint, image = "") => {
    if (!selectedSpace || !lockData) return;
    setConfirming(true);
    setConfirmError("");
    try {
      const res = await api.post("/parking/confirm", {
        buildingName: selectedSpace.buildingName,
        floorLevel: selectedSpace.floorLevel,
        spaceId: selectedSpace.spaceId,
        aiLandmarkHint: hint
      });
      if (image) {
        storeAIContext(selectedSpace.spaceId, hint, image);
      }
      setResult({
        ...res.data,
        hint,
        image,
        spaceId: selectedSpace.spaceId,
        buildingName: selectedSpace.buildingName,
        floorLevel: selectedSpace.floorLevel
      });
      setStep(STEPS.DONE);
    } catch (err) {
      setConfirmError(err.response?.data?.message || "Confirmation failed. Lock may have expired.");
    } finally {
      setConfirming(false);
    }
  };

  const handleBack = () => {
    if (step === STEPS.HOME) {
      navigate("/dashboard");
    } else if (step === STEPS.FLOOR_SCAN) {
      setStep(STEPS.HOME);
    } else if (step === STEPS.MAP) {
      setSelectedSpace(null);
      setLockError("");
      setStep(STEPS.HOME);
    } else if (step === STEPS.AI) {
      stopCamera();
      setStep(STEPS.MAP);
    } else {
      navigate("/dashboard");
    }
  };

  const titles = {
    [STEPS.HOME]: "Park Vehicle",
    [STEPS.FLOOR_SCAN]: "Floor QR Check-In",
    [STEPS.MAP]: "Select Your Spot",
    [STEPS.AI]: "AI Landmark Capture",
    [STEPS.DONE]: "Parked Successfully"
  };

  return (
    <div className="min-h-screen bg-surface pb-24">
      <div className="page-header">
        <button id="park-back-btn" onClick={handleBack} className="text-white text-xl px-1">
          ←
        </button>
        <h1 className="text-white font-bold text-base flex-1">{titles[step]}</h1>
        {step === STEPS.AI && lockData && (
          <span className="text-locked text-xs font-semibold">Space held</span>
        )}
      </div>

      <div className="px-4 py-4 space-y-4">

        {step === STEPS.HOME && (
          <div className="space-y-4 fade-in">
            <div
              id="floor-qr-entry-card"
              className="card border border-accent/30 cursor-pointer active:scale-95 transition-transform"
              onClick={() => setStep(STEPS.FLOOR_SCAN)}
            >
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-accent/20 rounded-2xl flex items-center justify-center flex-shrink-0">
                  <span className="text-2xl">🏢</span>
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-0.5">
                    <p className="text-white font-bold text-base">Scan Floor QR</p>
                    <span className="bg-accent/20 text-accent text-xs font-semibold px-2 py-0.5 rounded-full">Recommended</span>
                  </div>
                  <p className="text-slate-400 text-sm">
                    Scan the entrance QR. Space auto-allocated instantly.
                  </p>
                </div>
                <span className="text-slate-500 text-xl">›</span>
              </div>
            </div>

            <div
              id="map-entry-card"
              className="card border border-slate-700 cursor-pointer active:scale-95 transition-transform"
              onClick={() => setStep(STEPS.MAP)}
            >
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-muted rounded-2xl flex items-center justify-center flex-shrink-0">
                  <span className="text-2xl">🗺️</span>
                </div>
                <div className="flex-1">
                  <p className="text-white font-semibold text-base">Use Interactive Map</p>
                  <p className="text-slate-400 text-sm">
                    Browse all floors and pick your preferred space.
                  </p>
                </div>
                <span className="text-slate-500 text-xl">›</span>
              </div>
            </div>

            <div className="card bg-muted/50 border border-slate-700/50">
              <div className="flex items-start gap-3">
                <span className="text-lg mt-0.5"></span>
                <p className="text-slate-400 text-xs leading-relaxed">
                  The map uses a 5-minute soft hold to prevent double-bookings. Your chosen spot turns yellow while you ride to it.
                </p>
              </div>
            </div>
          </div>
        )}

        {step === STEPS.FLOOR_SCAN && (
          <FloorScanner
            mode="checkin"
            onSuccess={handleFloorScanSuccess}
            onCancel={() => setStep(STEPS.HOME)}
          />
        )}

        {step === STEPS.MAP && (
          <>
            <div className="card space-y-3">
              <p className="text-white font-semibold text-sm">Select Building</p>
              <select
                id="map-building-select"
                value={selectedBuilding}
                onChange={e => {
                  setSelectedBuilding(e.target.value);
                  setSelectedSpace(null);
                  setLockError("");
                }}
                className="input-field"
              >
                <option value="">Choose building</option>
                {buildings.map(b => (
                  <option key={b.buildingName} value={b.buildingName}>{b.buildingName}</option>
                ))}
              </select>
            </div>

            {selectedBuilding && (
              <InteractiveMap
                buildingName={selectedBuilding}
                onSelect={handleMapSelect}
                autoRefreshMs={12000}
              />
            )}

            {lockError && (
              <div className="bg-occupied/10 border border-occupied/30 text-occupied px-4 py-3 rounded-xl text-sm fade-in">
                {lockError}
              </div>
            )}

            {selectedSpace && (
              <button
                id="lock-space-btn"
                onClick={handleLockSpace}
                disabled={locking}
                className="btn-primary"
              >
                {locking ? "Reserving…" : ` Reserve ${selectedSpace.spaceId} (5 min hold)`}
              </button>
            )}
          </>
        )}

        {step === STEPS.AI && (
          <div className="space-y-4 fade-in">
            {lockData && lockData.lockExpiresAt && (
              <LockCountdown
                expiresAt={lockData.lockExpiresAt}
                onExpired={handleLockExpired}
              />
            )}

            <div className="card">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-2xl"></span>
                <div>
                  <p className="text-white font-bold text-sm">AI Landmark Detection</p>
                  <p className="text-slate-400 text-xs">
                    Spot: {selectedSpace?.spaceId} · {selectedSpace?.floorLevel}
                  </p>
                </div>
              </div>

              <div className="rounded-xl overflow-hidden bg-black mb-3 relative" style={{ minHeight: 220 }}>
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full object-cover"
                  style={{ maxHeight: 280 }}
                />
                <div className="absolute bottom-2 left-2 right-2 bg-black/60 rounded-lg px-3 py-1.5">
                  <p className="text-white text-xs text-center">Point camera at nearby landmarks</p>
                </div>
              </div>

              <p className="text-slate-400 text-xs text-center mb-4">
                The AI detects pillars, signs, fire extinguishers near your bike for easy retrieval.
              </p>

              {aiState.error && (
                <div className="bg-amber-500/10 border border-amber-500/30 text-amber-400 px-3 py-2 rounded-xl text-xs mb-3">
                  {aiState.error}
                </div>
              )}
              {confirmError && (
                <div className="bg-occupied/10 border border-occupied/30 text-occupied px-3 py-2 rounded-xl text-sm mb-3">
                  {confirmError}
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <button
                  id="capture-ai-btn"
                  onClick={runAI}
                  disabled={aiState.loading || confirming}
                  className="btn-primary"
                >
                  {aiState.loading ? "Scanning…" : confirming ? "Confirming…" : "Capture & Park"}
                </button>
                <button
                  id="skip-ai-btn"
                  onClick={skipAI}
                  disabled={confirming}
                  className="btn-outline"
                >
                  {confirming ? "Wait…" : "Skip AI"}
                </button>
              </div>
            </div>
          </div>
        )}

        {step === STEPS.DONE && result && (
          <div className="space-y-4 fade-in">
            <div className="card text-center border border-available/30">
              <span className="text-5xl block mb-2"></span>
              <h2 className="text-available font-bold text-xl">Parked Successfully!</h2>
              <p className="text-slate-400 text-sm mt-1">Your vehicle is registered in the system.</p>
            </div>

            <div className="card">
              <div className="grid grid-cols-3 gap-3 text-center mb-4">
                <div className="bg-muted rounded-xl py-3">
                  <p className="text-slate-500 text-xs">Floor</p>
                  <p className="text-white font-semibold text-xs mt-1">{result.floorLevel}</p>
                </div>
                <div className="bg-accent/10 border border-accent/30 rounded-xl py-3">
                  <p className="text-slate-500 text-xs">Space ID</p>
                  <p className="text-accent font-bold text-lg mt-0.5">{result.spaceId}</p>
                </div>
                <div className="bg-muted rounded-xl py-3">
                  <p className="text-slate-500 text-xs">Vehicle</p>
                  <p className="text-white font-semibold text-xs mt-1">{user?.vehicleNumber}</p>
                </div>
              </div>

              {result.hint && (
                <div className="bg-muted rounded-xl px-4 py-3 flex items-start gap-3 mb-1">
                  <span className="text-xl mt-0.5"></span>
                  <div>
                    <p className="text-accent text-xs font-semibold mb-0.5">Visual Guide</p>
                    <p className="text-slate-300 text-sm">{result.hint}</p>
                  </div>
                </div>
              )}
            </div>

            {result.hint && result.image && (
              <AIHintCard
                hint={result.hint}
                imageDataUrl={result.image}
                spaceId={result.spaceId}
                buildingName={result.buildingName}
                floorLevel={result.floorLevel}
              />
            )}

            <button id="goto-dashboard-btn" onClick={() => navigate("/dashboard")} className="btn-primary">
              Back to Dashboard
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
