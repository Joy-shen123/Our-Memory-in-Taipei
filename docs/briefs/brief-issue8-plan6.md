# Brief: issue #8, the research pass for the next six items

"Our Memory in Taipei" is a scroll-driven three.js page, live at https://joy-shen123.github.io/Our-Memory-in-Taipei/. Four passes have shipped: real buildings (#1), surface texture (#3), a decade music player (#4), Blender-scripted models (#5). CJ walked the page after #5 and named six things he wants next. They touch each other — the sky changes the light, the light changes the polish, the climb changes the closing frame — so they get one research pass before anyone opens a branch.

You are that research pass. You write a document CJ reads and picks from. You do not change the page.

## Goal

`research/plan-6/README.md` exists and CJ can make six decisions from it in one sitting, each with what it costs and what it risks.

## Done when

`research/plan-6/README.md` has one section per item below, and every "Question" in issue #8 is either answered with a recommendation or marked `(unknown — needs CJ)` with the exact thing you need from him. Sky and font sections carry side-by-side comparison images rendered on our own street, in `research/plan-6/shots/`, the way `research/render-styles/` did it.

Read the issue first: `gh issue view 8`. Its "What is known today" list is your section order and its Questions are your brief.

## CJ's words

- 2026-09-23: 「幫我把下次要做天空 改字體 搞光影 101上的人要爬到頂端 還有精修 最後出現的字想要 Just like the man on Taipei 101 issue 6 下次要執行之前要先做研究 先搞清楚完整的plan 有必要分開issue 也可以」
- 2026-09-20: "CLOSE THE MIST I WANT THE WEBSITE BE BRIGHT AND PRETTY" — daylight stays. No fog, no night, no bloom. Do not propose any of them.
- 2026-09-21: 「盡量矮點才能比較後來的建設跟慢慢長大的感覺」— chapter 1 stays low.
- 2026-09-20: "THE BUILDING NEED TO REFERENCE REAL BUILDING".

## What is here

- `HANDOFF.md` — read in full first. What every file does, how to test, the chapter fractions, and what each pass honestly failed to do.
- `research/bruno-simon/README.md` — the bruno-simon.com teardown. Section 6b is the sky-per-chapter method; its font section is Nunito + Amatic SC. Use it; do not redo it.
- `research/render-styles/` — the shape your comparison images should take, and the README row format.
- `docs/RUBRIC.md` — the scoring instrument. The palette-and-light line sits at 4 in every chapter; that is what #11 is trying to move.
- `app.js` — the renderer, the canvas sky that lights the scene and is never shown, the shadow sun, the climbing man, `TOWER.faceX(y)`, the words.
- `style.css` — the HUD and the big words, currently system sans.
- `data.js` — `WORDS` and `CLOSING`.

## Method

1. Read `HANDOFF.md` in full, then `gh issue view 8`, then the bruno-simon teardown.
2. Per item: what the page does today (read the code, do not guess), the real options, the cost in work and in fps, the risk, and one recommendation with a reason.
3. Sky and fonts need pictures, not prose. Render each option on our own street at the chapter fractions and put them side by side. Fonts: at least three pairings across the big words, the HUD column, the closing line, and the Chinese secondary names, with licence and woff2 file size per face. Self-hosted only — the page has a no-network rule.
4. For the climb (#12) and the closing words: propose the last 10 percent of scroll concretely — where the man is at fraction 1.0, whether the camera follows past the crown, what the final frame holds, and whether "Just like the man on Taipei 101" replaces or follows the current line. That last one is CJ's call; give him the two versions as frames, not as a paragraph.
5. End with a recommended order across the six, and say which two you would do first and why.
6. Test the live page as `HANDOFF.md`'s "How to test" says. Use your own port. Mute the browser right after opening it — the page plays music through the speakers and CJ is in the room. Close the session after each check. Never `pkill` by pattern; other agents' servers are running.

## Do not touch

- Any file outside `research/plan-6/`. Not `app.js`, not `style.css`, not `data.js`, not `asset/`.
- `asset/blender/` and `asset/models/` — `opus-issue15` is rebuilding those on branch `issue-15-detail` right now.
- `asset/music/private/` — CJ's private songs, gitignored.
- Do not commit, do not push, do not open a PR. The lead commits your output.

## Deliverable

- `research/plan-6/README.md` with six sections plus a recommended order.
- `research/plan-6/shots/` with the sky and font comparisons.

Reply with only: the path, the six recommendations one line each, and the list of things marked `(unknown — needs CJ)`.
