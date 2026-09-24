# Brief: issue #16 items 1 and 2 — five options for the big words, five for the closing line

"Our Memory in Taipei" is a scroll-driven three.js page built for Claude Code Build Day, live at https://joy-shen123.github.io/Our-Memory-in-Taipei/. It is feature-complete: buildings, music, models, a crowd, sky, shadow, and a man who climbs to the top of the 101. CJ walked it just now and the thing that does not hold up is **the writing**. Read `HANDOFF.md` in full before you touch anything, and read `README.md` — its opening section is CJ's own statement of what this page is for, and it is the voice the words should be in.

**You are producing options, not an answer.** CJ has twice asked to be shown choices rather than handed a decision. Do not pick one and build it.

## Goal

CJ can look at two contact sheets and point at a number.

## Done when

Branch `issue-16-words`, commits not pushed.

### Item 1 — the big words, five complete rewrites

CJ, 2026-09-24: 「最覺得大字的部分並沒有那麼有質感 有幾個字讓我感覺突兀像是nostalgia, the future 不太像標語」

`WORDS` in `data.js` currently reads as a list of category labels. He named two by name — **"nostalgia"** and **"the future"** — as the ones that feel wrong. They are nouns a museum placard would use, not something a person says.

Five options. Each one is a **complete rewrite of the whole word list in one consistent voice**, plus the typographic treatment that belongs to it: size, weight, case, letter-spacing, where in the frame it sits, how it breaks across lines, how it reveals. A rewrite with the old treatment is half an option.

Make the five genuinely different registers, not five edits of the same idea:
1. A spoken first-person voice — what someone would actually say walking this street.
2. Short declaratives. Full stops. Nothing ornamental.
3. A fragment that finishes across two scroll beats, so the reader completes it by scrolling.
4. One strong concrete noun per chapter, set very large.
5. One that takes a real risk — a question, a second-person address, something that could be wrong but could be much better.

The arc must survive. CJ, 2026-09-20: "FIRST THE MEMORY OF OUR CHILDHOOD, WE FEEL HAPPINESS, WE FEEL NOSTALGIA … SECOND PART, DAODACHENG SPRING FESTIVAL, WE GROW OLDER, WE HAVE RESPONSIBILITY, WE BUILD THING, THIRD PART THE FUTURE, WHERE WE GO". English only (CJ, 2026-09-20: "all in english"); Chinese stays as the small secondary names.

### Item 2 — the closing line, five treatments

CJ, 2026-09-24: 「最後Just like the man on 101 應該要大字一點然後前面要有keep climbing, just like the man on Taipei 101」

**This is a decision, not a proposal.** The text becomes **"Keep climbing, just like the man on Taipei 101"** and it must be **bigger** than it is today. Do not offer alternative wordings.

The five options are five treatments of that one sentence: how large, how it breaks across lines, whether "Keep climbing," lands on its own beat before the rest, where it sits against the man on the crown, and how it enters. Render every one at fraction 1.0 with the man visible in frame.

### Proof

- `~/Desktop/issue16-words/contact-words.png` — all five word options on the same frame, labelled 1–5.
- `~/Desktop/issue16-words/contact-closing.png` — all five closing treatments at fraction 1.0, labelled 1–5.
- Full-size individual shots beside them. The words appear at several fractions, so shoot each word option at 0.02, 0.20, 0.44 and 0.78, not just one.
- `research/plan-6/words-5/README.md` — one section per option: the full rewritten word list as text CJ can read without squinting at an image, the treatment in one line, and one line on what it makes the page feel like.
- fps at the display cap at 0.2 / 0.44 / 0.78, console empty, all three scene files re-run clean inside try/catch.

## The thing you must say out loud

**The font pairing is not picked yet** — issue #10 has ten pairings waiting on CJ and none is installed. Render all five word options in the page's current face so the comparison is about voice and treatment, not typeface. Say plainly in your README that CJ's font pick will change how all five look, so he is not choosing blind.

## CJ's words

- 2026-09-24: 「最覺得大字的部分並沒有那麼有質感 有幾個字讓我感覺突兀像是nostalgia, the future 不太像標語 還有最後Just like the man on 101 應該要大字一點然後前面要有keep climbing, just like the man on Taipei 101」
- 2026-09-24, from the README he approved, on what the page is for: 「從我們小時候在西門町的媽媽十元，一直到我們有能力建造點什麼；抬頭望向台北一零一，高樓上的人正在跟我們招手——讓我們一起爬得更高吧！」 **This is the voice.** The rewrites should sound like the person who wrote that.
- 2026-09-20: "CLOSE THE MIST I WANT THE WEBSITE BE BRIGHT AND PRETTY".

## What is here

- `HANDOFF.md` — read in full. `data.js` holds `WORDS` and `CLOSING`; `style.css` holds the words and their glyph transitions and the closing line at 24vh; `app.js` does the per-glyph reveal.
- `README.md` — CJ's own statement of intent. Read it before writing a single word.
- `research/plan-6/README.md` section 6 and `shots/closing-A-replaces.png` — the earlier closing-line work.

## Method

1. Read `HANDOFF.md`, then `README.md`, then walk the live page yourself at 0.02 / 0.20 / 0.44 / 0.78 / 1.0 and look at the words in place before writing any.
2. Build the options behind a switch so all five can be rendered without five branches — a query parameter reading into `data.js` is fine, and it is throwaway code, so say so in the commit.
3. Test as `HANDOFF.md`'s "How to test" says. Your own port; never `pkill` by pattern. **Mute the browser right after opening it** — the page plays music and CJ is in the room. Close the session after each check.
4. Re-run each scene file in the page inside try/catch after the screenshots.

## Do not touch

- `style.css`'s music HUD block and `music.js` — `fable-issue16-music` is rethinking that on branch `issue-16-music`.
- `asset/fonts/` and the font custom properties — `issue-10-fonts` owns those and CJ has not picked.
- `app.js`'s lighting, the crowd, the climbing man's path — all merged and settled.
- **Do not push, do not open a PR, do not pick an option.**

## Deliverable

Reply with only: the two contact-sheet paths, the five word options as one line each, the five closing treatments as one line each, and one line saying which you would pick and why — CJ can ignore it.
