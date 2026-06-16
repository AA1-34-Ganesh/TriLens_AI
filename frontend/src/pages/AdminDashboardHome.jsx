import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAdminData } from "../hooks/useAdminData";
import api from "../utils/api";

function ActivityDot({ type }) {
  const cls =
    type === "in"
      ? "activity-dot activity-dot--green"
      : type === "out"
      ? "activity-dot activity-dot--red"
      : "activity-dot activity-dot--blue";
  return <span className={cls} />;
}

function SystemHealthRow({ label, value, status }) {
  const color =
    status === "good" ? "text-[#22C55E]" : status === "warn" ? "text-[#F59E0B]" : "text-[#EF4444]";
  return (
    <div className="flex items-center justify-between py-1.5 border-b border-[#334155] last:border-0">
      <span className="text-[#94A3B8] text-xs">{label}</span>
      <span className={`text-xs font-medium ${color}`}>{value}</span>
    </div>
  );
}

function QuickActionBtn({ label, onClick, id }) {
  return (
    <button
      id={id}
      onClick={onClick}
      className="flex flex-col items-center gap-1.5 bg-[#1E293B] border border-[#334155] rounded-lg p-3 hover:border-[#2563EB] hover:bg-[#2563EB]/5 transition-colors w-full"
    >
      <span className="text-[#F8FAFC] text-xs font-medium">{label}</span>
    </button>
  );
}

export default function AdminDashboardHome() {
  const { buildings, blocks, buildingsLoading, loadBuildings, loadBlocks, stats } = useAdminData();
  const navigate = useNavigate();

  useEffect(() => {
    loadBuildings();
    loadBlocks();
  }, [loadBuildings, loadBlocks]);

  const statTiles = [
    { label: "Buildings", value: stats.totalBuildings, mod: "" },
    { label: "Floors", value: stats.totalFloors, mod: "" },
    { label: "Total Spaces", value: stats.totalSpaces, mod: "" },
    { label: "Occupied", value: stats.totalOccupied, mod: "danger" },
    { label: "Available", value: stats.totalAvailable, mod: "success" },
    { label: "Occupancy", value: `${stats.occupancyPercent}%`, mod: stats.occupancyPercent > 80 ? "danger" : "accent" },
  ];

  const modClass = { danger: "stat-tile__danger", success: "stat-tile__success", accent: "stat-tile__accent" };

  const [dbHealth, setDbHealth] = useState("Checking...");
  const [apiHealth, setApiHealth] = useState("Checking...");
  const [latency, setLatency] = useState("Checking...");

  useEffect(() => {
    const start = Date.now();
    api.get("/health").then(() => {
      setDbHealth("Connected");
      setApiHealth("Running");
      setLatency(`${Date.now() - start}ms`);
    }).catch(() => {
      setDbHealth("Disconnected");
      setApiHealth("Error");
      setLatency("Timeout");
    });
  }, []);

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="page-header-row">
        <div className="page-heading">
          <h1 className="page-title">Dashboard</h1>
          <p className="page-subtitle">Live overview of the parking system</p>
        </div>
      </div>

      <div className="stats-row">
        {statTiles.map((t) => (
          <div key={t.label} className="stat-tile">
            <p className={`stat-tile__value ${modClass[t.mod] || ""}`}>{buildingsLoading ? "—" : t.value}</p>
            <p className="stat-tile__label">{t.label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 card">
          <div className="card-header">
            <p className="card-title">Building Summary</p>
          </div>
          {buildingsLoading ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => <div key={i} className="skeleton-line w-full h-8" />)}
            </div>
          ) : buildings.length === 0 ? (
            <p className="text-[#94A3B8] text-sm">No buildings yet.</p>
          ) : (
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr>
                    <th>Building</th>
                    <th>Floors</th>
                    <th>Total</th>
                    <th>Occupied</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {buildings.map((b) => {
                    const occ = b.floors.reduce((s, f) => s + f.occupiedSpaces, 0);
                    const tot = b.floors.reduce((s, f) => s + f.totalSpaces, 0);
                    const pct = tot > 0 ? Math.round((occ / tot) * 100) : 0;
                    return (
                      <tr key={b._id}>
                        <td className="font-medium">{b.buildingName}</td>
                        <td>{b.floors.length}</td>
                        <td>{tot}</td>
                        <td><span className="kv-value--red">{occ}</span></td>
                        <td>
                          <div className="flex items-center gap-2">
                            <div className="progress-track w-16">
                              <div
                                className={`progress-fill ${pct > 80 ? "progress-fill--red" : "progress-fill--green"}`}
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                            <span className="text-[#94A3B8] text-xs">{pct}%</span>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="space-y-4">
          <div className="card">
            <div className="card-header">
              <p className="card-title">System Health</p>
            </div>
            <SystemHealthRow label="Database" value={dbHealth} status={dbHealth === "Connected" ? "good" : "danger"} />
            <SystemHealthRow label="API Server" value={apiHealth} status={apiHealth === "Running" ? "good" : "danger"} />
            <SystemHealthRow label="API Latency" value={latency} status={parseInt(latency) > 500 ? "warn" : latency === "Timeout" ? "danger" : "good"} />
            <SystemHealthRow
              label="Occupancy Load"
              value={`${stats.occupancyPercent}%`}
              status={stats.occupancyPercent > 80 ? "warn" : "good"}
            />
            <SystemHealthRow label="Blocks Active" value={blocks.length} status="good" />
          </div>

          <div className="card">
            <div className="card-header">
              <p className="card-title">Quick Actions</p>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <QuickActionBtn id="qa-add-building" label="Add Building" onClick={() => navigate("/admin/buildings")} />
              <QuickActionBtn id="qa-add-block" label="Add Block" onClick={() => navigate("/admin/blocks")} />
              <QuickActionBtn id="qa-reports" label="View Reports" onClick={() => navigate("/admin/reports")} />
              <QuickActionBtn id="qa-users" label="Manage Users" onClick={() => navigate("/admin/users")} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
