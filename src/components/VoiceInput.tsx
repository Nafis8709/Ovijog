"use client";

// Speak your story instead of typing it.
// Uses the browser's built-in speech recognition (works in Chrome and Edge).
// If the browser does not support it, the button is not shown.

import { useEffect, useRef, useState } from "react";

interface Props {
  onText: (text: string) => void; // called with each finished sentence
}

// Minimal types for the Web Speech API (not in TypeScript's DOM types).
interface SpeechResultEvent {
  resultIndex: number;
  results: ArrayLike<{ isFinal: boolean; 0: { transcript: string } }>;
}
interface SpeechRecognitionLike {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onresult: ((event: SpeechResultEvent) => void) | null;
  onend: (() => void) | null;
  onerror: (() => void) | null;
  start: () => void;
  stop: () => void;
}

function getRecognitionClass(): (new () => SpeechRecognitionLike) | null {
  if (typeof window === "undefined") {
    return null;
  }
  const w = window as unknown as {
    SpeechRecognition?: new () => SpeechRecognitionLike;
    webkitSpeechRecognition?: new () => SpeechRecognitionLike;
  };
  return w.SpeechRecognition || w.webkitSpeechRecognition || null;
}

export default function VoiceInput({ onText }: Props) {
  const [supported, setSupported] = useState(false);
  const [listening, setListening] = useState(false);
  const [language, setLanguage] = useState<"bn-BD" | "en-US">("bn-BD");
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);

  useEffect(() => {
    // Checked after mount so server and client render the same HTML.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSupported(getRecognitionClass() !== null);
  }, []);

  function start() {
    const Recognition = getRecognitionClass();
    if (Recognition === null) {
      return;
    }
    const recognition = new Recognition();
    recognition.lang = language;
    recognition.continuous = true;
    recognition.interimResults = false;
    recognition.onresult = (event) => {
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          onText(result[0].transcript.trim());
        }
      }
    };
    recognition.onend = () => setListening(false);
    recognition.onerror = () => setListening(false);
    recognitionRef.current = recognition;
    recognition.start();
    setListening(true);
  }

  function stop() {
    if (recognitionRef.current !== null) {
      recognitionRef.current.stop();
    }
    setListening(false);
  }

  if (!supported) {
    return null;
  }

  return (
    <div className="flex flex-wrap items-center gap-2 text-sm">
      <button type="button" className={`btn ${listening ? "btn-primary" : "btn-quiet"} py-1.5`} onClick={listening ? stop : start}>
        {listening ? "Stop recording" : "Speak instead"}
      </button>
      <label className="flex items-center gap-1 text-ink-soft">
        Language
        <select
          className="field w-auto py-1"
          value={language}
          onChange={(event) => setLanguage(event.target.value as "bn-BD" | "en-US")}
          disabled={listening}
        >
          <option value="bn-BD">বাংলা</option>
          <option value="en-US">English</option>
        </select>
      </label>
      {listening && <span className="text-red">Listening…</span>}
    </div>
  );
}
