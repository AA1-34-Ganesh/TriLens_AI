import { useEffect, useRef, useCallback, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";

const MODE = { CHOOSE: "choose", CAMERA: "camera", UPLOAD: "upload" };

export default function ScannerView({ onScan, onError, onClose }) {
  const [mode, setMode] = useState(MODE.CHOOSE);
  const [uploadError, setUploadError] = useState("");
  const [dragging, setDragging] = useState(false);
  const [scanning, setScanning] = useState(false);
  const scannerRef = useRef(null);
  const scanningRef = useRef(false);
  const torchOn = useRef(false);
  const fileInputRef = useRef(null);

  const processDecodedText = useCallback((text) => {
    try {
      const data = JSON.parse(text);
      onScan(data);
    } catch {
      onScan({ raw: text });
    }
  }, [onScan]);

  const startCamera = useCallback(async () => {
    if (scanningRef.current) return;
    scanningRef.current = true;
    setScanning(true);
    try {
      const devices = await Html5Qrcode.getCameras();
      if (!devices || devices.length === 0) throw new Error("No camera found on this device");
      const backCam = devices.find(d =>
        d.label.toLowerCase().includes("back") ||
        d.label.toLowerCase().includes("rear") ||
        d.label.toLowerCase().includes("environment")
      );
      const camId = backCam ? backCam.id : devices[devices.length - 1].id;
      const scanner = new Html5Qrcode("qr-reader-el");
      scannerRef.current = scanner;
      await scanner.start(
        camId,
        { fps: 15, qrbox: { width: 260, height: 260 }, aspectRatio: 1.0, disableFlip: false },
        (decodedText) => processDecodedText(decodedText),
        () => {}
      );
    } catch (err) {
      scanningRef.current = false;
      setScanning(false);
      if (onError) onError(err.message);
      setMode(MODE.CHOOSE);
    }
  }, [processDecodedText, onError]);

  useEffect(() => {
    if (mode === MODE.CAMERA) startCamera();
    return () => {
      if (scannerRef.current && scanningRef.current) {
        scannerRef.current.stop().catch(() => {});
        scanningRef.current = false;
      }
    };
  }, [mode, startCamera]);

  const toggleTorch = async () => {
    if (!scannerRef.current) return;
    try {
      const track = scannerRef.current.getRunningTrackCameraCapabilities();
      if (track && track.torchFeature().isSupported()) {
        torchOn.current = !torchOn.current;
        await track.torchFeature().apply(torchOn.current);
      }
    } catch {}
  };

  const scanImageFile = async (file) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setUploadError("Please upload an image file (PNG, JPG, etc.)");
      return;
    }
    setUploadError("");
    setScanning(true);
    const scannerId = "qr-file-scanner-" + Date.now();
    const el = document.createElement("div");
    el.id = scannerId;
    el.style.display = "none";
    document.body.appendChild(el);
    const scanner = new Html5Qrcode(scannerId);
    try {
      const result = await scanner.scanFile(file, false);
      document.body.removeChild(el);
      processDecodedText(result);
    } catch {
      document.body.removeChild(el);
      setScanning(false);
      setUploadError("Could not read QR code from this image. Make sure it is a clear, unblurred QR code image.");
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) scanImageFile(file);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) scanImageFile(file);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setDragging(true);
  };

  const handleDragLeave = () => setDragging(false);

  if (mode === MODE.CHOOSE) {
    return (
      <div className="scan-overlay fade-in">
        <div className="flex items-center justify-between px-4 py-4 bg-black/80">
          <button id="scanner-close-btn" onClick={onClose} className="text-white text-lg font-bold p-2">✕</button>
          <span className="text-white font-semibold text-sm">Choose Scan Method</span>
          <div className="w-10" />
        </div>

        <div className="flex-1 flex flex-col items-center justify-center bg-black px-6 gap-4">
          <div
            id="use-upload-mode-btn"
            onClick={() => setMode(MODE.UPLOAD)}
            className="w-full max-w-sm bg-accent/10 border-2 border-accent/40 rounded-2xl p-5 text-center cursor-pointer active:scale-95 transition-transform hover:border-accent/70"
          >
            <span className="text-4xl block mb-2">🖼️</span>
            <p className="text-white font-bold text-base">Upload QR Image</p>
            <p className="text-slate-400 text-sm mt-1">
              Drag & drop or browse a QR code image file
            </p>
            <span className="inline-block mt-2 bg-accent text-surface text-xs font-bold px-3 py-1 rounded-full">
              Best for Laptop / PC
            </span>
          </div>

          <div
            id="use-camera-mode-btn"
            onClick={() => setMode(MODE.CAMERA)}
            className="w-full max-w-sm bg-muted border border-slate-600 rounded-2xl p-5 text-center cursor-pointer active:scale-95 transition-transform hover:border-slate-400"
          >
            <span className="text-4xl block mb-2">📷</span>
            <p className="text-white font-bold text-base">Use Camera</p>
            <p className="text-slate-400 text-sm mt-1">
              Point your phone or webcam at a QR code
            </p>
          </div>
        </div>

        <div className="px-4 pb-8 bg-black/80">
          <button id="scanner-cancel-btn" onClick={onClose} className="btn-outline">Cancel</button>
        </div>
      </div>
    );
  }

  if (mode === MODE.UPLOAD) {
    return (
      <div className="scan-overlay fade-in">
        <div className="flex items-center justify-between px-4 py-4 bg-black/80">
          <button id="upload-back-btn" onClick={() => setMode(MODE.CHOOSE)} className="text-white text-lg font-bold p-2">←</button>
          <span className="text-white font-semibold text-sm">Upload QR Image</span>
          <div className="w-10" />
        </div>

        <div className="flex-1 flex flex-col items-center justify-center bg-black px-6">
          {scanning ? (
            <div className="text-center">
              <div className="w-14 h-14 border-2 border-accent border-t-transparent rounded-full animate-spin mx-auto mb-4" />
              <p className="text-white font-semibold">Reading QR code...</p>
              <p className="text-slate-400 text-sm mt-1">Please wait</p>
            </div>
          ) : (
            <>
              <div
                id="qr-drop-zone"
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onClick={() => fileInputRef.current?.click()}
                className={`w-full max-w-sm rounded-2xl border-2 border-dashed p-10 text-center cursor-pointer transition-all duration-200 ${
                  dragging
                    ? "border-accent bg-accent/10 scale-105"
                    : "border-slate-600 bg-muted hover:border-accent/60 hover:bg-accent/5"
                }`}
              >
                <span className="text-5xl block mb-3">{dragging ? "📂" : "🖼️"}</span>
                <p className="text-white font-bold text-base">
                  {dragging ? "Drop it here!" : "Drag & Drop QR Image"}
                </p>
                <p className="text-slate-400 text-sm mt-2">or click to browse files</p>
                <p className="text-slate-500 text-xs mt-3">Supports PNG, JPG, WebP</p>
              </div>

              {uploadError && (
                <div className="mt-4 w-full max-w-sm bg-occupied/10 border border-occupied/30 text-occupied px-4 py-3 rounded-xl text-sm text-center">
                  {uploadError}
                </div>
              )}

              <div className="mt-4 w-full max-w-sm bg-muted rounded-xl px-4 py-3">
                <p className="text-slate-400 text-xs text-center">
                  💡 <strong className="text-white">Tip:</strong> Download the Floor QR from Admin panel → save the PNG → upload it here
                </p>
              </div>

              <input
                ref={fileInputRef}
                id="qr-file-input"
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />
            </>
          )}
        </div>

        <div className="px-4 pb-8 bg-black/80">
          <button id="upload-cancel-btn" onClick={onClose} className="btn-outline">Cancel</button>
        </div>
      </div>
    );
  }

  return (
    <div className="scan-overlay fade-in">
      <div className="flex items-center justify-between px-4 py-4 bg-black/80">
        <button id="camera-back-btn" onClick={() => {
          if (scannerRef.current && scanningRef.current) {
            scannerRef.current.stop().catch(() => {});
            scanningRef.current = false;
          }
          setMode(MODE.CHOOSE);
        }} className="text-white text-lg font-bold p-2">←</button>
        <span className="text-white font-semibold text-sm">Scan QR Code</span>
        <button id="scanner-torch-btn" onClick={toggleTorch} className="text-white text-xl p-2">⚡</button>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center bg-black px-4">
        <div id="qr-reader-el" className="w-full max-w-sm rounded-2xl overflow-hidden" />
        <p className="text-slate-400 text-sm mt-6 text-center px-4">
          Align the QR code within the frame. The scan will happen automatically.
        </p>
      </div>

      <div className="px-4 pb-8 bg-black/80">
        <button id="scanner-cancel-btn" onClick={onClose} className="btn-outline">Cancel</button>
      </div>
    </div>
  );
}
