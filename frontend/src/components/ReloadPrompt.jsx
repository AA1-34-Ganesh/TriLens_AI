import { useRegisterSW } from 'virtual:pwa-register/react';

export default function ReloadPrompt() {
  const {
    offlineReady: [offlineReady, setOfflineReady],
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegistered(r) {
      console.log('SW Registered: ' + r);
    },
    onRegisterError(error) {
      console.log('SW registration error', error);
    },
  });

  const close = () => {
    setOfflineReady(false);
    setNeedRefresh(false);
  };

  if (!offlineReady && !needRefresh) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 bg-[#1E293B] border border-[#334155] rounded-xl shadow-lg p-4 max-w-sm w-[calc(100%-2rem)]">
      <div className="flex flex-col gap-3">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-full bg-[#2563EB]/20 flex items-center justify-center shrink-0">
            <span className="text-[#3B82F6] text-sm">💡</span>
          </div>
          <div>
            <p className="text-[#F8FAFC] text-sm font-medium">
              {offlineReady ? "App ready to work offline" : "New content available"}
            </p>
            <p className="text-[#94A3B8] text-xs mt-1">
              {offlineReady 
                ? "You can now use ParkSys without an internet connection." 
                : "A new version of ParkSys is available. Click reload to update."}
            </p>
          </div>
        </div>
        <div className="flex gap-2 justify-end mt-2">
          <button className="btn btn-secondary btn-sm" onClick={close}>Close</button>
          {needRefresh && (
            <button className="btn btn-primary btn-sm" onClick={() => updateServiceWorker(true)}>Reload</button>
          )}
        </div>
      </div>
    </div>
  );
}
