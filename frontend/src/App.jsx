import { useCallback, useEffect, useRef, useState } from 'react';
import { getLanguage } from './lib/languages.js';
import { useSpeechRecognition } from './hooks/useSpeechRecognition.js';
import { api } from './api/client.js';
import { playChime, speakResponse } from './lib/sounds.js';
import Icon from './components/Icons.jsx';
import VoiceBar from './components/VoiceBar.jsx';
import ShoppingList from './components/ShoppingList.jsx';
import SuggestionsPanel from './components/SuggestionsPanel.jsx';
import Catalog from './components/Catalog.jsx';
import SearchResults from './components/SearchResults.jsx';
import Toaster from './components/Toaster.jsx';

const THEME_KEY = 'vocalcart-theme';
const GEMINI_KEY = 'vocalcart-gemini-key';
const TTS_KEY = 'vocalcart-tts';

export default function App() {
  const [langCode, setLangCode] = useState('en');
  const language = getLanguage(langCode);
  const [items, setItems] = useState([]);
  const [suggestions, setSuggestions] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [confirmation, setConfirmation] = useState(null);
  const [searchResults, setSearchResults] = useState(null); // { query, results }
  const [searchQuery, setSearchQuery] = useState('');
  const [maxPrice, setMaxPrice] = useState(null);
  const pendingAddRef = useRef(new Set());

  // UI feature state
  const [dark, setDark] = useState(false);
  const [toasts, setToasts] = useState([]);
  const [configOpen, setConfigOpen] = useState(false);
  const [docOpen, setDocOpen] = useState(false);
  const [geminiKey, setGeminiKey] = useState('');
  const [ttsEnabled, setTtsEnabled] = useState(true);

  const feedbackTimer = useRef(null);
  const toastId = useRef(0);

  // ----- Theme -----
  useEffect(() => {
    const saved = localStorage.getItem(THEME_KEY);
    const prefersDark = window.matchMedia?.('(prefers-color-scheme: dark)').matches;
    const isDark = saved ? saved === 'dark' : prefersDark;
    setDark(isDark);
    document.documentElement.classList.toggle('dark', isDark);
  }, []);

  const toggleDarkMode = useCallback(() => {
    setDark((prev) => {
      const next = !prev;
      document.documentElement.classList.toggle('dark', next);
      localStorage.setItem(THEME_KEY, next ? 'dark' : 'light');
      return next;
    });
  }, []);

  // ----- Config (Gemini key + TTS) -----
  useEffect(() => {
    setGeminiKey(localStorage.getItem(GEMINI_KEY) || '');
    setTtsEnabled(localStorage.getItem(TTS_KEY) !== 'false');
  }, []);

  const saveConfig = useCallback(() => {
    localStorage.setItem(GEMINI_KEY, geminiKey);
    localStorage.setItem(TTS_KEY, String(ttsEnabled));
    setConfigOpen(false);
    pushToast('success', geminiKey.startsWith('AIza') ? 'Gemini engine configured!' : 'Settings saved.');
  }, [geminiKey, ttsEnabled]);

  // ----- Toasts -----
  const pushToast = useCallback((type, message) => {
    const id = ++toastId.current;
    setToasts((prev) => [...prev, { id, type, message }]);
    return id;
  }, []);

  const dismissToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // ----- Feedback (legacy inline banner) -----
  const showFeedback = useCallback((type, text) => {
    setFeedback({ type, text });
    if (feedbackTimer.current) clearTimeout(feedbackTimer.current);
    feedbackTimer.current = setTimeout(() => setFeedback(null), 3500);
  }, []);

  // ----- Data -----
  const loadItems = useCallback(async () => {
    try {
      const { items: list } = await api.getItems();
      setItems(list);
    } catch (err) {
      showFeedback('error', `Couldn't load your list: ${err.message}`);
    }
  }, [showFeedback]);

  const loadSuggestions = useCallback(async () => {
    try {
      const data = await api.getSuggestions();
      setSuggestions(data);
    } catch {
      /* suggestions are non-critical */
    }
  }, []);

  useEffect(() => {
    loadItems();
    loadSuggestions();
  }, [loadItems, loadSuggestions]);

  // ----- Core command loop -----
  const handleCommand = useCallback(
    async (text) => {
      if (!text || !text.trim()) return;
      setProcessing(true);
      setSearchResults(null);
      setConfirmation(null);
      try {
        const result = await api.sendCommand(text, language.parseLang);
        setItems(result.list || []);
        loadSuggestions();

        if (result.ok) {
          setConfirmation(result.message || 'Command parsed successfully!');
          playChime('success');
          pushToast('success', result.message || 'Done.');
          speakResponse(result.message, language.speechCode, ttsEnabled);

          if (result.intent === 'search') {
            setSearchResults({
              query: result.action?.query || text.trim(),
              results: result.results || [],
              appliedFilters: result.appliedFilters || null,
            });
          }
        } else {
          playChime('error');
          pushToast('error', result.message || 'Command not recognized.');
          setConfirmation(null);
        }
      } catch (err) {
        playChime('error');
        pushToast('error', err.message || 'Network error — is the server running?');
      } finally {
        setProcessing(false);
      }
    },
    [language.parseLang, language.speechCode, ttsEnabled, loadSuggestions, pushToast]
  );

  const handleRemove = useCallback(
    async (id) => {
      try {
        await api.removeItem(id);
        await loadItems();
        loadSuggestions();
      } catch (err) {
        pushToast('error', err.message);
      }
    },
    [loadItems, loadSuggestions, pushToast]
  );

  const handleUpdate = useCallback(
    async (id, fields) => {
      try {
        await api.updateItem(id, fields);
        await loadItems();
      } catch (err) {
        pushToast('error', err.message);
      }
    },
    [loadItems, pushToast]
  );

  const handleClear = useCallback(async () => {
    try {
      await api.clearItems();
      setSearchQuery('');
      setMaxPrice(null);
      setSearchResults(null);
      await loadItems();
      loadSuggestions();
      pushToast('info', 'List cleared.');
    } catch (err) {
      pushToast('error', err.message);
    }
  }, [loadItems, loadSuggestions, pushToast]);

  // Add from quick-add bar, suggestions, or catalog.
  const handleAdd = useCallback(
    async ({ name, quantity = 1 }) => {
      if (!name || !name.trim()) return;
      const key = `${name.trim().toLowerCase()}:${quantity}`;
      if (pendingAddRef.current.has(key)) return;
      pendingAddRef.current.add(key);
      try {
        await api.addItem({ name: name.trim(), quantity });
        await loadItems();
        loadSuggestions();
        pushToast('success', `Added "${name.trim()}".`);
        playChime('success');
      } catch (err) {
        pushToast('error', err.message);
      } finally {
        setTimeout(() => pendingAddRef.current.delete(key), 1000);
      }
    },
    [loadItems, loadSuggestions, pushToast]
  );

  const clearSearch = useCallback(() => {
    setSearchQuery('');
    setMaxPrice(null);
    setSearchResults(null);
  }, []);

  // ----- Speech -----
  const speech = useSpeechRecognition({
    lang: language.speechCode,
    onFinalResult: handleCommand,
  });

  const handleStart = useCallback(() => {
    playChime('start');
    speech.start();
  }, [speech]);

  const engineStatus = geminiKey.startsWith('AIza') ? 'Ready (Gemini Active)' : 'Ready (Backend Engine)';

  return (
    <div className="min-h-screen transition-colors duration-300">
      <Header
        dark={dark}
        onToggleDark={toggleDarkMode}
        onOpenConfig={() => setConfigOpen(true)}
        onOpenDoc={() => setDocOpen(true)}
      />

      <main className="mx-auto grid max-w-7xl grid-cols-1 gap-6 px-4 py-6 pb-24 lg:grid-cols-12">
        {/* Left: Voice assistant */}
        <section className="space-y-6 lg:col-span-4">
          <VoiceBar
            supported={speech.supported}
            listening={speech.listening}
            interim={speech.interim}
            transcript={speech.transcript}
            error={speech.error}
            onStart={handleStart}
            onStop={speech.stop}
            onTextSubmit={handleCommand}
            languageCode={langCode}
            onLanguageChange={setLangCode}
            engineStatus={engineStatus}
            confirmation={confirmation}
            examples={language.examples}
          />
          <CommandCheats />
        </section>

        {/* Right: list, suggestions, catalog */}
        <section className="space-y-6 lg:col-span-8">
          {searchResults && (
            <SearchResults
              query={searchResults.query}
              results={searchResults.results}
              onDismiss={clearSearch}
              onAdd={handleAdd}
            />
          )}

          {processing && (
            <div className="flex items-center gap-2 text-sm text-emerald-700 dark:text-emerald-400">
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" />
              Processing command…
            </div>
          )}

          <ShoppingList
            items={items}
            onRemove={handleRemove}
            onUpdate={handleUpdate}
            onClear={handleClear}
            onAdd={handleAdd}
          />

          <SuggestionsPanel suggestions={suggestions} loading={!suggestions} onAdd={handleAdd} />

          <Catalog searchQuery={searchQuery} maxPrice={maxPrice} onClearSearch={clearSearch} onAdd={handleAdd} />
        </section>
      </main>

      {feedback && (
        <div
          className={`fixed bottom-4 left-1/2 z-50 -translate-x-1/2 rounded-xl px-4 py-2 text-sm font-medium shadow-lg ${
            feedback.type === 'error'
              ? 'bg-red-600 text-white'
              : feedback.type === 'success'
                ? 'bg-emerald-600 text-white'
                : 'bg-slate-800 text-white'
          }`}
          role="status"
        >
          {feedback.text}
        </div>
      )}

      <Toaster toasts={toasts} onDismiss={dismissToast} />

      <ConfigModal
        open={configOpen}
        onClose={() => setConfigOpen(false)}
        geminiKey={geminiKey}
        setGeminiKey={setGeminiKey}
        ttsEnabled={ttsEnabled}
        setTtsEnabled={setTtsEnabled}
        onSave={saveConfig}
      />

      <DocModal open={docOpen} onClose={() => setDocOpen(false)} />
    </div>
  );
}

