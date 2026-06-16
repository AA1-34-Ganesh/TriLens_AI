export default function FloorAvailability({ buildings, loading }) {
  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="skeleton-card">
            <div className="skeleton-line w-1/3 mb-3" />
            <div className="skeleton-line w-full h-10 mb-2" />
            <div className="skeleton-line w-full h-10" />
          </div>
        ))}
      </div>
    );
  }

  if (!buildings || buildings.length === 0) {
    return (
      <div className="empty-box">
        <p className="empty-title">No parking buildings configured</p>
        <p className="empty-desc">Contact the parking administrator.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {buildings.map((building) => (
        <div key={building._id} className="card">
          <h3 className="text-[#F8FAFC] font-semibold text-sm mb-3">{building.buildingName}</h3>
          <div className="space-y-2">
            {building.floors.length === 0 ? (
              <p className="text-[#94A3B8] text-sm py-2">No floors configured.</p>
            ) : (
              building.floors.map((floor) => {
                const isFull = floor.availableSpaces === 0;
                const fillPct =
                  floor.totalSpaces > 0
                    ? Math.round((floor.occupiedSpaces / floor.totalSpaces) * 100)
                    : 0;

                return (
                  <div
                    key={floor.floorLevel}
                    className={`rounded-md px-3 py-2.5 border transition-colors ${
                      isFull
                        ? "border-[#EF4444]/30 bg-[#EF4444]/5"
                        : "border-[#22C55E]/20 bg-[#22C55E]/5"
                    }`}
                  >
                    <div className="flex justify-between items-center">
                      <span className="text-[#F8FAFC] font-medium text-sm">{floor.floorLevel}</span>
                      <span className={`text-sm font-semibold ${isFull ? "text-[#EF4444]" : "text-[#22C55E]"}`}>
                        {isFull ? "FULL" : `${floor.availableSpaces} Left`}
                      </span>
                    </div>
                    <div className="progress-track mt-2">
                      <div
                        className={`progress-fill ${
                          isFull
                            ? "progress-fill--red"
                            : fillPct > 70
                            ? "bg-[#F59E0B]"
                            : "progress-fill--green"
                        }`}
                        style={{ width: `${fillPct}%` }}
                      />
                    </div>
                    <div className="flex justify-between mt-1">
                      <span className="text-[#94A3B8] text-xs">
                        {floor.occupiedSpaces}/{floor.totalSpaces} occupied
                      </span>
                      <span className="text-[#94A3B8] text-xs">{fillPct}%</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
