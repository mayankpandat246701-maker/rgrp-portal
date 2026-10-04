"use client";

const STORAGE_KEY = "rgrp-click-sound";
const listeners = new Set<() => void>();
let audioContext: AudioContext | null = null;

export function isClickSoundEnabled(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return window.localStorage.getItem(STORAGE_KEY) !== "off";
  } catch {
    return true;
  }
}

export function setClickSoundEnabled(enabled: boolean) {
  try {
    window.localStorage.setItem(STORAGE_KEY, enabled ? "on" : "off");
  } catch {
    // Storage may be unavailable (private mode); the preference just won't persist.
  }
  listeners.forEach((listener) => listener());
}

export function subscribeClickSound(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

// Synthesised on demand so nothing is downloaded or played before a user gesture.
export function playClickSound() {
  if (!isClickSoundEnabled()) return;
  try {
    const AudioContextClass =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;
    audioContext ??= new AudioContextClass();
    if (audioContext.state === "suspended") void audioContext.resume();

    const now = audioContext.currentTime;
    const oscillator = audioContext.createOscillator();
    const gain = audioContext.createGain();

    oscillator.type = "sine";
    oscillator.frequency.setValueAtTime(1400, now);
    oscillator.frequency.exponentialRampToValueAtTime(700, now + 0.05);

    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.05, now + 0.005);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.07);

    oscillator.connect(gain).connect(audioContext.destination);
    oscillator.start(now);
    oscillator.stop(now + 0.08);
  } catch {
    // Audio is a non-essential enhancement.
  }
}
