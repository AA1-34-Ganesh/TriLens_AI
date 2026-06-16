export default function AIHintCard({ hint, imageDataUrl, spaceId, buildingName, floorLevel }) {
  return (
    <div className="card border border-accent/30 slide-up">
      <div className="flex items-start gap-3 mb-4">
        <div className="w-10 h-10 rounded-xl bg-accent/20 flex items-center justify-center shrink-0">
          <span className="text-xl">🤖</span>
        </div>
        <div>
          <h3 className="text-white font-bold text-sm">AI Landmark Hint</h3>
          <p className="text-slate-400 text-xs">Edge AI-generated retrieval guide</p>
        </div>
      </div>

      {imageDataUrl && (
        <div className="mb-4 rounded-xl overflow-hidden border border-slate-700/50">
          <img
            src={imageDataUrl}
            alt="AI context capture"
            className="w-full object-cover max-h-48"
          />
          <div className="bg-muted/60 px-3 py-1.5">
            <p className="text-slate-500 text-xs">📷 Context image (stored locally)</p>
          </div>
        </div>
      )}

      <div className="bg-accent/10 border border-accent/20 rounded-xl px-4 py-3 mb-4">
        <p className="text-accent text-sm font-medium leading-relaxed">{hint}</p>
      </div>

      <div className="grid grid-cols-3 gap-2 text-center">
        {buildingName && (
          <div className="bg-muted rounded-xl py-2 px-1">
            <p className="text-xs text-slate-500">Building</p>
            <p className="text-white text-xs font-semibold truncate mt-0.5">{buildingName}</p>
          </div>
        )}
        {floorLevel && (
          <div className="bg-muted rounded-xl py-2 px-1">
            <p className="text-xs text-slate-500">Floor</p>
            <p className="text-white text-xs font-semibold truncate mt-0.5">{floorLevel}</p>
          </div>
        )}
        {spaceId && (
          <div className="bg-muted rounded-xl py-2 px-1">
            <p className="text-xs text-slate-500">Spot</p>
            <p className="text-accent text-xs font-bold mt-0.5">{spaceId}</p>
          </div>
        )}
      </div>
    </div>
  );
}
