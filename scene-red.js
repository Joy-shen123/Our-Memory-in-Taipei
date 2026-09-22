// scene-red.js — When We Were Young: Ximending 1985–1999. Everything here is rebuilt from a
// real building: the Red House octagon and its cross-shaped market wing, the eight blocks of
// 中華商場 with their rooftop neon, 樂聲戲院 with hand-painted billboards, 萬年大樓, and the
// 1999 pedestrian zone. The teammate's Ximending asset library fills the shopfronts between.
// Primitives, canvas textures and the palette, plus the Red House glb (issue #5). References are listed in HANDOFF.md.
(function () {
  if (!window.SCENE) return;
  const { part, instSet, only, C, boxGeo, PALETTE, rnd, anchors, libGroup, asset, findAsset, walkX, lam, withFog } = window.SCENE;
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
  const furn = [], crowd = [], wheels = [], baskets = [], bodies = [], columns = [], winBoxes = [];
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

  // ═══ 2. 中華商場 — eight three-storey blocks with rooftop neon, 1961–1992 ══════════════
  // Reference: the eight blocks 忠孝仁愛信義和平 along 中華路: concrete, an arcade of shops at
  // street level, two floors of small windows and balconies above, flat roofs carrying the
  // big steel-framed signs (國際牌, 黑松 …) that lit the road at night. West side of the street,
  // 1985–1991 in scroll time; demolished in 1992, so the childhood chapter only.
  // CJ, 2026-09-21: 「盡量矮點才能比較後來的建設跟慢慢長大的感覺」— drawn at two storeys (arcade +
  // one floor) so the childhood street stays low and the later chapters grow above it.
  (() => {
    const NAMES = ['忠', '孝', '仁', '愛', '信', '義', '和', '平'];
    const NEON = [['國際牌', 'verm'], ['黑松汽水', 'lamp'], ['三洋', 'verm'], ['聲寶', 'lamp'], ['歌林', 'verm'], ['大同', 'lamp'], ['味全', 'verm'], ['SONY', 'lamp']];
    const L = 10, GAP = 1.6, FLOOR = 3.3, XF = -6.2, DEPTH = 10;                 // block length, gap, storey height, arcade line, depth
    // Issue #5 step 2: one block is the glb from asset/blender/chunghwa.py (arcade columns, shop
    // wall with dark doorways and sign boards, the balcony-window storey, parapet, roof tank),
    // cloned eight times. The name plates and the rooftop neon stay canvas text on it.
    const blocks = libGroup(RED), blockZ = NAMES.map((nm, i) => 46 - L / 2 - i * (L + GAP));
    MODELS.load('chunghwa', gltf => {
      const root = MODELS.lambertize(gltf.scene);
      blockZ.forEach(z => { const b = root.clone(); b.position.set(XF, 0, z); b.rotation.y = Math.PI / 2; blocks.add(b); });
    });
    const plates = [];
    NAMES.forEach((nm, i) => {
      const z = blockZ[i], x0 = XF - DEPTH / 2;
      // block name: a pale plate on the road-facing corner
      const v = vertTex(nm + '棟', 'bone', 'ink', 'verm');
      board(XF + 0.02, FLOOR + 0.3, z + L / 2 - 1.2, 3.0 * v.aspect, 3.0, v.t, RED, 'x');
      // rooftop neon: a steel lattice frame and the sign, angled toward the road
      const y = FLOOR * 2 + 0.5, sx = x0 + 1.5, sz = z;
      [-1.9, 1.9].forEach(dz => F(sx, sz + dz, y, 0.18, 0.18, 3.4, 'ink'));
      F(sx, sz, y + 3.4, 0.18, 4.2, 0.18, 'ink');
      F(sx, sz, y + 1.7, 0.18, 4.2, 0.14, 'ink');
      const [txt, colr] = NEON[i];
      const t = boardTex(768, 320, 'ink', [{ text: txt, size: 190, y: 160, col: colr }], colr);
      const p = board(sx + 0.15, y + 0.5, sz, 4.4, 2.5, t, RED, 'x', 0.7); p.mesh.rotation.y = -0.35; // faces the road, turned toward the camera
      plates.push(p);
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
    const { cv, g } = canvas(128, 128, 'walk');
    g.fillStyle = 'rgba(43,47,58,0.35)'; for (let i = 0; i < 4; i++) { g.fillRect(0, i * 32, 128, 2); g.fillRect(i * 32 + (i % 2) * 16, 0, 2, 128); }
    g.fillStyle = PALETTE.verm; g.globalAlpha = 0.5; g.fillRect(48, 48, 32, 32); g.globalAlpha = 1;
    const t = tex(cv); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(4, 16);
    const pv = part(0, 0, (z0 + z1) / 2, 12.4, z0 - z1, only(ALL, 0.08, 'haze'));
    pv.mesh.material.map = t; pv.mesh.material.needsUpdate = true;
    [-5.4, -3.2, 3.2, 5.4].forEach(x => F(x, z0 + 0.6, 0, 0.3, 0.3, 0.9, 'haze', ALL));   // bollards, the centre kept clear for the girl
    // the gateway: two posts, a flat arch, the sign
    [-6.4, 6.4].forEach(x => part(x, 0, z0, 0.5, 0.5, only(ALL, 6.2, 'verm')));
    const sh = new THREE.Shape(); sh.absarc(0, 0, 1, 0, Math.PI, false); sh.absarc(0, 0, 0.82, Math.PI, 0, true);
    const arcGeo = new THREE.ExtrudeGeometry(sh, { depth: 1, bevelEnabled: false }); arcGeo.translate(0, 0, -0.5);
    part(0, 5.4, z0, 6.65, 0.5, only(ALL, 2.2, 'verm'), 0, arcGeo);
    board(0, 6.3, z0 + 0.3, 5.2, 1.7, boardTex(1024, 336, 'bone', [{ text: '西門町', size: 200, y: 140, col: 'verm' }, { text: '行人徒步區 · SINCE 1999', size: 64, y: 280, col: 'ink' }], 'verm'), ALL, 'z', 0.4);
  })();

  // ═══ the shopfronts between: the teammate's Ximending library, with building bodies behind ═
  const lib = libGroup(['red']);
  const bodyTex = facadeTex(4, 3, 'bone'); bodyTex.needsUpdate = true;
  // place a library storefront with its front on the sidewalk's outer edge (|x| = 9.2)
  function front(id, side, z, scale) {
    const a = findAsset(id); if (!a) return null;
    const probe = a.build(window.NostalgiaCore); probe.updateMatrixWorld(true);
    const b = new THREE.Box3().setFromObject(probe), maxz = b.max.z * (scale || 1);
    return asset(id, lib, side * (9.2 + maxz), z, side > 0 ? -Math.PI / 2 : Math.PI / 2, scale);
  }
  // a plain building body, x 9.4 outward, with a window texture on the road face
  const body = (side, z, len, h, col) => bodies.push({ x: side * (9.4 + 4.6), z, w: 9.2, d: len, h: hOf(h), c: C(col) });
  // east side, from the street start: the 1980s row, then the Red House, then the 1990s
  // CJ, 2026-09-21: 「我希望一開始的兩邊不要太多大建築」— the opening stays open: two-storey
  // bodies only until the Red House plaza; the tall blocks start further down the street.
  front('movie-billboard-wall', 1, 38); body(1, 38, 10, 3.8, 'bone');
  front('record-shop', 1, 27); body(1, 27, 8, 4, 'haze');
  front('comic-rental-shop', 1, 17); body(1, 17, 7, 6.4, 'bone');
  front('public-phone-booth', 1, 10);
  front('yeh-lang-125', 1, 7.5); front('yeh-lang-125', 1, 6.3);
  front('internet-cafe', 1, 2); body(1, 2, 8, 4.2, 'walk');
  front('phone-shop-window', 1, -8); body(1, -8, 8, 6.4, 'bone');
  front('arcade-cabinet', 1, -14.5); front('gashapon-machine', 1, -16);
  front('manga-rental', 1, -22); body(1, -22, 8, 4, 'haze');
  front('photo-sticker-booth', 1, -30);
  front('tower-records', 1, -38); body(1, -38, 12, 6.6, 'lamp');                 // 淘兒 1992: the yellow front on the corner before the Red House plaza, two storeys
  front('bbcall-ad-standee', 1, -46);
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
  [['國際牌 National', 'verm'], ['黑松汽水', 'lamp'], ['三洋電視', 'sky'], ['聲寶', 'verm'], ['大同電鍋', 'bone'], ['歌林', 'lamp'], ['味全', 'verm'], ['統一', 'bone'], ['點心世界 酸辣湯', 'lamp'], ['中華商場 歲末大特價', 'verm'], ['電子零件 批發零售', 'sky'], ['訂做制服 一日交件', 'bone']].forEach(([t, bg], i) => sign(t, 2.6, -6.12, 5.5 - (i % 2) * 1.1, 42 - i * 7.4, Math.PI / 2, bg, false, 96));
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
    crowd.push({ x: ex, z: ez, w: 0.5, d: 0.4, r: fz ? 3.1 : (fx > 0 ? 1.57 : -1.57), c: C('haze'), h: H(1.6) });
    const n = 1 + Math.floor(rnd() * 2), [u0, u1] = front || [1.8, 3.2];
    for (let k = 0; k < n; k++) {
      const [px, pz] = along(u0 + rnd() * (u1 - u0), -1 + rnd() * 2);
      crowd.push({ x: px, z: pz, w: 0.5, d: 0.4, r: rnd() * 6.28, c: C(rnd() < 0.12 ? 'verm' : rnd() < 0.5 ? 'bone' : 'haze'), h: H(1.5 + rnd() * 0.3) });
    }
  }
  // the plaza in front of the Red House: two rows of stalls facing the camera
  [-50, -56].forEach(z => [9.6, 12.6, 15.6, 18.6, 21.6].forEach((x, i) => stall(x, z, 0, 1, i + (z < -52 ? 1 : 0))));
  // kerb stalls under the arcades, facing the road, clear of the library props and the camera
  [[1, 32], [1, 21.5], [1, -19.5], [1, -33], [-1, -52], [-1, -76], [-1, -114], [1, -74], [1, -86], [1, -100]].forEach(([s, z], i) => stall(s * 7.9, z, -s, 0, i + 5, [1.3, 2.0]));

  // ── the street crowd along both kerbs, thick at the pedestrian zone ──
  (() => {
    let n = 0;
    while (n < 70) {
      const s = n % 2 ? 1 : -1, z = 40 - rnd() * 180, x = s * (5.3 + rnd() * 1.1);
      if (s < 0 && z < -29 && z > -39) continue;                                   // camera keyframe (-3, 3.5, -34)
      if (z < -94 && z > -98) continue;                                            // the gateway posts
      n++;
      const c = n % 8 === 0 ? 'verm' : n % 3 === 0 ? 'haze' : 'bone';
      crowd.push({ x, z, w: 0.5, d: 0.4, r: rnd() * 6.28, c: C(c), h: { red: 1.5 + rnd() * 0.3 } });
    }
    for (let i = 0; i < 30; i++) crowd.push({ x: (rnd() - 0.5) * 9, z: -100 - rnd() * 40, w: 0.5, d: 0.4, r: rnd() * 6.28, c: C(i % 6 === 0 ? 'verm' : i % 3 ? 'bone' : 'haze'), h: { red: 1.5 + rnd() * 0.3 } });
    for (let i = 0; i < 12; i++) crowd.push({ x: -8.5 - rnd() * 4, z: -101 - rnd() * 4, w: 0.5, d: 0.4, r: 1.57, c: C(i % 4 === 0 ? 'verm' : 'bone'), h: { red: 1.5 + rnd() * 0.3 } }); // in front of the concert stage
  })();
  // parked scooters at the kerb, every era
  for (let i = 0; i < 16; i++) {
    const east = i < 8, x = east ? 5.2 : -5.2, z = east ? -55 - i * 0.95 : -108 - (i - 8) * 0.95;
    furn.push({ x, z, y: 0.25, w: 0.55, d: 1.6, h: hOf(0.55, ALL), c: C('haze'), r: (rnd() - 0.5) * 0.3 });
    furn.push({ x, z: z - 0.1, y: 0.8, w: 0.5, d: 0.7, h: hOf(0.16, ALL), c: C(i % 4 === 0 ? 'verm' : 'ink'), r: (rnd() - 0.5) * 0.3 });
  }
  // every figure gets a head: body to 78%, a small cube on top (ink hair on a bone body, bone skin on the rest)
  const BONE = C('bone').getHex();
  crowd.slice().forEach(it => {
    const hb = {}, hh = {}; let top = 0;
    Object.keys(it.h).forEach(k => { const v = it.h[k] || 0; hb[k] = v * 0.78; hh[k] = v > 0 ? 0.34 : 0; top = Math.max(top, v * 0.78); });
    it.h = hb;
    crowd.push({ x: it.x, z: it.z, y: top + 0.02, w: 0.34, d: 0.34, r: it.r, c: C(it.c.getHex() === BONE ? 'ink' : 'bone'), h: hh });
  });

  // ── build the instanced sets ────────────────────────────────────────────────
  instSet(boxGeo, lam('bone'), furn, { colors: true });
  instSet(boxGeo, lam('walk'), columns, { colors: true });
  instSet(boxGeo, lam('ink'), winBoxes);
  // window rows scale with height: three rows on the low bodies, six on the tall ones
  instSet(boxGeo, lam('bone', { map: bodyTex }), bodies.filter(b => b.h.red <= 4.5), { colors: true }).mesh.material.map.repeat.set(2, 0.34);
  instSet(boxGeo, lam('bone', { map: bodyTex.clone() }), bodies.filter(b => b.h.red > 4.5 && b.h.red <= 8), { colors: true }).mesh.material.map.repeat.set(2, 0.67);
  instSet(boxGeo, lam('bone', { map: bodyTex.clone() }), bodies.filter(b => b.h.red > 8), { colors: true }).mesh.material.map.repeat.set(2, 1);
  instSet(basketGeo, lam('bone'), baskets, { colors: true });
  instSet(boxGeo, lam('bone'), crowd, { colors: true });
})();
