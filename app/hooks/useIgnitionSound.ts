// hooks/useIgnitionSound.ts
"use client";

import { useCallback, useRef } from "react";

/**
 * Plays ignition audio feedback. Tries a real engine-start sample first
 * (drop your own file at /public/sounds/engine-start.mp3), and falls back
 * to a synthesized crank + rumble via Web Audio so the demo works with
 * zero audio assets. Also exposes short denied/lock beeps.
 */
export function useIgnitionSound() {
  const ctxRef = useRef<AudioContext | null>(null);
  const audioElRef = useRef<HTMLAudioElement | null>(null);

  const getCtx = () => {
    if (!ctxRef.current) {
      const Ctx = window.AudioContext || (window as any).webkitAudioContext;
      ctxRef.current = new Ctx();
    }
    return ctxRef.current;
  };

  const playSample = useCallback((): Promise<boolean> => {
    return new Promise((resolve) => {
      const el = new Audio("/sounds/engine-start.mp3");
      audioElRef.current = el;
      el.addEventListener("canplaythrough", () => {
        el.play();
        resolve(true);
      });
      el.addEventListener("error", () => resolve(false));
      // Give it a beat to resolve either way if events never fire
      setTimeout(() => resolve(false), 400);
    });
  }, []);

  /** Synthesized starter-motor crank followed by an engine rumble. */
  const playSynthesizedStart = useCallback(() => {
    const ctx = getCtx();
    const now = ctx.currentTime;

    // --- Crank: short rhythmic clicks that speed up, like a starter motor ---
    const crankTimes = [0, 0.14, 0.26, 0.36, 0.44];
    crankTimes.forEach((t) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "square";
      osc.frequency.setValueAtTime(90, now + t);
      gain.gain.setValueAtTime(0.15, now + t);
      gain.gain.exponentialRampToValueAtTime(0.001, now + t + 0.08);
      osc.connect(gain).connect(ctx.destination);
      osc.start(now + t);
      osc.stop(now + t + 0.09);
    });

    // --- Catch + rumble: low sawtooth ramping up then settling to idle ---
    const rumbleStart = now + 0.5;
    const engine = ctx.createOscillator();
    const engineGain = ctx.createGain();
    engine.type = "sawtooth";
    engine.frequency.setValueAtTime(55, rumbleStart);
    engine.frequency.linearRampToValueAtTime(140, rumbleStart + 0.25);
    engine.frequency.linearRampToValueAtTime(75, rumbleStart + 1.1);

    engineGain.gain.setValueAtTime(0, rumbleStart);
    engineGain.gain.linearRampToValueAtTime(0.18, rumbleStart + 0.2);
    engineGain.gain.linearRampToValueAtTime(0.08, rumbleStart + 1.4);
    engineGain.gain.linearRampToValueAtTime(0, rumbleStart + 1.8);

    // low-pass so it feels like a muffled engine, not a raw buzz
    const filter = ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = 400;

    engine.connect(filter).connect(engineGain).connect(ctx.destination);
    engine.start(rumbleStart);
    engine.stop(rumbleStart + 1.9);
  }, []);

  const playStart = useCallback(async () => {
    const playedSample = await playSample();
    if (!playedSample) playSynthesizedStart();
  }, [playSample, playSynthesizedStart]);

  const playDenied = useCallback(() => {
    const ctx = getCtx();
    const now = ctx.currentTime;
    [0, 0.12].forEach((t) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "square";
      osc.frequency.setValueAtTime(220, now + t);
      gain.gain.setValueAtTime(0.12, now + t);
      gain.gain.exponentialRampToValueAtTime(0.001, now + t + 0.1);
      osc.connect(gain).connect(ctx.destination);
      osc.start(now + t);
      osc.stop(now + t + 0.11);
    });
  }, []);

  const playScanBeep = useCallback(() => {
    const ctx = getCtx();
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(880, now);
    gain.gain.setValueAtTime(0.08, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
    osc.connect(gain).connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.13);
  }, []);

  const stop = useCallback(() => {
    audioElRef.current?.pause();
  }, []);

  return { playStart, playDenied, playScanBeep, stop };
}
