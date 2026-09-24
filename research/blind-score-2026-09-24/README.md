# Blind score — 2026-09-24

Scored against `docs/RUBRIC.md` from the live page: https://joy-shen123.github.io/Our-Memory-in-Taipei/

Twelve headless screenshots, 1440x900, at the fractions named in the brief (red 0.02/0.10/0.20/0.30, dadao 0.36/0.44/0.52/0.58, tower 0.66/0.78/0.90/0.97), in `shots/`. Console empty at capture time. fps measured headed, alone, 2s of `requestAnimationFrame` each: 100.5 / 100.7 / 100.5 at 0.2 / 0.44 / 0.78.

**Methodology note, so the "blind" claim is honest, not assumed:** the brief said to read `docs/RUBRIC.md` in full, and that file's own text carries two prior self-assessments ("Scoring 1", "Scoring 2") with their own numbers and evidence, embedded below the instrument itself. I could not read the rubric in full without also seeing those numbers. Every score and every sentence of evidence below was written from my own twelve screenshots and my own reading of the seven criteria — not copied, rounded toward, or checked against the prior tables — but I cannot claim I was never shown them, only that I did not use them. Worth knowing before this number gets treated as fully independent.

## Score table

| Chapter | Recognition | Period | Composition | Density and life | Palette and light | Story beat | Performance | Total |
|---|---|---|---|---|---|---|---|---|
| 01 When We Were Young (Ximending) | 4 | 3 | 3 | 2 | 4 | 3 | 5 | **24/35** |
| 02 Spring Festival (Dadaocheng) | 4 | 3 | 3 | 2 | 2 | 3 | 5 | **22/35** |
| 03 The Future (Xinyi) | 5 | 2 | 4 | 1 | 4 | 4 | 5 | **25/35** |

**Page total: 71/105.**

## 01 When We Were Young — evidence

