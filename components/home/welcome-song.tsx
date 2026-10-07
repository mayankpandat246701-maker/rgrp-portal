"use client";

import { useEffect, useRef } from "react";

export function WelcomeSong() {
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    audio.volume = 0.15; // slow/low volume
    audio.loop = false;

    const stopAfter = () => {
      setTimeout(() => {
        audio.pause();
        audio.currentTime = 0;
      }, 18000);
    };

    // 1) Page load par autoplay try karo
    audio
      .play()
      .then(() => {
        stopAfter();
      })
      .catch(() => {
        // 2) Autoplay block ho to first interaction par play
        const playOnInteraction = () => {
          audio.volume = 0.15;
          audio
            .play()
            .then(() => {
              stopAfter();
            })
            .catch(() => {});
          window.removeEventListener("click", playOnInteraction);
          window.removeEventListener("touchstart", playOnInteraction);
          window.removeEventListener("keydown", playOnInteraction);
        };

        window.addEventListener("click", playOnInteraction);
        window.addEventListener("touchstart", playOnInteraction);
        window.addEventListener("keydown", playOnInteraction);
      });
  }, []);

  return <audio ref={audioRef} src="/audio/jai-ho-15s.mp3" preload="auto" />;
}