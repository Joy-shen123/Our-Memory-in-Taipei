# 西門町懷舊 3D 素材庫（three.js）

從 `asset/ximen-1980s.md`、`ximen-1990s.md`、`ximen-2000s.md` 的街道元素清單中，
挑選「一眼辨識年代」的代表性元素，以**程序化 low-poly** 方式產生的 three.js 3D 素材。
不需要任何模型檔或圖片——全部由程式碼與 Canvas 文字貼圖產生，直接用 script 標籤載入。

## 檔案與載入順序

```html
<script src="three.min.js"></script>          <!-- 全域 THREE（r100+ 皆可） -->
<script src="assets-core.js"></script>        <!-- 共用核心庫，建立 NostalgiaCore 與 registry -->
<script src="assets-ximen-1980s.js"></script>
<script src="assets-ximen-1990s.js"></script>
<script src="assets-ximen-2000s.js"></script>
```

純全域 script 架構（無 ES module），與隊友專案（three.min.js → data.js → app.js）相同風格。

## 使用方式

```js
// registry：三個年代各是一個素材陣列
var list = NOSTALGIA_ASSETS['ximen-1980s'];   // 也有 'ximen-1990s'、'ximen-2000s'

// 每個素材：{ id, name, category, build }
// build(NostalgiaCore) 回傳 THREE.Group，可直接 scene.add
var asset = list[0];
var obj = asset.build(NostalgiaCore);
obj.position.set(5, 0, -3);
scene.add(obj);
```

- **尺度**：公尺制，人高約 1.7；物件原點在底部中心（y=0 是地面），正面朝 +Z。
- **userData**：每個 Group 帶 `{ id, name, era }`，方便點擊偵測（raycast）後查資訊。
- **決定性**：素材外觀完全可重現（不用 Math.random），同一素材每次 build 長一樣。
- **category**：building / storefront / sign / poster / vehicle / prop / arcade / stage。

### 接進隊友專案（Memory in Us）的範例

在 `index.html` 的 `data.js` 之前插入上面四個 script 標籤，然後在 `app.js`
組場景的地方沿街排列：

```js
// 依年代把素材沿 X 軸排成一條街
function buildEraStreet(scene, eraKey, startX) {
  var x = startX || 0;
  (NOSTALGIA_ASSETS[eraKey] || []).forEach(function (a) {
    var obj = a.build(NostalgiaCore);
    var w = new THREE.Box3().setFromObject(obj).getSize(new THREE.Vector3()).x;
    obj.position.x = x + w / 2;
    scene.add(obj);
    x += w + 2.5; // 間距 2.5m
  });
  return x;
}
buildEraStreet(scene, 'ximen-1980s', -30);
```

## 預覽

直接**雙擊 `preview.html`** 即可（Canvas 文字貼圖不受 file:// 限制；
three.js 從 CDN 載入，需要網路）。功能：年代切換、素材下拉選單、
←/→ 鍵切換、單件自轉檢視／整排陳列兩種模式、拖曳旋轉、滾輪縮放。

若偏好本機伺服器（有裝 Python 時）：

```powershell
python -m http.server 8000   # 然後開 http://localhost:8000/preview.html
```

## 版權說明

動漫角色與藝人（小叮噹、皮卡丘、灌籃高手、張君雅、周杰倫、F4 等）
一律以「文字海報／看板／商品貨架」形式呈現——只用名稱文字與抽象配色暗示，
**未建模任何受版權保護的角色造型或人物肖像**。

## 素材清單

以 `NOSTALGIA_ASSETS` registry 內容為準（在瀏覽器 console 輸入
`NOSTALGIA_ASSETS` 即可查看三個年代的完整 id/name/category）。
各年代涵蓋的代表元素：

- **ximen-1980s**：中華商場門面（霓虹招牌）、電影街手繪看板牆、唱片行（卡帶＋黑膠）、租書店（小叮噹書背）、紅色公共電話亭、野狼 125
- **ximen-1990s**：淘兒音樂城黃色門面、投幣式電玩機台、漫畫出租店（灌籃高手書背）、皮卡丘配色扭蛋機、BB Call／大哥大廣告立牌、拍貼機
- **ximen-2000s**：西門紅樓八角樓、簽唱會舞台（周杰倫／S.H.E 背板）、網咖門面、張君雅零食貨架、Nokia／Sony Ericsson 手機行櫥窗、F4 海報牆
