// 時代迷霧 · 大稻埕 — scroll rig, directional fog, era re-render, anchor silhouettes,
// the 月下老人 queue beat, and the uPrint post pass (woodblock → night photograph).

(function () {
  const { PALETTE, GRID, ERAS, TILES, CAM, CLOSING, WORDS } = window.DATA;
  const C = k => new THREE.Color(PALETTE[k]);

  // ── tunables ──────────────────────────────────────────────────────────────────
  const FOG_LEAD = 44;        // how far ahead of the camera the fog frontier sits
  const FOG_SOFT = 28;        // width of the soft edge, in world units
  const HAZE_DENSITY = 0.0022; // gentle distance haze so looking back still has depth
  const DAMP = 5.5;           // scroll damping. higher = snappier
  const ERA_MS = 500;         // the world re-renders into the next era over this long
  const LABEL_NEAR = 70;      // anchor labels fade in inside this distance
  // per-era mix of the five colours: sky/fog darkens, lamp light grows, print fades
  const ERA_MIX = { red: { night: 0.0, lamp: 1.1, hemi: 1.1 }, dadao: { night: 0.05, lamp: 1.2, hemi: 1.0 },
                    tower: { night: 0.45, lamp: 1.1, hemi: 0.75 } };

  // ── fog: directional, permanent, and cheap ───────────────────────────────────
  // three.js fog is distance-from-camera. The brief's fog is "the part of the century you
  // have not reached": a wall at a world-z frontier, thick beyond, clear behind, and it only
  // ever moves forward. The four fog chunks are replaced globally so every material inherits
  // it; the two extra uniforms are shared objects, updated once per frame.
  const FOG_U = { frontier: { value: 0 }, soft: { value: FOG_SOFT } };
  THREE.ShaderChunk.fog_pars_vertex = `
    #ifdef USE_FOG
      varying float vFogDepth;
      varying float vFogZ;
    #endif`;
  THREE.ShaderChunk.fog_vertex = `
    #ifdef USE_FOG
      vFogDepth = - mvPosition.z;
      vec4 fogWP = vec4( transformed, 1.0 );
      #ifdef USE_INSTANCING
        fogWP = instanceMatrix * fogWP;
      #endif
      fogWP = modelMatrix * fogWP;
      vFogZ = fogWP.z;
    #endif`;
  THREE.ShaderChunk.fog_pars_fragment = `
    #ifdef USE_FOG
      uniform vec3 fogColor;
      uniform float fogDensity;
      uniform float uFrontier;
      uniform float uSoft;
      varying float vFogDepth;
      varying float vFogZ;
    #endif`;
  THREE.ShaderChunk.fog_fragment = `
    #ifdef USE_FOG
      float fogAhead = uFrontier - vFogZ;
      float fogVeil = smoothstep( 0.0, uSoft, fogAhead );
      float fogHaze = 1.0 - exp( - fogDensity * fogDensity * vFogDepth * vFogDepth );
      float fogFactor = max( fogVeil, fogHaze );
      gl_FragColor.rgb = mix( gl_FragColor.rgb, fogColor, fogFactor );
    #endif`;
  const withFog = mat => {
    mat.onBeforeCompile = shader => {
      shader.uniforms.uFrontier = FOG_U.frontier;
      shader.uniforms.uSoft = FOG_U.soft;
    };
    return mat;
  };

  // ── renderer, scene, camera ──────────────────────────────────────────────────
  const canvas = document.getElementById('scene');
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.outputEncoding = THREE.LinearEncoding; // gamma is applied at the end of the post pass

  const scene = new THREE.Scene();
  scene.background = C('haze');
  scene.fog = new THREE.FogExp2(PALETTE.haze, HAZE_DENSITY);
  const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 600);

  const hemi = new THREE.HemisphereLight(C('bone'), C('ink'), 0.55);
  scene.add(hemi);
  const key = new THREE.DirectionalLight(C('lamp'), 0.9);
  key.position.set(18, 26, 12);
  scene.add(key);

  // ── ground, road, river ──────────────────────────────────────────────────────
  const flat = (w, d, col, x, y, z) => {
    const g = new THREE.PlaneGeometry(w, d); g.rotateX(-Math.PI / 2);
    const m = new THREE.Mesh(g, withFog(new THREE.MeshLambertMaterial({ color: C(col) })));
    m.position.set(x, y, z); scene.add(m); return m;
  };
  flat(400, 900, 'leaf', 0, 0, -200).material.color.lerp(C('ink'), 0.45);
  flat(GRID.roadWidth, 620, 'road', 0, 0.02, -200);
  flat(60, 620, 'sky', -50, -0.3, -200).material.color.lerp(C('haze'), 0.5);

  // ── year markings painted on the road at each era boundary ───────────────────
  // Digits drawn to a canvas with the system font (no font files, no images), laid flat on
  // the road in perspective. The camera passes over them at the exact flip.
  function yearMarking(year, z) {
    const cv = document.createElement('canvas');
    cv.width = 1024; cv.height = 512;
    const g = cv.getContext('2d');
    g.fillStyle = PALETTE.bone;
    g.font = '700 400px -apple-system, "Helvetica Neue", Helvetica, Arial, sans-serif';
    g.textAlign = 'center'; g.textBaseline = 'middle';
    g.fillText(String(year), 512, 276);
    const tex = new THREE.CanvasTexture(cv);
    tex.anisotropy = renderer.capabilities.getMaxAnisotropy();
    const geo = new THREE.PlaneGeometry(GRID.roadWidth - 1, (GRID.roadWidth - 1) * 1.1);
    geo.rotateX(-Math.PI / 2);
    const m = new THREE.Mesh(geo, withFog(new THREE.MeshBasicMaterial({ map: tex, transparent: true, opacity: 0.9, depthWrite: false })));
    m.position.set(0, 0.05, z - 8);
    scene.add(m);
  }
  ERAS.slice(1).forEach(e => yearMarking(e.start, e.zRange[0]));

  // ── parts: every box in the world, with a height and colour per era ──────────
  // A part is { mesh, look:{era:{h,c}} }. Height 0 = not there. The era tween lerps all of
  // them together over ERA_MS, ahead of the camera and behind it alike.
  const boxGeo = new THREE.BoxGeometry(1, 1, 1);
  boxGeo.translate(0, 0.5, 0); // origin at the base so scale.y is height
  const parts = [];
  function part(x, y, z, w, d, look, rotY, geo) {
    const mesh = new THREE.Mesh(geo || boxGeo, withFog(new THREE.MeshLambertMaterial({ color: C('bone') })));
    mesh.position.set(x, y, z);
    mesh.scale.set(w, 1, d);
    if (rotY) mesh.rotation.y = rotY;
    scene.add(mesh);
    const L = {};
    ERAS.forEach(e => { const s = look[e.key]; L[e.key] = s && s.h > 0 ? { h: s.h, c: C(s.col) } : { h: 0, c: C('ink') }; });
    const p = { mesh, look: L, fromH: 0, fromC: C('ink') };
    parts.push(p);
    return p;
  }
  const only = (eras, h, col) => { const o = {}; eras.forEach(k => o[k] = { h, col }); return o; };

  const tileX = tile => tile.grid[0] * GRID.laneX + tile.grid[0] * (tile.size[0] / 2 - 4);
  const tileZ = tile => -tile.grid[1] * GRID.lot;

  // generic lots: one plain box each, from the type table
  TILES.filter(t => !t.hero).forEach(t => part(tileX(t), 0, tileZ(t), t.size[0], t.size[1], t.byEra));

  // ── the four anchors, built from primitives ──────────────────────────────────
  const anchors = {};
  TILES.filter(t => t.hero).forEach(t => { anchors[t.id] = { tile: t, x: tileX(t), z: tileZ(t), top: 8 }; });
  const built = (t, k) => t.byEra[k].built;

  const ALL = ERAS.map(e => e.key);

  // The four anchors themselves are built in the scene files (scene-red.js: the Red House;
  // scene-dadao.js: Dihua Street and the temple; scene-tower.js: Taipei 101), each from a real
  // reference. They set anchors[id].top for the label and, for the tower, TOWER.h / TOWER.faceX.
  const TOWER = { x: anchors.tower101.x, z: anchors.tower101.z, h: 100, faceX: null };

  // the man climbing the west face: a small figure whose height follows the scroll in the last chapter
  const man = new THREE.Group();
  const manMat = withFog(new THREE.MeshLambertMaterial({ color: C('verm') }));
  const manBody = new THREE.Mesh(boxGeo, manMat); manBody.scale.set(0.7, 1.4, 0.5); man.add(manBody);
  const manHead = new THREE.Mesh(boxGeo, withFog(new THREE.MeshLambertMaterial({ color: C('bone') }))); manHead.scale.set(0.5, 0.5, 0.5); manHead.position.y = 1.45; man.add(manHead);
  const armL = new THREE.Mesh(boxGeo, manMat); armL.scale.set(0.25, 1.1, 0.25); armL.position.set(-0.55, 1.0, 0); man.add(armL);
  const armR = new THREE.Mesh(boxGeo, manMat); armR.scale.set(0.25, 1.1, 0.25); armR.position.set(0.55, 0.7, 0); man.add(armR);
  man.scale.setScalar(1.6);
  scene.add(man);
  function updateMan(u) {
    const i = ERAS.length - 1, f = Math.min(1, Math.max(0, (u - BOUNDS[i]) / (BOUNDS[i + 1] - BOUNDS[i])));
    man.visible = ERAS[eraIdx].key === 'tower';
    const climb = 6 + Math.pow(f, 1.4) * (TOWER.h - 20);
    const fx = TOWER.faceX ? TOWER.faceX(climb) : TOWER.x - 6.1;
    man.position.set(fx, climb, TOWER.z + 1.5);
    const t = performance.now() / 1000;
    armL.position.y = 1.0 + Math.sin(t * 3) * 0.2; armR.position.y = 0.7 - Math.sin(t * 3) * 0.2;
  }

  // ── BACKGROUND: sky dome, moon, mountains, distant city ──────────────────────
  const skyMat = new THREE.ShaderMaterial({
    uniforms: { top: { value: C('ink') }, horizon: { value: C('haze') } },
    vertexShader: `varying vec3 vP; void main(){ vP = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
    fragmentShader: `uniform vec3 top, horizon; varying vec3 vP; void main(){ float h = clamp(normalize(vP).y, 0.0, 1.0); gl_FragColor = vec4(mix(horizon, top, pow(h, 0.55)), 1.0); }`,
    side: THREE.BackSide, depthWrite: false, fog: false
  });
  const sky = new THREE.Mesh(new THREE.SphereGeometry(520, 24, 12), skyMat);
  scene.add(sky);
  scene.background = null;

  const moon = new THREE.Mesh(new THREE.CircleGeometry(9, 24), new THREE.MeshBasicMaterial({ color: C('bone'), fog: false, transparent: true, opacity: 0 }));
  scene.add(moon);

  const mountainMat = new THREE.MeshBasicMaterial({ color: C('haze'), fog: false });
  const coneGeo = new THREE.ConeGeometry(1, 1, 7); coneGeo.translate(0, 0.5, 0);
  const mountains = new THREE.InstancedMesh(coneGeo, mountainMat, 26);
  (() => {
    const m = new THREE.Matrix4();
    for (let i = 0; i < 26; i++) {
      const a = -Math.PI * 0.05 + (i / 26) * Math.PI * 2.1, r = 430 + (i % 3) * 30;
      const h = 60 + ((i * 37) % 70), w = 140 + ((i * 53) % 120);
      m.makeScale(w, h, w).setPosition(Math.sin(a) * r, -6, -200 + Math.cos(a) * r);
      mountains.setMatrixAt(i, m);
    }
    mountains.instanceMatrix.needsUpdate = true;
  })();
  scene.add(mountains);

  // per-era instanced sets: each instance has a place and a height per era, tweened together
  const instSets = [];
  function instSet(geo, mat, items, opts) {
    const mesh = new THREE.InstancedMesh(geo, withFog(mat), items.length);
    mesh.frustumCulled = false;
    if (opts && opts.colors) {
      items.forEach((it, i) => mesh.setColorAt(i, it.c || C('haze')));
      mesh.instanceColor.needsUpdate = true;
    }
    scene.add(mesh);
    const set = { mesh, items, from: items.map(() => 0) };
    instSets.push(set);
    return set;
  }
  const M4 = new THREE.Matrix4(), Q = new THREE.Quaternion(), S3 = new THREE.Vector3(), P3 = new THREE.Vector3(), Y = new THREE.Vector3(0, 1, 0);
  function instSnapshot() { instSets.forEach(set => set.items.forEach((it, i) => { set.from[i] = it.cur == null ? 0 : it.cur; })); }
  function instUpdate(e, key) {
    instSets.forEach(set => {
      set.items.forEach((it, i) => {
        const to = it.h[key] || 0, h = set.from[i] + (to - set.from[i]) * e;
        it.cur = h;
        Q.setFromAxisAngle(Y, it.r || 0);
        const on = h > 0.01;                                     // absent items vanish entirely, no flat footprint
        S3.set(on ? it.w : 0.0001, Math.max(h, 0.0001), on ? it.d : 0.0001);
        P3.set(it.x, on ? (it.y || 0) : -50, it.z);
        set.mesh.setMatrixAt(i, M4.compose(P3, Q, S3));
      });
      set.mesh.instanceMatrix.needsUpdate = true;
    });
  }
  const rnd = (() => { let s = 7; return () => (s = (s * 16807) % 2147483647) / 2147483647; })();

  // distant city on both sides of the street: low roofs, then a skyline
  (() => {
    const items = [];
    for (let i = 0; i < 320; i++) {
      const side = i % 2 ? 1 : -1, x = side * (30 + rnd() * 90), z = 60 - rnd() * 560;
      const w = 5 + rnd() * 9, d = 5 + rnd() * 9, far = Math.abs(x) / 120;
      if (x < -28 && z < -186 && z > -244) continue;                              // the river behind the Dadaocheng wharf
      items.push({ x, z, w, d, h: { red: 2 + rnd() * 3, dadao: 3 + rnd() * 6, tower: 6 + rnd() * (10 + 30 * far) } });
    }
    instSet(boxGeo, new THREE.MeshLambertMaterial({ color: C('haze') }), items);
  })();

  // ── STREET DETAIL ────────────────────────────────────────────────────────────
  // sidewalks and curbs
  const walkX = GRID.roadWidth / 2 + 1.6;
  [-1, 1].forEach(s => {
    const m = new THREE.Mesh(boxGeo, withFog(new THREE.MeshLambertMaterial({ color: C('walk') })));
    m.position.set(s * walkX, 0, -200); m.scale.set(3.2, 0.22, 620); scene.add(m);
  });
  // road surface pattern: dirt at first, then a painted centre line — drawn to a canvas, repeated
  function roadTexture(kind) {
    const cv = document.createElement('canvas'); cv.width = 128; cv.height = 256;
    const g = cv.getContext('2d');
    g.fillStyle = PALETTE.road; g.fillRect(0, 0, 128, 256);
    if (kind === 'dirt') { for (let i = 0; i < 260; i++) { g.fillStyle = 'rgba(10,12,16,0.35)'; g.fillRect(Math.random() * 128, Math.random() * 256, 2, 2); } }
    if (kind === 'tram') { g.fillStyle = PALETTE.ink; g.fillRect(40, 0, 3, 256); g.fillRect(85, 0, 3, 256); }
    if (kind === 'lines') { g.fillStyle = PALETTE.bone; g.fillRect(62, 20, 4, 90); g.fillRect(6, 0, 3, 256); g.fillRect(119, 0, 3, 256); }
    const t = new THREE.CanvasTexture(cv); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(1, 62); t.anisotropy = 8;
    return t;
  }
  const roadMaps = { red: roadTexture('dirt'), dadao: roadTexture('plain'), tower: roadTexture('lines') }; // Dihua Street: plain asphalt, no tram, no centre line
  const roadMesh = scene.children.find(o => o.geometry && o.geometry.parameters && o.geometry.parameters.width === GRID.roadWidth);
  roadMesh.material.map = roadMaps.red; roadMesh.material.needsUpdate = true;

  // windows on every generic building: dark grid on the facade, lit at night via emissive
  function windowTexture(cols, rows, lit) {
    const cv = document.createElement('canvas'); cv.width = 128; cv.height = 128;
    const g = cv.getContext('2d');
    g.fillStyle = lit ? '#000' : '#fff'; g.fillRect(0, 0, 128, 128);
    const cw = 128 / cols, ch = 128 / rows;
    for (let i = 0; i < cols; i++) for (let j = 0; j < rows; j++) {
      const on = lit ? ((i * 7 + j * 13) % 5 !== 0) : true;
      g.fillStyle = lit ? (on ? PALETTE.lamp : '#000') : 'rgba(0,0,0,0.55)';
      g.fillRect(i * cw + cw * 0.28, j * ch + ch * 0.25, cw * 0.44, ch * 0.5);
    }
    const t = new THREE.CanvasTexture(cv); t.wrapS = t.wrapT = THREE.RepeatWrapping; return t;
  }
  const winMap = windowTexture(3, 3, false), winLit = windowTexture(3, 3, true);
  parts.forEach(p => {
    if (p.mesh.geometry !== boxGeo || p.mesh.scale.x < 4) return;
    const mat = p.mesh.material;
    mat.map = winMap.clone(); mat.map.needsUpdate = true;
    mat.emissiveMap = winLit.clone(); mat.emissiveMap.needsUpdate = true;
    mat.emissive = C('lamp'); mat.emissiveIntensity = 0;
    mat.needsUpdate = true;
    p.windows = true;
  });
  function updateWindows(key) {
    parts.forEach(p => {
      if (!p.windows) return;
      const h = p.mesh.scale.y, w = p.mesh.scale.x;
      p.mesh.material.map.repeat.set(w / 3, h / 3);
      p.mesh.material.emissiveMap.repeat.set(w / 3, h / 3);
      p.mesh.material.emissiveIntensity = key === 'tower' ? 0.9 * eraE : (key === 'dadao' ? 0.35 * eraE : 0);
    });
  }

  // lampposts on both sidewalks: gas lamps sparse, then dense
  (() => {
    const posts = [], heads = [];
    for (let z = 40; z > -460; z -= 12) [-1, 1].forEach(s => {
      const k = Math.round(z / 12) % 3 === 0;
      const h = { red: k ? 4 : 0, dadao: 5, tower: 6 };
      posts.push({ x: s * (walkX + 0.9), z, w: 0.22, d: 0.22, h });
      heads.push({ x: s * (walkX + 0.9), z, y: 0, w: 0.7, d: 0.7, h: { red: k ? 0.5 : 0, dadao: 0.5, tower: 0.5 }, lift: true });
    });
    instSet(boxGeo, new THREE.MeshLambertMaterial({ color: C('haze') }), posts);
    const headSet = instSet(boxGeo, new THREE.MeshLambertMaterial({ color: C('lamp'), emissive: C('lamp'), emissiveIntensity: 0.6 }), heads);
    headSet.items.forEach((it, i) => { it.yOf = posts[i]; });
  })();
  // trees along the sidewalks from the 1930s
  (() => {
    const trunks = [], crowns = [];
    for (let z = 34; z > -460; z -= 15) [-1, 1].forEach(s => {
      if (Math.abs(z + 405) < 45) return;                       // the 101 plaza and the base shot
      if (z < -138 && z > -292) return;                          // Dihua Street has no street trees
      trunks.push({ x: s * (walkX - 0.8), z, w: 0.35, d: 0.35, h: { red: 0, dadao: 2.6, tower: 3.2 } });
      crowns.push({ x: s * (walkX - 0.8), z, w: 2.8 + rnd(), d: 2.8 + rnd(), h: { red: 0, dadao: 2.4, tower: 3 }, yOf: trunks[trunks.length - 1] });
    });
    instSet(boxGeo, new THREE.MeshLambertMaterial({ color: C('haze') }), trunks);
    instSet(boxGeo, new THREE.MeshLambertMaterial({ color: C('leaf') }), crowns);
  })();
  // people on the sidewalks: more each era
  (() => {
    const items = [];
    for (let i = 0; i < 90; i++) {
      const s = i % 2 ? 1 : -1, z = 40 - rnd() * 500, x = s * (walkX - 1.2 + rnd() * 2.4);
      const c = i % 7 === 0 ? C('verm') : (i % 3 === 0 ? C('haze') : C('bone'));
      items.push({ x, z, w: 0.5, d: 0.4, r: rnd() * 6.28, c, h: { red: i < 12 ? 1.6 : 0, dadao: i < 36 ? 1.6 : 0, tower: 1.6 } });
    }
    instSet(boxGeo, new THREE.MeshLambertMaterial({ color: C('bone') }), items, { colors: true });
  })();
  // shop signs hanging off the facades: a few painted boards, then a wall of neon
  (() => {
    const items = [];
    for (let i = 0; i < 70; i++) {
      const s = i % 2 ? 1 : -1, z = 20 - rnd() * 440, y = 3 + rnd() * 5;
      const c = i % 3 === 0 ? C('verm') : (i % 3 === 1 ? C('lamp') : C('bone'));
      const ximen = z > -140;                                                     // Ximending 1985–1999 already wore a wall of signs
      items.push({ x: s * (GRID.roadWidth / 2 + 3.2), z, y, w: 1.4, d: 0.25, c, h: { red: ximen ? (i % 2 === 0 ? 1.6 : 0) : (i % 6 === 0 ? 0.8 : 0), dadao: i % 2 === 0 ? 1.6 : 0, tower: 2.2 } });
    }
    instSet(boxGeo, new THREE.MeshLambertMaterial({ color: C('bone'), emissive: C('lamp'), emissiveIntensity: 0.25 }), items, { colors: true });
  })();
  // utility poles, from the 1930s
  (() => {
    const items = [];
    for (let z = 30; z > -460; z -= 22) items.push({ x: walkX + 2.2, z, w: 0.3, d: 0.3, h: { red: 0, dadao: 7, tower: 8 } });
    for (let z = 30; z > -460; z -= 22) items.push({ x: walkX + 2.2, z, y: 6.5, w: 2.4, d: 0.2, h: { red: 0, dadao: 0.2, tower: 0.2 } });
    instSet(boxGeo, new THREE.MeshLambertMaterial({ color: C('ink') }), items);
  })();

  // traffic: moving wallpaper. Only on ground already reached. Density per era is the point.
  const vehicles = (() => {
    const items = [], n = 34;
    for (let i = 0; i < n; i++) {
      const lane = i % 2 ? 1 : -1, big = i % 5 === 0;
      items.push({ x: lane * 2.6, z: 40 - rnd() * 500, w: big ? 2.2 : 1.7, d: big ? 5.5 : 3.6, lane, big,
                   speed: (big ? 9 : 14) + rnd() * 8, c: i % 4 === 0 ? C('bone') : (i % 9 === 0 ? C('verm') : C('haze')),
                   h: { red: i < 3 ? 1.3 : 0, dadao: i < 12 ? 1.2 : 0, tower: big ? 2.2 : 1.3 } });
    }
    const set = instSet(boxGeo, new THREE.MeshLambertMaterial({ color: C('haze') }), items, { colors: true });
    set.mesh.visible = false; // traffic switched off: nothing moves on the road except the girl
    return set;
  })();
  function updateVehicles(dt, key) {
    const front = FOG_U.frontier.value;
    const slow = key === 'red' ? 0.25 : key === 'dadao' ? 0.6 : 1;
    vehicles.items.forEach((v, i) => {
      v.z += v.lane * v.speed * slow * dt;              // one lane each way
      if (v.z < -470) v.z = 50; if (v.z > 50) v.z = -470;
      const to = (v.h[key] || 0) * (v.z < front + 4 ? 0 : 1);
      const h = vehicles.from[i] + (to - vehicles.from[i]) * eraE;
      v.cur = h;
      S3.set(v.w, Math.max(h, 0.0001), v.d); P3.set(v.x, 0.2, v.z); Q.set(0, 0, 0, 1);
      vehicles.mesh.setMatrixAt(i, M4.compose(P3, Q, S3));
    });
    vehicles.mesh.instanceMatrix.needsUpdate = true;
  }
  // lamp heads and tree crowns sit on top of their post/trunk
  function liftTops() {
    instSets.forEach(set => {
      if (!set.items[0] || !set.items[0].yOf) return;
      set.items.forEach(it => { it.y = it.yOf.cur || 0; });
    });
  }



  // ── the teammate's asset library (asset/3d/), placed by the scene files ──────
  // Each build() returns a Group, origin at its base, front facing +Z. libGroup(eras) makes a
  // group that is only visible in those eras; asset() builds one library item into it.
  // Library materials are unfogged: the mist is off and its shader chunk is not theirs.
  const libGroups = [];
  function libGroup(eras) {
    const g = new THREE.Group(); g.userData.eras = eras; scene.add(g); libGroups.push(g); return g;
  }
  const unfog = g => g.traverse(o => { if (o.material) { (Array.isArray(o.material) ? o.material : [o.material]).forEach(m => { m.fog = false; m.needsUpdate = true; }); } });
  const libBox = new THREE.Box3(), libSize = new THREE.Vector3();
  function findAsset(id) {
    const REG = window.NOSTALGIA_ASSETS || {};
    for (const k in REG) { const a = REG[k].find(a => a.id === id); if (a) return a; }
    return null;
  }
  // asset(id, group, x, z, rotY, scale?) → the placed Group (or null when the library is missing).
  // The returned group carries userData.size = its world-space bounding box size after rotation.
  function asset(id, group, x, z, rotY, scale) {
    const a = findAsset(id), Core = window.NostalgiaCore;
    if (!a || !Core) return null;
    const o = a.build(Core);
    o.rotation.y = rotY || 0;
    if (scale) o.scale.setScalar(scale);
    o.position.set(x, 0.2, z);
    o.updateMatrixWorld(true);
    libBox.setFromObject(o); libBox.getSize(libSize);
    o.userData.size = libSize.clone();
    unfog(o); group.add(o);
    return o;
  }

  // ── scene API for the per-chapter scene files (scene-*.js), loaded after this file ──
  // part(x, y, z, w, d, lookByEra, rotY?, geo?)  lookByEra: { red:{h,col}, dadao:{h,col}, tower:{h,col} }
  // instSet(geo, material, items, {colors})     items: { x, z, y?, w, d, r?, c?, h:{red,dadao,tower} }
  window.SCENE = { part, instSet, only, C, boxGeo, withFog, scene, GRID, ERAS, anchors, PALETTE, rnd, TOWER, walkX, libGroup, asset, findAsset };


  // ── the girl running down the middle of the street, always a little ahead of the camera ──
  const girl = new THREE.Group();
  const gMat = withFog(new THREE.MeshLambertMaterial({ color: C('verm') }));
  const gSkin = withFog(new THREE.MeshLambertMaterial({ color: C('bone') }));
  const gInk = withFog(new THREE.MeshLambertMaterial({ color: C('ink') }));
  const skirtGeo = new THREE.ConeGeometry(0.55, 1, 10); skirtGeo.translate(0, 0.5, 0);
  const skirt = new THREE.Mesh(skirtGeo, gMat); skirt.scale.set(1, 0.9, 1); skirt.position.y = 0.75; girl.add(skirt);
  const torso = new THREE.Mesh(boxGeo, gMat); torso.scale.set(0.5, 0.55, 0.3); torso.position.y = 1.6; girl.add(torso);
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.26, 10, 8), gSkin); head.position.y = 2.42; girl.add(head);
  const hair = new THREE.Mesh(boxGeo, gInk); hair.scale.set(0.16, 0.5, 0.16); hair.position.set(0, 2.05, 0.3); hair.rotation.x = -0.9; girl.add(hair);
  const legL = new THREE.Mesh(boxGeo, gSkin); legL.scale.set(0.16, 0.8, 0.16); legL.position.set(-0.15, 0.8, 0); legL.rotation.x = Math.PI; girl.add(legL);
  const legR = new THREE.Mesh(boxGeo, gSkin); legR.scale.set(0.16, 0.8, 0.16); legR.position.set(0.15, 0.8, 0); legR.rotation.x = Math.PI; girl.add(legR);
  const gArmL = new THREE.Mesh(boxGeo, gSkin); gArmL.scale.set(0.13, 0.6, 0.13); gArmL.position.set(-0.36, 2.1, 0); gArmL.rotation.x = Math.PI; girl.add(gArmL);
  const gArmR = new THREE.Mesh(boxGeo, gSkin); gArmR.scale.set(0.13, 0.6, 0.13); gArmR.position.set(0.36, 2.1, 0); gArmR.rotation.x = Math.PI; girl.add(gArmR);
  girl.scale.setScalar(1.15);
  scene.add(girl);
  let stride = 0, lastProg = 0, run = 0;
  function updateGirl(u, camZ, dt) {
    const speed = Math.abs(u - lastProg) / Math.max(dt, 1e-3); lastProg = u;      // scroll speed drives the run
    run += (Math.min(1, speed * 6) - run) * (1 - Math.exp(-6 * dt));
    stride += (0.4 + run * 14) * dt * 2.2;
    const z = Math.max(-398, camZ - 18 + run * 4);
    girl.position.set(Math.sin(stride * 0.15) * 0.6, Math.abs(Math.sin(stride)) * 0.12 * run, z);
    const sw = Math.sin(stride) * (0.25 + run * 0.9);
    legL.rotation.x = Math.PI + sw; legR.rotation.x = Math.PI - sw;
    gArmL.rotation.x = Math.PI - sw * 0.8; gArmR.rotation.x = Math.PI + sw * 0.8;
    hair.rotation.x = -0.9 - run * 0.5;
    girl.rotation.y = 0;
  }

  // ── the words ──────────────────────────────────────────────────────────────
  const wordEl = document.getElementById('word'), wordBig = wordEl.children[0], wordSub = wordEl.children[1];
  let wordShown = -1;
  function updateWords(u) {
    let best = -1, bestA = 0;
    WORDS.forEach((w, i) => { const a = Math.max(0, 1 - Math.abs(u - w.at) / 0.045); if (a > bestA) { bestA = a; best = i; } });
    if (best !== wordShown && best >= 0) { wordShown = best; wordBig.textContent = WORDS[best].big; wordSub.textContent = WORDS[best].sub || ''; }
    const a = Math.min(1, bestA * 1.6);
    wordEl.style.opacity = a.toFixed(2);
    wordEl.style.transform = `translateY(${((1 - a) * 18).toFixed(1)}px)`;
  }

  // ── era state and the 500ms re-render ────────────────────────────────────────
  let eraIdx = 0, eraT0 = -1e9, eraFrom = 0, eraE = 1;
  function setEra(i, instant) {
    if (i === eraIdx && !instant) return;
    const now = performance.now();
    parts.forEach(p => { p.fromH = p.mesh.scale.y; p.fromC = p.mesh.material.color.clone(); });
    instSnapshot();
    roadMesh.material.map = roadMaps[ERAS[i].key]; roadMesh.material.needsUpdate = true;
    mixFrom = { night: mixCur.night, lamp: mixCur.lamp, hemi: mixCur.hemi, print: mixCur.print };
    eraFrom = eraIdx; eraIdx = i;
    libGroups.forEach(g => { g.visible = g.userData.eras.indexOf(ERAS[i].key) >= 0; });
    eraT0 = instant ? now - ERA_MS : now;
    swapEraLabel(ERAS[i], instant);
  }
  const tmpC = new THREE.Color(), skyC = new THREE.Color();
  let mixCur = { night: 0, lamp: 0.55, hemi: 0.7, print: 1 }, mixFrom = { ...mixCur };
  function updateWorld(now) {
    const k = Math.min(1, (now - eraT0) / ERA_MS);
    const e = k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2; // ease in-out
    eraE = e;
    const era = ERAS[eraIdx], key = era.key;
    parts.forEach(p => {
      const to = p.look[key];
      const h = p.fromH + (to.h - p.fromH) * e;
      p.mesh.scale.y = Math.max(h, 0.0001);
      p.mesh.visible = h > 0.01;
      p.mesh.material.color.copy(tmpC.copy(p.fromC).lerp(to.c, e));
    });
    // sky, fog, light and print level: held flat inside an era, moved in the same 500ms
    const M = ERA_MIX[key];
    mixCur.night = mixFrom.night + (M.night - mixFrom.night) * e;
    mixCur.lamp = mixFrom.lamp + (M.lamp - mixFrom.lamp) * e;
    mixCur.hemi = mixFrom.hemi + (M.hemi - mixFrom.hemi) * e;
    mixCur.print = mixFrom.print + (era.uPrint - mixFrom.print) * e;
    // photograph: the sky darkens toward ink. print: unreached fog is blank paper.
    // horizon: pale day → warm dusk. top: blue → deep blue.
    skyC.copy(C('bone')).lerp(C('sky'), 0.35).lerp(C('lamp'), mixCur.night * 0.7);
    scene.fog.color.copy(skyC);
    skyMat.uniforms.horizon.value.copy(skyC);
    skyMat.uniforms.top.value.copy(C('sky')).lerp(C('ink'), 0.1 + mixCur.night * 0.7);
    mountainMat.color.copy(C('haze')).lerp(C('sky'), 0.35).lerp(C('ink'), mixCur.night * 0.4);
    moon.material.opacity = Math.max(0, mixCur.night - 0.3) * 1.3;
    sky.position.copy(camera.position);
    moon.position.set(camera.position.x + 160, camera.position.y + 190, camera.position.z - 330);
    moon.lookAt(camera.position);
    liftTops();
    instUpdate(e, key);
    updateWindows(key);
    key.intensity = mixCur.lamp;
    hemi.intensity = mixCur.hemi;
    post.uniforms.uPrint.value = mixCur.print;
  }

  // ── camera rig ───────────────────────────────────────────────────────────────
  const V = a => new THREE.Vector3(a[0], a[1], a[2]);
  const posCurve = new THREE.CatmullRomCurve3(CAM.map(k => V(k.p)), false, 'centripetal');
  const tgtCurve = new THREE.CatmullRomCurve3(CAM.map(k => V(k.t)), false, 'centripetal');
  const fovs = CAM.map(k => k.fov);
  const pTmp = new THREE.Vector3(), tTmp = new THREE.Vector3();
  let mouseX = 0, mouseY = 0, driftX = 0, driftY = 0;
  function placeCamera(u) {
    posCurve.getPoint(u, pTmp);
    tgtCurve.getPoint(u, tTmp);
    const s = u * (fovs.length - 1), i = Math.min(fovs.length - 2, Math.floor(s)), f = s - i;
    camera.fov = fovs[i] + (fovs[i + 1] - fovs[i]) * f;
    camera.position.set(pTmp.x + driftX, pTmp.y + driftY, pTmp.z); // a small parallax drift, never enough to break the frame
    camera.lookAt(tTmp);
    camera.updateProjectionMatrix();
    return pTmp.z;
  }
  // scroll progress u at which the camera reaches world z, by bisection.
  // Relies on CAM's z decreasing along the whole path — data.js says so.
  function uAtZ(z) {
    let lo = 0, hi = 1;
    for (let i = 0; i < 40; i++) {
      const mid = (lo + hi) / 2;
      if (posCurve.getPoint(mid, pTmp).z > z) lo = mid; else hi = mid;
    }
    return (lo + hi) / 2;
  }

  // ── year ⇄ scroll, the one number that drives everything ─────────────────────
  // Each era owns a slice of the scroll. The slice boundaries are exactly where the camera
  // passes over that era's road marking, so the world flips as the digits go under you.
  const BOUNDS = ERAS.map((e, i) => i === 0 ? 0 : uAtZ(e.zRange[0]));
  BOUNDS.push(1);
  function eraAtU(u) { for (let i = ERAS.length - 1; i > 0; i--) if (u >= BOUNDS[i]) return i; return 0; }
  function yearAtU(u) {
    const i = eraAtU(u), e = ERAS[i];
    const f = Math.min(1, Math.max(0, (u - BOUNDS[i]) / (BOUNDS[i + 1] - BOUNDS[i])));
    return e.start + f * (e.end - e.start);
  }
  function uAtYear(y) {
    y = Math.min(ERAS[ERAS.length - 1].end, Math.max(ERAS[0].start, y));
    let i = 0;
    for (let k = 0; k < ERAS.length; k++) if (y >= ERAS[k].start) i = k;
    const e = ERAS[i], f = (y - e.start) / (e.end - e.start);
    return BOUNDS[i] + f * (BOUNDS[i + 1] - BOUNDS[i]);
  }

  // ── the uPrint post pass: posterize, grain, outline, vignette ────────────────
  // One fullscreen pass. uPrint 1 = woodblock print, 0 = night photograph. Lighting stays on
  // the whole time; posterizing flattens it into print blocks. Grain is shader noise.
  const rt = new THREE.WebGLRenderTarget(1, 1, { depthBuffer: true });
  const post = new THREE.ShaderMaterial({
    uniforms: { tDiffuse: { value: rt.texture }, uRes: { value: new THREE.Vector2(1, 1) }, uPrint: { value: 1 },
                uTime: { value: 0 }, uInk: { value: C('ink') }, uHaze: { value: C('haze') }, uBone: { value: C('bone') } },
    vertexShader: `varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }`,
    fragmentShader: `
      uniform sampler2D tDiffuse; uniform vec2 uRes; uniform float uPrint, uTime; uniform vec3 uInk, uHaze, uBone;
      varying vec2 vUv;
      float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
      float lum(vec3 c){ return dot(c, vec3(0.299, 0.587, 0.114)); }
      void main(){
        vec2 px = 1.0 / uRes;
        vec3 c = texture2D(tDiffuse, vUv).rgb;
        // OUTLINE — luminance edge, ink at 1, nothing at 0
        float l0 = lum(c);
        float edge = abs(l0 - lum(texture2D(tDiffuse, vUv + vec2(px.x * 1.5, 0.0)).rgb))
                   + abs(l0 - lum(texture2D(tDiffuse, vUv + vec2(0.0, px.y * 1.5)).rgb))
                   + abs(l0 - lum(texture2D(tDiffuse, vUv - vec2(px.x * 1.5, 0.0)).rgb))
                   + abs(l0 - lum(texture2D(tDiffuse, vUv - vec2(0.0, px.y * 1.5)).rgb));
        float ink = smoothstep(0.05, 0.18, edge) * uPrint;
        // POSTERIZE — few steps at 1, continuous at 0. In print the tones become the paper,
        // the second ink and the ink; the vermilion accent keeps its hue.
        float sat = max(c.r, max(c.g, c.b)) - min(c.r, min(c.g, c.b));
        float q = floor(l0 * 3.0 + 0.5) / 3.0;
        vec3 tone = q < 0.34 ? uInk : (q < 0.67 ? uHaze : uBone);
        vec3 red = floor(c * 3.0 + 0.5) / 3.0;
        vec3 printed = mix(tone, red, smoothstep(0.15, 0.4, sat));
        c = mix(c, printed, uPrint);
        c = mix(c, uInk, ink);
        c = pow(max(c, 0.0), vec3(1.0 / 2.2));
        // GRAIN — paper grain at 1 (coarser, static), film grain at 0 (finer, moving)
        vec2 cell = floor(gl_FragCoord.xy / mix(1.0, 2.0, uPrint));
        float g = hash(cell + floor(uTime * mix(60.0, 2.0, uPrint)) * 0.37) - 0.5;
        c += g * mix(0.025, 0.045, uPrint);
        // VIGNETTE — restrained
        float d = distance(vUv, vec2(0.5));
        c *= 1.0 - smoothstep(0.45, 1.0, d) * 0.3;
        gl_FragColor = vec4(c, 1.0);
      }`,
    depthTest: false, depthWrite: false
  });
  const postScene = new THREE.Scene();
  postScene.add(new THREE.Mesh(new THREE.PlaneGeometry(2, 2), post));
  const postCam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

  // ── HUD: era label, year, anchor labels ──────────────────────────────────────
  const yearEl = document.getElementById('year');
  const eraBox = document.querySelector('.hud-era');
  const eraLabelEl = document.getElementById('eraLabel');
  const eraYearsEl = document.getElementById('eraYears');
  let swapTimer = 0;
  function swapEraLabel(era, instant) {
    const apply = () => { eraLabelEl.textContent = era.label; eraYearsEl.textContent = era.years + ' · ' + era.zh; };
    clearTimeout(swapTimer);
    if (instant) { eraBox.classList.remove('swap'); apply(); return; }
    eraBox.classList.add('swap');
    swapTimer = setTimeout(() => { apply(); eraBox.classList.remove('swap'); }, 240);
  }
  const closingEl = document.getElementById('closing');
  closingEl.textContent = CLOSING.line;
  const labelHost = document.getElementById('labels');
  const labels = Object.values(anchors).map(A => {
    const el = document.createElement('div');
    el.className = 'label';
    el.innerHTML = '<div class="label-name"></div><div class="label-en"></div><div class="label-cap"></div>';
    labelHost.appendChild(el);
    return { A, el, shownKey: '', name: el.children[0], en: el.children[1], cap: el.children[2] };
  });
  const wp = new THREE.Vector3();
  function updateLabels() {
    const key = ERAS[eraIdx].key;
    labels.forEach(L => {
      const s = L.A.tile.byEra[key];
      wp.set(L.A.x, L.A.top + 1.5, L.A.z).project(camera);
      const dist = Math.hypot(L.A.x - camera.position.x, L.A.z - camera.position.z);
      const inFront = wp.z < 1 && Math.abs(wp.x) < 1.1;
      const near = Math.min(1, Math.max(0, (LABEL_NEAR - dist) / 30));
      const vis = s.built && inFront ? near * eraE : 0;
      if (L.shownKey !== key) { // reveal the caption word by word (per character, this is 中文)
        L.shownKey = key;
        L.name.textContent = L.A.tile.name.en;
        L.en.textContent = L.A.tile.name.zh;
        L.cap.innerHTML = (s.caption || '').split('').map((ch, i) => `<span style="transition-delay:${i * 18}ms">${ch}</span>`).join('');
      }
      el = L.el;
      el.style.opacity = vis.toFixed(2);
      el.classList.toggle('on', vis > 0.6);
      const lx = Math.min(innerWidth - Math.min(380, innerWidth * 0.7 + 20), (wp.x + 1) / 2 * innerWidth);
      const ly = Math.max(110, (1 - wp.y) / 2 * innerHeight);
      el.style.transform = `translate(${lx.toFixed(0)}px, ${ly.toFixed(0)}px)`;
    });
  }
  let el;

  // ── scroll → progress, damped ────────────────────────────────────────────────
  const maxScroll = () => Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
  let progress = 0, frontier = Infinity, lastT = performance.now(), shownYear = -1;

  function resize() {
    const w = window.innerWidth, h = window.innerHeight, pr = renderer.getPixelRatio();
    renderer.setSize(w, h, false);
    rt.setSize(Math.floor(w * pr), Math.floor(h * pr));
    post.uniforms.uRes.value.set(Math.floor(w * pr), Math.floor(h * pr));
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }
  window.addEventListener('resize', resize);
  window.addEventListener('mousemove', ev => { mouseX = (ev.clientX / innerWidth - 0.5) * 2; mouseY = (ev.clientY / innerHeight - 0.5) * 2; });
  resize();

  function frame(now) {
    const dt = Math.min(0.1, (now - lastT) / 1000);
    lastT = now;
    const target = Math.min(1, Math.max(0, window.scrollY / maxScroll()));
    progress += (target - progress) * (1 - Math.exp(-DAMP * dt));
    if (Math.abs(target - progress) < 0.00005) progress = target;
    driftX += (mouseX * 0.5 - driftX) * (1 - Math.exp(-2 * dt));
    driftY += (-mouseY * 0.25 - driftY) * (1 - Math.exp(-2 * dt));

    const camZ = placeCamera(progress);
    frontier = Math.min(frontier, camZ - FOG_LEAD);
    FOG_U.frontier.value = -1e5; // mist switched off: the whole street is visible in daylight

    setEra(eraAtU(progress), false);
    updateWorld(now);
    updateMan(progress);
    updateGirl(progress, camZ, dt);
    updateWords(progress);
    updateLabels();
    closingEl.style.opacity = Math.min(1, Math.max(0, (progress - CLOSING.showFrom) / (1 - CLOSING.showFrom) * 1.6)).toFixed(2);

    const y = Math.round(yearAtU(progress));
    if (y !== shownYear) { shownYear = y; yearEl.textContent = String(y); }

    post.uniforms.uTime.value = now / 1000;
    renderer.setRenderTarget(rt);
    renderer.render(scene, camera);
    renderer.setRenderTarget(null);
    renderer.render(postScene, postCam);
    requestAnimationFrame(frame);
  }

  // ── demo insurance: ?year=1930 jumps straight there, no damping, fog already cleared ──
  function jumpToYear(y) {
    const u = uAtYear(y);
    window.scrollTo(0, u * maxScroll());
    progress = u;
    const camZ = placeCamera(u);
    frontier = camZ - FOG_LEAD;
    setEra(eraAtU(u), true);
  }
  const wantYear = parseInt(new URLSearchParams(location.search).get('year'), 10);
  if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
  if (!isNaN(wantYear)) jumpToYear(wantYear); else { window.scrollTo(0, 0); setEra(0, true); }

  // a tiny probe for testing; harmless in the demo
  window.__fog = { get progress() { return progress; }, get year() { return shownYear; }, get era() { return ERAS[eraIdx].key; },
                   get camZ() { return camera.position.z; }, get scrollY() { return window.scrollY; }, get print() { return mixCur.print; }, BOUNDS, jumpToYear };

  requestAnimationFrame(frame);
})();
