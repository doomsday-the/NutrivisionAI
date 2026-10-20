import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LogOut,
  LayoutDashboard,
  Camera,
  History,
  Activity as ActivityIcon,
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

// Profile tab removed from main nav list — incorporated directly into the profile card button below
const navItems: NavItem[] = [
  { to: '/dashboard', icon: <LayoutDashboard size={19} />, label: 'Dashboard' },
  { to: '/log-meal', icon: <Camera size={19} />, label: 'Log Meal', badge: 'AI Vision', highlight: true },
  { to: '/history', icon: <History size={19} />, label: 'Meal History' },
  { to: '/activity', icon: <ActivityIcon size={19} />, label: 'Activity' },
];

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = (e: React.MouseEvent) => {
    e.stopPropagation();
    logout();
    navigate('/login');
  };

  const avatarLetter = user?.display_name?.[0]?.toUpperCase() ?? 'U';
  const isProfileActive = location.pathname.startsWith('/profile');
  const currentNav = isProfileActive
    ? { label: 'My Profile & Biometrics' }
    : navItems.find((n) => location.pathname.startsWith(n.to)) || navItems[0];

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-[#faf7f2] text-stone-900">
      {/* ── Desktop Sidebar ──────────────────────────────────── */}
      <aside className="hidden md:flex flex-col fixed left-0 top-0 h-full w-64 z-40 bg-[#fffdfa]/90 backdrop-blur-2xl border-r border-stone-200/80 shadow-sm">
        {/* Brand */}
        <div className="px-6 py-6 flex items-center justify-between border-b border-stone-200/70">
          <div className="flex items-center gap-3">
            <div className="relative w-10 h-10 rounded-2xl flex items-center justify-center bg-gradient-to-tr from-emerald-600 via-emerald-500 to-amber-500 shadow-md shadow-emerald-700/15">
              <Zap size={22} className="text-white fill-white" />
              <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 rounded-full border-2 border-white animate-ping" />
              <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 rounded-full border-2 border-white" />
            </div>
            <div>
              <div className="flex items-center gap-1.5 leading-none">
                <span className="font-extrabold text-base tracking-tight text-stone-900">NutriVision</span>
                <span className="text-[10px] font-black px-1.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-300 tracking-wider">
                  PRO
                </span>
              </div>
              <p className="text-[11px] font-semibold text-stone-500 mt-1">CV Nutrition Engine</p>
            </div>
          </div>
        </div>

        {/* Main Navigation */}
        <div className="px-5 pt-5 pb-2 text-[10px] font-black uppercase tracking-wider text-stone-400">
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
                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200 shadow-sm font-bold'
                    : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100/80 border border-transparent'
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
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200 group-hover:bg-emerald-200/80 transition-colors">
                  {item.badge}
                </span>
              )}
            </NavLink>
          ))}
        </nav>

        {/* ── User Profile Button Footer (Replaces Profile Tab) ─ */}
        <div className="p-3 border-t border-stone-200/80 space-y-2 bg-stone-50/50">
          <button
            onClick={() => navigate('/profile')}
            className={`w-full group text-left p-2.5 rounded-2xl border transition-all duration-200 flex items-center justify-between ${
              isProfileActive
                ? 'bg-emerald-50 border-emerald-300 shadow-sm ring-2 ring-emerald-500/20'
                : 'bg-white hover:bg-stone-50 border-stone-200 shadow-xs hover:border-emerald-300 hover:shadow-md'
            }`}
            title="Click to view and edit Profile & Biometrics"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="relative w-9 h-9 rounded-xl flex items-center justify-center text-xs font-black text-white bg-gradient-to-tr from-emerald-600 via-teal-600 to-amber-600 shadow-sm flex-shrink-0">
                {avatarLetter}
                <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-white" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <p className="text-xs font-bold text-stone-900 truncate">
                    {user?.display_name || 'My Profile'}
                  </p>
                  <span className="text-[9px] font-black uppercase px-1.5 py-0.2 rounded-md bg-amber-50 text-amber-800 border border-amber-200/70">
                    Profile
                  </span>
                </div>
                <p className="text-[10px] text-stone-500 truncate mt-0.5">
                  {user?.email || 'Tap to edit goals'}
                </p>
              </div>
            </div>
            <ChevronRight
              size={15}
              className={`transition-transform duration-200 ${
                isProfileActive
                  ? 'text-emerald-700 translate-x-0.5'
                  : 'text-stone-400 group-hover:text-emerald-600 group-hover:translate-x-0.5'
              }`}
            />
          </button>

          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold text-stone-500 hover:text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-200 transition-all duration-200"
          >
            <LogOut size={13} />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* ── Main Canvas ──────────────────────────────────────── */}
      <div className="flex-1 md:ml-64 flex flex-col min-h-screen">
        {/* Top Navbar */}
        <header className="sticky top-0 z-30 h-16 bg-[#fffdfa]/85 backdrop-blur-xl border-b border-stone-200/80 px-4 sm:px-8 flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2 text-sm text-stone-500">
            <span className="text-stone-400 font-medium">NutriVision</span>
            <ChevronRight size={14} className="text-stone-300" />
            <span className="font-bold text-stone-800">{currentNav.label}</span>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200/80 text-xs font-semibold text-emerald-800">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Vision AI API Online</span>
            </div>

            {/* Quick Profile Pill on Header */}
            <button
              onClick={() => navigate('/profile')}
              className={`flex items-center gap-2 p-1.5 pr-3 rounded-xl border transition-all ${
                isProfileActive
                  ? 'bg-emerald-50 border-emerald-300 text-emerald-900 shadow-xs'
                  : 'bg-white hover:bg-stone-50 border-stone-200 text-stone-700 shadow-xs'
              }`}
              title="View Profile & Biometrics"
            >
              <div className="w-6 h-6 rounded-lg bg-gradient-to-tr from-emerald-600 to-teal-600 text-white font-black text-[11px] flex items-center justify-center shadow-xs">
                {avatarLetter}
              </div>
              <span className="text-xs font-bold hidden sm:inline">{user?.display_name || 'Profile'}</span>
            </button>
          </div>
        </header>

        {/* Dynamic Page Content */}
        <main className="flex-1 px-4 sm:px-8 py-8 pb-24 md:pb-12 max-w-7xl w-full mx-auto">
          <Outlet />
        </main>
      </div>

      {/* ── Mobile Glass Tab Bar ─────────────────────────────── */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 h-16 bg-[#fffdfa]/95 backdrop-blur-xl border-t border-stone-200/90 flex items-center justify-around px-2 shadow-lg">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `flex flex-col items-center justify-center py-1 px-2.5 rounded-xl text-xs font-semibold transition-all duration-200 ${
                isActive ? 'text-emerald-700 font-bold' : 'text-stone-500 hover:text-stone-800'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <div
                  className={`p-1 rounded-lg transition-transform duration-200 ${
                    isActive ? 'bg-emerald-100 scale-110 text-emerald-700' : ''
                  }`}
                >
                  {item.icon}
                </div>
                <span className="text-[10px] mt-0.5 font-semibold">{item.label}</span>
              </>
            )}
          </NavLink>
        ))}

        {/* Mobile Profile Tab */}
        <button
          onClick={() => navigate('/profile')}
          className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl text-xs font-semibold transition-all duration-200 ${
            isProfileActive ? 'text-emerald-700 font-bold' : 'text-stone-500 hover:text-stone-800'
          }`}
        >
          <div
            className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs font-black text-white bg-gradient-to-tr from-emerald-600 to-amber-600 transition-transform duration-200 ${
              isProfileActive ? 'ring-2 ring-emerald-500 scale-110' : ''
            }`}
          >
            {avatarLetter}
          </div>
          <span className="text-[10px] mt-0.5 font-semibold">Profile</span>
        </button>
      </nav>
    </div>
  );
}
