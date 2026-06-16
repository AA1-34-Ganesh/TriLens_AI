import { useState, useEffect } from "react";

export default function InstallAppButton({ variant = "primary", className = "" }) {
  const [prompt, setPrompt] = useState(null);
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    const handler = (e) => {
      e.preventDefault();
      setPrompt(e);
    };
    const installedHandler = () => setInstalled(true);
    window.addEventListener("beforeinstallprompt", handler);
    window.addEventListener("appinstalled", installedHandler);
    if (window.matchMedia("(display-mode: standalone)").matches) setInstalled(true);
    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
      window.removeEventListener("appinstalled", installedHandler);
    };
  }, []);

  const handleInstall = async () => {
    if (!prompt) return;
    prompt.prompt();
    const { outcome } = await prompt.userChoice;
    if (outcome === "accepted") {
      setPrompt(null);
      setInstalled(true);
    }
  };

  if (installed || !prompt) return null;

  const base = variant === "primary"
    ? "btn btn-primary"
    : variant === "ghost"
    ? "btn btn-ghost"
    : "btn btn-secondary";

  return (
    <button id="install-app-btn" onClick={handleInstall} className={`${base} ${className}`}>
      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
        <path d="M12 16l-4-4h3V4h2v8h3l-4 4z" />
        <path d="M20 20H4" />
      </svg>
      Install App
    </button>
  );
}
