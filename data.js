// 時代迷霧 · 大稻埕 — ALL content lives in this file. Nothing is fetched at runtime.
//
// NOTE ON MODULES: the brief's data contract is written with `export const`, but the brief
// also demands the page open from file:// . Chrome blocks ES-module imports on file:// (CORS),
// so this is a classic script and everything hangs off window.DATA. Same shape, no `export`.

(function () {

  // ── THE FIVE COLOURS ──────────────────────────────────────────────────────────
  // The only hex codes in the product. Installed as CSS custom properties at load;
  // style.css and app.js refer to them by name only.
  const PALETTE = {
    ink:  '#0A0C10',   // 墨  print: ink, outlines, blocks.       photo: unlit ground and sky
    haze: '#2A3442',   // 霧  print: second ink, mid-tones.       photo: fog and distance
    lamp: '#E8A54B',   // 燈  print: flat warm block, no glow.    photo: real light, with bloom
    bone: '#E8E3D8',   // 骨  print: the paper.                   photo: text, pale facades, moon
    verm: '#C8422E',   // 朱  the one accent. sparingly.
  };

  // ── WORLD GRID ────────────────────────────────────────────────────────────────
  // The street runs along -Z, away from the camera. x<0 is the river (west) side.
  // A tile's grid:[col,row] maps to world x = col*laneX, z = -row*lot.
  // col -1 = west lots, col +1 = east lots. row 0 is where the street begins.
  const GRID = { lot: 10, laneX: 10, roadWidth: 12 };

  // ── THE FOUR ERAS ─────────────────────────────────────────────────────────────
  // zRange is [from, to] along the street. The era's road marking is painted at `from`, and the
  // world flips the moment the camera passes over it; the year runs linearly between markings. palette = which of the five colours carry each role in this era.
  const ERAS = [
    { key: 'flee',   start: 1853, end: 1860, years: '1853–1859', label: '逃來的人', en: 'The people who fled',
      zRange: [60, -100],   uPrint: 1.0,  traffic: 2,
      palette: { ground: 'ink', roof: 'haze', accent: 'verm' } },
    { key: 'tea',    start: 1860, end: 1895, years: '1860–1894', label: '茶港',     en: 'Tea port',
      zRange: [-100, -200], uPrint: 0.7,  traffic: 8,
      palette: { ground: 'ink', roof: 'haze', accent: 'lamp' } },
    { key: 'modern', start: 1895, end: 1946, years: '1895–1945', label: '摩登大稻埕', en: 'Modern Dadaocheng',
      zRange: [-200, -300], uPrint: 0.35, traffic: 15,
      palette: { ground: 'haze', roof: 'bone', accent: 'lamp' } },
    { key: 'now',    start: 1946, end: 2026, years: '1946–',     label: '現在',     en: 'Now',
      zRange: [-300, -460], uPrint: 0.0,  traffic: 28,
      palette: { ground: 'haze', roof: 'bone', accent: 'verm' } },
  ];

  // ── THE FOUR ANCHOR TILES ─────────────────────────────────────────────────────
  // Fixed positions in the world. Only the era they are drawn in changes.
  // size:[width across x, depth along z]. h = plain-box height used until STEP 3 gives
  // them silhouettes. col = which of the five colours the box is. built:false = empty ground.
  const ANCHORS = [
    { id: 'chenghuang', grid: [1, 36], size: [10, 10], hero: true,
      name: { zh: '霞海城隍廟', en: 'Xiahai City God Temple' },
      byEra: {
        flee:   { built: false,
                  caption: '1853年同安人在艋舺的械鬥中落敗，抱著城隍神像逃到這片曬稻穀的空地。',
                  detail: '大稻埕三個字的意思，就是「很大的曬穀場」。這裡當時什麼都沒有。' },
        tea:    { built: true, h: 6, col: 'verm',
                  caption: '逃來的人把從艋舺抱出來的城隍安座在這裡，廟比這條街上的茶行都老。',
                  detail: '廟前的空地很快就被茶行和洋行包圍。' },
        modern: { built: true, h: 6, col: 'verm',
                  caption: '1930年郭雪湖畫《南街殷賑》，畫的就是城隍聖誕時擠滿迪化街的人潮。',
                  detail: '' },
        now:    { built: true, h: 6, col: 'verm', queue: true,
                  caption: '被帶著逃難的戰神，現在是台北最有名的月下老人，門口排隊的多半是二十幾歲的人。',
                  detail: '他們求的不是平安，是對象。' },
      } },
    { id: 'dihua', grid: [1, 18], size: [10, 50], hero: true,
      name: { zh: '迪化街', en: 'Dihua Street' },
      byEra: {
        flee:   { built: true, h: 3.5, col: 'bone',
                  caption: '這條街是大稻埕唯一每個時代都在的東西，一開始只是曬穀場旁邊的一排店鋪。',
                  detail: '' },
        tea:    { built: true, h: 5, col: 'haze',
                  caption: '1860年淡水開港，這排店鋪變成茶葉倉庫，烏龍茶從這裡走到紐約。',
                  detail: '1869年，第一批福爾摩沙烏龍直航紐約。' },
        modern: { built: true, h: 8, col: 'bone',
                  caption: '1920年代店主們把門面改成巴洛克式，一條曬穀場旁邊的街，成了全台北最時髦的地方。',
                  detail: '' },
        now:    { built: true, h: 8, col: 'bone',
                  caption: '1960年代以後錢和生意搬到東區，這條街靠著繼續當一條街活了下來。',
                  detail: '現在賣南北貨，過年前變成年貨大街。' },
      } },
    { id: 'wharf', grid: [-1, 15], size: [14, 40], hero: true,
      name: { zh: '大稻埕碼頭', en: 'Dadaocheng Wharf' },
      byEra: {
        flee:   { built: true, h: 0.4, col: 'haze',
                  caption: '1853年這裡只是淡水河邊的一段泥岸。',
                  detail: '' },
        tea:    { built: true, h: 3, col: 'haze',
                  caption: '1860年代英國商人陶德（John Dodd）把茶葉出口做起來，他的買辦李春生有錢到被叫做茶葉大王。',
                  detail: '錢就是從這個碼頭上岸的。' },
        modern: { built: true, h: 1, col: 'haze',
                  caption: '到了1930年代這裡安靜下來，熱鬧搬到了街上的戲院和咖啡館。',
                  detail: '' },
        now:    { built: true, h: 1.2, col: 'haze',
                  caption: '碼頭現在是河濱公園，週末有人在這裡看夕陽。',
                  detail: '' },
      } },
    { id: 'taiping', grid: [1, 28], size: [10, 40], hero: true,
      name: { zh: '太平町', en: 'Taiping-chō (today Yanping N. Rd.)' },
      byEra: {
        flee:   { built: false,
                  caption: '1853年這裡還是曬穀場的邊緣。',
                  detail: '' },
        tea:    { built: true, h: 4, col: 'haze',
                  caption: '茶港時期這一帶只有幾間製茶工廠。',
                  detail: '' },
        modern: { built: true, h: 9, col: 'bone',
                  caption: '蔣渭水在太平町的大安醫院看診，台灣文化協會和台灣民眾黨都是從這個街區組織起來的。',
                  detail: '同一條街上有永樂座戲院、咖啡館、西餐廳、唱片公司。1933年，望春風在這裡寫出來。' },
        now:    { built: true, h: 10, col: 'haze',
                  caption: '太平町現在叫延平北路，望春風還有人在唱。',
                  detail: '' },
      } },
  ];

  // ── GENERIC STREET-SIDE BUILDINGS ─────────────────────────────────────────────
  // ~20 lots that populate the street between the anchors. Each has a type, and the
  // type table says how that lot looks in each era. built:false = empty ground.
  const TYPES = {
    // the first shophouses: there from the start, rebuilt taller each era
    shophouse: { flee: { built: true, h: 3.5, col: 'bone' }, tea: { built: true, h: 4, col: 'bone' },
                 modern: { built: true, h: 7, col: 'bone' }, now: { built: true, h: 9, col: 'haze' } },
    // rice yard at first, then a tea godown, then a shop, then an apartment block
    yard:      { flee: { built: false }, tea: { built: true, h: 5, col: 'haze' },
                 modern: { built: true, h: 8, col: 'bone' }, now: { built: true, h: 12, col: 'haze' } },
    // tea factory: appears with the treaty port, becomes a warehouse, then a block
    factory:   { flee: { built: false }, tea: { built: true, h: 6, col: 'haze' },
                 modern: { built: true, h: 6, col: 'haze' }, now: { built: true, h: 11, col: 'haze' } },
    // baroque-era shop: nothing until the 1920s
    baroque:   { flee: { built: false }, tea: { built: false },
                 modern: { built: true, h: 8, col: 'bone' }, now: { built: true, h: 8, col: 'bone' } },
    // post-war block: nothing until after 1946
    postwar:   { flee: { built: false }, tea: { built: false },
                 modern: { built: false }, now: { built: true, h: 14, col: 'haze' } },
  };

  function B(col, row, type) {
    return { id: type + '_' + (col < 0 ? 'w' : 'e') + row, grid: [col, row], size: [8, 8],
             hero: false, type: type, byEra: TYPES[type] };
  }

  const GENERIC = [
    // east side (x>0), before dihua
    B(1, 1, 'shophouse'), B(1, 4, 'shophouse'), B(1, 7, 'yard'), B(1, 10, 'yard'),
    // east side, between taiping and chenghuang, and beyond
    B(1, 33, 'baroque'), B(1, 39, 'postwar'), B(1, 42, 'postwar'),
    // west side (x<0), the river side
    B(-1, 1, 'shophouse'), B(-1, 3, 'shophouse'), B(-1, 5, 'yard'), B(-1, 7, 'yard'),
    B(-1, 9, 'yard'), B(-1, 11, 'factory'),
    B(-1, 19, 'factory'), B(-1, 22, 'factory'), B(-1, 25, 'baroque'), B(-1, 28, 'baroque'),
    B(-1, 31, 'baroque'), B(-1, 34, 'postwar'), B(-1, 37, 'postwar'), B(-1, 40, 'postwar'),
  ];

  const TILES = ANCHORS.concat(GENERIC);

  // ── CAMERA PATH ───────────────────────────────────────────────────────────────
  // 6 keyframes fed through THREE.CatmullRomCurve3. Scroll 0 = first, scroll 1 = last.
  // p = position, t = look-at target, fov = field of view. z must keep decreasing —
  // the camera's z is what decides the era, so the path never doubles back.
  const CAM = [
    // 0 · opening — high and centred, before the street begins; the whole century sits in fog ahead
    { p: [0, 7, 50],     t: [0, 3, -40],   fov: 55 },
    // 1 · flee (1853–1859) — low, at street level among the first shophouses, looking down the yard
    { p: [-3, 3.5, -22], t: [4, 3, -80],   fov: 50 },
    // 2 · tea (1860–1894) — from the east lots, looking across the road at the wharf and the river
    { p: [12, 9, -135],  t: [-10, 1, -170], fov: 50 },
    // 3 · modern (1895–1945) — from the west side, framing the taiping block's facades on the east
    { p: [-3, 6, -236],  t: [9, 7, -280],  fov: 45 },
    // 4 · now (1946–) — back in the road, low, the temple lot ahead on the right
    { p: [2, 4, -330],   t: [9, 4, -358],  fov: 50 },
    // 5 · closing — close on 霞海城隍廟 and the queue outside it
    { p: [-4, 4, -336],  t: [10, 3, -360], fov: 45 },
  ];

  // ── INSTALL ───────────────────────────────────────────────────────────────────
  const root = document.documentElement;
  Object.keys(PALETTE).forEach(k => root.style.setProperty('--' + k, PALETTE[k]));

  window.DATA = { PALETTE, GRID, ERAS, TILES, CAM };
})();
