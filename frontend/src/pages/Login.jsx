import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import InstallAppButton from "../components/InstallAppButton";

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

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ studentId: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const user = await login(form.studentId, form.password);
      if (user.role === "admin") navigate("/admin");
      else if (user.role === "blockAdmin") navigate("/block-admin");
      else navigate("/dashboard");
    } catch (err) {
      setError(
        err.response
          ? err.response.data?.message || "Invalid credentials."
          : "Server unreachable. Ensure backend is running."
      );
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
          <p className="auth-sub">Parking Management System</p>
        </div>

        <div className="auth-form">
          <h2 className="text-[#F8FAFC] font-semibold text-base mb-4">Sign in to your account</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="form-group">
              <label className="form-label" htmlFor="login-id">User ID</label>
              <input
                id="login-id"
                name="studentId"
                type="text"
                autoComplete="username"
                className="form-input"
                placeholder="e.g. abc001"
                value={form.studentId}
                onChange={handleChange}
                required
                autoCapitalize="characters"
              />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="login-password">Password</label>
              <div className="relative">
                <input
                  id="login-password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  className="form-input pr-10"
                  placeholder="Enter your password"
                  value={form.password}
                  onChange={handleChange}
                  required
                />
                <button
                  id="toggle-password"
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

            {error && <div className="alert-error" role="alert">{error}</div>}

            <button
              id="login-btn"
              type="submit"
              className="btn btn-primary w-full justify-center"
              disabled={loading}
            >
              {loading ? <><SpinnerIcon /> Signing in...</> : "Sign In"}
            </button>
          </form>
        </div>

        <p className="auth-footer">
          Student?{" "}
          <Link to="/register" className="btn-link">
            Create account
          </Link>
        </p>

        <div className="mt-4 flex justify-center">
          <InstallAppButton variant="secondary" className="w-full" />
        </div>
      </div>
    </div>
  );
}
