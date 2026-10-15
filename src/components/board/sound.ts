/** Proste dźwięki z Web Audio (grają dopiero po pierwszym kliknięciu na stronie). */
export interface Sound {
  ding: () => void;
  buzz: () => void;
  beep: () => void;
}

export function createSound(muted: boolean): Sound {
  let ctx: AudioContext | null = null;
  const tone = (freq: number, dur: number, type: OscillatorType = "square", vol = 0.08) => {
    if (muted) return;
    try {
      ctx = ctx ?? new AudioContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = type;
      osc.frequency.value = freq;
      gain.gain.value = vol;
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + dur);
      osc.stop(ctx.currentTime + dur);
    } catch (err) {
      console.warn("[sound] Web Audio unavailable", err);
    }
  };
  return {
    ding: () => {
      tone(880, 0.15);
      window.setTimeout(() => tone(1320, 0.25), 120);
    },
    buzz: () => tone(110, 0.6, "sawtooth", 0.12),
    beep: () => tone(660, 0.12),
  };
}
