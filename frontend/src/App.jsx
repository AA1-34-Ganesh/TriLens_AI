import { lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import AppLayout from "./layouts/AppLayout";
import ReloadPrompt from "./components/ReloadPrompt";

const Login = lazy(() => import("./pages/Login"));
const Register = lazy(() => import("./pages/Register"));
const AdminDashboardHome = lazy(() => import("./pages/AdminDashboardHome"));
const BuildingsPage = lazy(() => import("./pages/BuildingsPage"));
const BlocksPage = lazy(() => import("./pages/BlocksPage"));
const ReportsPage = lazy(() => import("./pages/ReportsPage"));
const UsersPage = lazy(() => import("./pages/UsersPage"));
const SettingsPage = lazy(() => import("./pages/SettingsPage"));
const BlockAdminDashboard = lazy(() => import("./pages/BlockAdminDashboard"));
const BlockLanding = lazy(() => import("./pages/BlockLanding"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const ParkingView = lazy(() => import("./pages/ParkingView"));
const RetrieveVehicle = lazy(() => import("./pages/RetrieveVehicle"));
const LandingPage = lazy(() => import("./pages/LandingPage"));

function PageLoader() {
  return (
    <div className="flex items-center justify-center h-full min-h-[200px]">
      <div className="flex flex-col items-center gap-3">
        <svg className="w-6 h-6 animate-spin text-[#2563EB]" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
        <p className="text-[#94A3B8] text-sm">Loading...</p>
      </div>
    </div>
  );
}

function AppShellLoader() {
  return (
    <div className="min-h-screen bg-[#0F172A] flex items-center justify-center">
      <PageLoader />
    </div>
  );
}

function ProtectedRoute({ children, adminOnly = false, blockAdminOnly = false }) {
  const { user, loading } = useAuth();
  if (loading) return <AppShellLoader />;
  if (!user) return <Navigate to="/login" replace />;
  if (adminOnly && user.role !== "admin") return <Navigate to="/dashboard" replace />;
  if (blockAdminOnly && user.role !== "blockAdmin" && user.role !== "admin") return <Navigate to="/dashboard" replace />;
  return children;
}

function PublicRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <AppShellLoader />;
  if (user) {
    if (user.role === "admin") return <Navigate to="/admin" replace />;
    if (user.role === "blockAdmin") return <Navigate to="/block-admin" replace />;
    return <Navigate to="/dashboard" replace />;
  }
  return children;
}

function AppRoutes() {
  return (
    <Suspense fallback={<AppShellLoader />}>
      <Routes>
        <Route path="/block/:blockId" element={<BlockLanding />} />
        <Route path="/" element={<PublicRoute><LandingPage /></PublicRoute>} />
        <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
        <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />
        <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/parking" element={<ProtectedRoute><ParkingView /></ProtectedRoute>} />
        <Route path="/retrieve" element={<ProtectedRoute><RetrieveVehicle /></ProtectedRoute>} />
        <Route path="/block-admin" element={<ProtectedRoute blockAdminOnly><BlockAdminDashboard /></ProtectedRoute>} />

        <Route
          path="/admin"
          element={<ProtectedRoute adminOnly><AppLayout /></ProtectedRoute>}
        >
          <Route index element={<AdminDashboardHome />} />
          <Route path="buildings" element={<BuildingsPage />} />
          <Route path="blocks" element={<BlocksPage />} />
          <Route path="reports" element={<ReportsPage />} />
          <Route path="users" element={<UsersPage />} />
          <Route path="settings" element={<SettingsPage />} />
        </Route>

        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </Suspense>
  );
}

function PlaceholderPage({ title, desc }) {
  return (
    <div className="max-w-4xl mx-auto">
      <div className="page-heading">
        <h1 className="page-title">{title}</h1>
        <p className="page-subtitle">{desc}</p>
      </div>
      <div className="empty-box mt-6">
        <p className="empty-title">Coming Soon</p>
        <p className="empty-desc">This section is under development.</p>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
        <ReloadPrompt />
      </AuthProvider>
    </BrowserRouter>
  );
}
