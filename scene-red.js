// scene-red.js — When We Were Young: Ximending 1985–1999. Everything here is rebuilt from a
// real building: the Red House octagon and its cross-shaped market wing, the eight blocks of
// 中華商場 with their rooftop neon, 樂聲戲院 with hand-painted billboards, 萬年大樓, and the
// 1999 pedestrian zone. The teammate's Ximending asset library fills the shopfronts between.
// Primitives, canvas textures and the palette, plus the Red House glb (issue #5). References are listed in HANDOFF.md.
(function () {
  if (!window.SCENE) return;
  const { part, instSet, only, C, boxGeo, PALETTE, rnd, anchors, libGroup, asset, findAsset, walkX, lam, withFog, people } = window.SCENE;
  const RED = ['red'], ALL = ['red', 'dadao', 'tower'];
  const RH = anchors.redhouse;                                                  // { x: 11, z: -70 }
  const hOf = (h, eras) => { const o = {}; (eras || RED).forEach(k => o[k] = h); return o; };
  const CJK = '-apple-system, "PingFang TC", "Heiti TC", "Noto Sans CJK TC", "Microsoft JhengHei", sans-serif';

  // ── shared geometry (base at y = 0) ─────────────────────────────────────────
  const pyr = new THREE.CylinderGeometry(0, 1, 1, 4); pyr.translate(0, 0.5, 0);
  const wheelGeo = new THREE.CylinderGeometry(0.5, 0.5, 0.15, 10); wheelGeo.rotateZ(Math.PI / 2); wheelGeo.translate(0, 0.5, 0);
  const basketGeo = new THREE.CylinderGeometry(0.5, 0.38, 1, 8); basketGeo.translate(0, 0.5, 0);
  const planeGeo = new THREE.PlaneGeometry(1, 1); planeGeo.translate(0, 0.5, 0);           // faces +z

  // ── item buckets, one InstancedMesh each ────────────────────────────────────
  const furn = [], crowd = [], wheels = [], baskets = [];
  const bollards = [], aboards = [], plants = [], boxes = [];                     // issue #5 glb instances
  const F = (x, z, y, w, d, h, col, eras, r) => furn.push({ x, z, y: y || 0, w, d, r: r || 0, h: hOf(h, eras), c: C(col) });

  // ── canvas text helpers ─────────────────────────────────────────────────────
  function canvas(w, h, bg) {
    const cv = document.createElement('canvas'); cv.width = w; cv.height = h;
    const g = cv.getContext('2d'); g.fillStyle = PALETTE[bg] || bg; g.fillRect(0, 0, w, h);
    return { cv, g };
  }
  const tex = cv => { const t = new THREE.CanvasTexture(cv); t.anisotropy = 4; return t; };
  function fitText(g, text, px, maxW, weight) {
    g.font = `${weight || 700} ${px}px ${CJK}`;
    const tw = g.measureText(text).width;
    if (tw > maxW) g.font = `${weight || 700} ${Math.floor(px * maxW / tw)}px ${CJK}`;
  }
  // a horizontal board: lines = [{ text, size, y, col }]
  function boardTex(w, h, bg, lines, border) {
    const { cv, g } = canvas(w, h, bg);
    if (border) { g.strokeStyle = PALETTE[border]; g.lineWidth = Math.max(4, h * 0.04); g.strokeRect(g.lineWidth, g.lineWidth, w - 2 * g.lineWidth, h - 2 * g.lineWidth); }
    g.textAlign = 'center'; g.textBaseline = 'middle';
    lines.forEach(L => { fitText(g, L.text, L.size, w * 0.9, L.weight); g.fillStyle = PALETTE[L.col || 'bone']; g.fillText(L.text, w / 2, L.y); });
    return tex(cv);
  }
  // a vertical sign: one character per row
  function vertTex(str, bg, fg, border) {
    const n = str.length, { cv, g } = canvas(160, 160 * n + 40, bg);
    if (border) { g.strokeStyle = PALETTE[border]; g.lineWidth = 8; g.strokeRect(8, 8, 144, 160 * n + 24); }
    g.fillStyle = PALETTE[fg]; g.font = `700 118px ${CJK}`; g.textAlign = 'center'; g.textBaseline = 'middle';
    for (let i = 0; i < n; i++) g.fillText(str[i], 80, 100 + i * 160);
    return { t: tex(cv), aspect: 160 / (160 * n + 40) };
  }
  // a textured board as a part. axis 'x': faces the road (±x); axis 'z': faces the camera (+z)
  function board(x, y, z, w, h, t, eras, axis, emis) {
    const p = axis === 'x' ? part(x, y, z, 0.12, w, only(eras || RED, h, 'bone')) : part(x, y, z, w, 0.12, only(eras || RED, h, 'bone'));
    const m = p.mesh.material; m.map = t; if (emis) { m.emissiveMap = t; m.emissive = C('bone'); m.emissiveIntensity = emis; } m.needsUpdate = true;
    return p;
  }
  // window grid facade texture: bg with ink windows, optionally a balcony rail under each row
  function facadeTex(cols, rows, bg, rail) {
    const { cv, g } = canvas(64 * cols, 64 * rows, bg);
    for (let i = 0; i < cols; i++) for (let j = 0; j < rows; j++) {
      g.fillStyle = PALETTE.ink; g.fillRect(i * 64 + 18, j * 64 + 12, 28, 34);
      g.fillStyle = 'rgba(255,255,255,0.35)'; g.fillRect(i * 64 + 18, j * 64 + 12, 28, 6);
      if (rail) { g.fillStyle = PALETTE[rail]; g.fillRect(i * 64 + 6, j * 64 + 48, 52, 6); }
    }
    const t = tex(cv); t.wrapS = t.wrapT = THREE.RepeatWrapping; return t;
  }

  // ═══ 1. 西門紅樓 — the 1908 octagon and the cross-shaped market hall (十字樓) ═══════════
  // Reference: Kondo Juro's 1908 market: a two-storey red-brick octagon (~16 m across, eight
  // arched openings at street level, paired windows above, pale horizontal bands and quoins,
  // an eight-sided slate roof with a small lantern) and, behind it, the one-storey cross-shaped
  // hall with gable roofs. Octagon centred east of the road; the cross wing runs away from it.
  // Issue #5 step 1: the building is a glb built by asset/blender/red-house.py (bevelled edges,
  // boolean-cut openings, flat palette materials, 30.7k triangles) and loaded here in place of
  // the canvas-textured primitives. The glb keeps the primitive build's sizes: circumradius
  // 7.2, eave 8.8, the long arm 30 x 8.4 centred 21 m behind the octagon, the cross arm 23 m.
  // Its front faces +Z before rotation, like the library assets, so -π/2 turns it to the road.
  (() => {
    const cx = 16.6, cz = RH.z, EAVE = 8.8;
    const house = libGroup(ALL);                                                  // there in every era
    MODELS.load('red-house', gltf => {
      const root = MODELS.lambertize(gltf.scene);
      root.position.set(cx, 0, cz);
      root.rotation.y = -Math.PI / 2;
      house.add(root);
    });
    // the plaza in front: packed earth in the 80s, the 2002 paving after
    part(cx - 2, 0, cz + 11, 18, 10, { red: { h: 0.06, col: 'haze' }, dadao: { h: 0.08, col: 'walk' }, tower: { h: 0.08, col: 'walk' } });
    RH.top = EAVE + 7.5;
  })();

  // ═══ 2. 中華商場 — eight three-storey blocks along 中華路, 1961–1992 ═════════════════════
  // Reference: research/realism-ximen/zone2-chunghwa/README.md. Eight joined concrete blocks,
  // numbered 1–8 (忠孝仁愛信義和平), three storeys: a 3.5 m arcade with a signboard band on its
  // fascia, open corridors behind solid parapets on floors 2 and 3, canvas awnings, 2nd-floor
  // bridges across the cross streets, and on each end wall a lattice panel, 中華商場 painted
  // vertically and the block's big number. The blocks never carried 忠棟 … plates.
  // West side of the street, 1985–1991 in scroll time; demolished in 1992, so the childhood
  // chapter only.
  // CJ, 2026-09-24: 「這個youtbue講怎麼shade像是arcade 試試看」— the Arcane method: the silhouette is
  // geometry (chunghwa.glb: arcade recess, corridor gap, shopfront setback, bridges, tanks), the
  // rest is painted (asset/paint/chunghwa_paint.py → asset/textures/chunghwa-*.webp) with the
  // light baked in and a normal map for the relief: every shop unit's frontage and what it
  // sells, shutters, sign frames, the lattice, concrete stains and formwork lines.
  // CJ, 2026-09-21: 「盡量矮點才能比較後來的建設跟慢慢長大的感覺」— the real block is three storeys
  // and is drawn so for the realism pass (2026-09-24); FLOORS = 2 in chunghwa.py and FLOOR * 2
  // below give the lower street back.
  (() => {
    const L = 9.4, GAP = 2.6, FLOOR = 3.3, TOP = FLOOR * 3, XF = -6.2, DEPTH = 10;  // match chunghwa.py
    const ARCADE = 3.5, CORR = 3.0, SLAB = 0.34, CLEAR = FLOOR - SLAB;
    // Rooftop neon: the big rooftop signs came down from 1 May 1985, so a strictly 1985–1992
    // roof is bare. ROOF_NEON keeps the sourced ones for the memory: the National tower on
    // 信棟 (block 5), and 黑松, 大同, 精工, 森永, 旭光 boards on steel lattice.
    const ROOF_NEON = true;
    const NEON = [['黑松汽水', 'verm'], ['大同', 'lamp'], ['精工錶 SEIKO', 'verm'], ['森永', 'lamp'], null, ['旭光日光燈', 'verm'], ['黑松沙士', 'lamp'], ['大同電視', 'verm']];
    const BAND = [['西裝 訂做', 'lamp', 'verm'], ['電子零件 收音機', 'bone', 'verm'], ['郵票 錢幣', 'lamp', 'ink'], ['唱片 錄音帶', 'bone', 'ink'], ['點心世界', 'lamp', 'verm'], ['眼鏡 鐘錶', 'bone', 'verm'], ['皮鞋 皮件', 'lamp', 'ink'], ['軍用品 刻印', 'bone', 'ink']];
    const blockZ = [0, 1, 2, 3, 4, 5, 6, 7].map(i => 46 - L / 2 - i * (L + GAP));
    const rot = Math.PI / 2, blocks = [], bridges = [];
    blockZ.forEach((z, i) => {
      blocks.push({ x: XF, z, r: rot, w: 1, d: 1, h: hOf(1) });
      if (i < 7) bridges.push({ x: XF, z: z - L / 2 - GAP / 2, r: rot, w: 1, d: 1, h: hOf(1) });
    });
    // ── the painted textures (linear, like the palette: the page applies gamma in its post pass) ──
    const TL = new THREE.TextureLoader();
    const tx = (name, wrap) => { const t = TL.load('asset/textures/' + name + '.webp'); t.anisotropy = 8; if (wrap) t.wrapS = t.wrapT = THREE.RepeatWrapping; return t; };
    const concrete = tx('chunghwa-concrete', true), concreteN = tx('chunghwa-concrete-n', true), awning = tx('chunghwa-awning', true);
    MODELS.load('chunghwa', gltf => {
      const paint = sets => sets.forEach(({ mesh }) => {
        const m = mesh.material, hex = m.color.getHex();
        if (hex === C('verm').getHex()) { m.map = awning; m.color.set(0xffffff); }       // the stripes are painted in palette colour
        else if ([C('walk'), C('bone'), C('haze'), C('leaf')].some(c => c.getHex() === hex)) { m.map = concrete; m.normalMap = concreteN; m.normalScale.set(0.8, 0.8); }
        m.needsUpdate = true;
      });
      paint(MODELS.instance(MODELS.node(gltf.scene, 'block'), blocks));
      paint(MODELS.instance(MODELS.node(gltf.scene, 'bridge'), bridges));
    });
    // ── the painted walls: every shop unit's frontage on the arcade's back wall and on the two
    //    corridors' back walls, and the end walls; all quads in two meshes, one draw call each ──
    // chunghwa-shops.webp: 5 painted blocks (2 x 3 slots of 960 x 906 px), each a ground strip
    // and two upper strips of 5 units; the blocks the camera passes in zone 2 (4–8) are all
    // different, the first three reuse slots. chunghwa-ends.webp: 8 end walls, 2 x 4 of 384 x 380.
    const SW = 1920, SH = 2718, SLOT = [1, 2, 3, 0, 4, 2, 3, 1];                   // slot 4 carries 點心世界 on 信棟
    const EW = 768, EH = 1520;
    const shopQ = [], endQ = [];
    // a quad facing +x (road) from z0 (image left) to z1 (image right), or facing +z from x0 to x1
    const quadX = (out, x, z0, z1, y0, y1, u0, u1, v0, v1) => out.push([[x, y0, z0, u0, v0], [x, y0, z1, u1, v0], [x, y1, z1, u1, v1], [x, y1, z0, u0, v1]]);
    const quadZ = (out, z, x0, x1, y0, y1, u0, u1, v0, v1) => out.push([[x0, y0, z, u0, v0], [x1, y0, z, u1, v0], [x1, y1, z, u1, v1], [x0, y1, z, u0, v1]]);
    blockZ.forEach((z, i) => {
      const zN = z + L / 2, zS = z - L / 2, s = SLOT[i];
      const bx = (s % 2) * 960, by = Math.floor(s / 2) * 906;
      const u0 = bx / SW, u1 = (bx + 960) / SW;
      const vOf = py => 1 - py / SH;
      quadX(shopQ, XF - ARCADE + 0.05, zN, zS, 0, CLEAR, u0, u1, vOf(by + 302), vOf(by));
      [1, 2].forEach(f => quadX(shopQ, XF - CORR + 0.05, zN, zS, f * FLOOR, f * FLOOR + CLEAR, u0, u1, vOf(by + (f + 1) * 302), vOf(by + f * 302)));
      // the end wall, 10 m deep x TOP high: the arcade's opening is left out
      const ex = (i % 2) * 384, ey = Math.floor(i / 2) * 380;
      const eu = x => (ex + (x - (XF - DEPTH)) / DEPTH * 384) / EW, ev = y => 1 - (ey + (1 - y / TOP) * 380) / EH;
      quadZ(endQ, zN + 0.05, XF - DEPTH, XF, CLEAR, TOP, eu(XF - DEPTH), eu(XF), ev(CLEAR), ev(TOP));
      quadZ(endQ, zN + 0.05, XF - DEPTH, XF - ARCADE, 0, CLEAR, eu(XF - DEPTH), eu(XF - ARCADE), ev(0), ev(CLEAR));
    });
    const quads = qs => {
      const pos = [], uv = [], idx = [];
      qs.forEach(q => { const b = pos.length / 3; q.forEach(([x, y, z, u, v]) => { pos.push(x, y, z); uv.push(u, v); }); idx.push(b, b + 1, b + 2, b, b + 2, b + 3); });
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
      g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
      g.setIndex(idx); g.computeVertexNormals();
      return g;
    };
    const painted = libGroup(RED);
    // the shop fronts stand in the arcade's and corridors' shade, which is painted into them:
    // unlit, so the paint shows as painted. The end walls take the sun: lit, with the normal map.
    const shops = new THREE.Mesh(quads(shopQ), withFog(new THREE.MeshBasicMaterial({ map: tx('chunghwa-shops') })));
    const ends = new THREE.Mesh(quads(endQ), withFog(new THREE.MeshLambertMaterial({ map: tx('chunghwa-ends'), normalMap: tx('chunghwa-ends-n') })));
    ends.receiveShadow = true;
    [shops, ends].forEach(m => { m.material.polygonOffset = true; m.material.polygonOffsetFactor = -2; m.material.polygonOffsetUnits = -4; });   // never fight the wall behind
    painted.add(shops, ends);
    blockZ.forEach((z, i) => {
      // the signboard band on the arcade fascia
      const [bt, bg, fg] = BAND[i];
      board(XF + 0.25, FLOOR - 0.86, z, L - 0.4, 0.52, boardTex(2048, 110, bg, [{ text: bt + ' · 中華商場', size: 82, y: 58, col: fg }]), RED, 'x');
      if (!ROOF_NEON) return;
      const y = TOP + 0.3, x0 = XF - DEPTH / 2;
      if (!NEON[i]) {
        // the National / 國際牌 tower on 信棟's south end: a box on a steel truss, logo on three faces
        const tz = z - L / 2 + 2.4, tx = x0 + 1.2;
        [-1.6, 1.6].forEach(dx => [-1.6, 1.6].forEach(dz => F(tx + dx, tz + dz, y, 0.2, 0.2, 1.6, 'ink')));
        F(tx, tz, y + 1.6, 3.6, 3.6, 0.2, 'ink');
        F(tx, tz, y + 1.8, 3.4, 3.4, 4.2, 'ink');
        const nt = () => boardTex(512, 640, 'ink', [{ text: 'National', size: 110, y: 190, col: 'lamp' }, { text: '國際牌', size: 130, y: 420, col: 'verm' }], 'lamp');
        board(tx + 1.77, y + 1.9, tz, 3.2, 4.0, nt(), RED, 'x', 0.8);
        board(tx, y + 1.9, tz + 1.77, 3.2, 4.0, nt(), RED, 'z', 0.8);
        return;
      }
      // a steel lattice frame and the board, turned a little toward the camera
      const sx = x0 + 1.5;
      [-1.9, 1.9].forEach(dz => F(sx, z + dz, y, 0.18, 0.18, 3.4, 'ink'));
      F(sx, z, y + 3.4, 0.18, 4.2, 0.18, 'ink');
      F(sx, z, y + 1.7, 0.18, 4.2, 0.14, 'ink');
      const [txt, colr] = NEON[i];
      const t = boardTex(768, 320, 'ink', [{ text: txt, size: 190, y: 160, col: colr }], colr);
      const p = board(sx + 0.15, y + 0.5, z, 4.4, 2.5, t, RED, 'x', 0.7); p.mesh.rotation.y = -0.35;
    });
  })();

  // ═══ 3. 樂聲戲院 — the cinema on 武昌街 with hand-painted billboards ═══════════════════
  // Reference: Lux Theatre (1964), a plain five-storey block whose whole street face was
  // covered by painters' billboards for the current films, a vertical 樂聲 neon on the corner,
  // a marquee canopy over the doors and poster cases at the pavement. West side, opposite the
  // Red House, so it is in frame with the octagon from the second keyframe.
  (() => {
    const z = -66, W = 15, XF = -9.3;                                              // three storeys: the childhood street stays low
    // Issue #5 step 2: the block, marquee, lobby, ticket booth, poster cases and roof lattice are
    // the glb from asset/blender/lux.py; the painted billboards below stay canvas text on it.
    const lux = libGroup(ALL);
    MODELS.load('lux', gltf => {
      const root = MODELS.lambertize(gltf.scene);
      root.position.set(XF, 0, z); root.rotation.y = Math.PI / 2;
      lux.add(root);
    });
    // two painted billboards filling the upper facade
    function poster(title, sub, bg, blob) {
      const { cv, g } = canvas(1024, 768, bg);
      g.fillStyle = PALETTE[blob]; g.beginPath(); g.arc(700, 300, 230, 0, Math.PI * 2); g.fill();
      g.fillStyle = PALETTE.ink; g.beginPath(); g.moveTo(560, 768); g.quadraticCurveTo(640, 380, 780, 420); g.quadraticCurveTo(900, 470, 940, 768); g.fill();
      g.textAlign = 'left'; g.textBaseline = 'middle';
      fitText(g, title, 210, 560); g.fillStyle = PALETTE.ink; g.fillText(title, 50, 250);
      fitText(g, sub, 64, 520); g.fillStyle = PALETTE.ink; g.fillText(sub, 54, 420);
      g.fillStyle = PALETTE.verm; g.fillRect(50, 500, 420, 14);
      fitText(g, '樂聲戲院 · 今日上映', 58, 500); g.fillStyle = PALETTE.verm; g.fillText('樂聲戲院 · 今日上映', 50, 580);
      return tex(cv);
    }
    board(XF + 0.08, 4.6, z + 3.7, 6.8, 3.9, poster('英雄本色', 'A BETTER TOMORROW · 1986', 'haze', 'verm'), ALL, 'x');
    board(XF + 0.08, 4.6, z - 3.7, 6.8, 3.9, poster('倩女幽魂', 'A CHINESE GHOST STORY · 1987', 'bone', 'lamp'), ALL, 'x');
    board(XF + 0.08, 8.55, z, 13.8, 1.4, boardTex(2048, 680, 'bone', [{ text: '楚留香 · 成龍 · 周潤發 · 林青霞', size: 150, y: 250, col: 'ink' }, { text: '武昌街電影街', size: 110, y: 500, col: 'verm' }], 'verm'), ALL, 'x');
    const v = vertTex('樂聲戲院', 'verm', 'bone', 'bone');
    board(XF + 0.9, 3.6, z + W / 2 + 0.36, 6 * v.aspect, 6, v.t, ALL, 'z', 0.6);      // corner neon, read from the street
    F(XF + 0.6, z + W / 2 + 0.12, 3.4, 2.2, 0.3, 6.4, 'ink', ALL);                    // its dark backing, behind the board
  })();

  // ═══ 4. 萬年大樓 — the 1973 commercial tower, the tall landmark at the end of the chapter ═
  // Reference: 萬年商業大樓 on 西寧南路: a ten-storey concrete slab with a tight window grid,
  // a maze of small shops inside, an ice rink on top, a wall of vertical shop signs on the
  // street face and its name in big characters on the roof.
  (() => {
    const z = -124, W = 16, D = 14, ST = 10, FH = 3.3, XF = -9.3;
    const t = facadeTex(6, 10, 'haze');
    const p = part(XF - D / 2, 0, z, D, W, only(ALL, ST * FH, 'bone'));
    p.mesh.material.map = t; p.mesh.material.needsUpdate = true;
    part(XF - D / 2, ST * FH, z, D + 0.3, W + 0.3, only(ALL, 0.6, 'haze'));
    part(XF - D / 2 - 2, ST * FH + 0.6, z, D - 6, W - 6, only(ALL, 2.2, 'haze'));  // the rooftop rink hall
    board(XF - 1, ST * FH + 0.6, z, 12, 3.4, boardTex(1536, 440, 'bone', [{ text: '萬年商業大樓', size: 250, y: 220, col: 'verm' }], 'verm'), ALL, 'x', 0.4);
    const v = vertTex('萬年', 'verm', 'bone');
    board(XF + 0.1, 12, z + W / 2 - 1.5, 9 * v.aspect, 9, v.t, ALL, 'x', 0.5);
    for (let k = 0; k < 7; k++) { const vv = vertTex(['電玩', '冰宮', '唱片', '服飾', '漫畫', '模型', '小吃'][k], k % 2 ? 'bone' : 'lamp', 'ink'); board(XF + 0.1, 4 + (k % 3) * 2.6, z - 6.5 + k * 1.9, 5 * vv.aspect, 5, vv.t, ALL, 'x'); }
    part(XF - 0.7, 0, z, 1.4, W - 2, only(ALL, 3.6, 'ink'));                       // the dark ground-floor entrance
    part(XF + 0.02, 3.6, z, 0.1, W - 2, only(ALL, 0.6, 'verm'));
  })();

  // ═══ 5. the 1999 pedestrian zone — pavers on the road, bollards, the 西門町 gateway ═══════
  // Reference: 西門町行人徒步區 opened 1999: the road surface replaced by patterned pavers,
  // bollards at the entry and the arched 西門町 gateway signs. The camera reaches z -96 in 1996.
  (() => {
    const z0 = -96, z1 = -144;
    // CJ, 2026-09-24: 「後面地板破圖了」. On a phone the paving fills the bottom third of the frame, and what it showed there
    // was one lone half-strength red square per tile on near-white pavers with grey joins between them: it read as missing
    // textures (the same at 1440, only smaller and in the vignette; the pixel ratio and the shadow map were tested and
    // change nothing). The joins are now faint and the red is a band across every tile, the 西門町 pavers' own banding, so
    // the surface reads as one paved floor with a pattern in it rather than tiles with something showing through.
    const { cv, g } = canvas(128, 128, 'walk');
    g.fillStyle = PALETTE.verm; g.globalAlpha = 0.16; g.fillRect(0, 48, 128, 32); g.globalAlpha = 1;
    g.fillStyle = 'rgba(43,47,58,0.18)'; for (let i = 0; i < 4; i++) { g.fillRect(0, i * 32, 128, 2); g.fillRect(i * 32 + (i % 2) * 16, 0, 2, 128); }
    const t = tex(cv); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(4, 16);
    const pv = part(0, 0, (z0 + z1) / 2, 12.4, z0 - z1, only(ALL, 0.08, 'haze'));
    pv.mesh.material.map = t; pv.mesh.material.needsUpdate = true;
    [-5.4, -3.2, 3.2, 5.4].forEach(x => [z0 + 0.6, z1 - 0.6].forEach(z => bollards.push({ x, z, w: 1, d: 1, h: hOf(1, ALL) })));   // bollards (bollard.glb), the centre kept clear for the girl
    // the gateway: two posts, a flat arch, the sign
    [-6.4, 6.4].forEach(x => part(x, 0, z0, 0.5, 0.5, only(ALL, 6.2, 'verm')));
    const sh = new THREE.Shape(); sh.absarc(0, 0, 1, 0, Math.PI, false); sh.absarc(0, 0, 0.82, Math.PI, 0, true);
    const arcGeo = new THREE.ExtrudeGeometry(sh, { depth: 1, bevelEnabled: false }); arcGeo.translate(0, 0, -0.5);
    part(0, 5.4, z0, 6.65, 0.5, only(ALL, 2.2, 'verm'), 0, arcGeo);
    board(0, 6.3, z0 + 0.3, 5.2, 1.7, boardTex(1024, 336, 'bone', [{ text: '西門町', size: 200, y: 140, col: 'verm' }, { text: '行人徒步區 · SINCE 1999', size: 64, y: 280, col: 'ink' }], 'verm'), ALL, 'z', 0.4);
  })();

  // ═══ the shopfronts between: the teammate's Ximending library, with building bodies behind ═
  const lib = libGroup(['red']);
  // place a library storefront with its front on the sidewalk's outer edge (|x| = 9.2)
  function front(id, side, z, scale) {
    const a = findAsset(id); if (!a) return null;
    const probe = a.build(window.NostalgiaCore); probe.updateMatrixWorld(true);
    const b = new THREE.Box3().setFromObject(probe), maxz = b.max.z * (scale || 1);
    return asset(id, lib, side * (9.2 + maxz), z, side > 0 ? -Math.PI / 2 : Math.PI / 2, scale);
  }
  // a building body behind the storefront, x 9.4 outward. Issue #5: tiled from shopfront.glb
  // (asset/blender/shopfront.py): a ground module, one storey module per floor, a roof module,
  // each 6 m wide and scaled to the body's length; the body's colour goes on the walls.
  const tiles = { ground: [], storey: [], roof: [] };
  const body = (side, z, len, h, col) => {
    const nx = Math.max(1, Math.round(len / 6)), tw = len / nx, ny = Math.max(1, Math.round((h - 0.6) / 3.3));
    const r = side > 0 ? -Math.PI / 2 : Math.PI / 2, c = C(col);
    for (let i = 0; i < nx; i++) {
      const zz = z + len / 2 - tw * (i + 0.5);
      tiles.ground.push({ x: side * 9.4, z: zz, y: 0, r, w: tw / 6, d: 1, h: hOf(1), c });
      for (let f = 1; f < ny; f++) tiles.storey.push({ x: side * 9.4, z: zz, y: f * 3.3, r, w: tw / 6, d: 1, h: hOf(1), c });
      tiles.roof.push({ x: side * 9.4, z: zz, y: ny * 3.3, r, w: tw / 6, d: 1, h: hOf(1), c });
    }
  };
  // east side, from the street start: the 1980s row, then the Red House, then the 1990s
  // CJ, 2026-09-21: 「我希望一開始的兩邊不要太多大建築」— the opening stays open: two-storey
  // bodies only until the Red House plaza; the tall blocks start further down the street.
  front('movie-billboard-wall', 1, 38); body(1, 38, 10, 3.8, 'bone');
  front('record-shop', 1, 27); body(1, 27, 8, 4, 'haze');
  front('comic-rental-shop', 1, 17); body(1, 17, 7, 6.4, 'bone');
  front('public-phone-booth', 1, 10);
  front('yeh-lang-125', 1, 7.5); front('yeh-lang-125', 1, 6.3);
  front('internet-cafe', 1, 2); body(1, 2, 8, 4.2, 'walk');
  // z 0 … -50 is 1990–1992 in scroll time: no 2000s phone shop (Sony Ericsson, 2001), no
  // Pikachu gashapon (1996) and no photo-sticker booth (1995) here; 1980s fronts instead
  front('record-shop', 1, -8); body(1, -8, 8, 6.4, 'bone');
  front('arcade-cabinet', 1, -14.5); front('public-phone-booth', 1, -16);
  front('manga-rental', 1, -22); body(1, -22, 8, 4, 'haze');
  front('yeh-lang-125', 1, -29.4); front('yeh-lang-125', 1, -30.6);
  front('tower-records', 1, -38); body(1, -38, 12, 6.6, 'lamp');                 // 淘兒 1992: the yellow front on the corner before the Red House plaza, two storeys
  front('bbcall-ad-standee', 1, -46);
  // zone 2 (z 0 … -50), the east side facing 中華商場: the gaps between the fronts get their own
  // shophouses, and every shophouse storey here is painted (asset/paint/chunghwa_paint.py →
  // ximen-fronts.webp): two 3 m shops per ground floor, each with what it sells; iron-grille
  // cages, air conditioners, tile and vertical signs upstairs. The shopfront.glb modules stay
  // behind the paint for the silhouette (balcony slabs, AC boxes, parapets, tanks).
  body(1, -15, 6, 7.2, 'bone'); body(1, -29, 6, 10.5, 'haze'); body(1, -47, 6, 7.2, 'walk');
  (() => {
    const FW = 1536, FH = 844, CW = 384, CH = 211, X = 9.4 - 0.12;                // in front of the modules' sign boards
    const q = [];
    let g = 0, u = 0;
    // one painted face per 6 m module per storey, facing the road (-x): u runs south → north
    const face = (z, len, h, ground) => {
      const nx = Math.max(1, Math.round(len / 6)), tw = len / nx, ny = Math.max(1, Math.round((h - 0.6) / 3.3));
      for (let i = 0; i < nx; i++) {
        const zz = z + len / 2 - tw * (i + 0.5);
        for (let f = ground ? 0 : 1; f < ny; f++) {
          const k = f === 0 ? (g++ % 8) : 8 + (u++ * 3 % 8), cx = (k % 4) * CW, cy = Math.floor(k / 4) * CH;
          const u0 = cx / FW, u1 = (cx + CW) / FW, v1 = 1 - cy / FH, v0 = 1 - (cy + CH) / FH;
          q.push([[X, f * 3.3, zz - tw / 2, u0, v0], [X, f * 3.3, zz + tw / 2, u1, v0], [X, (f + 1) * 3.3, zz + tw / 2, u1, v1], [X, (f + 1) * 3.3, zz - tw / 2, u0, v1]]);
        }
      }
    };
    face(-8, 8, 6.4, false); face(-38, 12, 6.6, false);                           // behind library fronts: the storeys only
    face(-15, 6, 7.2, true); face(-29, 6, 10.5, true); face(-47, 6, 7.2, true);
    const pos = [], uv = [], idx = [];
    q.forEach(qq => { const b = pos.length / 3; qq.forEach(([x, y, z, a, c]) => { pos.push(x, y, z); uv.push(a, c); }); idx.push(b, b + 1, b + 2, b, b + 2, b + 3); });
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); geo.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
    geo.setIndex(idx); geo.computeVertexNormals();
    const TL = new THREE.TextureLoader(), t = n => { const x = TL.load('asset/textures/' + n + '.webp'); x.anisotropy = 8; return x; };
    const m = new THREE.Mesh(geo, withFog(new THREE.MeshLambertMaterial({ map: t('ximen-fronts'), normalMap: t('ximen-fronts-n'), polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -4 })));
    m.receiveShadow = true;
    lib.add(m);
  })();
  // west side after 中華商場 and 樂聲: the 1990s–2000s
  front('f4-poster-wall', -1, -82); body(-1, -82, 8, 6.6, 'bone');
  front('zhangjunya-snack-shelf', -1, -88.5);
  front('kamatiam-cooler-storefront', -1, -95); body(-1, -95, 8, 6.6, 'haze');
  front('concert-stage', -1, -106, 0.9); body(-1, -106, 10, 8, 'bone');          // the 簽唱會 stage at the pedestrian-zone corner
  // east side after the Red House: 2000s items toward the chapter's end
  front('zhangjunya-snack-shelf', 1, -90);
  front('creative-cafe-storefront', 1, -96); body(1, -96, 8, 8, 'walk');
  front('f4-poster-wall', 1, -104); body(1, -104, 8, 9, 'haze');
  front('bbcall-ad-standee', 1, -110);
  front('internet-cafe', 1, -117); body(1, -117, 10, 10, 'bone');
  front('photo-sticker-booth', 1, -125); front('gashapon-machine', 1, -127); front('arcade-cabinet', 1, -128.5);
  front('phone-shop-window', 1, -134); body(1, -134, 9, 11, 'haze');
  // a body behind the Red House plaza edge and beyond 萬年 so the row does not end in a field
  body(-1, -140, 8, 9, 'bone'); body(1, -142, 8, 10, 'walk');

  // ═══ the signs — CJ, 2026-09-21: 「希望有很多標語像asset裡面的文本那樣有大量回憶」 ═══════════════
  // Every name below comes from asset/ximen-1980s.md, ximen-1990s.md and ximen-2000s.md. One
  // library textPlane (canvas text on a coloured ground) per sign = one draw call; the brackets,
  // poles and banner ropes are instanced. Dense and small: the first 60 units carry most of them.
  const Core = window.NostalgiaCore;
  const COL = { verm: 'bone', lamp: 'ink', bone: 'ink', ink: 'lamp', haze: 'ink', sky: 'ink', walk: 'verm', leaf: 'bone' };
  let nSigns = 0;
  function sign(text, w, x, y, z, rotY, bg, vertical, size) {
    if (!Core) return null;
    const m = Core.textPlane(text, w, { bg: PALETTE[bg || 'bone'], color: PALETTE[COL[bg || 'bone']], vertical: !!vertical, fontSize: size || 96, padding: 26 });
    m.material.fog = false; m.material.side = THREE.DoubleSide;
    m.position.set(x, y, z); m.rotation.y = rotY || 0;
    lib.add(m); nSigns++;
    return m;
  }
  const BG = ['verm', 'lamp', 'bone', 'ink', 'haze', 'sky', 'walk', 'leaf'];
  const bgOf = i => BG[i % BG.length];
  // hanging signs: perpendicular to the facade, read walking down the street. side +1 east.
  function hang(text, side, z, y, i, big) {
    const w = big ? 0.75 : 0.55, ax = side * (side > 0 ? 9.2 : 6.2);                // the facade line
    const m = sign(text, w, side * (Math.abs(ax) - 0.55 - w / 2), y, z, 0, bgOf(i), true, 96);
    if (m) { const h = m.geometry.parameters.height; F(side * (Math.abs(ax) - 0.5), z, y + h / 2 - 0.03, 1.1, 0.05, 0.05, 'ink'); }
  }
  // wall boards: flat on the facade, facing the road
  const wall = (text, side, z, y, w, i, size) => sign(text, w, side * (side > 0 ? 9.12 : 6.12), y, z, side > 0 ? -Math.PI / 2 : Math.PI / 2, bgOf(i), false, size || 96);
  // posters at eye level
  const poster2 = (text, side, z, i) => sign(text, 0.7, side * (side > 0 ? 9.1 : 6.1), 1.5, z, side > 0 ? -Math.PI / 2 : Math.PI / 2, bgOf(i + 2), true, 88);
  // banners across the street on two poles (y clear of the camera: 6.6 at z 40, 5.3 at z 0, 3.7 at z -60)
  function banner(text, z, y, bg) {
    [-5.9, 5.9].forEach(x => F(x, z, 0, 0.14, 0.14, y + 0.8, 'haze'));
    F(0, z, y + 0.72, 11.8, 0.04, 0.04, 'ink');
    sign(text, 10.5, 0, y, z, 0, bg || 'verm', false, 110);
  }
  // price cards on the kerb stalls, small, facing the road
  const card = (text, x, z, r) => sign(text, 0.9, x, 1.35, z, r, 'bone', false, 72);

  // 中華商場 (west, z 46 … -46): the shops under the arcade and the brands on the walls
  ['電子零件', '訂做制服', '點心世界', '郵票錢幣', '收音機', '軍用品', '皮鞋', '眼鏡', '鐘錶', '唱片', '文具', '玩具', '西裝', '鑰匙', '刻印', '布莊'].forEach((t, i) => hang(t, -1, 44 - i * 5.6, 2.9, i));
  [['國際牌 National', 'verm'], ['黑松汽水', 'lamp'], ['三洋電視', 'sky'], ['聲寶', 'verm'], ['大同電鍋', 'bone'], ['歌林', 'lamp'], ['味全', 'verm'], ['統一', 'bone'], ['點心世界 酸辣湯', 'lamp'], ['中華商場 歲末大特價', 'verm'], ['電子零件 批發零售', 'sky'], ['訂做制服 一日交件', 'bone']].forEach(([t, bg], i) => sign(t, 2.6, -6.02, i % 2 ? 3.85 : 7.15, 42 - i * 7.4, Math.PI / 2, bg, false, 96));
  // east side, the 1980s: shop names hanging, stars and cartoons on the walls, posters at eye level
  ['唱片行', '租書店', '冰果室', '電動間', '錄影帶', '卡帶黑膠', '漫畫', '麵線', '冰宮', 'MTV', '書局', '模型', '理髮', '相館', '茶行', '雜貨', '西藥房', '委託行', '小吃', '皮件'].forEach((t, i) => hang(t, 1, 44 - i * 4.4, 2.6 + (i % 3) * 0.7, i + 3));
  [['鄧麗君 新歌上市', 2.4], ['鳳飛飛', 1.6], ['羅大佑 鹿港小鎮', 2.4], ['蘇芮', 1.4], ['齊秦 王傑', 1.8], ['李宗盛', 1.6], ['小虎隊 1988', 2.2], ['小叮噹', 1.6], ['七龍珠', 1.6], ['怪博士與機器娃娃', 2.6], ['小甜甜', 1.4], ['科學小飛俠', 2.0], ['無敵鐵金剛', 2.0], ['楚留香', 1.6], ['林青霞 王祖賢', 2.2], ['張國榮', 1.6], ['周潤發 成龍', 2.2], ['米老鼠 Hello Kitty', 2.4]].forEach(([t, w], i) => wall(t, 1, 45 - i * 5.1, 3.9 + (i % 2) * 1.3, w, i + 1, 96));
  ['楚留香', '英雄本色', '小叮噹', '七龍珠', '小甜甜', '港片', '林青霞', '成龍', '周潤發', '鳳飛飛', '羅大佑', '小虎隊', '米老鼠', 'Hello Kitty', '尪仔標', '彈珠汽水'].forEach((t, i) => poster2(t, 1, 46.5 - i * 5.4 + (i % 2) * 1.3, i));
  ['冰果室', '電動間', '租書店', '紅豆牛奶冰', '小蜜蜂', '瑪利歐', '卡帶', '黑膠'].forEach((t, i) => poster2(t, -1, 20 - i * 6.6, i + 5));
  // banners across the road
  banner('中華商場 歲末大特價', 38, 8.2, 'verm');
  banner('電影街 本週上映 楚留香', 10, 7.6, 'lamp');   // far enough that it sits under the opening title
  banner('小虎隊 新專輯 全面上市', 0, 7.0, 'verm');
  banner('西門町 電影街 · 樂聲 豪華 今日上映', -52, 6.2, 'ink');
  // price cards on the kerb stalls (east stalls face the road, -x)
  [['紅豆牛奶冰 15元', 32], ['彈珠汽水 8元', 21.5], ['尪仔標 一張5元', -19.5], ['錄影帶 一夜30元', -33]].forEach(([t, z]) => card(t, 6.75, z + 0.2, -Math.PI / 2));
  [['卡帶 120元', -52], ['刨冰 一盤15元', -76], ['電動 一枚5元', -114]].forEach(([t, z]) => card(t, -6.75, z + 0.2, Math.PI / 2));
  // lamp-post and pole signs down the first stretch
  for (let i = 0; i < 8; i++) { const z = 41 - i * 8.2, side = i % 2 ? -1 : 1; F(side * 5.6, z, 0, 0.12, 0.12, 4.2, 'haze'); sign(['禁止停車', '西門町', '中華路', '武昌街', '成都路', '漢中街', '公車站', '電影街'][i], 0.9, side * 5.6, 3.6, z + 0.08, 0, i % 2 ? 'sky' : 'bone', false, 80); }
  // the 1990s stretch (z -45 … -96): the next decade's names, thinner
  ['淘兒音樂城', '佳佳唱片', 'KTV', 'VCD', '拍貼', 'BB Call', '大哥大', '電子雞', '快打旋風', '格鬥天王', 'SEGA', 'PlayStation', 'Game Boy', '皮卡丘'].forEach((t, i) => hang(t, i % 2 ? -1 : 1, -50 - i * 3.3, 2.7 + (i % 3) * 0.6, i + 2, true));
  [['四大天王 劉德華 張學友 郭富城 黎明', 3.2], ['張惠妹 姊妹 1996', 2.4], ['伍佰', 1.4], ['任賢齊 心太軟', 2.2], ['王菲 徐若瑄 范曉萱', 2.8], ['灌籃高手', 1.8], ['美少女戰士', 2.0], ['名偵探柯南', 2.0], ['櫻桃小丸子 蠟筆小新', 2.6], ['哆啦A夢 1997', 2.0], ['神奇寶貝 1998', 2.0]].forEach(([t, w], i) => wall(t, i % 2 ? -1 : 1, -80 - i * 4.6, 3.6 + (i % 2), w, i + 4, 96));
  // the pedestrian zone (z -96 … -140): the 2000s
  [['周杰倫 Jay 簽唱會', 2.6], ['蔡依林 S.H.E 5566', 2.8], ['孫燕姿 王力宏', 2.4], ['F4 流星花園', 2.2], ['火影忍者 海賊王', 2.4], ['張君雅小妹妹 維力手打麵', 3.0], ['網咖 天堂 RO 楓之谷', 2.8], ['Nokia Sony Ericsson', 2.6], ['阿宗麵線', 1.6], ['MP3 MSN 大頭貼', 2.4]].forEach(([t, w], i) => wall(t, i % 2 ? -1 : 1, -100 - i * 4, 3.4 + (i % 2) * 1.2, w, i + 1, 96));
  window.__ximenSigns = () => nSigns;

  // ── one street stall: post-and-awning, counter, goods, crates, basket, seller and shoppers ──
  const stallEra = { red: 1, dadao: 0 };
  const PY = 0.08;                                                                // the plaza paving and the 1999 pavers; kerb stalls sit on the sidewalk slab
  function stall(sx, sz, fx, fz, i, front) {
    const H = k => ({ red: k });
    const along = (u, v) => [sx + fx * u - fz * v, sz + fz * u + fx * v];
    const dims = (a, b) => fz ? [b, a] : [a, b];
    const push = (u, v, y, a, b, h, col) => { const [x, z] = along(u, v); const [w, d] = dims(a, b); furn.push({ x, z, y, w, d, h: H(h), c: C(col) }); };
    push(0.5, 0, 0, 1.0, 2.2, 0.85, 'bone');
    [-1.1, 1.1].forEach(v => { push(1.0, v, 0, 0.1, 0.1, 2.2, 'ink'); push(-0.9, v, 0, 0.1, 0.1, 2.4, 'ink'); });
    push(0, 0, 2.2, 2.2, 2.6, 0.12, i % 3 === 1 ? 'verm' : (i % 3 === 2 ? 'lamp' : 'bone'));
    push(0.5, -0.45 + rnd() * 0.9, 0.85, 0.45, 0.55, 0.3, i % 2 ? 'lamp' : 'verm');
    const cv = i % 2 ? 1.5 : -1.5, cu = 0.3 + rnd() * 0.6;
    const [cx, cz] = along(cu, cv);
    furn.push({ x: cx, z: cz, y: 0, w: 0.6, d: 0.6, h: H(0.55), c: C('bone'), r: rnd() * 0.5 });
    const [bx, bz] = along(1.2 + rnd() * 0.3, -cv * 0.93);
    baskets.push({ x: bx, z: bz, w: 0.7, d: 0.7, h: H(0.4), c: C(i % 3 ? 'bone' : 'haze') });
    const [ex, ez] = along(-0.3, 0.3);
    crowd.push({ x: ex, z: ez, y: PY, r: fz ? 3.1 : (fx > 0 ? 1.57 : -1.57), v: 1, h: H(1.6) });     // the seller, behind the counter
    const n = 1 + Math.floor(rnd() * 2), [u0, u1] = front || [1.8, 3.2];
    for (let k = 0; k < n; k++) {
      const [px, pz] = along(u0 + rnd() * (u1 - u0), -1 + rnd() * 2);
      crowd.push({ x: px, z: pz, y: PY, r: rnd() * 6.28, h: H(1.5 + rnd() * 0.3) });   // shoppers at the stall
    }
  }
  // the plaza in front of the Red House: two rows of stalls facing the camera
  [-50, -56].forEach(z => [9.6, 12.6, 15.6, 18.6, 21.6].forEach((x, i) => stall(x, z, 0, 1, i + (z < -52 ? 1 : 0))));
  // kerb stalls under the arcades, facing the road, clear of the library props and the camera
  [[1, 32], [1, 21.5], [1, -19.5], [1, -33], [-1, -52], [-1, -76], [-1, -114], [1, -74], [1, -86], [1, -100]].forEach(([s, z], i) => stall(s * 7.9, z, -s, 0, i + 5, [1.3, 2.0]));

  // ── small props along the sidewalks (props.glb): A-board signs at the kerb, potted plants and
  //    box stacks by the shop walls; kept off the camera keyframe (-3, 3.5, -34) and the gateway ──
  for (let z = 30, i = 0; z > -132; z -= 9, i++) {
    const s = i % 2 ? 1 : -1;
    if (s < 0 && z < -27 && z > -41) continue;
    if (Math.abs(z + 96) < 3) continue;
    aboards.push({ x: s * 7.3, z: z + 1.5, w: 1, d: 1, r: s > 0 ? -Math.PI / 2 : Math.PI / 2, h: hOf(1) });
    plants.push({ x: s * 8.9, z: z - 2.2, w: 1, d: 1, r: rnd() * 6.28, h: hOf(1) });
    if (i % 3 === 0) boxes.push({ x: s * 8.6, z: z + 3.8, w: 1, d: 1, r: (rnd() - 0.5) * 0.4, h: hOf(1) });
  }

  // ── the street crowd (issue #13, the engine's people() figures): along both sidewalks, under the
  //    中華商場 arcade on the west, thick in the 1999 pedestrian zone; the road itself stays empty ──
  (() => {
    let n = 0;
    while (n < 70) {
      const s = n % 2 ? 1 : -1, z = 40 - rnd() * 180, x = s * (6.2 + rnd() * 1.1);
      if (s < 0 && z < -29 && z > -39) continue;                                   // camera keyframe (-3, 3.5, -34)
      if (z < -94 && z > -98) continue;                                            // the gateway posts
      n++;
      const rr = rnd();
      crowd.push({ x, z, y: 0.22, r: (rr < 0.5 ? 0 : Math.PI) + ((rr * 4) % 1 - 0.5) * 0.9, h: { red: 1.5 + rnd() * 0.3 } });   // walking along the street
    }
    for (let i = 0; i < 30; i++) crowd.push({ x: (rnd() - 0.5) * 9, z: -100 - rnd() * 40, y: PY, r: rnd() * 6.28, h: { red: 1.5 + rnd() * 0.3 } });   // the 1999 pedestrian zone: pavers, no traffic
    for (let i = 0; i < 12; i++) crowd.push({ x: -8.5 - rnd() * 4, z: -101 - rnd() * 4, y: 0.22, r: 1.57, h: { red: 1.5 + rnd() * 0.3 } }); // in front of the concert stage
  })();
  // parked scooters at the kerb, every era
  for (let i = 0; i < 16; i++) {
    const east = i < 8, x = east ? 5.2 : -5.2, z = east ? -55 - i * 0.95 : -108 - (i - 8) * 0.95;
    furn.push({ x, z, y: 0.25, w: 0.55, d: 1.6, h: hOf(0.55, ALL), c: C('haze'), r: (rnd() - 0.5) * 0.3 });
    furn.push({ x, z: z - 0.1, y: 0.8, w: 0.5, d: 0.7, h: hOf(0.16, ALL), c: C(i % 4 === 0 ? 'verm' : 'ink'), r: (rnd() - 0.5) * 0.3 });
  }
  // ── build the instanced sets ────────────────────────────────────────────────
  instSet(boxGeo, lam('bone'), furn, { colors: true });
  MODELS.load('shopfront', gltf => Object.keys(tiles).forEach(k => MODELS.instance(MODELS.node(gltf.scene, k), tiles[k], { colorPrim: 'bone' })));
  MODELS.load('bollard', gltf => MODELS.instance(gltf.scene, bollards));
  MODELS.load('props', gltf => { MODELS.instance(MODELS.node(gltf.scene, 'aboard'), aboards); MODELS.instance(MODELS.node(gltf.scene, 'plant'), plants); MODELS.instance(MODELS.node(gltf.scene, 'boxes'), boxes); });
  instSet(basketGeo, lam('bone'), baskets, { colors: true });
  people(crowd);
})();
