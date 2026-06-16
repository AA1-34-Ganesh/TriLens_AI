import { useState, useEffect } from "react";
import QRCode from "qrcode";

const QR_CONFIG = { width: 240, margin: 2 };

export function QRModal({ title, subtitle, payload, downloadFilename, onClose }) {
  const [dataUrl, setDataUrl] = useState("");

  useEffect(() => {
    QRCode.toDataURL(payload, QR_CONFIG).then(setDataUrl).catch(() => {});
  }, [payload]);

  const handleDownload = () => {
    const a = document.createElement("a");
    a.href = dataUrl;
    a.download = downloadFilename;
    a.click();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <p className="modal-title">{title}</p>
            {subtitle && <p className="text-[#94A3B8] text-xs mt-0.5">{subtitle}</p>}
          </div>
          <button className="btn-ghost btn-sm" onClick={onClose} aria-label="Close">Close</button>
        </div>
        <div className="modal-body items-center">
          {dataUrl ? (
            <div className="qr-frame">
              <img src={dataUrl} alt={title} />
            </div>
          ) : (
            <div className="skeleton w-48 h-48 mx-auto" />
          )}
          <p className="text-[#94A3B8] text-xs text-center">
            Scan to view this location. Download to print.
          </p>
        </div>
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>Close</button>
          <button
            id={`download-qr-${downloadFilename}`}
            className="btn btn-primary"
            onClick={handleDownload}
            disabled={!dataUrl}
          >
            Download
          </button>
        </div>
      </div>
    </div>
  );
}
