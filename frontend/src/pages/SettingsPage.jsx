import InstallAppButton from "../components/InstallAppButton";

export default function SettingsPage() {
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="page-header-row">
        <div className="page-heading">
          <h1 className="page-title">Settings</h1>
          <p className="page-subtitle">Configure system preferences and app settings</p>
        </div>
      </div>
      
      <div className="card space-y-4">
        <h2 className="text-[#F8FAFC] font-semibold text-sm">App Installation</h2>
        <p className="text-[#94A3B8] text-xs">
          Install ParkSys as a Progressive Web App (PWA) on your device for quick access, offline capabilities, and a native app-like experience.
        </p>
        <InstallAppButton variant="primary" />
      </div>

      <div className="card space-y-4">
        <h2 className="text-[#F8FAFC] font-semibold text-sm">Preferences</h2>
        <p className="text-[#94A3B8] text-xs">Theme and notification settings coming soon.</p>
      </div>
    </div>
  );
}
