import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LogOut,
  LayoutDashboard,
  Camera,
  History,
  Activity as ActivityIcon,
  User,
  Sparkles,
  ChevronRight,
  Zap,
} from 'lucide-react';

interface NavItem {
  to: string;
  icon: React.ReactNode;
  label: string;
  badge?: string;
  highlight?: boolean;
}

const navItems: NavItem[] = [
  { to: '/dashboard', icon: <LayoutDashboard size={19} />, label: 'Dashboard' },
  { to: '/log-meal', icon: <Camera size={19} />, label: 'Log Meal', badge: 'AI Vision', highlight: true },
  { to: '/history', icon: <History size={19} />, label: 'Meal History' },
  { to: '/activity', icon: <ActivityIcon size={19} />, label: 'Activity' },
  { to: '/profile', icon: <User size={19} />, label: 'Profile' },
];

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const avatarLetter = user?.display_name?.[0]?.toUpperCase() ?? 'U';
  const currentNav = navItems.find((n) => location.pathname.startsWith(n.to)) || navItems[0];

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-[#030712] text-slate-100">
      {/* ── Desktop Sidebar ──────────────────────────────────── */}
      <aside className="hidden md:flex flex-col fixed left-0 top-0 h-full w-64 z-40 bg-slate-950/80 backdrop-blur-2xl border-r border-white/5">
        {/* Brand */}
        <div className="px-6 py-6 flex items-center justify-between border-b border-white/5">
          <div className="flex items-center gap-3">
            <div className="relative w-10 h-10 rounded-2xl flex items-center justify-center bg-gradient-to-tr from-emerald-500 via-teal-500 to-cyan-400 shadow-lg shadow-emerald-500/20">
              <Zap size={22} className="text-slate-950 fill-slate-950" />
              <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-400 rounded-full border-2 border-slate-950 animate-ping" />
              <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-400 rounded-full border-2 border-slate-950" />
            </div>
            <div>
              <div className="flex items-center gap-1.5 leading-none">
                <span className="font-extrabold text-base tracking-tight text-white">NutriVision</span>
                <span className="text-[10px] font-black px-1.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 tracking-wider">
                  PRO
                </span>
              </div>
              <p className="text-[11px] font-medium text-slate-500 mt-1">CV Nutrition Engine</p>
            </div>
          </div>
        </div>

        {/* Quick Action: Log Meal CTA */}
        <div className="p-4">
          <button
            onClick={() => navigate('/log-meal')}
            className="w-full relative group overflow-hidden rounded-2xl p-3.5 bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-cyan-500/10 border border-emerald-500/30 hover:border-emerald-400/60 transition-all duration-300 text-left flex items-center justify-between shadow-lg shadow-emerald-950/20 hover:shadow-emerald-500/10"
          >
            <div className="flex items-center gap-3 relative z-10">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-slate-950 shadow-md">
                <Camera size={16} />
              </div>
              <div>
                <span className="text-xs font-bold text-white block">Scan Plate</span>
                <span className="text-[10px] text-emerald-400 font-medium">Instant AI Macro Rec</span>
              </div>
            </div>
            <Sparkles size={16} className="text-emerald-400 group-hover:rotate-12 transition-transform duration-300" />
            <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/20 to-teal-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          </button>
        </div>

        {/* Main Navigation */}
        <div className="px-4 py-2 text-[10px] font-bold uppercase tracking-wider text-slate-500">
          Navigation
        </div>
        <nav className="flex-1 px-3 space-y-1.5 overflow-y-auto">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 group ${
                  isActive
                    ? 'bg-gradient-to-r from-emerald-500/15 to-teal-500/10 text-emerald-300 border border-emerald-500/30 shadow-sm shadow-emerald-500/10'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-white/5 border border-transparent'
                }`
              }
            >
              <div className="flex items-center gap-3">
                <span className="transition-transform duration-200 group-hover:scale-110">
                  {item.icon}
                </span>
                <span>{item.label}</span>
              </div>
              {item.badge && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 group-hover:bg-emerald-500/30 transition-colors">
                  {item.badge}
                </span>
              )}
            </NavLink>
          ))}
        </nav>

        {/* User Card & Logout Footer */}
        <div className="p-3 border-t border-white/5 space-y-2">
          {user && (
            <div className="flex items-center gap-3 p-2.5 rounded-xl bg-white/[0.03] border border-white/5">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center text-xs font-bold text-white bg-gradient-to-tr from-purple-500 to-indigo-500 shadow-md flex-shrink-0">
                {avatarLetter}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold text-white truncate">{user.display_name || 'Demo User'}</p>
                <p className="text-[10px] text-slate-400 truncate">{user.email || 'user@nutrivision.ai'}</p>
              </div>
            </div>
          )}

          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 border border-transparent hover:border-rose-500/20 transition-all duration-200"
          >
            <LogOut size={14} />
            Sign Out
          </button>
        </div>
      </aside>

      {/* ── Main Canvas ──────────────────────────────────────── */}
      <div className="flex-1 md:ml-64 flex flex-col min-h-screen">
        {/* Top Navbar */}
        <header className="sticky top-0 z-30 h-16 bg-slate-950/70 backdrop-blur-xl border-b border-white/5 px-4 sm:px-8 flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-slate-400">
            <span className="text-slate-500">NutriVision</span>
            <ChevronRight size={14} className="text-slate-600" />
            <span className="font-semibold text-slate-200">{currentNav.label}</span>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/[0.03] border border-white/5 text-xs text-slate-400">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Vision AI API Online</span>
            </div>

            <button
              onClick={() => navigate('/log-meal')}
              className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 font-bold text-xs hover:opacity-95 shadow-lg shadow-emerald-500/20 transition-all hover:scale-105 active:scale-95"
            >
              <Camera size={14} />
              <span>Scan Meal</span>
            </button>
          </div>
        </header>

        {/* Dynamic Page Content */}
        <main className="flex-1 px-4 sm:px-8 py-8 pb-24 md:pb-12 max-w-7xl w-full mx-auto">
          <Outlet />
        </main>
      </div>

      {/* ── Mobile Glass Tab Bar ─────────────────────────────── */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 h-16 bg-slate-950/90 backdrop-blur-xl border-t border-white/10 flex items-center justify-around px-2">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `flex flex-col items-center justify-center py-1 px-2.5 rounded-xl text-xs font-semibold transition-all duration-200 ${
                isActive ? 'text-emerald-400' : 'text-slate-500 hover:text-slate-300'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <div
                  className={`p-1 rounded-lg transition-transform duration-200 ${
                    isActive ? 'bg-emerald-500/20 scale-110' : ''
                  }`}
                >
                  {item.icon}
                </div>
                <span className="text-[10px] mt-0.5 font-medium">{item.label}</span>
              </>
            )}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
