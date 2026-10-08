import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LogOut,
  Home,
  Camera,
  User,
  Activity,
} from 'lucide-react';

interface NavItem {
  to: string;
  icon: React.ReactNode;
  label: string;
}

const navItems: NavItem[] = [
  { to: '/dashboard', icon: <Home size={20} />,   label: 'Dashboard' },
  { to: '/log-meal',  icon: <Camera size={20} />,  label: 'Log Meal'  },
  { to: '/profile',   icon: <User size={20} />,    label: 'Profile'   },
];

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const avatarLetter = user?.display_name?.[0]?.toUpperCase() ?? '?';

  return (
    <div className="min-h-screen flex bg-slate-900">
      {/* ── Desktop Sidebar ──────────────────────────────────── */}
      <aside className="hidden md:flex flex-col fixed left-0 top-0 h-full w-60 z-40"
        style={{
          background: 'linear-gradient(180deg, #0f172a 0%, #1e293b 100%)',
          borderRight: '1px solid rgba(255,255,255,0.06)',
        }}
      >
        {/* Brand */}
        <div className="flex items-center gap-3 px-5 py-6 border-b border-white/5">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: 'linear-gradient(135deg, #22c55e, #14b8a6)' }}>
            <Activity size={20} className="text-white" />
          </div>
          <div className="leading-tight">
            <span className="text-white font-bold text-base tracking-tight">NutriVision</span>
            <span className="ml-1 px-1.5 py-0.5 rounded text-xs font-bold text-white"
              style={{ background: 'linear-gradient(90deg, #22c55e, #14b8a6)' }}>
              AI
            </span>
          </div>
        </div>

        {/* Nav links */}
        <nav className="flex-1 px-3 py-5 space-y-1 overflow-y-auto">
          {navItems.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200 group ${
                  isActive
                    ? 'text-white shadow-lg'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`
              }
              style={({ isActive }) =>
                isActive
                  ? { background: 'linear-gradient(135deg, #16a34a, #0d9488)' }
                  : {}
              }
            >
              <span className="transition-transform duration-200 group-hover:scale-110">
                {item.icon}
              </span>
              {item.label}
            </NavLink>
          ))}
        </nav>

        {/* User + Logout */}
        <div className="px-3 pb-5 border-t border-white/5 pt-4 space-y-3">
          {user && (
            <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-white/5">
              <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold text-white flex-shrink-0"
                style={{ background: 'linear-gradient(135deg, #a855f7, #ec4899)' }}>
                {avatarLetter}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-white truncate">{user.display_name}</p>
                <p className="text-xs text-slate-400 truncate">{user.email}</p>
              </div>
            </div>
          )}
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-all duration-200"
          >
            <LogOut size={18} />
            Logout
          </button>
        </div>
      </aside>

      {/* ── Main Content ─────────────────────────────────────── */}
      <main className="flex-1 md:ml-60 min-h-screen pb-20 md:pb-0">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
          <Outlet />
        </div>
      </main>

      {/* ── Mobile Bottom Tab Bar ────────────────────────────── */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 flex items-center justify-around h-16"
        style={{
          background: 'linear-gradient(180deg, #1e293b, #0f172a)',
          borderTop: '1px solid rgba(255,255,255,0.08)',
        }}
      >
        {navItems.map(item => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `flex flex-col items-center justify-center gap-0.5 px-4 py-2 rounded-xl transition-all duration-200 ${
                isActive ? 'text-emerald-400' : 'text-slate-500 hover:text-slate-300'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <span className={`transition-transform duration-200 ${isActive ? 'scale-110' : ''}`}>
                  {item.icon}
                </span>
                <span className="text-[10px] font-semibold">{item.label}</span>
              </>
            )}
          </NavLink>
        ))}
        <button
          onClick={handleLogout}
          className="flex flex-col items-center justify-center gap-0.5 px-4 py-2 rounded-xl text-slate-500 hover:text-red-400 transition-all duration-200"
        >
          <LogOut size={20} />
          <span className="text-[10px] font-semibold">Logout</span>
        </button>
      </nav>
    </div>
  );
}
