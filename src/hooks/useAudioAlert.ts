import { useEffect, useRef, useState, useCallback } from 'react';

import { Platform } from 'react-native';

/**
 * useAudioAlert: Web Audio API notification chime hook for shopkeeper tablets
 * Generates an attention-grabbing dual-harmonic chime without any external audio file dependencies.
 */
export function useAudioAlert(shouldRing: boolean) {
  const [isMuted, setIsMuted] = useState(false);
  const [isRinging, setIsRinging] = useState(false);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const intervalRef = useRef<number | null>(null);

  // Initialize or resume AudioContext
  const getAudioContext = useCallback((): AudioContext | null => {
    if (Platform.OS !== 'web' || typeof window === 'undefined') return null;

    if (!audioCtxRef.current) {
      const AudioContextClass =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioContextClass) {
        audioCtxRef.current = new AudioContextClass();
      }
    }

    if (audioCtxRef.current && audioCtxRef.current.state === 'suspended') {
      audioCtxRef.current.resume();
    }

    return audioCtxRef.current;
  }, []);

  // Synthesize single dual-tone shop bell (C5: 523.25Hz -> G5: 783.99Hz)
  const playChime = useCallback(() => {
    if (isMuted) return;
    const ctx = getAudioContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;

      // Note 1: C5 (523.25 Hz)
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(523.25, now);
      gain1.gain.setValueAtTime(0.3, now);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.38);
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start(now);
      osc1.stop(now + 0.4);

      // Note 2: G5 (783.99 Hz) delayed by 130ms
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(783.99, now + 0.13);
      gain2.gain.setValueAtTime(0.35, now + 0.13);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.6);
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.start(now + 0.13);
      osc2.stop(now + 0.65);
    } catch (e) {
      console.warn('Audio playback error:', e);
    }
  }, [isMuted, getAudioContext]);

  // Start looping every 1.8 seconds
  const startLoop = useCallback(() => {
    if (intervalRef.current !== null) return;
    playChime();
    setIsRinging(true);
    intervalRef.current = setInterval(() => {
      playChime();
    }, 1800) as unknown as number;
  }, [playChime]);

  // Stop looping chime
  const stopLoop = useCallback(() => {
    if (intervalRef.current !== null) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setIsRinging(false);
  }, []);

  // Mute / Unmute
  const toggleMute = useCallback(() => {
    setIsMuted((prev) => {
      const next = !prev;
      if (next) {
        stopLoop();
      }
      return next;
    });
  }, [stopLoop]);

  // Synchronize with `shouldRing` prop
  useEffect(() => {
    if (shouldRing && !isMuted) {
      startLoop();
    } else {
      stopLoop();
    }

    return () => {
      stopLoop();
    };
  }, [shouldRing, isMuted, startLoop, stopLoop]);

  return {
    isRinging,
    isMuted,
    toggleMute,
    playChime,
    stopLoop,
  };
}
