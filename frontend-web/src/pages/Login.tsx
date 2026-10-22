import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { GoogleLogin } from '@react-oauth/google';
import {
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
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden bg-[#071013] text-white">
      {/* Subtle Ambient Radial Glow */}
      <div className="absolute -top-40 -left-40 w-[550px] h-[550px] rounded-full bg-emerald-500/10 blur-[140px] pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-[550px] h-[550px] rounded-full bg-teal-500/10 blur-[140px] pointer-events-none" />

      {/* Main Card */}
      <div className="relative w-full max-w-md health-card p-8 sm:p-10 bg-[#0b171b] border-[#18282c] shadow-2xl animate-fade-in">
        {/* Brand / Logo */}
        <div className="flex flex-col items-center text-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-[#081f18] via-[#0f2d24] to-[#144234] border border-[#1b5543] flex items-center justify-center text-emerald-400 shadow-xl mb-4">
            <span className="text-2xl font-black">✳</span>
          </div>

          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">NutriVision</h1>
            <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-[#0b271e] text-[#34d399] border border-[#14533e]">
              PRO
            </span>
          </div>
          <p className="text-xs sm:text-sm text-[#8ba0a6] mt-1.5 font-normal">
            Computer vision nutrition intelligence & metabolic tracking
          </p>
        </div>

        {/* Feature Badges */}
        <div className="flex flex-wrap justify-center gap-2 mb-8">
          {[
            { icon: <Camera size={11} />, label: 'Plate Detection' },
            { icon: <Layers size={11} />, label: 'Depth Estimation' },
            { icon: <Flame size={11} />, label: 'Dynamic TDEE' },
          ].map((badge) => (
            <span
              key={badge.label}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold text-[#8ba0a6] bg-[#081215] border border-[#18282c]"
            >
              <span className="text-emerald-400">{badge.icon}</span>
              <span>{badge.label}</span>
            </span>
          ))}
        </div>

        {error && (
          <div className="mb-5 p-3 rounded-xl bg-[#281014] border border-[#521c25] text-[#fb7185] text-xs font-semibold text-center">
            {error}
          </div>
        )}

        {/* Action Buttons */}
        <div className="space-y-4">
          {/* Quick Dev Login: High-Contrast White */}
          <button
            onClick={handleDevLogin}
            disabled={loadingDev}
            className="w-full relative group py-3.5 px-5 rounded-xl bg-white hover:bg-slate-200 text-black font-extrabold text-sm shadow-xl active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            <Sparkles size={16} />
            <span>{loadingDev ? 'Authenticating Session...' : 'Instant Demo Login (Bypass)'}</span>
            <ArrowRight size={16} className="group-hover:translate-x-0.5 transition-transform" />
          </button>

          <div className="flex items-center gap-3 my-2">
            <div className="h-px bg-[#18282c] flex-1" />
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#566c73]">Or Continue With</span>
            <div className="h-px bg-[#18282c] flex-1" />
          </div>

          {/* Google OAuth Login */}
          <div className="flex justify-center pt-1">
            <GoogleLogin
              onSuccess={handleGoogleSuccess}
              onError={() => setError('Google Authentication Failed')}
              theme="filled_black"
              shape="pill"
              text="signin_with"
            />
          </div>
        </div>

        {/* Security / Privacy Footer */}
        <div className="mt-8 pt-4 border-t border-[#18282c] flex items-center justify-center gap-1.5 text-[10px] font-semibold text-[#566c73]">
          <ShieldCheck size={13} className="text-emerald-400" />
          <span>Local Development Environment Active</span>
        </div>
      </div>
    </div>
  );
}
