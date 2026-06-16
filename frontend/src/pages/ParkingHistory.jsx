import { useState, useEffect } from "react";
import api from "../utils/api";
import Header from "../components/Header";

function formatDuration(inTs, outTs) {
  if (!outTs) return "Ongoing";
  const ms = new Date(outTs) - new Date(inTs);
  const mins = Math.floor(ms / 60000);
  const hrs = Math.floor(mins / 60);
  return hrs > 0 ? `${hrs}h ${mins % 60}m` : `${mins}m`;
}

export default function ParkingHistory() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);
  const perPage = 10;

  useEffect(() => {
    api.get("/parking/history")
      .then(r => setLogs(r.data || []))
      .catch(() => setLogs([]))
      .finally(() => setLoading(false));
  }, []);

  const filtered = logs.filter(l => {
    const matchSearch = !search || [l.spaceId, l.buildingName, l.floorLevel, l.vehicleNumber]
      .some(v => v?.toLowerCase().includes(search.toLowerCase()));
    const matchStatus = !statusFilter || l.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const totalPages = Math.ceil(filtered.length / perPage);
  const paginated = filtered.slice((page - 1) * perPage, page * perPage);

  const stats = {
    total: logs.length,
    completed: logs.filter(l => l.status === "completed").length,
    active: logs.filter(l => l.status === "active").length,
    totalTime: logs.filter(l => l.status === "completed").reduce((sum, l) => {
      return sum + Math.floor((new Date(l.timestampOut) - new Date(l.timestampIn)) / 60000);
    }, 0)
  };

  return (
    <div className="max-w-4xl mx-auto space-y-5">
      <Header />

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Total Sessions", value: stats.total },
          { label: "Completed", value: stats.completed },
          { label: "Active", value: stats.active },
          { label: "Total Time (min)", value: stats.totalTime }
        ].map(t => (
          <div key={t.label} className="stat-tile">
            <p className="stat-tile__value">{loading ? "—" : t.value}</p>
            <p className="stat-tile__label">{t.label}</p>
          </div>
        ))}
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <input id="history-search" className="search-box flex-1" type="search"
          placeholder="Search by space, building, vehicle..." value={search}
          onChange={e => { setSearch(e.target.value); setPage(1); }} />
        <select id="history-status-filter" className="form-select w-full sm:w-40"
          value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }}>
          <option value="">All Statuses</option>
          <option value="active">Active</option>
          <option value="completed">Completed</option>
          <option value="pending">Pending</option>
        </select>
      </div>

      <div className="card p-0 overflow-hidden">
        {loading ? (
          <div className="space-y-2 p-4">
            {[1, 2, 3].map(i => <div key={i} className="skeleton-line w-full h-10" />)}
          </div>
        ) : paginated.length === 0 ? (
          <div className="empty-box">
            <p className="empty-title">{search || statusFilter ? "No matching sessions" : "No Parking History"}</p>
            <p className="empty-desc">{search || statusFilter ? "Try clearing the filters." : "Park your vehicle to see history here."}</p>
          </div>
        ) : (
          <div className="table-wrap border-0">
            <table className="table" aria-label="Parking history table">
              <thead>
                <tr>
                  <th>Space</th>
                  <th>Location</th>
                  <th>Vehicle</th>
                  <th>Date</th>
                  <th>Duration</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {paginated.map(log => (
                  <tr key={log._id}>
                    <td><span className="text-[#2563EB] font-bold">{log.spaceId}</span></td>
                    <td className="text-[#94A3B8] text-xs">{log.buildingName}<br />{log.floorLevel}</td>
                    <td className="font-medium text-xs">{log.vehicleNumber}</td>
                    <td className="text-[#94A3B8] text-xs">
                      {new Date(log.timestampIn).toLocaleDateString()}<br />
                      {new Date(log.timestampIn).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </td>
                    <td className="text-[#94A3B8] text-sm">{formatDuration(log.timestampIn, log.timestampOut)}</td>
                    <td>
                      <span className={`badge ${log.status === "active" ? "badge-green" : log.status === "completed" ? "badge-slate" : "badge-amber"}`}>
                        {log.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-[#94A3B8] text-xs">{filtered.length} sessions · Page {page} of {totalPages}</p>
          <div className="flex gap-2">
            <button className="btn btn-ghost btn-sm" disabled={page === 1} onClick={() => setPage(p => p - 1)}>
              Previous
            </button>
            <button className="btn btn-ghost btn-sm" disabled={page === totalPages} onClick={() => setPage(p => p + 1)}>
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
