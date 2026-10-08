import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { GoogleLogin } from '@react-oauth/google';
import { Activity, Camera, Flame, Moon, Sun, Zap } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

export default function Login() {
  const { login } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [error, setError] = useState('');

  const handleGoogleSuccess = async (credentialResponse: any) => {
    try {
      const res = await axios.post('http://localhost:3000/api/auth/google', {
        id_token: credentialResponse.credential,
      });
      login(res.data.token, res.data.user);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Login failed');
    }
  };

  const handleDevLogin = async () => {
    try {
      const res = await axios.post('http://localhost:3000/api/auth/dev-login');
      login(res.data.token, res.data.user);
      navigate('/dashboard');
    } catch (err: any) {
      setError('Dev Login failed');
    }
  };

  return (
    <div className="login-page min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      <button
        type="button"
        onClick={toggleTheme}
        className="theme-toggle login-theme-toggle"
        aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
        title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
      >
        {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
      </button>
      {/* Decorative blobs */}
      <div className="absolute top-[-10%] left-[-5%] w-96 h-96 rounded-full opacity-20 blur-3xl pointer-events-none"
        style={{ background: 'radial-gradient(circle, #22c55e, transparent)' }} />
      <div className="absolute bottom-[-10%] right-[-5%] w-96 h-96 rounded-full opacity-20 blur-3xl pointer-events-none"
        style={{ background: 'radial-gradient(circle, #14b8a6, transparent)' }} />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full opacity-10 blur-3xl pointer-events-none"
        style={{ background: 'radial-gradient(circle, #4ade80, transparent)' }} />

      {/* Glass card */}
      <div
        className="login-card relative w-full max-w-md animate-slide-up"
        style={{
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          background: 'rgba(255,255,255,0.07)',
          border: '1px solid rgba(255,255,255,0.15)',
          borderRadius: '24px',
          boxShadow: '0 32px 64px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.1)',
          padding: '40px 36px',
        }}
      >
        {/* Logo */}
        <div className="flex flex-col items-center mb-6">
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4 animate-pulse-glow"
            style={{ background: 'linear-gradient(135deg, #22c55e, #14b8a6)' }}
          >
            <Activity size={32} className="text-white" />
          </div>
          <h1
            className="text-4xl font-black tracking-tight bg-clip-text text-transparent"
            style={{ backgroundImage: 'linear-gradient(90deg, #4ade80, #2dd4bf)' }}
          >
            NutriVision AI
          </h1>
          <p className="text-slate-400 text-sm mt-2 text-center">
            Your AI-powered nutrition companion
          </p>
        </div>

        {/* Feature badges */}
        <div className="flex flex-wrap justify-center gap-2 mb-8">
          {[
            { icon: <Camera size={12} />, label: 'Photo Analysis' },
            { icon: <Flame size={12} />,  label: 'Calorie Tracking' },
            { icon: <Zap size={12} />,    label: 'Macro Goals' },
          ].map(badge => (
            <span
              key={badge.label}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold text-emerald-300"
              style={{
                background: 'rgba(34,197,94,0.12)',
                border: '1px solid rgba(34,197,94,0.25)',
              }}
            >
              {badge.icon}
              {badge.label}
            </span>
          ))}
        </div>

        {/* Error */}
        {error && (
          <div
            className="mb-5 px-4 py-3 rounded-xl text-sm font-medium text-red-300 animate-fade-in"
            style={{
              background: 'rgba(239,68,68,0.12)',
              border: '1px solid rgba(239,68,68,0.25)',
            }}
          >
            {error}
          </div>
        )}

        {/* Auth buttons */}
        <div className="flex flex-col gap-4 items-center">
          {/* Google Login — rendered inside a styled wrapper */}
          <div
            className="w-full overflow-hidden rounded-xl"
            style={{ boxShadow: '0 4px 20px rgba(0,0,0,0.3)' }}
          >
            <GoogleLogin
              onSuccess={handleGoogleSuccess}
              onError={() => setError('Google Login Failed')}
              width="100%"
              theme="filled_black"
              shape="rectangular"
              size="large"
              text="signin_with"
            />
          </div>

          {/* Divider */}
          <div className="flex items-center w-full gap-3">
            <div className="flex-1 h-px bg-white/10" />
            <span className="text-slate-500 text-xs font-medium">OR</span>
            <div className="flex-1 h-px bg-white/10" />
          </div>

          {/* Dev login */}
          <button
            onClick={handleDevLogin}
            className="relative w-full py-3 px-4 rounded-xl text-sm font-bold text-slate-300 transition-all duration-200 hover:text-white overflow-hidden group"
            style={{
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.12)',
            }}
          >
            <span className="relative z-10 flex items-center justify-center gap-2">
              <span className="font-mono text-emerald-400 text-xs">&lt;/&gt;</span>
              Developer Login (Bypass Google)
            </span>
            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
              style={{ background: 'rgba(255,255,255,0.04)' }} />
          </button>
        </div>

        {/* Footer */}
        <p className="text-center text-slate-600 text-xs mt-6">
          By signing in, you agree to our Terms & Privacy Policy
        </p>
      </div>
    </div>
  );
}
