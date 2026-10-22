import { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { API_BASE_URL } from '../config';
import {
  Send,
  Sparkles,
  Loader2,
  Lightbulb,
  ArrowRight,
  Utensils,
} from 'lucide-react';

interface Message {
  id: string;
  role: 'user' | 'coach';
  text: string;
  timestamp: Date;
}

interface DailySnapshot {
  date: string;
  total_calories: number;
  target_calories: number;
  total_protein_g: number;
  total_carbs_g: number;
  total_fat_g: number;
  meals: { meal_type: string; total_calories: number }[];
}

const SUGGESTED_QUESTIONS = [
  "Explain my plate for today",
  "What nutrients am I missing?",
  "Suggest healthy Indian food swaps",
  "Am I eating enough protein?",
  "What should I eat for my next meal?",
];

export default function NutritionCoach() {
  const { token } = useAuth();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'coach',
      text: "Hi there! I'm NutriCoach, your personal AI nutrition assistant powered by Gemini 🥗\n\nShare what you've eaten today and I'll analyse your plate, flag any nutrient gaps, and suggest healthy Indian food swaps tailored to your goals. You can also ask me anything about nutrition!",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [snapshot, setSnapshot] = useState<DailySnapshot | null>(null);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Fetch today's dashboard data to give the coach context
  useEffect(() => {
    const fetchSnapshot = async () => {
      try {
        const headers = token ? { Authorization: `Bearer ${token}` } : undefined;
        const today = new Date().toLocaleDateString('en-CA');
        const res = await axios.get(`${API_BASE_URL}/api/activity/dashboard?date=${today}`, { headers });
        setSnapshot({
          date: res.data.date,
          total_calories: res.data.total_calories,
          target_calories: res.data.target_calories,
          total_protein_g: res.data.total_protein_g,
          total_carbs_g: res.data.total_carbs_g,
          total_fat_g: res.data.total_fat_g,
          meals: res.data.meals ?? [],
        });
      } catch {
        // Non-fatal — coach can still work without snapshot
      }
    };
    fetchSnapshot();
  }, [token]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async (text: string) => {
    if (!text.trim() || loading) return;
    setError(null);

    const userMsg: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      text: text.trim(),
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const headers = token ? { Authorization: `Bearer ${token}` } : undefined;
      const payload = {
        date: snapshot?.date ?? new Date().toLocaleDateString('en-CA'),
        total_calories: snapshot?.total_calories ?? 0,
        target_calories: snapshot?.target_calories ?? 2000,
        total_protein_g: snapshot?.total_protein_g ?? 0,
        total_carbs_g: snapshot?.total_carbs_g ?? 0,
        total_fat_g: snapshot?.total_fat_g ?? 0,
        meals: snapshot?.meals ?? [],
        user_question: text.trim(),
      };

      const res = await axios.post(`${API_BASE_URL}/api/coach/explain`, payload, { headers });
      const coachMsg: Message = {
        id: crypto.randomUUID(),
        role: 'coach',
        text: res.data.advice,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, coachMsg]);
    } catch (err: any) {
      const serverMsg = err?.response?.data?.message;
      if (serverMsg?.includes('GEMINI_API_KEY')) {
        setError('AI Coach needs a Gemini API key configured on the server. See deployment guide.');
      } else {
        setError(serverMsg ?? 'Coach is temporarily unavailable. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  const formatText = (text: string) => {
    return text.split('\n').map((line, i) => {
      const trimmed = line.trim();
      if (trimmed.startsWith('• ') || trimmed.startsWith('- ')) {
        return (
          <li key={i} className="ml-4 text-xs sm:text-sm text-slate-200 mb-1 list-disc list-inside">
            {trimmed.slice(2)}
          </li>
        );
      }
      if (trimmed.startsWith('**') && trimmed.endsWith('**')) {
        return (
          <p key={i} className="text-xs sm:text-sm font-bold text-white mt-2 mb-1">
            {trimmed.slice(2, -2)}
          </p>
        );
      }
      if (trimmed === '') {
        return <div key={i} className="h-1.5" />;
      }
      return (
        <p key={i} className="text-xs sm:text-sm text-slate-300 mb-1 leading-relaxed">
          {line}
        </p>
      );
    });
  };

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      {/* ── 1. Hero Section & Oversized Heading ───────────────── */}
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-xs font-bold tracking-wider uppercase text-[#8ba0a6]">
          <span className="text-emerald-400">✳</span>
          <span>Gemini Dietary Intelligence</span>
        </div>

        <h1 className="text-3xl sm:text-4xl md:text-5xl font-medium tracking-tight text-white leading-[1.15]">
          Conversational AI guidance{' '}
          <span className="text-[#8ba0a6] font-normal">
            powered by your daily plate
          </span>
        </h1>

        <p className="text-xs sm:text-sm text-[#8ba0a6] max-w-2xl font-normal pt-1">
          NutriCoach examines your real-time macro balance, identifies micronutrient gaps, and suggests healthy food swaps.
        </p>
      </div>

      {/* ── 2. Full-Width Horizontal Segmented Control Strip ──── */}
      <div className="w-full bg-[#0b171b] border border-[#18282c] rounded-2xl grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 divide-y sm:divide-y-0 sm:divide-x divide-[#18282c] overflow-hidden shadow-xl">
        <div className="p-4 sm:p-5 flex flex-col justify-between">
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#8ba0a6] block mb-1">
            Today's Logged Energy
          </span>
          <div className="text-2xl font-black text-white tabular-num">
            {Math.round(snapshot?.total_calories || 0)}{' '}
            <span className="text-xs font-normal text-[#8ba0a6]">kcal</span>
          </div>
        </div>

        <div className="p-4 sm:p-5 flex flex-col justify-between">
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#8ba0a6] block mb-1">
            Daily Target
          </span>
          <div className="text-xl font-extrabold text-white tabular-num">
            {snapshot?.target_calories || 2000}{' '}
            <span className="text-xs font-normal text-[#8ba0a6]">kcal goal</span>
          </div>
        </div>

        <div className="p-4 sm:p-5 flex flex-col justify-between">
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#8ba0a6] block mb-1">
            Macro Intake
          </span>
          <div className="text-xs font-bold text-white">
            P: <span className="text-[#f43f5e]">{Math.round(snapshot?.total_protein_g || 0)}g</span> • C: <span className="text-[#f59e0b]">{Math.round(snapshot?.total_carbs_g || 0)}g</span> • F: <span className="text-[#38bdf8]">{Math.round(snapshot?.total_fat_g || 0)}g</span>
          </div>
          <span className="text-[11px] text-[#566c73]">Current Distribution</span>
        </div>

        <div className="p-4 sm:p-5 flex flex-col justify-between">
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#8ba0a6] block mb-1">
            Cognitive Model
          </span>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs font-bold text-white">Gemini 2.5 Nutrition</span>
          </div>
          <span className="text-[11px] text-[#566c73]">Contextual Plate Analysis</span>
        </div>

        <div className="p-3 sm:p-3 flex items-center justify-center bg-[#0e1d22] sm:bg-transparent">
          <button
            onClick={() => sendMessage("Explain my plate for today")}
            disabled={loading}
            className="w-full h-full min-h-[48px] py-3 px-5 rounded-xl bg-white text-black hover:bg-slate-200 transition-all font-extrabold text-sm tracking-tight flex items-center justify-center gap-2 cursor-pointer shadow-lg active:scale-[0.98] disabled:opacity-50"
          >
            <Sparkles size={16} />
            <span>Explain Plate</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-[#281014] border border-[#521c25] text-[#fb7185] text-xs flex items-center gap-2.5">
          <span>{error}</span>
        </div>
      )}

      {/* ── 3. Sidebar-Plus-Main-Content Composition ─────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* ── Left Sidebar: Suggested Questions & Daily Telemetry ── */}
        <aside className="lg:col-span-4 space-y-6">
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#8ba0a6] flex items-center gap-1.5">
              <Lightbulb size={13} className="text-[#f59e0b]" />
              <span>Suggested Queries</span>
            </h3>
            <div className="space-y-2">
              {SUGGESTED_QUESTIONS.map((q) => (
                <button
                  key={q}
                  onClick={() => sendMessage(q)}
                  disabled={loading}
                  className="w-full text-left p-3 rounded-xl bg-[#0b171b] hover:bg-[#122227] text-white border border-[#18282c] hover:border-[#274047] text-xs font-semibold transition flex items-center justify-between cursor-pointer group disabled:opacity-50"
                >
                  <span className="pr-2">{q}</span>
                  <ArrowRight size={13} className="text-[#8ba0a6] group-hover:text-white transition-transform group-hover:translate-x-0.5" />
                </button>
              ))}
            </div>
          </div>

          {/* Today's Context Card */}
          <div className="health-card p-5 bg-[#0b171b] border-[#18282c] space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#8ba0a6] flex items-center gap-1.5">
              <Utensils size={13} className="text-emerald-400" />
              <span>Session Context</span>
            </h3>
            <p className="text-xs text-[#8ba0a6]">
              NutriCoach references your {snapshot?.meals?.length || 0} meals logged for {snapshot?.date || 'today'} to construct its recommendations.
            </p>
            <div className="pt-2 border-t border-[#18282c] flex justify-between text-xs">
              <span className="text-[#8ba0a6]">Active Plate Meals:</span>
              <span className="text-white font-bold">{snapshot?.meals?.length || 0}</span>
            </div>
          </div>
        </aside>

        {/* ── Right Main Content Area: Chat Window ─────────────── */}
        <section className="lg:col-span-8 health-card bg-[#0b171b] border-[#18282c] flex flex-col h-[650px] overflow-hidden">
          {/* Chat Messages Stream */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-3 items-start ${
                  msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'
                }`}
              >
                {/* Avatar Icon */}
                <div
                  className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 text-xs font-bold ${
                    msg.role === 'coach'
                      ? 'bg-[#081f18] text-emerald-400 border border-[#134937]'
                      : 'bg-white text-black font-black'
                  }`}
                >
                  {msg.role === 'coach' ? '✳' : 'You'}
                </div>

                {/* Message Bubble */}
                <div
                  className={`max-w-[85%] rounded-2xl p-4 text-xs sm:text-sm leading-relaxed ${
                    msg.role === 'user'
                      ? 'bg-white text-black font-semibold'
                      : 'bg-[#081215] text-white border border-[#18282c]'
                  }`}
                >
                  {msg.role === 'coach' ? (
                    <div>{formatText(msg.text)}</div>
                  ) : (
                    <p>{msg.text}</p>
                  )}
                  <span
                    className={`text-[9px] block mt-1.5 font-normal ${
                      msg.role === 'user' ? 'text-black/60' : 'text-[#566c73]'
                    }`}
                  >
                    {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex gap-3 items-start">
                <div className="w-8 h-8 rounded-lg bg-[#081f18] border border-[#134937] flex items-center justify-center shrink-0 text-xs text-emerald-400">
                  ✳
                </div>
                <div className="p-4 rounded-2xl bg-[#081215] border border-[#18282c] text-xs text-[#8ba0a6] flex items-center gap-2">
                  <Loader2 size={14} className="animate-spin text-emerald-400" />
                  <span>NutriCoach is evaluating nutritional balance...</span>
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Chat Input Bar */}
          <div className="p-4 border-t border-[#18282c] bg-[#081215]">
            <div className="flex items-end gap-2.5">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask NutriCoach about your macros, nutrient deficiencies, or healthy food swaps..."
                rows={2}
                disabled={loading}
                className="flex-1 bg-[#0b171b] border border-[#18282c] focus:border-white/30 rounded-xl p-3 text-xs text-white placeholder-[#566c73] outline-none resize-none transition"
              />
              <button
                onClick={() => sendMessage(input)}
                disabled={loading || !input.trim()}
                className="h-11 px-5 rounded-xl bg-white text-black hover:bg-slate-200 transition font-extrabold text-xs flex items-center gap-2 cursor-pointer shadow-md disabled:opacity-40"
              >
                <span>Send</span>
                <Send size={13} />
              </button>
            </div>
            <p className="text-[10px] text-[#566c73] mt-2">
              Press Enter to send, Shift+Enter for a new line. Answers reflect your current logged intake.
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}
