# Issue #16 — five options for the big words, five treatments of the closing line, five openings

Branch `issue-16-words`, 2026-09-24, not pushed.

## Shipped (CJ decided, 2026-09-24)

- **Words: today's text in option 3's treatment.** CJ: 「這些要保留」 on the shipped lines, 「我喜歡item1的3的風格」 on the treatment, 「對」 to the lead's reading. `WORDS` keeps its lines; the `big` line is set in the display face at 700 and the `sub` under it at the same size at 300 (`.word-big` / `.word-sub` in `style.css`, `--word-size` clamp(48px, 8.8vw, 136px), left column at 24vh). A line with no sub stands alone in 700. Option 3's rewritten fragments were not used, and the `holdTo` / `cont` machinery went with them. Two lines changed after that, CJ 2026-09-24: 「"Nostalgia." 和 "The future." 應該改成feeling 跟Into the future」, so 0.74 is **'Into the future.'** (it carries motion, which is what the chapter does) and 0.17 became 'Feeling.'; a bare 'Feeling.' reads as an unfinished sentence in English, so 'That feeling.' was rendered beside it, and CJ chose it (2026-09-24: 「That feeling.」). **0.17 is 'That feeling.'** The sub line was first set at the big line's size, as option 3 had it; with today's real-sentence subs that made 'Toys, candy, playful things.' wrap to three lines and out-shout its line, and CJ said 「下面的字小一點」. The sub is now **0.45 of the big size** (`--word-sub` in `style.css`, 300 weight and tracking unchanged, line-height 1.1): at 1440×900 every sub sits on one line under its big line (61px under 136px), and at 390×844 (24px under 54px) the longest one wraps to two lines without touching the chapter column, the year or the music control. Judged against the two worst cases, 0.17 and 0.45, at both widths.
- **Closing: treatment 1.** "Keep climbing," in the display face at clamp(52px, 8.4vw, 130px) rises in at 0.88–0.93; "just like the man on Taipei 101" in the text face at clamp(20px, 2.4vw, 38px) under it at 0.94–0.985, as his hands reach the rim. Left column, top 20vh. `CLOSING.parts` in `data.js`.
- **Opening: treatment 1.** Fog at scroll 0, the wordmark waiting in it in ink, centred, clamp(64px, 15vw, 236px) on two lines; the fog clears only as the visitor scrolls, gone by 0.08 (`OPENING.fogTo`), the title gone by 0.05. The 0.03 wordmark beat in `WORDS` is dropped, since the opening title is that beat. The 2026-09-20 "CLOSE THE MIST" rule for the street still holds: measured fog 0.844 at 0.02, 0.316 at 0.05, 0 at 0.10 and 0.20, before the first word and long before the Red House.
- **Font: pairing 04**, the lead's pick under CJ's 「你選一個適合的好了」: Barlow Condensed 700 and 300 for the big words, Barlow 400/600/700 for the HUD, Chocolate Classical Sans for the Chinese names. Six woff2 files under `asset/fonts/`, subset to the page's own glyphs by `asset/fonts/gen/subset-fonts.py`, 31,352 bytes (30.6 KB; the fonts-10 figure of 27.4 KB had five files, the Condensed 300 face is the sixth). Family names and the big word's measure are custom properties at the top of `style.css`. Barlow's 700/300 contrast carries the two-tier treatment: at 1440×900 the 300 sub reads as a lighter voice under the 700 line, not as a thinner copy of it, and at 390×844 (54px) the 300 strokes still hold against the street (see `mobile/0.44.png`).
- **Removed:** `WORDS_OPTIONS`, `CLOSING_OPTIONS`, the `?opening=` switch, every `html[data-*]` block, `updateOpening`'s four other cases and the `uWhite` post uniform. The page loads correct with no query parameter.

