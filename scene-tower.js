// scene-tower.js — chapter scene detail: Taipei 101, 2004–now. Xinyi at night.
// Region z -290 … -460. Everything modern exists in the tower era only; the same ground
// carries rice paddies and farmhouses in the two earlier eras, so scrolling back reads
// "fields, then the tallest building on earth". Primitives only, five colours only.
(function () {
  if (!window.SCENE) return;
  const { part, instSet, only, C, boxGeo, PALETTE, rnd, TOWER, walkX } = window.SCENE;

  const tw = h => ({ red: 0, dadao: 0, tower: h });      // instSet heights: tower era only
  const old = h => ({ red: h, dadao: h, tower: 0 });     // instSet heights: fields era only
  const TW = (h, col) => only(['tower'], h, col);        // part look: tower era only
  const OLD = (h, col) => only(['red', 'dadao'], h, col);
  const TZ = TOWER.z, TH = TOWER.h;

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
  // three malls a side, low and wide, facing the plaza
  [-1, 1].forEach(s => [-394, -416, -438].forEach((z, i) => addB(s * 22, z, 10, 14, 16 + i * 2 + rnd() * 3, true)));

  const fGeo = facadeGeo();
  instSet(fGeo, facadeMat(5, 7, 1), bld.filter(b => b.top < 30));
  instSet(fGeo, facadeMat(5, 12, 2), bld.filter(b => b.top >= 30 && b.top < 45));
  instSet(fGeo, facadeMat(5, 17, 3), bld.filter(b => b.top >= 45));

  // skybridges between the malls, one level up
  [-1, 1].forEach(s => [-405, -427].forEach(z => part(s * 22, 8, z, 2.4, 8, TW(0.5, 'bone'))));
  // a glass-walk link from each front mall toward the plaza edge
  [-1, 1].forEach(s => part(s * 17.8, 8, -394, 2.4, 2, TW(0.5, 'bone')));

  // ── LED billboards: canvas text, lamp on ink, unlit material so it reads as a screen ──
  function ledTex(text) {
    const cv = document.createElement('canvas'); cv.width = 512; cv.height = 128;
    const g = cv.getContext('2d');
    g.fillStyle = PALETTE.ink; g.fillRect(0, 0, 512, 128);
    g.strokeStyle = PALETTE.bone; g.lineWidth = 4; g.strokeRect(6, 6, 500, 116);
    g.fillStyle = PALETTE.lamp;
    g.font = '700 86px -apple-system, "Helvetica Neue", Helvetica, Arial, sans-serif';
    g.textAlign = 'center'; g.textBaseline = 'middle';
    g.fillText(text, 256, 68);
    const t = new THREE.CanvasTexture(cv); t.anisotropy = 4; return t;
  }
  // r = -π/2 faces -x (east mall wall, seen from the road); r = π/2 faces +x; r = 0 faces the camera coming down -z
  instSet(boxGeo, new THREE.MeshBasicMaterial({ map: ledTex('TAIPEI 101') }), [
    { x: 16.7, z: -394, y: 10, w: 9, d: 0.3, r: -Math.PI / 2, h: tw(2.4) },
    { x: 10, z: -350, y: 13.2, w: 7, d: 0.3, r: 0, h: tw(2.4) },
  ]);
  instSet(boxGeo, new THREE.MeshBasicMaterial({ map: ledTex('XINYI') }), [
    { x: -16.7, z: -416, y: 10, w: 9, d: 0.3, r: Math.PI / 2, h: tw(2.4) },
    { x: -10, z: -340, y: 13.2, w: 7, d: 0.3, r: 0, h: tw(2.4) },
  ]);

  // ── the plaza in front of the podium: paved slabs, steps, furniture ─────────
  [-1, 1].forEach(s => part(s * 13.3, 0, -397, 8.2, 18, TW(0.22, 'bone')));
  part(0, 0, -405.6, 30, 2.8, TW(1.6, 'haze'));   // podium steps
  part(0, 0, -404.2, 30, 1.2, TW(0.8, 'haze'));

  // props: planters, benches, paving lines, rooftop plant, and the paddy-era trees — one coloured set
  const props = [];
  [-1, 1].forEach(s => {
    for (let i = 0; i < 5; i++) {
      const x = s * (10.2 + i * 1.6), z = -389.5 - (i % 2) * 15.5;
      props.push({ x, z, w: 1.6, d: 1.6, c: C('haze'), h: tw(0.5) });
      props.push({ x, z, y: 0.5, w: 1.3, d: 1.3, c: C('ink'), h: tw(1.0) });
    }
    for (let i = 0; i < 4; i++) props.push({ x: s * (16.2), z: -391 - i * 4, y: 0.4, w: 0.5, d: 2, c: C('bone'), h: tw(0.12) });
    [11.2, 14.4].forEach(x => props.push({ x: s * x, z: -397, y: 0.22, w: 0.25, d: 18, c: C('haze'), h: tw(0.03) }));
  });
  bld.forEach((b, i) => { if (!b.mall && i % 2 === 0) props.push({ x: b.x + 1.5, z: b.z - 1, y: b.top, w: 2, d: 2, c: C('haze'), h: tw(1.2) }); });
  // farm trees, earlier eras. Tall enough to show over the street trees from a 5-unit-high camera:
  // banyans beside the road, smaller ones by the farmhouses
  [[11.5, -306], [-11.6, -323], [11.8, -354], [-11.5, -398], [11.6, -436]].forEach(([x, z]) => {
    props.push({ x, z, w: 0.6, d: 0.6, c: C('haze'), h: old(4.5) });
    props.push({ x, z, y: 4.2, w: 4.6 + rnd(), d: 4 + rnd(), c: C('ink'), h: old(3.2) });   // stepped crown
    props.push({ x: x + 0.4, z, y: 7.4, w: 2.6, d: 2.4, c: C('ink'), h: old(1.6) });
  });
  // betel palms along the paddy edge: thin trunks well above the street trees, a small crown each
  [[13.6, -312], [-13.4, -338], [13.8, -368], [-13.6, -384], [13.4, -412], [-13.5, -428], [13.7, -450], [-13.3, -462]].forEach(([x, z], i) => {
    const h = 6.5 + (i % 3) * 0.7;
    props.push({ x, z, w: 0.32, d: 0.32, c: C('haze'), h: old(h) });
    props.push({ x, z, y: h - 0.3, w: 2.2, d: 2.2, c: C('ink'), h: old(1.3) });
  });
  [[20, -334], [-25, -346], [27, -404], [-22, -444], [16, -458], [30, -320], [-30, -415], [12, -452]].forEach(([x, z]) => {
    props.push({ x, z, w: 0.45, d: 0.45, c: C('haze'), h: old(3.2) });
    props.push({ x, z, y: 2.8, w: 3.4 + rnd(), d: 3.2 + rnd(), c: C('ink'), h: old(4) });
  });
  instSet(boxGeo, new THREE.MeshLambertMaterial({ color: C('bone') }), props, { colors: true });

  // poles: flag poles with flags on the plaza edge, traffic-light posts at the crossing
  const poles = [];
  [-1, 1].forEach(s => [8.6, 11.6, 14.6].forEach((x, i) => {
    poles.push({ x: s * x, z: -406.6, w: 0.12, d: 0.12, c: C('bone'), h: tw(9) });
    poles.push({ x: s * x + 0.75, z: -406.6, y: 8, w: 1.4, d: 0.08, c: (s > 0 && i === 1) ? C('verm') : C('bone'), h: tw(0.8) });
  }));
  [[6.6, -326.5], [6.6, -333.5], [-6.6, -326.5], [-6.6, -333.5]].forEach(([x, z]) =>
    poles.push({ x, z, w: 0.16, d: 0.16, c: C('haze'), h: tw(4.6) }));
  instSet(boxGeo, new THREE.MeshLambertMaterial({ color: C('bone') }), poles, { colors: true });

  // ── the approach: bus shelter, crossing, scooter box, taxis ─────────────────
  (() => { // bus shelter on the east sidewalk
    const z = -340;
    part(7.2, 0, z - 1.9, 0.14, 0.14, TW(2.6, 'haze'));
    part(7.2, 0, z + 1.9, 0.14, 0.14, TW(2.6, 'haze'));
    part(8.2, 2.6, z, 2.8, 4.6, TW(0.14, 'haze'));
    part(9.05, 0.3, z, 0.1, 4.2, TW(2.2, 'bone'));
    part(8.6, 0.42, z, 0.5, 3.2, TW(0.1, 'bone'));  // the bench inside
  })();
  // road paint: crossing stripes at z -330 and -390, and the scooter waiting box behind the first
  const paint = [];
  [-330, -390].forEach(z => { for (let x = -5.4; x <= 5.5; x += 1.35) paint.push({ x, z, y: 0.06, w: 0.8, d: 3.4, h: tw(0.04) }); });
  [-334.2, -337.8].forEach(z => paint.push({ x: 0, z, y: 0.06, w: 11.6, d: 0.15, h: tw(0.04) }));
  [-5.8, 5.8].forEach(x => paint.push({ x, z: -336, y: 0.06, w: 0.15, d: 3.6, h: tw(0.04) }));
  instSet(boxGeo, new THREE.MeshLambertMaterial({ color: C('bone') }), paint);

  // taxis parked at the kerb, scooters in the waiting box, traffic-light heads — one coloured set
  const cars = [];
  [[-5.1, -348], [-5.1, -356], [5.1, -378], [5.1, -385]].forEach(([x, z]) => {
    cars.push({ x, z, y: 0.2, w: 1.7, d: 3.8, c: C('lamp'), h: tw(1.1) });
    cars.push({ x, z: z - 0.2, y: 1.3, w: 1.5, d: 2.0, c: C('bone'), h: tw(0.6) });
    cars.push({ x, z, y: 1.9, w: 0.6, d: 0.25, c: C('verm'), h: tw(0.25) });
  });
  [-5.3, -4.5, 4.1, 4.9, 5.6].forEach((x, i) => {
    const z = -335.4 - (i % 2) * 0.8;
    cars.push({ x, z, y: 0.2, w: 0.6, d: 1.7, c: C('haze'), h: tw(0.8) });
    cars.push({ x, z, y: 1.0, w: 0.5, d: 0.5, c: i === 2 ? C('verm') : C('bone'), h: tw(0.9) });
  });
  [[6.6, -326.5], [6.6, -333.5], [-6.6, -326.5], [-6.6, -333.5]].forEach(([x, z]) => {
    const xi = x - Math.sign(x) * 0.3;
    cars.push({ x: xi, z, y: 3.3, w: 0.45, d: 0.45, c: C('ink'), h: tw(1.3) });
    cars.push({ x: xi, z, y: 4.25, w: 0.3, d: 0.5, c: C('verm'), h: tw(0.28) });
    cars.push({ x: xi, z, y: 3.7, w: 0.3, d: 0.5, c: C('lamp'), h: tw(0.28) });
  });
  instSet(boxGeo, new THREE.MeshLambertMaterial({ color: C('bone') }), cars, { colors: true });

  // ── the crowd on the plaza, plus a few at the shelter and the crossing corners ──
  const crowd = [];
  for (let i = 0; i < 52; i++) {
    const s = i % 2 ? 1 : -1, x = s * (9.6 + rnd() * 7.2), z = -388.5 - rnd() * 17;
    const c = i % 9 === 0 ? C('verm') : (i % 3 === 0 ? C('haze') : C('bone'));
    crowd.push({ x, z, w: 0.5, d: 0.4, r: rnd() * 6.28, c, h: tw(1.5 + rnd() * 0.3) });
  }
  [[8.4, -341.5], [8.6, -339.2], [7.9, -338.4], [7.4, -324.5], [-7.4, -324.3], [-7.6, -335.4], [7.6, -335.8]].forEach(([x, z], i) =>
    crowd.push({ x, z, w: 0.5, d: 0.4, r: rnd() * 6.28, c: i % 4 === 0 ? C('haze') : C('bone'), h: tw(1.6) }));
  instSet(boxGeo, new THREE.MeshLambertMaterial({ color: C('bone') }), crowd, { colors: true });

  // ── aircraft-warning lights on the spire top and crown corners: tiny verm cubes, no glow ──
  [-0.35, 0.35].forEach(x => part(x, TH + 14, TZ, 0.35, 0.35, TW(0.35, 'verm')));
  [[-2.6, -2.6], [2.6, -2.6], [-2.6, 2.6], [2.6, 2.6]].forEach(([dx, dz]) => part(dx, TH, TZ + dz, 0.4, 0.4, TW(0.4, 'verm')));

  // ── the same ground before 2004: rice paddies with dykes, farmhouses ────────
  [-1, 1].forEach(s => part(s * 21, 0, -385, 26, 172, OLD(0.08, 'bone'))); // water: paper-white paddies
  const dykes = [];
  [-1, 1].forEach(s => {
    [9.6, 17, 25, 33].forEach(x => dykes.push({ x: s * x, z: -385, w: 0.5, d: 172, h: old(0.45) }));
    for (let z = -300; z >= -470; z -= 17) dykes.push({ x: s * 21, z, w: 26, d: 0.5, h: old(0.45) });
  });
  instSet(boxGeo, new THREE.MeshLambertMaterial({ color: C('haze') }), dykes);
  const pyr = new THREE.CylinderGeometry(0.02, 0.75, 1, 4); pyr.rotateY(Math.PI / 4); pyr.translate(0, 0.5, 0);
  [[18, -330, 0.3, 3], [-22, -350, -0.2, 4.8], [24, -400, 0.1, 3], [-20, -440, 0.4, 4.8], [14, -455, -0.3, 3]].forEach(([x, z, r, h]) => {
    part(x, 0, z, 4.4, 3.2, OLD(h, 'bone'), r);
    part(x, h, z, 5.4, 4.2, OLD(1.8, 'ink'), r, pyr);
  });
})();
