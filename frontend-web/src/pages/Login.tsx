import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { GoogleLogin } from '@react-oauth/google';

export default function Login() {
  const { login } = useAuth();
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
    <div className="flex flex-col items-center justify-center pt-20">
      <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full text-center">
        <h1 className="text-3xl font-bold text-primary-600 mb-6">NutriVision AI</h1>
        <p className="text-gray-600 mb-8">Sign in to track your meals and nutrition automatically.</p>
        
        {error && <div className="bg-red-50 text-red-600 p-3 rounded mb-4">{error}</div>}
        
        <div className="flex flex-col gap-4 items-center">
          <GoogleLogin
            onSuccess={handleGoogleSuccess}
            onError={() => setError('Google Login Failed')}
          />
          <div className="text-gray-400 text-sm">OR</div>
          <button 
            onClick={handleDevLogin}
            className="w-full bg-gray-800 text-white font-bold py-2 px-4 rounded hover:bg-gray-700 transition"
          >
            Developer Login (Bypass Google)
          </button>
        </div>
      </div>
    </div>
  );
}
