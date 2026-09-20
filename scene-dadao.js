// scene-dadao.js — Dadaocheng 1930–2003. The Dihua Street arcade (sacks, jars, dried goods,
// tin signs), the temple forecourt, the wharf on the river, parked bicycles then scooters,
// and the 年貨大街 that fills the whole road once the tower era arrives.
(function () {
  if (!window.SCENE) return;
  const { part, instSet, only, C, boxGeo, anchors, PALETTE, rnd } = window.SCENE;

  const ALL = ['red', 'dadao', 'tower'], DT = ['dadao', 'tower'], RD = ['red', 'dadao'], T = ['tower'];
  const H = (r, d, t) => ({ red: r, dadao: d, tower: t });                       // instSet heights per era
  const LK = (hr, hd, ht, cr, cd, ct) => ({ red: { h: hr, col: cr || 'bone' }, dadao: { h: hd, col: cd || 'bone' }, tower: { h: ht, col: ct || 'bone' } });
  const lam = (col, extra) => new THREE.MeshLambertMaterial(Object.assign({ color: C(col) }, extra || {}));

  const D = anchors.dihua, G = anchors.chenghuang;
  const DZ = [0, 1, 2, 3, 4].map(i => D.z + 20 - i * 10);   // the five hero shophouses, z -200 … -240
  const FACE = D.x - 4.5;                                    // east arcade line (x 6.5)
  const PIL = D.x - 2.6 - 0.6;                               // front of the pilaster wall (x 7.8)
  const WALK = 0.22;                                         // top of the sidewalk slab

  // geometries, all with the base at y = 0
  const cylGeo = new THREE.CylinderGeometry(0.5, 0.5, 1, 10); cylGeo.translate(0, 0.5, 0);
  const sphGeo = new THREE.SphereGeometry(0.5, 8, 6); sphGeo.translate(0, 0.5, 0);
  const potGeo = new THREE.CylinderGeometry(0.5, 0.36, 1, 12); potGeo.translate(0, 0.5, 0);

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

  // ── the empty lots beside the hero row become plain shophouses so the arcade reads as one street
  part(10.5, 0, -171, 8, 10, LK(2.8, 5.5, 6.5, 'bone', 'bone', 'haze'));
  part(10.5, 0, -184, 8, 10, LK(2.8, 6, 6.5, 'bone', 'bone', 'haze'));
  part(-10.5, 0, -195, 7, 8, LK(2.8, 5, 5.5, 'bone', 'bone', 'bone'));   // herb shop, west
  part(-10.5, 0, -262, 7, 8, LK(2.8, 5.5, 6, 'bone', 'bone', 'haze'));   // tea shop, west

  // ── shop fronts: sacks, crates, jars, hanging dried goods, price boards, tin signs ──
  const goods = [], jars = [], signs = [];
  const shops = DZ.map(z => ({ fx: FACE, z, span: 9, hero: true })).concat([
    { fx: FACE, z: -171, span: 10 }, { fx: FACE, z: -184, span: 10 },
    { fx: -7, z: -195, span: 8 }, { fx: -7, z: -262, span: 8 },
  ]);
  shops.forEach((s, si) => {
    const side = Math.sign(s.fx), gx = s.fx - side * 0.25, hz = s.span / 2 - 0.6;
    // sacks along the first half of the front, some two high
    for (let i = 0; i < 4; i++) {
      const z = s.z - hz + 0.4 + i * 0.75 + (rnd() - 0.5) * 0.2;
      goods.push({ x: gx, y: WALK, z, w: 0.5, d: 0.6, r: (rnd() - 0.5) * 0.3, c: C(i === 1 ? 'haze' : 'bone'), h: H(0, 0.5, 0.5) });
      if (i % 2 === 0) goods.push({ x: gx, y: WALK + 0.5, z, w: 0.46, d: 0.55, r: (rnd() - 0.5) * 0.4, c: C('bone'), h: H(0, 0.42, 0.42) });
    }
    // hand-written price boards stuck in the piles: paper in the 80s, red paper after 1996
    for (let b = 0; b < 4; b++) {
      const z = s.z - hz + 0.5 + b * 0.75;
      goods.push({ x: gx - side * 0.24, y: WALK + (b % 2 ? 0.5 : 0.92), z, w: 0.04, d: 0.38, r: (rnd() - 0.5) * 0.3,
                   c: C(b < 2 ? 'bone' : 'verm'), h: b < 2 ? H(0, 0.42, 0.42) : H(0, 0, 0.46) });
    }
    // crates with jars on top, second half of the front
    for (let j = 0; j < 2; j++) {
      const z = s.z + hz - 0.6 - j * 1.15;
      goods.push({ x: gx, y: WALK, z, w: 0.5, d: 0.95, r: 0, c: C('haze'), h: H(0, 0.5, 0.5) });
      for (let k = 0; k < 3; k++) jars.push({ x: gx, y: WALK + 0.5, z: z - 0.32 + k * 0.32, w: 0.27, d: 0.27,
                                              c: C((k + j) % 3 === 1 ? 'lamp' : ((k + j) % 3 === 2 ? 'haze' : 'bone')), h: H(0, 0.36, 0.36) });
    }
    // a rod under the arcade lintel with dried goods hanging from it
    goods.push({ x: s.fx - side * 0.2, y: 3.0, z: s.z, w: 0.06, d: s.span - 1.4, r: 0, c: C('ink'), h: H(0, 0.06, 0.06) });
    for (let i = 0; i < 8; i++) {
      const z = s.z - hz + 0.3 + i * ((2 * hz - 0.6) / 7), hh = 0.5 + rnd() * 0.5;
      goods.push({ x: s.fx - side * 0.2, y: 3.0 - hh, z, w: 0.2, d: 0.3, r: (rnd() - 0.5) * 0.6,
                   c: C(i % 3 === 0 ? 'lamp' : (i % 3 === 1 ? 'haze' : 'bone')), h: H(0, hh, hh) });
    }
    // vertical tin signs, mounted edge-on to the facade so they read down the street
    const sx = s.hero ? PIL - 0.45 : s.fx - side * 0.45, sy = s.hero ? 4.0 : 2.7, sh = s.hero ? 3.2 : 2.3;
    [-1, 1].forEach((k, ki) => {
      const z = s.z + k * (s.span / 2 - 1.3), lampSign = (si + ki) % 3 === 0;
      signs.push({ x: sx, y: sy, z, w: 0.9, d: 0.12, r: 0, c: C(lampSign ? 'lamp' : 'bone'), h: H(0, sh, sh) });
      if (!lampSign) signs.push({ x: sx, y: sy + sh - 0.55, z, w: 0.92, d: 0.15, r: 0, c: C('verm'), h: H(0, 0.45, 0.45) });
    });
    // tower era: a second, denser layer of acrylic boxes sticking out over the arcade
    for (let a = 0; a < 3; a++) {
      const z = s.z - hz + 0.9 + a * (hz - 0.9) + (rnd() - 0.5) * 0.8, hh = 0.9 + rnd() * 1.2;
      const ww = s.hero ? 1.4 + rnd() * 0.5 : 1.0, ax = s.hero ? PIL - ww / 2 : s.fx - side * ww / 2;
      signs.push({ x: ax, y: 3.8 + rnd() * 2.4, z, w: ww, d: 0.14, r: 0, c: C(a % 2 ? 'lamp' : (rnd() < 0.5 ? 'bone' : 'haze')), h: H(0, 0, hh) });
    }
  });
  // painted shop names on the hero pilasters and the two west shops
  signPart('米行', 'bone', 'ink', true, 'z', PIL - 0.5, 4.2, DZ[0], 2.6, DT);
  signPart('南北貨', 'bone', 'ink', true, 'z', PIL - 0.5, 4.0, DZ[2], 3.4, DT);
  signPart('布莊', 'verm', 'bone', true, 'z', PIL - 0.5, 4.2, DZ[4], 2.6, DT);
  signPart('中藥', 'bone', 'ink', true, 'z', -7 + 0.5, 2.8, -195, 2.4, DT);
  signPart('茶行', 'lamp', 'ink', true, 'z', -7 + 0.5, 2.8, -262, 2.4, DT);
  // 百子櫃 — the herb shop's wall of little drawers, drawn to a canvas
  (() => {
    const cv = document.createElement('canvas'); cv.width = 256; cv.height = 192;
    const g = cv.getContext('2d');
    g.fillStyle = PALETTE.haze; g.fillRect(0, 0, 256, 192);
    for (let i = 0; i < 8; i++) for (let j = 0; j < 6; j++) {
      g.fillStyle = PALETTE.bone; g.fillRect(i * 32 + 3, j * 32 + 3, 26, 26);
      g.fillStyle = PALETTE.lamp; g.fillRect(i * 32 + 13, j * 32 + 13, 6, 6);
    }
    const p = part(-6.55, WALK, -195, 0.9, 3.4, only(DT, 2.4, 'bone'));
    p.mesh.material.map = new THREE.CanvasTexture(cv); p.mesh.material.needsUpdate = true;
  })();

  // ── the temple forecourt: incense, smoke, eave lanterns, a low wall, the old men's tea table ──
  const YZ = G.z + 11;   // the yard south of the hall, z ≈ -229
  part(G.x, 0, YZ, 1.4, 1.4, only(ALL, 1.2, 'ink'), 0, potGeo);              // incense burner
  part(G.x, 1.15, YZ, 1.75, 1.75, only(ALL, 0.14, 'ink'), 0, cylGeo);        // its rim
  part(G.x, 1.3, YZ, 0.12, 0.12, only(ALL, 2.6, 'bone'));                     // smoke
  part(G.x + 0.18, 1.3, YZ - 0.1, 0.08, 0.08, only(ALL, 3.4, 'bone'));
  part(G.x - 0.16, 1.3, YZ + 0.12, 0.1, 0.1, only(ALL, 2.0, 'bone'));
  part(G.x + 4.3, 0, YZ + 0.3, 0.25, 9, only(ALL, 0.7, 'bone'));             // low wall, road side
  part(G.x, 0, YZ + 4.7, 8.4, 0.25, only(ALL, 0.7, 'bone'));                 // low wall, south
  signPart('月老', 'verm', 'bone', true, 'x', G.x + 4.5, WALK, G.z + 6, 1.8, T); // the matchmaker board at the queue head
  const lant = [];
  [-14, -12, -10, -8].forEach(x => lant.push({ x, y: 3.7, z: G.z + 4.4, w: 0.5, d: 0.5, r: 0, c: C('verm'), h: H(0.5, 0.5, 0.5) }));
  [-1.5, 1.5].forEach(dz => lant.push({ x: G.x + 4.5, y: 3.7, z: G.z + dz, w: 0.5, d: 0.5, r: 0, c: C('verm'), h: H(0.5, 0.5, 0.5) }));

  // ── people: the 年貨大街 crowd in the road, the queue extended, the old men at the temple ──
  const figs = [];
  for (let i = 0; i < 170; i++) {
    const z = -196 - rnd() * 90, x = -4 + rnd() * 8, c = i % 10 === 0 ? 'verm' : (i % 3 === 0 ? 'haze' : 'bone');
    figs.push({ x, z, w: 0.5, d: 0.4, r: rnd() * 6.28, c: C(c), h: H(0, 0, 1.45 + rnd() * 0.3) });
  }
  for (let i = 0; i < 24; i++) {   // continues the engine's queue north along the temple's road face
    const qx = G.x + 4.8 + (i % 3) * 0.35, qz = G.z - 11.5 - i * 1.15 + (i % 2) * 0.25;
    figs.push({ x: qx, z: qz, w: 0.55, d: 0.45, r: 0, c: C(i % 6 === 0 ? 'verm' : 'bone'), h: H(0, 0, 1.55 + (i % 3) * 0.1) });
  }
  goods.push({ x: G.x - 2.2, z: YZ + 2, w: 0.8, d: 0.8, r: 0.3, c: C('haze'), h: H(0, 0.7, 0) });   // tea table, dadao
  [[-0.9, 0], [0.7, -0.5], [0.4, 0.8]].forEach(o => figs.push({ x: G.x - 2.2 + o[0], z: YZ + 2 + o[1], w: 0.55, d: 0.45, r: rnd() * 6, c: C('bone'), h: H(0, 1.25, 0) }));

  // ── the wharf on the river, west: pier and junks until the road took over; a park path since ──
  const PZ = -214;
  part(-25, -0.2, PZ, 8, 38, LK(0.6, 0.6, 0, 'haze', 'haze'));                       // pier deck
  const veh = [];
  for (let z = PZ - 17; z <= PZ + 17; z += 6.8) [-21.3, -28.7].forEach(x => veh.push({ x, y: -0.3, z, w: 0.3, d: 0.3, r: 0, c: C('ink'), h: H(1.1, 1.1, 0) }));
  for (let i = 0; i < 7; i++) goods.push({ x: -24 + rnd() * 3, y: 0.4, z: PZ - 15 + rnd() * 30, w: 0.9, d: 0.9, r: rnd() * 1.5, c: C(i % 2 ? 'bone' : 'haze'), h: H(0.7, 0.7, 0) });
  function junk(x, z, r, sail) {
    const sn = Math.sin(r), cs = Math.cos(r), off = dz => [x + dz * sn, z + dz * cs];
    const d = off(1.2), m = off(-1.3);
    part(x, -0.55, z, 2.8, 8, LK(1.3, 1.3, 0, 'bone', 'bone'), r);                   // hull, pale timber
    part(d[0], 0.75, d[1], 1.8, 2.6, LK(0.7, 0.7, 0, 'ink', 'ink'), r);              // deckhouse
    part(m[0], 0.75, m[1], 0.16, 0.16, LK(6.2, 6.2, 0, 'ink', 'ink'), r);            // mast
    part(m[0] + 0.12, 1.9, m[1], 0.06, 2.8, LK(4, 4, 0, sail, sail), r);             // sail
  }
  junk(-31.6, PZ + 11, 0.12, 'lamp');     // moored along the pier's river side
  junk(-32.2, PZ - 3, -0.1, 'bone');
  junk(-31.4, PZ - 15, 0.06, 'lamp');
  part(-21.5, 0, PZ + 8, 3, 80, only(T, 0.1, 'bone'));                               // riverside path, tower
  part(-23.1, 0, PZ + 8, 0.08, 80, only(T, 0.9, 'haze'));                            // its railing
  for (let i = 0; i < 8; i++) veh.push({ x: -21.6 + (rnd() - 0.5) * 0.8, z: PZ + 40 - i * 9.5, w: 0.18, d: 1.5, r: 0.35 + rnd() * 0.3, c: C('haze'), h: H(0, 0, 0.85) });

  // ── parked at the kerb: bicycles and tricycles, then rows of scooters ──
  const kerbs = [{ x: 6.25, z0: -168, z1: -244 }, { x: -6.3, z0: -156, z1: -175 }, { x: -6.3, z0: -186, z1: -205 }, { x: -6.3, z0: -215, z1: -234 }, { x: -6.3, z0: -246, z1: -274 }];
  kerbs.forEach((k, ki) => {
    for (let z = k.z0; z > k.z1; z -= 3.4) if (rnd() < 0.7)
      veh.push({ x: k.x, y: WALK, z, w: 0.18, d: 1.6, r: (rnd() - 0.5) * 0.3, c: C(rnd() < 0.8 ? 'haze' : 'ink'), h: H(0, 0.9, 0) });
    if (ki < 4) for (let z = k.z0 - 0.5; z > k.z1; z -= 0.74)   // scooter rows, not where the queue stands
      veh.push({ x: k.x, y: WALK, z, w: 0.5, d: 1.7, r: (rnd() - 0.5) * 0.2, c: C(rnd() < 0.85 ? 'haze' : 'bone'), h: H(0, 0, 0.85) });
  });
  [[6.35, -192], [6.35, -250], [-6.4, -161], [-6.4, -209], [-6.4, -228]].forEach(t => {     // tricycles, dadao
    veh.push({ x: t[0], y: WALK, z: t[1], w: 0.8, d: 1.9, r: 0, c: C('haze'), h: H(0, 0.75, 0) });
    veh.push({ x: t[0], y: WALK + 1.35, z: t[1], w: 0.8, d: 1.2, r: 0, c: C('bone'), h: H(0, 0.1, 0) });
    veh.push({ x: t[0], y: WALK + 0.75, z: t[1] - 0.5, w: 0.05, d: 0.05, r: 0, c: C('ink'), h: H(0, 0.6, 0) });
  });

  // ── 年貨大街, tower era only: lantern strings over the road, banners, stalls, the crowd ──
  const fest = [];
  for (let k = 0; k < 8; k++) {
    const z = -198 - k * 12;
    fest.push({ x: 0, y: 7.4, z, w: 12.9, d: 0.04, r: 0, c: C('ink'), h: H(0, 0, 0.04) });
    for (let i = 0; i <= 10; i++) lant.push({ x: -5 + i, y: 6.9, z, w: 0.5, d: 0.5, r: 0, c: C('verm'), h: H(0, 0, 0.5) });
  }
  [-1, 1].forEach(side => { for (let k = 0; k < 15; k++) {
    const z = -199 - k * 6 + (rnd() - 0.5) * 1.5, x = side * 5.0;
    fest.push({ x, z, w: 1.6, d: 3.0, r: 0, c: C('haze'), h: H(0, 0, 0.9) });                              // table
    fest.push({ x, y: 0.9, z, w: 1.2, d: 2.4, r: 0, c: C(k % 2 ? 'lamp' : 'bone'), h: H(0, 0, 0.35) });     // the goods
    fest.push({ x, y: 2.25, z, w: 2.2, d: 3.6, r: 0, c: C(k % 3 === 0 ? 'verm' : 'bone'), h: H(0, 0, 0.12) }); // canopy
    fest.push({ x: x - side * 0.9, z: z - 1.6, w: 0.07, d: 0.07, r: 0, c: C('ink'), h: H(0, 0, 2.25) });
    fest.push({ x: x - side * 0.9, z: z + 1.6, w: 0.07, d: 0.07, r: 0, c: C('ink'), h: H(0, 0, 2.25) });
  } });
  shops.forEach(s => { const side = Math.sign(s.fx); fest.push({ x: s.fx - side * 0.05, y: 1.9, z: s.z, w: 0.06, d: s.span * 0.6, r: 0, c: C('verm'), h: H(0, 0, 0.9) }); });
  signPart('年貨大街', 'verm', 'bone', false, 'z', 0, 8.1, -193, 1.5, T);
  signPart('恭喜發財', 'verm', 'bone', false, 'z', 0, 8.1, -252, 1.5, T);

  // ── presence drivers ──
  // instSet collapses an absent item to 0.0001 tall but keeps its footprint, so a canopy or a
  // lantern would still show as a flat plane in the wrong era. liftTops() sets every item's y from
  // item.yOf.cur, so each item gets an invisible driver instance whose "height" is the y it sits
  // at when present and -60 (underground) when absent. Items sink and rise with the era flip.
  const drivers = [], drvMap = {};
  function sink(items) {
    items.forEach(it => {
      const y = it.y || 0, eras = ALL.filter(k => it.h[k] > 0), key = y.toFixed(3) + '|' + eras.join();
      if (!drvMap[key]) { const h = {}; ALL.forEach(k => h[k] = eras.indexOf(k) >= 0 ? y : -60); drivers.push(drvMap[key] = { x: 0, z: 0, w: 0.0001, d: 0.0001, h }); }
      it.yOf = drvMap[key];
    });
  }
  [goods, jars, signs, lant, fest, figs, veh].forEach(sink);
  instSet(boxGeo, lam('ink'), drivers);

  // ── the instanced sets ──
  instSet(boxGeo, lam('bone'), goods, { colors: true });
  instSet(cylGeo, lam('bone'), jars, { colors: true });
  instSet(boxGeo, lam('bone', { emissive: C('lamp'), emissiveIntensity: 0.18 }), signs, { colors: true });
  instSet(sphGeo, lam('verm', { emissive: C('verm'), emissiveIntensity: 0.4 }), lant, { colors: true });
  instSet(boxGeo, lam('bone'), fest, { colors: true });
  instSet(boxGeo, lam('bone'), figs, { colors: true });
  instSet(boxGeo, lam('haze'), veh, { colors: true });
})();
