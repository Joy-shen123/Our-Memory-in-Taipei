# Issue #20 — replace the three photographs that carry a colour-swatch card

https://github.com/Joy-shen123/Our-Memory-in-Taipei/issues/20

## What CJ said

2026-09-24, with a screenshot of the Red House panel open: 「有的照片會出現這個色卡」

Three of the eight hotspot photographs have a surveyor's colour-measurement card composited into
the middle of the frame. On the Red House it sits across the façade. It cannot be cropped out.

## Where you are

Branch `issue-20-photos`, your own worktree. Serve on port 8160. Never push.

## The three

All three came from 國家文化記憶庫 colour surveys. Their current entries are in `photos.js`, in `SPOTS`:

| id | building | current licence | the problem |
|---|---|---|---|
| `redhouse` | 西門紅樓 | CC0, 吳宇凡 / 國立臺北科技大學文化事業發展學系 | swatch card across the octagon |
| `dihua` | 迪化街 | CC0, 吳宇凡 / 國立臺灣歷史博物館 | swatch card on the shophouse front |
| `temple` | 霞海城隍廟 | CC0, 吳宇凡 / 國立臺灣歷史博物館 | swatch card on the hall |

Read `photos.js` for each one's full record before you touch anything.

## What a replacement has to be

1. **Licence verified at the item page, not guessed from a search result.** CC0, public domain,
   CC BY or CC BY-SA. CC BY-**NC** is out of range — the page is public. If a page does not state
   a licence, it is not a candidate.
2. **Warm and alive, not archival-cold.** CJ, 2026-09-24: 「剩下照片有點太老有點crippy要拿溫馨熱鬧的
   照片」 — the ones he has feel too old and a bit creepy; he wants warm and busy. People in frame,
   daylight, colour.
3. **No overlay of any kind** — no swatch card, no watermark, no museum catalogue number burned in.
4. **1200 px on the long edge or better**, converted to webp, in `asset/photos/hotspots/`,
   **the same filenames** so nothing else in the page changes.

## Also worth one more search

Two anchors still have no photograph at all, and `fable-hotspots` could not find one for either:

- `lux` 樂聲戲院 — the 1964 opening footage found is CC BY-**NC**, out of range
- `ximen-zone` the 1999 pedestrian zone — nothing with a verifiable licence

Try once more. **An honest "still nothing" is a correct answer.** Do not substitute a photograph
of somewhere else, and do not ship an image whose licence you could not read on the item page.

## Sources that have worked before

國家文化記憶庫 (tcmb.culture.tw), Wikimedia Commons, 臺北市立文獻館, 國家圖書館 臺灣記憶,
中央研究院數位典藏. Round 1 and round 2 of this search are written up in the worktree the previous
agent used; if you can reach `research/photos/README.md` or `README-round2.md` anywhere, read them
first so you do not repeat searches that already failed.

## Bars

- Every replacement's photographer, holder, licence and item URL updated in `photos.js` and visible
  in the on-page credits panel. Share-alike is acceptable — CJ accepted that obligation 2026-09-24.
- Total weight of `asset/photos/hotspots/` must not grow by more than 200 KB.
- Screenshots of all three panels open, at 1440×900 and 390×844, console empty.
- 100 fps at the display cap at 0.2 / 0.44 / 0.78.

## Reply with only

One line per photograph: what you replaced it with, the licence, and the item URL. Then one line
each on `lux` and `ximen-zone`. Then the screenshot folder and the fps.
