# Our Memory in Taipei

> **▶ 線上觀看：https://joy-shen123.github.io/Our-Memory-in-Taipei/**
> 用滑鼠滾輪往下捲即可。建議桌機、視窗全螢幕。

一個頁面，一個動作：捲動。

一條街往畫面深處延伸，捲動同時帶著鏡頭走下這條街、並穿過三個年代。
一個穿紅衣的女孩在路中央跑在鏡頭前方，你停下捲動她就慢下來走。
大字隨捲動浮現，最後停在一個攀爬台北 101 的男人，與一句話：

> *Where we go, we don't know. We only know we need to climb higher.*

Claude Code Build Day 2026-09-20 參賽作品。

## 三個章節

| 章節 | 年代 | 場景 | 內容 |
|---|---|---|---|
| **When We Were Young** | 1985–1999 | 西門町 Ximending | 中華商場、樂聲戲院、唱片行、漫畫出租店、電動遊樂場、公共電話亭、紅樓八角樓、市場攤販 |
| **Spring Festival** | 2000–2019 | 大稻埕 Dadaocheng | 迪化街紅磚拱廊、霞海城隍廟、成串燈籠、恭喜發財布條、年貨攤 |
| **The Future** | 2020– | 信義區 Taipei 101 | 玻璃帷幕的台北 101、點亮的辦公大樓、攀爬的男人、收尾字幕 |

## 怎麼看

- **捲動**就是全部的操作。捲到底走完三個年代。
- `?year=2010` 可以直接跳到任一年份，例如
  [`?year=1993`](https://joy-shen123.github.io/Our-Memory-in-Taipei/?year=1993)、
  [`?year=2024`](https://joy-shen123.github.io/Our-Memory-in-Taipei/?year=2024)。
- 章節大致落在捲動進度：西門町 0.08–0.3、大稻埕 0.4–0.55、101 0.75–1.0。

在本機看：在 repo 目錄跑 `python3 -m http.server 8000`，再開 http://localhost:8000/index.html 。（2026-09-23 起場景載入 `asset/models/*.glb`，Chrome 擋 file:// 的 fetch，所以要一個靜態 server；還是沒有 build、不連網路。）

## 技術

沒有框架、沒有 CDN、沒有打包工具。runtime 只抓 repo 裡的 `asset/models/*.glb`。

- **three.js r149**（`three.min.js`，UMD，直接 vendored 進 repo）
- 全部 classic script，靠 `<script>` 執行順序建立全域相依，所以載入順序是有意義的：

  `three.min.js` → `GLTFLoader.js` → `asset/3d/assets-*.js`（`NOSTALGIA_ASSETS`）→ `data.js`（`DATA`）→ `models.js`（glb 載入）→ `app.js`（引擎）→ `scene-red.js` / `scene-dadao.js` / `scene-tower.js`（各章節細節）

| 檔案 | 負責 |
|---|---|
| `data.js` | **所有內容都在這** —— 配色、年代定義、鏡頭關鍵影格、浮現的字句、收尾句。改文案改這裡。 |
| `app.js` | 渲染器、Catmull-Rom 曲線上的鏡頭、捲動進度 → 年份／年代、每個物件依年代補間高度的 `part()`／`instSet()` 系統、女孩、攀爬的男人、後處理（顆粒與暗角） |
| `scene-*.js` | 各章節細節，只透過 `window.SCENE` API 建物件 |
| `asset/` | 場景考據文字（`*.md`）、3D 資產庫（`asset/3d/`，`preview.html` 可單獨預覽）、Blender 建模腳本（`asset/blender/*.py`）與它們輸出的模型（`asset/models/*.glb`） |
| `models.js` | 載入 glb、換成頁面的 Lambert 材質、把街道元件經 `instSet` 做 instancing |
| `HANDOFF.md` | 完整交接文件：設計決策、測試方式、待辦 |

除錯用：`window.__fog` 會露出 `progress`、`year`、`era`、`camZ`、`BOUNDS`、`jumpToYear(y)`。

## 刻意不做的事

不做聲音、不做自由鏡頭、不做選單、不存狀態。不做 bloom、不做迷霧、不做車流 —— 路上只有女孩會動。

## 部署

GitHub Pages，`main` 分支 root 直接部署。沒有 build 步驟，整包原樣上傳；`.nojekyll` 讓 Jekyll 不要碰 `asset/` 底下的 `*.md`。