function Header({ dark, onToggleDark, onOpenConfig, onOpenDoc }) {
  return (
    <header className="sticky top-0 z-30 border-b border-slate-100 bg-white/80 backdrop-blur-md dark:border-slate-800 dark:bg-slate-900/80">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="rounded-2xl bg-gradient-to-tr from-emerald-500 to-green-400 p-2.5 text-white shadow-lg shadow-emerald-500/20">
            <Icon name="mic" className="h-6 w-6" />
          </div>
          <div>
            <h1 className="bg-gradient-to-r from-emerald-600 to-green-500 bg-clip-text text-xl font-bold tracking-tight text-transparent dark:from-emerald-400 dark:to-green-300">
              VocalCart AI
            </h1>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Smart Voice-Activated Shopping</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onToggleDark}
            className="rounded-xl p-2 text-slate-600 transition-all hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
            title="Toggle Dark Mode"
          >
            <Icon name={dark ? 'sun' : 'moon'} className="h-5 w-5" />
          </button>
          <button
            type="button"
            onClick={onOpenConfig}
            className="flex items-center gap-2 rounded-xl border border-emerald-100 bg-emerald-50 px-3 py-1.5 text-sm font-semibold text-emerald-700 transition-all hover:bg-emerald-100 dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-400 dark:hover:bg-emerald-900/40"
          >
            <Icon name="brain" className="h-4 w-4" />
            <span className="hidden sm:inline">Configure AI Engine</span>
          </button>
          <button
            type="button"
            onClick={onOpenDoc}
            className="rounded-xl p-2 text-slate-600 transition-all hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
            title="View Submission Documentation"
          >
            <Icon name="file-text" className="h-5 w-5" />
          </button>
        </div>
      </div>
    </header>
  );
}

