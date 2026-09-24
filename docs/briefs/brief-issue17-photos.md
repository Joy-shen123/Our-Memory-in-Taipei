# Brief: issue #17 part 1 — find the real photographs, licence-checked

"Our Memory in Taipei" is a scroll-driven three.js page, live at https://joy-shen123.github.io/Our-Memory-in-Taipei/. Every building in it was modelled from a real Taipei building. CJ wants a visitor to be able to click a point on the street and see a photograph of the actual place beside the model of it.

You are finding those photographs and establishing that we may use them. You are not building the interaction — another agent does that.

**The licence is the job.** A beautiful photograph we cannot prove we may publish is worth less than a mediocre one we can. This page is public on GitHub Pages under CJ's collaborator's account; an unlicensed image is a takedown waiting to happen and it looks identical to a licensed one until it is too late.

## Goal

CJ can look at one page and see, per anchor, the photograph he would show and the line saying who took it.

## Done when

`research/photos/README.md` exists with a table: anchor, thumbnail, source URL, holding institution, photographer or rights holder, year, licence, and a one-line note on why this frame and not another. Candidate files downloaded into `research/photos/candidates/<anchor>/`, named `<anchor>-<year>-<source>.<ext>`.

Anchors, in the order the camera meets them:

| Anchor | Chapter | What the photo should show |
|---|---|---|
| `chunghwa` 中華商場 | red | The eight blocks along 中華路 before the 1992 demolition, rooftop signs visible |
| `red-house` 西門紅樓 | red | The 1908 Kondo Juro octagon, early if possible |
| `lux` 樂聲戲院 | red | The hand-painted billboard façade, 1980s |
| `wannian` 萬年大樓 | red | The 西寧南路 slab and its wall of vertical shop signs |
| `ximen-zone` 西門町徒步區 | red | The 1999 pedestrian zone, the arch, the pavers |
| `dihua` 迪化街 | dadao | The arcade bays and the 閩南 / 洋樓 / 巴洛克 crests |
| `temple` 霞海城隍廟 | dadao | The street-facing hall, the swallowtail ridge |
| `yongle` 永樂市場 | dadao | The 1982 concrete market, the cloth stalls |
| `wharf` 大稻埕碼頭 | dadao | The wharf, the 5號水門 flood gate |
| `tower101` 台北101 | tower | Under construction, or early after completion |

One to three candidates each. Where you cannot find anything usable, say so plainly and name what you tried — a missing anchor honestly reported is fine; a weak substitute passed off as the real thing is not.

## Licence order of preference

1. **Public domain by age** under Taiwan's copyright term, or a work the holder has released to the public domain.
2. **CC0 or CC-BY from a government or archive open-data programme.**
3. **CC-BY-SA.**
4. Explicit written permission — record exactly who granted it and when.

Anything you cannot place in one of those four does not go in the table as usable. List it separately under "found but cannot use, and why" so nobody re-finds it next month and assumes it was missed.

## Where to look

Start with these, they are the ones most likely to have both the photographs and a clear licence:

- 國家文化記憶庫 (memory.culture.tw) — large, many items carry an explicit CC licence per item. Check the licence on the item page, not the site footer.
- 臺灣記憶 Taiwan Memory, 國家圖書館 (tm.ncl.edu.tw)
- 中央研究院 數位典藏 / 數位文化中心
- 臺北市立文獻館 and the Taipei City open-data portal (data.taipei)
- 國家攝影文化中心 (ncpi.ntmofa.gov.tw)
- Wikimedia Commons — good for 101 construction; verify the licence on each file page.
- 交通部觀光署 and city tourism sites often publish photographs under an open government licence; read the terms page.

**Read the licence on the item page every time.** A site-wide statement does not bind an individual item, and several of these archives mix licences within one collection.

## CJ's words

- 2026-09-24: "build day was ended 3 days ago, i am trying to make this project look better can you set some place with a point i can click and showed the picture or real street, you can find old pictures in official website"
- 2026-09-20: "THE BUILDING NEED TO REFERENCE REAL BUILDING" — the photographs are the proof of that claim.
- 2026-09-20: "CLOSE THE MIST I WANT THE WEBSITE BE BRIGHT AND PRETTY" — prefer daylight photographs where there is a choice; a murky night shot will fight the page.

## What is here

- `HANDOFF.md` — read the "Real-building references" section in full. It names, per building, exactly what was modelled and from what. **Match the photograph to that description** — the 樂聲戲院 entry names 英雄本色 1986 and 倩女幽魂 1987 on the billboards, so a photograph from those years is worth more than a later one.
- `README.md` — CJ's statement of what the page is for.
- `asset/*.md` — the teammate's period notes on Ximending and Dadaocheng by decade.

## Method

1. Read `HANDOFF.md`'s real-building tables first. They tell you which frame matters.
2. Per anchor: find candidates, open each item page, record the licence verbatim, download only what clears.
3. Note the resolution and the aspect ratio. A photo that will sit in a panel beside the model needs to be at least 1200 px on its long edge.
4. Do not process or re-encode yet — the build agent will size them. Keep originals.

## Do not touch

- Anything outside `research/photos/`. No `app.js`, no `style.css`, no `asset/`.
- `data.js`'s `WORDS` and `CLOSING` — `fable-words` owns those on `issue-16-words`.
- `music.js` and the music HUD — `fable-music16` owns those on `issue-16-music`.
- `asset/blender/` — `opus-blender` is dumping the scene on `blender-scene-export`.
- Do not commit, do not push. The lead commits your output.

## Deliverable

- `research/photos/README.md` with the licence table.
- `research/photos/candidates/<anchor>/` with the files.

Reply with only: the path, how many anchors have a usable photograph out of ten, the licences you ended up with, and one line naming any anchor you could not find anything for.
