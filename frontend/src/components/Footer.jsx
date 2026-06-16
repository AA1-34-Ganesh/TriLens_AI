import { Link } from "react-router-dom";

export default function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer className="bg-[#0F172A] border-t border-[#1E293B] px-4 py-8 mt-auto">
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-2 gap-4 mb-4 text-[#94A3B8] text-xs">
          <div className="flex flex-col gap-1">
            <span className="font-semibold text-[#F8FAFC]">Support</span>
            <a href="mailto:support@parksys.app" className="hover:text-white transition-colors">support@parksys.app</a>
            <span className="cursor-pointer hover:text-white transition-colors">Privacy Policy</span>
            <span className="cursor-pointer hover:text-white transition-colors">Terms of Service</span>
          </div>
          <div className="flex flex-col gap-1 text-right">
            <span className="font-semibold text-[#F8FAFC]">System</span>
            <span>Version: 2.1.0</span>
            <span>Environment: Production</span>
            <span>Build: #8492</span>
          </div>
        </div>
        <div className="border-t border-[#1E293B] pt-4 flex items-center justify-between">
          <p className="text-[#94A3B8] text-xs">© {year} ParkSys. All rights reserved.</p>
          <p className="text-[#94A3B8] text-xs">Built with React + Node.js</p>
        </div>
      </div>
    </footer>
  );
}
