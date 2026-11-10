/**
 * Tiny synthesised sound kit. No audio files, no network, no autoplay:
 * the context is created on the first real user gesture.
 */

let ctx = null;
let master = null;
let muted = false;
let lastShot = 0;

export function initAudio() {
  if (ctx) {
    if (ctx.state === 'suspended') ctx.resume().catch(() => {});
    return;
  }
  const AudioCtor = window.AudioContext || window.webkitAudioContext;
  if (!AudioCtor) return;
  ctx = new AudioCtor();
  master = ctx.createGain();
  master.gain.value = muted ? 0 : 0.5;
  master.connect(ctx.destination);
}

export function setMuted(value) {
  muted = Boolean(value);
  if (master && ctx) {
    master.gain.setTargetAtTime(muted ? 0 : 0.5, ctx.currentTime, 0.02);
  }
}

export function isMuted() {
  return muted;
}

function tone({ freq, to = freq, dur = 0.1, type = 'sine', vol = 0.05, delay = 0 }) {
  if (!ctx || !master || muted) return;
  const start = ctx.currentTime + delay;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(Math.max(20, freq), start);
  if (to !== freq) osc.frequency.exponentialRampToValueAtTime(Math.max(20, to), start + dur);
  gain.gain.setValueAtTime(0.0001, start);
  gain.gain.exponentialRampToValueAtTime(Math.max(0.0002, vol), start + 0.008);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + dur);
  osc.connect(gain);
  gain.connect(master);
  osc.start(start);
  osc.stop(start + dur + 0.03);
}

export function sfx(name) {
  if (!ctx) return;
  const now = performance.now();
  switch (name) {
    case 'shoot':
      if (now - lastShot < 55) return;
      lastShot = now;
      tone({ freq: 940, to: 620, dur: 0.045, type: 'square', vol: 0.014 });
      break;
    case 'hit':
      tone({ freq: 210, to: 150, dur: 0.035, type: 'triangle', vol: 0.016 });
      break;
    case 'kill':
      tone({ freq: 170, to: 70, dur: 0.09, type: 'triangle', vol: 0.03 });
      break;
    case 'hurt':
      tone({ freq: 150, to: 55, dur: 0.24, type: 'sawtooth', vol: 0.05 });
      tone({ freq: 90, to: 45, dur: 0.28, type: 'square', vol: 0.022 });
      break;
    case 'dash':
      tone({ freq: 260, to: 760, dur: 0.13, type: 'sine', vol: 0.03 });
      break;
    case 'level':
      [523, 659, 784, 1046].forEach((freq, i) => {
        tone({ freq, dur: 0.16, type: 'triangle', vol: 0.035, delay: i * 0.055 });
      });
      break;
    case 'choose':
      tone({ freq: 640, to: 960, dur: 0.12, type: 'triangle', vol: 0.035 });
      break;
    case 'elite':
      tone({ freq: 96, to: 64, dur: 0.3, type: 'sawtooth', vol: 0.035 });
      break;
    case 'boss':
      tone({ freq: 72, to: 38, dur: 0.7, type: 'sawtooth', vol: 0.055 });
      tone({ freq: 110, to: 55, dur: 0.7, type: 'square', vol: 0.02 });
      break;
    case 'start':
      [196, 294, 392].forEach((freq, i) => {
        tone({ freq, dur: 0.2, type: 'triangle', vol: 0.035, delay: i * 0.06 });
      });
      break;
    case 'win':
      [392, 523, 659, 784, 1046].forEach((freq, i) => {
        tone({ freq, dur: 0.3, type: 'triangle', vol: 0.04, delay: i * 0.11 });
      });
      break;
    case 'lose':
      [330, 262, 208, 147].forEach((freq, i) => {
        tone({ freq, dur: 0.3, type: 'sawtooth', vol: 0.03, delay: i * 0.13 });
      });
      break;
    case 'click':
      tone({ freq: 620, to: 720, dur: 0.04, type: 'square', vol: 0.018 });
      break;
    default:
      break;
  }
}
