// scene-tower.js — chapter scene detail: Taipei 101, 2004–now. Xinyi at night.
// Region z -290 … -460. Everything modern exists in the tower era only; the same ground
// carries rice paddies and farmhouses in the two earlier eras, so scrolling back reads
// "fields, then the tallest building on earth". Primitives only, five colours only.
//
// Instancing rule learned the hard way: app.js collapses an instanced item to a plate at its
// own y in the eras where its height is 0 (it never hides it). So no instanced item here is
// raised off the ground. Anything that used to be a raised box (tree crown, flag, traffic-light
// head, taxi cabin, planter plant) is now one compound geometry with its base at y = 0, coloured
// per vertex, and lifted a hair so the collapsed plate sits just under the ground plane.
(function () {
  if (!window.SCENE) return;
  const { part, instSet, only, C, boxGeo, PALETTE, rnd, TOWER } = window.SCENE;

  const tw = h => ({ red: 0, dadao: 0, tower: h });      // instSet heights: tower era only
  const old = h => ({ red: h, dadao: h, tower: 0 });     // instSet heights: fields era only
  const TW = (h, col) => only(['tower'], h, col);        // part look: tower era only
  const OLD = (h, col) => only(['red', 'dadao'], h, col);
  const TZ = TOWER.z, TH = TOWER.h;

  // ── compound geometry: several boxes merged, base at y = 0, height normalised to 1 ──
  // pieces: { x, y, z, w, h, d, col } in world units (y = base of that box). H = total height.
  // The whole thing is nudged up by LIFT so the era-collapsed plate (scale.y ≈ 0) lands at
  // y = -LIFT, under the ground plane, instead of z-fighting on it. Items use y: -LIFT, h: H.
  const LIFT = 0.05;
  function compound(pieces, H) {
    const pos = [], nor = [], uv = [], col = [];
    pieces.forEach(p => {
      const g = new THREE.BoxGeometry(p.w, p.h, p.d).toNonIndexed();
      g.translate(p.x || 0, (p.y || 0) + p.h / 2, p.z || 0);
      const P = g.attributes.position.array, N = g.attributes.normal.array, U = g.attributes.uv.array, c = C(p.col);
      for (let i = 0; i < P.length; i += 3) { pos.push(P[i], (P[i + 1] + LIFT) / H, P[i + 2]); nor.push(N[i], N[i + 1], N[i + 2]); col.push(c.r, c.g, c.b); }
      for (let i = 0; i < U.length; i++) uv.push(U[i]);
    });
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    geo.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
    geo.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
    geo.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
    return geo;
  }
  const vcMat = () => new THREE.MeshLambertMaterial({ vertexColors: true });
  // place a compound: w/d scale the footprint (1 = as drawn), h is the era-height map
  const at = (x, z, hMap, w, d, r) => ({ x, z, y: -LIFT, w: w || 1, d: d || 1, r: r || 0, h: hMap });
  // a plain box whose base sits half its height above its origin: item y = -h/2 puts the base on the
  // ground and the collapsed plate at -h/2, under it. For thin ground things and the crowd.
  const liftGeo = new THREE.BoxGeometry(1, 1, 1); liftGeo.translate(0, 1, 0);
  const flat = (x, z, w, d, h, hMap, c, r) => ({ x, z, y: -h / 2, w, d, r: r || 0, c, h: hMap });

  // ── lit-window facade: colour map (bone with ink windows) + emissive map (lamp windows on ink) ──
  // Roof and floor faces of the box get their UVs pinched into a blank corner of the canvas so the
  // roofs read dark from the high closing shot. Three height classes so window rows scale sensibly.
  function facadeGeo() {
    const g = new THREE.BoxGeometry(1, 1, 1); g.translate(0, 0.5, 0);
    const uv = g.attributes.uv;
    for (let i = 8; i < 16; i++) uv.setXY(i, 0.01, 0.01); // +y (8..11) and -y (12..15) faces
    uv.needsUpdate = true;
    return g;
  }
  function winTex(cols, rows, lit, seed) {
    const cv = document.createElement('canvas'); cv.width = 128; cv.height = 256;
    const g = cv.getContext('2d');
    g.fillStyle = lit ? PALETTE.ink : PALETTE.bone; g.fillRect(0, 0, 128, 256);
    const cw = 128 / cols, ch = 256 / rows;
    for (let i = 0; i < cols; i++) for (let j = 0; j < rows; j++) {
      const on = ((i * 7 + j * 13 + seed) % 5) !== 0;
      g.fillStyle = lit ? (on ? PALETTE.lamp : PALETTE.ink) : PALETTE.ink;
      g.fillRect(i * cw + cw * 0.3, j * ch + ch * 0.3, cw * 0.4, ch * 0.42);
    }
    const t = new THREE.CanvasTexture(cv); t.anisotropy = 4; return t;
  }
  const facadeMat = (cols, rows, seed) => new THREE.MeshLambertMaterial({
    color: C('haze'), map: winTex(cols, rows, false, seed),
    emissive: C('lamp'), emissiveMap: winTex(cols, rows, true, seed), emissiveIntensity: 0.5 });

  // ── the ring of office towers and malls ─────────────────────────────────────
  // ground-based boxes: their collapsed plates lie inside the paddy slab in the earlier eras
  const bld = [];
  const addB = (x, z, w, d, h, mall) => bld.push({ x, z, w, d, h: tw(h), top: h, mall });
  // both sides of the street, outside |x| = 18; outermost while the malls sit inside
  for (let z = -300; z >= -470; z -= 16) [-1, 1].forEach(s => {
    const i = Math.round(-z / 16);
    let x = i % 2 ? 22 : 31, w = 8 + rnd() * 5, d = 8 + rnd() * 5;
    const h = 20 + rnd() * 40;
    if (z < -386 && z > -446) x = 36;
    if (s < 0 && Math.abs(z + 386) < 14) { x = 40; w = 8; d = 8; } // clear of the closing camera
    addB(s * x, z, w, d, h, false);
  });
  // behind the tower, beyond z = -440; kept lower right behind the tower so its silhouette stands
  [[-454, [-36, -24, -12, 0, 12, 24, 36]], [-470, [-30, -18, -6, 6, 18, 30]]].forEach(([z, xs]) =>
    xs.forEach(x => addB(x, z, 8 + rnd() * 5, 8 + rnd() * 5, Math.abs(x) < 14 ? 20 + rnd() * 18 : 24 + rnd() * 36, false)));
  // three malls a side, low and wide, facing the plaza; tall enough to carry a wall screen at 13.2–15.6
  [-1, 1].forEach(s => [-394, -416, -438].forEach((z, i) => addB(s * 22, z, 10, 14, 17 + i * 2 + rnd() * 3, true)));

  const fGeo = facadeGeo();
  instSet(fGeo, facadeMat(5, 7, 1), bld.filter(b => b.top < 30));
  instSet(fGeo, facadeMat(5, 12, 2), bld.filter(b => b.top >= 30 && b.top < 45));
  instSet(fGeo, facadeMat(5, 17, 3), bld.filter(b => b.top >= 45));

  // skybridges between the malls, one level up (part(): hidden outright in the other eras)
  [-1, 1].forEach(s => [-405, -427].forEach(z => part(s * 22, 8, z, 2.4, 8, TW(0.5, 'bone'))));
  // a glass-walk link from each front mall toward the plaza edge
  [-1, 1].forEach(s => part(s * 17.8, 8, -394, 2.4, 2, TW(0.5, 'bone')));

  // ── LED billboards: canvas text, lamp on ink, unlit material so it reads as a screen ──
  function ledTex(text) {
    const cv = document.createElement('canvas'); cv.width = 512; cv.height = 128;
    const g = cv.getContext('2d');
    g.fillStyle = PALETTE.ink; g.fillRect(0, 0, 512, 128);
    g.strokeStyle = PALETTE.bone; g.lineWidth = 4; g.strokeRect(14, 14, 484, 100);
    g.fillStyle = PALETTE.lamp;
    g.font = '700 86px -apple-system, "Helvetica Neue", Helvetica, Arial, sans-serif';
    g.textAlign = 'center'; g.textBaseline = 'middle';
    g.fillText(text, 256, 68);
    const t = new THREE.CanvasTexture(cv); t.anisotropy = 4; return t;
  }
  // A screen is a box whose base sits (yBase / h) heights above its origin, so it can be
  // instanced at ground level (item y = -LIFT): full height puts it at yBase, the collapsed plate
  // lands just under the ground. Text only on the +z face; every other face is pinched to an ink
  // pixel of the canvas so the sides and back read as the screen's housing.
  function screenGeo(yBase, h) {
    const g = new THREE.BoxGeometry(1, 1, 1); g.translate(0, (yBase + LIFT) / h + 0.5, 0);
    const uv = g.attributes.uv;
    for (let i = 0; i < 24; i++) if (i < 16 || i >= 20) uv.setXY(i, 0.01, 0.01);
    uv.needsUpdate = true;
    return g;
  }
  // r = -π/2 faces -x (east mall wall, seen from the road); r = π/2 faces +x; r = 0 faces the camera coming down -z
  const SH = 2.4;
  instSet(screenGeo(13.2, SH), new THREE.MeshBasicMaterial({ map: ledTex('TAIPEI 101') }), [
    { x: 16.7, z: -394, y: -LIFT, w: 9, d: 0.3, r: -Math.PI / 2, h: tw(SH) },   // east mall wall
    { x: 10, z: -350, y: -LIFT, w: 7, d: 0.3, r: 0, h: tw(SH) },                // on a 13-unit street roof
  ]);
  // XINYI: wall screen on the west mall, and a rooftop screen raised on two posts so it clears the
  // nearer 13-unit roofs seen from the approach camera
  instSet(screenGeo(16.5, SH), new THREE.MeshBasicMaterial({ map: ledTex('XINYI') }), [
    { x: -16.7, z: -416, y: -LIFT, w: 9, d: 0.3, r: Math.PI / 2, h: tw(SH) },   // west mall wall (mall ≥ 19 tall)
    { x: -10, z: -340, y: -LIFT, w: 7, d: 0.3, r: 0, h: tw(SH) },               // rooftop, on posts
  ]);
  [-12.6, -7.4].forEach(x => part(x, 13.2, -340, 0.3, 0.3, TW(3.3, 'haze')));   // the posts
  part(-10, 13.2, -340, 5.6, 0.3, TW(0.25, 'haze'));                             // cross beam

  // ── the plaza in front of the podium: paved slabs, steps ────────────────────
  [-1, 1].forEach(s => part(s * 13.3, 0, -397, 8.2, 18, TW(0.22, 'bone')));
  part(0, 0, -405.6, 30, 2.8, TW(1.6, 'haze'));   // podium steps
  part(0, 0, -404.2, 30, 1.2, TW(0.8, 'haze'));

  // ── ground-level thin boxes, one coloured set: road paint, paving lines, paddy dykes ──
  const flats = [];
  [-330, -390].forEach(z => { for (let x = -5.4; x <= 5.5; x += 1.35) flats.push(flat(x, z, 0.8, 3.4, 0.1, tw(0.1), C('bone'))); }); // crossings
  [-334.2, -337.8].forEach(z => flats.push(flat(0, z, 11.6, 0.15, 0.1, tw(0.1), C('bone'))));                                    // scooter box
  [-5.8, 5.8].forEach(x => flats.push(flat(x, -336, 0.15, 3.6, 0.1, tw(0.1), C('bone'))));
  [-1, 1].forEach(s => [11.2, 14.4].forEach(x => flats.push(flat(s * x, -397, 0.25, 18, 0.25, tw(0.25), C('haze')))));          // paving lines
  [-1, 1].forEach(s => {
    [9.6, 17, 25, 33, 41].forEach(x => flats.push(flat(s * x, -390, 0.5, 190, 0.45, old(0.45), C('haze'))));                    // dykes
    for (let z = -300; z >= -480; z -= 17) flats.push(flat(s * 26, z, 36, 0.5, 0.45, old(0.45), C('haze')));
  });
  instSet(liftGeo, new THREE.MeshLambertMaterial({ color: C('bone') }), flats, { colors: true });

  // ── plaza furniture: planters (haze box, ink plant) and benches (haze legs, bone slab) ──
  const planterGeo = compound([
    { w: 1.6, h: 0.5, d: 1.6, col: 'haze' },
    { y: 0.5, w: 1.3, h: 1.0, d: 1.3, col: 'ink' }], 1.5);
  const planters = [];
  [-1, 1].forEach(s => { for (let i = 0; i < 5; i++) planters.push(at(s * (10.2 + i * 1.6), -389.5 - (i % 2) * 15.5, tw(1.5))); });
  instSet(planterGeo, vcMat(), planters);
  const benchGeo = compound([
    { z: -0.8, w: 0.1, h: 0.4, d: 0.1, col: 'haze' }, { z: 0.8, w: 0.1, h: 0.4, d: 0.1, col: 'haze' },
    { y: 0.4, w: 0.5, h: 0.12, d: 2, col: 'bone' }], 0.52);
  const benches = [];
  [-1, 1].forEach(s => { for (let i = 0; i < 4; i++) benches.push(at(s * 16.2, -391 - i * 4, tw(0.52))); });
  instSet(benchGeo, vcMat(), benches);

  // ── flag poles on the plaza edge: bone pole, bone flag; one vermilion flag built from parts ──
  const flagGeo = compound([
    { w: 0.12, h: 9, d: 0.12, col: 'bone' },
    { x: 0.75, y: 8, w: 1.4, h: 0.8, d: 0.08, col: 'bone' }], 9);
  const flags = [];
  [-1, 1].forEach(s => [8.6, 11.6, 14.6].forEach((x, i) => { if (!(s > 0 && i === 1)) flags.push(at(s * x, -406.6, tw(9))); }));
  instSet(flagGeo, vcMat(), flags);
  part(11.6, 0, -406.6, 0.12, 0.12, TW(9, 'bone'));
  part(12.35, 8, -406.6, 1.4, 0.08, TW(0.8, 'verm'));

  // ── traffic lights at the crossing: haze post, ink head leaning over the road, verm + lamp lamps ──
  // drawn for the east kerb (head offset toward -x); the west pair is rotated π so the head faces the road
  const lightGeo = compound([
    { w: 0.16, h: 4.6, d: 0.16, col: 'haze' },
    { x: -0.3, y: 3.3, w: 0.45, h: 1.3, d: 0.45, col: 'ink' },
    { x: -0.3, y: 4.25, w: 0.3, h: 0.28, d: 0.5, col: 'verm' },
    { x: -0.3, y: 3.7, w: 0.3, h: 0.28, d: 0.5, col: 'lamp' }], 4.6);
  instSet(lightGeo, vcMat(), [[6.6, -326.5], [6.6, -333.5], [-6.6, -326.5], [-6.6, -333.5]].map(([x, z]) => at(x, z, tw(4.6), 1, 1, x < 0 ? Math.PI : 0)));

  // ── the approach: bus shelter (parts), taxis and scooters (compound sets) ─────
  (() => { // bus shelter on the east sidewalk
    const z = -340;
    part(7.2, 0, z - 1.9, 0.14, 0.14, TW(2.6, 'haze'));
    part(7.2, 0, z + 1.9, 0.14, 0.14, TW(2.6, 'haze'));
    part(8.2, 2.6, z, 2.8, 4.6, TW(0.14, 'haze'));
    part(9.05, 0.3, z, 0.1, 4.2, TW(2.2, 'bone'));
    part(8.6, 0.42, z, 0.5, 3.2, TW(0.1, 'bone'));  // the bench inside
  })();
  const taxiGeo = compound([
    { y: 0.2, w: 1.7, h: 1.1, d: 3.8, col: 'lamp' },
    { y: 1.3, z: -0.2, w: 1.5, h: 0.6, d: 2.0, col: 'bone' },
    { y: 1.9, w: 0.6, h: 0.25, d: 0.25, col: 'verm' }], 2.15);
  instSet(taxiGeo, vcMat(), [[-5.1, -348], [-5.1, -356], [5.1, -378], [5.1, -385]].map(([x, z]) => at(x, z, tw(2.15))));
  const scooterGeo = compound([
    { y: 0.2, w: 0.6, h: 0.8, d: 1.7, col: 'haze' },
    { y: 1.0, w: 0.5, h: 0.9, d: 0.5, col: 'bone' }], 1.9);
  instSet(scooterGeo, vcMat(), [-5.3, -4.5, 4.1, 4.9, 5.6].map((x, i) => at(x, -335.4 - (i % 2) * 0.8, tw(1.9))));

  // ── the crowd on the plaza, plus a few at the shelter and the crossing corners ──
  const crowd = [];
  for (let i = 0; i < 52; i++) {
    const s = i % 2 ? 1 : -1, x = s * (9.6 + rnd() * 7.2), z = -388.5 - rnd() * 17, h = 1.5 + rnd() * 0.3;
    const c = i % 9 === 0 ? C('verm') : (i % 3 === 0 ? C('haze') : C('bone'));
    crowd.push(flat(x, z, 0.5, 0.4, h, tw(h), c, rnd() * 6.28));
  }
  [[8.4, -341.5], [8.6, -339.2], [7.9, -338.4], [7.4, -324.5], [-7.4, -324.3], [-7.6, -335.4], [7.6, -335.8]].forEach(([x, z], i) =>
    crowd.push(flat(x, z, 0.5, 0.4, 1.6, tw(1.6), i % 4 === 0 ? C('haze') : C('bone'), rnd() * 6.28)));
  instSet(liftGeo, new THREE.MeshLambertMaterial({ color: C('bone') }), crowd, { colors: true });

  // ── aircraft-warning lights on the spire top and crown corners: tiny verm cubes, no glow ──
  [-0.35, 0.35].forEach(x => part(x, TH + 14, TZ, 0.35, 0.35, TW(0.35, 'verm')));
  [[-2.6, -2.6], [2.6, -2.6], [-2.6, 2.6], [2.6, 2.6]].forEach(([dx, dz]) => part(dx, TH, TZ + dz, 0.4, 0.4, TW(0.4, 'verm')));

  // ── the same ground before 2004: rice paddies, farmhouses, banyans and betel palms ──
  [-1, 1].forEach(s => part(s * 26, 0, -390, 36, 190, OLD(0.08, 'bone'))); // water: paper-white paddies, x 8..44, z -295..-485
  const pyr = new THREE.CylinderGeometry(0.02, 0.75, 1, 4); pyr.rotateY(Math.PI / 4); pyr.translate(0, 0.5, 0);
  [[18, -330, 0.3, 3], [-22, -350, -0.2, 4.8], [24, -400, 0.1, 3], [-20, -440, 0.4, 4.8], [14, -455, -0.3, 3]].forEach(([x, z, r, h]) => {
    part(x, 0, z, 4.4, 3.2, OLD(h, 'bone'), r);
    part(x, h, z, 5.4, 4.2, OLD(1.8, 'ink'), r, pyr);
  });
  // broad tree: haze trunk, stepped ink crown. Drawn 9 tall; banyans use it at full size beside the
  // road (tall enough to show over the street trees from a 5-unit camera), farm trees smaller.
  const treeGeo = compound([
    { w: 0.6, h: 4.5, d: 0.6, col: 'haze' },
    { y: 4.2, w: 4.6, h: 3.2, d: 4.0, col: 'ink' },
    { x: 0.4, y: 7.4, w: 2.6, h: 1.6, d: 2.4, col: 'ink' }], 9);
  const trees = [];
  [[11.5, -306], [-11.6, -323], [11.8, -354], [-11.5, -398], [11.6, -436]].forEach(([x, z]) => trees.push(at(x, z, old(9), 1 + rnd() * 0.2, 1 + rnd() * 0.25)));
  [[20, -334], [-25, -346], [27, -404], [-22, -444], [16, -458], [30, -320], [-30, -415], [12, -452]].forEach(([x, z]) =>
    trees.push(at(x, z, old(6.8), 0.72 + rnd() * 0.2, 0.75 + rnd() * 0.2, rnd() * 3)));
  instSet(treeGeo, vcMat(), trees);
  // betel palms along the paddy edge: thin haze trunk well above the street trees, a small ink crown
  const palmGeo = compound([
    { w: 0.32, h: 7.2, d: 0.32, col: 'haze' },
    { y: 6.9, w: 2.2, h: 1.3, d: 2.2, col: 'ink' }], 8.2);
  const palms = [[13.6, -312], [-13.4, -338], [13.8, -368], [-13.6, -384], [13.4, -412], [-13.5, -428], [13.7, -450], [-13.3, -462]]
    .map(([x, z], i) => at(x, z, old(8.2 * (0.9 + (i % 3) * 0.08))));
  instSet(palmGeo, vcMat(), palms);
})();
