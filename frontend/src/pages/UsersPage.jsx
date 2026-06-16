import { useState, useEffect, useCallback } from "react";
import api from "../utils/api";

export default function UsersPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalUsers, setTotalUsers] = useState(0);
  const [editUser, setEditUser] = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  const [newUser, setNewUser] = useState({ name: "", studentId: "", password: "", department: "", vehicleNumber: "", mobileNumber: "", role: "student", assignedBlock: "" });
  const [blocks, setBlocks] = useState([]);
  
  useEffect(() => {
    api.get("/blocks").then(r => setBlocks(r.data)).catch(() => {});
  }, []);

  const fetchUsers = useCallback(() => {
    setLoading(true);
    const query = new URLSearchParams({ page, search, role: roleFilter });
    api.get(`/users?${query}`)
      .then(res => {
        setUsers(res.data.users);
        setTotalPages(res.data.pages);
        setTotalUsers(res.data.total);
      })
      .catch(() => setUsers([]))
      .finally(() => setLoading(false));
  }, [page, search, roleFilter]);

  useEffect(() => {
    const timer = setTimeout(fetchUsers, 300);
    return () => clearTimeout(timer);
  }, [fetchUsers]);

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      await api.put(`/users/${editUser._id}`, editUser);
      setEditUser(null);
      fetchUsers();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to update user");
    }
  };

  const handleResetPassword = async (id) => {
    const newPassword = prompt("Enter new password (min 6 characters):");
    if (!newPassword) return;
    if (newPassword.length < 6) return alert("Password too short");
    try {
      await api.post(`/users/${id}/reset-password`, { newPassword });
      alert("Password reset successfully");
    } catch (err) {
      alert(err.response?.data?.message || "Failed to reset password");
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Are you sure you want to delete this user? This action cannot be undone.")) return;
    try {
      await api.delete(`/users/${id}`);
      fetchUsers();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to delete user");
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (newUser.password.length < 6) return alert("Password must be at least 6 characters");
    try {
      await api.post("/users", newUser);
      setShowCreate(false);
      setNewUser({ name: "", studentId: "", password: "", department: "", vehicleNumber: "", mobileNumber: "", role: "student", assignedBlock: "" });
      fetchUsers();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to create user");
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-5">
      <div className="page-header-row">
        <div className="page-heading">
          <h1 className="page-title">Users</h1>
          <p className="page-subtitle">Manage system users, roles, and access</p>
        </div>
        <div className="page-actions">
          <button className="btn btn-primary" onClick={() => setShowCreate(true)}>Create User</button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
        <div className="stat-tile">
          <p className="stat-tile__value">{totalUsers}</p>
          <p className="stat-tile__label">Total Users</p>
        </div>
        <div className="stat-tile">
          <p className="stat-tile__value">{users.filter(u => u.role === "student").length}</p>
          <p className="stat-tile__label">Students</p>
        </div>
        <div className="stat-tile">
          <p className="stat-tile__value">{users.filter(u => u.role === "blockAdmin").length}</p>
          <p className="stat-tile__label">Block Admins</p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <input className="search-box flex-1" type="search" placeholder="Search name, ID, department..." 
          value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} />
        <select className="form-select w-full sm:w-48" value={roleFilter} 
          onChange={e => { setRoleFilter(e.target.value); setPage(1); }}>
          <option value="">All Roles</option>
          <option value="student">Student</option>
          <option value="blockAdmin">Block Admin</option>
          <option value="admin">Super Admin</option>
        </select>
      </div>

      <div className="card p-0 overflow-hidden">
        {loading ? (
          <div className="space-y-2 p-4">
            {[1, 2, 3].map(i => <div key={i} className="skeleton-line w-full h-12" />)}
          </div>
        ) : users.length === 0 ? (
          <div className="empty-box">
            <p className="empty-title">No Users Found</p>
            <p className="empty-desc">Try adjusting your search or filters.</p>
          </div>
        ) : (
          <div className="table-wrap border-0">
            <table className="table" aria-label="User management">
              <thead>
                <tr>
                  <th>User</th>
                  <th>ID / Dept</th>
                  <th>Role</th>
                  <th>Vehicle</th>
                  <th>Status</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map(u => (
                  <tr key={u._id}>
                    <td>
                      <p className="font-semibold text-[#F8FAFC] text-sm">{u.name}</p>
                      <p className="text-[#94A3B8] text-[10px]">{u.mobileNumber || "No mobile"}</p>
                    </td>
                    <td>
                      <p className="font-mono text-xs">{u.studentId}</p>
                      <p className="text-[#94A3B8] text-[10px]">{u.department}</p>
                    </td>
                    <td>
                      <span className={`badge ${u.role === "admin" ? "badge-blue" : u.role === "blockAdmin" ? "badge-amber" : "badge-green"}`}>
                        {u.role}
                      </span>
                      {u.role === "blockAdmin" && u.assignedBlock && (
                        <p className="text-[#94A3B8] text-[10px] mt-0.5">Block {u.assignedBlock}</p>
                      )}
                    </td>
                    <td><span className="font-mono text-xs">{u.vehicleNumber}</span></td>
                    <td>
                      {u.isActive ? (
                        <span className="text-[#22C55E] text-xs font-medium flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-[#22C55E]" /> Active</span>
                      ) : (
                        <span className="text-[#EF4444] text-xs font-medium flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-[#EF4444]" /> Inactive</span>
                      )}
                    </td>
                    <td>
                      <div className="flex items-center justify-end gap-2">
                        <button className="btn-ghost btn-sm" onClick={() => setEditUser(u)}>Edit</button>
                        <button className="btn-ghost btn-sm" onClick={() => handleResetPassword(u._id)}>Reset Pw</button>
                        <button className="btn-ghost btn-sm text-[#EF4444] hover:text-[#EF4444]" onClick={() => handleDelete(u._id)}>Del</button>
                      </div>
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
          <p className="text-[#94A3B8] text-xs">{totalUsers} users · Page {page} of {totalPages}</p>
          <div className="flex gap-2">
            <button className="btn btn-ghost btn-sm" disabled={page === 1} onClick={() => setPage(p => p - 1)}>Prev</button>
            <button className="btn btn-ghost btn-sm" disabled={page === totalPages} onClick={() => setPage(p => p + 1)}>Next</button>
          </div>
        </div>
      )}

      {editUser && (
        <div className="modal-overlay">
          <div className="modal-box">
            <div className="modal-header">
              <p className="modal-title">Edit User: {editUser.name}</p>
            </div>
            <form onSubmit={handleUpdate}>
              <div className="modal-body">
                <div className="grid grid-cols-2 gap-3">
                  <div className="form-group">
                    <label className="form-label">Full Name</label>
                    <input className="form-input" value={editUser.name} onChange={e => setEditUser({...editUser, name: e.target.value})} required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Mobile Number</label>
                    <input className="form-input" value={editUser.mobileNumber} onChange={e => setEditUser({...editUser, mobileNumber: e.target.value})} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Vehicle Number</label>
                    <input className="form-input uppercase" value={editUser.vehicleNumber} onChange={e => setEditUser({...editUser, vehicleNumber: e.target.value.toUpperCase()})} required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Department</label>
                    <input className="form-input" value={editUser.department} onChange={e => setEditUser({...editUser, department: e.target.value})} required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Role</label>
                    <select className="form-select" value={editUser.role} onChange={e => setEditUser({...editUser, role: e.target.value})}>
                      <option value="student">Student</option>
                      <option value="blockAdmin">Block Admin</option>
                      <option value="admin">Super Admin</option>
                    </select>
                  </div>
                  {editUser.role === "blockAdmin" && (
                    <div className="form-group">
                      <label className="form-label">Assigned Block</label>
                      <select className="form-select" value={editUser.assignedBlock || ""} onChange={e => setEditUser({...editUser, assignedBlock: e.target.value})}>
                        <option value="">None</option>
                        {blocks.map(b => <option key={b.blockId} value={b.blockId}>Block {b.blockId}</option>)}
                      </select>
                    </div>
                  )}
                </div>
                <div className="form-group mt-3 flex flex-row items-center gap-2">
                  <input type="checkbox" id="isActive" checked={editUser.isActive} onChange={e => setEditUser({...editUser, isActive: e.target.checked})} className="w-4 h-4 accent-[#2563EB]" />
                  <label htmlFor="isActive" className="form-label cursor-pointer mb-0">Account Active</label>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setEditUser(null)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showCreate && (
        <div className="modal-overlay">
          <div className="modal-box">
            <div className="modal-header">
              <p className="modal-title">Create New User</p>
            </div>
            <form onSubmit={handleCreate}>
              <div className="modal-body">
                <div className="grid grid-cols-2 gap-3">
                  <div className="form-group">
                    <label className="form-label">Student / User ID *</label>
                    <input className="form-input" value={newUser.studentId} onChange={e => setNewUser({...newUser, studentId: e.target.value})} required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Full Name *</label>
                    <input className="form-input" value={newUser.name} onChange={e => setNewUser({...newUser, name: e.target.value})} required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Password *</label>
                    <input type="password" placeholder="Min. 6 chars" className="form-input" value={newUser.password} onChange={e => setNewUser({...newUser, password: e.target.value})} required minLength={6} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Department</label>
                    <input className="form-input" value={newUser.department} onChange={e => setNewUser({...newUser, department: e.target.value})} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Vehicle Number</label>
                    <input className="form-input uppercase" value={newUser.vehicleNumber} onChange={e => setNewUser({...newUser, vehicleNumber: e.target.value.toUpperCase()})} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Mobile Number</label>
                    <input className="form-input" value={newUser.mobileNumber} onChange={e => setNewUser({...newUser, mobileNumber: e.target.value})} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Role</label>
                    <select className="form-select" value={newUser.role} onChange={e => setNewUser({...newUser, role: e.target.value})}>
                      <option value="student">Student</option>
                      <option value="blockAdmin">Block Admin</option>
                      <option value="admin">Super Admin</option>
                    </select>
                  </div>
                  {newUser.role === "blockAdmin" && (
                    <div className="form-group">
                      <label className="form-label">Assigned Block</label>
                      <select className="form-select" value={newUser.assignedBlock} onChange={e => setNewUser({...newUser, assignedBlock: e.target.value})} required>
                        <option value="">Select Block</option>
                        {blocks.map(b => <option key={b.blockId} value={b.blockId}>Block {b.blockId}</option>)}
                      </select>
                    </div>
                  )}
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowCreate(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Create User</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
