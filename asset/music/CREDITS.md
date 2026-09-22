# Music credits

All four tracks were synthesised inside this repository by `gen/make-tracks.js` (issue #4, 2026-09-22). No samples, no downloaded audio, no third-party library: sine, saw, square, noise and two-operator FM, seeded so the same file renders every time. They are original works made for this page and are released under **CC0 1.0** (public domain dedication): anyone may copy, change and publish them, credit welcome but not required. Nothing here is a real song, and nothing here imitates a specific recording.

Route taken per decade: **synthesised in the repo** for all four. No licensed free track was used, so there is no third-party attribution to carry.

| Decade | File | Title | Length | Size | What it is |
|---|---|---|---|---|---|
| 1980s | `1980s.mp3` | Neon Arcade | 68.6 s, 112 BPM | 938 KB | City pop: gated-reverb drum machine, pulse bass in octaves, DX7-style e-piano stabs, FM bell hook with a dotted echo, warm saw pad. Bb major, IVmaj7 – V7 – iii7 – vi7. |
| 1990s | `1990s.mp3` | Letters Home | 80.0 s, 72 BPM | 1095 KB | Piano ballad: broken-chord additive piano, shaker groove, soft bass, strings swelling in from bar 8, a wordless lead in the second half. C major, I – V – vi – IV. |
| 2000s | `2000s.mp3` | Night Market Slow Jam | 83.5 s, 92 BPM | 1142 KB | R&B: swung hats, boom-bap kick, clap-layered snare, syncopated pluck riff, Rhodes-style chords on the off-beats, driven sub. A minor, Am7 – Dm7 – Fmaj7 – E7. |
| 2010s | `2010s.mp3` | Skyline Pulse | 75.0 s, 128 BPM | 1026 KB | EDM pop: four-on-the-floor, clap on 2 and 4, off-beat open hats, supersaw chords and bass pumping under a side-chain, sixteenth pluck arpeggio, riser into the last drop. D major, vi – IV – I – V. |

Total 4.1 MB, MP3 112 kbps 44.1 kHz stereo, made with ffmpeg's libmp3lame from the script's 16-bit WAV output. The WAVs are not committed (`gen/*.wav` is ignored); rebuild with:

```
node asset/music/gen/make-tracks.js --mp3
```

The on-page attribution line reads "synthesised for this page · CC0".

Real hit songs from each decade are listed as a decision for CJ in `research/music/README.md`. None of them is in the repository.
