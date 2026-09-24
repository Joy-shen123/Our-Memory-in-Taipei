# Issue #19 — the change of era: a photograph fades through

CJ, 2026-09-24: 「換時代的那個迷霧太短沒感覺，有其他手法可以表現嗎」, then 「5個都想做都給我preview下」, then, of the five previews below, **option 5, the photograph**. On the licences, same day: 「ok」, the share-alike obligation accepted. Brief: `docs/briefs/BRIEF-issue19-transition.md`. Branch `issue-19-transition`, not pushed.

## What ships

CJ, after scrolling the first wiring, 2026-09-24: 「剩下照片有點太老有點crippy要拿溫馨熱鬧的照片 照片淡淡的經過就可以了不需要那麼久只是一個過場而已就跟滑鼠一起滑過然後淡一點」, and on a third picture at the top of the climb, 「先不用好了先把本來的事情做好」. So:

**The pass is the scroll's own.** No timer, no hold. Past each road marking the picture's opacity is a function of how far past the marking the damped scroll progress is: over `PHOTO.window` = 0.03 of progress (about 15vh of page, two or three notches of a wheel) it follows a sine bell that peaks at `PHOTO.peak` = **0.25** in the middle and is gone at the end. Stop, and it holds where the hand stopped; scroll back, and it comes back; a frame at a given progress always looks the same. Full-bleed (cover-fit), no paper border, a touch of old-print treatment (`PHOTO.print` 0.2). The caption and credit fade with it, at most 0.75, never full. The 500 ms era tween runs underneath as before, and the chapter-cut flash is gone. `app.js`: `PHOTO`, `PHOTO_SRC`, `photoAt`, `photoSelect`, `updatePhoto`, the post pass's photograph branch.

**Peak and window, judged by eye.** 0.30 read as a double exposure (the taxi in the 2012 frame stood in the street); 0.25 reads as a memory surfacing behind the street and is the low end of the range CJ's note named. 0.03 of progress: at a normal wheel pace the pass is over in about a second and never interrupts, and it is long enough that a single notch does not skip it. Both are one number each in `PHOTO`.

**Two crossings, one constant each.** `PHOTO_SRC.dadao` and `PHOTO_SRC.tower` hold the file, the caption and the credit; swapping a picture is that line plus the file in `asset/photos/`. The third picture CJ raised for the top of the climb (Alex Honnold on the 101, agency work with no open licence) was dropped by him the same day, so there is no hook for it: two crossings only.

**The pictures are the first round and CJ wants them replaced.** 「有點太老有點crippy」: the 1961 newspaper halftone of 中華商場 and the 2012 永樂市場 façade are archival documentary frames, and he wants warm and crowded ones (「溫馨熱鬧」: people, festival, market life, colour). sonnet-photos is sourcing a second round; it was not ready when this shipped, so the page ships with the current pair. The new files replace the two `src` lines and the credits in `asset/photos/CREDITS.md`; nothing in the logic changes.

| marking | photograph now | licence |
|---|---|---|
| 2000 (scroll 0.347, Ximending → Dadaocheng) | `chunghwa-1961.webp`, 中華商場 the year it opened, cropped from the opening-ceremony newspaper page, 涂柏辰 / 國立臺灣歷史博物館. Captioned "1961, the year it opened · newspaper photograph": brand new, not the rooftop-neon 1980s the street models | CC BY 3.0 TW, credit on screen |
| 2020 (scroll 0.582, Dadaocheng → Xinyi) | `yongle-2012.webp`, 永樂市場's west side on Dihua Street, 玄史生, Wikimedia Commons: the last Dadaocheng building the camera passes, with the 永樂布業商場 board the scene models by name | **CC BY-SA 3.0**, credit on screen, share-alike recorded in `asset/photos/CREDITS.md`, accepted by CJ (「ok」) |

**Credit on screen.** Caption and credit top-right under the site title, ink on a paper pill, 11 px letter-spaced, fading with the picture: `中華商場 · 1961, the year it opened · newspaper photograph / photo 涂柏辰 / 國立臺灣歷史博物館 · CC BY 3.0 TW` and `永樂市場 · 迪化街 Dihua Street · 2012 / photo 玄史生, Wikimedia Commons · CC BY-SA 3.0`.

**Bytes.** `chunghwa-1961.webp` 766×616, 154,000 bytes; `yongle-2012.webp` 1600×851, 149,878 bytes; 303,878 together. The page's own files, loaded at start; nothing is hotlinked. A picture that has not decoded yet is simply skipped.

