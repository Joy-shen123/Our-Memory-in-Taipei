# Brief: issue #1 Part 3 (rubric) + the IVRESS borrow list

You are a fresh agent in the git worktree for branch `issue-1-part-1` of the "Our Memory in Taipei" page (repo Joy-shen123/Our-Memory-in-Taipei, formerly claude_code_build_day). Parts 1 and 2 of GitHub issue #1 are committed on this branch by a previous agent. Read `HANDOFF.md` in this folder in full first; it is current as of Part 2. Then `gh issue view 1 --repo Joy-shen123/Our-Memory-in-Taipei` for Part 3's exact spec.

## Goal

Issue #1 fully done on this branch, then the eight cheap IVRESS-derived effects added, all without breaking a stated constraint (r149 UMD, no build, no network, no image or model files, double-click index.html, 60 fps, bright daylight, no fog).

## Done when

1. `RUBRIC.md` exists in the repo root with the seven criteria and the 1–5 scale from the issue; each of the three chapters scored once with one line of evidence per score; the scores and the three lowest-scoring items (with who takes each: "agent" or "CJ decision") posted as a comment on issue #1 via `gh issue comment`. Commit.
2. Each borrow item below is its own commit, with a screenshot proving it in `~/Desktop/issue1-part1/part3/<item>.png` (headless, 1440x900, fractions named in the item). After all of them: fps still 60+ at fractions 0.2, 0.44, 0.78 measured headed, console empty, and `HANDOFF.md` updated.

## CJ's words

- 2026-09-21: 「all」— go on Part 3 and the borrow list, in answer to "say go Part 3 for the rubric, or borrow to queue the 7-hour IVRESS list".
- 2026-09-20: 「CLOSE THE MIST I WANT THE WEBSITE BE BRIGHT AND PRETTY」— no fog, daylight stays.
- 2026-09-21: 「盡量矮點才能比較後來的建設跟慢慢長大的感覺」— the opening stays low; do not add tall things to chapter 1.

## What is here

- `HANDOFF.md` — current state, file map, test recipe, scene API. Read first.
- `/Users/cjthewestie/Documents/CJ-project-vault/shidaimiwu-proto/research/ivress/README.md` — the IVRESS teardown. Section "What we could borrow tonight" is the borrow list; its rows give the how and hours. Read-only, on the main checkout, not in this worktree.
- `/Users/cjthewestie/Documents/CJ-project-vault/shidaimiwu-proto/research/threejs-sites-2026.md` — section 6 rows 5 and 6 (robustness, ship kit). Read-only.

## Method

1. Part 3 first, as the issue specifies. Score honestly; a 2 with evidence beats a 4 without.
2. Borrow list, in this order, one commit each, screenshot each: (a) chapter-cut flash at the two era boundaries, fraction 0.33 and 0.60; (b) letter-by-letter word reveal, fraction 0.12; (c) chapter column and counter "01/03 WHEN WE WERE YOUNG" with the Chinese name vertical, fraction 0.05; (d) luminance-aware grain, fraction 0.44; (e) FOV ramp on the climb, fraction 0.97; (f) mouse parallax, damped, fading near chapter ends, fraction 0.44 (screenshot with the pointer offset via agent-browser mouse move); (g) curve particles: lantern sparks in Dadaocheng and a light stream up 101, fraction 0.5 and 0.9, capped so fps holds; (h) render warm-up per era at load.
3. Robustness, one commit: pixel ratio cap 2 desktop and 1.5 on phones, delta-time clamp so the runner does not teleport after a tab switch, keyboard and touch scroll fallback. Check 390x844 once.
4. Measure fps headed and alone (HANDOFF explains why), update HANDOFF, final commit.

## Do not touch

- Nothing outside this worktree. The main checkout and `research/` are read-only.
- Do not push, do not open a PR; CJ decides that.
- Do not bring back fog, bloom, night, or traffic.

## Deliverable

- Commits on `issue-1-part-1`, `RUBRIC.md`, the issue comment, screenshots in `~/Desktop/issue1-part1/part3/`.
- Reply with only: the commit list (hash and subject), the rubric scores as a 3-row table, the fps numbers, and one line on anything you skipped and why.
