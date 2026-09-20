// Memory in Us — ALL content lives in this file. Nothing is fetched at runtime.
// Classic script (Chrome blocks ES-module imports on file://). Everything hangs off window.DATA.

(function () {

  // ── THE FIVE COLOURS ──────────────────────────────────────────────────────────
  const PALETTE = {
    ink:  '#0A0C10',   // print: ink, outlines.          photo: unlit ground and sky
    haze: '#2A3442',   // print: second ink, mid-tones.  photo: fog and distance
    lamp: '#E8A54B',   // print: flat warm block.        photo: real light
    bone: '#E8E3D8',   // print: the paper.              photo: text, pale facades, moon
    verm: '#C8422E',   // the one accent. sparingly.
  };

  // ── WORLD GRID ────────────────────────────────────────────────────────────────
  // The street runs along -Z, away from the camera. grid:[col,row] → x = col*laneX, z = -row*lot.
  const GRID = { lot: 10, laneX: 10, roadWidth: 12 };

  // ── THE THREE CHAPTERS ────────────────────────────────────────────────────────
  // A chapter's road marking is painted at zRange[0]; the world flips as the camera crosses it.
  const ERAS = [
    { key: 'red',   start: 1908, end: 1930, years: '1908–1929', label: 'Ximen Red House', zh: '西門紅樓',
      zRange: [60, -140],   uPrint: 1.0,  traffic: 3,
      palette: { ground: 'ink', roof: 'haze', accent: 'verm' } },
    { key: 'dadao', start: 1930, end: 2004, years: '1930–2003', label: 'Dadaocheng',      zh: '大稻埕',
      zRange: [-140, -290], uPrint: 0.5,  traffic: 12,
      palette: { ground: 'haze', roof: 'bone', accent: 'lamp' } },
    { key: 'tower', start: 2004, end: 2026, years: '2004–',     label: 'Taipei 101',      zh: '台北101',
      zRange: [-290, -460], uPrint: 0.0,  traffic: 30,
      palette: { ground: 'haze', roof: 'bone', accent: 'verm' } },
  ];

  // ── THE CLOSING LINE ──────────────────────────────────────────────────────────
  const CLOSING = {
    line: 'Where we go, we don’t know. We only know we need to climb higher.',
    showFrom: 0.9,   // scroll progress at which the line fades in
  };

  // ── ANCHOR TILES ──────────────────────────────────────────────────────────────
  const ANCHORS = [
    { id: 'redhouse', grid: [1, 7], size: [10, 10], hero: true,
      name: { en: 'Ximen Red House', zh: '西門紅樓' },
      byEra: {
        red:   { built: true, caption: 'Built in 1908 as Taipei’s first public market, an octagon of red brick where the city bought its groceries.' },
        dadao: { built: true, caption: 'The market became a theatre, then a cinema. Every generation found a new use for the same eight walls.' },
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
        tower: { built: true, caption: 'Finished in 2004. For six years the tallest building on earth, eight stacked boxes like a bamboo stem.' },
      } },
  ];

  // ── GENERIC STREET-SIDE BUILDINGS ─────────────────────────────────────────────
  const TYPES = {
    shophouse: { red: { h: 3.5, col: 'bone' }, dadao: { h: 7, col: 'bone' }, tower: { h: 9, col: 'haze' } },
    market:    { red: { h: 4, col: 'haze' },   dadao: { h: 8, col: 'bone' }, tower: { h: 12, col: 'haze' } },
    baroque:   { red: { h: 0 },                dadao: { h: 8, col: 'bone' }, tower: { h: 8, col: 'bone' } },
    block:     { red: { h: 0 },                dadao: { h: 0 },              tower: { h: 10, col: 'haze' } },
    highrise:  { red: { h: 0 },                dadao: { h: 0 },              tower: { h: 13, col: 'haze' } },
  };
  function B(col, row, type) {
    return { id: type + '_' + (col < 0 ? 'w' : 'e') + row, grid: [col, row], size: [8, 8], hero: false, type, byEra: TYPES[type] };
  }
  const GENERIC = [
    B(1, 1, 'shophouse'), B(1, 4, 'shophouse'), B(1, 10, 'market'), B(1, 13, 'market'), B(1, 16, 'baroque'),
    B(1, 29, 'baroque'), B(1, 32, 'block'), B(1, 35, 'highrise'), B(1, 38, 'highrise'),
    B(-1, 1, 'shophouse'), B(-1, 3, 'shophouse'), B(-1, 6, 'market'), B(-1, 9, 'shophouse'), B(-1, 12, 'market'),
    B(-1, 15, 'baroque'), B(-1, 18, 'baroque'), B(-1, 21, 'baroque'), B(-1, 28, 'block'), B(-1, 31, 'block'),
    B(-1, 34, 'highrise'), B(-1, 37, 'highrise'),
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
    { p: [-9, 3, -372],    t: [-4, 50, -420],  fov: 62 },
    // 5 · closing — high beside the tower, the man near the top
    { p: [-26, 70, -386],  t: [-4, 86, -420],  fov: 50 },
  ];

  const root = document.documentElement;
  Object.keys(PALETTE).forEach(k => root.style.setProperty('--' + k, PALETTE[k]));
  window.DATA = { PALETTE, GRID, ERAS, TILES, CAM, CLOSING };
})();