**Proof.** `~/Desktop/issue19-transition/contact-transition.png` (2000 marking) and `contact-transition-2.png` (2020 marking): a strip of five frames at scroll positions −0.004 / +0.005 / +0.015 / +0.025 / +0.034 from the marking, i.e. before, surfacing (0.13), the peak (0.25), sinking (0.13), gone. Full-size frames `~/Desktop/issue19-transition/frames/pass-b<1|2>-<1..5>.png`, headless 1440×900, `?year=1998|2018&noyoutube=1`, each position settled before the shot. Console empty.

**fps, measured.** Headed, alone, 1440×900, 2 s of `requestAnimationFrame` per cell at the 100 Hz display cap, two runs (`~/Desktop/issue19-transition/fps.txt`); `ms` is the frame's own CPU time, `cross` the 2 s after the crossing with the picture passing.

| run | 0.2 | 0.44 | 0.78 | cross 0.347 | cross 0.582 | hitch |
|---|---|---|---|---|---|---|
| 1 | 100.0 / 3.2 ms | 100.1 / 2.3 ms | 100.0 / 1.6 ms | 100.0 / 3.0 ms | 100.0 / 1.6 ms | 11 ms |
| 2 | 100.0 / 3.3 ms | 100.0 / 2.1 ms | 100.0 / 1.5 ms | 100.0 / 2.9 ms | 100.0 / 1.6 ms | 11 ms |

Same as before, within noise. The three scene files re-run clean inside try/catch.

**Removed.** The `?tx=` switch and the code of options 1–4 (the 2.5 s tween with its library-group rise and `LIFT`, the sweep and its band, the odometer and its CSS, the colour grade), the chapter-cut flash (`uFlash`, `updateFlash`, IVRESS borrow a), and the timed fade with its paper border and its placeholder render. `?slow=` stays as a hook for shooting the era tween. The record of what was considered follows, as it was written before the pick; its `?tx=` links no longer work.

---

# The five previews, as considered (2026-09-24, before the pick)

