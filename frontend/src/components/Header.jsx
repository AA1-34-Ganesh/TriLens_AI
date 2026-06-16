import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import InstallAppButton from "./InstallAppButton";

export default function Header() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const isAdmin = location.pathname.startsWith("/admin");
  const isBlockAdmin = location.pathname.startsWith("/block-admin");
  const isStudent = !isAdmin && !isBlockAdmin;

  const breadcrumbs = location.pathname.split("/").filter(Boolean).map(p => p.charAt(0).toUpperCase() + p.slice(1));

  return (
    <header className="sticky top-0 z-40 bg-[#1E293B] border-b border-[#334155] px-4 h-14 flex items-center gap-3">
      <Link to={isAdmin ? "/admin" : isBlockAdmin ? "/block-admin" : "/dashboard"} className="flex items-center gap-2.5 shrink-0 mr-4">
        <div className="w-8 h-8 bg-[#2563EB] rounded-md flex items-center justify-center">
          <span className="text-white font-bold">P</span>
        </div>
        <div className="hidden sm:flex flex-col">
          <span className="text-[#F8FAFC] font-semibold text-sm leading-tight">ParkSys</span>
        </div>
      </Link>

      <nav className="hidden md:flex items-center gap-2 text-xs text-[#94A3B8]">
        {breadcrumbs.map((crumb, idx) => (
          <span key={idx} className="flex items-center gap-2">
            {idx > 0 && <span>/</span>}
            <span className={idx === breadcrumbs.length - 1 ? "text-[#F8FAFC] font-medium" : ""}>{crumb}</span>
          </span>
        ))}
      </nav>

      <div className="flex-1" />

      <div className="hidden sm:flex items-center relative mr-2">
        <input type="text" placeholder="Search..." className="bg-[#0F172A] border border-[#334155] rounded-full px-3 py-1.5 text-xs text-white placeholder-[#94A3B8] focus:outline-none focus:border-[#2563EB] w-48" />
        <span className="absolute right-3 text-[#94A3B8]"></span>
      </div>

      <div className="flex items-center gap-3">
        <InstallAppButton variant="primary" className="hidden sm:inline-flex btn-sm" />
        
        <button className="relative text-[#94A3B8] hover:text-[#F8FAFC] transition-colors" aria-label="Notifications">
          
          <span className="absolute top-0 right-0 w-2 h-2 bg-[#EF4444] rounded-full"></span>
        </button>

        <Link to="/profile" className="flex items-center gap-2 hover:bg-[#334155]/40 p-1.5 rounded-lg transition-colors group">
          <div className="w-8 h-8 rounded-full bg-[#334155] group-hover:bg-[#475569] flex items-center justify-center text-white text-xs font-semibold shrink-0 transition-colors">
            {user?.name?.charAt(0)?.toUpperCase() || "?"}
          </div>
          <div className="hidden md:block min-w-0 text-left">
            <p className="text-[#F8FAFC] text-sm font-medium leading-tight truncate max-w-[120px]">{user?.name}</p>
            <p className="text-[#94A3B8] text-[10px] leading-tight truncate">{user?.studentId}</p>
          </div>
        </Link>
        
        <button onClick={handleLogout} className="btn-ghost btn-sm" aria-label="Logout">
          <svg className="w-4 h-4 text-[#94A3B8] hover:text-[#F8FAFC] transition-colors" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
        </button>
      </div>
    </header>
  );
}
