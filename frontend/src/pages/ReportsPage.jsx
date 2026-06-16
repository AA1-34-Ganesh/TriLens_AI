import { useState, useEffect } from "react";
import { fetchBuildings } from "../services/adminService";

export default function ReportsPage() {
  const [buildings, setBuildings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState("7days");
  const [reportType, setReportType] = useState("daily");

  useEffect(() => {
    fetchBuildings()
      .then(setBuildings)
      .catch(() => setBuildings([]))
      .finally(() => setLoading(false));
  }, []);

  const rows = buildings.flatMap((b) =>
    b.floors.map((f) => ({
      building: b.buildingName,
      floor: f.floorLevel,
      total: f.totalSpaces,
      occupied: f.occupiedSpaces,
      available: f.totalSpaces - f.occupiedSpaces,
      pct: f.totalSpaces > 0 ? Math.round((f.occupiedSpaces / f.totalSpaces) * 100) : 0,
    }))
  );

  const totalSpaces = buildings.reduce((s, b) => s + b.floors.reduce((fs, f) => fs + f.totalSpaces, 0), 0);
  const totalOccupied = buildings.reduce((s, b) => s + b.floors.reduce((fs, f) => fs + f.occupiedSpaces, 0), 0);
  const overallPct = totalSpaces > 0 ? Math.round((totalOccupied / totalSpaces) * 100) : 0;

  const summaryTiles = [
    { label: "Overall Occupancy", value: `${overallPct}%` },
    { label: "Total Spaces", value: totalSpaces },
    { label: "Occupied", value: totalOccupied },
    { label: "Available", value: totalSpaces - totalOccupied },
  ];

  const handleExportCSV = () => {
    const header = "Building,Floor,Total Spaces,Occupied,Available,Usage %\n";
    const csv = rows.map(r => `${r.building},${r.floor},${r.total},${r.occupied},${r.available},${r.pct}%`).join("\n");
    const blob = new Blob([header + csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `ParkSys_Report_${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
  };

  const handleExportPDF = () => {
    window.print();
  };

  // Mock data for utilization trend
  const trendData = {
    daily: [45, 52, 38, 65, 72, 85, 60],
    weekly: [40, 50, 45, 60],
    monthly: [30, 45, 60, 55, 70, 80],
  };

  const activeTrend = trendData[reportType];
  const maxTrend = Math.max(...activeTrend, 100);

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="page-header-row flex-col sm:flex-row items-start sm:items-center">
        <div className="page-heading">
          <h1 className="page-title">Reports & Analytics</h1>
          <p className="page-subtitle">System-wide occupancy analytics and historical trends</p>
        </div>
        <div className="flex gap-2 mt-4 sm:mt-0">
          <button className="btn btn-secondary btn-sm" onClick={handleExportCSV}>Export CSV</button>
          <button className="btn btn-primary btn-sm" onClick={handleExportPDF}>Export PDF</button>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between bg-[#1E293B] p-3 rounded-xl border border-[#334155]">
        <div className="flex gap-2 w-full sm:w-auto">
          <button className={`btn-sm ${reportType === 'daily' ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setReportType('daily')}>Daily</button>
          <button className={`btn-sm ${reportType === 'weekly' ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setReportType('weekly')}>Weekly</button>
          <button className={`btn-sm ${reportType === 'monthly' ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setReportType('monthly')}>Monthly</button>
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <span className="text-[#94A3B8] text-xs">Date Range:</span>
          <select className="form-select w-full sm:w-40" value={dateRange} onChange={e => setDateRange(e.target.value)}>
            <option value="7days">Last 7 Days</option>
            <option value="30days">Last 30 Days</option>
            <option value="thisMonth">This Month</option>
            <option value="custom">Custom Range...</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {summaryTiles.map((t) => (
          <div key={t.label} className="stat-tile">
            <p className="stat-tile__value">{loading ? "—" : t.value}</p>
            <p className="stat-tile__label">{t.label}</p>
          </div>
        ))}
      </div>

      {loading ? (
        <div className="space-y-4">
          <div className="skeleton-line w-full h-48" />
          <div className="skeleton-line w-full h-64" />
        </div>
      ) : rows.length === 0 ? (
        <div className="empty-box">
          <p className="empty-title">No data available</p>
          <p className="empty-desc">Add buildings and floors to generate reports.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="card">
              <p className="card-title mb-4">Utilization Trend ({reportType.charAt(0).toUpperCase() + reportType.slice(1)})</p>
              <div className="h-48 flex items-end gap-2 mt-4">
                {activeTrend.map((val, idx) => (
                  <div key={idx} className="flex-1 flex flex-col items-center gap-2 group">
                    <div 
                      className="w-full bg-[#2563EB]/80 group-hover:bg-[#3B82F6] rounded-t-sm transition-all relative"
                      style={{ height: `${(val / maxTrend) * 100}%` }}
                    >
                      <span className="opacity-0 group-hover:opacity-100 absolute -top-6 left-1/2 -translate-x-1/2 text-[10px] bg-[#0F172A] text-white px-1.5 py-0.5 rounded">{val}%</span>
                    </div>
                    <span className="text-[#94A3B8] text-[10px]">{reportType === 'daily' ? ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'][idx] : `P${idx+1}`}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="card">
              <div className="card-header">
                <p className="card-title">Detailed Floor Occupancy</p>
              </div>
              <div className="table-wrap border-0">
                <table className="table" aria-label="Floor occupancy report">
                  <thead>
                    <tr>
                      <th>Building</th>
                      <th>Floor</th>
                      <th>Total</th>
                      <th>Occupied</th>
                      <th>Available</th>
                      <th>Usage</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((row, i) => (
                      <tr key={i}>
                        <td className="font-medium">{row.building}</td>
                        <td>{row.floor}</td>
                        <td>{row.total}</td>
                        <td><span className="text-[#EF4444] font-medium">{row.occupied}</span></td>
                        <td><span className="text-[#22C55E] font-medium">{row.available}</span></td>
                        <td>
                          <div className="flex items-center gap-2">
                            <div className="progress-track w-24">
                              <div
                                className={`progress-fill ${row.pct > 80 ? "progress-fill--red" : row.pct > 30 ? "bg-[#F59E0B]" : "progress-fill--green"}`}
                                style={{ width: `${row.pct}%` }}
                              />
                            </div>
                            <span className="text-[#94A3B8] text-xs w-8">{row.pct}%</span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <div className="lg:col-span-1 space-y-6">
            <div className="card">
              <p className="card-title mb-4">Building Usage Chart</p>
              <div className="space-y-5 mt-2">
                {buildings.map(b => {
                  const bTot = b.floors.reduce((s, f) => s + f.totalSpaces, 0);
                  const bOcc = b.floors.reduce((s, f) => s + f.occupiedSpaces, 0);
                  const bPct = bTot > 0 ? Math.round((bOcc / bTot) * 100) : 0;
                  return (
                    <div key={b.buildingName}>
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-[#F8FAFC] text-sm font-medium">{b.buildingName}</span>
                        <span className="text-[#94A3B8] text-xs">{bOcc} / {bTot} ({bPct}%)</span>
                      </div>
                      <div className="progress-track h-2">
                        <div className={`progress-fill ${bPct > 80 ? "progress-fill--red" : "progress-fill--blue"}`} style={{ width: `${bPct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
            
            <div className="card">
              <p className="card-title mb-4">System Capacity</p>
              <div className="flex items-center justify-center">
                <div className="relative w-40 h-40 flex items-center justify-center rounded-full" 
                     style={{ background: `conic-gradient(#2563EB ${overallPct}%, #1E293B ${overallPct}%)` }}>
                  <div className="absolute inset-2 bg-[#0F172A] rounded-full flex flex-col items-center justify-center">
                    <span className="text-[#F8FAFC] text-3xl font-bold">{overallPct}%</span>
                    <span className="text-[#94A3B8] text-[10px] uppercase tracking-wide">Occupied</span>
                  </div>
                </div>
              </div>
              <div className="flex justify-center gap-6 mt-6">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-sm bg-[#2563EB]"></span>
                  <span className="text-[#94A3B8] text-xs">Occupied</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-sm bg-[#1E293B]"></span>
                  <span className="text-[#94A3B8] text-xs">Free</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