All five were built behind one switch in `app.js` and previewed from the same page: `index.html?tx=1` … `?tx=5` (removed after the pick, see above). No `tx` was today's page. A comma list combined them (`?tx=1,3`). Any `tx` turned the chapter-cut flash off so the option was seen alone; `&flash=1` kept it. `&slow=6` ran the page's clock six times slower (every tween and transition, the scroll damping too), which is how the contact sheets were shot. Every option fired on the crossing of a road marking, inside `setEra()`; nothing keyed on nearness (the issue #13 trap).

**Proof at the time.** The six-row contact sheets (today, then options 1–5, four frames each, before the marking / +0.4 s / +1.5 s / +4.0 s) were shot the same way and have since been replaced on the Desktop by the shipped version's sheets; the 48 full-size frames of that pass are still in `~/Desktop/issue19-transition/frames/tx<N>-b<1|2>-<before|enter|mid|after>.png`. Console was empty in every run. The option 5 described below is the placeholder version; what ships is above.

## What actually changes at each marking, which decides everything below

- **The 2000 marking (0.347).** The camera is under the 年貨大街 archway looking down Dihua Street. Dadaocheng was built to be there *before* the flip (`scene-dadao.js`: the bays, the temple, 永樂市場 and the library items are in every era or in `red` + `dadao`), so at this crossing nothing tall rises or falls in front of the camera. What moves: the sky tint (rose → gold), the light mix, the road (dirt → plain asphalt, a one-frame texture swap), the utility poles (0 → 7 m), the crowd (12 → 36 engine walkers plus the chapter's own), the hanging signs. A geometry transition has little to work with here. A colour, counter or photograph transition has the same amount as anywhere.
- **The 2020 marking (0.582).** The camera is at z −290 looking at the 101's site at −420 with the whole Xinyi stretch between: the 101 (a `libGroup(['tower'])`, today it pops in one frame), A11, the skywalk, the generic blocks and highrises (0 → 10–13 m), the distant city (3–9 → 6–40 m), and the paddies and farmhouses of the `OLD` eras sink. This is the crossing where forty years of building are in the frame, and today the gold flash covers exactly the half-second in which they appear.

## fps, measured

Headed Chrome, alone, 1440×900, 2 s of `requestAnimationFrame` per cell, the 100 Hz display cap. "cross" is the 2 s that start at the crossing, so the effect itself is inside the window. `ms` is the frame's own CPU time (update plus draw submission, `window.__fog.frameMs`, smoothed), a cost the cap cannot hide; `hitch` is the longest frame gap in the window. The three scene files re-run clean inside try/catch under every option (`scenecheck.log`).

| option | 0.2 | 0.44 | 0.78 | cross 0.347 | cross 0.582 | hitch |
|---|---|---|---|---|---|---|
| today | 100.0 / 3.5 ms | 100.1 / 2.2 ms | 100.0 / 1.9 ms | 100.0 / 2.8 ms | 100.1 / 1.7 ms | 11 ms |
| 1 tween | 100.0 / 3.7 ms | 100.0 / 2.6 ms | 100.0 / 1.7 ms | 100.0 / 3.0 ms | 99.9 / 2.1 ms | 11 ms |
| 2 sweep | 100.0 / 3.6 ms | 100.0 / 2.7 ms | 100.0 / 1.9 ms | 100.0 / 2.5 ms | 100.0 / 1.9 ms | 11 ms |
| 3 counter | 100.0 / 3.5 ms | 100.0 / 2.4 ms | 100.0 / 1.8 ms | 100.0 / 2.9 ms | 100.0 / 1.8 ms | 11 ms |
| 4 colour | 100.0 / 3.6 ms | 100.0 / 2.5 ms | 100.0 / 1.8 ms | 100.0 / 3.0 ms | 100.0 / 1.9 ms | 11 ms |
| 5 photo | 100.0 / 3.5 ms | 100.0 / 2.5 ms | 100.0 / 1.6 ms | 100.1 / 2.9 ms | 100.1 / 1.8 ms | 11 ms |

None of the five costs anything the cap can see, and the CPU frame time moves by less than its own noise (±0.5 ms between runs of the same cell). The 11 ms hitch is one frame at 100 Hz, i.e. no hitch: even option 5's extra scene render at the crossing does not register. The reason option 2 is free is that `updateWorld()` already visits every part and every instanced item every frame (the tween never stops iterating, it just clamps at 1); the sweep adds one subtraction and one clamp per object.

## 1 · The era tween, made visible — `?tx=1`

**What it does.** `ERA_MS` 500 → 2500 ms (`TRANSITION[1].eraMs`, the middle of the brief's 2–3 s range; only 2500 was shot, 2000 and 3000 are one number away). Two things had to change with it, both invisible at 500 ms and ugly at 2500: the library groups (the 101 itself, the 中華商場 blocks, the Ximending shopfronts) used to flip `visible` in one frame and now rise and sink with the parts (`libTween`, scale.y from the ground); and parts and items that sit at a height (a roof plant, the skywalk deck, a hanging sign, a figure on the deck) used to shrink in place, floating at their final height as dark slivers, and now rise with the wall under them (`LIFT`). The road texture still swaps in one frame at the crossing; the sky, light and label move over the same 2.5 s.

**Where it happens in the frame.** No earlier start is needed: the crossing is the moment the camera is over the marking with the next chapter's street filling the frame, so everything that moves is in front of the camera at both markings. At 0.582 the 101 grows from the podium to the spire in the centre of the frame over 2.5 s, the towers either side with it; that is the shot. At 0.347 there is nothing tall to rise (see above), so the visitor sees the poles come up, the crowd thicken and the sky warm, and a 2.5 s tween there is only a little more than a 0.5 s one.

**Cost.** fps unchanged; CPU frame time within noise.

**What it feels like.** At 2020: the city being built in front of you, which is the sentence the page is trying to say. At 2000: a street waking up rather than time passing.

## 2 · A sweep down the street — `?tx=2`

**What it does.** At the crossing a line starts 240 units down the street and travels to 60 units behind the camera over 3 s (`TRANSITION[2]`: `ms`, `ahead`, `behind`, `soft`). Every part, every instanced item and every child of a library group takes its own era mix from the line: past it (farther away) the new era, short of it the old, blended over a 16-unit band (`eAt(z)` in `updateWorld`, `instUpdate`, `libTween`). A pale amber band on the road and sidewalks marks the line while it runs (`TRANSITION[2].line = false` removes it); nothing drives down the street, the band is the front of the change (CJ, 2026-09-20, no moving objects on the road). The road texture changes when the line reaches the camera; the sky and light take the same 3 s.

**Cost.** Nothing measurable (the table). This was the option most likely to hurt and it does not, for the reason given above.

**What it feels like.** At 2020 it is the strongest of the five: the 101 stands first, far away, and the future comes up the street toward you until the blocks beside you change last. At 2000 the line passes through a street that mostly does not change, and the band on the road is too far away to read from street level until its last half-second, so the frames at 2000 look as if nothing happened (`tx2-b1-mid.png`). Option 2 is a 2020 device.

## 3 · The year counter spins — `?tx=3`

**What it does.** `#year` becomes four digit columns, each a strip 0–9–0 slid in em units. At a crossing the digits that differ between the last year of the chapter left and the first of the chapter entered (1999 → 2000: all four; 2019 → 2020: two) roll to their new value with one extra full turn, easing out over 1.1 s, and the whole readout scales to 1.35× at mid-roll and back (`TRANSITION[3]`: `ms`, `turns`, `grow`; `spinStart`, `spinUpdate`). Scrolling back rolls the other way. The live year takes over the moment the roll ends, so the counter never shows a year the scroll is not at, and the 2020–2027 chapter needs no special case: the roll is about the digits that change, not the span.

The three knobs and why they sit where they do (only the shipped values were shot; the others are one number away in `TRANSITION[3]`): 1.1 s is long enough to see the digits pass and short enough to end before the street has finished changing under option 1; one extra turn makes all four wheels visibly move at 2000 without reading as a slot machine; the growth is there because the readout lives in a corner and a roll that does not grow is easy to miss at the frame's edge.

**Cost.** DOM only; nothing measurable.

**What it feels like.** Legible and cheap: it tells you a chapter turned, and it says nothing about the street. It is the kind of thing that pairs with one of the others rather than standing alone.

## 4 · A slow colour shift instead of a flash — `?tx=4`

**What it does.** The flash is gone. The post pass carries a split tone built from `data.js`'s `ERAS[].palette`: shadows toward `ground`, mid-tones toward `roof`, highlights leaning toward `accent` (`GRADES`, `TRANSITION[4].hi`), applied with the pixel's own luminance held so it moves hue and never brightness. Inside a chapter it sits at `rest` (0.12); at a crossing it slides from the old era's tone to the new one's over 3.5 s and swells to `peak` (0.40) at the middle of the slide. The sky and light tween take the same 3.5 s (`colorMs`), so the dome's rose → gold → blue moves with it. The brightest values are left alone: the first version tinted the sky's blue toward the palette and the frame read as grey haze, which CJ closed on 2026-09-20 (「CLOSE THE MIST」).

**Cost.** Two shader branches per pixel; nothing measurable.

**What it feels like.** The least interruptive, as the brief said, and for the same reason the least visible: with the sky protected and the luminance held, what moves is the warmth of the walls and the road, and on a pale street that is a small move. It reads as a mood change if you are watching for it. It does not, on its own, say that time passed.

## 5 · A real photograph of the place, fading through — `?tx=5`

**Shown with placeholders.** `sonnet-photos` is still sourcing the licence-cleared photographs; none is in the repo. The placeholder is the page's own last frame before the flip (the place as it stood in the era being left, this frame's camera), rendered once more into a second target at the crossing and shown through the post pass as an old print: warm grey, a little contrast, a heavy vignette, coarse grain, a paper border, and a label under the frame that says `PLACEHOLDER · 信義 · Xinyi · c. 2020 · real photograph pending`. It fades up over 0.7 s, holds 0.9 s, fades out over 1.4 s (`TRANSITION[5]`), while the 500 ms world tween happens behind it, so the fade-out reveals the new street.

**Dropping the real photographs in.** `PHOTO_SRC` in `app.js` is the single constant: `{ dadao: 'asset/photos/dadaocheng-2000.jpg', tower: 'asset/photos/xinyi-2020.jpg' }`. A set path loads that image (cover-fit, lighter print treatment, `oldness × 0.35`) and the label loses the word placeholder. Nothing else changes.

**Cost.** One extra scene render at the crossing (not a measurable hitch, table above); one texture sample per pixel while the photograph is up.

**What it feels like.** The only one of the five that steps outside the model and says "this place was real". With the placeholder it is a sepia freeze-frame of the street you just left, which already reads as memory; with a real photograph it will be the strongest single beat on the page, and it depends entirely on the photograph.

## Which one, and does 1 alone fix the complaint

- **Pick, in one line:** option 1 with option 3 on top (`?tx=1,3`): the buildings rise where the camera is looking, and the counter says which year turned, for no fps and no new assets. Option 2 is the more dramatic version of 1 at 2020 and is equally free; it is the alternative if CJ wants the change to travel rather than grow.
- **Does 1 alone fix it?** At the 2020 marking, yes: a 2.5 s rise of the Xinyi skyline is a transition you cannot miss. At the 2000 marking, no: Dadaocheng was deliberately built to be standing before the flip, so no geometry tween, at any length, can show much there. The 2000 marking needs a non-geometry device (3, 4 or 5) or a decision to let some of Dadaocheng rise at the flip, which reverses an earlier choice and is CJ's to make.
- **Combination note.** 1 or 2 governs the geometry (2 wins if both are on); 3, 4 and 5 are overlays and combine with anything.