Proof in `~/Desktop/issue16-final/`: 0 / 0.02 / 0.05 / 0.10 / 0.17 / 0.20 / 0.44 / 0.45 / 0.74 / 0.78 / 0.98 / 1.0 at 1440×900, `mobile/` 0.02 / 0.10 / 0.17 / 0.44 / 0.45 / 0.98 at 390×844. Headed, 1440×900, pixel ratio 1: 100.5 / 100.5 / 100.5 fps at 0.2 / 0.44 / 0.78 (the display cap). Console empty, three scene files re-run clean inside try/catch, no horizontal overflow and no HUD element outside the viewport at either width (checked per frame by bounding rect).

---

The rest of this file is the option research the picks were made from, kept as the record.

CJ, 2026-09-24: 「最覺得大字的部分並沒有那麼有質感 有幾個字讓我感覺突兀像是nostalgia, the future 不太像標語 還有最後Just like the man on 101 應該要大字一點然後前面要有keep climbing, just like the man on Taipei 101」. The voice the rewrites aim for is his README statement: 「從我們小時候在西門町的媽媽十元，一直到我們有能力建造點什麼；抬頭望向台北一零一，高樓上的人正在跟我們招手——讓我們一起爬得更高吧！」. The arc is unchanged (CJ, 2026-09-20: childhood and happiness and nostalgia → Spring Festival, growing older, responsibility, building → the future, where we go); English only, Chinese stays as the small secondary names.

**Say it out loud: the font is not picked.** Issue #10 has ten pairings waiting on CJ and none is installed, so every frame here is in the page's current system sans (`-apple-system` / PingFang / Helvetica). The five options differ in voice, size, weight, case, spacing, position, line breaks and reveal; they do not differ in typeface. CJ's font pick will change how all five look: a hand-written face makes option 1 warmer and option 2 less like a poster, a serif carries options 3 and 5 better than this sans does, and a heavy rounded face makes option 4's nouns friendlier. Pick the voice and treatment here, and expect to re-look once the font is in.

## How to see them

```
python3 -m http.server 8017 &
open "http://localhost:8017/index.html?words=3"          # 1..5
open "http://localhost:8017/index.html?closing=5"        # 1..5, scroll to the end
open "http://localhost:8017/index.html?opening=1"        # 1..5, load at the top of the page
open "http://localhost:8017/index.html?words=3&closing=5&opening=1"
```

No parameter is the page as shipped. The switch is throwaway: `WORDS_OPTIONS`, `CLOSING_OPTIONS` and the `?opening=` block in `data.js`, the `html[data-words] / html[data-closing] / html[data-opening]` blocks at the end of `style.css`, and in `app.js` three small generalisations (`holdTo`, `cont`, closing `parts`) plus `updateOpening`. Once CJ picks, the chosen list becomes `WORDS`, the chosen treatment becomes `.hud-word` / `.hud-closing`, and the rest is deleted.

Proof in `~/Desktop/issue16-words/`: `contact-words.png` (five options × 0.02 / 0.20 / 0.44 / 0.78), `contact-closing.png` (five treatments at 1.0 with the man on the crown), `contact-opening.png` (five openings × fog / title / cleared), full-size shots in `words-N/`, `closing-N/` and `opening-N/` (the opening folders also hold `check-0.02 / 0.05 / 0.10 / 0.20`). Headed, 1440×900, pixel ratio 1, `?opening=1&words=3&closing=5`: 100.6 / 100.4 / 100.5 / 100.7 / 100.4 fps at 0 / 0.02 / 0.2 / 0.44 / 0.78 (the display cap; the veil costs nothing measurable), console empty on every session, the three scene files re-run clean inside try/catch.

## Item 1 — the big words

