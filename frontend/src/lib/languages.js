// Languages the UI exposes. `speechCode` is the BCP-47 tag passed to the
// Web Speech API (SpeechRecognition.lang). `parseLang` is the code sent to the
// backend intent parser (en/es/hi). The backend rule engine has keyword
// dictionaries for each of these.
export const LANGUAGES = [
  {
    code: 'en',
    label: 'English',
    speechCode: 'en-US',
    parseLang: 'en',
    examples: ['Add milk', 'I need 3 apples', 'Remove bread', 'Search cheese'],
  },
  {
    code: 'es',
    label: 'Español',
    speechCode: 'es-ES',
    parseLang: 'es',
    examples: ['Agregar leche', 'Quiero comprar dos botellas de agua', 'Quitar pan'],
  },
  {
    code: 'hi',
    label: 'हिन्दी',
    speechCode: 'hi-IN',
    parseLang: 'hi',
    examples: ['दूध जोड़ें', 'सेब लाना', 'ब्रेड हटा दो'],
  },
];

export function getLanguage(code) {
  return LANGUAGES.find((l) => l.code === code) || LANGUAGES[0];
}
