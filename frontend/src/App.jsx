import { useCallback, useEffect, useRef, useState } from 'react';
import { getLanguage } from './lib/languages.js';
import { useSpeechRecognition } from './hooks/useSpeechRecognition.js';
import { api } from './api/client.js';
import LanguageToggle from './components/LanguageToggle.jsx';
import VoiceBar from './components/VoiceBar.jsx';
import ShoppingList from './components/ShoppingList.jsx';
import SuggestionsPanel from './components/SuggestionsPanel.jsx';

export default function App() {
  const [langCode, setLangCode] = useState('en');
  const language = getLanguage(langCode);
  const [items, setItems] = useState([]);
  const [suggestions, setSuggestions] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [feedback, setFeedback] = useState(null); // { type, text }
  const feedbackTimer = useRef(null);

  const showFeedback = useCallback((type, text) => {
    setFeedback({ type, text });
    if (feedbackTimer.current) clearTimeout(feedbackTimer.current);
    feedbackTimer.current = setTimeout(() => setFeedback(null), 3500);
  }, []);

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
      // Suggestions are non-critical; ignore failures silently.
    }
  }, []);

  useEffect(() => {
    loadItems();
    loadSuggestions();
  }, [loadItems, loadSuggestions]);

  // Core loop: spoken/typed text -> backend parse+execute -> refresh UI.
  const handleCommand = useCallback(
    async (text) => {
      if (!text || !text.trim()) return;
      setProcessing(true);
      try {
        const result = await api.sendCommand(text, language.parseLang);
        setItems(result.list || []);
        if (result.ok) {
          showFeedback('success', result.message || 'Done.');
        } else {
          showFeedback('error', result.message || 'Command not recognized.');
        }
        loadSuggestions();
      } catch (err) {
        showFeedback('error', err.message || 'Network error — is the server running?');
      } finally {
        setProcessing(false);
      }
    },
    [language.parseLang, loadSuggestions, showFeedback]
  );

  const handleRemove = useCallback(
    async (id) => {
      try {
        await api.removeItem(id);
        await loadItems();
        loadSuggestions();
      } catch (err) {
        showFeedback('error', err.message);
      }
    },
    [loadItems, loadSuggestions, showFeedback]
  );

  const handleUpdate = useCallback(
    async (id, fields) => {
      try {
        await api.updateItem(id, fields);
        await loadItems();
      } catch (err) {
        showFeedback('error', err.message);
      }
    },
    [loadItems, showFeedback]
  );

  const handleClear = useCallback(async () => {
    try {
      await api.clearItems();
      await loadItems();
      loadSuggestions();
      showFeedback('info', 'List cleared.');
    } catch (err) {
      showFeedback('error', err.message);
    }
  }, [loadItems, loadSuggestions, showFeedback]);

  // Suggestion "Add" button -> add item then refresh everything.
  const handleAddSuggestion = useCallback(
    async (name) => {
      try {
        await api.addItem({ name });
        await loadItems();
        loadSuggestions();
        showFeedback('success', `Added "${name}".`);
      } catch (err) {
        showFeedback('error', err.message);
      }
    },
    [loadItems, loadSuggestions, showFeedback]
  );

  const speech = useSpeechRecognition({
    lang: language.speechCode,
    onFinalResult: handleCommand,
  });

  return (
    <div className="min-h-screen">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3 px-4 py-4">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🛒</span>
            <div>
              <h1 className="text-lg font-bold text-slate-800">Voice Shopping Assistant</h1>
              <p className="text-xs text-slate-400">Speak. We sort, count & suggest.</p>
            </div>
          </div>
          <LanguageToggle value={langCode} onChange={setLangCode} />
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-6">
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            <VoiceBar
              supported={speech.supported}
              listening={speech.listening}
              interim={speech.interim}
              transcript={speech.transcript}
              error={speech.error}
              onStart={speech.start}
              onStop={speech.stop}
              onTextSubmit={handleCommand}
              examples={language.examples}
            />

            {processing && (
              <div className="flex items-center gap-2 text-sm text-brand-700">
                <Spinner /> Processing command…
              </div>
            )}

            <ShoppingList
              items={items}
              onRemove={handleRemove}
              onUpdate={handleUpdate}
              onClear={handleClear}
            />
          </div>

          <aside className="lg:col-span-1">
            <SuggestionsPanel
              suggestions={suggestions}
              loading={!suggestions}
              onAdd={handleAddSuggestion}
            />
          </aside>
        </div>
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
    </div>
  );
}

function Spinner() {
  return (
    <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 0 1 8-8v4a4 4 0 0 0-4 4H4z" />
    </svg>
  );
}
