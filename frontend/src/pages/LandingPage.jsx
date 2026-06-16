import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import InstallAppButton from "../components/InstallAppButton";
import Footer from "../components/Footer";

const features = [
  {
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={1.75} viewBox="0 0 24 24">
        <path d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197" />
      </svg>
    ),
    title: "QR-Based Entry",
    desc: "Scan a block QR code to instantly view availability and park without any account needed."
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={1.75} viewBox="0 0 24 24">
        <rect x="3" y="3" width="18" height="18" rx="2" />
        <path d="M9 17V7h4a3 3 0 010 6H9" />
      </svg>
    ),
    title: "Live Availability",
    desc: "Real-time floor-by-floor parking availability updated automatically across all blocks."
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={1.75} viewBox="0 0 24 24">
        <path d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
      </svg>
    ),
    title: "Interactive Maps",
    desc: "Browse visual floor maps to choose your exact parking spot before you arrive."
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={1.75} viewBox="0 0 24 24">
        <path d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
      </svg>
    ),
    title: "AI Landmark Detection",
    desc: "Capture AI-powered visual hints when you park so you always find your vehicle easily."
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={1.75} viewBox="0 0 24 24">
        <path d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
      </svg>
    ),
    title: "PWA — Installable",
    desc: "Install ParkSys on any device for a native app experience with offline support."
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={1.75} viewBox="0 0 24 24">
        <path d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    ),
    title: "Admin Analytics",
    desc: "Super Admins get full occupancy reports, block management, and QR generation tools."
  }
];

const steps = [
  { n: "01", title: "Admin Creates Block", desc: "Admin sets up a block with buildings, floors and parking spaces. A QR code is generated automatically." },
  { n: "02", title: "QR Posted at Entrance", desc: "The block QR code is printed and posted at the entrance ramp or building entrance." },
  { n: "03", title: "User Scans QR", desc: "Anyone scans the QR code — no app or account needed. They immediately see live parking availability." },
  { n: "04", title: "Browse and Select", desc: "Users explore the interactive floor map and pick their preferred available slot." },
  { n: "05", title: "Enter Details & Park", desc: "After choosing a slot, enter vehicle details and confirm. The space is instantly reserved." },
  { n: "06", title: "Block Admin Monitors", desc: "Block Admins track occupancy, search vehicles by plate number, and manage checkouts." }
];

