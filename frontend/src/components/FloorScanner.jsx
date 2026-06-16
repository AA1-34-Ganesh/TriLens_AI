import { useState, useCallback } from "react";
import ScannerView from "./ScannerView";
import api from "../utils/api";

const STATE = { IDLE: "idle", SCANNING: "scanning", LOADING: "loading", SUCCESS: "success", ERROR: "error" };

export default function FloorScanner({ mode = "checkin", onSuccess, onCancel }) {
  const [state, setState] = useState(STATE.IDLE);
  const [scanError, setScanError] = useState("");
  const [result, setResult] = useState(null);
  const [apiError, setApiError] = useState("");

  const processFloorQR = useCallback(async (data) => {
    setState(STATE.LOADING);
    setScanError("");
    setApiError("");

    const buildingName = data.buildingName || data.building || data.b;
    const floorLevel = data.floorLevel || data.floor || data.f;

    if (!buildingName || !floorLevel) {
      setState(STATE.ERROR);
      setApiError("Invalid QR code. This does not look like a floor-level QR. Please scan the correct sign board.");
      return;
    }

    try {
      if (mode === "checkin") {
        const res = await api.post("/parking/floor-checkin", { buildingName, floorLevel });
        setResult(res.data);
        setState(STATE.SUCCESS);
        if (onSuccess) onSuccess(res.data);
      } else {
        const res = await api.post("/parking/floor-checkout", { buildingName, floorLevel });
        setResult(res.data);
        setState(STATE.SUCCESS);
        if (onSuccess) onSuccess(res.data);
      }
    } catch (err) {
      setState(STATE.ERROR);
      setApiError(err.response?.data?.message || "Something went wrong. Please try again.");
    }
  }, [mode, onSuccess]);

  const handleScan = useCallback((data) => {
    processFloorQR(data);
  }, [processFloorQR]);

  const handleScanError = useCallback((msg) => {
    setState(STATE.ERROR);
    setApiError(msg || "Camera error. Please allow camera access and retry.");
  }, []);

  const reset = () => {
    setState(STATE.IDLE);
    setScanError("");
    setApiError("");
    setResult(null);
  };

  if (state === STATE.IDLE) {
    return (
      <div className="space-y-4 fade-in">
        <div className="card text-center py-8">
          <div className="w-16 h-16 bg-accent/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">📷</span>
          </div>
          <p className="text-white font-bold text-lg">
            {mode === "checkin" ? "Scan Floor Entry QR" : "Scan Floor Exit QR"}
          </p>
          <p className="text-slate-400 text-sm mt-2 px-4">
            {mode === "checkin"
              ? "Find the single QR sign board at the floor entrance ramp and scan it."
              : "Scan the same floor QR code at the exit to release your space."}
          </p>
          <button
            id="floor-scanner-open-btn"
            onClick={() => setState(STATE.SCANNING)}
            className="btn-primary mt-6 max-w-xs mx-auto"
          >
            Open Camera
          </button>
          {onCancel && (
            <button
              id="floor-scanner-cancel-btn"
              onClick={onCancel}
              className="text-slate-500 text-sm mt-3 block mx-auto hover:text-slate-300 transition-colors"
            >
              Cancel
            </button>
          )}
        </div>
      </div>
    );
  }

  if (state === STATE.SCANNING) {
    return (
      <ScannerView
        onScan={handleScan}
        onError={handleScanError}
        onClose={() => setState(STATE.IDLE)}
      />
    );
  }

  if (state === STATE.LOADING) {
    return (
      <div className="card text-center py-12 fade-in">
        <div className="w-12 h-12 border-2 border-accent border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-white font-semibold">
          {mode === "checkin" ? "Finding your space..." : "Releasing your space..."}
        </p>
        <p className="text-slate-400 text-sm mt-1">Contacting server, please wait.</p>
      </div>
    );
  }

  if (state === STATE.ERROR) {
    return (
      <div className="space-y-4 fade-in">
        <div className="card text-center py-8">
          <span className="text-5xl block mb-3"></span>
          <p className="text-occupied font-bold text-lg">Something went wrong</p>
          <p className="text-slate-400 text-sm mt-2 px-4">{apiError}</p>
          <div className="grid grid-cols-2 gap-3 mt-6">
            <button
              id="floor-scanner-retry-btn"
              onClick={reset}
              className="btn-primary"
            >
              Try Again
            </button>
            {onCancel && (
              <button
                id="floor-scanner-cancel-err-btn"
                onClick={onCancel}
                className="btn-outline"
              >
                Cancel
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (state === STATE.SUCCESS && result) {
    if (mode === "checkin") {
      return (
        <div className="space-y-4 fade-in">
          <div className="card text-center border border-available/30">
            <div className="w-16 h-16 bg-available/20 rounded-2xl flex items-center justify-center mx-auto mb-3">
              <span className="text-3xl"></span>
            </div>
            <h2 className="text-available font-bold text-xl">Space Allocated!</h2>
            <p className="text-slate-400 text-sm mt-1">Head to your assigned spot.</p>
          </div>

          <div className="card">
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="bg-muted rounded-xl py-4 text-center">
                <p className="text-slate-500 text-xs mb-1">Building</p>
                <p className="text-white font-bold text-sm">{result.buildingName}</p>
              </div>
              <div className="bg-muted rounded-xl py-4 text-center">
                <p className="text-slate-500 text-xs mb-1">Floor</p>
                <p className="text-white font-bold text-sm">{result.floorLevel}</p>
              </div>
            </div>

            <div className="bg-accent/10 border border-accent/30 rounded-2xl py-5 text-center mb-4">
              <p className="text-slate-400 text-xs mb-1">Your Allocated Space</p>
              <p className="text-accent font-bold text-4xl tracking-wider">{result.spaceId}</p>
            </div>

            {result.landmarkHint ? (
              <div className="bg-muted rounded-xl px-4 py-3 flex items-start gap-3">
                <span className="text-xl mt-0.5"></span>
                <div>
                  <p className="text-accent text-xs font-semibold mb-0.5">Visual Guide</p>
                  <p className="text-slate-300 text-sm">{result.landmarkHint}</p>
                </div>
              </div>
            ) : (
              <div className="bg-muted rounded-xl px-4 py-3 text-center">
                <p className="text-slate-500 text-xs">Look for signage matching your space number.</p>
              </div>
            )}

            {result.availableSpaces !== undefined && (
              <p className="text-slate-500 text-xs text-center mt-3">
                {result.availableSpaces} space{result.availableSpaces !== 1 ? "s" : ""} still available on this floor
              </p>
            )}
          </div>

          <div className="card bg-accent/5 border border-accent/20 text-center py-3">
            <p className="text-slate-400 text-xs">
               Your session is active. Scan the same floor QR to check out when you leave.
            </p>
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-4 fade-in">
        <div className="card text-center border border-available/30 py-8">
          <span className="text-5xl block mb-3"></span>
          <h2 className="text-available font-bold text-xl">See You Later!</h2>
          <p className="text-slate-400 text-sm mt-1">Space released successfully.</p>
        </div>

        <div className="card">
          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="bg-muted rounded-xl py-3">
              <p className="text-slate-500 text-xs">Space</p>
              <p className="text-accent font-bold mt-1">{result.spaceId}</p>
            </div>
            <div className="bg-muted rounded-xl py-3">
              <p className="text-slate-500 text-xs">Floor</p>
              <p className="text-white font-semibold text-xs mt-1">{result.floorLevel}</p>
            </div>
            <div className="bg-muted rounded-xl py-3">
              <p className="text-slate-500 text-xs">Duration</p>
              <p className="text-white font-bold mt-1">{result.duration}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
