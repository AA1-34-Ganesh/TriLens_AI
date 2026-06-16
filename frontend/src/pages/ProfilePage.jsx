import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import api from "../utils/api";
import Header from "../components/Header";

export default function ProfilePage() {
  const { user, setUser } = useAuth();
  const [form, setForm] = useState({ name: "", mobileNumber: "", vehicleNumber: "", department: "" });
  const [pwForm, setPwForm] = useState({ currentPassword: "", newPassword: "", confirm: "" });
  const [history, setHistory] = useState([]);
  const [saving, setSaving] = useState(false);
  const [changingPw, setChangingPw] = useState(false);
  const [msg, setMsg] = useState({ type: "", text: "" });
  const [pwMsg, setPwMsg] = useState({ type: "", text: "" });
  const [tab, setTab] = useState("profile");

  useEffect(() => {
    if (user) {
      setForm({
        name: user.name || "",
        mobileNumber: user.mobileNumber || "",
        vehicleNumber: user.vehicleNumber || "",
        department: user.department || ""
      });
    }
    api.get("/parking/history").then(r => setHistory(r.data || [])).catch(() => {});
  }, [user]);

  const saveProfile = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMsg({ type: "", text: "" });
    try {
      const res = await api.put("/auth/profile", form);
      setUser(res.data);
      setMsg({ type: "success", text: "Profile updated successfully" });
    } catch (err) {
      setMsg({ type: "error", text: err.response?.data?.message || "Update failed" });
    } finally {
      setSaving(false);
    }
  };

  const changePassword = async (e) => {
    e.preventDefault();
    if (pwForm.newPassword !== pwForm.confirm) {
      setPwMsg({ type: "error", text: "Passwords do not match" });
      return;
    }
    if (pwForm.newPassword.length < 6) {
      setPwMsg({ type: "error", text: "Password must be at least 6 characters" });
      return;
    }
    setChangingPw(true);
    setPwMsg({ type: "", text: "" });
    try {
      await api.put("/auth/profile", { currentPassword: pwForm.currentPassword, newPassword: pwForm.newPassword });
      setPwMsg({ type: "success", text: "Password changed successfully" });
      setPwForm({ currentPassword: "", newPassword: "", confirm: "" });
    } catch (err) {
      setPwMsg({ type: "error", text: err.response?.data?.message || "Password change failed" });
    } finally {
      setChangingPw(false);
    }
  };

  const stats = {
    total: history.length,
    completed: history.filter(l => l.status === "completed").length,
    active: history.filter(l => l.status === "active").length
  };

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      <Header />

      <div className="card flex items-center gap-4">
        <div className="w-14 h-14 rounded-full bg-[#2563EB] flex items-center justify-center text-white text-xl font-bold shrink-0">
          {user?.name?.charAt(0)?.toUpperCase() || "?"}
        </div>
        <div className="min-w-0">
          <p className="text-[#F8FAFC] font-semibold">{user?.name}</p>
          <p className="text-[#94A3B8] text-sm">{user?.studentId}</p>
          <span className={`badge mt-1 ${user?.role === "admin" ? "badge-blue" : user?.role === "blockAdmin" ? "badge-amber" : "badge-green"}`}>
            {user?.role}
          </span>
        </div>
        <div className="ml-auto grid grid-cols-3 gap-4 text-center shrink-0">
          {[["Total", stats.total], ["Done", stats.completed], ["Active", stats.active]].map(([l, v]) => (
            <div key={l}>
              <p className="text-[#F8FAFC] font-bold text-lg">{v}</p>
              <p className="text-[#94A3B8] text-xs">{l}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="tab-bar">
        {[{ key: "profile", label: "Profile" }, { key: "security", label: "Security" }, { key: "history", label: "History" }].map(t => (
          <button key={t.key} id={`profile-tab-${t.key}`}
            className={`tab-btn ${tab === t.key ? "tab-btn--active" : "tab-btn--inactive"}`}
            onClick={() => setTab(t.key)}>
            {t.label}
          </button>
        ))}
      </div>

      {tab === "profile" && (
        <form className="card space-y-4" onSubmit={saveProfile}>
          <p className="card-title">Personal Information</p>
          {msg.text && (
            <div className={msg.type === "success" ? "alert alert-success" : "alert alert-error"} role="alert">{msg.text}</div>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="form-group">
              <label className="form-label" htmlFor="profile-name">Full Name</label>
              <input id="profile-name" className="form-input" value={form.name}
                onChange={e => setForm({ ...form, name: e.target.value })} required />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="profile-mobile">Mobile Number</label>
              <input id="profile-mobile" className="form-input" value={form.mobileNumber}
                onChange={e => setForm({ ...form, mobileNumber: e.target.value })}
                placeholder="e.g. 9876543210" />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="profile-vehicle">Vehicle Number</label>
              <input id="profile-vehicle" className="form-input uppercase" value={form.vehicleNumber}
                onChange={e => setForm({ ...form, vehicleNumber: e.target.value.toUpperCase() })} required />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="profile-dept">Department</label>
              <input id="profile-dept" className="form-input" value={form.department}
                onChange={e => setForm({ ...form, department: e.target.value })} required />
            </div>
          </div>
          <div className="flex justify-end">
            <button id="save-profile-btn" type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      )}

      {tab === "security" && (
        <form className="card space-y-4" onSubmit={changePassword}>
          <p className="card-title">Change Password</p>
          {pwMsg.text && (
            <div className={pwMsg.type === "success" ? "alert alert-success" : "alert alert-error"} role="alert">{pwMsg.text}</div>
          )}
          <div className="form-group">
            <label className="form-label" htmlFor="current-pw">Current Password</label>
            <input id="current-pw" type="password" className="form-input" value={pwForm.currentPassword}
              onChange={e => setPwForm({ ...pwForm, currentPassword: e.target.value })} required />
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="new-pw">New Password</label>
            <input id="new-pw" type="password" className="form-input" value={pwForm.newPassword}
              onChange={e => setPwForm({ ...pwForm, newPassword: e.target.value })} required minLength={6} />
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="confirm-pw">Confirm New Password</label>
            <input id="confirm-pw" type="password" className="form-input" value={pwForm.confirm}
              onChange={e => setPwForm({ ...pwForm, confirm: e.target.value })} required />
          </div>
          <div className="flex justify-end">
            <button id="change-pw-btn" type="submit" className="btn btn-primary" disabled={changingPw}>
              {changingPw ? "Updating..." : "Update Password"}
            </button>
          </div>
        </form>
      )}

      {tab === "history" && (
        <div className="card">
          <p className="card-title mb-4">Parking History</p>
          {history.length === 0 ? (
            <div className="empty-box">
              <p className="empty-title">No Parking Sessions</p>
              <p className="empty-desc">Your parking history will appear here.</p>
            </div>
          ) : (
            <div className="table-wrap">
              <table className="table" aria-label="Parking history">
                <thead>
                  <tr>
                    <th>Space</th>
                    <th>Building</th>
                    <th>Date</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {history.map(log => (
                    <tr key={log._id}>
                      <td className="font-semibold text-[#2563EB]">{log.spaceId}</td>
                      <td className="text-[#94A3B8]">{log.buildingName} · {log.floorLevel}</td>
                      <td className="text-[#94A3B8] text-xs">{new Date(log.timestampIn).toLocaleDateString()}</td>
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
      )}
    </div>
  );
}
