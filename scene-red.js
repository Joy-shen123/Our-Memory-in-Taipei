// scene-red.js — Ximen Red House, 1908–1929. Market district around the octagon, the old
// West Gate wall remnant at the street start, Japanese-era shopfronts on the west side.
// Everything is boxes, cylinders and cones; five colours; one canvas texture per signboard.
(function () {
  if (!window.SCENE) return;
  const { part, instSet, only, C, boxGeo, PALETTE, rnd, anchors } = window.SCENE;
  const RH = anchors.redhouse;              // { x: 11, z: -70 } — the octagon, east side
  const RED = ['red'];

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
    m.map = tex; m.emissiveMap = tex; m.emissive = C('bone'); m.emissiveIntensity = 0.45; m.needsUpdate = true; // the board stays bone on its unlit face
    return p;
  }
  // 'WEST GATE MARKET 1908': a gateway board on two posts at the back of the market square,
  // facing the camera, red era only. It stands clear of whichever Red House is built behind it
  // (the asset-library octagon reaches z≈-63). Ink on bone: dark strokes on pale ground read at distance.
  (() => {
    const x = 12, z = -61.9;
    [-3.5, 3.5].forEach(dx => part(x + dx, 0, z, 0.16, 0.16, only(RED, 3.2, 'ink')));
    part(x, 3.1, z, 7.6, 0.14, only(RED, 0.12, 'ink'));                                       // top rail
    signPart(x, 3.2, z, 7.4, 2.0, only(RED, 2.0, 'bone'),
      signTex([{ text: 'XIMENDING', size: 124, y: 96 }, { text: 'WEST GATE MARKET', size: 72, y: 206 }], 'bone', 'ink', 1024, 276, 'verm'));
  })();
  // modern plaza sign, tower era only: a board on a post at the plaza corner
  part(12.5, 0, -47.4, 0.16, 0.16, only(['tower'], 1.3, 'ink'));
  signPart(12.5, 1.3, -47.3, 3.2, 1.2, only(['tower'], 1.2, 'bone'),
    signTex([{ text: 'RED HOUSE', size: 120, y: 118 }, { text: 'XIMEN · SINCE 1908', size: 52, y: 230 }], 'bone', 'ink', 768, 288));

  // (the 1908 city-wall remnant was removed: this chapter is Ximending 1985–1999)

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

  // ── one market stall: post-and-awning, counter, goods, crates, basket, seller and shoppers ──
  // (sx, sz) is the stall centre; (fx, fz) a unit vector pointing to its front (where shoppers stand).
  // Counters and posts are bone/ink so they read against the haze ground; the awning carries the colour.
  const EVERY = (i) => (i % 3 === 0 ? { red: 1, dadao: 0 } : { red: 1, dadao: 1 });   // a third of the stalls are gone by the 1930s
  function stall(sx, sz, fx, fz, i, era, front) {
    const H = k => ({ red: k * era.red, dadao: k * era.dadao });
    const along = (u, v) => [sx + fx * u - fz * v, sz + fz * u + fx * v];          // u = toward the front, v = lateral
    const dims = (a, b) => fz ? [b, a] : [a, b];                                    // [w, d] for depth a (along front), width b (lateral)
    const push = (u, v, y, a, b, h, col) => { const [x, z] = along(u, v); const [w, d] = dims(a, b); furn.push({ x, z, y, w, d, h: H(h), c: C(col) }); };
    push(0.5, 0, 0, 1.0, 2.2, 0.85, 'bone');                                        // counter
    [-1.1, 1.1].forEach(v => { push(1.0, v, 0, 0.1, 0.1, 2.2, 'ink'); push(-0.9, v, 0, 0.1, 0.1, 2.4, 'ink'); }); // posts
    push(0, 0, 2.2, 2.2, 2.6, 0.12, i % 4 === 1 ? 'verm' : 'bone');                 // awning
    push(0.5, -0.45 + rnd() * 0.9, 0.85, 0.45, 0.55, 0.3, i % 2 ? 'lamp' : 'bone'); // goods on the counter
    // crates and a basket beside the stall
    const cv = i % 2 ? 1.5 : -1.5, cu = 0.3 + rnd() * 0.6;
    const [cx, cz] = along(cu, cv);
    furn.push({ x: cx, z: cz, y: 0, w: 0.6, d: 0.6, h: H(0.55), c: C('bone'), r: rnd() * 0.5 });
    if (i % 2) furn.push({ x: cx, z: cz, y: 0.55, w: 0.55, d: 0.55, h: H(0.5), c: C('haze'), r: rnd() * 0.5 });
    const [bx, bz] = along(1.2 + rnd() * 0.3, -cv * 0.93);
    baskets.push({ x: bx, z: bz, w: 0.7, d: 0.7, h: H(0.4), c: C(i % 3 ? 'bone' : 'haze') });
    // people: a seller behind the counter, a shopper or two in front
    const [ex, ez] = along(-0.3, 0.3);
    crowd.push({ x: ex, z: ez, w: 0.5, d: 0.4, r: fz ? 3.1 : (fx > 0 ? 1.57 : -1.57), c: C('haze'), h: H(1.6) });
    const n = 1 + Math.floor(rnd() * 2), [u0, u1] = front || [1.8, 3.2];
    for (let k = 0; k < n; k++) {
      const [px, pz] = along(u0 + rnd() * (u1 - u0), -1 + rnd() * 2);
      crowd.push({ x: px, z: pz, w: 0.5, d: 0.4, r: rnd() * 6.28, c: C(rnd() < 0.12 ? 'verm' : rnd() < 0.5 ? 'bone' : 'haze'),
                   h: { red: 1.5 + rnd() * 0.3, dadao: k === 0 ? 1.6 * era.dadao : 0 } });
    }
  }

  // ── the market square in front of the Red House (+z side) and behind it ─────
  part(14.4, 0, -54.5, 10.4, 18, { red: { h: 0.06, col: 'haze' }, dadao: { h: 0.06, col: 'haze' }, tower: { h: 0.08, col: 'bone' } }); // packed earth → plaza paving
  part(14.4, 0, -84, 10.4, 12, { red: { h: 0.06, col: 'haze' }, dadao: { h: 0.06, col: 'haze' }, tower: { h: 0.08, col: 'bone' } });

  const square = [];
  [-49, -54.5, -60].forEach(z => [9.6, 12.6, 15.6, 18.6].forEach(x => square.push([x, z])));
  [-80, -86].forEach(z => [9.6, 12.6, 15.6].forEach(x => square.push([x, z])));
  square.forEach(([x, z], i) => stall(x, z, 0, 1, i, EVERY(i)));                   // all face +z, toward the camera

  // ── kerb stalls: a row on each sidewalk facing the road, so the market is in view from the
  //    street itself. Sidewalk spans |x| 6..9.2; the stall sits at 6.9..8.8 and its shoppers on
  //    the kerb edge. Rows avoid the shopfront lots, the lamp posts and the horse cart.
  const kerb = [[1, -19], [1, -25], [1, -38], [1, -44], [-1, -45], [-1, -51], [-1, -66], [-1, -72], [-1, -80]];
  kerb.forEach(([s, z], i) => stall(s * 7.9, z, -s, 0, i + 5, EVERY(i + 1), [1.3, 2.0]));

  // lantern poles around the square, with strings of lanterns between them
  [[8.4, -47], [8.4, -63.2], [19.8, -47], [19.8, -63.2], [8.4, -78], [19.8, -78]].forEach(([x, z]) => {
    F(x, z, 0, 0.14, 0.14, 3.1, 'bone', ['red', 'dadao']);
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

  // ── the street crowd: people along both kerbs the whole chapter, so someone is always in
  //    frame. Thick in 1908, thinner in the 1930s, a few left today. They stand on the kerb line
  //    (|x| 5.3..6.4), clear of the shops at |x|>6.6, the rickshaws, the horse cart and the camera.
  (() => {
    let n = 0;
    while (n < 34) {
      const s = n % 2 ? 1 : -1, z = -5 - rnd() * 125, x = s * (5.3 + rnd() * 1.1);
      if (s < 0 && z < -29 && z > -39) continue;                                   // camera keyframe (-3, 3.5, -34)
      if (s > 0 && z < -54 && z > -61) continue;                                   // rickshaws
      if (s < 0 && z < -71 && z > -81) continue;                                   // horse cart
      n++;
      const c = n % 8 === 0 ? 'verm' : n % 3 === 0 ? 'haze' : 'bone';
      crowd.push({ x, z, w: 0.5, d: 0.4, r: rnd() * 6.28, c: C(c), h: { red: 1.5 + rnd() * 0.3, dadao: n % 2 ? 1.6 : 0, tower: n % 3 === 0 ? 1.6 : 0 } });
    }
  })();

  // ── parked at the roadside: a scooter cluster, every era ──
  for (let i = 0; i < 12; i++) {                                                   // scooters, tower era, same kerbs
    const east = i < 7, x = east ? 5.2 : -5.2, z = east ? -55 - i * 0.95 : -73 - (i - 7) * 0.95;
    furn.push({ x, z, y: 0.25, w: 0.55, d: 1.6, h: { red: 0.55, dadao: 0.55, tower: 0.55 }, c: C('haze'), r: (rnd() - 0.5) * 0.3 });
    furn.push({ x, z: z - 0.1, y: 0.8, w: 0.5, d: 0.7, h: { red: 0.16, dadao: 0.16, tower: 0.16 }, c: C(i % 4 === 0 ? 'verm' : 'ink'), r: (rnd() - 0.5) * 0.3 });
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

  // ── every figure gets a head: body shortened to 78%, a small cube on top. Ink head on a bone
  //    body (hair), bone head on the rest (skin). Turns the kerb-side boxes into people.
  const BONE = C('bone').getHex();
  crowd.slice().forEach(it => {
    const hb = {}, hh = {}; let top = 0;
    Object.keys(it.h).forEach(k => { const v = it.h[k] || 0; hb[k] = v * 0.78; hh[k] = v > 0 ? 0.34 : 0; top = Math.max(top, v * 0.78); });
    it.h = hb;
    crowd.push({ x: it.x, z: it.z, y: top + 0.02, w: 0.34, d: 0.34, r: it.r, c: C(it.c.getHex() === BONE ? 'ink' : 'bone'), h: hh });
  });

  // Raised items (y > 0) need no guard here: the engine drops an instance whose era height is 0
  // to y = -50, so nothing hangs in the sky while it is absent.

  // ── build the instanced sets ────────────────────────────────────────────────
  instSet(boxGeo, new THREE.MeshLambertMaterial({ color: C('bone') }), furn, { colors: true });
  instSet(boxGeo, new THREE.MeshLambertMaterial({ color: C('lamp'), emissive: C('lamp'), emissiveIntensity: 0.55 }), lanterns);
  instSet(wheelGeo, new THREE.MeshLambertMaterial({ color: C('ink') }), wheels);
  instSet(basketGeo, new THREE.MeshLambertMaterial({ color: C('bone') }), baskets, { colors: true });
  instSet(boxGeo, new THREE.MeshLambertMaterial({ color: C('bone') }), crowd, { colors: true });
})();