function CommandCheats() {
  const cheats = [
    { text: '"Add 3 Organic Bananas"', tag: 'ADD', tone: 'emerald' },
    { text: '"Remove milk from my list"', tag: 'REMOVE', tone: 'red' },
    { text: '"Search milk under 5 dollars"', tag: 'FILTER', tone: 'blue' },
    { text: '"Clear my whole shopping list"', tag: 'CLEAR', tone: 'amber' },
  ];
  const tones = {
    emerald: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400',
    red: 'bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-400',
    blue: 'bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400',
    amber: 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400',
  };
  return (
    <div className="rounded-3xl border border-slate-100 bg-white p-5 shadow-sm dark:border-slate-700/60 dark:bg-slate-800">
      <h3 className="mb-3 flex items-center gap-2 text-sm font-bold text-slate-800 dark:text-slate-100">
        <Icon name="help-circle" className="h-4 w-4 text-emerald-500" />
        Voice Command Shortcuts
      </h3>
      <div className="space-y-2.5 text-xs">
        {cheats.map((c) => (
          <div
            key={c.text}
            className="flex items-start justify-between rounded-xl border border-slate-100 bg-slate-50 p-2.5 dark:border-slate-800 dark:bg-slate-900/40"
          >
            <span className="font-medium text-slate-600 dark:text-slate-300">{c.text}</span>
            <span className={`rounded-md px-2 py-0.5 text-[10px] font-bold ${tones[c.tone]}`}>{c.tag}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function ConfigModal({ open, onClose, geminiKey, setGeminiKey, ttsEnabled, setTtsEnabled, onSave }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm" onClick={onClose}>
      <div
        className="relative w-full max-w-md rounded-3xl border border-slate-100 bg-white p-6 shadow-2xl dark:border-slate-700 dark:bg-slate-800"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 rounded-xl p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-700/60"
        >
          <Icon name="x" className="h-5 w-5" />
        </button>

        <div className="mb-4 flex items-center gap-3">
          <div className="rounded-2xl bg-emerald-50 text-emerald-500 dark:bg-emerald-950/40">
            <Icon name="cpu" className="m-3 h-6 w-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">AI Assistant Settings</h3>
            <p className="text-xs text-slate-400">Manage NLP models & transcription settings</p>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Gemini API Key (Optional)
            </label>
            <input
              type="password"
              value={geminiKey}
              onChange={(e) => setGeminiKey(e.target.value)}
              placeholder="AIzaSy..."
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition-all focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 dark:border-slate-700/80 dark:bg-slate-900 dark:text-slate-100"
            />
            <p className="mt-1.5 text-[10px] leading-normal text-slate-400">
              When a key is provided the app can route voice parsing to a Gemini model. If left empty, the
              assistant falls back to its high-precision backend rule engine — entirely client-side.
            </p>
          </div>

          <div className="border-t border-slate-100 pt-2 dark:border-slate-700">
            <span className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Engine Performance
            </span>
            <div className="flex items-center justify-between rounded-2xl border border-slate-100 bg-slate-50 p-3 dark:border-slate-800/60 dark:bg-slate-900/60">
              <div className="flex items-center gap-2">
                <Icon name="volume-2" className="h-4 w-4 text-emerald-500" />
                <span className="text-xs font-semibold">Enable Text-to-Speech (TTS) voice response</span>
              </div>
              <input
                type="checkbox"
                checked={ttsEnabled}
                onChange={(e) => setTtsEnabled(e.target.checked)}
                className="h-4 w-4 cursor-pointer rounded border-slate-300 text-emerald-500 focus:ring-emerald-500"
              />
            </div>
          </div>

          <button
            type="button"
            onClick={onSave}
            className="mt-2 w-full rounded-2xl bg-emerald-500 py-3.5 text-sm font-bold text-white shadow-lg shadow-emerald-500/15 transition-all hover:bg-emerald-600"
          >
            Save Config
          </button>
        </div>
      </div>
    </div>
  );
}

function DocModal({ open, onClose }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm" onClick={onClose}>
      <div
        className="max-h-[85vh] w-full max-w-2xl overflow-y-auto rounded-3xl border border-slate-100 bg-white p-6 shadow-2xl dark:border-slate-700 dark:bg-slate-800"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 rounded-xl p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-700/60"
        >
          <Icon name="x" className="h-5 w-5" />
        </button>

        <div className="mb-5 flex items-center gap-3 border-b border-slate-100 pb-4 dark:border-slate-700">
          <div className="rounded-2xl bg-emerald-50 text-emerald-500 dark:bg-emerald-950/40">
            <Icon name="book-open" className="m-3 h-6 w-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">Technical Approach Documentation</h3>
            <p className="text-xs text-slate-400">Software Engineering Candidate Technical Assessment Project</p>
          </div>
        </div>

        <div className="space-y-4 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
          <div>
            <h4 className="mb-1 flex items-center gap-1.5 font-bold text-slate-800 dark:text-slate-100">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> 1. System Design & Architecture
            </h4>
            <p>
              A modular, event-driven React front end talks to a Node/Express + SQLite backend. Speech is
              captured natively via the Web Speech API and sent to <code className="rounded bg-slate-100 px-1 dark:bg-slate-900">POST /api/command</code>,
              which parses intent, executes the change, and returns the updated list plus smart suggestions.
            </p>
          </div>
          <div>
            <h4 className="mb-1 flex items-center gap-1.5 font-bold text-slate-800 dark:text-slate-100">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> 2. Implementation Specifications
            </h4>
            <ul className="list-disc space-y-1 pl-5 text-xs">
              <li><strong>Rule-based NLP, not an LLM:</strong> deterministic keyword + regex parsing — free, fast, testable.</li>
              <li><strong>Programmatic audio:</strong> system chimes synthesized in-browser via the Web Audio API; no audio assets.</li>
              <li><strong>Multilingual:</strong> Web Speech API with English / Español / हिन्दी intent dictionaries.</li>
              <li><strong>Accessible UX:</strong> Tailwind reactive layout, dark mode, smooth waveform animations, rich image cards.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
