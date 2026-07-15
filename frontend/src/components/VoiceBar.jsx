import { useState } from 'react';
import Icon from './Icons.jsx';
import { LANGUAGES } from '../lib/languages.js';

/**
 * VoiceBar — the central mic control with live waveform animation, the real-time
 * transcript bubble, an action-confirmation line, a speech-language selector, and
 * a manual text fallback. Mirrors the polished voice card from the reference UI
 * while staying wired to the backend command loop (onTextSubmit).
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
  languageCode,
  onLanguageChange,
  engineStatus = 'Ready (Backend Engine)',
  confirmation = null,
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

  const heardText =
    interim || transcript
      ? `"${interim || transcript}"`
      : listening
        ? 'Listening now… speak your command.'
        : 'Tap the microphone above to start speaking…';

  return (
    <div className="relative flex flex-col items-center overflow-hidden rounded-3xl border border-slate-100 bg-white p-6 text-center shadow-sm dark:border-slate-700/60 dark:bg-slate-800">
      <div className="absolute right-3 top-3 flex items-center gap-1 rounded-full bg-slate-100 py-1 pl-2 pr-2.5 dark:bg-slate-700">
        <span
          className={`h-2.5 w-2.5 rounded-full ${
            listening ? 'animate-pulse bg-emerald-500' : 'bg-emerald-500'
          }`}
        />
        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">
          {listening ? 'Listening…' : engineStatus}
        </span>
      </div>

      <h2 className="mt-2 mb-1 text-lg font-bold text-slate-800 dark:text-slate-100">Voice Assistant</h2>
      <p className="mb-6 max-w-[240px] text-xs text-slate-400">
        Tap the microphone and instruct in natural speech.
      </p>

      <div className="relative mb-6 flex items-center justify-center">
        <button
          type="button"
          onClick={listening ? onStop : onStart}
          disabled={!supported}
          aria-label={listening ? 'Stop listening' : 'Start listening'}
          className={`mic-active-hover relative z-10 flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-tr from-emerald-500 to-green-400 text-white shadow-xl shadow-emerald-500/30 transition-all duration-300 hover:scale-105 active:scale-95 ${
            listening ? 'mic-active' : ''
          } ${!supported ? 'cursor-not-allowed opacity-50' : ''}`}
        >
          {listening && (
            <>
              <span className="absolute h-28 w-28 animate-pulse-ring rounded-full border-2 border-emerald-500/20" />
              <span className="absolute h-36 w-36 animate-pulse-ring rounded-full border border-emerald-500/10" />
            </>
          )}
          <Icon name="mic" className="h-10 w-10" />
        </button>
      </div>

      {/* Real-time waveform */}
      <div className={`mb-4 flex h-8 items-center justify-center ${listening ? 'mic-listening' : ''}`}>
        <span className="wave" />
        <span className="wave" />
        <span className="wave" />
        <span className="wave" />
        <span className="wave" />
      </div>

      {/* Live transcript + confirmation */}
      <div className="flex min-h-[90px] w-full flex-col justify-between rounded-2xl border border-slate-100 bg-slate-50 p-4 text-left dark:border-slate-700/40 dark:bg-slate-900/60">
        <div>
          <div className="mb-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
            Heard Transcript:
          </div>
          <p
            className={`text-sm font-medium ${
              interim || transcript
                ? 'not-italic text-slate-700 dark:text-white'
                : 'italic text-slate-500 dark:text-slate-300'
            }`}
          >
            {heardText}
          </p>
        </div>
        {confirmation && (
          <div className="mt-2 flex items-center gap-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
            <Icon name="check-circle" className="h-3.5 w-3.5" />
            <span>{confirmation}</span>
          </div>
        )}
      </div>

      {/* Manual command fallback */}
      <form onSubmit={submitText} className="mt-4 flex w-full gap-2">
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={supported ? 'Or type a command…' : 'Type a command (voice unsupported)…'}
          className="flex-1 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm outline-none transition-all focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 dark:border-slate-700/80 dark:bg-slate-900 dark:text-slate-100"
        />
        <button
          type="submit"
          className="rounded-2xl bg-emerald-500 px-4 py-2.5 text-sm font-bold text-white shadow-lg shadow-emerald-500/15 transition-all hover:bg-emerald-600 active:scale-95"
        >
          Send
        </button>
      </form>

      {/* Language selector — prominent so multilingual support is demonstrable */}
      <div className="mt-4 w-full rounded-2xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-900">
        <div className="flex items-center justify-between gap-2">
          <span className="flex items-center gap-1.5 text-xs font-bold text-slate-600 dark:text-slate-300">
            <Icon name="languages" className="h-4 w-4 text-emerald-500" />
            Speech Language
          </span>
          <select
            value={languageCode}
            onChange={(e) => onLanguageChange(e.target.value)}
            className="cursor-pointer rounded-lg border border-slate-200 bg-white py-1.5 pl-3 pr-8 text-xs font-bold text-slate-700 outline-none focus:border-emerald-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
          >
            {LANGUAGES.map((lang) => (
              <option key={lang.code} value={lang.code}>
                {lang.label}
              </option>
            ))}
          </select>
        </div>
        <p className="mt-1.5 text-[10px] text-slate-400 dark:text-slate-500">
          Choose English, Español, or हिन्दी. The voice engine listens in the selected language.
        </p>
      </div>

      {errorText && (
        <p className="mt-3 w-full rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950/40 dark:text-red-300">
          {errorText}
        </p>
      )}

      {!supported && (
        <p className="mt-3 w-full rounded-xl bg-amber-50 px-3 py-2 text-xs text-amber-700 dark:bg-amber-950/40 dark:text-amber-300">
          Speech recognition isn&apos;t supported in this browser. Use the text input above to type commands.
        </p>
      )}

      {examples.length > 0 && (
        <div className="mt-4 flex w-full flex-wrap gap-2">
          {examples.map((ex) => (
            <span
              key={ex}
              className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-600 dark:bg-slate-700/60 dark:text-slate-300"
            >
              {ex}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
