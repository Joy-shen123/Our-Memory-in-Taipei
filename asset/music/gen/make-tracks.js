#!/usr/bin/env node
// make-tracks.js — renders the four decade loops for the music player (issue #4).
//
//   node asset/music/gen/make-tracks.js            # writes 1980s.wav … 2010s.wav next to this script
//   node asset/music/gen/make-tracks.js --mp3      # …and converts each to asset/music/<decade>.mp3 with ffmpeg
//
// Everything is synthesised here from sine, saw, square, noise and FM: no samples, no libraries,
// no network. Every random choice comes from a seeded generator, so the same file renders every
// time. Each loop is rendered a few seconds long and its tail is folded back onto its head, so the
// <audio loop> seam lands inside sustained sound instead of on a cut. Output: 16-bit stereo WAV at
// 44.1 kHz; the committed MP3s are what the page loads.
'use strict';
const fs = require('fs'), path = require('path'), cp = require('child_process');

const SR = 44100;
const TAU = Math.PI * 2;
const mtof = m => 440 * Math.pow(2, (m - 69) / 12);
const clamp = (v, a, b) => v < a ? a : v > b ? b : v;

// seeded PRNG (mulberry32)
function rng(seed) { let a = seed | 0; return () => { a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }

// ── building blocks ────────────────────────────────────────────────────────────
// polyblep saw, phase 0..1, dt = phase step per sample
function saw(ph, dt) {
  let v = 2 * ph - 1;
  if (ph < dt) { const t = ph / dt; v -= t + t - t * t - 1; }
  else if (ph > 1 - dt) { const t = (ph - 1) / dt; v -= t * t + t + t + 1; }
  return v;
}
// two cascaded one-pole lowpasses (12 dB/oct), cutoff may change per sample
function lp2() { let y1 = 0, y2 = 0; return (x, fc) => { const a = 1 - Math.exp(-TAU * fc / SR); y1 += a * (x - y1); y2 += a * (y1 - y2); return y2; }; }
function lp1() { let y = 0; return (x, fc) => { y += (1 - Math.exp(-TAU * fc / SR)) * (x - y); return y; }; }
function hp1() { const l = lp1(); return (x, fc) => x - l(x, fc); }
// attack / decay to sustain / release after `hold`
function env(t, a, d, s, r, hold) {
  let v = t < a ? t / a : t < a + d ? 1 - (1 - s) * (t - a) / d : s;
  if (t > hold) v *= Math.max(0, 1 - (t - hold) / r);
  return v;
}

class Track {
  constructor({ seconds, seed, bpm, tail = 2.5 }) {
    this.loopN = Math.round(seconds * SR); this.n = this.loopN + Math.round(tail * SR);
    this.rnd = rng(seed); this.bpm = bpm; this.beat = 60 / bpm; this.buses = {};
  }
  bus(name) { return this.buses[name] || (this.buses[name] = { L: new Float32Array(this.n), R: new Float32Array(this.n) }); }
  bar(b, beat = 0, six = 0) { return (b * 4 + beat + six / 4) * this.beat; }   // bars are 0-based
  // render fn(t) into a bus from `start` for `dur` seconds
  play(bus, start, dur, gain, pan, fn) {
    const s0 = Math.round(start * SR); if (s0 >= this.n) return;
    const n = Math.min(this.n - s0, Math.ceil(dur * SR));
    const gl = gain * Math.cos((pan + 1) * Math.PI / 4), gr = gain * Math.sin((pan + 1) * Math.PI / 4);
    const L = bus.L, R = bus.R;
    for (let i = 0; i < n; i++) { const v = fn(i / SR); L[s0 + i] += v * gl; R[s0 + i] += v * gr; }
  }
  // ── bus effects ──
  reverb(bus, { size = 1, mix = 0.25, damp = 2500, fb = 0.82 } = {}) {
    const combs = [1557, 1617, 1491, 1422].map(l => Math.round(l * size)), aps = [225, 556];
    for (const ch of ['L', 'R']) {
      const x = bus[ch], wet = new Float32Array(this.n), off = ch === 'L' ? 0 : 23;
      for (const len of combs) {
        const L = len + off, d = new Float32Array(L); let idx = 0, lpv = 0;
        const a = 1 - Math.exp(-TAU * damp / SR);
        for (let i = 0; i < this.n; i++) { const y = d[idx]; lpv += a * (y - lpv); d[idx] = x[i] + lpv * fb; wet[i] += y; idx = (idx + 1) % L; }
      }
      for (const len of aps) {
        const d = new Float32Array(len); let idx = 0;
        for (let i = 0; i < this.n; i++) { const y = d[idx], v = wet[i] + y * 0.5; d[idx] = v; wet[i] = y - v * 0.5; idx = (idx + 1) % len; }
      }
      for (let i = 0; i < this.n; i++) x[i] += wet[i] * mix * 0.25;
    }
  }
  // gated reverb: reverb the bus, then let the wet part through only for `hold` s after each hit
  gatedReverb(bus, hits, { hold = 0.13, size = 1.4, mix = 1.2 } = {}) {
    const dryL = bus.L.slice(), dryR = bus.R.slice();
    this.reverb(bus, { size, mix, damp: 4000, fb: 0.86 });
    const g = new Float32Array(this.n);
    for (const h of hits) { const s = Math.round(h * SR), e = Math.min(this.n, s + Math.round((hold + 0.02) * SR)); for (let i = s; i < e; i++) { const t = (i - s) / SR; g[i] = t < hold ? 1 : 1 - (t - hold) / 0.02; } }
    for (let i = 0; i < this.n; i++) { bus.L[i] = dryL[i] + (bus.L[i] - dryL[i]) * g[i]; bus.R[i] = dryR[i] + (bus.R[i] - dryR[i]) * g[i]; }
  }
  delay(bus, time, fb, mix, pingpong = true) {
    const d = Math.round(time * SR), wL = new Float32Array(this.n), wR = new Float32Array(this.n);
    for (let i = d; i < this.n; i++) {
      wL[i] = bus.L[i - d] + fb * (pingpong ? wR[i - d] : wL[i - d]);
      wR[i] = bus.R[i - d] + fb * (pingpong ? wL[i - d] : wR[i - d]);
    }
    for (let i = 0; i < this.n; i++) { bus.L[i] += wL[i] * mix; bus.R[i] += wR[i] * mix; }
  }
  // side-chain pump: duck the bus at every time in `hits`, recover over `rel` seconds
  sidechain(bus, hits, depth = 0.8, rel = 0.32) {
    const g = new Float32Array(this.n).fill(1);
    for (const h of hits) { const s = Math.round(h * SR), e = Math.min(this.n, s + Math.round(rel * SR)); for (let i = s; i < e; i++) { const t = (i - s) / (e - s); g[i] = Math.min(g[i], 1 - depth * (1 - t) * (1 - t)); } }
    for (let i = 0; i < this.n; i++) { bus.L[i] *= g[i]; bus.R[i] *= g[i]; }
  }
  filterBus(bus, fc) { for (const ch of ['L', 'R']) { const f = lp2(), x = bus[ch]; for (let i = 0; i < this.n; i++) x[i] = f(x[i], fc); } }
  // ── master ──
  render(gains) {
    const L = new Float32Array(this.loopN), R = new Float32Array(this.loopN);
    for (const name in this.buses) {
      const g = gains[name] === undefined ? 1 : gains[name], b = this.buses[name];
      for (let i = 0; i < this.loopN; i++) { L[i] += b.L[i] * g; R[i] += b.R[i] * g; }
      for (let i = this.loopN; i < this.n; i++) { L[i - this.loopN] += b.L[i] * g; R[i - this.loopN] += b.R[i] * g; }   // fold the tail onto the head
    }
    let peak = 1e-6; for (let i = 0; i < this.loopN; i++) peak = Math.max(peak, Math.abs(L[i]), Math.abs(R[i]));
    const k = 0.89 / peak;
    for (let i = 0; i < this.loopN; i++) { L[i] = Math.tanh(L[i] * k * 1.15) / Math.tanh(1.15); R[i] = Math.tanh(R[i] * k * 1.15) / Math.tanh(1.15); }
    return { L, R };
  }
}

// ── instruments: each returns fn(t) with its own state ─────────────────────────
function kick(o = {}) { let ph = 0; const f0 = o.f0 || 160, f1 = o.f1 || 46, dec = o.dec || 0.4, sw = o.sweep || 40; return t => { const f = f1 + (f0 - f1) * Math.exp(-t * sw); ph += f / SR; const click = t < 0.003 ? (1 - t / 0.003) * 0.5 : 0; return Math.sin(TAU * ph) * Math.exp(-t * 4 / dec) + click; }; }
function snare(rnd, o = {}) { let ph = 0; const hp = hp1(), lp = lp1(), tone = o.tone || 185, nd = o.noiseDec || 0.16, nz = o.noise || 1; return t => { ph += tone / SR; const body = Math.sin(TAU * ph) * Math.exp(-t * 28) * 0.7; const n = lp(hp(rnd() * 2 - 1, 1500), 9000) * Math.exp(-t * 3.2 / nd) * nz; return body + n; }; }
function rim(rnd) { let ph = 0; const hp = hp1(); return t => { ph += 900 / SR; return (Math.sin(TAU * ph) * 0.5 + hp(rnd() * 2 - 1, 3000) * 0.5) * Math.exp(-t * 90); }; }
function hat(rnd, dec = 0.05) { const hp = hp1(); const rs = [1, 1.34, 1.71, 2.11, 2.57, 3.03]; let ph = rs.map(() => rnd()); return t => { let m = 0; for (let k = 0; k < 6; k++) { ph[k] += 3200 * rs[k] / SR; m += ph[k] % 1 < 0.5 ? 1 : -1; } return hp(m / 6 * 0.5 + (rnd() * 2 - 1) * 0.5, 7500) * Math.exp(-t * 4 / dec); }; }
function clap(rnd) { const hp = hp1(), lp = lp1(); return t => { const b = t < 0.01 ? 1 : t < 0.02 ? 0.8 : t < 0.03 ? 0.9 : Math.exp(-(t - 0.03) * 22); return lp(hp(rnd() * 2 - 1, 1200), 6500) * b; }; }
function shaker(rnd, vel) { const hp = hp1(), lp = lp1(); return t => lp(hp(rnd() * 2 - 1, 5000), 11000) * Math.exp(-t * 55) * Math.min(1, t / 0.004) * vel; }
function noiseRiser(rnd, dur) { const hp = hp1(); return t => { const u = t / dur; return hp(rnd() * 2 - 1, 300 + 6000 * u * u) * u * u; }; }

// DX7-style electric piano: 1:1 body, 14:1 tine on the attack
function ep(f, hold, vel = 1, o = {}) { const rel = o.rel || 0.25, bright = o.bright || 1; return t => { const e = env(t, 0.003, 1.6, 0.35, rel, hold) * Math.exp(-t * 0.5); const m = Math.sin(TAU * f * 14 * t) * 1.3 * bright * Math.exp(-t * 9) * vel + Math.sin(TAU * f * t) * 0.9 * Math.exp(-t * 1.8) * vel; return Math.sin(TAU * f * t + m) * e * vel; }; }
// FM bell
function bell(f, hold, ratio = 3.53, idx = 2.6) { return t => { const e = env(t, 0.002, 1.2, 0.25, 1.4, hold) * Math.exp(-t * 0.9); const m = Math.sin(TAU * f * ratio * t) * idx * Math.exp(-t * 1.6); return (Math.sin(TAU * f * t + m) + 0.25 * Math.sin(TAU * f * 2 * t + m * 0.5)) * e; }; }
// additive piano: six partials, slight stretch, faster decay on the high ones and the high notes
function piano(f, hold, vel = 1) {
  const P = []; for (let n = 1; n <= 7; n++) P.push({ f: f * n * (1 + 0.0003 * n * n), a: Math.pow(n, -1.35) * (n % 2 ? 1 : 0.75), d: (2.6 / Math.sqrt(n)) * clamp(300 / f, 0.35, 1.6) });
  return t => { let v = 0; for (const p of P) v += p.a * Math.sin(TAU * p.f * t) * Math.exp(-t / p.d); const att = Math.min(1, t / 0.003), rel = t > hold ? Math.exp(-(t - hold) * 10) : 1; return v * att * rel * vel * 0.6; };
}
// pluck: saw through a fast-closing lowpass
function pluck(f, o = {}) { let ph = 0; const lp = lp2(), dec = o.dec || 0.3, top = o.top || 4000, base = o.base || 300; return t => { ph += f / SR; if (ph >= 1) ph -= 1; const fc = base + top * Math.exp(-t * 14); return lp(saw(ph, f / SR), fc) * Math.exp(-t * 4 / dec) * Math.min(1, t / 0.002); }; }
// supersaw: n detuned saws, lowpassed, with a slow-ish attack
function supersaw(f, hold, o = {}) { const n = o.n || 7, det = o.det || 0.013, lp = lp2(), fc = o.fc || 1800, att = o.att || 0.02, rel = o.rel || 0.3, rnd = o.rnd || Math.random; const ph = [], fs = []; for (let k = 0; k < n; k++) { ph.push(rnd()); fs.push(f * (1 + det * ((k / (n - 1)) * 2 - 1))); } return t => { let v = 0; for (let k = 0; k < n; k++) { ph[k] += fs[k] / SR; if (ph[k] >= 1) ph[k] -= 1; v += saw(ph[k], fs[k] / SR); } return lp(v / n, fc) * env(t, att, 0.01, 1, rel, hold); }; }
// pad: three saws through a soft lowpass with a slow attack
function pad(f, hold, o = {}) { return supersaw(f, hold, { n: 3, det: o.det || 0.006, fc: o.fc || 900, att: o.att || 0.6, rel: o.rel || 0.8, rnd: o.rnd }); }
// basses
function bassPulse(f, hold) { let ph = 0; const lp = lp2(); return t => { ph += f / SR; if (ph >= 1) ph -= 1; const sq = ph < 0.5 ? 1 : -1, sw = saw(ph, f / SR); return lp(sq * 0.6 + sw * 0.4, 380 + 1400 * Math.exp(-t * 18)) * env(t, 0.003, 0.15, 0.7, 0.03, hold); }; }
function bassSub(f, hold, o = {}) { const drive = o.drive || 1.4; return t => Math.tanh(Math.sin(TAU * f * t) * drive + Math.sin(TAU * f * 2 * t) * 0.15) * env(t, 0.004, 0.1, 0.8, 0.06, hold); }
function bassSaw(f, hold) { let ph = 0; const lp = lp2(); return t => { ph += f / SR; if (ph >= 1) ph -= 1; return (lp(saw(ph, f / SR), 260) * 0.8 + Math.sin(TAU * f * t) * 0.5) * env(t, 0.004, 0.05, 0.9, 0.05, hold); }; }
function bassSoft(f, hold) { return t => (Math.sin(TAU * f * t) + 0.3 * Math.sin(TAU * f * 2 * t) * Math.exp(-t * 3)) * env(t, 0.01, 0.4, 0.6, 0.12, hold); }
// a breathy lead for the ballad: sine + triangle with vibrato
function ooh(f, hold) { let ph = 0; const lp = lp1(); return t => { const vib = 1 + 0.004 * Math.sin(TAU * 5.2 * t) * Math.min(1, t / 0.5); ph += f * vib / SR; if (ph >= 1) ph -= 1; const tri = 1 - 4 * Math.abs(ph - 0.5); return lp(Math.sin(TAU * ph) * 0.7 + tri * 0.3, 1600) * env(t, 0.12, 0.2, 0.85, 0.35, hold); }; }

// ── the four decades ───────────────────────────────────────────────────────────
// Each returns { name, track } with a rendered loop. Bars are 0-based; chords are MIDI notes.

// 1980s · city pop: LinnDrum-ish machine with a gated snare, pulse bass in octaves, DX7 e-piano stabs,
// FM bell hook with a dotted echo, a warm saw pad. Bb major, IVmaj7 V7 iii7 vi7 (the "royal road").
function make1980s() {
  const T = new Track({ seconds: 32 * 4 * 60 / 112, seed: 1985, bpm: 112 }), r = T.rnd, b = T.beat;
  const chords = [[51, 55, 58, 62], [53, 57, 60, 63], [50, 53, 57, 60], [55, 58, 62, 65]];   // Ebmaj7 F7 Dm7 Gm7
  const roots = [39, 41, 38, 43];
  const drums = T.bus('drums'), snr = T.bus('snare'), bass = T.bus('bass'), keys = T.bus('keys'), bells = T.bus('bells'), padB = T.bus('pad');
  const snareHits = [];
  for (let bar = 0; bar < 32; bar++) {
    const ci = bar % 4, breakdown = bar >= 16 && bar < 24, fill = bar % 8 === 7;
    // drums
    if (!breakdown) {
      for (const bt of [0, 2]) T.play(drums, T.bar(bar, bt), 0.4, 0.9, 0, kick({ f0: 140, f1: 50, dec: 0.32 }));
      if (bar % 2 === 1) T.play(drums, T.bar(bar, 3, 2), 0.3, 0.6, 0, kick({ f0: 140, f1: 50, dec: 0.25 }));
      for (const bt of [1, 3]) { const t = T.bar(bar, bt); snareHits.push(t); T.play(snr, t, 0.35, 0.8, 0, snare(r, { tone: 190, noiseDec: 0.2 })); }
      if (fill) for (let s = 8; s < 16; s += 2) { const t = T.bar(bar, 0, s); snareHits.push(t); T.play(snr, t, 0.2, 0.55, 0, snare(r, { tone: 200 + s * 4, noiseDec: 0.1 })); }
    }
    for (let s = 0; s < 16; s += 2) T.play(drums, T.bar(bar, 0, s), 0.06, (s % 4 === 0 ? 0.28 : 0.2) * (breakdown ? 0.6 : 1), 0.25, hat(r, s === 14 ? 0.18 : 0.05));
    // bass: root / octave pulse in eighths
    if (!breakdown || bar >= 20) for (let s = 0; s < 16; s += 2) { const up = s % 4 === 2; T.play(bass, T.bar(bar, 0, s), b * 0.5, up ? 0.5 : 0.7, 0, bassPulse(mtof(roots[ci] + (up ? 12 : 0)), b * 0.38)); }
    // e-piano stabs: 1, and-of-2, 4
    for (const [bt, six, vel] of [[0, 0, 1], [1, 2, 0.8], [3, 0, 0.7]]) chords[ci].forEach((m, k) => T.play(keys, T.bar(bar, bt, six) + k * 0.006, 1.6, 0.34 * vel, (k - 1.5) * 0.25, ep(mtof(m + 12), 0.9, vel)));
    // pad from the breakdown on, quiet under the full sections
    if (bar >= 8) chords[ci].forEach((m, k) => T.play(padB, T.bar(bar), b * 4 + 0.6, breakdown ? 0.16 : 0.09, (k - 1.5) * 0.4, pad(mtof(m), b * 4, { rnd: r, fc: 1100, att: 0.4 })));
    // bell hook in bars 8-15 and 24-31: a pentatonic phrase over the chord
    if ((bar >= 8 && bar < 16) || bar >= 24) {
      const phrase = [[0, 0, 74], [0, 3, 77], [1, 2, 79], [2, 0, 74], [2, 3, 82], [3, 2, 79]];
      phrase.forEach(([bt, six, m], k) => { if (r() < 0.85) T.play(bells, T.bar(bar, bt, six), 1.8, 0.28, 0.3, bell(mtof(m + (ci === 1 ? 1 : ci === 3 ? -2 : 0)), 0.5)); });
    }
  }
  T.gatedReverb(snr, snareHits, { hold: 0.14 });
  T.delay(bells, b * 0.75, 0.42, 0.45);
  T.reverb(keys, { size: 0.9, mix: 0.4 });
  T.reverb(drums, { size: 0.6, mix: 0.12 });
  T.reverb(bells, { size: 1.2, mix: 0.35 });
  return { name: '1980s', track: T, gains: { drums: 0.9, snare: 0.8, bass: 0.7, keys: 0.9, bells: 0.8, pad: 1 } };
}

// 1990s · piano ballad: broken-chord piano, a shaker groove, soft bass, strings that swell in from
// bar 8, a wordless lead in the second half. C major, I V vi IV.
function make1990s() {
  const T = new Track({ seconds: 24 * 4 * 60 / 72, seed: 1995, bpm: 72, tail: 3.5 }), r = T.rnd, b = T.beat;
  const chords = [[48, 55, 60, 64], [43, 55, 59, 62], [45, 52, 57, 60], [41, 53, 57, 60]];   // C G Am F
  const roots = [36, 43, 45, 41];
  const pno = T.bus('piano'), shk = T.bus('shaker'), bass = T.bus('bass'), str = T.bus('strings'), drums = T.bus('drums'), lead = T.bus('lead');
  const melody = [[72, 2], [74, 1], [76, 1], [79, 3], [76, 1], [74, 2], [72, 1], [69, 1], [67, 4]];   // beats
  for (let bar = 0; bar < 24; bar++) {
    const ci = bar % 4, ch = chords[ci];
    // piano: bass note on 1 and 3, broken chord in eighths above
    const arp = [ch[1], ch[2], ch[3], ch[2], ch[1], ch[2], ch[3] + 12, ch[2]];
    for (let s = 0; s < 8; s++) T.play(pno, T.bar(bar, 0, s * 2), 2.5, (s % 4 === 0 ? 0.5 : 0.36) * (0.9 + 0.2 * r()), -0.15 + 0.06 * s, piano(mtof(arp[s]), b * 0.6));
    T.play(pno, T.bar(bar, 0), 3.5, 0.6, -0.4, piano(mtof(roots[ci] + 12), b * 2));
    T.play(pno, T.bar(bar, 2), 3.5, 0.45, -0.4, piano(mtof(roots[ci] + 19), b * 2));
    if (bar % 2 === 1) [ch[2] + 12, ch[3] + 12].forEach((m, k) => T.play(pno, T.bar(bar, 3, 2) + k * 0.02, 2, 0.4, 0.2, piano(mtof(m), b)));
    // shaker: sixteenths, accents on the off-beats, seeded velocity
    for (let s = 0; s < 16; s++) T.play(shk, T.bar(bar, 0, s), 0.12, (s % 4 === 2 ? 0.55 : s % 2 ? 0.25 : 0.38) * (0.8 + 0.4 * r()), 0.35, shaker(r, 1));
    // bass
    T.play(bass, T.bar(bar, 0), b * 2.2, 0.6, 0, bassSoft(mtof(roots[ci]), b * 1.8));
    T.play(bass, T.bar(bar, 2), b * 1.8, 0.45, 0, bassSoft(mtof(roots[ci] + (ci === 3 ? 7 : 12)), b * 1.4));
    if (bar % 4 === 3) T.play(bass, T.bar(bar, 3, 2), b * 0.6, 0.4, 0, bassSoft(mtof(roots[ci] + 2), b * 0.4));
    // light drums from bar 8: soft kick on 1 and 3, rim on 2 and 4
    if (bar >= 8) {
      for (const bt of [0, 2]) T.play(drums, T.bar(bar, bt), 0.35, 0.5, 0, kick({ f0: 110, f1: 48, dec: 0.3, sweep: 30 }));
      for (const bt of [1, 3]) T.play(drums, T.bar(bar, bt), 0.1, 0.35, 0.1, rim(r));
    }
    // strings from bar 8, a swell
    if (bar >= 8) ch.forEach((m, k) => T.play(str, T.bar(bar), b * 4 + 1.2, 0.13 + 0.05 * Math.min(1, (bar - 8) / 8), (k - 1.5) * 0.5, pad(mtof(m + 12), b * 4 + 0.2, { rnd: r, fc: 1300, att: 1.1, rel: 1 })));
    // lead in bars 16-23 (an 8-bar phrase, played twice with a variation)
    if (bar === 16 || bar === 20) { let t = T.bar(bar); melody.forEach(([m, beats], k) => { const d = beats * b; T.play(lead, t, d + 0.6, 0.3, 0.1, ooh(mtof(m + (bar === 20 && k > 4 ? 2 : 0)), d - 0.05)); t += d; }); }
  }
  T.reverb(pno, { size: 1.1, mix: 0.45, damp: 3500 });
  T.reverb(str, { size: 1.5, mix: 0.6, damp: 2000 });
  T.reverb(lead, { size: 1.4, mix: 0.7 }); T.delay(lead, b * 1.5, 0.3, 0.25);
  T.reverb(drums, { size: 0.8, mix: 0.2 });
  T.reverb(shk, { size: 0.5, mix: 0.1 });
  return { name: '1990s', track: T, gains: { piano: 1, shaker: 0.5, bass: 0.8, strings: 1, drums: 0.8, lead: 0.9 } };
}

// 2000s · R&B: swung hats, boom-bap kick and a clap-layered snare, a syncopated pluck riff, Rhodes
// chords on the off-beats, a driven sub. A minor, Am7 Dm7 Fmaj7 E7.
function make2000s() {
  const T = new Track({ seconds: 32 * 4 * 60 / 92, seed: 2005, bpm: 92 }), r = T.rnd, b = T.beat;
  const chords = [[57, 60, 64, 67], [50, 53, 57, 60], [53, 57, 60, 64], [52, 56, 59, 62]];
  const roots = [33, 38, 41, 40];
  const riff = [[0, 64], [3, 67], [6, 69], [8, 64], [11, 72], [14, 71]];   // sixteenth, note (over Am); transposed per chord
  const shift = [0, 5, 3, 2];
  const drums = T.bus('drums'), snr = T.bus('snare'), hats = T.bus('hats'), bass = T.bus('bass'), plk = T.bus('pluck'), rho = T.bus('rhodes');
  const swing = s => (s % 2 ? 0.09 : 0) * b;   // late off-sixteenths
  for (let bar = 0; bar < 32; bar++) {
    const ci = bar % 4, intro = bar < 8, full = bar >= 8;
    // hats always, swung; open hat on the last sixteenth of even bars
    for (let s = 0; s < 16; s++) { if (intro && s % 2) continue; T.play(hats, T.bar(bar, 0, s) + swing(s), 0.08, (s % 4 === 0 ? 0.3 : 0.18) * (0.85 + 0.3 * r()), 0.3, hat(r, s === 15 && bar % 2 === 0 ? 0.22 : 0.045)); }
    if (full) {
      // boom-bap: kick on 1, the late "and" of 2, and 3; extra on the last sixteenth every other bar
      for (const [bt, six] of [[0, 0], [1, 3], [2, 0], [2, 2]]) if (!(bt === 2 && six === 2 && bar % 2)) T.play(drums, T.bar(bar, bt, six), 0.4, 0.95, 0, kick({ f0: 120, f1: 44, dec: 0.38, sweep: 28 }));
      for (const bt of [1, 3]) { const t = T.bar(bar, bt); T.play(snr, t, 0.3, 0.7, 0, snare(r, { tone: 175, noiseDec: 0.14 })); T.play(snr, t + 0.004, 0.25, 0.55, 0.05, clap(r)); }
      // sub bass on the kicks, root
      for (const [bt, six] of [[0, 0], [1, 3], [2, 2]]) T.play(bass, T.bar(bar, bt, six), b * 0.9, 0.75, 0, bassSub(mtof(roots[ci] + (bt === 2 ? 0 : 0)), b * 0.7, { drive: 1.6 }));
    } else T.play(bass, T.bar(bar), b * 3.5, 0.6, 0, bassSub(mtof(roots[ci]), b * 3, { drive: 1.2 }));
    // pluck riff
    riff.forEach(([s, m]) => { if (r() < 0.92) T.play(plk, T.bar(bar, 0, s) + swing(s), 0.5, 0.42, -0.2, pluck(mtof(m + shift[ci]), { dec: 0.28, top: 3500, base: 250 })); });
    // Rhodes on the off-beats from bar 16
    if (bar >= 16) for (const [bt, six] of [[0, 2], [1, 3], [3, 1]]) chords[ci].forEach((m, k) => T.play(rho, T.bar(bar, bt, six) + swing(1) + k * 0.008, 1.2, 0.26, (k - 1.5) * 0.3, ep(mtof(m + 12), 0.5, 0.8, { bright: 0.6 })));
  }
  T.reverb(snr, { size: 0.9, mix: 0.35 });
  T.delay(plk, b * 0.75, 0.35, 0.3);
  T.reverb(plk, { size: 1, mix: 0.25 });
  T.reverb(rho, { size: 1, mix: 0.4 });
  T.reverb(hats, { size: 0.4, mix: 0.06 });
  return { name: '2000s', track: T, gains: { drums: 1, snare: 0.9, hats: 0.8, bass: 0.9, pluck: 0.9, rhodes: 1 } };
}

// 2010s · EDM pop: four-on-the-floor, clap on 2 and 4, off-beat open hats, supersaw chords and bass
// pumping under a side-chain, a sixteenth pluck arpeggio with delay, a riser into the last drop.
// D major, vi IV I V.
function make2010s() {
  const T = new Track({ seconds: 40 * 4 * 60 / 128, seed: 2015, bpm: 128 }), r = T.rnd, b = T.beat;
  const chords = [[59, 62, 66, 69], [55, 59, 62, 67], [50, 54, 57, 62], [57, 61, 64, 69]];
  const roots = [35, 31, 38, 33];
  const drums = T.bus('drums'), hats = T.bus('hats'), chord = T.bus('chords'), bass = T.bus('bass'), plk = T.bus('pluck'), fx = T.bus('fx');
  const kicks = [];
  for (let bar = 0; bar < 40; bar++) {
    const ci = bar % 4, drop = (bar >= 8 && bar < 24) || bar >= 32, brk = bar >= 24 && bar < 32;
    // kick: every beat in the drop and the intro (the pump needs it); none in the break except the last bar's build
    if (!brk) for (let bt = 0; bt < 4; bt++) { const t = T.bar(bar, bt); kicks.push(t); T.play(drums, t, 0.35, bar < 8 ? 0.75 : 1, 0, kick({ f0: 170, f1: 48, dec: 0.3, sweep: 45 })); }
    if (bar === 31) for (let s = 0; s < 16; s += (s < 8 ? 2 : 1)) { const t = T.bar(bar, 0, s); kicks.push(t); T.play(drums, t, 0.2, 0.7 + 0.3 * s / 16, 0, kick({ f0: 170, f1: 48, dec: 0.2 })); }
    if (drop) {
      for (const bt of [1, 3]) T.play(drums, T.bar(bar, bt), 0.3, 0.7, 0, clap(r));
      for (let s = 0; s < 16; s++) T.play(hats, T.bar(bar, 0, s), 0.2, s % 4 === 2 ? 0.34 : 0.12, 0.3, hat(r, s % 4 === 2 ? 0.16 : 0.035));
    } else if (!brk) for (let s = 2; s < 16; s += 4) T.play(hats, T.bar(bar, 0, s), 0.15, 0.22, 0.3, hat(r, 0.12));
    // chords: sustained supersaw, brighter in the drop
    chords[ci].forEach((m, k) => T.play(chord, T.bar(bar), b * 4 + 0.4, drop ? 0.22 : 0.17, (k - 1.5) * 0.45, supersaw(mtof(m + (drop ? 12 : 0)), b * 4, { rnd: r, fc: drop ? 2600 : 1200, att: brk ? 0.5 : 0.02, rel: 0.35 })));
    // bass: eighths in the drop, whole notes elsewhere
    if (drop) for (let s = 0; s < 16; s += 2) T.play(bass, T.bar(bar, 0, s), b * 0.5, 0.7, 0, bassSaw(mtof(roots[ci] + (s === 14 ? 12 : 0)), b * 0.4));
    else T.play(bass, T.bar(bar), b * 4, 0.5, 0, bassSaw(mtof(roots[ci]), b * 3.9));
    // pluck arpeggio, sixteenths, up and down the chord an octave up
    const seq = [0, 1, 2, 3, 2, 1].map(i => chords[ci][i] + 12);
    for (let s = 0; s < 16; s++) T.play(plk, T.bar(bar, 0, s), 0.45, (s % 4 === 0 ? 0.36 : 0.26) * (drop ? 1 : 0.8), s % 2 ? 0.35 : -0.35, pluck(mtof(seq[s % 6] + (s >= 12 ? 12 : 0)), { dec: 0.22, top: 6000, base: 500 }));
    // riser over the last two bars of the break
    if (bar === 30) T.play(fx, T.bar(30), b * 8, 0.5, 0, noiseRiser(r, b * 8));
  }
  T.sidechain(chord, kicks, 0.85, 0.36);
  T.sidechain(bass, kicks, 0.7, 0.3);
  T.sidechain(plk, kicks, 0.5, 0.3);
  T.delay(plk, b * 0.75, 0.4, 0.35);
  T.reverb(chord, { size: 1.3, mix: 0.4 });
  T.reverb(plk, { size: 1, mix: 0.25 });
  T.reverb(drums, { size: 0.5, mix: 0.1 });
  T.reverb(fx, { size: 1.4, mix: 0.6 });
  return { name: '2010s', track: T, gains: { drums: 1, hats: 0.8, chords: 1, bass: 0.9, pluck: 0.8, fx: 0.8 } };
}

// ── output ─────────────────────────────────────────────────────────────────────
function writeWav(file, { L, R }) {
  const n = L.length, data = Buffer.alloc(n * 4);
  for (let i = 0; i < n; i++) { data.writeInt16LE(Math.round(clamp(L[i], -1, 1) * 32767), i * 4); data.writeInt16LE(Math.round(clamp(R[i], -1, 1) * 32767), i * 4 + 2); }
  const h = Buffer.alloc(44);
  h.write('RIFF', 0); h.writeUInt32LE(36 + data.length, 4); h.write('WAVE', 8); h.write('fmt ', 12); h.writeUInt32LE(16, 16); h.writeUInt16LE(1, 20); h.writeUInt16LE(2, 22);
  h.writeUInt32LE(SR, 24); h.writeUInt32LE(SR * 4, 28); h.writeUInt16LE(4, 32); h.writeUInt16LE(16, 34); h.write('data', 36); h.writeUInt32LE(data.length, 40);
  fs.writeFileSync(file, Buffer.concat([h, data]));
}

const here = __dirname, out = path.join(here, '..');
const mp3 = process.argv.includes('--mp3'), only = process.argv.find(a => /^\d{4}s$/.test(a));
for (const make of [make1980s, make1990s, make2000s, make2010s]) {
  const t0 = Date.now(), { name, track, gains } = make();
  if (only && name !== only) continue;
  const mix = track.render(gains), wav = path.join(here, name + '.wav');
  writeWav(wav, mix);
  let line = `${name}: ${(track.loopN / SR).toFixed(1)} s, ${((Date.now() - t0) / 1000).toFixed(1)} s to render → ${path.relative(process.cwd(), wav)}`;
  if (mp3) {
    const dst = path.join(out, name + '.mp3');
    cp.execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-i', wav, '-codec:a', 'libmp3lame', '-b:a', '112k', '-ar', '44100', dst]);
    line += ` → ${path.relative(process.cwd(), dst)} (${(fs.statSync(dst).size / 1024).toFixed(0)} KB)`;
  }
  console.log(line);
}
