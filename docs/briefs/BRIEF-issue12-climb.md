# Brief: issue #12, the man reaches the top, and the last words on screen

"Our Memory in Taipei" is a scroll-driven three.js page built for Claude Code Build Day, live at https://joy-shen123.github.io/Our-Memory-in-Taipei/. It ends on a man climbing Taipei 101. Right now he never gets there — the scroll runs out while he is still on the face of the building, so the page's last beat is unfinished. Read `HANDOFF.md` in full before you touch anything.

This is the ending of the whole piece. It is the last thing a visitor sees and the thing they will remember. Treat it that way.

## Goal

The man reaches the top of the 101, and the last words on screen are "Just like the man on Taipei 101".

## Done when

Branch `issue-12-climb`, commits not pushed.

1. **He reaches the crown.** At scroll fraction 1.0 he is at the crown, y=106 — not the spire at y=129, which `research/plan-6/README.md` section 4 rules out because the spire is a mast, not somewhere a person stands. He must stay on the west face the whole way: `TOWER.faceX(y)` gives the face's x at any height, and the profile flares outward per segment, so a linear climb drifts off the glass. Check him against the building at several fractions, not just the last one.
2. **The camera follows.** `CAM[5]` in `data.js` is the last keyframe; raise its look-target so he is actually framed when he arrives, rather than leaving the camera pointed where he used to be. z must keep decreasing across `CAM` — that invariant is in `HANDOFF.md` and breaking it breaks the whole rig.
3. **The closing words.** `data.js` `CLOSING` currently reads *"Where we go, we don't know. We only know we need to climb higher."* It becomes **"Just like the man on Taipei 101"**. The research compared replacing against stacking both lines and recommends replacing: the closing window is about 10% of the scroll and two lines crowd it. Both versions are rendered in `research/plan-6/shots/closing-A-replaces.png` and `closing-B-follows.png` — **open both before you change anything.**
4. **The last frame is composed.** Not just "he is up there" — the final frame should hold the man, the crown and the line together and be worth stopping on. Say in your reply what the last frame contains.
5. Screenshots at 0.85 / 0.90 / 0.95 / 0.98 / 1.0 into `~/Desktop/issue12-climb/`, plus a frame every 0.02 across 0.90–1.00 so the arrival reads as motion and not a jump. fps at the display cap at 0.2 / 0.44 / 0.78, console empty, all three scene files re-run clean inside try/catch.

## CJ's words

- 2026-09-23: 「101上的人要爬到頂端」— the man must reach the top.
- 2026-09-23: 「最後出現的字想要 Just like the man on Taipei 101」— the closing line he wants.
- 2026-09-24, on the README, his own description of what this page is for: 「抬頭望向台北一零一，高樓上的人正在跟我們招手，讓我們一起爬得更高吧！」— *we look up at Taipei 101, and the man high on the tower is waving at us; let's climb higher together.* **The man waving is the point of the ending.** If there is a cheap way to make him read as waving or beckoning at the top rather than just stopping, that is worth a commit.
- 2026-09-20: "CLOSE THE MIST I WANT THE WEBSITE BE BRIGHT AND PRETTY" — bright daylight, no fog, no night.
- 2026-09-20: "all in english" — English copy.

## The assumption the lead made for you

CJ was asked whether the new line replaces the old one or follows it, and has not answered. The lead is proceeding on **replace**, the research's recommendation, because it is a one-line change in `data.js` and trivially reversible. Build it so that stays true: the closing copy lives in `data.js` `CLOSING` and nowhere else.

## What is here

- `HANDOFF.md` — read in full. The `scene-tower.js` section describes `TOWER.h` (crown top) and `TOWER.faceX(y)`; the `app.js` section covers the climbing man and the words' per-glyph reveal; `data.js` holds `CAM`, `WORDS`, `CLOSING`.
- `research/plan-6/README.md` section 4 and section 6 — the climb and the closing words, with costs.
- `research/plan-6/shots/closing-A-replaces.png`, `closing-B-follows.png` — the two versions, rendered.
- `app.js` — the climbing man, the words, the post pass.
- `data.js` — `CAM` (6 keyframes), `WORDS`, `CLOSING`.
- `scene-tower.js` — sets `TOWER.h` and `TOWER.faceX(y)`.

## Method

1. Read `HANDOFF.md`, then the two research sections, then open both closing-line shots.
2. Commit per numbered item. Keep the copy change its own commit so it can be reverted alone.
3. Test as `HANDOFF.md`'s "How to test" says. Your own port; never `pkill` by pattern, other agents' servers are running. **Mute the browser right after opening it** — the page plays music through the speakers and CJ is in the room. Close the session after each check.
4. A page-load exception is NOT captured by the browser session. Re-run each scene file inside try/catch after the screenshots.
5. Update `HANDOFF.md` on the last commit.

## Do not touch

- `scene-tower.js`'s crowd code — `fable-issue13` is adding a pedestrian set there on `issue-13-polish`. You may read `TOWER`; do not restructure the file.
- `HAZE_DENSITY` and the lighting block in `app.js` — `fable-issue13` and `fable-light` own those on their own branches.
- `style.css` and `asset/fonts/` — `fable-issue10` owns those.
- `asset/blender/`, `asset/models/` — `opus-issue15` owns those.
- `WORDS` — only `CLOSING` changes. The chapter words are CJ's and stay.
- **Do not push, do not open a PR.** CJ decides the push.

## Deliverable

- Branch `issue-12-climb`, not pushed.
- `~/Desktop/issue12-climb/` with the arrival sequence.

Reply with only: the commit hashes, where the man is at fraction 1.0, what the last frame contains, the fps triple, and one line on anything you could not do.
