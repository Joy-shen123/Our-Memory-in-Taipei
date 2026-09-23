# Brief: issue #13 step 1, the blind rubric score

"Our Memory in Taipei" is a scroll-driven three.js page, live at https://joy-shen123.github.io/Our-Memory-in-Taipei/. Four passes have shipped and every one of them was scored by the agent that built it. Before the polish pass decides what to fix, the page needs a score from someone who did not build it.

That is you. You score blind: you read the rubric and the screenshots, and you do not read any previous score, any builder's self-assessment, or any of the commit messages that claim a number.

## Goal

A score CJ can trust, because the scorer had nothing invested in the result.

## Done when

`research/blind-score-2026-09-24/README.md` exists with a filled score table from `docs/RUBRIC.md`, one row per criterion per chapter, each cell carrying the screenshot filename that justifies it and one sentence of evidence. Every cell below 4 has a named, concrete fix. Twelve screenshots sit beside it in `shots/`.

## CJ's words

- 2026-09-23: 「還有精修」— the polish pass. This score decides what "polish" means.
- 2026-09-22: 「the color pallete is close but textue andthe model itself doesnt qualified」
- 2026-09-20: "CLOSE THE MIST I WANT THE WEBSITE BE BRIGHT AND PRETTY" — score against a bright daylight page. Dimness is a fault, not a style.

## What is here

- `docs/RUBRIC.md` — the instrument. Use its criteria exactly, do not invent new ones, do not drop ones that are hard to judge.
- `HANDOFF.md` — read the "How to test" section for the browser method and the chapter fractions. **Do not read its rubric results or its per-pass self-assessments.** Skip those paragraphs; they are the thing you are meant not to be influenced by.

## Method

1. Read `docs/RUBRIC.md` in full. Read only the "How to test" section of `HANDOFF.md`.
2. Score the live page at https://joy-shen123.github.io/Our-Memory-in-Taipei/ — it serves the current main with every merged pass in. No local server needed.
3. Twelve screenshots, headless, 1440x900: four per chapter, spread across its fraction range. Chapter fractions: red 0.02–0.347, dadao 0.347–0.582, tower 0.582–1.0. Save to `research/blind-score-2026-09-24/shots/`.
4. Mute the browser right after opening it — the page plays music through the speakers and CJ is in the room. Close the session after each check.
5. Score each criterion per chapter. A cell is a number, a screenshot filename, and one sentence saying what in that image earns the number.
6. For every cell below 4: one concrete fix, naming the file it would touch. Not "improve the composition" — say what to move and where.
7. End with the three lowest cells across the whole page, ranked, and say which one you would fix first for the most visible gain.

## Do not touch

- Any file outside `research/blind-score-2026-09-24/`.
- `asset/blender/` and `asset/models/` — `opus-issue15` is rebuilding those on another branch.
- `research/plan-6/` — `sonnet-plan6` is writing there.
- Do not commit, do not push. The lead commits your output.

## Deliverable

- `research/blind-score-2026-09-24/README.md` with the filled table.
- `research/blind-score-2026-09-24/shots/` with twelve screenshots.

Reply with only: the path, the score table's totals per chapter, and the three lowest cells with their fixes.