export default function LandingPage() {
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#0F172A] text-[#F8FAFC]">
      <header className="sticky top-0 z-50 bg-[#0F172A]/95 backdrop-blur-md border-b border-[#1E293B]">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between gap-4">
          <Link to="/" className="flex items-center gap-2.5 shrink-0">
            <div className="w-8 h-8 bg-[#2563EB] rounded-md flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <rect x="3" y="11" width="18" height="11" rx="2" />
                <path d="M7 11V7a5 5 0 0110 0v4" />
              </svg>
            </div>
            <span className="text-[#F8FAFC] font-bold text-base tracking-tight">ParkSys</span>
          </Link>
          <nav className="hidden md:flex items-center gap-6">
            {["Features", "How It Works", "About"].map(item => (
              <a key={item} href={`#${item.toLowerCase().replace(/\s/g, "-")}`}
                className="text-[#94A3B8] text-sm hover:text-[#F8FAFC] transition-colors">
                {item}
              </a>
            ))}
          </nav>
          <div className="hidden md:flex items-center gap-2">
            <InstallAppButton variant="secondary" className="btn-sm" />
            <Link to="/login" className="btn btn-secondary btn-sm text-white border-white/20 hover:bg-white/10">Login</Link>
            <Link to="/register" className="btn btn-primary btn-sm">Register</Link>
          </div>
          <button className="md:hidden btn btn-ghost btn-sm btn-icon" onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Toggle menu">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              {menuOpen
                ? <path d="M6 18L18 6M6 6l12 12" />
                : <path d="M4 6h16M4 12h16M4 18h16" />}
            </svg>
          </button>
        </div>
        {menuOpen && (
          <div className="md:hidden bg-[#0F172A] border-b border-[#1E293B] px-4 py-4 space-y-3 fade-in">
            {["Features", "How It Works", "About"].map(item => (
              <a key={item} href={`#${item.toLowerCase().replace(/\s/g, "-")}`}
                onClick={() => setMenuOpen(false)}
                className="block text-[#94A3B8] text-sm hover:text-[#F8FAFC] py-1">
                {item}
              </a>
            ))}
            <div className="flex gap-2 pt-2">
              <Link to="/login" className="btn btn-secondary btn-sm flex-1 justify-center">Login</Link>
              <Link to="/register" className="btn btn-primary btn-sm flex-1 justify-center">Register</Link>
            </div>
          </div>
        )}
      </header>

      <section className="relative px-4 py-20 sm:py-32 text-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-[#2563EB]/5 via-transparent to-transparent pointer-events-none" />
        <div className="absolute top-20 left-1/2 -translate-x-1/2 w-96 h-96 bg-[#2563EB]/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative max-w-3xl mx-auto">
          <h1 className="text-[#F8FAFC] text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight mb-4 mt-8">
            Smart Parking,{" "}
            <span className="text-[#2563EB]">Zero Friction</span>
          </h1>
          <p className="text-[#94A3B8] text-lg sm:text-xl max-w-xl mx-auto mb-8 leading-relaxed">
            Scan a QR code, see live availability, pick your spot, and park — no app download, only account needed.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button onClick={() => navigate("/register")} className="btn btn-primary text-base px-6 py-2.5">
              Get Started Free
            </button>
            <button onClick={() => navigate("/login")} className="btn btn-secondary text-base px-6 py-2.5 text-white border-white/20 hover:bg-white/10">
              Sign In
            </button>
            <InstallAppButton variant="secondary" className="text-base px-6 py-2.5 text-white border-white/20 hover:bg-white/10" />
          </div>
          <div className="flex items-center justify-center gap-6 mt-10">
            {[["No App Download", "✓"], ["Real-Time Updates", "✓"], ["AI Assistance", "✓"]].map(([label, check]) => (
              <div key={label} className="flex items-center gap-1.5">
                <span className="text-[#22C55E] text-sm font-bold">{check}</span>
                <span className="text-[#94A3B8] text-sm">{label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="features" className="px-4 py-16 sm:py-20">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-[#F8FAFC] text-3xl font-bold mb-3">Everything You Need</h2>
            <p className="text-[#94A3B8] text-base max-w-lg mx-auto">
              A complete parking ecosystem — from QR scanning to admin analytics.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {features.map(({ icon, title, desc }) => (
              <div key={title} className="bg-[#1E293B] border border-[#334155] rounded-xl p-5 hover:border-[#2563EB]/50 transition-colors">
                <div className="w-10 h-10 bg-[#2563EB]/15 text-[#2563EB] rounded-lg flex items-center justify-center mb-3">
                  {icon}
                </div>
                <h3 className="text-[#F8FAFC] font-semibold text-sm mb-1.5">{title}</h3>
                <p className="text-[#94A3B8] text-xs leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="how-it-works" className="px-4 py-16 sm:py-20 bg-[#1E293B]/30">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-[#F8FAFC] text-3xl font-bold mb-3">How It Works</h2>
            <p className="text-[#94A3B8] text-base max-w-lg mx-auto">
              From setup to parked in under 60 seconds.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {steps.map(({ n, title, desc }) => (
              <div key={n} className="flex gap-4 bg-[#1E293B] border border-[#334155] rounded-xl p-5">
                <span className="text-[#2563EB] font-bold text-xl tabular-nums shrink-0 w-8">{n}</span>
                <div>
                  <h3 className="text-[#F8FAFC] font-semibold text-sm mb-1">{title}</h3>
                  <p className="text-[#94A3B8] text-xs leading-relaxed">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="about" className="px-4 py-16 sm:py-20">
        <div className="max-w-3xl mx-auto text-center">
          <div className="bg-gradient-to-br from-[#2563EB]/10 to-[#1E293B] border border-[#334155] rounded-2xl p-8 sm:p-12">
            <h2 className="text-[#F8FAFC] text-3xl font-bold mb-4">Ready to Transform Parking?</h2>
            <p className="text-white/80 text-base mb-8 leading-relaxed max-w-lg mx-auto">
              Join campuses and residential complexes using ParkSys to eliminate parking chaos with smart QR management and real-time AI assistance.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link to="/register" className="btn btn-primary text-base px-8 py-2.5">
                Create Account
              </Link>
              <Link to="/login" className="btn btn-secondary text-base px-8 py-2.5 text-white border-white/20 hover:bg-white/10">
                Sign In
              </Link>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
