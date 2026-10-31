import { useState } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LogOut,
  LayoutDashboard,
  Camera,
  History,
  Activity as ActivityIcon,
  Bot,
  User,
  Search,
  Sparkles,
  Menu,
  X,
  ChevronDown,
  Download,
  Smartphone,
} from 'lucide-react';

interface NavItem {
  to: string;
  icon: React.ReactNode;
  label: string;
  badge?: string;
}

const navItems: NavItem[] = [
  { to: '/dashboard', icon: <LayoutDashboard size={15} />, label: 'Dashboard' },
  { to: '/log-meal', icon: <Camera size={15} />, label: 'Log Meal', badge: 'Vision' },
  { to: '/history', icon: <History size={15} />, label: 'Meal History' },
  { to: '/activity', icon: <ActivityIcon size={15} />, label: 'Activity' },
  { to: '/coach', icon: <Bot size={15} />, label: 'NutriCoach', badge: 'AI' },
];

const APK_DOWNLOAD_URL =
  'https://github.com/doomsday-the/NutrivisionAI/releases/download/companion-latest/NutriVisionSync.apk';

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [navSearch, setNavSearch] = useState('');

  const handleLogout = (e: React.MouseEvent) => {
    e.stopPropagation();
    logout();
    navigate('/login');
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (navSearch.trim()) {
      navigate(`/log-meal?q=${encodeURIComponent(navSearch.trim())}`);
    }
  };

  const avatarLetter = user?.display_name?.[0]?.toUpperCase() ?? 'U';
  const isProfileActive = location.pathname.startsWith('/profile');

  return (
    <div className="min-h-screen bg-[#071013] text-white flex flex-col selection:bg-white selection:text-black">
      {/* ── Compact, Unobtrusive Top Navigation ──────────────── */}
      <header className="sticky top-0 z-50 h-16 bg-[#071013]/90 backdrop-blur-md border-b border-[#18282c] px-4 sm:px-8 flex items-center justify-between">
        {/* Left: Brand Identity with Asterisk */}
        <div className="flex items-center gap-6">
          <NavLink to="/dashboard" className="flex items-center gap-2.5 group outline-none">
            <span className="text-emerald-400 text-lg font-black tracking-tight select-none">✳</span>
            <div className="flex items-baseline gap-1.5">
              <span className="font-extrabold text-base tracking-tight text-white group-hover:text-slate-200 transition">
                NutriVision
              </span>
              <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-[#0b241c] text-[#34d399] border border-[#14533e]">
                PRO
              </span>
            </div>
          </NavLink>

          {/* Quick Jump / Search Bar in Nav */}
          <form
            onSubmit={handleSearchSubmit}
            className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#0b171b] border border-[#18282c] focus-within:border-white/30 text-xs w-64 transition-all"
          >
            <Search size={13} className="text-[#8ba0a6]" />
            <input
              type="text"
              value={navSearch}
              onChange={(e) => setNavSearch(e.target.value)}
              placeholder="Search foods, meals, macros..."
              className="bg-transparent text-white placeholder-[#566c73] outline-none text-xs w-full"
            />
          </form>
        </div>

        {/* Center / Right: Primary Desktop Nav Links */}
        <nav className="hidden md:flex items-center gap-1">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all duration-150 outline-none ${
                  isActive
                    ? 'text-white bg-[#0e1d22] border border-[#1d333a]'
                    : 'text-[#8ba0a6] hover:text-white hover:bg-[#0a1518] border border-transparent'
                }`
              }
            >
              <span className="shrink-0">{item.icon}</span>
              <span>{item.label}</span>
              {item.badge && (
                <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-[#102a22] text-[#34d399] border border-[#194b3c]">
                  {item.badge}
                </span>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Rightmost: System Status & User Profile */}
        <div className="flex items-center gap-3">
          {/* APK Companion App Download Button */}
          <a
            href={APK_DOWNLOAD_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 hover:text-emerald-300 border border-emerald-500/30 text-xs font-bold transition shadow-xs outline-none"
            title="Download Android Companion APK (Samsung Health Sync)"
          >
            <Smartphone size={13} className="shrink-0" />
            <span>Sync APK</span>
            <Download size={12} className="shrink-0 opacity-75" />
          </a>

          {/* Status Indicator */}
          <div className="hidden sm:flex items-center gap-2 px-3 py-1 rounded-full bg-[#071f18] border border-[#114736] text-[11px] font-medium text-[#34d399]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#10b981] animate-pulse" />
            <span className="tracking-tight">Vision AI Ready</span>
          </div>

          {/* User Account Controls */}
          <div className="relative">
            <button
              onClick={() => setUserDropdownOpen(!userDropdownOpen)}
              className={`flex items-center gap-2.5 p-1.5 sm:px-3 sm:py-1.5 rounded-xl border transition-all cursor-pointer outline-none ${
                isProfileActive || userDropdownOpen
                  ? 'bg-[#0f1f24] border-[#29434b]'
                  : 'bg-[#0b171b] border-[#18282c] hover:border-[#22373e]'
              }`}
              title="User Account"
            >
              <div className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-black text-black bg-white shrink-0">
                {avatarLetter}
              </div>
              <span className="hidden sm:inline-block text-xs font-bold text-white max-w-[100px] truncate">
                {user?.display_name?.split(' ')[0] || 'Member'}
              </span>
              <ChevronDown size={13} className="hidden sm:block text-[#8ba0a6]" />
            </button>

            {/* User Dropdown Menu */}
            {userDropdownOpen && (
              <div
                className="absolute right-0 mt-2 w-56 rounded-xl bg-[#0b171b] border border-[#1d3238] shadow-2xl p-1.5 z-50 animate-fade-in"
                onClick={() => setUserDropdownOpen(false)}
              >
                <div className="px-3 py-2 border-b border-[#18282c]">
                  <p className="text-xs font-bold text-white truncate">{user?.display_name || 'My Account'}</p>
                  <p className="text-[10px] text-[#8ba0a6] truncate">{user?.email}</p>
                </div>

                <div className="py-1">
                  <button
                    onClick={() => navigate('/profile')}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-[#8ba0a6] hover:text-white hover:bg-[#102026] rounded-lg transition text-left cursor-pointer"
                  >
                    <User size={14} />
                    <span>Profile & Biometrics</span>
                  </button>
                  <button
                    onClick={() => navigate('/activity')}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-[#8ba0a6] hover:text-white hover:bg-[#102026] rounded-lg transition text-left cursor-pointer"
                  >
                    <ActivityIcon size={14} />
                    <span>Activity & Steps</span>
                  </button>
                  <button
                    onClick={() => navigate('/coach')}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-[#8ba0a6] hover:text-white hover:bg-[#102026] rounded-lg transition text-left cursor-pointer"
                  >
                    <Sparkles size={14} className="text-[#34d399]" />
                    <span>NutriCoach AI</span>
                  </button>
                  <a
                    href={APK_DOWNLOAD_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full flex items-center justify-between px-3 py-2 text-xs text-emerald-400 hover:bg-[#102026] rounded-lg transition text-left cursor-pointer font-medium"
                  >
                    <div className="flex items-center gap-2.5">
                      <Smartphone size={14} />
                      <span>Download Sync APK</span>
                    </div>
                    <Download size={13} className="opacity-75" />
                  </a>
                </div>

                <div className="pt-1 border-t border-[#18282c]">
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-[#f43f5e] hover:bg-[#251014] rounded-lg transition text-left cursor-pointer font-semibold"
                  >
                    <LogOut size={14} />
                    <span>Sign Out</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Mobile Menu Hamburger */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-lg bg-[#0b171b] border border-[#18282c] text-white cursor-pointer"
            title="Toggle Menu"
          >
            {mobileMenuOpen ? <X size={16} /> : <Menu size={16} />}
          </button>
        </div>
      </header>

      {/* ── Mobile Slide Navigation Drawer ───────────────────── */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-[#0a1518] border-b border-[#18282c] px-4 py-4 space-y-1.5 z-40">
          <form onSubmit={handleSearchSubmit} className="mb-3 flex items-center gap-2 px-3 py-2 rounded-lg bg-[#071013] border border-[#18282c] text-xs">
            <Search size={13} className="text-[#8ba0a6]" />
            <input
              type="text"
              value={navSearch}
              onChange={(e) => setNavSearch(e.target.value)}
              placeholder="Search foods, meals..."
              className="bg-transparent text-white outline-none w-full"
            />
          </form>

          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={() => setMobileMenuOpen(false)}
              className={({ isActive }) =>
                `flex items-center justify-between px-3.5 py-2.5 rounded-lg text-xs font-semibold ${
                  isActive
                    ? 'bg-white text-black font-bold'
                    : 'text-[#8ba0a6] hover:text-white hover:bg-[#0e1d22]'
                }`
              }
            >
              <div className="flex items-center gap-2.5">
                <span className="shrink-0">{item.icon}</span>
                <span>{item.label}</span>
              </div>
              {item.badge && (
                <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-[#0b241c] text-[#34d399]">
                  {item.badge}
                </span>
              )}
            </NavLink>
          ))}

          <NavLink
            to="/profile"
            onClick={() => setMobileMenuOpen(false)}
            className={({ isActive }) =>
              `flex items-center gap-2.5 px-3.5 py-2.5 rounded-lg text-xs font-semibold ${
                isActive
                  ? 'bg-white text-black font-bold'
                  : 'text-[#8ba0a6] hover:text-white hover:bg-[#0e1d22]'
              }`
            }
          >
            <User size={15} />
            <span>Profile & Biometrics</span>
          </NavLink>

          <a
            href={APK_DOWNLOAD_URL}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => setMobileMenuOpen(false)}
            className="flex items-center justify-between px-3.5 py-2.5 rounded-lg text-xs font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 hover:bg-emerald-500/20 transition"
          >
            <div className="flex items-center gap-2.5">
              <Smartphone size={15} />
              <span>Download Companion APK</span>
            </div>
            <Download size={14} />
          </a>
        </div>
      )}

      {/* ── Main Dynamic Canvas ──────────────────────────────── */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
        <Outlet />
      </main>

      {/* ── Sleek Minimalist Footer ──────────────────────────── */}
      <footer className="border-t border-[#142327] py-6 px-4 text-center text-xs text-[#566c73]">
        <div className="flex items-center justify-center gap-2">
          <span className="text-emerald-400 text-sm">✳</span>
          <span className="font-semibold text-[#8ba0a6]">NutriVision AI</span>
          <span>— Precision Computer Vision & Metabolic Intelligence</span>
        </div>
      </footer>
    </div>
  );
}
