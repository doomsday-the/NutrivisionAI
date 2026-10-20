import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { GoogleLogin } from '@react-oauth/google';
import {
  Zap,
  Camera,
  Flame,
  ShieldCheck,
  Sparkles,
  ArrowRight,
  Layers,
} from 'lucide-react';
import { API_BASE_URL } from '../config';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const [loadingDev, setLoadingDev] = useState(false);

  const handleGoogleSuccess = async (credentialResponse: any) => {
    try {
      const res = await axios.post(`${API_BASE_URL}/api/auth/google`, {
        id_token: credentialResponse.credential,
      });
      login(res.data.token, res.data.user);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Google authentication failed');
    }
  };

  const handleDevLogin = async () => {
    try {
      setLoadingDev(true);
      setError('');
      const res = await axios.post(`${API_BASE_URL}/api/auth/dev-login`);
      login(res.data.token, res.data.user);
      navigate('/dashboard');
    } catch (err: any) {
      setError('Dev Login failed. Please ensure the backend service is running.');
    } finally {
      setLoadingDev(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden bg-[#faf7f2]">
      {/* Warm Ambient Background Glows */}
      <div className="absolute -top-32 -left-32 w-[500px] h-[500px] rounded-full bg-amber-500/10 blur-[130px] pointer-events-none" />
      <div className="absolute -bottom-32 -right-32 w-[500px] h-[500px] rounded-full bg-emerald-500/10 blur-[130px] pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[650px] h-[650px] rounded-full bg-orange-500/5 blur-[150px] pointer-events-none" />

      {/* Main Glass Card */}
      <div className="relative w-full max-w-md glass-panel rounded-3xl p-8 sm:p-10 bg-white/90 border border-stone-200/90 shadow-xl shadow-stone-300/40 animate-fade-in">
        {/* Brand / Logo */}
        <div className="flex flex-col items-center text-center mb-8">
          <div className="relative w-16 h-16 rounded-2xl bg-gradient-to-tr from-emerald-600 via-teal-600 to-amber-500 p-0.5 shadow-lg shadow-emerald-700/20 mb-4 animate-float">
            <div className="w-full h-full bg-white rounded-[14px] flex items-center justify-center shadow-inner">
              <Zap size={28} className="text-emerald-600 fill-emerald-600" />
            </div>
            <div className="absolute -inset-1 rounded-2xl bg-emerald-500/20 blur-md -z-10" />
          </div>

          <div className="flex items-center gap-2">
            <h1 className="text-3xl font-black tracking-tight text-stone-900">NutriVision</h1>
            <span className="text-xs font-black px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
              AI
            </span>
          </div>
          <p className="text-xs sm:text-sm text-stone-500 mt-1 font-medium">
            Computer vision nutrition intelligence & macro tracking
          </p>
        </div>

        {/* Feature Badges */}
        <div className="flex flex-wrap justify-center gap-2 mb-8">
          {[
            { icon: <Camera size={12} />, label: 'Single-Shot CV' },
            { icon: <Layers size={12} />, label: 'Depth Estimation' },
            { icon: <Flame size={12} />, label: 'Dynamic TDEE' },
          ].map((badge) => (
            <span
              key={badge.label}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold text-stone-700 bg-stone-50 border border-stone-200 shadow-2xs"
            >
              <span className="text-emerald-600">{badge.icon}</span>
              <span>{badge.label}</span>
            </span>
          ))}
        </div>

        {error && (
          <div className="mb-6 p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold text-center">
            {error}
          </div>
        )}

        {/* Action Buttons */}
        <div className="space-y-4">
          {/* Quick Dev Login */}
          <button
            onClick={handleDevLogin}
            disabled={loadingDev}
            className="w-full relative group overflow-hidden py-3.5 px-6 rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-600 to-amber-600 text-white font-black text-sm shadow-md shadow-emerald-700/20 hover:opacity-95 hover:scale-[1.01] active:scale-[0.99] transition-all flex items-center justify-center gap-2"
          >
            <Sparkles size={16} />
            <span>{loadingDev ? 'Authenticating Session...' : 'Instant Demo Login (Bypass)'}</span>
            <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
          </button>

          <div className="flex items-center gap-3 my-2">
            <div className="h-px bg-stone-200 flex-1" />
            <span className="text-[11px] font-bold uppercase tracking-wider text-stone-400">Or Continue With</span>
            <div className="h-px bg-stone-200 flex-1" />
          </div>

          {/* Google OAuth Login */}
          <div className="flex justify-center pt-1">
            <GoogleLogin
              onSuccess={handleGoogleSuccess}
              onError={() => setError('Google Authentication Failed')}
              theme="outline"
              shape="pill"
              text="signin_with"
            />
          </div>
        </div>

        {/* Security / Privacy Footer */}
        <div className="mt-8 pt-5 border-t border-stone-200 flex items-center justify-center gap-2 text-[11px] font-semibold text-stone-400">
          <ShieldCheck size={14} className="text-emerald-600" />
          <span>Local Development Environment Active</span>
        </div>
      </div>
    </div>
  );
}
