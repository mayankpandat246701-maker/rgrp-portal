"use client";

import { useSyncExternalStore } from "react";
import { Volume2, VolumeX } from "lucide-react";
import {
  isClickSoundEnabled,
  playClickSound,
  setClickSoundEnabled,
  subscribeClickSound,
} from "@/lib/click-sound";

export function SoundToggle({ className = "" }: { className?: string }) {
  const enabled = useSyncExternalStore(subscribeClickSound, isClickSoundEnabled, () => true);

  return (
    <button
      type="button"
      aria-pressed={enabled}
      aria-label={enabled ? "क्लिक ध्वनि बंद करें" : "क्लिक ध्वनि चालू करें"}
      title={enabled ? "Click sound: on" : "Click sound: off"}
      onClick={() => {
        setClickSoundEnabled(!enabled);
        if (!enabled) playClickSound();
      }}
      className={`glass inline-flex size-10 items-center justify-center rounded-full text-cocoa-800 transition hover:bg-white/85 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-saffron-700 active:scale-95 ${className}`}
    >
      {enabled ? <Volume2 aria-hidden className="size-4" /> : <VolumeX aria-hidden className="size-4" />}
    </button>
  );
}
