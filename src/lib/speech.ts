"use client";

/**
 * Thin wrappers around the browser's built-in Web Speech API — no
 * external voice service, per the spec. Every export here is
 * feature-detected; callers must check isSpeechSynthesisSupported() /
 * isSpeechRecognitionSupported() before use and fall back to plain text
 * when either is false (not every browser implements SpeechRecognition,
 * notably Firefox).
 */

export function isSpeechSynthesisSupported(): boolean {
  return typeof window !== "undefined" && "speechSynthesis" in window;
}

export function isSpeechRecognitionSupported(): boolean {
  if (typeof window === "undefined") return false;
  return Boolean(getSpeechRecognitionCtor());
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getSpeechRecognitionCtor(): any {
  if (typeof window === "undefined") return undefined;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
}

/** Speaks text aloud and resolves when speech ends (or immediately if
 * unsupported/cancelled) — callers use this to know when to switch the
 * waveform / UI state back to "listening". */
export function speak(text: string, onStart?: () => void, onEnd?: () => void): void {
  if (!isSpeechSynthesisSupported() || !text.trim()) {
    onEnd?.();
    return;
  }
  window.speechSynthesis.cancel(); // never overlap with a previous utterance
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.rate = 1;
  utterance.pitch = 1;
  utterance.onstart = () => onStart?.();
  utterance.onend = () => onEnd?.();
  utterance.onerror = () => onEnd?.();
  window.speechSynthesis.speak(utterance);
}

export function stopSpeaking(): void {
  if (isSpeechSynthesisSupported()) window.speechSynthesis.cancel();
}

export interface SpeechRecognizerHandlers {
  onInterimResult?: (text: string) => void;
  onFinalResult?: (text: string) => void;
  onError?: (message: string) => void;
  onEnd?: () => void;
}

/** Wraps the (webkit-prefixed) SpeechRecognition API in a small class
 * with a stable interface, since the browser API itself is a bag of
 * mutable callbacks on a constructed instance rather than something
 * with start/stop semantics matching how a React component wants to
 * use it (create once, attach handlers, start/stop repeatedly). */
export class SpeechRecognizer {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private recognition: any = null;
  private accumulatedText = "";
  private isRunning = false;

  constructor(private handlers: SpeechRecognizerHandlers) {
    const Ctor = getSpeechRecognitionCtor();
    if (!Ctor) return;
    this.recognition = new Ctor();
    this.recognition.continuous = true;
    this.recognition.interimResults = true;
    this.recognition.lang = "en-US";

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    this.recognition.onresult = (event: any) => {
      let interim = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          this.accumulatedText += (this.accumulatedText ? " " : "") + transcript.trim();
          this.handlers.onFinalResult?.(this.accumulatedText);
        } else {
          interim += transcript;
        }
      }
      if (interim) this.handlers.onInterimResult?.((this.accumulatedText + " " + interim).trim());
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    this.recognition.onerror = (event: any) => {
      // "no-speech" fires constantly on silence in continuous mode —
      // not a real error worth surfacing to the user.
      if (event.error !== "no-speech") {
        this.handlers.onError?.(String(event.error ?? "Speech recognition error"));
      }
    };

    this.recognition.onend = () => {
      this.isRunning = false;
      this.handlers.onEnd?.();
    };
  }

  get supported(): boolean {
    return this.recognition !== null;
  }

  start(): void {
    if (!this.recognition || this.isRunning) return;
    this.accumulatedText = "";
    try {
      this.recognition.start();
      this.isRunning = true;
    } catch {
      // start() throws if already started — safe to ignore.
    }
  }

  stop(): void {
    if (!this.recognition || !this.isRunning) return;
    this.recognition.stop();
  }

  get transcript(): string {
    return this.accumulatedText;
  }
}
