import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * useSpeechRecognition
 *
 * Wraps the browser-native Web Speech API (SpeechRecognition). It is free,
 * requires no API key, and supports many languages via the `lang` BCP-47 code.
 *
 * Returns: { supported, listening, transcript, interim, error, start, stop }.
 * `onFinalResult(text)` fires once a final utterance is recognized.
 *
 * Error codes we surface gracefully:
 *   not-allowed / service-not-allowed -> microphone permission denied
 *   no-speech                       -> silence / nothing recognized
 *   audio-capture                   -> no microphone found
 *   network                        -> offline / API unreachable
 *   aborted                        -> user/code stopped listening
 */
export function useSpeechRecognition({ lang = 'en-US', onFinalResult } = {}) {
  const SpeechRecognition =
    typeof window !== 'undefined' &&
    (window.SpeechRecognition || window.webkitSpeechRecognition);

  const supported = Boolean(SpeechRecognition);
  const recognitionRef = useRef(null);
  const [listening, setListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [interim, setInterim] = useState('');
  const [error, setError] = useState(null);

  const onFinalResultRef = useRef(onFinalResult);
  useEffect(() => {
    onFinalResultRef.current = onFinalResult;
  }, [onFinalResult]);

  useEffect(() => {
    if (!supported) return undefined;

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = lang;

    recognition.onresult = (event) => {
      let interimText = '';
      let finalText = '';
      for (let i = event.resultIndex; i < event.results.length; i += 1) {
        const result = event.results[i];
        if (result.isFinal) finalText += result[0].transcript;
        else interimText += result[0].transcript;
      }
      if (interimText) setInterim(interimText);
      if (finalText) {
        const text = finalText.trim();
        setTranscript(text);
        setInterim('');
        onFinalResultRef.current?.(text);
      }
    };

    recognition.onerror = (event) => {
      setError(event.error || 'speech-error');
      setListening(false);
    };

    recognition.onend = () => {
      setListening(false);
      setInterim('');
    };

    recognitionRef.current = recognition;
    return () => {
      try {
        recognition.abort();
      } catch {
        /* noop */
      }
      recognitionRef.current = null;
    };
  }, [supported, lang, SpeechRecognition]);

  const start = useCallback(() => {
    if (!supported || !recognitionRef.current) return;
    setError(null);
    setTranscript('');
    setInterim('');
    try {
      recognitionRef.current.start();
      setListening(true);
    } catch {
      // start() throws if already started; ignore.
    }
  }, [supported]);

  const stop = useCallback(() => {
    if (!recognitionRef.current) return;
    try {
      recognitionRef.current.stop();
    } catch {
      /* noop */
    }
    setListening(false);
  }, []);

  return { supported, listening, transcript, interim, error, start, stop };
}
