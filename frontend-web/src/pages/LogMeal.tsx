import { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { Camera, Upload, CheckCircle, Search, Edit2, X, Plus, Image as ImageIcon, Sparkles, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { API_BASE_URL } from '../config';

interface FoodItem {
  food_id: number;
  name: string;
  brand?: string;
  reference_unit?: string;
  source?: { source_name: string };
}

export default function LogMeal() {
  const { token } = useAuth();
  const navigate = useNavigate();

  const [file, setFile] = useState<File | null>(null);
  const [mealType, setMealType] = useState('lunch');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [analysisResult, setAnalysisResult] = useState<any>(null);

  const [manualMode, setManualMode] = useState(false);
  const [manualSearchQuery, setManualSearchQuery] = useState('');
  const [manualSearchResults, setManualSearchResults] = useState<FoodItem[]>([]);
  const [searchingManual, setSearchingManual] = useState(false);
  const [addingFoodId, setAddingFoodId] = useState<number | null>(null);
  const [manualQuantity, setManualQuantity] = useState<number>(100);
  const [submittingManual, setSubmittingManual] = useState(false);

  const [editingItem, setEditingItem] = useState<any>(null);
  const [correctionQuery, setCorrectionQuery] = useState('');
  const [correctionResults, setCorrectionResults] = useState<any[]>([]);
  const [searchingCorrection, setSearchingCorrection] = useState(false);
  const [selectedFood, setSelectedFood] = useState<any>(null);
  const [newQuantity, setNewQuantity] = useState<number | ''>('');
  const [correcting, setCorrecting] = useState(false);

  const authHeaders = token ? { Authorization: `Bearer ${token}` } : undefined;

  const handleUpload = async (e: React.FormEvent) => {
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
      setError(err.response?.data?.message || 'Failed to analyze meal');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (manualSearchQuery.trim().length < 2) { setManualSearchResults([]); return; }
    const timer = setTimeout(async () => {
      try {
        setSearchingManual(true);
        const res = await axios.get<FoodItem[]>(`${API_BASE_URL}/api/foods/search?q=${encodeURIComponent(manualSearchQuery.trim())}`, { headers: authHeaders });
        setManualSearchResults(res.data);
      } catch (err) {
        console.error('Manual search failed', err);
      } finally {
        setSearchingManual(false);
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [manualSearchQuery, token]);

  const handleConfirmAddItem = async (food: FoodItem) => {
    if (!manualQuantity || manualQuantity <= 0) { alert('Please enter a valid quantity in grams.'); return; }
    setSubmittingManual(true);
    setError('');

    try {
      let targetMealId = analysisResult?.meal_id;
      if (!targetMealId) {
        const createMealRes = await axios.post(`${API_BASE_URL}/api/meals`, { meal_type: mealType }, { headers: authHeaders });
        targetMealId = createMealRes.data.meal_id;
      }
      const addRes = await axios.post(`${API_BASE_URL}/api/meals/${targetMealId}/items`, { food_id: food.food_id, quantity_grams: Number(manualQuantity) }, { headers: authHeaders });
      setAnalysisResult(addRes.data);
      setAddingFoodId(null);
      setManualQuantity(100);
      setManualSearchQuery('');
      setManualSearchResults([]);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to add food item to meal');
    } finally {
      setSubmittingManual(false);
    }
  };

  useEffect(() => {
    if (correctionQuery.trim().length < 2) { setCorrectionResults([]); return; }
    const debounce = setTimeout(async () => {
      try {
        setSearchingCorrection(true);
        const res = await axios.get(`${API_BASE_URL}/api/foods/search?q=${encodeURIComponent(correctionQuery.trim())}`, { headers: authHeaders });
        setCorrectionResults(res.data);
      } catch (err) {
        console.error('Correction search failed', err);
      } finally {
        setSearchingCorrection(false);
      }
    }, 400);
    return () => clearTimeout(debounce);
  }, [correctionQuery, token]);

  const openCorrectionModal = (item: any) => {
    setEditingItem(item);
    setCorrectionQuery('');
    setCorrectionResults([]);
    setSelectedFood(null);
    setNewQuantity(item.quantity_grams);
  };

  const handleCorrectionSubmit = async () => {
    if (!selectedFood || !newQuantity) return;
    setCorrecting(true);
    try {
      const res = await axios.put(`${API_BASE_URL}/api/meals/${analysisResult.meal_id}/items/${editingItem.item_id}`, {
        new_food_id: selectedFood.food_id,
        quantity_grams: Number(newQuantity),
      }, { headers: authHeaders });

      setAnalysisResult({
        ...analysisResult,
        total_calories: res.data.total_calories,
        total_protein_g: res.data.total_protein_g,
        total_carbs_g: res.data.total_carbs_g,
        total_fat_g: res.data.total_fat_g,
        items: res.data.items,
        meal_items: res.data.items,
      });
      setEditingItem(null);
    } catch (err) {
      alert('Failed to correct item.');
    } finally {
      setCorrecting(false);
    }
  };

  if (analysisResult) {
    return (
      <div className="max-w-2xl mx-auto space-y-6 animate-in fade-in zoom-in-95 duration-500">
        <div className="bg-white p-8 rounded-3xl shadow-lg shadow-gray-200/50 border border-gray-100 text-center relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-green-400 to-emerald-500"></div>
          
          <div className="w-20 h-20 bg-green-50 text-green-500 rounded-full flex items-center justify-center mx-auto mb-5 shadow-inner">
            <CheckCircle size={40} />
          </div>
          <h1 className="text-3xl font-extrabold mb-2 text-gray-900 tracking-tight">Meal Logged!</h1>
          <p className="text-gray-500 font-medium mb-8 max-w-sm mx-auto">
            Your meal has been recorded and macros have been updated.
          </p>

          <div className="bg-gray-50 rounded-2xl p-6 text-left border border-gray-100 shadow-inner mb-8">
            <div className="flex justify-between items-center border-b border-gray-200 pb-4 mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary-100 text-primary-600 rounded-lg flex items-center justify-center font-bold text-lg uppercase">
                  {analysisResult.meal_type.charAt(0)}
                </div>
                <span className="capitalize font-extrabold text-xl text-gray-900">{analysisResult.meal_type}</span>
              </div>
              <div className="text-right">
                <span className="text-2xl font-black text-primary-600">{Math.round(analysisResult.total_calories)}</span>
                <span className="text-xs font-bold text-gray-400 ml-1 uppercase">kcal</span>
              </div>
            </div>
            
            <div className="flex justify-between mb-6 px-2">
              <div className="text-center">
                <div className="text-lg font-bold text-gray-900">{Math.round(analysisResult.total_protein_g || 0)}g</div>
                <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mt-0.5">Protein</div>
              </div>
              <div className="text-center border-x border-gray-200 px-6">
                <div className="text-lg font-bold text-gray-900">{Math.round(analysisResult.total_carbs_g || 0)}g</div>
                <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mt-0.5">Carbs</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-gray-900">{Math.round(analysisResult.total_fat_g || 0)}g</div>
                <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mt-0.5">Fat</div>
              </div>
            </div>

            <h3 className="font-bold text-gray-900 text-sm uppercase tracking-wider mb-3 px-2">Logged Items</h3>
            <ul className="space-y-3">
              {(analysisResult.items || analysisResult.meal_items)?.map((item: any, idx: number) => (
                <li key={idx} className="flex items-center justify-between bg-white p-4 border border-gray-200 rounded-xl shadow-sm group hover:border-primary-200 transition">
                  <div className="flex-1">
                    <div className="font-bold text-gray-900 flex items-center gap-2">
                      {item.food_name || item.food?.name}
                      {item.user_corrected && (
                        <span className="text-[10px] bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full uppercase font-bold tracking-wider">Corrected</span>
                      )}
                    </div>
                    <div className="text-sm font-medium text-gray-500 mt-0.5">{item.quantity_grams}g</div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="font-extrabold text-gray-900">
                      {Math.round(item.estimated_calories)} <span className="text-xs text-gray-400 font-bold ml-0.5">KCAL</span>
                    </div>
                    <button
                      onClick={() => openCorrectionModal(item)}
                      className="bg-gray-50 text-gray-500 hover:text-primary-600 hover:bg-primary-50 p-2 rounded-lg transition"
                      title="Edit Item"
                    >
                      <Edit2 size={16} />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          <div className="mb-8 text-left p-6 bg-white border border-gray-100 shadow-sm rounded-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-5 text-gray-900 pointer-events-none"><Plus size={100} /></div>
            <h3 className="font-bold text-gray-900 mb-4 relative z-10">Add more items to this meal</h3>
            <div className="relative mb-4 z-10">
              <Search className="absolute left-4 top-3.5 text-gray-400" size={18} />
              <input
                type="text"
                placeholder="Search food to add (e.g., Rice, Dal)..."
                value={manualSearchQuery}
                onChange={(e) => setManualSearchQuery(e.target.value)}
                className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:bg-white outline-none font-medium transition"
              />
            </div>

            {manualSearchQuery.length > 1 && (
              <div className="border border-gray-200 rounded-xl overflow-y-auto max-h-56 bg-white shadow-lg relative z-20">
                {searchingManual ? (
                  <div className="p-6 text-sm font-medium text-gray-500 text-center flex items-center justify-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-400"></div> Searching database...
                  </div>
                ) : manualSearchResults.length === 0 ? (
                  <div className="p-6 text-sm font-medium text-gray-500 text-center">No foods found.</div>
                ) : (
                  <ul className="divide-y divide-gray-100">
                    {manualSearchResults.map((food) => (
                      <li key={food.food_id} className="p-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-bold text-gray-900">{food.name}</div>
                            <div className="text-xs font-medium text-gray-400 mt-0.5">{food.reference_unit}</div>
                          </div>
                          {addingFoodId !== food.food_id ? (
                            <button
                              onClick={() => { setAddingFoodId(food.food_id); setManualQuantity(100); }}
                              className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1.5 rounded-lg font-bold text-sm transition"
                            >
                              Add
                            </button>
                          ) : (
                            <div className="flex items-center gap-2">
                              <input
                                type="number"
                                value={manualQuantity}
                                onChange={(e) => setManualQuantity(Number(e.target.value))}
                                className="w-20 px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-sm font-bold text-center focus:ring-2 focus:ring-primary-500 outline-none"
                              />
                              <span className="text-xs font-bold text-gray-500 uppercase">g</span>
                              <button
                                onClick={() => handleConfirmAddItem(food)}
                                disabled={submittingManual}
                                className="bg-primary-600 hover:bg-primary-700 text-white px-3 py-1.5 rounded-lg font-bold text-sm disabled:opacity-50 transition"
                              >
                                OK
                              </button>
                              <button onClick={() => setAddingFoodId(null)} className="text-gray-400 hover:text-gray-600 p-1 bg-gray-100 rounded-lg"><X size={16} /></button>
                            </div>
                          )}
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </div>

          <div className="flex gap-4">
            <button onClick={() => navigate('/history')} className="flex-1 bg-gray-50 text-gray-700 border border-gray-200 py-3.5 rounded-xl font-bold hover:bg-gray-100 transition shadow-sm">View History</button>
            <button onClick={() => navigate('/dashboard')} className="flex-1 bg-gray-900 text-white py-3.5 rounded-xl font-bold hover:bg-black transition shadow-lg">Go to Dashboard</button>
          </div>
        </div>

        {/* Correction Modal */}
        {editingItem && (
          <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-8 relative flex flex-col animate-in zoom-in-95 duration-200">
              <button onClick={() => setEditingItem(null)} className="absolute top-6 right-6 text-gray-400 hover:text-gray-900 bg-gray-100 p-2 rounded-full transition">
                <X size={20} />
              </button>

              <div className="w-12 h-12 bg-amber-50 text-amber-500 rounded-full flex items-center justify-center mb-4">
                <Edit2 size={24} />
              </div>
              <h2 className="text-2xl font-extrabold text-gray-900 mb-1">Edit Item</h2>
              <p className="text-sm font-medium text-gray-500 mb-6">
                Replace <span className="font-bold text-gray-900 underline decoration-gray-300 decoration-2 underline-offset-2">{editingItem.food_name || editingItem.food?.name}</span> with a different food or update its quantity.
              </p>

              <div className="space-y-5">
                <div>
                  <div className="relative">
                    <Search className="absolute left-4 top-3.5 text-gray-400" size={18} />
                    <input
                      type="text"
                      placeholder="Search to replace food..."
                      value={correctionQuery}
                      onChange={(e) => setCorrectionQuery(e.target.value)}
                      className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:bg-white outline-none font-medium transition"
                    />
                  </div>
                </div>

                {correctionQuery.length > 1 && (
                  <div className="border border-gray-200 rounded-xl overflow-y-auto max-h-48 bg-white shadow-lg">
                    {searchingCorrection ? (
                      <div className="p-4 text-sm font-medium text-gray-500 text-center">Searching...</div>
                    ) : correctionResults.length === 0 ? (
                      <div className="p-4 text-sm font-medium text-gray-500 text-center">No foods found.</div>
                    ) : (
                      <ul className="divide-y divide-gray-100">
                        {correctionResults.map((food) => (
                          <li
                            key={food.food_id}
                            onClick={() => setSelectedFood(food)}
                            className={`p-4 cursor-pointer transition ${selectedFood?.food_id === food.food_id ? 'bg-primary-50 border-l-4 border-primary-500' : 'hover:bg-gray-50 border-l-4 border-transparent'}`}
                          >
                            <div className={`font-bold ${selectedFood?.food_id === food.food_id ? 'text-primary-900' : 'text-gray-900'}`}>{food.name}</div>
                            <div className="text-xs font-medium text-gray-500 mt-1 flex justify-between">
                              <span>{food.brand || 'Generic'}</span>
                              <span>{food.reference_unit}</span>
                            </div>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}

                <div className="pt-2">
                  <label className="block text-sm font-bold text-gray-900 mb-2">Quantity (grams)</label>
                  <input
                    type="number"
                    min="1"
                    value={newQuantity}
                    onChange={(e) => setNewQuantity(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:bg-white outline-none font-bold text-gray-900 text-lg transition"
                  />
                </div>

                <button
                  onClick={handleCorrectionSubmit}
                  disabled={!newQuantity || correcting || (!selectedFood && newQuantity === editingItem.quantity_grams)}
                  className="w-full bg-primary-600 text-white py-3.5 rounded-xl font-bold text-lg hover:bg-primary-700 shadow-lg shadow-primary-500/30 disabled:opacity-50 disabled:shadow-none transition mt-4"
                >
                  {correcting ? 'Saving Changes...' : 'Save Changes'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto animate-in slide-in-from-bottom-4 duration-500">
      <div className="bg-white p-8 sm:p-10 rounded-3xl shadow-xl shadow-gray-200/50 border border-gray-100 relative overflow-hidden">
        <div className="absolute -top-24 -right-24 text-gray-50 opacity-60 pointer-events-none">
          {manualMode ? <Search size={300} /> : <Camera size={300} />}
        </div>
        
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-8 pb-6 border-b border-gray-100">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 bg-primary-50 text-primary-600 rounded-2xl flex items-center justify-center shadow-inner">
                {manualMode ? <Search size={24} /> : <Camera size={24} />}
              </div>
              <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Log Meal</h1>
            </div>
            <p className="text-gray-500 font-medium ml-1">
              {manualMode ? 'Search our extensive food database.' : 'Let AI analyze your food instantly.'}
            </p>
          </div>
          
          <button
            type="button"
            onClick={() => { setManualMode(!manualMode); setError(''); }}
            className="flex-shrink-0 inline-flex items-center justify-center gap-2 bg-white hover:bg-gray-50 text-gray-800 border border-gray-200 px-4 py-2.5 rounded-xl font-bold text-sm transition shadow-sm"
          >
            {manualMode ? <><ImageIcon size={16} /> Switch to Photo</> : <><Search size={16} /> Search Manually</>}
          </button>
        </div>

        {error && (
          <div className="relative z-10 bg-red-50 border-l-4 border-red-500 text-red-700 p-4 rounded-r-xl mb-6 flex items-center gap-3 font-medium">
            <AlertCircle size={20} /> {error}
          </div>
        )}

        <div className="relative z-10 mb-8">
          <label className="block text-sm font-bold text-gray-900 mb-3 uppercase tracking-wider">Which meal is this?</label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {['breakfast', 'lunch', 'dinner', 'snack'].map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => setMealType(type)}
                className={`py-3 px-2 rounded-xl font-bold text-sm capitalize transition ${mealType === type ? 'bg-primary-600 text-white shadow-md shadow-primary-500/30' : 'bg-gray-50 text-gray-600 hover:bg-gray-100 border border-gray-200'}`}
              >
                {type}
              </button>
            ))}
          </div>
        </div>

        {manualMode ? (
          <div className="relative z-10 space-y-6">
            <div>
              <label className="block text-sm font-bold text-gray-900 mb-3 uppercase tracking-wider">Search Database</label>
              <div className="relative">
                <Search className="absolute left-4 top-4 text-gray-400" size={20} />
                <input
                  type="text"
                  placeholder="e.g., Rice, Dal, Chicken..."
                  value={manualSearchQuery}
                  onChange={(e) => setManualSearchQuery(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-primary-500 focus:bg-white outline-none font-medium text-lg transition shadow-inner"
                />
              </div>
            </div>

            {manualSearchQuery.length > 1 && (
              <div className="border border-gray-200 rounded-2xl overflow-y-auto max-h-80 bg-white shadow-lg">
                {searchingManual ? (
                  <div className="p-8 flex flex-col items-center justify-center text-gray-400 gap-3">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-400"></div>
                    <span className="font-medium">Searching database...</span>
                  </div>
                ) : manualSearchResults.length === 0 ? (
                  <div className="p-8 text-center text-gray-500 font-medium">No foods matching "{manualSearchQuery}"</div>
                ) : (
                  <ul className="divide-y divide-gray-100">
                    {manualSearchResults.map((food) => (
                      <li key={food.food_id} className="p-4 hover:bg-gray-50 transition">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-bold text-gray-900 text-lg mb-0.5">{food.name}</div>
                            <div className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                              {food.brand || food.source?.source_name || 'Generic'} • {food.reference_unit}
                            </div>
                          </div>

                          {addingFoodId !== food.food_id ? (
                            <button
                              type="button"
                              onClick={() => { setAddingFoodId(food.food_id); setManualQuantity(100); }}
                              className="bg-primary-50 hover:bg-primary-100 text-primary-700 px-4 py-2 rounded-xl font-bold transition flex items-center gap-1.5"
                            >
                              <Plus size={16} /> Add
                            </button>
                          ) : (
                            <div className="flex items-center gap-2 bg-gray-100 p-1.5 rounded-xl">
                              <input
                                type="number"
                                min="1"
                                value={manualQuantity}
                                onChange={(e) => setManualQuantity(Number(e.target.value))}
                                className="w-16 px-2 py-1.5 bg-white border border-gray-200 rounded-lg font-bold text-center outline-none focus:ring-2 focus:ring-primary-500"
                              />
                              <span className="text-xs font-bold text-gray-500 mr-1">g</span>
                              <button
                                type="button"
                                onClick={() => handleConfirmAddItem(food)}
                                disabled={submittingManual}
                                className="bg-primary-600 hover:bg-primary-700 text-white px-3 py-1.5 rounded-lg font-bold text-sm disabled:opacity-50 transition"
                              >
                                {submittingManual ? '...' : 'OK'}
                              </button>
                              <button type="button" onClick={() => setAddingFoodId(null)} className="text-gray-400 hover:text-gray-700 p-1 mr-1"><X size={18} /></button>
                            </div>
                          )}
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </div>
        ) : (
          <form onSubmit={handleUpload} className="relative z-10 space-y-6">
            <div>
              <label className="block text-sm font-bold text-gray-900 mb-3 uppercase tracking-wider">Snap a Photo</label>
              <div className={`relative border-2 border-dashed ${file ? 'border-primary-500 bg-primary-50/50' : 'border-gray-300 bg-gray-50 hover:bg-gray-100 hover:border-gray-400'} rounded-2xl p-10 flex flex-col items-center justify-center text-gray-500 cursor-pointer transition duration-200 group`}>
                <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 transition ${file ? 'bg-primary-100 text-primary-600' : 'bg-white text-gray-400 group-hover:scale-110 shadow-sm'}`}>
                  {file ? <CheckCircle size={32} /> : <Upload size={32} />}
                </div>
                <input
                  type="file"
                  accept="image/jpeg, image/png"
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                {file ? (
                  <div className="text-center">
                    <span className="text-primary-700 font-bold text-lg block mb-1">Image Selected</span>
                    <span className="text-sm font-medium text-primary-500">{file.name}</span>
                  </div>
                ) : (
                  <div className="text-center">
                    <span className="font-bold text-gray-700 text-lg block mb-1">Upload Photo</span>
                    <span className="text-sm font-medium text-gray-400">Tap to select or drag and drop</span>
                  </div>
                )}
              </div>
            </div>

            <button
              type="submit"
              disabled={!file || loading}
              className="w-full flex items-center justify-center gap-2 bg-gray-900 text-white p-4 rounded-2xl font-bold text-lg hover:bg-black disabled:bg-gray-300 disabled:text-gray-500 transition shadow-xl shadow-gray-900/20 disabled:shadow-none mt-4 group"
            >
              {loading ? (
                <><div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div> AI is analyzing...</>
              ) : (
                <><Sparkles size={20} className="group-hover:text-yellow-400 transition" /> Analyze Meal</>
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
