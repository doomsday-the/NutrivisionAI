import { Outlet, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LogOut, Home, Camera, User } from 'lucide-react';

export default function Layout() {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen flex flex-col">
      <nav className="bg-primary-600 text-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Link to="/dashboard" className="text-xl font-bold tracking-wider">NutriVision AI</Link>
            </div>
            {user && (
              <div className="flex items-center space-x-4">
                <Link to="/dashboard" className="p-2 hover:bg-primary-500 rounded flex items-center gap-1">
                  <Home size={18} /> <span className="hidden sm:inline">Dashboard</span>
                </Link>
                <Link to="/log-meal" className="p-2 hover:bg-primary-500 rounded flex items-center gap-1">
                  <Camera size={18} /> <span className="hidden sm:inline">Log Meal</span>
                </Link>
                <Link to="/profile" className="p-2 hover:bg-primary-500 rounded flex items-center gap-1">
                  <User size={18} /> <span className="hidden sm:inline">Profile</span>
                </Link>
                <button onClick={logout} className="p-2 hover:bg-primary-500 rounded flex items-center gap-1">
                  <LogOut size={18} /> <span className="hidden sm:inline">Logout</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </nav>

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Outlet />
      </main>
    </div>
  );
}
