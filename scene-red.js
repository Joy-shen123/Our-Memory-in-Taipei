// scene-red.js — Ximen Red House, 1908–1929. Market district around the octagon, the old
// West Gate wall remnant at the street start, Japanese-era shopfronts on the west side.
// Everything is boxes, cylinders and cones; five colours; one canvas texture per signboard.
(function () {
  if (!window.SCENE) return;
  const { part, instSet, only, C, boxGeo, PALETTE, rnd, anchors } = window.SCENE;
  const RH = anchors.redhouse;              // { x: 11, z: -70 } — the octagon, east side
  const RED = ['red'], ALL3 = ['red', 'dadao', 'tower'];

  // ── shared geometry ─────────────────────────────────────────────────────────
  const pyr = new THREE.CylinderGeometry(0, 1, 1, 4); pyr.translate(0, 0.5, 0);           // hip roof / tent top
  const wheelGeo = new THREE.CylinderGeometry(0.5, 0.5, 0.15, 10); wheelGeo.rotateZ(Math.PI / 2); wheelGeo.translate(0, 0.5, 0);
  const basketGeo = new THREE.CylinderGeometry(0.5, 0.38, 1, 8); basketGeo.translate(0, 0.5, 0);
  const planeGeo = new THREE.PlaneGeometry(1, 1); planeGeo.translate(0, 0.5, 0);           // faces +z, base at y=0

  // item buckets, one InstancedMesh each
  const furn = [];      // boxes with per-instance colour: stalls, carts, benches, awnings, noren, wall tops…
  const lanterns = [];  // lamp cubes, emissive
  const wheels = [];    // cart / rickshaw wheels
  const baskets = [];   // cylinders
  const crowd = [];     // small figures
  const hOf = (h, eras) => { const o = {}; eras.forEach(k => o[k] = h); return o; };
  const F = (x, z, y, w, d, h, col, eras) => furn.push({ x, z, y: y || 0, w, d, h: hOf(h, eras || RED), c: C(col) });

  // ── signboards: canvas text, system font ────────────────────────────────────
  function signTex(lines, bg, fg, w, h, border) {
    const cv = document.createElement('canvas'); cv.width = w; cv.height = h;
    const g = cv.getContext('2d');
    g.fillStyle = PALETTE[bg]; g.fillRect(0, 0, w, h);
    if (border) { g.strokeStyle = PALETTE[border]; g.lineWidth = h * 0.05; g.strokeRect(h * 0.1, h * 0.1, w - h * 0.2, h - h * 0.2); }
    g.fillStyle = PALETTE[fg]; g.textAlign = 'center'; g.textBaseline = 'middle';
    lines.forEach(L => {                                                          // shrink any line that would overflow the board
      const font = px => `700 ${px}px -apple-system, "Helvetica Neue", Helvetica, Arial, sans-serif`;
      g.font = font(L.size);
      const tw = g.measureText(L.text).width, max = w * 0.86;
      if (tw > max) g.font = font(Math.floor(L.size * max / tw));
      g.fillText(L.text, w / 2, L.y);
    });
    return new THREE.CanvasTexture(cv);
  }
  function signPart(x, y, z, w, h, look, tex, rotY) {
    const p = part(x, y, z, w, 1, look, rotY || 0, planeGeo);
    const m = p.mesh.material;
    m.map = tex; m.emissiveMap = tex; m.emissive = C('bone'); m.emissiveIntensity = 0.7; m.needsUpdate = true; // letters stay legible through the print pass
    return p;
  }
  // 'WEST GATE MARKET 1908' over the camera-facing face of the octagon, red era only
  signPart(RH.x, 3.65, RH.z + 5.15, 6.4, 1.3, only(RED, 1.3, 'bone'),
    signTex([{ text: 'WEST GATE MARKET', size: 118, y: 100 }, { text: '1908', size: 82, y: 200 }], 'ink', 'bone', 1024, 256, 'verm'));
  // modern plaza sign, tower era only: a board on a post at the plaza corner
  part(12.5, 0, -47.4, 0.16, 0.16, only(['tower'], 1.3, 'ink'));
  signPart(12.5, 1.3, -47.3, 3.2, 1.2, only(['tower'], 1.2, 'bone'),
    signTex([{ text: 'RED HOUSE', size: 120, y: 118 }, { text: 'XIMEN · SINCE 1908', size: 52, y: 230 }], 'bone', 'ink', 768, 288));

  // ── the old city wall / West Gate remnant, z≈+26, red era only ──────────────
  (() => {
    [-1, 1].forEach(s => {
      part(s * 22.5, 0, 26, 29, 2.4, only(RED, 2.6, 'bone'));                   // long low wall, road left open
      part(s * 8.4, 0, 26, 2.6, 3.4, only(RED, 4.4, 'bone'));                   // gate pier
      part(s * 8.4, 4.4, 26, 2.4, 2.4, only(RED, 1.1, 'ink'), Math.PI / 4, pyr); // pier cap
      for (let x = 10.6; x < 36; x += 1.7) F(s * x, 26, 2.6, 0.8, 0.9, 0.6, 'ink'); // crenellations
    });
    for (let i = 0; i < 8; i++) { // a few people passing the gate
      const s = i % 2 ? 1 : -1;
      crowd.push({ x: s * (6.6 + rnd() * 2), z: 29 + rnd() * 8, w: 0.5, d: 0.4, r: rnd() * 6.28, c: C(i === 3 ? 'verm' : 'bone'), h: { red: 1.5 + rnd() * 0.3 } });
    }
  })();

  // ── Japanese-era shopfronts: hip roofs, eave slabs, awnings, noren, eave lanterns ──
  // fronts: [x centre of tile, z centre, height in red]. West side x=-10, east side x=11.
  const fronts = [[-10, -10, 3.5], [-10, -30, 3.5], [-10, -60, 4], [-10, -90, 3.5], [-10, -120, 4],
                  [11, -10, 3.5], [11, -40, 3.5], [11, -100, 4], [11, -130, 4]];
  fronts.forEach(([x, z, h], i) => {
    const s = x < 0 ? -1 : 1, fx = s * 6;                                        // facade plane at |x| = 6
    F(x, z, h, 9.2, 9.2, 0.25, 'ink');                                           // eave slab (instanced)
    part(x, h + 0.25, z, 6.5, 6.5, only(RED, 1.8, 'haze'), Math.PI / 4, pyr);  // tiled hip roof
    F(fx - s * 0.6, z, 3.05, 1.2, 7.6, 0.2, 'ink');                               // awning over the door
    const cloth = h === 4 ? 'bone' : 'haze';                                       // noren: dark on the pale shophouses, pale on the haze markets
    [-2.2, 2.2].forEach(dz => {
      F(fx - s * 0.12, z + dz, 1.8, 0.08, 1.6, 1.2, cloth);
      F(fx - s * 0.18, z + dz, 2.2, 0.1, 0.5, 0.45, cloth === 'haze' ? 'bone' : 'haze'); // the shop's character
      F(fx - s * 0.16, z + dz, 3.0 - 0.3, 0.1, 1.6, 0.3, i % 3 === 0 ? cloth : 'verm');
    });
    [-3.1, -1.1, 1.1, 3.1].forEach((dz, j) => lanterns.push({ x: fx - s * 0.35, z: z + dz, y: 2.45, w: 0.42, d: 0.42, h: { red: 0.5, dadao: j % 2 ? 0.5 : 0 } }));
  });

  // ── the market square in front of the Red House (+z side) and behind it ─────
  part(14.4, 0, -54.5, 10.4, 18, { red: { h: 0.06, col: 'haze' }, dadao: { h: 0.06, col: 'haze' }, tower: { h: 0.08, col: 'bone' } }); // packed earth → plaza paving
  part(14.4, 0, -84, 10.4, 12, { red: { h: 0.06, col: 'haze' }, dadao: { h: 0.06, col: 'haze' }, tower: { h: 0.08, col: 'bone' } });

  const stalls = [];
  [-49, -54.5, -60].forEach(z => [9.6, 12.6, 15.6, 18.6].forEach(x => stalls.push([x, z])));
  [-80, -86].forEach(z => [9.6, 12.6, 15.6].forEach(x => stalls.push([x, z])));
  stalls.forEach(([sx, sz], i) => {
    const era = i % 3 === 0 ? { red: 1, dadao: 0 } : { red: 1, dadao: 1 };
    const H = k => ({ red: k * era.red, dadao: k * era.dadao });
    const push = (x, z, y, w, d, h, col) => furn.push({ x, z, y, w, d, h: H(h), c: C(col) });
    push(sx, sz + 0.5, 0, 2.2, 1.0, 0.85, 'haze');                                      // counter
    [-1.1, 1.1].forEach(dx => { push(sx + dx, sz + 1.0, 0, 0.1, 0.1, 2.2, 'ink'); push(sx + dx, sz - 0.9, 0, 0.1, 0.1, 2.4, 'ink'); }); // posts
    push(sx, sz, 2.2, 2.6, 2.2, 0.12, i % 4 === 1 ? 'verm' : 'bone');                     // awning
    push(sx - 0.45 + rnd() * 0.9, sz + 0.5, 0.85, 0.55, 0.45, 0.3, i % 2 ? 'lamp' : 'bone'); // goods on the counter
    // crates and baskets beside the stall
    const cx = sx + (i % 2 ? 1.5 : -1.5), cz = sz + 0.3 + rnd() * 0.6;
    furn.push({ x: cx, z: cz, y: 0, w: 0.6, d: 0.6, h: H(0.55), c: C('bone'), r: rnd() * 0.5 });
    if (i % 2) furn.push({ x: cx, z: cz, y: 0.55, w: 0.55, d: 0.55, h: H(0.5), c: C('haze'), r: rnd() * 0.5 });
    baskets.push({ x: sx + (i % 2 ? -1.4 : 1.4), z: sz + 1.2 + rnd() * 0.3, w: 0.7, d: 0.7, h: H(0.4), c: C(i % 3 ? 'bone' : 'haze') });
    // people at the stall: a seller behind, a shopper or two in front
    crowd.push({ x: sx + 0.3, z: sz - 0.3, w: 0.5, d: 0.4, r: 3.1, c: C('haze'), h: H(1.6) });
    const n = 1 + Math.floor(rnd() * 2);
    for (let k = 0; k < n; k++) crowd.push({ x: sx - 1 + rnd() * 2, z: sz + 1.8 + rnd() * 1.4, w: 0.5, d: 0.4, r: rnd() * 6.28,
                                            c: C(rnd() < 0.12 ? 'verm' : rnd() < 0.5 ? 'bone' : 'haze'), h: { red: 1.5 + rnd() * 0.3, dadao: k === 0 ? 1.6 : 0 } });
  });
  // lantern poles around the square, with strings of lanterns between them
  [[8.4, -47], [8.4, -63.2], [19.8, -47], [19.8, -63.2], [8.4, -78], [19.8, -78]].forEach(([x, z]) => {
    F(x, z, 0, 0.14, 0.14, 3.1, 'haze', ['red', 'dadao']);
    lanterns.push({ x, z, y: 2.6, w: 0.55, d: 0.55, h: { red: 0.6, dadao: 0.6 } });
  });
  [-47, -63.2].forEach(z => {
    F(14.1, z, 3.05, 11.4, 0.04, 0.04, 'ink', ['red', 'dadao']);                  // the string
    for (let x = 9.8; x < 19; x += 1.55) lanterns.push({ x, z, y: 2.65, w: 0.36, d: 0.36, h: { red: 0.4, dadao: 0.4 } });
  });
  // handcarts in the square, red and dadao
  [[17.6, -63.4], [9.4, -83.5]].forEach(([x, z]) => {
    const H = k => ({ red: k, dadao: k });
    furn.push({ x, z, y: 0.55, w: 1.1, d: 1.9, h: H(0.18), c: C('bone') });
    [-0.4, 0.4].forEach(dx => furn.push({ x: x + dx, z: z + 1.4, y: 0.5, w: 0.06, d: 1.4, h: H(0.06), c: C('ink') }));
    furn.push({ x: x - 0.2, z: z - 0.2, y: 0.73, w: 0.55, d: 0.55, h: H(0.5), c: C('haze') });
    [-0.6, 0.6].forEach(dx => wheels.push({ x: x + dx, z, w: 1, d: 0.9, h: H(0.9) }));
  });

  // ── parked at the roadside: rickshaws and a horse cart (red), a scooter cluster (tower) ──
  [[5.0, -56.5, 'verm'], [5.0, -59.6, 'ink']].forEach(([x, z, col]) => {          // rickshaws, east kerb
    F(x, z, 0.65, 0.9, 0.8, 0.55, 'ink'); F(x, z - 0.38, 0.65, 0.9, 0.12, 1.25, col);
    F(x, z - 0.05, 1.8, 1.0, 0.8, 0.18, 'ink');
    [-0.4, 0.4].forEach(dx => F(x + dx, z + 1.05, 0.62, 0.06, 1.7, 0.06, 'ink'));
    [-0.55, 0.55].forEach(dx => wheels.push({ x: x + dx, z, w: 1, d: 1.15, h: { red: 1.15 } }));
  });
  (() => {                                                                         // horse cart, west kerb
    const x = -4.9, z = -76;
    F(x, z, 0.78, 1.5, 2.6, 0.28, 'haze');
    [-0.72, 0.72].forEach(dx => F(x + dx, z, 1.06, 0.08, 2.6, 0.42, 'ink'));
    [-0.45, 0.45].forEach(dx => F(x + dx, z + 1.9, 0.85, 0.07, 1.6, 0.07, 'ink'));
    [-0.85, 0.85].forEach(dx => wheels.push({ x: x + dx, z: z - 0.3, w: 1, d: 1.3, h: { red: 1.3 } }));
    F(x, z + 2.75, 0.95, 0.6, 1.5, 0.7, 'haze');                                    // horse
    F(x, z + 3.65, 1.35, 0.35, 0.75, 0.55, 'haze');
    [[-0.2, -0.55], [0.2, -0.55], [-0.2, 0.55], [0.2, 0.55]].forEach(([dx, dz]) => F(x + dx, z + 2.75 + dz, 0, 0.13, 0.13, 0.95, 'ink'));
  })();
  for (let i = 0; i < 12; i++) {                                                   // scooters, tower era, same kerbs
    const east = i < 7, x = east ? 5.2 : -5.2, z = east ? -55 - i * 0.95 : -73 - (i - 7) * 0.95;
    furn.push({ x, z, y: 0.25, w: 0.55, d: 1.6, h: { tower: 0.55 }, c: C('haze'), r: (rnd() - 0.5) * 0.3 });
    furn.push({ x, z: z - 0.1, y: 0.8, w: 0.5, d: 0.7, h: { tower: 0.16 }, c: C(i % 4 === 0 ? 'verm' : 'ink'), r: (rnd() - 0.5) * 0.3 });
  }

  // ── tower era: the plaza — benches and two creative-market tents ─────────────
  [[9.9, -49], [9.9, -58.5], [18.7, -49], [18.7, -58.5], [14.2, -62.6]].forEach(([x, z]) => {
    furn.push({ x, z, y: 0.42, w: 1.8, d: 0.5, h: { tower: 0.1 }, c: C('bone') });
    [-0.75, 0.75].forEach(dx => furn.push({ x: x + dx, z, y: 0, w: 0.12, d: 0.5, h: { tower: 0.42 }, c: C('haze') }));
  });
  [[11.2, -52.5, 'bone'], [16.4, -57.5, 'verm']].forEach(([x, z, col]) => {
    part(x, 2.3, z, 2.5, 2.5, only(['tower'], 1.1, col), Math.PI / 4, pyr);       // tent top
    [[-1.4, -1.4], [1.4, -1.4], [-1.4, 1.4], [1.4, 1.4]].forEach(([dx, dz]) => furn.push({ x: x + dx, z: z + dz, y: 0, w: 0.1, d: 0.1, h: { tower: 2.3 }, c: C('haze') }));
    furn.push({ x, z: z + 0.6, y: 0, w: 2.2, d: 0.8, h: { tower: 0.85 }, c: C('bone') });
  });
  for (let i = 0; i < 10; i++) crowd.push({ x: 9 + rnd() * 10, z: -63 + rnd() * 16, w: 0.5, d: 0.4, r: rnd() * 6.28, c: C(i % 5 === 0 ? 'verm' : 'bone'), h: { tower: 1.6 } });

  // ── raised items: a zero-height box still draws its top face, so while an item's era height
  //    is 0 its base goes underground. The engine reads it.y every frame, after setting it.cur.
  [furn, lanterns, wheels, baskets, crowd].forEach(items => items.forEach(it => {
    if (!(it.y > 0)) return;
    const base = it.y;
    Object.defineProperty(it, 'y', { get() { return (it.cur || 0) > 0.02 ? base : -40; }, set() {} });
  }));

  // ── build the instanced sets ────────────────────────────────────────────────
  instSet(boxGeo, new THREE.MeshLambertMaterial({ color: C('bone') }), furn, { colors: true });
  instSet(boxGeo, new THREE.MeshLambertMaterial({ color: C('lamp'), emissive: C('lamp'), emissiveIntensity: 0.55 }), lanterns);
  instSet(wheelGeo, new THREE.MeshLambertMaterial({ color: C('ink') }), wheels);
  instSet(basketGeo, new THREE.MeshLambertMaterial({ color: C('bone') }), baskets, { colors: true });
  instSet(boxGeo, new THREE.MeshLambertMaterial({ color: C('bone') }), crowd, { colors: true });
})();