The opening wordmark "Our Memory in Taipei" keeps its shipped size in every option (it is the wordmark issue #10 is judging fonts against); only its sub line changes voice. The beats sit at ≈ 0.11 / 0.20 / 0.28 in Ximending, 0.39 / 0.46 / 0.53 in Dadaocheng, 0.62 / 0.70 / 0.78 / 0.86 at the 101, so a word is on screen at each of the four proof fractions; today's list has nothing on screen at 0.20 or 0.78.

### Option 1 — spoken, first person

What you would say out loud walking this street. Sentence case, 500 weight, `clamp(30px, 4.8vw, 74px)` (about 69 px), a paragraph's width (680 px), left column at 30vh, the sub in sentence case too; revealed a word at a time, 90 ms apart, like speech. Feels like: a friend beside you, pointing. Closest to the README's own voice; the least like a poster.

| at | big | sub |
|---|---|---|
| 0.03 | Our Memory in Taipei | Come walk it with us. |
| 0.11 | Mum gave us ten dollars. | And the whole street was ours. |
| 0.20 | We spent it all right here. | Comics, cassettes, shaved ice. |
| 0.28 | We didn't know we'd miss this. | |
| 0.39 | Then we came back, a little older. | Every New Year, Dihua Street. |
| 0.46 | Now we do the New Year shopping. | |
| 0.53 | And we started building things of our own. | |
| 0.62 | Look what grew at the end of the street. | |
| 0.70 | Where do we go from here? | |
| 0.78 | Look up. | There's someone on the tower. |
| 0.86 | He's still climbing. | |

### Option 2 — short declaratives

Full stops. Nothing ornamental. Capitals, 700, `clamp(40px, 7.6vw, 118px)` (about 109 px), letter-spacing −0.02em, line-height 0.95, left column at 28vh; the sub stays small caps; the whole line cuts in at once, 180 ms, no glyph stagger. Feels like: a poster, a chant, the 標語 CJ asked for. The most confident; the least intimate.

| at | big | sub |
|---|---|---|
| 0.03 | Our Memory in Taipei | One street. Forty years. |
| 0.11 | We were small. | |
| 0.20 | We were happy. | Ten dollars went a long way. |
| 0.28 | We remember all of it. | |
| 0.39 | We grew up. | |
| 0.46 | We came back. | Every New Year. Dihua Street. |
| 0.53 | People counted on us. | |
| 0.62 | We built things. | |
| 0.70 | We don't know what's next. | |
| 0.78 | We look up. | |
| 0.86 | He is still climbing. | |

### Option 3 — a fragment that finishes on the next scroll beat

Each chapter is a sentence in two halves. The first half lands bold (700) and stays on screen; scrolling brings the second half in under it in light weight (300), same size, `clamp(40px, 7vw, 108px)` (about 101 px), left column at 24vh. Two of the five pairs complete across a chapter cut (growing up completes just before the Dadaocheng flash; "it kept getting taller" completes as the tower appears). Feels like: the reader finishes the sentence by moving; the page has a rhythm the others do not. Risk: a reader who stops mid-pair sees a half sentence, which is the point, but it can read as a bug.

| at | big | note |
|---|---|---|
| 0.03 | Our Memory in Taipei | sub: Scroll, and keep scrolling. |
| 0.11 → 0.19 | We were small, / and the street was enormous. | |
| 0.27 → 0.33 | We didn't know it then, / but we were growing up. | completes before the chapter cut at 0.347 |
| 0.37 → 0.44 | Every New Year we came back, / with more to carry. | |
| 0.53 → 0.62 | We built what we could, / and it kept getting taller. | completes as the 101 rises at the end of the street |
| 0.70 → 0.78 | Where do we go from here? / Up. | "Up." holds to 0.85, then the closing line |

### Option 4 — one concrete noun per chapter, set very large

Three nouns, one per chapter, each held through the heart of its chapter (`holdTo`), 800 weight, `clamp(64px, 13vw, 200px)` (about 187 px), letter-spacing −0.045em, left at 18vh, with the caption as a small-caps eyebrow above the noun. Glyph reveal slowed to 60 ms. Feels like: three photographs with titles; the quietest option and the biggest type. "Red envelopes." carries growing up in one object (you received them, now you give them). Risk: long silences between nouns (0.25 → 0.40, 0.50 → 0.72), and the arc's "we build things" is only implied.

| at | big | eyebrow |
|---|---|---|
| 0.03 | Our Memory in Taipei | Three things we kept. |
| 0.13 → 0.25 | Ten dollars. | Mum's. Every Saturday. Ximending. |
| 0.40 → 0.50 | Red envelopes. | We give them now. |
| 0.72 → 0.84 | The top. | Someone is already up there. |

### Option 5 — the risk: second person, every line a question

Every line asks the viewer, and the last one is a dare that the closing line answers. 300 weight, `clamp(40px, 7.4vw, 112px)` (about 107 px), right-aligned in the right column at 40vh (the wordmark stays left, the questions come from the other side); glyph reveal at 30 ms with the question mark held back 420 ms so it lands last. Feels like: the page talks to you, not about us; "Do you miss it?" does the work "Nostalgia." was trying to do. Could be wrong: eleven questions in a row can feel like an interrogation, and "Who is counting on you now?" may be too pointed for a build-day audience. Could be much better: it is the only option where "Keep climbing" arrives as a reply.

| at | big | sub |
|---|---|---|
| 0.03 | Our Memory in Taipei | Is it yours too? |
| 0.11 | Remember the ten dollars? | |
| 0.20 | What did you spend it on? | Comics, cassettes, shaved ice. |
| 0.28 | Do you miss it? | |
| 0.39 | When did you stop being small? | |
| 0.46 | Who is counting on you now? | |
| 0.53 | What have you built? | |
| 0.62 | Did you see this coming? | |
| 0.70 | Where do you go from here? | |
| 0.78 | Can you see him? | Up there. |
| 0.86 | What's stopping you? | |

## Item 2 — the closing line

The text is decided (CJ, 2026-09-24): **"Keep climbing, just like the man on Taipei 101"**, bigger than today's 40 px. Five treatments of that one sentence, all rendered at fraction 1.0 with the man standing on the crown's left corner (screen ≈ 725, 385 at 1440×900). Each part has its own fade window (`parts` in `data.js`), so "Keep climbing," can land on its own beat.

| # | treatment | size at 1440 | where | enters |
|---|---|---|---|---|
| 1 | Stacked, two beats, where the line sits today | "Keep climbing," 95 px / 700; the rest 35 px / 500 under it | left column, top 20vh, beside the tower | "Keep climbing," rises in at 0.88–0.93; the rest at 0.94–0.985 as his hands reach the rim |
| 2 | One line, margin to margin, above the crown | 51 px / 700, one line, centred | top 22vh, the spire runs up behind the middle of the line | arrives whole, 0.90–0.96, a slow settle from 96 % scale |
| 3 | Level with the man | "Keep climbing," 72 px / 700; the rest 27 px under it, both right-aligned | a 600 px block whose right edge stops 60 px short of him, at his height (top 36vh) | slides 24 px toward him, "Keep climbing," 0.90–0.95, the rest 0.96–0.99 |
| 4 | Headline over the spire | KEEP CLIMBING, 80 px / 800 capitals; JUST LIKE THE MAN ON TAIPEI 101 as 18 px letter-spaced caps | centred at the top (6vh), clear of the spire tip, between the chapter column and the wordmark | drops in from above, 0.90–0.95, both parts together |
| 5 | The wall | "Keep" / "climbing," 132 px / 800 on two lines; the rest 32 px / 500 | fills the left half, top 20vh, "climbing," ends 20 px from the man | "Keep" at 0.84–0.89 and "climbing," at 0.88–0.93 while he is still climbing; the rest lands at 0.975–1.0 as he stands and waves |

What each one feels like: 1 is today's frame made to work, safe and legible; 2 is a title card, the whole sentence as one breath over the skyline; 3 is a caption pointing at him, the most literal "just like the man"; 4 is a poster headline, the tower's spire pointing up into the words; 5 is the loudest, the instruction first and the reason only when he is standing.

## The opening — fog → title → clear, five treatments

CJ, 2026-09-24: 「開頭也要迷霧然後顯示our memory in taipei」. **This does not overturn CJ, 2026-09-20: "CLOSE THE MIST I WANT THE WEBSITE BE BRIGHT AND PRETTY".** That rule is about the street and it still holds: none of the five puts fog on the street the visitor walks. Each is a scoped opening device, fog at scroll 0 only, the title surfacing through it, then the fog gone. Measured (`window.__fog.opening.fog`) at 0.02 / 0.05 / 0.10 / 0.20 for every option: option 1 still has 0.32 of its veil at 0.05 and is 0 by 0.08; every other option is 0 at 0.05; all five are 0 at 0.10 and 0.20, long before the Red House at 0.20. The mechanism is the page's own: the directional veil in `app.js` (`FOG_U.frontier`, switched off since 2026-09-20 by the `-1e5` write) is driven for the opening window only, plus the exponential haze density; option 5 uses a white-out uniform in the post pass instead of fog. Two things had to change for the veil to be total: the library items and the canvas signs had opted out of fog (`unfog()`, `sign()`), so for the opening every material is switched into fog once before the warm-up compiles; and the mountains, tone-mapped where the sky dome is not, rendered the same fog colour darker (grey wedges), so they render un-tone-mapped while the veil is up.

Each row of `contact-opening.png` is fog / title / cleared. Options 1, 2, 3 and 5 draw their own title (`.hud-opening`, centred, the 主角 of the frame) and drop the 0.03 wordmark beat; option 4 is the wordmark beat itself, pulled to scroll 0.

| # | fog | clears | title | street | feels like |
|---|---|---|---|---|---|
| 1 | Total, bone-white | Slowly, only as you scroll, gone by 0.08 | Already there in the fog: ink, 700, 12vw (170 px), two lines, dead centre. Turns bone as the veil goes | Hidden | The page waits for you. Nothing happens until you move, and your first scroll opens the world. The most deliberate. |
| 2 | Total | On its own: holds 2 s, lifts over 2.5 s (a scroll before that clears it by 0.05) | Fades up out of the fog over 1.2 s: vermilion, 300, 7vw (100 px), one line, then turns bone | Hidden | A film title. You can stand still and it plays; the street arrives whether or not you touch anything. |
| 3 | A veil: the street's shapes read through it | Fast, as you scroll, gone by 0.04 | Blurred and half-faint at the vanishing point of the street, 700, 7.4vw; sharpens and brightens as the veil retreats past it | Silhouetted | Morning haze burning off. The fastest and the least ceremonial; the street is the point, the title is on it. |
| 4 | A light veil, the street visible in it | On its own over 6 s (1 s hold, 5 s lift), or by 0.05 if you scroll | No new element: the shipped wordmark, top-left at its shipped size, held at scroll 0 to 0.045 | Visible, hazed | The page as it is, breathed on. The quietest; it changes the least and asks the least. |
| 5 | None. Light instead: a white-out | Only as you scroll, gone by 0.03 | Ink on white, 800, 8.5vw (122 px), the sub in ink too, fades up over 0.9 s; the street resolves behind it and the text turns bone | Hidden by light | A print. Not mist at all, which CJ may prefer given the 2026-09-20 rule; the boldest graphic and the cleanest. |

**The chapter-to-chapter transition.** CJ separately said the era change is 「太短沒感覺」. Option 3's mechanism, a veil that hazes the street and retreats away from the camera as you scroll, would also work as the chapter cut: run it over ±0.02 of each boundary in place of the 500 ms flash, so the street ahead is briefly veiled and the new chapter is revealed by scrolling into it. It is the only one of the five that keeps the street on screen while it works, which is what a transition needs. Not built; say the word and it is a separate issue.

## If asked which

Words: option 2, because CJ's complaint was 不太像標語 and 2 is the one that reads as a slogan while still saying what 1 says; 5 is the one I would want to see with the real font before ruling it out. Closing: 5, because "bigger" was the ask, the two-beat timing follows the climb, and the man is the only thing in the frame it does not cover. Opening: 1, because CJ's own verb for the page is scroll and 1 is the one where the visitor's first scroll opens the world; if the 2026-09-20 rule makes fog of any kind feel wrong, 5 gives the same beat with light. CJ can ignore all three.
