import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function EyeIcon({ visible }) {
  if (visible) {
    return (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
        <circle cx="12" cy="12" r="3" />
      </svg>
    );
  }
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
      <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  );
}

function SpinnerIcon() {
  return (
    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  );
}

const DEPARTMENTS = [
  "Computer Science Engineering",
  "Electronics & Communication",
  "Mechanical Engineering",
  "Civil Engineering",
  "Electrical Engineering",
  "Information Technology",
  "Artificial Intelligence & ML",
  "Other",
];

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [userType, setUserType] = useState("student");
  const [form, setForm] = useState({
    studentId: "",
    name: "",
    department: "",
    vehicleNumber: "",
    password: "",
    confirmPassword: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (form.password !== form.confirmPassword) {
      return setError("Passwords do not match");
    }
    if (form.password.length < 6) {
      return setError("Password must be at least 6 characters");
    }

    if (userType === "student" && !form.department) {
      return setError("Please select a department");
    }

    setLoading(true);
    try {
      const payload = { ...form };
      delete payload.confirmPassword;

      if (userType === "normal") {
        payload.department = "General";
      }

      await register(payload);
      navigate("/dashboard");
    } catch (err) {
      setError(err.response?.data?.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-shell">
      <div className="auth-card slide-up">
        <div className="auth-brand">
          <div className="auth-mark">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <rect x="3" y="11" width="18" height="11" rx="2" />
              <path d="M7 11V7a5 5 0 0110 0v4" />
            </svg>
          </div>
          <h1 className="auth-title">ParkSys</h1>
          <p className="auth-sub">Create your account</p>
        </div>

        <div className="auth-form">
          <div className="flex gap-2 mb-2 p-1 bg-[#0F172A] rounded-lg border border-[#334155]">
            <button
              type="button"
              onClick={() => { setUserType("student"); setError(""); }}
              className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${userType === "student" ? "bg-[#2563EB] text-white" : "text-[#94A3B8] hover:text-[#F8FAFC]"
                }`}
            >
              Student
            </button>
            <button
              type="button"
              onClick={() => { setUserType("normal"); setError(""); }}
              className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${userType === "normal" ? "bg-[#2563EB] text-white" : "text-[#94A3B8] hover:text-[#F8FAFC]"
                }`}
            >
              Normal User
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="form-group">
                <label className="form-label" htmlFor="reg-studentId">
                  {userType === "student" ? "Student ID" : "Mobile / User ID"}
                </label>
                <input
                  id="reg-studentId"
                  name="studentId"
                  type="text"
                  autoComplete="username"
                  className="form-input"
                  placeholder={userType === "student" ? "e.g. 21CS047" : "e.g. 9876543210"}
                  value={form.studentId}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="reg-name">Full Name</label>
                <input
                  id="reg-name"
                  name="name"
                  type="text"
                  autoComplete="name"
                  className="form-input"
                  placeholder="Your full name"
                  value={form.name}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {userType === "student" && (
                <div className="form-group fade-in">
                  <label className="form-label" htmlFor="reg-department">Department</label>
                  <select
                    id="reg-department"
                    name="department"
                    className="form-select"
                    value={form.department}
                    onChange={handleChange}
                    required={userType === "student"}
                  >
                    <option value="">Select department</option>
                    {DEPARTMENTS.map((d) => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>
              )}
              <div className={`form-group ${userType === "normal" ? "sm:col-span-2" : ""}`}>
                <label className="form-label" htmlFor="reg-vehicleNumber">Vehicle Number</label>
                <input
                  id="reg-vehicleNumber"
                  name="vehicleNumber"
                  type="text"
                  className="form-input"
                  placeholder="e.g. KA01AB1234"
                  value={form.vehicleNumber}
                  onChange={handleChange}
                  required
                  autoCapitalize="characters"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="form-group">
                <label className="form-label" htmlFor="reg-password">Password</label>
                <div className="relative">
                  <input
                    id="reg-password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="new-password"
                    className="form-input pr-10"
                    placeholder="Min. 6 characters"
                    value={form.password}
                    onChange={handleChange}
                    required
                  />
                  <button
                    id="reg-toggle-password"
                    type="button"
                    tabIndex={-1}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#94A3B8] hover:text-[#F8FAFC] transition-colors"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    <EyeIcon visible={showPassword} />
                  </button>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="reg-confirmPassword">Confirm Password</label>
                <div className="relative">
                  <input
                    id="reg-confirmPassword"
                    name="confirmPassword"
                    type={showConfirm ? "text" : "password"}
                    autoComplete="new-password"
                    className="form-input pr-10"
                    placeholder="Re-enter password"
                    value={form.confirmPassword}
                    onChange={handleChange}
                    required
                  />
                  <button
                    id="reg-toggle-confirm"
                    type="button"
                    tabIndex={-1}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#94A3B8] hover:text-[#F8FAFC] transition-colors"
                    onClick={() => setShowConfirm(!showConfirm)}
                    aria-label={showConfirm ? "Hide password" : "Show password"}
                  >
                    <EyeIcon visible={showConfirm} />
                  </button>
                </div>
              </div>
            </div>

            {error && <div className="alert-error" role="alert">{error}</div>}

            <button
              id="reg-btn"
              type="submit"
              className="btn btn-primary w-full justify-center"
              disabled={loading}
            >
              {loading ? <><SpinnerIcon /> Creating account...</> : "Create Account"}
            </button>
          </form>
        </div>

        <p className="auth-footer">
          Already registered?{" "}
          <Link to="/login" className="btn-link">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
