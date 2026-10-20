import { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { API_BASE_URL } from '../config';
import {
  Bot,
  Send,
  Sparkles,
  Loader2,
  User,
  RefreshCw,
  Lightbulb,
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
  const [snapshotLoading, setSnapshotLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Fetch today's dashboard data to give the coach context
  useEffect(() => {
    const fetchSnapshot = async () => {
      try {
        setSnapshotLoading(true);
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
      } finally {
        setSnapshotLoading(false);
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
    // Convert bullet points and newlines to styled JSX
    return text.split('\n').map((line, i) => {
      const trimmed = line.trim();
      if (trimmed.startsWith('• ') || trimmed.startsWith('- ')) {
        return (
          <li key={i} className="ml-4 text-sm text-stone-700 mb-1 list-disc list-inside">
            {trimmed.slice(2)}
          </li>
        );
      }
      if (!trimmed) return <div key={i} className="h-2" />;
      return (
        <p key={i} className="text-sm text-stone-800 mb-2 leading-relaxed">
          {trimmed}
        </p>
      );
    });
  };

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] max-h-[820px] min-h-[500px]">
      {/* ── Header ───────────────────────────────── */}
      <div className="flex items-center justify-between mb-4 flex-shrink-0">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-emerald-600 via-teal-500 to-amber-500 flex items-center justify-center shadow-md shadow-emerald-700/20">
              <Bot size={20} className="text-white" />
            </div>
            <div>
              <h1 className="text-xl font-black text-stone-900 tracking-tight">NutriCoach</h1>
              <p className="text-xs text-stone-500 font-medium">Powered by Gemini · Personalised dietary AI</p>
            </div>
          </div>
        </div>

        {/* Today's snapshot pill */}
        {!snapshotLoading && snapshot && (
          <div className="hidden sm:flex items-center gap-3 px-4 py-2 rounded-2xl bg-white border border-stone-200 shadow-xs text-xs font-semibold text-stone-600">
            <span className="text-emerald-700 font-bold">
              {Math.round(snapshot.total_calories)} kcal
            </span>
            <span className="text-stone-300">|</span>
            <span>P {Math.round(snapshot.total_protein_g)}g</span>
            <span className="text-stone-300">·</span>
            <span>C {Math.round(snapshot.total_carbs_g)}g</span>
            <span className="text-stone-300">·</span>
            <span>F {Math.round(snapshot.total_fat_g)}g</span>
          </div>
        )}
      </div>

      {/* ── Chat Window ───────────────────────────── */}
      <div className="flex-1 overflow-y-auto rounded-3xl border border-stone-200/80 bg-white/60 backdrop-blur-sm shadow-sm p-4 sm:p-6 space-y-4 mb-4">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            {msg.role === 'coach' && (
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white flex-shrink-0 mt-0.5 shadow-xs">
                <Sparkles size={14} />
              </div>
            )}

            <div
              className={`max-w-[85%] sm:max-w-[75%] rounded-2xl px-4 py-3 shadow-xs ${
                msg.role === 'user'
                  ? 'bg-gradient-to-br from-emerald-600 to-teal-600 text-white rounded-br-sm'
                  : 'bg-white border border-stone-200/80 rounded-bl-sm'
              }`}
            >
              {msg.role === 'user' ? (
                <p className="text-sm text-white leading-relaxed">{msg.text}</p>
              ) : (
                <div className="text-sm">{formatText(msg.text)}</div>
              )}
              <p
                className={`text-[10px] mt-1.5 font-medium ${
                  msg.role === 'user' ? 'text-white/60 text-right' : 'text-stone-400'
                }`}
              >
                {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>

            {msg.role === 'user' && (
              <div className="w-8 h-8 rounded-xl bg-stone-200 flex items-center justify-center flex-shrink-0 mt-0.5">
                <User size={14} className="text-stone-600" />
              </div>
            )}
          </div>
        ))}

        {loading && (
          <div className="flex gap-3 justify-start">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white flex-shrink-0 shadow-xs">
              <Sparkles size={14} />
            </div>
            <div className="bg-white border border-stone-200/80 rounded-2xl rounded-bl-sm px-4 py-3 shadow-xs flex items-center gap-2">
              <Loader2 size={14} className="animate-spin text-emerald-600" />
              <span className="text-xs text-stone-500 font-medium">NutriCoach is thinking…</span>
            </div>
          </div>
        )}

        {error && (
          <div className="flex justify-center">
            <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium max-w-lg">
              <RefreshCw size={12} />
              {error}
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* ── Suggested Questions ───────────────────── */}
      {messages.length <= 1 && (
        <div className="flex-shrink-0 mb-3">
          <div className="flex items-center gap-1.5 mb-2 text-[10px] font-bold text-stone-400 uppercase tracking-wider">
            <Lightbulb size={11} />
            Suggestions
          </div>
          <div className="flex flex-wrap gap-2">
            {SUGGESTED_QUESTIONS.map((q) => (
              <button
                key={q}
                onClick={() => sendMessage(q)}
                disabled={loading}
                className="px-3 py-1.5 rounded-xl bg-white border border-stone-200 text-xs font-medium text-stone-600 hover:border-emerald-300 hover:text-emerald-700 hover:bg-emerald-50 transition-all shadow-xs disabled:opacity-50"
              >
                {q}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── Input Bar ─────────────────────────────── */}
      <div className="flex-shrink-0 flex gap-3 items-end">
        <div className="flex-1 flex items-end gap-2 px-4 py-3 rounded-2xl bg-white border border-stone-200/90 shadow-sm focus-within:border-emerald-400 focus-within:shadow-md transition-all">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask NutriCoach anything about your nutrition today…"
            rows={1}
            className="flex-1 bg-transparent text-sm text-stone-800 placeholder-stone-400 resize-none outline-none leading-relaxed max-h-28 overflow-y-auto"
            style={{ minHeight: '24px' }}
          />
          <span className="text-[10px] text-stone-400 pb-0.5 hidden sm:block">Enter ↵ to send</span>
        </div>
        <button
          onClick={() => sendMessage(input)}
          disabled={loading || !input.trim()}
          className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-600 text-white flex items-center justify-center shadow-md shadow-emerald-700/20 hover:from-emerald-500 hover:to-teal-500 transition-all hover:scale-105 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100 flex-shrink-0"
        >
          {loading ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
        </button>
      </div>
    </div>
  );
}
