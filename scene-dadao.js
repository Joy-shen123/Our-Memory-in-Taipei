// scene-dadao.js — Dadaocheng, the Spring Festival chapter (z -140 … -290). Both sides of the
// road are Dihua Street: an unbroken row of narrow arcaded shophouses (騎樓 over the sidewalk,
// pilasters and a 山牆 crest on each bay). East side: procedural bays with the shop walls and the
// dried goods. West side: the teammate's Dadaocheng library storefronts as the shop walls of the
// same arcade system, then 霞海城隍廟 with its swallowtail ridge and 永樂市場 at the chapter end.
// The 年貨大街 fills the road; 大稻埕碼頭 is seen through the 民生西路 gap on the west.
// Everything exists in all three eras (the tower era only ever sees this stretch behind it).
(function () {
  if (!window.SCENE) return;
  const { part, instSet, only, C, boxGeo, anchors, PALETTE, rnd, libGroup, asset, lam } = window.SCENE;

  const ALL = ['red', 'dadao', 'tower'], DT = ['dadao', 'tower'], T = ['tower'];
  const H = (r, d, t) => ({ red: r, dadao: d, tower: t });
  const HA = h => ({ red: h, dadao: h, tower: h });
  const D = anchors.dihua, G = anchors.chenghuang;
  const WALK = 0.22;                                          // top of the sidewalk slab
  const lib = libGroup(['red', 'dadao']);                     // library items, there before the flip

  // ── geometries, base at y = 0 unless noted ──────────────────────────────────
  const cylGeo = new THREE.CylinderGeometry(0.5, 0.5, 1, 10); cylGeo.translate(0, 0.5, 0);
  const sphGeo = new THREE.SphereGeometry(0.5, 8, 6); sphGeo.translate(0, 0.5, 0);
  const archGeo = new THREE.CylinderGeometry(0.5, 0.5, 1, 12); archGeo.rotateZ(Math.PI / 2); // axis along x, centred: a round window head
  // Baroque gable crest: 1 wide (z), 1 tall (y), extruded 1 along +x. Shoulders, then a round top.
  const crestGeo = (() => {
    const s = new THREE.Shape();
    s.moveTo(-0.5, 0); s.lineTo(0.5, 0); s.lineTo(0.5, 0.32);
    s.quadraticCurveTo(0.42, 0.5, 0.27, 0.52); s.lineTo(0.17, 0.6);
    s.bezierCurveTo(0.17, 0.92, 0.07, 1, 0, 1);
    s.bezierCurveTo(-0.07, 1, -0.17, 0.92, -0.17, 0.6); s.lineTo(-0.27, 0.52);
    s.quadraticCurveTo(-0.42, 0.5, -0.5, 0.32); s.lineTo(-0.5, 0);
    const g = new THREE.ExtrudeGeometry(s, { depth: 1, bevelEnabled: false });
    g.rotateY(Math.PI / 2);                                    // width now along z, thickness along +x
    return g;
  })();

  // ── signage text: characters drawn to a canvas with the system font ────────
  function textTex(str, bg, fg, vertical) {
    const cv = document.createElement('canvas'), n = str.length;
    cv.width = vertical ? 128 : 128 * n + 64; cv.height = vertical ? 128 * n + 64 : 128;
    const g = cv.getContext('2d');
    g.fillStyle = PALETTE[bg]; g.fillRect(0, 0, cv.width, cv.height);
    g.fillStyle = PALETTE[fg];
    g.font = '700 100px -apple-system, "PingFang TC", "Heiti TC", "Noto Sans CJK TC", sans-serif';
    g.textAlign = 'center'; g.textBaseline = 'middle';
    for (let i = 0; i < n; i++) vertical ? g.fillText(str[i], 64, 96 + i * 128) : g.fillText(str[i], 96 + i * 128, 66);
    const t = new THREE.CanvasTexture(cv); t.anisotropy = 4;
    return { tex: t, aspect: cv.width / cv.height };
  }
  // a text board. axis 'z': faces ±z (read walking down the street); axis 'x': faces the road.
  function signPart(str, bg, fg, vertical, axis, x, y, z, h, eras) {
    const { tex, aspect } = textTex(str, bg, fg, vertical), ww = h * aspect;
    const p = axis === 'z' ? part(x, y, z, ww, 0.12, only(eras, h, 'bone')) : part(x, y, z, 0.1, ww, only(eras, h, 'bone'));
    p.mesh.material.map = tex; p.mesh.material.needsUpdate = true;
    return p;
  }

  // ── the shophouse bays: one arcade system on both sides ─────────────────────
  // Reference: Dihua Street Section 1 — frontages 4–5 m, 騎樓 at ground level over the sidewalk
  // (columns at the kerb, ceiling at 3.8 m), the upper floor over the sidewalk with two tall
  // windows between pilasters, and a parapet crest: 閩南 plain brick ('min'), 洋樓 red brick with
  // round-arched windows and a balustrade ('yang'), 巴洛克 plaster with a curved gable ('baroque').
  const cols = [], bodies = [], slabs = [], walls = [], wins = [], arches = [], pils = [], caps = [], crests = [], meds = [], roofs = [], rails = [];
  const shops = [];                                            // the arcade back walls that get goods
  const KERB = 6.6, FACE = 6.2, BACK = 9.4, DEEP = 18;
  // bay(side, z0, z1, style, opts): opts.floors (2|3), opts.col (wall colour), opts.libDepth
  // (a library storefront stands at the arcade back, this deep, so the body starts behind it),
  // opts.open (no columns/windows/crest: a library facade fills the kerb line), opts.goods.
  function bay(s, z0, z1, style, o) {
    o = o || {};
    const d = z0 - z1, zc = (z0 + z1) / 2, floors = o.floors || 2;
    const col = o.col || (style === 'baroque' ? 'bone' : 'brick');
    const top = floors === 1 ? 4.2 : 4.2 + floors * 3.4 - 0.2; // roof line
    if (!o.open) {
      cols.push({ x: s * KERB, z: z0, w: 0.5, d: 0.5, h: HA(3.8), c: C(col === 'bone' ? 'walk' : col) });
      slabs.push({ x: s * (FACE + DEEP) / 2, z: zc, y: 3.8, w: DEEP - FACE, d, h: HA(0.4), c: C(col) });
    }
    const bf = o.open ? 7.2 : (o.libDepth ? BACK + o.libDepth + 0.1 : BACK);   // where the body starts
    bodies.push({ x: s * (bf + DEEP) / 2, z: zc, w: DEEP - bf, d: d - 0.05, h: HA(o.open ? top : 3.8), c: C(o.open ? col : 'haze') });
    if (o.open) return;
    for (let f = 0; f < floors; f++) {
      const y = 4.2 + f * 3.4;
      walls.push({ x: s * (FACE + DEEP) / 2, z: zc, y, w: DEEP - FACE, d: d - 0.05, h: HA(3.2), c: C(col) });
      if (f < floors - 1) slabs.push({ x: s * (FACE + DEEP) / 2, z: zc, y: y + 3.2, w: DEEP - FACE, d, h: HA(0.2), c: C(col === 'brick' ? 'ink' : 'walk') });
      [-0.24, 0.24].forEach(k => {
        wins.push({ x: s * (FACE - 0.05), z: zc + k * d, y: y + 0.5, w: 0.1, d: 1.0, h: HA(2.0), c: C('ink') });
        if (style === 'yang') arches.push({ x: s * (FACE - 0.05), z: zc + k * d, y: y + 2.5, w: 0.1, d: 1.0, h: HA(1.0), c: C('ink') });
      });
    }
    // pilasters at the bay edges, the full height of the upper floors (+ crest for Baroque)
    const ph = floors * 3.4 - 0.2 + (style === 'baroque' ? 1.0 : 0);
    if (floors > 1) pils.push({ x: s * (FACE - 0.15), z: z0 - 0.2, y: 4.2, w: 0.4, d: 0.4, h: HA(ph), c: C(style === 'min' ? 'brick' : 'bone') });
    if (style === 'baroque' && floors > 1) caps.push({ x: s * (FACE - 0.2), z: z0 - 0.2, y: 4.2 + ph, w: 0.55, d: 0.55, h: HA(0.35), c: C('bone') });
    roofs.push({ x: s * (FACE + DEEP) / 2 + s * 0.2, z: zc, y: top, w: DEEP - FACE - 0.4, d: d - 0.3, h: HA(0.3), c: C('ink') });
    if (style === 'min' || floors === 1) {
      rails.push({ x: s * (FACE + 0.25), z: zc, y: top, w: 0.5, d: d - 0.1, h: HA(0.7), c: C('brick') });
    } else if (style === 'yang') {
      rails.push({ x: s * (FACE + 0.25), z: zc, y: top, w: 0.5, d: d - 0.1, h: HA(0.25), c: C('bone') });
      rails.push({ x: s * (FACE + 0.25), z: zc, y: top + 0.85, w: 0.5, d: d - 0.1, h: HA(0.2), c: C('bone') });
      for (let k = -0.4; k <= 0.41; k += 0.2) rails.push({ x: s * (FACE + 0.25), z: zc + k * d, y: top + 0.25, w: 0.2, d: 0.2, h: HA(0.6), c: C('bone') });
    } else {
      crests.push({ x: s * FACE, z: zc, y: top, w: 0.55, d: d - 0.1, r: s > 0 ? 0 : Math.PI, h: HA(o.tall ? 2.6 : 2.1), c: C(col === 'brick' ? 'bone' : col) });
      meds.push({ x: s * (FACE - 0.08), z: zc, y: top + 0.95, w: 0.16, d: 0.7, h: HA(0.7), c: C(o.medal || 'lamp') });
    }
    if (o.goods !== false) shops.push({ fx: s * BACK, z: zc, span: d, s });
  }
  // east side: 24 bays from z -150 down to -262, one wider slot for the library's Baroque facade
  const east = [['baroque', { tall: true }], ['yang'], ['min'], ['baroque', { col: 'walk' }], ['baroque', { floors: 3 }], ['yang'],
                ['lib'], ['baroque'], ['min'], ['baroque', { col: 'walk', medal: 'verm' }], ['yang', { floors: 3 }], ['baroque'],
                ['min'], ['baroque', { tall: true }], ['yang'], ['baroque', { col: 'walk' }], ['baroque'], ['min'],
                ['yang'], ['baroque', { floors: 3, medal: 'verm' }], ['baroque'], ['min'], ['baroque', { col: 'walk' }], ['yang']];
  let ze = -150;
  east.forEach(([style, o]) => {
    if (style === 'lib') {
      const w = 5.6;
      bay(1, ze, ze - w, 'baroque', { open: true, col: 'bone' });
      const t = asset('baroque-gable-townhouse', lib, FACE + 0.25, ze - w / 2, -Math.PI / 2);   // front faces the road
      ze -= w; return;
    }
    bay(1, ze, ze - 4.6, style, o); ze -= 4.6;
  });
  cols.push({ x: KERB, z: ze, w: 0.5, d: 0.5, h: HA(3.8), c: C('walk') });
  D.top = 11;

  // west side: the library storefronts stand at the back of the same arcade
  // [id, width, scale, style, extra]; 'gap' opens 民生西路; 'fill' is a plain procedural bay
  const west = [
    ['red-brick-arcade', 6.4, 1, 'yang', { open: true, col: 'brick' }],
    ['dried-goods-shop', 6.2, 1, 'baroque'], ['qipao-fabric-shop', 5.4, 0.92, 'yang'],
    ['bolero-restaurant', 5.6, 0.8, 'baroque', { col: 'walk' }], ['kamatiam-cooler-storefront', 5.2, 1, 'min'],
    ['creative-cafe-storefront', 4.8, 1, 'baroque'],
    ['fill', 4.6, 0, 'yang', { sign: '茶行', signCol: 'lamp' }], ['fill', 4.6, 0, 'baroque', { floors: 3 }], ['fill', 4.6, 0, 'min'],
    ['gap', 16.5], ['fill', 4.6, 0, 'baroque', { sign: '南北貨' }], ['fill', 4.6, 0, 'yang'], ['fill', 4.6, 0, 'min', { floors: 1 }],
    ['temple', 12], ['herbal-medicine-counter', 4.6, 1, 'baroque', { sign: '中藥' }], ['fill', 4.6, 0, 'min', { drawers: true }],
    ['fill', 4.6, 0, 'baroque', { tall: true }], ['fill', 2.4, 0, 'yang', { goods: false }],
  ];
  let zw = -150.5, gapZ = [0, 0], templeZ = 0;
  west.forEach(([id, w, sc, style, o]) => {
    o = o || {};
    const zc = zw - w / 2;
    if (id === 'gap') { gapZ = [zw, zw - w]; zw -= w; return; }
    if (id === 'temple') { templeZ = zc; zw -= w; return; }
    if (id === 'fill') { bay(-1, zw, zw - w, style, o); }
    else if (o.open) {
      bay(-1, zw, zw - w, style, o);
      asset(id, lib, -(FACE + 0.25), zc, Math.PI / 2, sc);
    } else {
      const a = window.SCENE.findAsset(id);
      const depth = a ? 3.9 : 0;                                // storefront depth, room behind the front for the body
      bay(-1, zw, zw - w, style, Object.assign({ libDepth: depth, goods: false }, o));
      const g = asset(id, lib, 0, zc, Math.PI / 2, sc);
      if (g) { const sz = g.userData.size; g.position.x = -(BACK - 0.1) - sz.x / 2 + 0.01; g.updateMatrixWorld(true); }
    }
    if (o.sign) signPart(o.sign, o.signCol === 'lamp' ? 'lamp' : 'bone', 'ink', true, 'z', -(FACE - 0.55), 4.4, zc, 2.6, ALL);
    if (o.drawers) { // 百子櫃 — the herb shop's wall of little drawers, drawn to a canvas, as the shop wall
      const cv = document.createElement('canvas'); cv.width = 256; cv.height = 192;
      const g = cv.getContext('2d');
      g.fillStyle = PALETTE.haze; g.fillRect(0, 0, 256, 192);
      for (let i = 0; i < 8; i++) for (let j = 0; j < 6; j++) {
        g.fillStyle = PALETTE.bone; g.fillRect(i * 32 + 3, j * 32 + 3, 26, 26);
        g.fillStyle = PALETTE.lamp; g.fillRect(i * 32 + 13, j * 32 + 13, 6, 6);
      }
      const p = part(-(BACK - 0.5), WALK, zc, 0.9, w - 0.8, only(ALL, 2.6, 'bone'));
      p.mesh.material.map = new THREE.CanvasTexture(cv); p.mesh.material.needsUpdate = true;
    }
    zw -= w;
  });
  cols.push({ x: -KERB, z: gapZ[0], w: 0.5, d: 0.5, h: HA(3.8), c: C('walk') });
  cols.push({ x: -KERB, z: zw, w: 0.5, d: 0.5, h: HA(3.8), c: C('walk') });
  // painted shop names on the east pilasters, read walking down the street
  [['米行', 'bone', -152.3], ['南北貨', 'bone', -175.3], ['布莊', 'verm', -207.9], ['茶行', 'lamp', -234.5], ['中藥', 'bone', -253]].forEach(([t, bg, z]) =>
    signPart(t, bg, bg === 'bone' ? 'ink' : 'bone', true, 'z', FACE - 0.55, 4.4, z, 2.6, ALL));

  // ── goods under the east arcade and in the west fillers: sacks, price boards, crates, jars,
  //    hanging dried goods, tin signs under the arcade lip, acrylic boxes on the facade ──
  const goods = [], jars = [], signs = [];
  shops.forEach((s, si) => {
    const side = s.s, gx = s.fx - side * 0.3, hz = s.span / 2 - 0.5;
    for (let i = 0; i < 4; i++) {                              // sacks, some two high
      const z = s.z - hz + 0.35 + i * 0.72 + (rnd() - 0.5) * 0.15;
      goods.push({ x: gx, y: WALK, z, w: 0.5, d: 0.6, r: (rnd() - 0.5) * 0.3, c: C(i === 1 ? 'haze' : 'bone'), h: HA(0.5) });
      if (i % 2 === 0) goods.push({ x: gx, y: WALK + 0.5, z, w: 0.46, d: 0.55, r: (rnd() - 0.5) * 0.4, c: C('bone'), h: HA(0.42) });
    }
    for (let b = 0; b < 3; b++) {                              // hand-written price boards stuck in the piles, red paper
      const z = s.z - hz + 0.45 + b * 0.72;
      goods.push({ x: gx - side * 0.3, y: WALK + (b % 2 ? 0.5 : 0.92), z, w: 0.04, d: 0.36, r: (rnd() - 0.5) * 0.3, c: C(b === 1 ? 'bone' : 'verm'), h: HA(0.44) });
    }
    const z = s.z + hz - 0.5;                                  // a crate with jars, the far end of the front
    goods.push({ x: gx, y: WALK, z, w: 0.5, d: 0.95, r: 0, c: C('haze'), h: HA(0.5) });
    for (let k = 0; k < 3; k++) jars.push({ x: gx, y: WALK + 0.5, z: z - 0.32 + k * 0.32, w: 0.27, d: 0.27, c: C(k === 1 ? 'lamp' : (k === 2 ? 'haze' : 'bone')), h: HA(0.36) });
    goods.push({ x: s.fx - side * 0.25, y: 3.0, z: s.z, w: 0.06, d: s.span - 1.2, r: 0, c: C('ink'), h: HA(0.06) });   // the rod
    for (let i = 0; i < 6; i++) {
      const zz = s.z - hz + 0.35 + i * ((2 * hz - 0.7) / 5), hh = 0.45 + rnd() * 0.5;
      goods.push({ x: s.fx - side * 0.25, y: 3.0 - hh, z: zz, w: 0.2, d: 0.3, r: (rnd() - 0.5) * 0.6, c: C(i % 3 === 0 ? 'lamp' : (i % 3 === 1 ? 'haze' : 'bone')), h: HA(hh) });
    }
    const lampSign = si % 3 === 0;                             // a tin sign hanging under the arcade lip
    signs.push({ x: side * (KERB + 0.35), y: 2.3, z: s.z - 0.3, w: 0.1, d: 1.2, r: 0, c: C(lampSign ? 'lamp' : 'bone'), h: HA(1.2) });
    if (!lampSign) signs.push({ x: side * (KERB + 0.35), y: 3.2, z: s.z - 0.3, w: 0.12, d: 1.22, r: 0, c: C('verm'), h: HA(0.3) });
    if (si % 2 === 0) signs.push({ x: side * (FACE - 0.55), y: 4.6 + rnd() * 1.6, z: s.z + 0.9, w: 1.0, d: 0.14, r: 0, c: C(si % 4 === 0 ? 'lamp' : 'haze'), h: HA(0.9 + rnd() * 0.8) });
  });

  // ── 霞海城隍廟 — one of Taipei's smallest temples: a single hall, red columns, a dark carved
  //    front, orange tiles and a swallowtail ridge. Porch over the sidewalk, forecourt in front. ──
  const lant = [];
  (() => {
    const cz = G.z, WH = 5.0, xf = -8.8;                       // hall z -244 … -236, x -8.8 … -17.8, walls 5 m
    // Issue #5 step 2: the hall, carved front with red doors, porch columns, brackets, tiled
    // roof, swallowtail ridge, lanterns and incense burner are the glb from asset/blender/temple.py
    // (8.4k triangles); the name board and the 月老 sign stay canvas text on it.
    const temple = libGroup(ALL);
    MODELS.load('temple', gltf => {
      const root = MODELS.lambertize(gltf.scene);
      root.position.set(xf, 0, cz); root.rotation.y = Math.PI / 2;
      temple.add(root);
    });
    signPart('霞海城隍廟', 'ink', 'lamp', false, 'x', -5.65, WH - 0.9, cz, 0.85, ALL);   // the name on the eave, facing the road
    part(-6.9, WALK + 1.05, cz, 0.1, 0.1, only(ALL, 2.4, 'bone'));                     // smoke off the burner
    part(-6.75, WALK + 1.05, cz - 0.12, 0.07, 0.07, only(ALL, 3.0, 'bone'));
    signPart('月老', 'verm', 'bone', true, 'x', -6.35, WALK, cz + 5.2, 1.8, DT);       // the matchmaker board at the queue head
    G.top = 12.5;
    asset('temple-tea-table', lib, -7.8, cz - 5.2, Math.PI / 2);
    asset('yuelao-worship-area', lib, -8.0, cz + 5.4, Math.PI / 2, 0.8);
  })();

  // ── 永樂市場 — the 1982 concrete market: a big pale block, upper floors stepped back, cloth
  //    market on the upper floors, wet market open at the ground floor, red vertical sign. ──
  (() => {
    const z0 = -263, z1 = -285, zc = (z0 + z1) / 2, d = z0 - z1, xf = -9.3;
    const winTex = (() => {                                    // horizontal window bands
      const cv = document.createElement('canvas'); cv.width = 64; cv.height = 64;
      const g = cv.getContext('2d');
      g.fillStyle = '#fff'; g.fillRect(0, 0, 64, 64);
      g.fillStyle = 'rgba(0,0,0,0.5)'; for (let i = 0; i < 4; i++) g.fillRect(i * 16 + 3, 20, 10, 24);
      const t = new THREE.CanvasTexture(cv); t.wrapS = t.wrapT = THREE.RepeatWrapping; return t;
    })();
    const block = (x, y, w, dd, h, rep) => {
      const p = part(x, y, zc, w, dd, only(ALL, h, 'walk'));
      p.mesh.material.map = winTex.clone(); p.mesh.material.map.repeat.set(rep, h / 3.4); p.mesh.material.map.needsUpdate = true; p.mesh.material.needsUpdate = true;
      return p;
    };
    block(xf - 8, 4.0, 16, d, 13.6, 6);                        // floors 2–5 over the open ground floor
    block(xf - 10, 17.6, 12, d - 6, 6.8, 4);                   // floors 6–7 stepped back
    part(xf - 8, 17.6, zc, 16.2, d + 0.2, only(ALL, 0.25, 'ink'));   // roof lines
    part(xf - 10, 24.4, zc, 12.2, d - 5.8, only(ALL, 0.25, 'ink'));
    part(xf - 8.5, 0, zc, 15, d - 0.4, only(ALL, 4.0, 'haze'));      // the ground-floor hall, in shade
    for (let z = z0 - 0.4; z > z1; z -= 3.6) goods.push({ x: xf + 0.3, z, w: 0.6, d: 0.6, h: HA(4.0), c: C('walk') });   // columns
    goods.push({ x: xf - 8, y: 3.7, z: zc, w: 16, d: d, h: HA(0.3), c: C('walk') });                                       // ceiling edge
    signPart('永樂市場', 'verm', 'bone', true, 'z', xf + 0.6, 6.0, z0 - 1.6, 7.0, ALL);
    signPart('永樂布業商場', 'bone', 'verm', false, 'x', xf + 0.15, 4.5, zc, 1.3, ALL);
    signPart('永樂市場', 'verm', 'bone', false, 'x', xf - 4.0, 24.6, zc, 1.8, ALL);   // rooftop
    // fabric stalls under the front: bolts of cloth in the site colours
    const cloth = ['verm', 'lamp', 'sky', 'leaf', 'glass', 'bone', 'brick', 'haze'];
    for (let z = z0 - 2.4; z > z1 + 1.5; z -= 2.6) {
      goods.push({ x: xf - 1.6, y: WALK, z, w: 1.6, d: 2.0, h: HA(0.8), c: C('haze') });
      for (let k = 0; k < 6; k++) goods.push({ x: xf - 2.2 + (k % 3) * 0.55, y: WALK + 0.8 + Math.floor(k / 3) * 0.32, z: z + (k % 2 ? 0.45 : -0.45), w: 0.5, d: 0.75, r: 0.1 * (k % 3), h: HA(0.3), c: C(cloth[(k + Math.round(-z)) % 8]) });
    }
    asset('yongle-fabric-stall', lib, -7.6, z0 - 4.2, Math.PI / 2);
    asset('yongle-fabric-stall', lib, -7.6, z1 + 5.0, Math.PI / 2);
  })();

  // ── 大稻埕碼頭 through the 民生西路 gap: the flood wall with the No. 5 gate, the promenade
  //    plaza, embankment steps down to the river, the bike path, a ferry at the pier ──
  (() => {
    const gz = (gapZ[0] + gapZ[1]) / 2;                        // gate on the axis of the cross street
    const WX = -19;
    part(WX, 0, (-150 + gz + 3.2) / 2, 0.9, -150 - (gz + 3.2), only(ALL, 4.0, 'haze'));    // flood wall, north run
    part(WX, 0, (gz - 3.2 - 290) / 2, 0.9, (gz - 3.2) + 290, only(ALL, 4.0, 'haze'));      // south run
    part(WX, 4.0, -220, 1.1, 140, only(ALL, 0.25, 'bone'));                                 // coping
    part(WX, 3.5, gz, 0.95, 6.4, only(ALL, 0.5, 'haze'));                                   // over the gate
    [-3.2, 3.2].forEach(dz => part(WX, 0, gz + dz, 1.1, 0.5, only(ALL, 4.2, 'verm')));    // 5號水門: red steel frame
    part(WX, 3.3, gz, 1.1, 6.9, only(ALL, 0.45, 'verm'));
    signPart('5', 'verm', 'bone', false, 'x', WX + 0.6, 4.3, gz, 0.9, ALL);
    part(-24, 0, -214, 8.2, 60, only(ALL, 0.8, 'walk'));                                   // promenade plaza
    part(-28.75, 0, -214, 1.5, 60, only(ALL, 0.5, 'haze'));                                // embankment steps
    part(-30.25, 0, -214, 1.5, 60, only(ALL, 0.25, 'haze'));
    part(-50, 0, -214, 38, 70, only(ALL, 0.06, 'sky'));                                    // the Tamsui River
    part(-25.6, 0.8, -214, 1.4, 60, only(DT, 0.03, 'brick'));                              // bike path (2000s)
    part(-31.5, 0.3, -206, 5.4, 2.2, only(DT, 0.4, 'haze'));                                // ferry pier
    part(-36, 0.06, -203, 2.4, 6.5, only(DT, 0.9, 'bone'));                                 // the Blue Highway ferry
    part(-36, 0.96, -203, 1.8, 3.8, only(DT, 1.1, 'haze'));
    part(-36, 2.06, -203, 2.0, 4.2, only(DT, 0.15, 'bone'));
    const posts = [], heads = [];
    for (let z = -190; z >= -238; z -= 8) { posts.push({ x: -21.2, y: 0.8, z, w: 0.18, d: 0.18, h: HA(5.0) }); heads.push({ x: -21.2, y: 5.8, z, w: 0.5, d: 0.5, h: HA(0.4) }); }
    instSet(boxGeo, lam('bone'), posts);
    instSet(boxGeo, lam('lamp', { emissive: C('lamp'), emissiveIntensity: 0.5 }), heads);
    const w = asset('dadaocheng-wharf-corner', lib, -24.5, -224, 0);
    if (w) { w.position.y = 1.0; w.updateMatrixWorld(true); }
    // the cross street itself: pavement between the two rows, out to the wall
    part(-14, 0, gz, 10, gapZ[0] - gapZ[1] - 0.2, only(ALL, 0.1, 'road'));
  })();

  // ── people: the 年貨大街 crowd in the road, the 月老 queue, the old men, the promenade ──
  const figs = [];
  for (let i = 0; i < 170; i++) {
    const z = -196 - rnd() * 90, x = (rnd() < 0.5 ? -1 : 1) * (1.2 + rnd() * 2.8), c = i % 10 === 0 ? 'verm' : (i % 3 === 0 ? 'haze' : 'bone');
    const fh = 1.45 + rnd() * 0.3;   // kept off |x| < 1.2: the engine's girl runs down the centre lane
    figs.push({ x, z, w: 0.5, d: 0.4, r: rnd() * 6.28, c: C(c), h: H(0, fh, fh) });
  }
  for (let i = 0; i < 30; i++) {   // today's queue for the matchmaker, north along the west sidewalk from the temple
    const qx = -6.45 - (i % 3) * 0.3, qz = G.z + 5.8 + i * 1.15 + (i % 2) * 0.2;
    figs.push({ x: qx, y: WALK, z: qz, w: 0.55, d: 0.45, r: 0, c: C(i % 6 === 0 ? 'verm' : 'bone'), h: H(0, 0, 1.55 + (i % 3) * 0.1) });
  }
  [[-0.9, 0], [0.7, -0.5], [0.4, 0.8]].forEach(o => figs.push({ x: -7.8 + o[0], y: WALK, z: G.z - 5.2 + o[1], w: 0.5, d: 0.42, r: rnd() * 6, c: C('bone'), h: H(1.25, 1.25, 0) }));
  for (let i = 0; i < 10; i++) figs.push({ x: -22 - rnd() * 5, y: 0.8, z: -196 - rnd() * 36, w: 0.5, d: 0.4, r: rnd() * 6.28, c: C(i % 4 === 0 ? 'verm' : 'bone'), h: HA(1.55) });
  for (let i = 0; i < 20; i++) {   // shoppers under the arcades, north of the festival
    const s = i % 2 ? 1 : -1, z = -152 - rnd() * 44;
    figs.push({ x: s * (6.9 + rnd() * 1.8), y: WALK, z, w: 0.5, d: 0.4, r: rnd() * 6.28, c: C(i % 5 === 0 ? 'verm' : (i % 3 === 0 ? 'haze' : 'bone')), h: HA(1.5 + rnd() * 0.3) });
  }

  // ── parked at the kerb, north of the festival only: scooters and bicycles, the library
  //    tricycle and blue truck ──
  const veh = [];
  [{ x: 5.9, z0: -153, z1: -196 }, { x: -5.9, z0: -158, z1: -196 }].forEach(k => {
    for (let z = k.z0; z > k.z1; z -= 1.8) {
      if (k.x < 0 && (Math.abs(z + 168) < 2.2 || Math.abs(z + 186) < 2.6)) continue;   // the tricycle and the truck
      const r = rnd();
      if (r < 0.35) veh.push({ x: k.x, y: 0, z, w: 0.18, d: 1.6, r: (rnd() - 0.5) * 0.3, c: C(rnd() < 0.8 ? 'haze' : 'ink'), h: HA(0.9) });
      else if (r < 0.75) veh.push({ x: k.x, y: 0, z, w: 0.5, d: 1.7, r: (rnd() - 0.5) * 0.2, c: C(rnd() < 0.85 ? 'haze' : 'bone'), h: HA(0.85) });
    }
  });
  for (let i = 0; i < 8; i++) veh.push({ x: -21.6 + (rnd() - 0.5) * 0.8, y: 0.8, z: -232 + i * 6, w: 0.18, d: 1.5, r: 0.35 + rnd() * 0.3, c: C('haze'), h: HA(0.85) });   // bicycles on the promenade
  asset('sanlunche', lib, -5.7, -168, 0);
  asset('blue-mini-truck', lib, -5.6, -186, Math.PI);

  // ── 年貨大街: the entrance archway, lantern strings over the road, banners, stalls both
  //    sides with red price boards, the two library stalls ──
  const fest = [];
  asset('nianhuo-archway', lib, 0, -150, 0, 1.6);
  for (let k = 0; k < 8; k++) {
    const z = -198 - k * 12;
    fest.push({ x: 0, y: 7.4, z, w: 12.9, d: 0.04, r: 0, c: C('ink'), h: HA(0.04) });
    for (let i = 0; i <= 10; i++) lant.push({ x: -5 + i, y: 6.9, z, w: 0.5, d: 0.5, r: 0, c: C('verm'), h: HA(0.5) });
  }
  const priceTexts = ['一斤100', '大特價', '試吃', '烏魚子', '開心果', '肉乾', '香菇', '年菜'];
  let boardN = 0;
  [-1, 1].forEach(side => { for (let k = 0; k < 15; k++) {
    const z = -199 - k * 6 + (rnd() - 0.5) * 1.5, x = side * 5.0;
    fest.push({ x, z, w: 1.6, d: 3.0, r: 0, c: C('haze'), h: HA(0.9) });                            // table
    fest.push({ x, y: 0.9, z, w: 1.2, d: 2.4, r: 0, c: C(k % 2 ? 'lamp' : 'bone'), h: HA(0.35) });   // the goods
    fest.push({ x, y: 2.25, z, w: 2.2, d: 3.6, r: 0, c: C(k % 3 === 0 ? 'verm' : 'bone'), h: HA(0.12) }); // canopy
    fest.push({ x: x - side * 0.9, z: z - 1.6, w: 0.07, d: 0.07, r: 0, c: C('ink'), h: HA(2.25) });
    fest.push({ x: x - side * 0.9, z: z + 1.6, w: 0.07, d: 0.07, r: 0, c: C('ink'), h: HA(2.25) });
    if (k < 4) signPart(priceTexts[boardN++ % 8], 'verm', 'bone', false, 'x', x - side * 0.85, 0.95, z + 0.4, 0.42, ALL);   // red paper, written
    else fest.push({ x: x - side * 0.85, y: 0.95, z: z + 0.4, w: 0.05, d: 0.9, r: 0, c: C('verm'), h: HA(0.42) });         // red paper, plain
    fest.push({ x: x - side * 0.85, y: 0.95, z: z - 0.9, w: 0.05, d: 0.6, r: 0, c: C(k % 2 ? 'verm' : 'bone'), h: HA(0.36) });
  } });
  shops.forEach(s => fest.push({ x: s.fx - s.s * 0.05, y: 1.9, z: s.z, w: 0.06, d: s.span * 0.6, r: 0, c: C('verm'), h: HA(0.9) }));   // 春聯 on the shop walls
  signPart('年貨大街', 'verm', 'bone', false, 'z', 0, 8.1, -193, 1.5, ALL);
  signPart('恭喜發財', 'verm', 'bone', false, 'z', 0, 8.1, -252, 1.5, ALL);
  asset('nianhuo-stall', lib, 4.2, -226.5, -Math.PI / 2);
  asset('new-year-market-stall', lib, -4.2, -232.5, Math.PI / 2);

  // ── the instanced sets ──
  // (issue #3 step 2) the sets that mix red brick and plaster are split in two so the brick items
  // carry the brick surface family and the rest plaster; the colour still comes from the instance,
  // the material stays bone under it
  const BRICK = C('brick').getHex();
  const brickSplit = (geo, items) => {
    const isB = it => it.c && it.c.getHex() === BRICK;
    const b = items.filter(isB), o = items.filter(it => !isB(it));
    if (b.length) instSet(geo, lam('bone', { surface: 'brick' }), b, { colors: true });
    if (o.length) instSet(geo, lam('bone'), o, { colors: true });
  };
  brickSplit(boxGeo, cols);
  brickSplit(boxGeo, bodies);
  instSet(boxGeo, lam('bone'), slabs, { colors: true });
  brickSplit(boxGeo, walls);
  instSet(boxGeo, lam('ink'), wins);
  instSet(archGeo, lam('ink'), arches);
  brickSplit(boxGeo, pils);
  instSet(boxGeo, lam('bone'), caps);
  instSet(crestGeo, lam('bone'), crests, { colors: true });
  instSet(archGeo, lam('lamp'), meds, { colors: true });
  instSet(boxGeo, lam('ink'), roofs);
  brickSplit(boxGeo, rails);
  instSet(boxGeo, lam('bone'), goods, { colors: true });
  instSet(cylGeo, lam('bone'), jars, { colors: true });
  instSet(boxGeo, lam('bone', { emissive: C('lamp'), emissiveIntensity: 0.18 }), signs, { colors: true });
  instSet(sphGeo, lam('verm', { emissive: C('verm'), emissiveIntensity: 0.4 }), lant, { colors: true });
  instSet(boxGeo, lam('bone'), fest, { colors: true });
  instSet(boxGeo, lam('bone'), figs, { colors: true });
  instSet(boxGeo, lam('haze'), veh, { colors: true });
})();
