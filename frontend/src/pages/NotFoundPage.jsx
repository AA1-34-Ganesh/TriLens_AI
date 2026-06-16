import { Link } from "react-router-dom";

export default function NotFoundPage() {
  return (
    <div className="min-h-screen bg-[#0F172A] flex flex-col items-center justify-center px-4 text-center">
      <div className="w-16 h-16 bg-[#1E293B] border border-[#334155] rounded-2xl flex items-center justify-center mx-auto mb-6">
        <svg className="w-8 h-8 text-[#475569]" fill="none" stroke="currentColor" strokeWidth={1.75} viewBox="0 0 24 24">
          <circle cx="11" cy="11" r="8" />
          <path d="M21 21l-4.35-4.35M11 8v3m0 4h.01" />
        </svg>
      </div>
      <h1 className="text-[#F8FAFC] text-4xl font-bold mb-2">404</h1>
      <p className="text-[#94A3B8] text-base mb-1">Page Not Found</p>
      <p className="text-[#475569] text-sm mb-8 max-w-xs">
        The page you are looking for does not exist or has been moved.
      </p>
      <div className="flex flex-col sm:flex-row gap-3">
        <Link to="/" className="btn btn-primary px-6">Go Home</Link>
        <Link to="/login" className="btn btn-secondary px-6">Sign In</Link>
      </div>
    </div>
  );
}
