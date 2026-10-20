import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import {
  Camera,
  Upload,
  CheckCircle,
  Search,
  Edit2,
  X,
  Plus,
  Sparkles,
  AlertCircle,
  Coffee,
  Sun,
  Moon,
  Apple,
  Loader2,
  Scan,
  ArrowRight,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { API_BASE_URL } from '../config';

interface FoodItem {
  food_id: number;
  name: string;
  brand?: string;
  category_name?: string;
  energy_kcal?: number;
  protein_g?: number;
  carbs_g?: number;
  fat_g?: number;
}

interface MealTypeOption {
  value: string;
  label: string;
  icon: React.ReactNode;
  activeColor: string;
}

const MEAL_TYPES: MealTypeOption[] = [
  { value: 'breakfast', label: 'Breakfast', icon: <Coffee size={16} />, activeColor: 'from-amber-500/20 to-orange-500/10 border-amber-500/40 text-amber-300' },
  { value: 'lunch', label: 'Lunch', icon: <Sun size={16} />, activeColor: 'from-emerald-500/20 to-teal-500/10 border-emerald-500/40 text-emerald-300' },
  { value: 'dinner', label: 'Dinner', icon: <Moon size={16} />, activeColor: 'from-blue-500/20 to-indigo-500/10 border-blue-500/40 text-blue-300' },
  { value: 'snack', label: 'Snack', icon: <Apple size={16} />, activeColor: 'from-purple-500/20 to-pink-500/10 border-purple-500/40 text-purple-300' },
];

export default function LogMeal() {
  const { token } = useAuth();
  const navigate = useNavigate();

  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [mealType, setMealType] = useState('lunch');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [analysisResult, setAnalysisResult] = useState<any>(null);

  // Manual addition state
  const [manualMode, setManualMode] = useState(false);
  const [manualSearchQuery, setManualSearchQuery] = useState('');
  const [manualSearchResults, setManualSearchResults] = useState<FoodItem[]>([]);
  const [searchingManual, setSearchingManual] = useState(false);
  const [manualQuantity, setManualQuantity] = useState<number>(100);
  const [submittingManual, setSubmittingManual] = useState(false);

  // Correction Modal State
  const [editingItem, setEditingItem] = useState<any>(null);
  const [correctionQuery, setCorrectionQuery] = useState('');
  const [correctionResults, setCorrectionResults] = useState<FoodItem[]>([]);
  const [searchingCorrection, setSearchingCorrection] = useState(false);
  const [selectedCorrectionFood, setSelectedCorrectionFood] = useState<FoodItem | null>(null);
  const [newQuantity, setNewQuantity] = useState<number | ''>('');
  const [correcting, setCorrecting] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const authHeaders = token ? { Authorization: `Bearer ${token}` } : undefined;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) {
      setFile(f);
      setPreview(URL.createObjectURL(f));
      setError('');
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const f = e.dataTransfer.files?.[0];
    if (f && (f.type === 'image/jpeg' || f.type === 'image/png')) {
      setFile(f);
      setPreview(URL.createObjectURL(f));
      setError('');
    }
  };

  const handleUploadAndAnalyze = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;

    setLoading(true);
    setError('');

    const formData = new FormData();
    formData.append('image', file);
    formData.append('meal_type', mealType);

    try {
      const response = await axios.post(`${API_BASE_URL}/api/meals/analyze`, formData, {
        headers: { 'Content-Type': 'multipart/form-data', ...authHeaders },
      });
      setAnalysisResult(response.data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to analyze meal. Please check image format or try again.');
    } finally {
      setLoading(false);
    }
  };

  // Debounced Food Search for Manual Add
  useEffect(() => {
    if (manualSearchQuery.trim().length < 2) {
      setManualSearchResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      try {
        setSearchingManual(true);
        const res = await axios.get<FoodItem[]>(
          `${API_BASE_URL}/api/foods/search?q=${encodeURIComponent(manualSearchQuery.trim())}`,
          { headers: authHeaders }
        );
        setManualSearchResults(res.data || []);
      } catch (err) {
        console.error('Manual food search failed', err);
      } finally {
        setSearchingManual(false);
      }
    }, 350);

    return () => clearTimeout(timer);
  }, [manualSearchQuery, token]);

  // Debounced Food Search for Correction
  useEffect(() => {
    if (correctionQuery.trim().length < 2) {
      setCorrectionResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      try {
        setSearchingCorrection(true);
        const res = await axios.get<FoodItem[]>(
          `${API_BASE_URL}/api/foods/search?q=${encodeURIComponent(correctionQuery.trim())}`,
          { headers: authHeaders }
        );
        setCorrectionResults(res.data || []);
      } catch (err) {
        console.error('Correction search failed', err);
      } finally {
        setSearchingCorrection(false);
      }
    }, 350);

    return () => clearTimeout(timer);
  }, [correctionQuery, token]);

  const handleConfirmAddItem = async (food: FoodItem) => {
    if (!manualQuantity || manualQuantity <= 0) {
      alert('Please enter a valid portion in grams.');
      return;
    }

    setSubmittingManual(true);
    setError('');

    try {
      let targetMealId = analysisResult?.meal_id;
      if (!targetMealId) {
        const createMealRes = await axios.post(
          `${API_BASE_URL}/api/meals`,
          { meal_type: mealType },
          { headers: authHeaders }
        );
        targetMealId = createMealRes.data.meal_id;
      }

      const addRes = await axios.post(
        `${API_BASE_URL}/api/meals/${targetMealId}/items`,
        { food_id: food.food_id, quantity_grams: Number(manualQuantity) },
        { headers: authHeaders }
      );

      setAnalysisResult(addRes.data);
      setManualQuantity(100);
      setManualSearchQuery('');
      setManualSearchResults([]);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to add food item to meal');
    } finally {
      setSubmittingManual(false);
    }
  };

  const openCorrectionModal = (item: any) => {
    setEditingItem(item);
    setNewQuantity(item.quantity_grams || 100);
    setCorrectionQuery('');
    setCorrectionResults([]);
    setSelectedCorrectionFood(null);
  };

  const handleSaveCorrection = async () => {
    if (!editingItem || !analysisResult?.meal_id) return;
    setCorrecting(true);

    try {
      const payload: any = {
        quantity_grams: Number(newQuantity) || editingItem.quantity_grams,
      };
      if (selectedCorrectionFood) {
        payload.food_id = selectedCorrectionFood.food_id;
      }

      const res = await axios.put(
        `${API_BASE_URL}/api/meals/${analysisResult.meal_id}/items/${editingItem.item_id}`,
        payload,
        { headers: authHeaders }
      );

      setAnalysisResult(res.data);
      setEditingItem(null);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to correct item.');
    } finally {
      setCorrecting(false);
    }
  };

  // If a meal has been analyzed/created, display the interactive results review view
  if (analysisResult) {
    const items = analysisResult.items || analysisResult.meal_items || [];

    return (
      <div className="max-w-3xl mx-auto space-y-6 animate-fade-in">
        {/* Success Header Banner */}
        <div className="glass-panel rounded-3xl p-6 sm:p-8 text-center relative overflow-hidden">
          <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto mb-4 text-emerald-400">
            <CheckCircle size={32} />
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white">Meal Logged Successfully!</h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-md mx-auto">
            Computer vision identified items on your plate. You can refine weights or add side items below.
          </p>

          {/* Macro Summary Strip */}
          <div className="mt-6 p-4 rounded-2xl bg-slate-900/80 border border-white/5 flex flex-wrap items-center justify-around gap-4">
            <div className="text-center">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Total Energy</span>
              <span className="text-2xl font-black text-emerald-400 mt-0.5 block">
                {Math.round(analysisResult.total_calories || 0)} <span className="text-xs text-slate-400">kcal</span>
              </span>
            </div>
            <div className="h-8 w-px bg-white/10 hidden sm:block" />
            <div className="text-center">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Protein</span>
              <span className="text-xl font-black text-white mt-0.5 block">{Math.round(analysisResult.total_protein_g || 0)}g</span>
            </div>
            <div className="h-8 w-px bg-white/10 hidden sm:block" />
            <div className="text-center">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Carbs</span>
              <span className="text-xl font-black text-white mt-0.5 block">{Math.round(analysisResult.total_carbs_g || 0)}g</span>
            </div>
            <div className="h-8 w-px bg-white/10 hidden sm:block" />
            <div className="text-center">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Fats</span>
              <span className="text-xl font-black text-white mt-0.5 block">{Math.round(analysisResult.total_fat_g || 0)}g</span>
            </div>
          </div>
        </div>

        {/* Logged Items List with Edit Actions */}
        <div className="glass-panel rounded-3xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">Detected & Logged Foods</h3>
            <span className="text-xs text-slate-400">{items.length} {items.length === 1 ? 'item' : 'items'}</span>
          </div>

          <div className="space-y-3">
            {items.map((item: any, idx: number) => (
              <div
                key={idx}
                className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 hover:border-white/15 transition flex items-center justify-between gap-4"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-white truncate">{item.food_name || item.food?.name}</span>
                    {item.user_corrected && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/20">
                        Adjusted
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-slate-400 mt-0.5 flex items-center gap-2">
                    <span>{item.quantity_grams}g</span>
                    <span>•</span>
                    <span className="text-emerald-400 font-semibold">{Math.round(item.estimated_calories)} kcal</span>
                  </div>
                </div>

                <button
                  onClick={() => openCorrectionModal(item)}
                  className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white transition flex items-center gap-1.5 text-xs font-semibold"
                  title="Edit portion or match"
                >
                  <Edit2 size={14} />
                  <span className="hidden sm:inline">Edit</span>
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Add Side Item to Meal Section */}
        <div className="glass-panel rounded-3xl p-6">
          <div className="flex items-center gap-2 mb-3">
            <Plus size={16} className="text-emerald-400" />
            <h3 className="text-sm font-bold text-white">Add Extra Food to this Meal</h3>
          </div>
          <div className="relative mb-3">
            <Search className="absolute left-3.5 top-3 text-slate-500" size={16} />
            <input
              type="text"
              placeholder="Search food by name (e.g., Rice, Dal, Salad, Paneer)..."
              value={manualSearchQuery}
              onChange={(e) => setManualSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl glass-input text-sm"
            />
          </div>

          {searchingManual && (
            <div className="p-4 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
              <Loader2 size={16} className="animate-spin text-emerald-400" />
              Searching nutrition database...
            </div>
          )}

          {manualSearchResults.length > 0 && (
            <div className="max-h-56 overflow-y-auto space-y-1.5 p-2 rounded-xl bg-slate-900/90 border border-white/5">
              {manualSearchResults.map((food) => (
                <div
                  key={food.food_id}
                  className="p-2.5 rounded-lg hover:bg-white/5 flex items-center justify-between text-xs transition"
                >
                  <div>
                    <span className="font-bold text-slate-200 block">{food.name}</span>
                    <span className="text-slate-500 text-[10px]">
                      {food.category_name || 'Standard Food'} • {Math.round(food.energy_kcal || 0)} kcal/100g
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min={10}
                      max={2000}
                      defaultValue={100}
                      onChange={(e) => setManualQuantity(Number(e.target.value))}
                      className="w-16 px-2 py-1 rounded bg-black/40 border border-white/10 text-right text-xs"
                    />
                    <span className="text-[10px] text-slate-400">g</span>
                    <button
                      disabled={submittingManual}
                      onClick={() => handleConfirmAddItem(food)}
                      className="px-2.5 py-1 rounded bg-emerald-500 text-slate-950 font-bold text-xs hover:bg-emerald-400 transition"
                    >
                      Add
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="flex justify-end gap-3 pt-6 border-t border-white/5 mt-6">
            <button
              onClick={() => {
                setAnalysisResult(null);
                setFile(null);
                setPreview(null);
              }}
              className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-bold text-slate-300 transition"
            >
              Log Another Meal
            </button>
            <button
              onClick={() => navigate('/dashboard')}
              className="flex items-center gap-2 px-5 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 font-bold text-xs shadow-lg shadow-emerald-500/20 hover:opacity-90 transition"
            >
              <span>Go to Dashboard</span>
              <ArrowRight size={14} />
            </button>
          </div>
        </div>

        {/* Edit / Correction Modal */}
        {editingItem && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
            <div className="glass-panel rounded-3xl p-6 sm:p-7 max-w-md w-full space-y-4 border border-white/15 shadow-2xl">
              <div className="flex items-center justify-between pb-3 border-b border-white/10">
                <h3 className="font-bold text-base text-white">Adjust Food Item</h3>
                <button
                  onClick={() => setEditingItem(null)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10"
                >
                  <X size={18} />
                </button>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-400 block mb-1">Serving Portion (Grams)</label>
                <input
                  type="number"
                  value={newQuantity}
                  onChange={(e) => setNewQuantity(e.target.value === '' ? '' : Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl glass-input text-sm font-semibold"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-400 block mb-1">Replace Food Match (Optional)</label>
                <div className="relative">
                  <Search className="absolute left-3 top-2.5 text-slate-500" size={15} />
                  <input
                    type="text"
                    placeholder="Search replacement food..."
                    value={correctionQuery}
                    onChange={(e) => setCorrectionQuery(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 rounded-xl glass-input text-xs"
                  />
                </div>

                {searchingCorrection && (
                  <div className="p-3 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
                    <Loader2 size={14} className="animate-spin text-emerald-400" />
                    Searching alternatives...
                  </div>
                )}

                {correctionResults.length > 0 && (
                  <div className="max-h-36 overflow-y-auto mt-2 space-y-1 p-1 rounded-xl bg-slate-900 border border-white/10">
                    {correctionResults.map((food) => (
                      <button
                        key={food.food_id}
                        type="button"
                        onClick={() => setSelectedCorrectionFood(food)}
                        className={`w-full text-left p-2 rounded-lg text-xs transition flex justify-between ${
                          selectedCorrectionFood?.food_id === food.food_id
                            ? 'bg-emerald-500/20 text-emerald-300 font-bold'
                            : 'hover:bg-white/5 text-slate-300'
                        }`}
                      >
                        <span>{food.name}</span>
                        <span className="text-slate-500">{Math.round(food.energy_kcal || 0)} kcal</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setEditingItem(null)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={correcting}
                  onClick={handleSaveCorrection}
                  className="px-4 py-2 rounded-xl bg-emerald-500 text-slate-950 font-bold text-xs hover:bg-emerald-400 transition"
                >
                  {correcting ? 'Saving...' : 'Save Adjustments'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Primary Meal Logging View (Photo Upload & Scan)
  return (
    <div className="max-w-2xl mx-auto space-y-8 animate-fade-in">
      {/* Title Header */}
      <div className="text-center sm:text-left flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center justify-center sm:justify-start gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <Camera size={20} />
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white">Log Your Meal</h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-400 mt-1 font-medium">
            Upload or capture your food plate for zero-effort AI macro breakdown.
          </p>
        </div>

        {/* Mode Toggle Button */}
        <button
          onClick={() => setManualMode(!manualMode)}
          className="inline-flex items-center justify-center gap-2 px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-bold text-slate-300 transition"
        >
          {manualMode ? <Camera size={14} /> : <Search size={14} />}
          <span>{manualMode ? 'Switch to Camera' : 'Manual Text Search'}</span>
        </button>
      </div>

      {error && (
        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs sm:text-sm flex items-center gap-3">
          <AlertCircle size={18} className="flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Meal Type Selection */}
      <div className="space-y-2">
        <label className="text-xs font-bold uppercase tracking-wider text-slate-400">Meal Time</label>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {MEAL_TYPES.map((option) => {
            const isSelected = mealType === option.value;
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => setMealType(option.value)}
                className={`p-3.5 rounded-2xl border transition-all duration-200 flex items-center gap-3 ${
                  isSelected
                    ? `bg-gradient-to-r ${option.activeColor} shadow-lg`
                    : 'bg-slate-900/40 border-white/5 text-slate-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <div
                  className={`p-2 rounded-xl ${
                    isSelected ? 'bg-white/20 text-white' : 'bg-white/5 text-slate-400'
                  }`}
                >
                  {option.icon}
                </div>
                <span className="text-xs font-bold capitalize">{option.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Mode A: Photo AI Scanner */}
      {!manualMode ? (
        <form onSubmit={handleUploadAndAnalyze} className="space-y-6">
          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`relative rounded-3xl border-2 border-dashed p-8 text-center cursor-pointer transition-all duration-300 overflow-hidden ${
              preview
                ? 'border-emerald-500/40 bg-slate-950/60'
                : 'border-white/15 bg-slate-900/30 hover:border-emerald-500/40 hover:bg-slate-900/60'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png"
              onChange={handleFileChange}
              className="hidden"
            />

            {preview ? (
              <div className="space-y-4">
                <div className="relative max-h-72 w-full rounded-2xl overflow-hidden mx-auto shadow-2xl">
                  <img
                    src={preview}
                    alt="Plate Preview"
                    className="w-full h-72 object-cover object-center"
                  />
                  {loading && (
                    <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm flex flex-col items-center justify-center gap-3">
                      <Scan size={36} className="text-emerald-400 animate-pulse" />
                      <div className="text-center">
                        <span className="text-sm font-black text-white block">Analyzing Ingredients...</span>
                        <span className="text-xs text-emerald-400 font-medium">Running Computer Vision & Depth Math</span>
                      </div>
                    </div>
                  )}
                </div>
                <p className="text-xs font-semibold text-slate-400">Click to choose a different photo</p>
              </div>
            ) : (
              <div className="py-8 space-y-3">
                <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto text-emerald-400 group-hover:scale-110 transition">
                  <Upload size={28} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Upload or Drop Meal Picture</h3>
                  <p className="text-xs text-slate-400 mt-1">Supports JPEG, PNG up to 10MB</p>
                </div>
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 text-[11px] font-semibold text-slate-400 border border-white/5">
                  <Sparkles size={12} className="text-emerald-400" />
                  <span>Auto-detects portion, calories & macros</span>
                </div>
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={!file || loading}
            className={`w-full py-3.5 px-6 rounded-2xl font-black text-sm flex items-center justify-center gap-2 transition shadow-xl ${
              file && !loading
                ? 'bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 text-slate-950 shadow-emerald-500/25 hover:opacity-95 hover:scale-[1.01] active:scale-[0.99]'
                : 'bg-white/10 text-slate-500 cursor-not-allowed border border-white/5'
            }`}
          >
            {loading ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                <span>Scanning Meal with Computer Vision...</span>
              </>
            ) : (
              <>
                <Sparkles size={18} />
                <span>Run AI Plate Analysis</span>
              </>
            )}
          </button>
        </form>
      ) : (
        /* Mode B: Manual Search & Add */
        <div className="glass-panel rounded-3xl p-6 sm:p-7 space-y-4">
          <div>
            <h3 className="text-sm font-bold text-white mb-1">Search Food Database</h3>
            <p className="text-xs text-slate-400">Search verified USDA & IFCT nutrition databases</p>
          </div>

          <div className="relative">
            <Search className="absolute left-3.5 top-3 text-slate-500" size={16} />
            <input
              type="text"
              placeholder="Search food (e.g. Boiled Rice, Dal, Dosa, Chicken Breast, Pizza)..."
              value={manualSearchQuery}
              onChange={(e) => setManualSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl glass-input text-sm"
            />
          </div>

          {searchingManual && (
            <div className="py-6 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
              <Loader2 size={16} className="animate-spin text-emerald-400" />
              Searching foods...
            </div>
          )}

          {manualSearchResults.length > 0 && (
            <div className="max-h-64 overflow-y-auto space-y-2 p-1">
              {manualSearchResults.map((food) => (
                <div
                  key={food.food_id}
                  className="p-3 rounded-xl bg-white/[0.02] border border-white/5 hover:border-white/15 transition flex items-center justify-between gap-3 text-xs"
                >
                  <div>
                    <span className="font-bold text-white block text-sm">{food.name}</span>
                    <span className="text-[11px] text-slate-400">
                      {Math.round(food.energy_kcal || 0)} kcal • P: {food.protein_g || 0}g • C: {food.carbs_g || 0}g • F: {food.fat_g || 0}g (per 100g)
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min={10}
                      defaultValue={100}
                      onChange={(e) => setManualQuantity(Number(e.target.value))}
                      className="w-16 px-2 py-1 rounded bg-black/40 border border-white/10 text-right text-xs"
                    />
                    <span className="text-slate-500 text-[10px]">g</span>
                    <button
                      disabled={submittingManual}
                      onClick={() => handleConfirmAddItem(food)}
                      className="px-3 py-1.5 rounded-lg bg-emerald-500 text-slate-950 font-bold hover:bg-emerald-400 transition"
                    >
                      Log
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