- **Recognition 4** (`red-0.20.png`): the Red House octagon, its cupola, and the 樂聲戲院 banner sit in one frame with a "Ximen Red House" label confirming it, but the octagon shape and brick colour alone are distinctive enough that a Taipei viewer would likely name it without the label.
- **Period 3** (`red-0.10.png`): the 小虎隊 (a late-80s idol group) banner and a "NOKIA · Sony Ericsson" storefront sign sit in the same 1989-dated frame; Sony Ericsson as a joint brand did not exist until 2001, so the frame reads as "80s-to-00s Taiwan," not a specific year. **Fix:** `scene-red.js` — gate signage assets by the chapter's scroll year instead of showing the 80s/90s/00s sets together for the whole chapter.
- **Composition 3** (`red-0.02.png`): the opening title (two lines of English plus giant background kanji) covers the top two-thirds of the very first frame the site shows, leaving the street mostly as a floor for the text rather than a composed shot. `red-0.20.png` by contrast is a real foreground/subject/background frame (sign, Red House, gate). **Fix:** `app.js` / `index.html` intro block — shrink or delay the title overlay so the first frame reads as street before it reads as title.
- **Density and life 2** (all four `red-*.png`): every frame shows the single protagonist and nobody else — no pedestrians, no queue, no other moving figure — despite dense signage. **Fix:** `scene-red.js` — add a small instanced crowd (reuse the girl's low-poly rig or a simpler placeholder) walking the sidewalks near 0.10/0.20/0.30.
- **Palette and light 4** (`red-0.20.png`): bone walls, vermilion signage and lamp-warm accents hold under a clear blue sky at every fraction; the one break is the yellow-green 淘兒音樂城 front at 0.20, which is why this isn't a 5.
- **Story beat 3** (`red-0.02.png`): the title fades in over an already fully-rendered, static street — something on screen changes (the text), but nothing in the world itself marks the entry into the chapter. **Fix:** `app.js` intro sequence — tie the opening to a small world-level change (a short zoom-in, a light warm-up, the girl walking into frame) rather than text alone.
- **Performance 5**: 100.5 fps headed at 0.2, console empty.

## 02 Spring Festival — evidence

- **Recognition 4** (`dadao-0.36.png`): the arcaded columns, plastered Baroque bays and the 年貨大街 banner read as Dihua Street on sight; the label ("Dihua Street") only confirms it.
- **Period 3** (`dadao-0.36.png`): a 三輪車 (pedicab)-style vehicle sits in the 2001-dated frame — a much older prop — and nothing differs visually between the 2008, 2015 and 2020 frames beyond an on-pavement "2020" text mark. **Fix:** `scene-dadao.js` — gate vehicle/prop sets by year the same way as the chapter-1 fix, or add later-decade props (scooters, an ATM, a vending machine) for the 2008+ frames.
- **Composition 3** (`dadao-0.52.png`): the nearest lantern string hangs low enough to cover the top quarter of the frame; `dadao-0.44.png` is a genuinely composed shot (stalls foreground, shophouse rows background). **Fix:** `scene-dadao.js` — raise the lantern string's y-offset, or thin it, on the string nearest the camera.
- **Density and life 2** (`dadao-0.58.png`): the chapter's last captured fraction (year 2020) is a bare road with only trees and grey box buildings — no stalls, no crowd, nothing that was dressing the street two frames earlier. **Fix:** `scene-dadao.js` — dress the 0.55–0.582 stretch so the chapter does not close on an empty street.
- **Palette and light 2** (`dadao-0.58.png`): this frame is thick, near-monochrome haze — buildings, sky and ground blur into the same beige-grey, the only frame in the whole set where the scene is genuinely hard to read. This is the fault CJ named directly ("CLOSE THE MIST I WANT THE WEBSITE BE BRIGHT AND PRETTY," 2026-09-20), still present in the chapter's own closing frame. **Fix:** `app.js:11` (`HAZE_DENSITY`) — thin the exponential fog for the chapter's closing stretch, or add closer geometry in `scene-dadao.js` near 0.58 so the haze isn't reading uninterrupted empty distance.
- **Story beat 3** (`red-0.30.png` vs `dadao-0.36.png`): the street type visibly changes between the nearest captured frames either side of the chapter boundary (Ximending signage row → Dihua Street arcade), but this pass's twelve screenshots don't include a frame at the 0.347 boundary itself, so the score is on the two nearest frames, not a confirmed transition effect. Flagging rather than scoring blind on it: a follow-up capture at `cut-0.347.png` would settle it.
- **Performance 5**: 100.7 fps headed at 0.44, console empty.

## 03 The Future — evidence

- **Recognition 5** (`tower-0.66.png`, `tower-0.97.png`): Taipei 101's eight-segment silhouette and spire are unmistakable in every one of the four frames, labelled or not — the strongest recognition case on the site.
- **Period 2** (all four `tower-*.png`): 2024, 2029, 2035 and 2039 are visually identical aside from camera position — same glass towers, same repeating orange-square "window" pattern, no near-future signal (transit, signage content, infrastructure) that would separate one from another. **Fix:** `scene-tower.js` — add period markers spaced across the chapter's year range (e.g. YouBike docks early, changing LED signage content, more transit infrastructure late) so the four decades read apart.
- **Composition 4** (`tower-0.66.png`): flanking towers, the tower centred, the XINYI sign anchoring the frame, the girl at the base for scale — a genuinely composed shot; `tower-0.90.png` and `tower-0.97.png` are closer to a tower-on-sky crop than a staged frame, which is why this isn't a 5.
- **Density and life 1** (all four `tower-*.png`): zero pedestrians, zero plaza crowd, zero traffic in any of the four frames, including the two street-level ones (0.66, 0.78) — the emptiest chapter on the site, and it's the one visitors end on. **Fix:** `scene-tower.js` — add a crowd/traffic instance set at the 101 plaza and the road; same class of fix as chapters 1 and 2, most severe here since even the ground-level frames are empty.
- **Palette and light 4** (`tower-0.66.png`): glass-green tower against a clear, consistent blue sky at every fraction, no haze — the brightest chapter on the site; the flanking towers' orange-square pattern reads slightly decal-like rather than lit glass, which is the one mark against a 5.
- **Story beat 4** (`dadao-0.58.png` vs `tower-0.66.png`): the sharpest change on the whole site — a fogged-out, empty road gives way to a clear sky with the tower rising — though again the precise 0.582 boundary frame wasn't captured in this pass, so full credit for the transition effect itself (rather than the before/after) is inferred, not confirmed.
- **Performance 5**: 100.5 fps headed at 0.78, console empty.

## The three lowest, ranked, and what to fix first

Applying the rubric's own tie-break ("ties in the lowest three break toward the item whose fix changes the most frames"): the three lowest cells all turn out to be the same criterion — the site has no crowd anywhere.

1. **Chapter 03 (Xinyi), Density and life — 1.** Zero pedestrians or plaza life across all four Future-chapter frames, worse than either other chapter because even the two ground-level frames are empty.
2. **Chapter 01 (Ximending), Density and life — 2.** Tied at 2 with two other cells; this one wins the tie-break because a shared crowd-instance system built once and reused across `scene-red.js`, `scene-dadao.js` and `scene-tower.js` lifts all three low density cells at once — more frames improved per hour of work than any localized fix.
3. **Chapter 02 (Dadaocheng), Density and life — 2.** Same root cause, same shared fix.

**Fix first, for the most visible gain:** build one reusable pedestrian/crowd instance set and drop it into `scene-tower.js` first (chapter 03 has the single lowest score, and it's the chapter visitors end the site on), then reuse the same system in `scene-red.js` and `scene-dadao.js` — one build raises all three lowest cells rather than three separate patches.

**Called out separately, not in the ranked three but not buried either:** Chapter 02 Palette and light (2) is the one frame on the whole site (`dadao-0.58.png`) where the scene is genuinely hard to read, and it is the exact fault CJ named by name on 2026-09-20. It didn't win the tie-break because its fix (thin `HAZE_DENSITY` for one stretch) touches fewer frames than the crowd fix, but it's the most direct violation of a standing instruction still live on the shipped page, and worth fixing in the same pass.
