/** Dźwięki z Web Audio (grają dopiero po pierwszym kliknięciu na stronie). */
export interface Sound {
  /** Trafiona odpowiedź / punkty – głośny dzwonek „ding-ding”. */
  ding: () => void;
  buzz: () => void;
  beep: () => void;
  /** Długie, głośne „piii” – koniec odliczania po pokazaniu pytania. */
  whistle: () => void;
  /** Krótkie tyknięcie przy każdym przeskoku licznika punktów. */
  tick: () => void;
}

/** Głośność całości (0–1); kompresor pilnuje, żeby nałożone dźwięki nie przesterowały. */
const MASTER_VOLUME = 0.9;

interface Tone {
  freq: number;
  dur: number;
  type: OscillatorType;
  vol: number;
}

/** Wyjście z kompresorem – głośniej bez trzasków przy nakładaniu się dźwięków. */
function createOutput(ctx: AudioContext): AudioNode {
  const master = ctx.createGain();
  master.gain.value = MASTER_VOLUME;
  const comp = ctx.createDynamicsCompressor();
  comp.threshold.value = -12;
  comp.ratio.value = 6;
  master.connect(comp);
  comp.connect(ctx.destination);
  return master;
}

/** Jeden ton z szybkim narastaniem (bez kliknięcia) i wykładniczym wybrzmieniem. */
function playTone(ctx: AudioContext, out: AudioNode, t: Tone, delay = 0) {
  const start = ctx.currentTime + delay;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = t.type;
  osc.frequency.value = t.freq;
  gain.gain.setValueAtTime(0.0001, start);
  gain.gain.exponentialRampToValueAtTime(t.vol, start + 0.008);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + t.dur);
  osc.connect(gain);
  gain.connect(out);
  osc.start(start);
  osc.stop(start + t.dur + 0.02);
}

/** Dzwonek: ton podstawowy + alikwoty, jak uderzenie w metal. */
function bell(freq: number, dur: number): Tone[] {
  return [
    { freq, dur, type: "sine", vol: 0.6 },
    { freq: freq * 2, dur: dur * 0.7, type: "sine", vol: 0.3 },
    { freq: freq * 3.01, dur: dur * 0.4, type: "triangle", vol: 0.2 },
    { freq, dur: 0.12, type: "square", vol: 0.12 },
  ];
}

export function createSound(muted: boolean): Sound {
  let ctx: AudioContext | null = null;
  let out: AudioNode | null = null;
  const play = (tones: Tone[], delay = 0) => {
    if (muted) return;
    try {
      ctx = ctx ?? new AudioContext();
      out = out ?? createOutput(ctx);
      if (ctx.state === "suspended") void ctx.resume().catch((err: unknown) => console.warn("[sound] resume failed", err));
      for (const t of tones) playTone(ctx, out, t, delay);
    } catch (err) {
      console.warn("[sound] Web Audio unavailable", err);
    }
  };
  return {
    ding: () => {
      play(bell(988, 0.6));
      play(bell(1319, 0.9), 0.16);
    },
    buzz: () => play([
      { freq: 110, dur: 0.9, type: "sawtooth", vol: 0.5 },
      { freq: 116, dur: 0.9, type: "square", vol: 0.3 },
    ]),
    beep: () => play([{ freq: 880, dur: 0.18, type: "square", vol: 0.35 }]),
    whistle: () => play([
      { freq: 1000, dur: 1.3, type: "square", vol: 0.45 },
      { freq: 1006, dur: 1.3, type: "square", vol: 0.3 },
      { freq: 2000, dur: 1.1, type: "sine", vol: 0.25 },
    ]),
    tick: () => play([{ freq: 1800, dur: 0.04, type: "square", vol: 0.15 }]),
  };
}
