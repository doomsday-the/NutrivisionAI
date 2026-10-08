import { useState, useRef } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { Camera, Upload, Coffee, Sun, Moon, Apple, Loader2 } from 'lucide-react';

interface MealTypeOption {
  value: string;
  label: string;
  emoji: string;
  icon: React.ReactNode;
  color: string;
  activeGradient: string;
}

const MEAL_TYPES: MealTypeOption[] = [
  { value: 'breakfast', label: 'Breakfast', emoji: '🌅', icon: <Coffee size={16} />, color: '#eab308', activeGradient: 'linear-gradient(135deg, #854d0e, #eab308)' },
  { value: 'lunch',     label: 'Lunch',     emoji: '☀️', icon: <Sun size={16} />,    color: '#22c55e', activeGradient: 'linear-gradient(135deg, #14532d, #22c55e)' },
  { value: 'dinner',    label: 'Dinner',    emoji: '🌙', icon: <Moon size={16} />,   color: '#3b82f6', activeGradient: 'linear-gradient(135deg, #1e3a8a, #3b82f6)' },
  { value: 'snack',     label: 'Snack',     emoji: '🍎', icon: <Apple size={16} />,  color: '#a855f7', activeGradient: 'linear-gradient(135deg, #581c87, #a855f7)' },
];

export default function LogMeal() {
  const [file, setFile] = useState<File | null>(null);
  const [mealType, setMealType] = useState('lunch');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [preview, setPreview] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;

    setLoading(true);
    setError('');

    const formData = new FormData();
    formData.append('image', file);
    formData.append('meal_type', mealType);

    try {
      await axios.post('http://localhost:3000/api/meals/analyze', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to analyze meal');
      setLoading(false);
    }
  };

  const handleFileChange = (f: File | null) => {
    setFile(f);
    if (f) {
      const url = URL.createObjectURL(f);
      setPreview(url);
    } else {
      setPreview(null);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const dropped = e.dataTransfer.files[0];
    if (dropped && (dropped.type === 'image/jpeg' || dropped.type === 'image/png')) {
      handleFileChange(dropped);
    }
  };

  return (
    <div className="max-w-lg mx-auto space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div
          className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: 'linear-gradient(135deg, #22c55e, #14b8a6)' }}
        >
          <Camera size={22} className="text-white" />
        </div>
        <div>
          <h1
            className="text-2xl font-black bg-clip-text text-transparent"
            style={{ backgroundImage: 'linear-gradient(90deg, #4ade80, #2dd4bf)' }}
          >
            Log a Meal
          </h1>
          <p className="text-slate-400 text-sm">AI-powered nutrition analysis</p>
        </div>
      </div>

      {/* Error alert */}
      {error && (
        <div
          className="px-4 py-3 rounded-xl text-sm font-medium text-red-300 animate-slide-up"
          style={{
            background: 'linear-gradient(135deg, rgba(239,68,68,0.15), rgba(185,28,28,0.10))',
            border: '1px solid rgba(239,68,68,0.3)',
          }}
        >
          ⚠️ {error}
        </div>
      )}

      <form onSubmit={handleUpload} className="space-y-6">
        {/* Meal type selector */}
        <div
          className="rounded-2xl p-5"
          style={{
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.08)',
          }}
        >
          <label className="block text-sm font-bold text-slate-300 mb-3">Meal Type</label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {MEAL_TYPES.map(type => {
              const isActive = mealType === type.value;
              return (
                <button
                  key={type.value}
                  type="button"
                  onClick={() => setMealType(type.value)}
                  className="relative flex flex-col items-center gap-1.5 py-3 px-2 rounded-xl text-sm font-semibold transition-all duration-200"
                  style={
                    isActive
                      ? {
                          background: type.activeGradient,
                          color: '#ffffff',
                          boxShadow: `0 4px 16px ${type.color}40`,
                          border: `1px solid ${type.color}60`,
                        }
                      : {
                          background: 'rgba(255,255,255,0.04)',
                          color: '#94a3b8',
                          border: '1px solid rgba(255,255,255,0.06)',
                        }
                  }
                >
                  <span className="text-lg leading-none">{type.emoji}</span>
                  <span className="text-xs font-bold">{type.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Upload zone */}
        <div
          className="rounded-2xl p-5"
          style={{
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.08)',
          }}
        >
          <label className="block text-sm font-bold text-slate-300 mb-3">Food Image</label>
          <div
            onClick={() => inputRef.current?.click()}
            onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            className="relative flex flex-col items-center justify-center min-h-48 rounded-xl cursor-pointer transition-all duration-300 overflow-hidden"
            style={{
              border: `2px dashed ${isDragging ? '#22c55e' : preview ? '#22c55e60' : 'rgba(255,255,255,0.12)'}`,
              background: isDragging
                ? 'rgba(34,197,94,0.08)'
                : preview
                ? 'rgba(34,197,94,0.05)'
                : 'rgba(255,255,255,0.02)',
            }}
          >
            {/* Hidden file input */}
            <input
              ref={inputRef}
              type="file"
              accept="image/jpeg, image/png"
              onChange={e => handleFileChange(e.target.files?.[0] || null)}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              style={{ display: 'none' }}
            />

            {preview ? (
              <div className="w-full h-full flex flex-col items-center gap-3 p-4">
                <img
                  src={preview}
                  alt="Preview"
                  className="max-h-40 rounded-xl object-cover shadow-lg"
                  style={{ boxShadow: '0 8px 32px rgba(0,0,0,0.4)' }}
                />
                <div className="flex flex-col items-center gap-1">
                  <span className="text-emerald-400 font-bold text-sm">{file?.name}</span>
                  <span className="text-slate-500 text-xs">Click to change image</span>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-3 p-8 text-center">
                <div
                  className="w-14 h-14 rounded-2xl flex items-center justify-center transition-transform duration-200 hover:scale-110"
                  style={{ background: 'rgba(34,197,94,0.12)', border: '1px solid rgba(34,197,94,0.2)' }}
                >
                  <Upload size={28} className="text-emerald-400" />
                </div>
                <div>
                  <p className="text-slate-300 font-semibold text-sm">
                    {isDragging ? 'Drop your image here!' : 'Click to upload or drag & drop'}
                  </p>
                  <p className="text-slate-500 text-xs mt-0.5">JPEG, PNG up to 10MB</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Submit button */}
        <button
          type="submit"
          disabled={!file || loading}
          className="relative w-full py-4 rounded-xl text-base font-black text-white overflow-hidden transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed hover:shadow-lg hover:scale-[1.01] active:scale-[0.99] shimmer-btn"
          style={{
            background: (!file || loading)
              ? 'rgba(34,197,94,0.3)'
              : 'linear-gradient(135deg, #16a34a, #22c55e, #14b8a6)',
            boxShadow: (!file || loading) ? 'none' : '0 8px 32px rgba(34,197,94,0.4)',
          }}
        >
          <span className="relative z-10 flex items-center justify-center gap-2">
            {loading ? (
              <>
                <Loader2 size={20} className="animate-spin" />
                Analyzing with AI...
              </>
            ) : (
              <>
                <Camera size={20} />
                Analyze Meal
              </>
            )}
          </span>
        </button>
      </form>

      {/* Info note */}
      <p className="text-center text-slate-600 text-xs pb-2">
        📸 Our AI will identify foods and calculate nutrition automatically
      </p>
    </div>
  );
}
