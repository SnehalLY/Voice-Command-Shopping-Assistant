import { useState } from 'react';

/**
 * VoiceBar — the mic control + live transcript + manual text fallback.
 *
 * Shows a clear listening state (animated pulse), the interim recognized text,
 * and surfaces microphone errors (permission denied, no-speech, etc.) so the
 * user always knows what's happening. When speech isn't available, the manual
 * input is the primary path.
 */
export default function VoiceBar({
  supported,
  listening,
  interim,
  transcript,
  error,
  onStart,
  onStop,
  onTextSubmit,
  examples = [],
}) {
  const [text, setText] = useState('');

  const submitText = (e) => {
    e.preventDefault();
    const value = text.trim();
    if (!value) return;
    onTextSubmit(value);
    setText('');
  };

  const errorMessages = {
    'not-allowed': 'Microphone permission denied. Enable it in your browser settings.',
    'service-not-allowed': 'Microphone access is blocked by your browser.',
    'no-speech': "I didn't catch that — please try again.",
    'audio-capture': 'No microphone found on this device.',
    network: 'Speech service unavailable (check your connection).',
    aborted: null,
  };
  const errorText = error ? errorMessages[error] || `Speech error: ${error}` : null;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex flex-col items-center gap-3 sm:flex-row sm:items-center">
        <button
          type="button"
          onClick={listening ? onStop : onStart}
          disabled={!supported}
          aria-label={listening ? 'Stop listening' : 'Start listening'}
          className={`relative flex h-16 w-16 items-center justify-center rounded-full text-white transition ${
            listening
              ? 'bg-red-500 hover:bg-red-600'
              : 'bg-brand-600 hover:bg-brand-700 disabled:cursor-not-allowed disabled:bg-slate-300'
          }`}
        >
          {listening && (
            <span className="absolute inset-0 rounded-full bg-red-400 animate-pulse-ring" />
          )}
          <MicIcon className="relative h-7 w-7" />
        </button>

        <div className="flex-1 text-center sm:text-left">
          <div className="text-sm font-medium text-slate-700">
            {listening ? 'Listening… speak now' : supported ? 'Tap the mic and speak a command' : 'Voice not supported — type below'}
          </div>
          <div className="mt-1 min-h-[1.5rem] text-slate-500">
            {interim && <span className="italic">{interim}</span>}
            {!interim && transcript && <span className="text-slate-700">{transcript}</span>}
            {!interim && !transcript && !listening && (
              <span className="text-xs">e.g. “Add milk”, “I need 3 apples”, “Remove bread”</span>
            )}
          </div>
        </div>
      </div>

      <form onSubmit={submitText} className="mt-3 flex gap-2">
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Or type a command…"
          className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
        />
        <button
          type="submit"
          className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
        >
          Send
        </button>
      </form>

      {errorText && (
        <p className="mt-2 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{errorText}</p>
      )}

      {examples.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {examples.map((ex) => (
            <span
              key={ex}
              className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-600"
            >
              {ex}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

function MicIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
      <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
      <line x1="12" y1="19" x2="12" y2="23" />
      <line x1="8" y1="23" x2="16" y2="23" />
    </svg>
  );
}
