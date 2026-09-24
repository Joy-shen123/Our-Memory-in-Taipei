# Closing the empty views (2026-09-24)

CJ, 2026-09-24: 「紅樓旁邊是空的」 (`empty-beside-red-house.png`, this folder). Beside the Red House, the camera looked out over the engine's green ground plane (`app.js`, a 400 × 900 `leaf` plane), with a stall, a few boxes and pale distant blocks.

## What the walk found (scroll 0.02 … 0.34, 1440×900)

- **0.06–0.08, east:** a 7.5 m hole in the street wall behind the phone booth and scooters, with a lawn in it.
- **0.14–0.18, east:** blank shopfront.glb side walls above the lower buildings.
- **0.20–0.26, beside and behind the Red House:** the open field CJ saw, with the horizon empty past the octagon's cross wing. The side wall facing the plaza was blank.
- **0.26, west past 樂聲:** open ground.
- **0.28–0.32, the pedestrian zone:** blank side walls, and holes at z −108 … −112 and −122 … −130.
- **Everywhere:** the camera sees over two-storey roofs, and the green plane showed behind them.
- **Not this chapter:** 0.34 is the year 2000, the Dadaocheng era. Its green patch and pale flank belong to `scene-dadao.js`.

## What closes it (`scene-red.js`, "the city behind the street")

1. **Street-wall holes of 4 m or more get shophouses.**
   - East: z 43 … 58 and 6 … 13.5; −81 … −92, the plaza's south edge; −108 … −112 and −122 … −130.
   - West: −46 … −58.5, −73.5 … −78, −86 … −91, −111 … −116 and −132 … −136.
   - Gaps under 3 m stay as 巷 alleys, closed by the rows behind.
2. **Blocks behind the street:**
   - Rows two deep on each side: three to five storeys, then four to seven on the far row.
   - Around the Red House's cross wing: a row south of the plaza facing the camera (the view CJ saw), a row north of the wing, and a row closing the east.
   - Built the Arcane way: simple boxes, every face painted from `ximen-fronts.webp` (shops at street level, grille cages above), so no wall is blank. Rooftop water tanks and 頂樓加蓋 tin rooms.
   - One merged mesh for the faces and one for the boxes: 3,464 painted faces, 384 boxes.
   - Its own seeded random stream, so the engine's `rnd()`, and with it every later placement in the other chapters, is untouched.
3. **Street buildings' side walls are painted too.** A flank facing the plaza, an alley or the market's end was a blank module side.
4. **The railway behind 中華商場:** ballast, rails and sleepers at grade, as until 1989. It is seen down the market's cross streets.
5. **Paving over the green plane** for the chapter, outside the street.
6. **Street furniture stands on the pavement.** The phone booths, scooters, arcade cabinet and BB Call standee now stand with their backs to the wall, not inside it, and are no longer walls a sign can be fixed to.

## Numbers

- fps, headed, 1440×900, at 0.14 / 0.20 / 0.30: 100.3 / 100.3 / 100.3, then 100.4 / 100.4 / 100.3.
- Draw calls per frame at 0.14 / 0.20 / 0.30: 1534 / 1375 / 1216.
- The console is empty, and the three scene files re-run clean.
- Signs: 168, all anchored, none dropped.
- Pictures: `~/Desktop/realism-ximen/gaps-*.png`.
