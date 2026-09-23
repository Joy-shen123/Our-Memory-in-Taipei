// Memory in Us — ALL content lives in this file. Nothing is fetched at runtime.
// Classic script (Chrome blocks ES-module imports on file://). Everything hangs off window.DATA.

(function () {

  // ── THE FIVE COLOURS ──────────────────────────────────────────────────────────
  const PALETTE = {
    ink:  '#2b2f3a',   // dark: roofs, trunks, outlines
    haze: '#9fb6c9',   // distance and shade
    lamp: '#ffb347',   // warm light, lit windows
    bone: '#f7f2e8',   // pale facades, text
    verm: '#d9483b',   // red accent
    sky:  '#8ecbff',   // daytime sky
    brick:'#b8664c',   // Dihua Street brick arcades
    glass:'#5fb0bf',   // Taipei 101 curtain wall
    leaf: '#6fae6a',   // trees
    road: '#6d6f75',   // asphalt
    walk: '#e2dccb',   // pavement
  };

  // ── WORLD GRID ────────────────────────────────────────────────────────────────
  // The street runs along -Z, away from the camera. grid:[col,row] → x = col*laneX, z = -row*lot.
  const GRID = { lot: 10, laneX: 10, roadWidth: 12 };

  // ── THE THREE CHAPTERS ────────────────────────────────────────────────────────
  // A chapter's road marking is painted at zRange[0]; the world flips as the camera crosses it.
  const ERAS = [
    { key: 'red',   start: 1985, end: 2000, years: '1985–1999', label: 'When We Were Young', zh: '西門町 · Ximending',
      zRange: [60, -140],   uPrint: 0.0,  traffic: 6,
      palette: { ground: 'ink', roof: 'haze', accent: 'verm' } },
    { key: 'dadao', start: 2000, end: 2020, years: '2000–2019', label: 'Spring Festival', zh: '大稻埕 · Dadaocheng',
      zRange: [-140, -290], uPrint: 0.0,  traffic: 14,
      palette: { ground: 'haze', roof: 'bone', accent: 'lamp' } },
    { key: 'tower', start: 2020, end: 2040, years: '2020–',     label: 'The Future',      zh: '台北101 · Taipei 101',
      zRange: [-290, -460], uPrint: 0.0,  traffic: 30,
      palette: { ground: 'haze', roof: 'bone', accent: 'verm' } },
  ];

  // ── THE WORDS — big lines that surface as you scroll. at = scroll progress 0..1
  const WORDS = [
    { at: 0.03, big: 'Our Memory in Taipei',          sub: 'Three generations. One street.' },
    { at: 0.10, big: 'We were children.',             sub: 'We felt happiness.' },
    { at: 0.17, big: 'Nostalgia.',                    sub: 'Toys, candy, playful things.' },
    { at: 0.25, big: 'We remember the small things.', sub: '' },
    { at: 0.37, big: 'We grow older.',                sub: '' },
    { at: 0.45, big: 'Spring Festival.',              sub: 'The street fills with red.' },
    { at: 0.53, big: 'We carry responsibility.',      sub: '' },
    { at: 0.62, big: 'We build things.',              sub: '' },
    { at: 0.74, big: 'The future.',                   sub: '' },
    { at: 0.82, big: 'Where do we go?',               sub: '' },
  ];

  // ── THE CLOSING LINE ──────────────────────────────────────────────────────────
  // Issue #12, CJ 2026-09-23: 「最後出現的字想要 Just like the man on Taipei 101」. Replaces the
  // old line ("Where we go, we don't know. We only know we need to climb higher."), per
  // research/plan-6 §6; CJ has not said replace-or-follow, so this stays a one-line revert.
  const CLOSING = {
    line: 'Just like the man on Taipei 101',
    showFrom: 0.9,   // scroll progress at which the line fades in
  };

  // ── ANCHOR TILES ──────────────────────────────────────────────────────────────
  const ANCHORS = [
    { id: 'redhouse', grid: [1, 7], size: [10, 10], hero: true,
      name: { en: 'Ximen Red House', zh: '西門紅樓' },
      byEra: {
        red:   { built: true, caption: 'The octagon of red brick at the West Gate. We bought comics, cassettes and shaved ice in the streets around it.' },
        dadao: { built: true, caption: 'Restored in 2002. The market became a theatre, a cinema, and now a creative market.' },
        tower: { built: true, caption: 'Still standing at the West Gate. It has outlived the wall it was named after.' },
      } },
    { id: 'dihua', grid: [1, 22], size: [10, 50], hero: true,
      name: { en: 'Dihua Street', zh: '迪化街' },
      byEra: {
        red:   { built: true, caption: 'A row of tea merchants’ shophouses on flat ground once used for drying rice.' },
        dadao: { built: true, caption: 'In the 1930s the shopfronts were rebuilt Baroque, and a street beside a rice yard became the most fashionable place in Taipei.' },
        tower: { built: true, caption: 'Dried goods, herbs and cloth. The street survived by staying a street.' },
      } },
    { id: 'chenghuang', grid: [-1, 24], size: [10, 10], hero: true,
      name: { en: 'Xiahai City God Temple', zh: '霞海城隍廟' },
      byEra: {
        red:   { built: true, caption: 'The city god carried here by refugees in 1853, when this was an empty rice-drying yard.' },
        dadao: { built: true, caption: 'On the god’s birthday the whole street filled with people. Kuo Hsueh-hu painted it in 1930.' },
        tower: { built: true, queue: true, caption: 'Today the queue outside is for the matchmaker god inside. Most of them are in their twenties.' },
      } },
    { id: 'tower101', grid: [0, 42], size: [24, 24], hero: true,
      name: { en: 'Taipei 101', zh: '台北101' },
      byEra: {
        red:   { built: false, caption: 'Rice paddies.' },
        dadao: { built: false, caption: 'Still fields, on the far east edge of the city.' },
        tower: { built: true, caption: 'Eight stacked segments like a bamboo stem, 508 metres of blue-green glass. For six years the tallest building on earth.' },
      } },
  ];

  // ── GENERIC STREET-SIDE BUILDINGS ─────────────────────────────────────────────
  const TYPES = {
    shophouse: { red: { h: 0 },                dadao: { h: 7, col: 'bone' }, tower: { h: 9, col: 'haze' } },
    market:    { red: { h: 0 },                dadao: { h: 8, col: 'bone' }, tower: { h: 12, col: 'haze' } },
    baroque:   { red: { h: 0 },                dadao: { h: 8, col: 'bone' }, tower: { h: 8, col: 'bone' } },
    block:     { red: { h: 0 },                dadao: { h: 0 },              tower: { h: 10, col: 'haze' } },
    highrise:  { red: { h: 0 },                dadao: { h: 0 },              tower: { h: 13, col: 'haze' } },
  };
  function B(col, row, type) {
    return { id: type + '_' + (col < 0 ? 'w' : 'e') + row, grid: [col, row], size: [8, 8], hero: false, type, byEra: TYPES[type] };
  }
  // Only the Xinyi stretch keeps generic lots (rows 28+). The Ximending and Dadaocheng
  // stretches are laid out building by building in scene-red.js and scene-dadao.js.
  const GENERIC = [
    B(1, 29, 'baroque'), B(1, 32, 'block'), B(1, 35, 'highrise'), B(1, 38, 'highrise'),
    B(-1, 28, 'block'), B(-1, 31, 'block'), B(-1, 34, 'highrise'), B(-1, 37, 'highrise'),
  ];
  const TILES = ANCHORS.concat(GENERIC);

  // ── CAMERA PATH ───────────────────────────────────────────────────────────────
  // 6 keyframes through THREE.CatmullRomCurve3. z must keep decreasing along the path.
  const CAM = [
    // 0 · opening — high and centred, the century in fog ahead
    { p: [0, 7, 50],       t: [0, 3, -40],     fov: 55 },
    // 1 · Ximen Red House — street level, the octagon ahead on the right
    { p: [-3, 3.5, -34],   t: [9, 4, -72],     fov: 50 },
    // 2 · Dadaocheng — walking the shophouse row, temple on the left
    { p: [-2, 4, -178],    t: [6, 5, -222],    fov: 48 },
    // 3 · approach — the tower rises out of the fog at the end of the street
    { p: [2, 5, -300],     t: [0, 40, -420],   fov: 55 },
    // 4 · the base — looking straight up the west face
    { p: [-3, 3, -372],    t: [-4, 50, -420],  fov: 62 },
    // 5 · closing — high beside the tower, level with the crown, the man standing on its rim
    //     (issue #12). The fov opens from 62 to 82 over the climb so the world widens as he nears
    //     the crown (IVRESS borrow e). z still decreasing: the rig's uAtZ bisection needs it.
    { p: [-19, 90, -395],  t: [-3, 104, -420], fov: 82 },
  ];

  const root = document.documentElement;
  Object.keys(PALETTE).forEach(k => root.style.setProperty('--' + k, PALETTE[k]));
  window.DATA = { PALETTE, GRID, ERAS, TILES, CAM, CLOSING, WORDS };
})();
