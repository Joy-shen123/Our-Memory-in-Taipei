# Zone 2 — 中華商場 (Chunghwa Market), realism pass

## Pass 2 (2026-09-24): painted, the Arcane method

CJ saw pass 1: 「我是要細節都參照真實當地建築 沒有覺得變細節」. Then: 「這個youtbue講怎麼shade像是arcade 試試看」 (https://www.youtube.com/watch?v=zKkM3UrOAvc). The detail now lives in painted textures on simple meshes, with the light baked into the paint; the silhouette stays geometry.

- **Geometry (the silhouette):** the arcade recess, the corridor gap behind the parapets, the shopfront setback, the bridges, the roof tanks, the awnings. `chunghwa.glb` went from 8,816 to 4,048 triangles: the door cutters, tubes, stripes and lattice holes are paint now. Box-mapped UVs, 4 m per UV unit (`stylized.run(..., uvs=4.0)`).
- **Paint (`asset/paint/chunghwa_paint.py`, deterministic):**
  - 75 painted 中華商場 units: 5 blocks × 15. Each has its own frontage, a sign board with its trade, and its goods painted: shoes on shelves, clocks, stamp albums, suits on a rail, radios, beef-noodle counters with steam, seal carvers, cloth bolts, TVs under repair, and homes with iron grilles and laundry upstairs. 點心世界 is on block 5.
  - End walls: 中華商場 painted vertically, the number, and the lattice panel.
  - Concrete: formwork lifts, stains, rain streaks.
  - Awning canvas stripes.
- **The east side of zone 2** (the buildings facing the market, previously flat boxes): three new shophouses fill the gaps at z −15, −29 and −47. Every storey in the zone is painted (`ximen-fronts.webp`): ground floors with two 3 m shops each (西藥房, 麵包店, 冰果室, 錄影帶, 理髮廳, 銀樓, 書局 …), and upper storeys with mosaic tile, 鐵窗 grille cages, window air conditioners, vertical signs and drip stains. The shopfront.glb modules stay behind the paint for the balcony slabs, AC boxes and tanks.
- **Shaders:** the shop fronts are unlit (MeshBasic): they stand in the arcade's shade, which is painted in. The end walls and east facades are Lambert with a normal map; the concrete is Lambert, with the painted map and a normal map.
- **Texture budget:** 619 KB in total, every file under 400 KB: `chunghwa-shops.webp` 274, `chunghwa-ends.webp` 118, `chunghwa-ends-n.webp` 46, `chunghwa-concrete.webp` 17, `chunghwa-concrete-n.webp` 3, `chunghwa-awning.webp` 4, `ximen-fronts.webp` 96, `ximen-fronts-n.webp` 61.
- **fps (headed, 1440×900):** 100.4 / 100.4 / 100.3 at 0.08 / 0.2 / 0.30; second run 100.4 / 100.3 / 100.3. The console is empty, and the three scene files re-run clean.
- **Proof frames:** `~/Desktop/realism-ximen/zone2-after.png` (scroll 0.06 / 0.12 / 0.15), `zone2-crop-east-shops.png` (the 0.15 frame cropped: 冰果室, the tape shelves, 西藥房, 銀樓), `zone2-closeup-market-arcade.png` (a debug camera in the road looking into the arcade; the scroll path passes the market nearly edge-on, so its shops only show at the frame's left edge).
- Two bugs found on the way: the painted planes z-fought the wall behind them (fixed with a 5 cm offset and a polygon offset), and the shop interiors were never filled because of a box-format slip in the painter.

## Pass 1

Brief: `docs/briefs/BRIEF-realism-ximen.md`. Researched and built 2026-09-24. Screenshots: `~/Desktop/realism-ximen/zone2-before.png`, `zone2-after.png`, `zone2-side-by-side.png` (scroll 0.06 / 0.12 / 0.15, i.e. 1988 / 1990 / 1991, 1440×900).

Note on the range: the brief puts zone 2 at z 0 → −50, but the eight blocks stand at z +46 → −46 (one glb, instanced eight times). The rebuild covers all eight blocks; the other items in z +60 → 0 are left for zone 1.

## What the real thing looked like (sourced)

- **The blocks.** Eight joined three-storey reinforced-concrete blocks, 1,171 m in total, named 忠孝仁愛信義和平 and numbered 1–8 from north to south. Cross streets between them, north to south: 洛陽街, 開封街, 漢口街, 武昌街, 成都路, 長沙街, 貴陽街. Built 1961, demolished 20–30 October 1992. Sources: https://zh.wikipedia.org/zh-tw/%E4%B8%AD%E8%8F%AF%E5%95%86%E5%A0%B4, https://www.archives.gov.tw/tw/arctw/69-1916.html
- **Ground floor.** A 3.5 m arcade (騎樓) on both sides, with shops of 2 m × 4.5 m opening into it. There was a deep soffit with fluorescent tubes, and a continuous signboard band on the fascia. The best-known board is 點心世界, red characters on yellow. Sources: zh.wikipedia above; 1961 信棟 photo https://commons.wikimedia.org/wiki/File:%E4%B8%AD%E8%8F%AF%E5%95%86%E5%A0%B4%E3%80%8C%E4%BF%A1%E3%80%8D%E6%A3%9F%E4%B8%80%E6%A8%93%E7%9A%84%E6%99%AF%E8%A7%80.jpg; 1989 colour photo in https://jasonblog.tw/2013/07/history-of-chung-hua-market-bazaar-from-1961-to-1992.html
- **Floors 2 and 3.** Open corridors 3 m deep, on the east (中華路) side only, behind **solid concrete parapet walls**. Square columns rise through every floor, and each floor slab reads as a strong horizontal band. There are no window bands and no balconies. By 1990 canvas awnings hung over the 2nd-floor bays. Sources: zh.wikipedia (「單面（東向）走道」); 1989 and 1990 photos on jasonblog above.
- **End walls.** 中華商場 is painted in large characters (vertical by 1988), with the block's big painted number under or beside it and a tall panel of concrete lattice (breeze block) next to it. Nothing shows 忠棟 / 孝棟 name plates; the 孝 sign on today's 開封街 bridge is a 2003 memorial. Sources: 1988 photo https://uc.udn.com.tw/photo/2020/02/22/99/7501486.png; https://miniculturaltrips.gov.taipei/News_Content.aspx?n=0DA7E7A7A1EA5C19&sms=337199328131CB54&s=BCC2106A1ADBAAD5
- **Bridges.** 1969–1974: 2nd-floor bridges joined neighbouring blocks across the cross streets (武昌街, 漢口街, 開封街 …). Later ones crossed the railway and 中華路 too. They were open decks with solid parapet panels and steel bar railings, painted pale green. Sources: zh.wikipedia; https://news.housefun.com.tw/jasonz/article/621239290868; 1989 photo on jasonblog.
- **Rooftop neon.** The National / 國際牌 tower (1964) stood on the south end of 信棟 (block 5): a box on a steel truss, taller than the building. There were more than ten neon towers along the row, and the verified brands are 國際牌, 黑松汽水, 大同, 精工 Seiko, 森永 and 旭光日光燈. **From 1 May 1985 the rooftop neon was dismantled** because of roof overload and leaks, and a 1990 aerial photo shows bare roofs. No source shows SONY / 新力, 三洋, 聲寶, 歌林 or 味全 on the roof. Sources: https://city.gvm.com.tw/article/70911, https://city.gvm.com.tw/article/70913, https://www.edh.tw/article/10062, https://opinion.udn.com/opinion/story/12369/5271060, 1983 night photo https://commons.wikimedia.org/wiki/File:%E8%87%BA%E5%8C%97%E5%B8%82%E4%B8%AD%E8%8F%AF%E5%95%86%E5%A0%B4%E5%A4%9C%E6%99%AF.jpg
- **Colour.** Grey-beige concrete. The corridor side was a dusty salmon/beige by 1989. The bridges were mint green. The palette stays CJ's: `walk` / `bone` for the concrete, `leaf` for the bridge steel.
- **The railway** ran at grade along the market's west side until 1989, then in a trench. The scene's street stands for 中華路 and shows the corridor face; the railway is not modelled.
- Unverified: the block height (photos suggest 11–12 m; 3 × 3.3 m is used), individual block lengths, and the total number of bridges.

## What the scene got wrong (before)

1. **Two storeys with a balcony-window floor**, reading as a row of small detached houses. The real block was three storeys with parapet corridors and no balconies.
2. **忠棟 … name plates** on each block. They were never on the buildings. The real end wall had 中華商場, a big number and a lattice panel.
3. **A 1.6 m gap and nothing across it.** The real blocks were joined by 2nd-floor bridges over the cross streets.
4. **Rooftop brands:** SONY, 三洋, 聲寶, 歌林 and 味全 are unverified as roof signs, and the National tower (the one real landmark) was missing.
5. **No fascia signboard band, no arcade soffit, no awnings.**
6. **Anachronisms in 1990–1991 frames across the road:** a Nokia / Sony Ericsson phone shop (Sony Ericsson was founded in 2001) at z −8, a Pikachu-coloured gashapon (1996 and later) at z −16, and a photo-sticker booth (1995 and later) at z −30.

## Ranked changes (frame improvement per hour)

| # | Change | Status |
|---|---|---|
| 1 | Rebuild the block: 3 storeys, arcade piers, parapet corridors, slab bands, awnings | done |
| 2 | Remove the three anachronisms (Sony Ericsson shop, Pikachu gashapon, sticker booth) | done |
| 3 | End walls: 中華商場 painted vertically, the block number, the lattice panel; drop 忠棟 plates | done |
| 4 | 2nd-floor bridges over the cross streets, pale green | done |
| 5 | Rooftop: the National tower on 信棟, sourced brands only; SONY and the other unverified brands off | done (behind `ROOF_NEON`) |
| 6 | Fascia signboard band per block (點心世界 yellow on block 5) | done |
| 7 | Laundry and potted plants on the parapets; scooters parked in the arcade | not done |
| 8 | A bridge across the road itself | not done: it would cross the camera path |

## Decision for CJ

- **Roof neon.** Strictly, the roofs were bare from 1985, and the chapter runs 1985–1999. `ROOF_NEON = false` in `scene-red.js` removes the neon (history); `true` keeps it (memory). Currently `true`.
- **Storeys.** The real block is three storeys. CJ, 2026-09-21: 「盡量矮點」. `FLOORS = 2` in `chunghwa.py` plus `TOP = FLOOR * 2` in the scene brings the lower street back.

## Numbers

- `chunghwa.glb`: 8,816 triangles, 219 KB (was 73 KB), under the 400 KB bar. It is now instanced (one draw call per material for all eight blocks) instead of eight full clones.
- fps, headed, 1440×900: 100.3 / 100.3 / 100.3 at 0.08 / 0.2 / 0.30, and 100.3 / 100.3 / 100.4 on the second run.
- The console is empty, and the three scene files re-run clean in try/catch. 390×844 renders correctly.
