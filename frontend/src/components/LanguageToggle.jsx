import { LANGUAGES } from '../lib/languages.js';

/**
 * Language picker. Selecting a language updates both the SpeechRecognition
 * `lang` code and the backend `parseLang` used for intent parsing.
 */
export default function LanguageToggle({ value, onChange }) {
  return (
    <div className="inline-flex rounded-lg border border-slate-200 bg-white p-1 shadow-sm">
      {LANGUAGES.map((lang) => (
        <button
          key={lang.code}
          type="button"
          onClick={() => onChange(lang.code)}
          className={`rounded-md px-3 py-1.5 text-sm font-medium transition ${
            value === lang.code
              ? 'bg-brand-600 text-white'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
          aria-pressed={value === lang.code}
        >
          {lang.label}
        </button>
      ))}
    </div>
  );
}
