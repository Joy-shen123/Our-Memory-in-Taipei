# Ximending signage — built as what it is (2026-09-24)

CJ, 2026-09-24: 「上面那些招牌還是很粗糙啊 路牌招牌 紅布條不像紅布條 字牌都應該是要現實的招牌有些店招牌還有房子上的字牌都不合理」. Brief: `docs/briefs/BRIEF-realism-ximen.md`, section "Next — the signage itself". The rule: if it would cast its own shadow in real life, it is not a plane.

## What changed in the build

`sign()` / `Core.textPlane` is gone from `scene-red.js`. A new `SIGNS` builder takes its place:

- It paints every face into one runtime canvas atlas (2048×4096; nothing extra to download).
- It merges all faces into two meshes: the lit light-box faces, and the cloth, paper and plates.
- It merges all hardware (cases, rims, arms, struts, poles, ropes, knots, studs) into one vertex-coloured mesh, plus one mesh for the neon tubes.

| Kind | Now |
|---|---|
| 直式招牌 vertical light box | A 14 cm case with a rim proud of both faces, two arms and a strut to the wall, a wall plate, and a neon tube down the outer edge. It reads from both directions. On the east side the arms are 1 m long so the box clears the 0.9 m balconies. |
| 店招牌 horizontal light box | The same case, flat on the facade, standing off on two brackets. There is one per 中華商場 ground-floor shop along the arcade fascia (the photos' signboard band), named from the painted unit behind it (`asset/textures/chunghwa-shops.json`), and one over each painted east-side shop. |
| 紅布條 cloth banner | A 24 × 2 strip. Both edges sag, the free bottom edge more; it is wrinkled and bellies slightly. It has a stitched hem, painted eyelets, and rope from each corner to the poles, with knots. Parapet banners are tied along a single block, never across a cross street. |
| 字牌 mounted letters | Cut-out glyphs, alpha-tested so their shadows are glyph-shaped, in four stacked layers for depth, on studs 5 cm off the wall. Used for 國賓大戲院. |
| 路牌 street-name plate | White on blue in a metal frame, on a 3 m pole: cross-street plate at 2.9 m, road plate at 2.6 m. One stands at each of the seven market cross streets, named north to south: 洛陽街, 開封街, 漢口街, 武昌街, 成都路, 長沙街, 貴陽街. The 中華路一段 plate is on alternate poles. |
| Traffic and bus signs | 禁止停車: a real disc (blue, red ring, one slash) on a pole, with a grey back. 公車站: a board with route numbers on a pole. |
| Paper | Posters and price cards stay flat, as paper does. Posters are pasted beside the shops that sell what they advertise, and on the market piers. Price cards sit on stakes. |

## What was removed or changed because it did not make sense

- **Brand boards on the 中華商場 parapets** (三洋電視, 聲寶, 歌林, 味全, 統一, 大同電鍋, 國際牌 National …): nothing shows brand boards on the parapets. They are replaced by the upstairs tenants' own vertical boxes on the corridor columns, as in the 1975–1989 photos. Homes (住家) get no sign.
- **Twenty east-side hanging trades** placed every 4.4 m regardless of the shop behind them. Each sign now names the shop it hangs on: 唱片行 over the record shop, 租書店 over the rental shop, 西藥房, 冰果室, 錄影帶 and so on.
- **冰宮 as a shop sign.** The rink was on 萬年大樓's roof, so it is removed.
- **Stars and cartoons as big boards on house walls** (鄧麗君 新歌上市, 鳳飛飛, 小叮噹, 科學小飛俠 …, up to 5 m high on any building). They become paper posters at eye level next to the record, rental and comic shops, with the years checked.
- **Products hung as shop signs in the 1990s stretch** (電子雞, 皮卡丘, Game Boy, PlayStation, 拍貼 before 1995), some floating over the Red House plaza with no wall behind them. They are replaced by trades (佳佳唱片, KTV, 通訊行 大哥大, 電玩 SEGA, 牛肉麵, 漫畫王 …), and only where a facade stands.
- **The 2000s boards in a chapter that ends in 1999** (周杰倫, S.H.E 5566, F4, 天堂 RO 楓之谷, Nokia Sony Ericsson, MP3 MSN) are removed. 阿宗麵線 (since 1975) stays as a light box.
- **Road-spanning banners: reverted.** The first pass swapped 電影街 本週上映 楚留香 and 小虎隊 新專輯 全面上市 for 慶祝中華民國七十七年國慶 and 交通安全 人人有責. CJ, 2026-09-24: 「這個拿掉很尷尬」, clarified as 「不是我是不要中華名國國慶的字樣不是不要布條」: the objection is to the 國慶 wording, not the banner. The cloth banners stay exactly as built; only their text changed. Both originals are back: 楚留香 aired in Taiwan 1982–83 and 小虎隊 formed in 1988, both inside the chapter. The rule for the rest of the pass: remove a sign only if it could not have existed, never because something more official could have hung there.
- **Pole signs:** 西門町, 電影街 and 漢中街 were street signs for no street there. They are replaced by the real cross streets at the market's gaps.
- **A second 樂聲戲院:** the library's cinema wall at z 38 carries its own 樂聲戲院 neon, while the real 樂聲 is at z −66. The neon is hidden in the scene (the library file is untouched), and the wall is named 國賓大戲院 (成都路, 1957).
- **中華商場 fascia:** one canvas board per block becomes one light box per shop.

## Still left (zone 3 and zone 4 assets, not signs)

The library storefronts placed in the 1994–1999 stretch are 2000s items: the F4 poster wall (2001), the 張君雅 shelf, the internet café, the Sony Ericsson phone shop, and the photo-sticker booth before 1995. They need swapping in the zone 3 and 4 passes. The 24H 網咖 at z +2 is zone 1's first item.

## Unverified

- The colour of Taipei street-name plates in 1990. White on blue is used; a search found only the door-plate history (early plates were aluminium, white on blue: https://ca.gov.taipei/Content_List.aspx?n=66663EA5122B215F).
- The bus route numbers.

## Numbers

- Draw calls per frame (all passes, 1440×900) at scroll 0.06 / 0.12 / 0.2 / 0.30: 1889 / 1734 / 1448 / 1222 before, 1658 / 1568 / 1365 / 1207 after. Sign objects went from 144 to 168.
- fps, headed: 100.3 / 100.3 / 100.3 at 0.08 / 0.2 / 0.30, twice. The console is empty and the three scene files re-run clean.
- Downloads added: `chunghwa-shops.json`, 2 KB. The atlas is painted at load time.
- Before/after pictures: `~/Desktop/realism-ximen/signs-*.png` and `signs-before-after.png`.

## Anchoring (2026-09-24)

CJ: 「有些招牌懸空了」 (`floating-signs.png`, same folder). The market's upstairs light boxes on the end columns (0.3 m from a block's corner) stood out over the cross street, in front of the next block's end wall, with their arms on a 0.5 m column hidden behind them. Nothing tested for a wall at all.

- `WALLS` in `scene-red.js`: every street face, `{ side, z0, z1, top }`, filled by `front()` (the library fronts' own width and height) and `body()` (the length, to the roof parapet).
- `SIGNS.anchor()`: every wall-mounted vertical box, horizontal box, letter set and poster passes through it.
  - It keeps the sign where it is if a face stands behind the whole of it and reaches above its top arm.
  - Otherwise it moves the sign to the nearest face within 4 m, lowering or shortening it to fit.
  - Otherwise it drops the sign.
  - The result is in `window.__signAnchor`.
- The market: the upstairs boxes go on the three interior columns only (two at most per column and floor), with a column-wide plate for the arms. The fascia boxes run along the fascia beam, which is the whole block long.
- The result: 168 signs, the same as before, with none dropped.
  - 唱片行 and 漫畫出租 are lowered to 2.5 m to fit under their 4 m walls.
  - 怪博士與機器娃娃 and 神奇寶貝 posters slide onto a wall.
  - Six painted-shop boxes are nudged about 0.1 m off wall ends.
- fps, headed, 1440×900, at 0.14 / 0.20 / 0.30: run 1 gave 96.8 / 91.9 / 100.2 (the first arrival at each position), run 2 gave 100.3 / 100.3 / 100.3, and a fresh page with a 240-frame settle gave 100.3 / 100.3 / 100.3.
