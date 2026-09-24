# Brief: issue #17 part 2 — clickable points on the street that show the real place

"Our Memory in Taipei" is a scroll-driven three.js page built for Claude Code Build Day, live at https://joy-shen123.github.io/Our-Memory-in-Taipei/. Every building in it was modelled from a real Taipei building, and the README claims so: 「所以這裡的每一棟樓都有本尊」. Right now the visitor has to take that on trust.

CJ, 2026-09-24: 「街邊有興趣點可以進去點照片嗎」 — points of interest along the street you can click to see the photograph.

Part 1 of this issue is done: `sonnet-photos` found and licence-checked real photographs for eight of ten anchors. They are in your worktree at `research/photos/candidates/`, with the full licence table in `research/photos/README.md`. **Read that README before you touch an image.**

Read `HANDOFF.md` in full before you touch anything.

## Goal

A visitor clicks a marker on the street and sees a photograph of the actual place, beside the model of it, and believes the page.

## The hard constraint: do not fight the other agents

Three agents are working in this repo right now and two of them are in `app.js` and `style.css`:

- `fable-words` — the big words, the closing line, the opening fog, the fonts. Owns `data.js` copy, `style.css`'s HUD and word blocks, `asset/fonts/`.
- `fable-transition` — the era transition, and it is creating `asset/photos/` for two transition photographs.
- `opus-blender` — offline renders only, not in the page.

**So: write your code as a new module, `photos.js`.** Your only edits outside it are one `<script>` tag in `index.html` and, if unavoidable, a handful of lines in `app.js` to get the camera and the raycast. Keep those lines few and in one place, commented, so the merge is trivial. Put your CSS in `photos.css`, not in `style.css`.

If you need `asset/photos/` and it already has files from `fable-transition`, add to it, do not restructure it.

## Done when

Branch `issue-17-hotspots`, commits not pushed.

1. **A marker at each anchor that has a photograph.** Eight of them: `chunghwa` 中華商場, `red-house` 西門紅樓, `wannian` 萬年大樓, `dihua` 迪化街, `temple` 霞海城隍廟, `yongle` 永樂市場, `wharf` 大稻埕碼頭, `tower101` 台北101. `lux` 樂聲戲院 and `ximen-zone` 西門町徒步區 have nothing cleared — leave them without markers rather than inventing something.
   `data.js`'s `anchors` already hold each one's position and label, and each scene file sets `anchors.<id>.top`. Use those; do not place markers by hand.
2. **The marker reads as clickable without shouting.** It sits near its building, it is visible while that building is in frame and fades when it is not, and it does not compete with the big words or the HUD. A visitor who never clicks one should not find the page busier than before.
3. **Click opens a panel** with the photograph, the place's name in English with the Chinese below it, the year, and the credit. **Attribution is visible on the panel, not buried** — several photographs are CC BY or CC BY-SA and require it. CJ accepted the share-alike obligation on 2026-09-24 (「ok」), so the page also needs a CREDITS block listing every photograph, its rights holder and its licence.
4. **Closing returns you exactly where you were.** The scroll position does not jump. The page does not stop scrolling while a panel is open — or if it does, that is a deliberate choice you defend in one line.
5. **It works on a phone.** 390×844. A marker you cannot hit with a thumb is not a marker.
6. **Images are sized for a screen, not an archive.** webp, the whole set under 1.5 MB, and say the real bytes. Some candidates are 4608×3456; none of that reaches the browser. The page fetches nothing but its own files — no hotlinking, no CDN.
7. **Captions do not lie.** The README flags two: `chunghwa` is 1961, the complex brand new, not the 1980s rooftop-neon era the page models; `dihua`'s "1919" is the building's construction year, not the photo's date, and the file reads as a modern documentation photo. Caption both accurately. A caption that overclaims is worse than no photograph.
8. Screenshots into `~/Desktop/issue17-hotspots/`: the street with markers at 0.20 / 0.44 / 0.78, a panel open for three different anchors, the same at 390×844, and one of the CREDITS block. fps at the display cap at 0.2 / 0.44 / 0.78, console empty, all three scene files re-run clean inside try/catch.

## CJ's words

- 2026-09-24: 「街邊有興趣點可以進去點照片嗎」
- 2026-09-24: "i am trying to make this project look better can you set some place with a point i can click and showed the picture or real street"
- 2026-09-20: "THE BUILDING NEED TO REFERENCE REAL BUILDING" — the photographs are the proof of that claim.
- 2026-09-20: "CLOSE THE MIST I WANT THE WEBSITE BE BRIGHT AND PRETTY" — the panel is bright and matches the page. No dark overlay that turns the page into a lightbox.
- 2026-09-24: 「只要可以得到好看的風格就好了」 — if a better interaction than a panel occurs to you while building, say so; do not build it without asking.

## What is here

- `HANDOFF.md` — read in full. `data.js` holds `anchors`; `app.js` has the camera rig, `window.__fog` (`progress`, `camZ`, `BOUNDS`, `jumpToYear`) and the anchor-label fade at `LABEL_NEAR`; `style.css` describes the HUD.
- `research/photos/README.md` — every licence, read on the item page, plus two anchors with nothing usable and a list of what was found and rejected and why.
- `research/photos/candidates/` — the files.

## Do not touch

- `data.js`'s `WORDS` and `CLOSING`, `style.css`'s word and HUD blocks, `asset/fonts/` — `fable-words` owns those.
- `app.js`'s era-transition and fog code — `fable-transition` owns that.
- `asset/blender/`, `asset/models/`, `render/` — other agents.
- `asset/music/private/` — CJ's private songs, gitignored.
- **Do not push, do not open a PR.**

## Deliverable

Reply with only: the commit hashes, how many anchors got a marker, the real total KB of the images, the fps triple, and one line on anything you could not do.
