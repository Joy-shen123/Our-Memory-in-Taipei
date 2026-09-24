# Brief: five ways to make the change of era actually land

"Our Memory in Taipei" is a scroll-driven three.js page, live at https://joy-shen123.github.io/Our-Memory-in-Taipei/. Scrolling walks the camera down one street and forward through three chapters: 1985–1999 Ximending, 2000–2019 Dadaocheng, 2020–2027 Xinyi. The whole point of the page is that time passes as you move.

**Right now you cannot feel time pass.** The only marker at a chapter boundary is a gold flash that fades over 1.7 seconds. CJ walked it and said so.

CJ, 2026-09-24: 「換時代的那個迷霧太短沒感覺，有其他手法可以表現嗎」 then 「5個都想做都給我preview下」.

Read `HANDOFF.md` in full before you touch anything.

**You are producing five previews, not picking one.** CJ decides.

## Goal

A visitor feels forty years go past, not a slide change.

## Done when

Branch `issue-19-transition`, commits not pushed, five options built behind a switch so all five render without five branches.

### 1. The era tween, made visible

The machinery already exists and is too fast to see. `app.js`'s `part()` / `instSet()` system tweens every object's height into the next era over **500 ms** (`ERA_MS`). Buildings genuinely rise and fall — the visitor just never catches it.

Lengthen it to something a person can watch (2–3 s is the range to explore), and check where in the frame it happens: a change behind the camera is wasted. If the tween needs to start earlier so the visitor is looking at the buildings while they move, do that and say so.

**This is the cheapest option on the list and possibly the best, because the effect is already built.** Give it a fair try before the fancier ones.

### 2. A sweep down the street

The change travels: a line that comes toward the camera from down the street, and everything it passes is now in the next era. Time arrives rather than cuts.

Per-object era mixing keyed on z, not one global era value. Say what it costs — this is the most likely of the five to hurt fps.

### 3. The year counter spins

The `YEAR` readout bottom-right jumps through the years fast at the boundary, like an odometer. Cheap, well understood, and it tells the visitor exactly what is happening.

Explore how fast, whether it eases, and whether it grows during the spin.

### 4. A slow colour shift instead of a flash

Replace the 1.7 s gold flash with the whole street's palette sliding from one era's grade to the next over 3–4 seconds. `ERAS` in `data.js` already carries a `palette` per era (`ground`, `roof`, `accent`) — use it rather than inventing new colours.

Least interruptive, most like how memory actually changes.

### 5. A real photograph of the place, fading through

At the boundary, a photograph of that location in that period fades up over the frame and out again.

`sonnet-photos` is sourcing licence-cleared historical photographs right now and **they are not ready**. Build this option with clearly-labelled placeholders — a greyscale, period-looking stand-in is fine — and make the image path a single constant so the real photographs drop in later. Say plainly in your README that option 5 is shown with placeholders.

## Proof

- `~/Desktop/issue19-transition/contact-transition.png` — all five, each as a strip of four frames across the 0.347 boundary (before / entering / mid / after), labelled 1–5. CJ has to see it as a sequence; a single frame cannot show a transition.
- The same for the 0.582 boundary, `contact-transition-2.png`.
- Full-size individual frames beside them.
- `research/plan-6/transition-5/README.md` — one section per option: what it does, its fps cost measured not guessed, and one line on what it feels like.
- fps at the display cap at 0.2 / 0.44 / 0.78 **for each of the five**, console empty, all three scene files re-run clean inside try/catch.

## CJ's words

- 2026-09-24: 「換時代的那個迷霧太短沒感覺，有其他手法可以表現嗎」, then 「5個都想做都給我preview下」.
- 2026-09-20: "CLOSE THE MIST I WANT THE WEBSITE BE BRIGHT AND PRETTY" — **still holds for the street.** A transition may use fog as a momentary device, but the street itself is bright and unveiled once the visitor is in a chapter. No night, no bloom.
- 2026-09-24: 「年代到2027就好了」— the third chapter is now 2020–2027, not 2020–2040. Seven years, not twenty. Option 3's spin has to make sense over that span.
- 2026-09-20: "REMOVE MOVE MOVING OBEJECT ON THE ROAD" — only the girl moves on the road. A sweep may change objects; it may not send anything driving down the street.

## What you must know about the flash you are replacing

Issue #13 found that the old flash keyed on **nearness** to a road marking, not on crossing it, so any frame shot within 1.7 s of arriving near a boundary caught the flash mid-fade — that is what made `dadao-0.58` look fogged out, and it fooled both the blind scorer and the lead. It now fires only when `progress` crosses the marking. **Do not reintroduce a nearness-keyed effect.** Whatever you build fires on the crossing.

`window.__fog.BOUNDS` holds the exact boundaries; the chapter fractions are red 0.02–0.347, dadao 0.347–0.582, tower 0.582–1.0.

## What is here

- `HANDOFF.md` — read in full. The `app.js` section covers `ERA_MS`, the `part()` / `instSet()` era tween, the post pass and its chapter-cut flash, and `window.__fog`.
- `data.js` — `ERAS` with a `palette` per era, and `CAM`.
- `research/blind-score-2026-09-24/README.md` — the story-beat cells scored 3 / 3 / 4, and its note that the boundary frames were never captured.

## Method

1. Read `HANDOFF.md`, then walk the live page slowly across both boundaries and watch what actually happens today before changing anything.
2. Build option 1 first and measure it honestly. If lengthening the existing tween already solves CJ's complaint, that is a real finding and worth saying loudly, even though he asked for five.
3. Test as `HANDOFF.md` says. Your own port; **never `pkill` by pattern — six other agents are running servers.** Mute the browser right after opening it; the page plays music and CJ is in the room. Close the session after each check.
4. A page-load exception is NOT captured by the browser session. Re-run each scene file inside try/catch after the screenshots.

## Do not touch

- The opening fog and the big words — `fable-words` is building an opening fog-to-title reveal on `issue-16-words`, in the same `app.js` fog code. Stay inside the boundary-transition path; do not restructure the fog module, or the merge will be painful for both of you.
- `music.js` and the music HUD — `fable-music16` owns those.
- `asset/blender/`, `asset/models/` — `opus-archway` and `opus-blender` own those.
- `research/photos/` — `sonnet-photos` is writing there.
- `asset/fonts/` — `issue-10-fonts`, still waiting on CJ's pick.
- **Do not push, do not open a PR, do not pick an option.**

## Deliverable

Reply with only: the two contact-sheet paths, the five options one line each **with their measured fps**, which one you would pick and why in one line, and one line on whether option 1 alone already fixes the complaint.
