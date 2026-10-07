import { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { Camera, Upload, CheckCircle, Search, Edit2, X } from 'lucide-react';

export default function LogMeal() {
  const [file, setFile] = useState<File | null>(null);
  const [mealType, setMealType] = useState('lunch');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  const navigate = useNavigate();

  // Correction Modal State
  const [editingItem, setEditingItem] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  const [selectedFood, setSelectedFood] = useState<any>(null);
  const [newQuantity, setNewQuantity] = useState<number | ''>('');
  const [correcting, setCorrecting] = useState(false);

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;

    setLoading(true);
    setError('');

    const formData = new FormData();
    formData.append('image', file);
    formData.append('meal_type', mealType);

    try {
      const response = await axios.post('http://localhost:3000/api/meals/analyze', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setAnalysisResult(response.data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to analyze meal');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const searchFoods = async () => {
      if (searchQuery.trim().length < 2) {
        setSearchResults([]);
        return;
      }
      try {
        setSearching(true);
        const res = await axios.get(`http://localhost:3000/api/foods/search?q=${encodeURIComponent(searchQuery)}`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } // if needed, but assuming axios intercepts or it's public/mocked for now. Actually, let's just send the request
        });
        setSearchResults(res.data);
      } catch (err) {
        console.error('Search failed', err);
      } finally {
        setSearching(false);
      }
    };

    const debounce = setTimeout(() => {
      searchFoods();
    }, 500);
    return () => clearTimeout(debounce);
  }, [searchQuery]);

  const openCorrectionModal = (item: any) => {
    setEditingItem(item);
    setSearchQuery('');
    setSearchResults([]);
    setSelectedFood(null);
    setNewQuantity(item.quantity_grams);
  };

  const closeCorrectionModal = () => {
    setEditingItem(null);
  };

  const handleCorrectionSubmit = async () => {
    if (!selectedFood || !newQuantity) return;
    
    setCorrecting(true);
    try {
      const res = await axios.put(`http://localhost:3000/api/meals/${analysisResult.meal_id}/items/${editingItem.item_id}`, {
        new_food_id: selectedFood.food_id,
        quantity_grams: Number(newQuantity)
      });
      
      // Update the main analysis result with the new meal data
      setAnalysisResult({
        ...analysisResult,
        total_calories: res.data.total_calories,
        total_protein_g: res.data.total_protein_g,
        total_carbs_g: res.data.total_carbs_g,
        total_fat_g: res.data.total_fat_g,
        items: res.data.items,
        meal_items: res.data.items
      });
      closeCorrectionModal();
    } catch (err) {
      console.error('Correction failed', err);
      alert('Failed to correct item.');
    } finally {
      setCorrecting(false);
    }
  };

  if (analysisResult) {
    return (
      <div className="max-w-xl mx-auto bg-white p-8 rounded-lg shadow text-center relative">
        <CheckCircle size={48} className="mx-auto text-green-500 mb-4" />
        <h1 className="text-2xl font-bold mb-2">Meal Analyzed Successfully!</h1>
        <p className="text-gray-600 mb-6">Here is what the AI detected. Notice a mistake? You can correct it below.</p>
        
        <div className="bg-gray-50 p-4 rounded-lg text-left mb-6">
          <div className="flex justify-between font-bold text-lg border-b pb-2 mb-2">
            <span>Total Calories</span>
            <span className="text-primary-600">{analysisResult.total_calories} kcal</span>
          </div>
          <div className="flex justify-between text-sm text-gray-600 mb-4">
            <span>P: {analysisResult.total_protein_g}g</span>
            <span>C: {analysisResult.total_carbs_g}g</span>
            <span>F: {analysisResult.total_fat_g}g</span>
          </div>

          <h3 className="font-semibold text-gray-800 mb-2">Detected Items:</h3>
          <ul className="space-y-3">
            {(analysisResult.items || analysisResult.meal_items)?.map((item: any, idx: number) => (
              <li key={idx} className="flex items-center justify-between bg-white p-3 border rounded shadow-sm">
                <div className="flex-1">
                  <div className="font-medium flex items-center gap-2">
                    {item.food_name || item.food?.name} 
                    {item.user_corrected && <span className="text-[10px] bg-primary-100 text-primary-700 px-2 py-0.5 rounded-full uppercase font-bold tracking-wider">Corrected</span>}
                  </div>
                  <div className="text-xs text-gray-500">{item.quantity_grams}g</div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="font-semibold">{item.estimated_calories} kcal</div>
                  <button 
                    onClick={() => openCorrectionModal(item)}
                    className="text-gray-400 hover:text-primary-600 transition"
                    title="Correct this item"
                  >
                    <Edit2 size={16} />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <button 
          onClick={() => navigate('/dashboard')}
          className="w-full bg-primary-600 text-white p-3 rounded font-bold hover:bg-primary-700 transition"
        >
          Go to Dashboard
        </button>

        {/* Correction Modal */}
        {editingItem && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 text-left">
            <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 relative flex flex-col max-h-[90vh]">
              <button 
                onClick={closeCorrectionModal}
                className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
              >
                <X size={20} />
              </button>
              
              <h2 className="text-xl font-bold mb-1">Correct Meal Item</h2>
              <p className="text-sm text-gray-500 mb-4">
                Replacing: <span className="font-semibold text-gray-800">{editingItem.food_name || editingItem.food?.name}</span>
              </p>

              <div className="space-y-4 overflow-y-auto">
                {/* Search */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Search Food Database</label>
                  <div className="relative">
                    <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
                    <input 
                      type="text" 
                      placeholder="e.g. Paneer, Rice, Apple..." 
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                    />
                  </div>
                </div>

                {/* Results list */}
                {searchQuery.length > 1 && (
                  <div className="border rounded-lg overflow-y-auto max-h-48 bg-gray-50">
                    {searching ? (
                      <div className="p-3 text-sm text-gray-500 text-center">Searching...</div>
                    ) : searchResults.length === 0 ? (
                      <div className="p-3 text-sm text-gray-500 text-center">No foods found.</div>
                    ) : (
                      <ul className="divide-y divide-gray-200">
                        {searchResults.map(food => (
                          <li 
                            key={food.food_id}
                            onClick={() => setSelectedFood(food)}
                            className={`p-3 cursor-pointer text-sm hover:bg-primary-50 transition ${selectedFood?.food_id === food.food_id ? 'bg-primary-100 font-medium text-primary-900' : ''}`}
                          >
                            <div className="font-semibold">{food.name}</div>
                            <div className="text-xs text-gray-500 flex justify-between">
                              <span>{food.brand || food.source?.source_name || 'Generic'}</span>
                              <span>{food.reference_unit}</span>
                            </div>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}

                {/* Quantity & Submit */}
                {selectedFood && (
                  <div className="pt-4 border-t border-gray-100">
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Quantity (grams)</label>
                      <input 
                        type="number"
                        min="1"
                        value={newQuantity}
                        onChange={(e) => setNewQuantity(e.target.value === '' ? '' : Number(e.target.value))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                      />
                    </div>
                    
                    <button 
                      onClick={handleCorrectionSubmit}
                      disabled={!newQuantity || correcting}
                      className="w-full bg-primary-600 text-white p-2.5 rounded-lg font-bold hover:bg-primary-700 disabled:opacity-50"
                    >
                      {correcting ? 'Updating...' : 'Confirm Correction'}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto bg-white p-8 rounded-lg shadow">
      <h1 className="text-2xl font-bold mb-6 flex items-center gap-2"><Camera /> Log a Meal</h1>
      
      {error && <div className="bg-red-50 text-red-600 p-3 rounded mb-4">{error}</div>}

      <form onSubmit={handleUpload} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Meal Type</label>
          <select 
            value={mealType} 
            onChange={e => setMealType(e.target.value)}
            className="w-full p-2 border rounded focus:ring-primary-500 focus:border-primary-500"
          >
            <option value="breakfast">Breakfast</option>
            <option value="lunch">Lunch</option>
            <option value="dinner">Dinner</option>
            <option value="snack">Snack</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Food Image</label>
          <div className="relative border-2 border-dashed border-gray-300 rounded-lg p-6 flex flex-col items-center justify-center text-gray-500 hover:bg-gray-50 hover:border-primary-500 cursor-pointer transition">
            <Upload size={32} className="mb-2" />
            <input 
              type="file" 
              accept="image/jpeg, image/png"
              onChange={e => setFile(e.target.files?.[0] || null)}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
            {file ? <span className="text-primary-600 font-semibold">{file.name}</span> : <span>Click to upload or drag and drop</span>}
          </div>
        </div>

        <button 
          type="submit" 
          disabled={!file || loading}
          className="w-full bg-primary-600 text-white p-3 rounded font-bold hover:bg-primary-700 disabled:opacity-50 transition"
        >
          {loading ? 'Analyzing with AI...' : 'Analyze Meal'}
        </button>
      </form>
    </div>
  );
}
