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
  // surface pass (issue #3 step 1): the light budget. EXPOSURE is the tone-mapping knob, ENV_I how
  // much of the canvas sky every lit surface receives, HEMI the hemisphere light and KEY the sun,
  // both in chapter 1 (ERA_MIX scales them for the others). Set together against step0-0.05.png:
  // the road and the shop walls sit 3–8 levels brighter than before and the saturation is unchanged,
  // while the clipped-white share of the frame goes from 3% to 0.
  const EXPOSURE = 0.85;
  const ENV_I = 0.35;
  const HEMI = 0.65;
  const KEY = 1.3;
  // per-era mix of the five colours: sky/fog darkens, lamp light grows, print fades
  // (hemi is the hemisphere light only; the canvas-sky environment adds its own ambient on top)
  // (hemi is the hemisphere light, env scales the canvas-sky environment; both fall toward the future)
  const ERA_MIX = { red: { night: 0.0, lamp: KEY, hemi: HEMI, env: 1.0 }, dadao: { night: 0.05, lamp: KEY * 1.09, hemi: HEMI * 0.91, env: 0.95 },
                    tower: { night: 0.45, lamp: KEY, hemi: HEMI * 0.68, env: 0.7 } };

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
  // lit(params): the one material every lit engine surface uses (issue #3 step 1). It was
  // MeshLambertMaterial; it is MeshStandardMaterial now so scene.environment reaches it (in r149
  // the environment map lights Standard materials only) and so step 2's normal maps have a
  // material that reads them. Rough and non-metal, so it shades like the Lambert it replaces
  // plus the sky's ambient; every option Lambert took (map, emissive, vertexColors) still works.
  // (issue #3 step 2) lit() takes a `surface` too: one of the library's five procedural families
  // (brick, plaster, concrete, wood, asphalt, from NostalgiaCore.surface), whose colour and normal
  // maps are attached; a caller's own `map` wins and only the normal map is added. lam(col) picks
  // the family from the palette key so the scene files name nothing: bone is plaster, walk and
  // haze are concrete, brick is brick. Tile = TILE world units; the engine sets each map's repeat
  // from the mesh's size where it knows it (part, instSet), so bricks stay brick-sized.
  const SURFACE_OF = { bone: 'plaster', walk: 'concrete', haze: 'concrete', brick: 'brick', road: 'asphalt' };
  const TILE = 3;
  const surface = name => { const Core = window.NostalgiaCore; return name && Core && Core.surface ? Core.surface(name) : null; };
  // ── ambient occlusion, baked per vertex at build time (issue #3 step 4) ──────
  // No screen-space pass: every lit material reads vertex colours, and the geometry carries the
  // occlusion. aoBake(geo) is the cheap rule for the engine's shared geometries (every part() box,
  // every instanced set): the bottom ring of vertices sits at AO_MIN and the top at 1, and any
  // face pointing down (an eave, a canopy, a deck) is AO_MIN, so walls darken where they meet the
  // road and undersides read as shade. Geometries that already carry colours are left alone.
  // aoBakeAsset() is the library's heuristic, in asset() below. AO_MIN = 0.75 is the darkest.
  const AO_MIN = 0.75, aoBaked = new Set();
  function aoBake(geo) {
    if (!geo || aoBaked.has(geo) || !geo.attributes.position || geo.attributes.color) return geo;
    aoBaked.add(geo);
    geo.computeBoundingBox();
    const bb = geo.boundingBox, pos = geo.attributes.position, nor = geo.attributes.normal, n = pos.count;
    const col = new Float32Array(n * 3), span = Math.max(1e-6, bb.max.y - bb.min.y);
    for (let i = 0; i < n; i++) {
      let t = (pos.getY(i) - bb.min.y) / span; t = t * t * (3 - 2 * t);
      let ao = AO_MIN + (1 - AO_MIN) * t;
      if (nor && nor.getY(i) < -0.5) ao = AO_MIN;
      col[i * 3] = col[i * 3 + 1] = col[i * 3 + 2] = ao;
    }
    geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
    return geo;
  }
  const litMats = [];   // every material that reads scene.environment, so the era tween can scale it
  const lit = params => {
    const p = Object.assign({ roughness: 0.92, metalness: 0, envMapIntensity: ENV_I, vertexColors: true }, params);
    const S = surface(p.surface); delete p.surface;
    if (S) { if (!p.map) p.map = S.map.clone(); p.normalMap = S.normalMap; }
    const m = new THREE.MeshStandardMaterial(p); litMats.push(m); return m;
  };
  const lam = (col, extra) => lit(Object.assign({ color: C(col), surface: SURFACE_OF[col] || null }, extra || {}));
  const fitTile = (mat, w, h) => { const m = mat.map; if (m && m.userData.tile) m.repeat.set(Math.max(w, 0.01) / TILE, Math.max(h, 0.01) / TILE); };

  // ── renderer, scene, camera ──────────────────────────────────────────────────
  const canvas = document.getElementById('scene');
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, powerPreference: 'high-performance' });
  // pixel ratio cap: 2 on a desktop, 1.5 on a phone (coarse pointer or a narrow screen), so a
  // 3x phone does not render 9x the pixels of a laptop
  const IS_PHONE = (window.matchMedia && window.matchMedia('(pointer: coarse)').matches) || window.innerWidth < 768;
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, IS_PHONE ? 1.5 : 2));
  renderer.outputEncoding = THREE.LinearEncoding; // gamma is applied at the end of the post pass
  // tone mapping (issue #3 step 1): the ACES filmic curve on the renderer. In this r149 build the
  // renderer's tone mapping runs on the offscreen draw as well (only outputEncoding is gated on
  // the render target), so the post pass receives a tone-mapped linear frame and gamma-encodes it
  // as before. What changes is the highlight shoulder: a sunlit wall keeps its gradation instead
  // of clipping to white. The curve is applied to luminance only, as a CustomToneMapping: the
  // stock ACESFilmicToneMapping runs its curve through the RRT matrices and lost 30% of the frame's
  // saturation (measured 0.144 → 0.103 at 0.05, the lit windows and the 101 glass going cream),
  // which is the greyer page CJ ruled out on 2026-09-20. Scaling the colour by curve(Y)/Y keeps
  // every hue and only rolls the highlights off. The sky dome and the particles are
  // ShaderMaterials and are untouched by it.
  THREE.ShaderChunk.tonemapping_pars_fragment = THREE.ShaderChunk.tonemapping_pars_fragment.replace(
    'vec3 CustomToneMapping( vec3 color ) { return color; }',
    `vec3 CustomToneMapping( vec3 color ) {
      color *= toneMappingExposure;
      float y = dot( color, vec3( 0.2126, 0.7152, 0.0722 ) );
      float t = ( y * ( 2.51 * y + 0.03 ) ) / ( y * ( 2.43 * y + 0.59 ) + 0.14 );
      return color * ( t / max( y, 1e-4 ) );
    }`);
  renderer.toneMapping = THREE.CustomToneMapping;
  renderer.toneMappingExposure = EXPOSURE;

  const scene = new THREE.Scene();
  scene.background = C('haze');
  scene.fog = new THREE.FogExp2(PALETTE.haze, HAZE_DENSITY);
  const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 600);

  // hemisphere: pale blue sky above, a warm pavement bounce below, so a roof and an underside are
  // never the same colour; its intensity is ERA_MIX.hemi, tweened per era
  const hemi = new THREE.HemisphereLight(C('bone').lerp(C('sky'), 0.2), C('walk').lerp(C('ink'), 0.5), 0.55);
  scene.add(hemi);
  const key = new THREE.DirectionalLight(C('lamp'), 0.9);
  key.position.set(18, 26, 12);
  scene.add(key);
  // ── the sun casts shadows (issue #3 step 3) ──────────────────────────────────
  // One shadow map for the whole street: an orthographic box SUN_BOX units square, re-centred every
  // frame on a point SUN_AHEAD units down the road from the scroll camera, so the map's texels are
  // spent where the camera looks and the 460-unit street never needs a bigger map. PCF soft, 2048
  // on a desktop and 1024 on a phone (texel 0.06 / 0.12 units). Every lit, opaque mesh casts and
  // receives; the two biases are what keep the flat walls free of acne.
  const SUN_DIR = key.position.clone().normalize(), SUN_BOX = 120, SUN_AHEAD = 45, SUN_DIST = 160;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  key.castShadow = true;
  key.shadow.mapSize.set(IS_PHONE ? 1024 : 2048, IS_PHONE ? 1024 : 2048);
  key.shadow.camera.left = -SUN_BOX / 2; key.shadow.camera.right = SUN_BOX / 2;
  key.shadow.camera.top = SUN_BOX / 2; key.shadow.camera.bottom = -SUN_BOX / 2;
  key.shadow.camera.near = 1; key.shadow.camera.far = SUN_DIST + SUN_BOX;
  key.shadow.camera.updateProjectionMatrix();
  key.shadow.bias = -0.0004; key.shadow.normalBias = 0.05;
  scene.add(key.target);
  function sunFollow(camZ) {
    key.target.position.set(0, 0, camZ - SUN_AHEAD);
    key.position.copy(key.target.position).addScaledVector(SUN_DIR, SUN_DIST);
  }
  // flags set once, after the scene files have built, before the first draw. The same pass bakes
  // the occlusion into any geometry a vertex-colour material draws that has no colour attribute
  // yet (the girl, the climbing man, anything a scene file gave lit() directly): three.js only
  // substitutes a default colour for a missing attribute on ShaderMaterial, so a lit() material
  // over a bare geometry would draw black (CJ, 2026-09-23: 「the character all black」).
  function enableShadows() {
    scene.traverse(o => {
      if (!o.isMesh && !o.isInstancedMesh) return;
      const m = Array.isArray(o.material) ? o.material[0] : o.material;
      if (!m || !m.isMeshStandardMaterial) return;                  // unlit signs, the sky, the mountains, the particles: no
      if (m.vertexColors && o.geometry && !o.geometry.attributes.color) aoBake(o.geometry);
      o.receiveShadow = true;
      o.castShadow = !m.transparent;
    });
  }

  // ── environment: a canvas-drawn sky, PMREM'd into scene.environment (issue #3 step 1) ──
  // Every Standard material (the asset library and, from this step, the engine's lit() surfaces)
  // reads scene.environment: upward faces pick up sky, sides pick up the warm ground band, and the
  // 101 curtain wall has something to reflect. Drawn at load with two gradients and a sun disc
  // placed where the key light is (equirect u from atan2(z, x), v from asin(y)); no image file.
  const skyEnv = (() => {
    const cv = document.createElement('canvas');
    cv.width = 512; cv.height = 256;
    const g = cv.getContext('2d');
    const up = g.createLinearGradient(0, 0, 0, 128);          // zenith → horizon
    up.addColorStop(0, '#8ec3f0'); up.addColorStop(0.72, '#bcd8ee'); up.addColorStop(1, PALETTE.bone);
    g.fillStyle = up; g.fillRect(0, 0, 512, 128);
    const dn = g.createLinearGradient(0, 128, 0, 256);        // horizon → ground bounce
    dn.addColorStop(0, PALETTE.bone); dn.addColorStop(0.5, '#cfc6b4'); dn.addColorStop(1, '#8e8778');
    g.fillStyle = dn; g.fillRect(0, 128, 512, 128);
    const kd = key.position.clone().normalize();
    const sx = (Math.atan2(kd.z, kd.x) / (2 * Math.PI) + 0.5) * 512, sy = (0.5 - Math.asin(kd.y) / Math.PI) * 256;
    const sun = g.createRadialGradient(sx, sy, 4, sx, sy, 78);
    sun.addColorStop(0, '#fff6e2'); sun.addColorStop(1, 'rgba(255,246,226,0)');
    g.fillStyle = sun; g.fillRect(sx - 90, 0, 180, 140);
    const t = new THREE.CanvasTexture(cv);
    t.mapping = THREE.EquirectangularReflectionMapping;
    return t;
  })();
  const pmrem = new THREE.PMREMGenerator(renderer);
  pmrem.compileEquirectangularShader();
  scene.environment = pmrem.fromEquirectangular(skyEnv).texture;
  pmrem.dispose(); skyEnv.dispose();

  // ── ground, road, river ──────────────────────────────────────────────────────
  const flat = (w, d, col, x, y, z) => {
    const g = new THREE.PlaneGeometry(w, d); g.rotateX(-Math.PI / 2);
    const m = new THREE.Mesh(g, withFog(lit({ color: C(col) })));
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
    const first = ERAS.map(e => look[e.key]).find(s => s && s.h > 0);          // the surface family follows the first era's colour
    const mesh = new THREE.Mesh(aoBake(geo || boxGeo), withFog(lit({ color: C('bone'), surface: first ? SURFACE_OF[first.col] : null })));
    mesh.position.set(x, y, z);
    mesh.scale.set(w, 1, d);
    if (rotY) mesh.rotation.y = rotY;
    scene.add(mesh);
    const L = {};
    ERAS.forEach(e => { const s = look[e.key]; L[e.key] = s && s.h > 0 ? { h: s.h, c: C(s.col) } : { h: 0, c: C('ink') }; });
    const p = { mesh, look: L, fromH: 0, fromC: C('ink'), tileMap: mesh.material.map && mesh.material.map.userData.tile ? mesh.material.map : null };
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
  const manMat = withFog(lit({ color: C('verm') }));
  const manBody = new THREE.Mesh(boxGeo, manMat); manBody.scale.set(0.7, 1.4, 0.5); man.add(manBody);
  const manHead = new THREE.Mesh(boxGeo, withFog(lit({ color: C('bone') }))); manHead.scale.set(0.5, 0.5, 0.5); manHead.position.y = 1.45; man.add(manHead);
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
    const mesh = new THREE.InstancedMesh(aoBake(geo), withFog(mat), items.length);
    mesh.frustumCulled = false;
    if (mat.map && mat.map.userData.tile && items.length) {           // one repeat for the set: its median footprint and height
      const med = a => a.slice().sort((x, y) => x - y)[a.length >> 1];
      fitTile(mat, med(items.map(it => Math.max(it.w, it.d))), med(items.map(it => Math.max(...Object.values(it.h)))));
    }
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
    instSet(boxGeo, lit({ color: C('haze') }), items);
  })();

  // ── STREET DETAIL ────────────────────────────────────────────────────────────
  // sidewalks and curbs
  const walkX = GRID.roadWidth / 2 + 1.6;
  [-1, 1].forEach(s => {
    const m = new THREE.Mesh(boxGeo, withFog(lit({ color: C('walk'), surface: 'concrete' })));
    m.position.set(s * walkX, 0, -200); m.scale.set(3.2, 0.22, 620); scene.add(m);
    fitTile(m.material, 3.2, 620);                                     // the top face is the one seen: u along x, v along z
  });
  // road surface pattern: dirt at first, then a painted centre line — drawn to a canvas, repeated
  // The canvas is one 12 x 10 unit stretch of road (repeat 1 x 62), so the asphalt family's tile
  // (TILE units square) is drawn 32 x 77 px here, multiplied over the base colour. Seeded, like the
  // library's own surfaces, so the speckle is the same every load.
  const texRnd = (() => { let a = 3; return () => { a = (a + 0x6D2B79F5) | 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t = (t + Math.imul(t ^ (t >>> 7), t | 61)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; })();
  function roadTexture(kind) {
    const cv = document.createElement('canvas'); cv.width = 128; cv.height = 256;
    const g = cv.getContext('2d');
    g.fillStyle = PALETTE.road; g.fillRect(0, 0, 128, 256);
    const asphalt = surface('asphalt');
    if (asphalt) {
      const tw = 128 / (GRID.roadWidth / TILE), th = 256 / (10 / TILE);
      g.globalCompositeOperation = 'multiply';
      for (let y = 0; y < 256; y += th) for (let x = 0; x < 128; x += tw) g.drawImage(asphalt.map.image, x, y, tw, th);
      g.globalCompositeOperation = 'source-over';
    }
    if (kind === 'dirt') { for (let i = 0; i < 260; i++) { g.fillStyle = 'rgba(10,12,16,0.35)'; g.fillRect(texRnd() * 128, texRnd() * 256, 2, 2); } }
    if (kind === 'tram') { g.fillStyle = PALETTE.ink; g.fillRect(40, 0, 3, 256); g.fillRect(85, 0, 3, 256); }
    if (kind === 'lines') { g.fillStyle = PALETTE.bone; g.fillRect(62, 20, 4, 90); g.fillRect(6, 0, 3, 256); g.fillRect(119, 0, 3, 256); }
    const t = new THREE.CanvasTexture(cv); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(1, 62); t.anisotropy = 8;
    return t;
  }
  const roadMaps = { red: roadTexture('dirt'), dadao: roadTexture('plain'), tower: roadTexture('lines') }; // Dihua Street: plain asphalt, no tram, no centre line
  const roadMesh = scene.children.find(o => o.geometry && o.geometry.parameters && o.geometry.parameters.width === GRID.roadWidth);
  roadMesh.material.map = roadMaps.red; roadMesh.material.needsUpdate = true;
  // (issue #3 step 4) the road is eight strips across so its vertex colours can darken the outer
  // 2.5 units toward the kerbs, where the walls and the sidewalks meet it
  roadMesh.geometry.dispose();
  roadMesh.geometry = new THREE.PlaneGeometry(GRID.roadWidth, 620, 8, 1); roadMesh.geometry.rotateX(-Math.PI / 2);
  (() => {
    const pos = roadMesh.geometry.attributes.position, col = new Float32Array(pos.count * 3);
    for (let i = 0; i < pos.count; i++) {
      const e = Math.min(1, (GRID.roadWidth / 2 - Math.abs(pos.getX(i))) / 2.5), ao = 0.85 + 0.15 * e * e * (3 - 2 * e);
      col[i * 3] = col[i * 3 + 1] = col[i * 3 + 2] = ao;
    }
    roadMesh.geometry.setAttribute('color', new THREE.BufferAttribute(col, 3));
  })();

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
    instSet(boxGeo, lit({ color: C('haze') }), posts);
    const headSet = instSet(boxGeo, lit({ color: C('lamp'), emissive: C('lamp'), emissiveIntensity: 0.6 }), heads);
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
    instSet(boxGeo, lit({ color: C('haze') }), trunks);
    instSet(boxGeo, lit({ color: C('leaf') }), crowns);
  })();
  // people on the sidewalks: more each era
  (() => {
    const items = [];
    for (let i = 0; i < 90; i++) {
      const s = i % 2 ? 1 : -1, z = 40 - rnd() * 500, x = s * (walkX - 1.2 + rnd() * 2.4);
      const c = i % 7 === 0 ? C('verm') : (i % 3 === 0 ? C('haze') : C('bone'));
      items.push({ x, z, w: 0.5, d: 0.4, r: rnd() * 6.28, c, h: { red: i < 12 ? 1.6 : 0, dadao: i < 36 ? 1.6 : 0, tower: 1.6 } });
    }
    instSet(boxGeo, lit({ color: C('bone') }), items, { colors: true });
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
    instSet(boxGeo, lit({ color: C('bone'), emissive: C('lamp'), emissiveIntensity: 0.25 }), items, { colors: true });
  })();
  // utility poles, from the 1930s
  (() => {
    const items = [];
    for (let z = 30; z > -460; z -= 22) items.push({ x: walkX + 2.2, z, w: 0.3, d: 0.3, h: { red: 0, dadao: 7, tower: 8 } });
    for (let z = 30; z > -460; z -= 22) items.push({ x: walkX + 2.2, z, y: 6.5, w: 2.4, d: 0.2, h: { red: 0, dadao: 0.2, tower: 0.2 } });
    instSet(boxGeo, lit({ color: C('ink') }), items);
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
    const set = instSet(boxGeo, lit({ color: C('haze') }), items, { colors: true });
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
  const unfog = g => g.traverse(o => { if (o.material) { (Array.isArray(o.material) ? o.material : [o.material]).forEach(m => { m.fog = false; if (m.isMeshStandardMaterial) { m.envMapIntensity = ENV_I; litMats.push(m); } m.needsUpdate = true; }); } });
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
    unfog(o); aoBakeAsset(o, o.position.y); group.add(o);
    return o;
  }
  // (issue #3 step 4) per-vertex occlusion for a library item, no rays: each vertex darkens with
  // its height above the item's base over the first AO_RISE units, and again when another box of
  // the same item hangs over it within AO_OVER units (a canopy over a counter, an eave over a
  // wall, a shelf over the goods). The darkest is AO_MIN. Library boxes each own their geometry,
  // so the colours are per mesh; a geometry two meshes share is cloned for the second.
  const AO_RISE = 1.2, AO_OVER = 1.5, AO_MARGIN = 0.25, aoV = new THREE.Vector3();
  function aoBakeAsset(root, baseY) {
    const meshes = [], boxes = [];
    root.traverse(m => {
      if (!m.isMesh || !m.geometry || !m.geometry.attributes.position || !m.material || !m.material.isMeshStandardMaterial || m.material.transparent) return;
      meshes.push(m); boxes.push(new THREE.Box3().setFromObject(m));
    });
    const used = new Set();
    meshes.forEach((m, mi) => {
      let geo = m.geometry;
      if (geo.attributes.color) return;
      if (used.has(geo)) { geo = geo.clone(); m.geometry = geo; }
      used.add(geo);
      const pos = geo.attributes.position, n = pos.count, col = new Float32Array(n * 3);
      for (let i = 0; i < n; i++) {
        aoV.fromBufferAttribute(pos, i).applyMatrix4(m.matrixWorld);
        let t = Math.min(1, Math.max(0, (aoV.y - baseY) / AO_RISE)), occ = 1;
        let ao = AO_MIN + (1 - AO_MIN) * t * t * (3 - 2 * t);
        for (let j = 0; j < boxes.length; j++) {
          if (j === mi) continue;
          const b = boxes[j], dy = b.min.y - aoV.y;
          if (dy < -0.05 || dy > AO_OVER) continue;
          if (aoV.x < b.min.x - AO_MARGIN || aoV.x > b.max.x + AO_MARGIN || aoV.z < b.min.z - AO_MARGIN || aoV.z > b.max.z + AO_MARGIN) continue;
          occ = Math.min(occ, AO_MIN + (1 - AO_MIN) * Math.max(0, dy) / AO_OVER);
        }
        ao = Math.max(AO_MIN, ao * occ);
        col[i * 3] = col[i * 3 + 1] = col[i * 3 + 2] = ao;
      }
      geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
      m.material.vertexColors = true; m.material.needsUpdate = true;
    });
  }

  // ── scene API for the per-chapter scene files (scene-*.js), loaded after this file ──
  // part(x, y, z, w, d, lookByEra, rotY?, geo?)  lookByEra: { red:{h,col}, dadao:{h,col}, tower:{h,col} }
  // instSet(geo, material, items, {colors})     items: { x, z, y?, w, d, r?, c?, h:{red,dadao,tower} }
  // lit(params)                                 the engine's lit material; params.surface = 'brick' | 'plaster' | 'concrete' | 'wood' | 'asphalt'
  // lam(col, extra?)                            lit() by palette key, surface family chosen from the key
  // aoBake(geo)                                 bakes the height-rule occlusion into a geometry's vertex colours (part and instSet do it)
  window.SCENE = { part, instSet, only, C, boxGeo, withFog, lit, lam, aoBake, scene, GRID, ERAS, anchors, PALETTE, rnd, TOWER, walkX, libGroup, asset, findAsset };


  // ── 張君雅小妹妹 running down the middle of the street, always a little ahead of the camera ──
  // Issue #1 Part 2 (CJ, 2026-09-21: 「go 開始 Part 2」). Suggested, not copied: bowl-cut black
  // hair with a straight fringe, white shirt, dark skirt on two straps, red cheeks, a bowl of
  // noodles carried in both hands in front of her. She is the viewer's memory, so she runs the
  // whole street, not only the 2000s. Primitives and the palette only.
  const girl = new THREE.Group();
  const gSkin = withFog(lit({ color: C('bone') }));
  const gShirt = withFog(lit({ color: C('bone') }));
  const gInk = withFog(lit({ color: C('ink') }));
  const gVerm = withFog(lit({ color: C('verm') }));
  const gLamp = withFog(lit({ color: C('lamp') }));
  const skirtGeo = new THREE.ConeGeometry(0.5, 1, 10); skirtGeo.translate(0, 0.5, 0);
  const skirt = new THREE.Mesh(skirtGeo, gInk); skirt.scale.set(1, 0.85, 1); skirt.position.y = 0.8; girl.add(skirt);        // dark skirt
  const torso = new THREE.Mesh(boxGeo, gShirt); torso.scale.set(0.52, 0.6, 0.32); torso.position.y = 1.62; girl.add(torso);   // white shirt
  [-0.13, 0.13].forEach(x => { const st = new THREE.Mesh(boxGeo, gInk); st.scale.set(0.09, 0.6, 0.34); st.position.set(x, 1.62, 0); girl.add(st); }); // straps
  const bib = new THREE.Mesh(boxGeo, gInk); bib.scale.set(0.36, 0.22, 0.35); bib.position.y = 1.62; girl.add(bib);          // the skirt's bib
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.27, 12, 10), gSkin); head.position.y = 2.46; girl.add(head);
  // bowl cut: a cap of hair over the top and back, a straight fringe across the forehead
  const capGeo = new THREE.SphereGeometry(0.3, 12, 8, 0, Math.PI * 2, 0, Math.PI * 0.58);
  const hairCap = new THREE.Mesh(capGeo, gInk); hairCap.position.y = 2.47; girl.add(hairCap);
  const fringe = new THREE.Mesh(boxGeo, gInk); fringe.scale.set(0.5, 0.16, 0.14); fringe.position.set(0, 2.42, 0.2); girl.add(fringe);
  const hair = new THREE.Mesh(boxGeo, gInk); hair.scale.set(0.56, 0.3, 0.16); hair.position.set(0, 2.28, -0.2); girl.add(hair);  // the back of the bowl
  [-0.17, 0.17].forEach(x => { const ch = new THREE.Mesh(new THREE.SphereGeometry(0.06, 6, 5), gVerm); ch.position.set(x, 2.38, 0.22); girl.add(ch); }); // red cheeks
  const legL = new THREE.Mesh(boxGeo, gSkin); legL.scale.set(0.16, 0.8, 0.16); legL.position.set(-0.15, 0.8, 0); legL.rotation.x = Math.PI; girl.add(legL);
  const legR = new THREE.Mesh(boxGeo, gSkin); legR.scale.set(0.16, 0.8, 0.16); legR.position.set(0.15, 0.8, 0); legR.rotation.x = Math.PI; girl.add(legR);
  [legL, legR].forEach(l => { const shoe = new THREE.Mesh(boxGeo, gInk); shoe.scale.set(1.2, 0.12, 1.6); shoe.position.set(0, 0.95, -0.25); l.add(shoe); }); // shoes at the foot end of the leg
  // arms held forward, both hands on the bowl
  const gArmL = new THREE.Mesh(boxGeo, gSkin); gArmL.scale.set(0.13, 0.55, 0.13); gArmL.position.set(-0.3, 1.95, 0.06); gArmL.rotation.x = -Math.PI / 2 + 0.25; girl.add(gArmL);
  const gArmR = new THREE.Mesh(boxGeo, gSkin); gArmR.scale.set(0.13, 0.55, 0.13); gArmR.position.set(0.3, 1.95, 0.06); gArmR.rotation.x = -Math.PI / 2 + 0.25; girl.add(gArmR);
  const bowl = new THREE.Group();
  const bowlGeo = new THREE.CylinderGeometry(0.3, 0.2, 0.22, 12); bowlGeo.translate(0, 0.11, 0);
  bowl.add(new THREE.Mesh(bowlGeo, gShirt));
  const noodles = new THREE.Mesh(new THREE.SphereGeometry(0.22, 10, 6, 0, Math.PI * 2, 0, Math.PI * 0.5), gLamp); noodles.position.y = 0.18; bowl.add(noodles);
  const egg = new THREE.Mesh(new THREE.SphereGeometry(0.07, 6, 5), gVerm); egg.position.set(0.08, 0.36, 0.05); bowl.add(egg);
  [-0.05, 0.03].forEach((x, i) => { const cs = new THREE.Mesh(boxGeo, gInk); cs.scale.set(0.025, 0.5, 0.025); cs.position.set(x, 0.2, -0.02 + i * 0.03); cs.rotation.z = 0.35 + i * 0.1; cs.rotation.x = -0.4; bowl.add(cs); });
  bowl.position.set(0, 1.78, 0.5); girl.add(bowl);
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
    const carry = Math.sin(stride * 2) * 0.04 * run;                                 // the bowl bobs a little as she runs; the arms stay on it
    bowl.position.y = 1.78 + carry; gArmL.position.y = gArmR.position.y = 1.95 + carry;
    hair.position.z = -0.2 - run * 0.06; fringe.position.y = 2.42 + Math.sin(stride * 2) * 0.01 * run;
    girl.rotation.y = 0;
  }

  // ── curve particles (IVRESS borrow g): lantern sparks in Dadaocheng, a light stream up 101 ──
  // Two THREE.Points, CPU-updated each frame, each riding a CatmullRomCurve3 sampled once into a
  // table: the sparks drift along a curve threaded through the eight lantern strings and rise off
  // it; the stream spirals up the tower on a curve that follows TOWER.faceX. A tiny shader gives
  // each point a soft round sprite and its own alpha. Capped at 500 + 900 points.
  const SPARK_N = 500, STREAM_N = 900;
  const pointsMat = (size) => new THREE.ShaderMaterial({
    uniforms: { uSize: { value: size }, uPR: { value: renderer.getPixelRatio() } },
    vertexShader: `attribute float aAlpha; attribute vec3 aColor; uniform float uSize, uPR; varying float vA; varying vec3 vC;
      void main(){ vC = aColor; vA = aAlpha; vec4 mv = modelViewMatrix * vec4(position, 1.0);
        gl_PointSize = min(28.0, uSize * uPR * 240.0 / max(1.0, -mv.z)); gl_Position = projectionMatrix * mv; }`,
    fragmentShader: `varying float vA; varying vec3 vC;
      void main(){ vec2 d = gl_PointCoord - 0.5; float r = dot(d, d); if (r > 0.25) discard;
        gl_FragColor = vec4(vC, vA * smoothstep(0.25, 0.06, r)); }`,
    transparent: true, depthWrite: false, fog: false
  });
  function pointsSet(n, size) {
    const geo = new THREE.BufferGeometry();
    const pos = new Float32Array(n * 3), col = new Float32Array(n * 3), alp = new Float32Array(n);
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    geo.setAttribute('aColor', new THREE.BufferAttribute(col, 3));
    geo.setAttribute('aAlpha', new THREE.BufferAttribute(alp, 1));
    const mesh = new THREE.Points(geo, pointsMat(size)); mesh.frustumCulled = false; mesh.visible = false; scene.add(mesh);
    return { mesh, pos, col, alp, n, p: [] };
  }
  const sampleCurve = (pts, n) => new THREE.CatmullRomCurve3(pts, false, 'centripetal').getSpacedPoints(n);
  const curveAt = (tab, t) => { const f = Math.min(tab.length - 1.001, Math.max(0, t) * (tab.length - 1)), i = Math.floor(f), k = f - i; return P3.copy(tab[i]).lerp(tab[i + 1], k); };
  const sparks = pointsSet(SPARK_N, 0.55), stream = pointsSet(STREAM_N, 0.7);
  const sparkCurve = sampleCurve([[0, 7.2, -186], [1.5, 7.0, -204], [-1.5, 7.4, -228], [1.0, 7.0, -252], [-1.0, 7.3, -276], [0, 7.5, -290]].map(a => new THREE.Vector3(a[0], a[1], a[2])), 256);
  const lampC = C('lamp'), vermC = C('verm'), boneC = C('bone'), glassC = C('glass');
  for (let i = 0; i < SPARK_N; i++) sparks.p.push({ t: rnd(), x: (rnd() - 0.5) * 11, life: rnd(), rate: 0.25 + rnd() * 0.3, sway: rnd() * 6.28, warm: rnd() });
  let streamCurve = null;
  function buildStreamCurve() {                                    // needs TOWER.faceX from scene-tower.js
    const pts = [];
    for (let k = 0; k <= 14; k++) {
      const y = 2 + (TOWER.h + 18 - 2) * k / 14, r = TOWER.x - TOWER.faceX(y) + 1.6, a = k * 1.35;
      pts.push(new THREE.Vector3(TOWER.x + Math.cos(a) * r, y, TOWER.z + Math.sin(a) * r));
    }
    streamCurve = sampleCurve(pts, 512);
    for (let i = 0; i < STREAM_N; i++) stream.p.push({ t: rnd(), rate: 0.045 + rnd() * 0.05, jx: (rnd() - 0.5) * 1.2, jy: (rnd() - 0.5) * 1.2, jz: (rnd() - 0.5) * 1.2, bright: rnd() });
  }
  function updateParticles(dt, now, key) {
    sparks.mesh.visible = key === 'dadao';
    stream.mesh.visible = key === 'tower' && !!streamCurve;
    if (sparks.mesh.visible) {
      const P = sparks.p, t = now / 1000;
      for (let i = 0; i < SPARK_N; i++) {
        const q = P[i]; q.life += q.rate * dt; if (q.life > 1) { q.life = 0; q.t = rnd(); q.x = (rnd() - 0.5) * 11; }
        curveAt(sparkCurve, q.t);
        const rise = q.life * 4.5, sw = Math.sin(t * 1.7 + q.sway) * 0.35 * q.life;
        sparks.pos[i * 3] = P3.x + q.x + sw; sparks.pos[i * 3 + 1] = P3.y + rise; sparks.pos[i * 3 + 2] = P3.z + Math.cos(t * 1.3 + q.sway) * 0.3;
        tmpC.copy(lampC).lerp(vermC, q.warm * 0.6);
        sparks.col[i * 3] = tmpC.r; sparks.col[i * 3 + 1] = tmpC.g; sparks.col[i * 3 + 2] = tmpC.b;
        sparks.alp[i] = Math.sin(q.life * Math.PI) * 0.9;
      }
      sparks.mesh.geometry.attributes.position.needsUpdate = true; sparks.mesh.geometry.attributes.aColor.needsUpdate = true; sparks.mesh.geometry.attributes.aAlpha.needsUpdate = true;
    }
    if (stream.mesh.visible) {
      const P = stream.p;
      for (let i = 0; i < STREAM_N; i++) {
        const q = P[i]; q.t += q.rate * dt; if (q.t > 1) q.t -= 1;
        curveAt(streamCurve, q.t);
        stream.pos[i * 3] = P3.x + q.jx; stream.pos[i * 3 + 1] = P3.y + q.jy; stream.pos[i * 3 + 2] = P3.z + q.jz;
        tmpC.copy(glassC).lerp(boneC, 0.5 + q.bright * 0.5).lerp(lampC, q.t * 0.5);   // cool at the base, warm and pale near the crown
        stream.col[i * 3] = tmpC.r; stream.col[i * 3 + 1] = tmpC.g; stream.col[i * 3 + 2] = tmpC.b;
        stream.alp[i] = (0.35 + 0.65 * q.bright) * Math.min(1, q.t * 8) * Math.min(1, (1 - q.t) * 6);
      }
      stream.mesh.geometry.attributes.position.needsUpdate = true; stream.mesh.geometry.attributes.aColor.needsUpdate = true; stream.mesh.geometry.attributes.aAlpha.needsUpdate = true;
    }
  }

  // ── the words ──────────────────────────────────────────────────────────────
  // Each word is split into glyph spans with a per-glyph transition-delay; toggling .show on the
  // block reveals them letter by letter with no JS per frame (IVRESS borrow b). The block's own
  // opacity still follows scroll distance so a word also fades as you leave it.
  const wordEl = document.getElementById('word'), wordBig = wordEl.children[0], wordSub = wordEl.children[1];
  const GLYPH_MS = 38;
  // words are kept whole (a .w span per word, nowrap) so lines break between words, never inside one
  const glyphs = (text, from) => { let i = 0; return text.split(' ').map(w => '<span class="w">' + w.split('').map(ch => `<span style="transition-delay:${from + (i++) * GLYPH_MS}ms">${ch}</span>`).join('') + '</span>').join(' '); };
  let wordShown = -1;
  function updateWords(u) {
    let best = -1, bestA = 0;
    WORDS.forEach((w, i) => { const a = Math.max(0, 1 - Math.abs(u - w.at) / 0.045); if (a > bestA) { bestA = a; best = i; } });
    if (best !== wordShown && best >= 0) {
      wordShown = best;
      wordEl.classList.remove('show');
      wordBig.innerHTML = glyphs(WORDS[best].big, 0);
      wordSub.innerHTML = glyphs(WORDS[best].sub || '', WORDS[best].big.length * GLYPH_MS * 0.6);
      void wordEl.offsetWidth;                                       // restart the transitions
    }
    wordEl.classList.toggle('show', bestA > 0.35);
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
    mixFrom = { night: mixCur.night, lamp: mixCur.lamp, hemi: mixCur.hemi, env: mixCur.env, print: mixCur.print };
    eraFrom = eraIdx; eraIdx = i;
    libGroups.forEach(g => { g.visible = g.userData.eras.indexOf(ERAS[i].key) >= 0; });
    eraT0 = instant ? now - ERA_MS : now;
    swapEraLabel(ERAS[i], instant);
  }
  const tmpC = new THREE.Color(), skyC = new THREE.Color();
  let mixCur = { night: 0, lamp: KEY * 0.5, hemi: HEMI * 0.65, env: 0.7, print: 1 }, mixFrom = { ...mixCur };
  let envCur = -1;
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
      if (p.tileMap && p.mesh.material.map === p.tileMap) fitTile(p.mesh.material, Math.max(p.mesh.scale.x, p.mesh.scale.z), h);
    });
    // sky, fog, light and print level: held flat inside an era, moved in the same 500ms
    const M = ERA_MIX[key];
    mixCur.night = mixFrom.night + (M.night - mixFrom.night) * e;
    mixCur.lamp = mixFrom.lamp + (M.lamp - mixFrom.lamp) * e;
    mixCur.hemi = mixFrom.hemi + (M.hemi - mixFrom.hemi) * e;
    mixCur.env = mixFrom.env + (M.env - mixFrom.env) * e;
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
    const ei = ENV_I * mixCur.env;                                   // only touched while an era tween runs
    if (ei !== envCur) { envCur = ei; litMats.forEach(m => { m.envMapIntensity = ei; }); }
    post.uniforms.uPrint.value = mixCur.print;
  }

  // ── camera rig ───────────────────────────────────────────────────────────────
  const V = a => new THREE.Vector3(a[0], a[1], a[2]);
  const posCurve = new THREE.CatmullRomCurve3(CAM.map(k => V(k.p)), false, 'centripetal');
  const tgtCurve = new THREE.CatmullRomCurve3(CAM.map(k => V(k.t)), false, 'centripetal');
  const fovs = CAM.map(k => k.fov);
  const pTmp = new THREE.Vector3(), tTmp = new THREE.Vector3();
  // mouse parallax (IVRESS borrow f): a damped offset along the camera's own right and up axes,
  // applied after lookAt so the frame slides rather than turns; it fades to nothing within
  // PARALLAX_FADE of each chapter cut and of the end, so the cuts and the closing shot stay fixed.
  const PARALLAX_FADE = 0.04, PARALLAX_X = 0.6, PARALLAX_Y = 0.3;
  let mouseX = 0, mouseY = 0, driftX = 0, driftY = 0;
  const camRight = new THREE.Vector3(), camUp = new THREE.Vector3();
  function parallaxFade(u) {
    let f = 1;
    for (let i = 1; i < BOUNDS.length; i++) f = Math.min(f, Math.abs(u - BOUNDS[i]) / PARALLAX_FADE);
    f = Math.min(1, f);
    return f * f * (3 - 2 * f);
  }
  function placeCamera(u) {
    posCurve.getPoint(u, pTmp);
    tgtCurve.getPoint(u, tTmp);
    const s = u * (fovs.length - 1), i = Math.min(fovs.length - 2, Math.floor(s)), f = s - i;
    camera.fov = fovs[i] + (fovs[i + 1] - fovs[i]) * f;
    camera.position.copy(pTmp);
    camera.lookAt(tTmp);
    const k = parallaxFade(u);
    camRight.set(1, 0, 0).applyQuaternion(camera.quaternion);
    camUp.set(0, 1, 0).applyQuaternion(camera.quaternion);
    camera.position.addScaledVector(camRight, driftX * k).addScaledVector(camUp, driftY * k);
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
                uTime: { value: 0 }, uInk: { value: C('ink') }, uHaze: { value: C('haze') }, uBone: { value: C('bone') },
                uFlash: { value: 0 }, uFlashCol: { value: new THREE.Color(1, 1, 1) } },
    vertexShader: `varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }`,
    fragmentShader: `
      uniform sampler2D tDiffuse; uniform vec2 uRes; uniform float uPrint, uTime, uFlash; uniform vec3 uInk, uHaze, uBone, uFlashCol;
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
        // GRAIN — paper grain at 1 (coarser, static), film grain at 0 (finer, moving).
        // Luminance-aware: it lives in the shadows and leaves the sky clean; stepped at 30 Hz.
        vec2 cell = floor(gl_FragCoord.xy / mix(1.0, 2.0, uPrint));
        float g = hash(cell + floor(uTime * mix(30.0, 2.0, uPrint)) * 0.37) - 0.5;
        g *= mix(1.0, 1.0 - lum(c), 0.85);
        c += g * mix(0.06, 0.045, uPrint);
        // VIGNETTE — restrained
        float d = distance(vUv, vec2(0.5));
        c *= 1.0 - smoothstep(0.45, 1.0, d) * 0.3;
        // CHAPTER CUT — a flash from the centre of the frame as the camera crosses a year marking
        float fm = 1.0 - smoothstep(0.12, 0.72, length(vec2(vUv.x - 0.5, (vUv.y - 0.5) * 0.6)));
        c = mix(c, uFlashCol, uFlash * fm);
        gl_FragColor = vec4(c, 1.0);
      }`,
    depthTest: false, depthWrite: false
  });
  const postScene = new THREE.Scene();
  postScene.add(new THREE.Mesh(new THREE.PlaneGeometry(2, 2), post));
  const postCam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

  // ── chapter cut: a flash as the camera crosses each year marking ─────────────
  // Keyed on progress (so it scrubs both ways), white at the 2000 marking and warm gold at 2020;
  // it holds briefly and fades so stopping on a marking does not leave the frame lit. Borrowed
  // from IVRESS's section cuts (research/ivress/README.md).
  const FLASH_W = 0.012, FLASH_HOLD = 500, FLASH_FADE = 1200;
  const FLASH_COL = [null, new THREE.Color(1, 1, 1), C('lamp').lerp(new THREE.Color(1, 1, 1), 0.45)];
  let flashIn = false, flashT0 = 0;
  function updateFlash(now) {
    let a = 0, col = null;
    for (let i = 1; i < ERAS.length; i++) {
      const k = 1 - Math.min(1, Math.abs(progress - BOUNDS[i]) / FLASH_W);
      if (k > a) { a = k; col = FLASH_COL[i]; }
    }
    if (a > 0 && !flashIn) { flashIn = true; flashT0 = now; }
    if (a === 0) flashIn = false;
    const t = now - flashT0;
    const fade = t < FLASH_HOLD ? 1 : Math.max(0, 1 - (t - FLASH_HOLD) / FLASH_FADE);
    post.uniforms.uFlash.value = a * a * (3 - 2 * a) * fade;
    if (col) post.uniforms.uFlashCol.value.copy(col);
  }

  // ── HUD: era label, year, anchor labels ──────────────────────────────────────
  const yearEl = document.getElementById('year');
  // the chapter column (top-left): "01/03", the name in caps, the years, the Chinese name vertical
  const eraBox = document.querySelector('.hud-chapter');
  const eraLabelEl = document.getElementById('eraLabel');
  const eraYearsEl = document.getElementById('eraYears');
  const eraZhEl = document.getElementById('eraZh');
  const chapNEl = document.getElementById('chapN');
  let swapTimer = 0;
  function swapEraLabel(era, instant) {
    const apply = () => {
      const zh = era.zh.split(' · ');                                  // '西門町 · Ximending' → vertical 西門町, romanised name under the years
      chapNEl.textContent = String(ERAS.indexOf(era) + 1).padStart(2, '0');
      eraLabelEl.textContent = era.label; eraYearsEl.textContent = era.years + (zh[1] ? ' · ' + zh[1] : ''); eraZhEl.textContent = zh[0];
    };
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
      const vis = s.built && inFront ? near * eraE * (1 - closingA) : 0;   // labels step aside for the closing line
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
  let progress = 0, frontier = Infinity, lastT = performance.now(), shownYear = -1, closingA = 0;

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

  // ── robustness: tab switches, keyboards, touch ───────────────────────────────
  // Coming back from another tab, the first frame's dt would be the whole absence; dt is clamped
  // to 50 ms and the clocks are reset so neither the camera damping nor the runner's scroll-speed
  // estimate sees a jump.
  const resetClocks = () => { lastT = performance.now(); lastProg = progress; };
  document.addEventListener('visibilitychange', () => { if (!document.hidden) resetClocks(); });
  window.addEventListener('pageshow', resetClocks);
  window.addEventListener('focus', resetClocks);
  // keyboard: arrows, page keys, space, home, end scroll the page even when the browser gave the
  // canvas focus and stopped scrolling the document itself
  window.addEventListener('keydown', ev => {
    if (ev.metaKey || ev.ctrlKey || ev.altKey) return;
    const page = window.innerHeight * 0.8, step = 120;
    const by = { ArrowDown: step, ArrowUp: -step, PageDown: page, PageUp: -page, ' ': ev.shiftKey ? -page : page }[ev.key];
    if (by !== undefined) { ev.preventDefault(); window.scrollBy({ top: by, behavior: 'smooth' }); }
    else if (ev.key === 'Home') { ev.preventDefault(); window.scrollTo({ top: 0, behavior: 'smooth' }); }
    else if (ev.key === 'End') { ev.preventDefault(); window.scrollTo({ top: maxScroll(), behavior: 'smooth' }); }
  });
  // touch: the document scrolls natively (touch-action: pan-y on the canvas). If an in-app browser
  // swallows the gesture and scrollY does not move, drag the page by hand for the rest of the swipe.
  let touchY = 0, touchScroll0 = 0, touchMoves = 0, touchManual = false;
  window.addEventListener('touchstart', ev => { touchY = ev.touches[0].clientY; touchScroll0 = window.scrollY; touchMoves = 0; touchManual = false; }, { passive: true });
  window.addEventListener('touchmove', ev => {
    const y = ev.touches[0].clientY, dy = touchY - y; touchY = y; touchMoves++;
    if (!touchManual && touchMoves >= 3 && Math.abs(dy) > 4 && window.scrollY === touchScroll0) touchManual = true;
    if (touchManual) window.scrollBy(0, dy);
  }, { passive: true });

  // ── render warm-up (IVRESS borrow h) ─────────────────────────────────────────
  // three.js compiles a material's program and uploads its textures the first time the object is
  // drawn, so the first crossing into each era used to hitch on the buildings that only exist
  // there. Era differences are visibility and uniforms only, so one pass with everything visible
  // covers all three: compile every program, draw one frame into the offscreen target so the
  // textures upload, then restore. Runs on the first frame, after the scene files have built.
  // ?nowarm=1 skips it, for measuring.
  let warm = null;
  function warmUp() {
    const t0 = performance.now(), vis = [];
    scene.traverse(o => { vis.push([o, o.visible]); o.visible = true; });
    renderer.compile(scene, camera);
    renderer.setRenderTarget(rt); renderer.render(scene, camera); renderer.setRenderTarget(null);
    vis.forEach(([o, v]) => { o.visible = v; });
    warm = { ms: Math.round(performance.now() - t0), programs: renderer.info.programs.length, textures: renderer.info.memory.textures };
  }
  const NOWARM = new URLSearchParams(location.search).get('nowarm') === '1';
  if (NOWARM) requestAnimationFrame(enableShadows);                 // still once, before the first draw
  const hitch = { max: 0, at: 0 };                                 // the longest frame gap since load, for measuring
  function frame(now) {
    const dt = Math.min(0.05, (now - lastT) / 1000);
    if (now - lastT > hitch.max && lastT > 0) { hitch.max = Math.round(now - lastT); hitch.at = +progress.toFixed(3); }
    lastT = now;
    if (!warm && !NOWARM) { enableShadows(); warmUp(); hitch.max = 0; }
    const target = Math.min(1, Math.max(0, window.scrollY / maxScroll()));
    progress += (target - progress) * (1 - Math.exp(-DAMP * dt));
    if (Math.abs(target - progress) < 0.00005) progress = target;
    driftX += (mouseX * PARALLAX_X - driftX) * (1 - Math.exp(-2 * dt));
    driftY += (-mouseY * PARALLAX_Y - driftY) * (1 - Math.exp(-2 * dt));

    const camZ = placeCamera(progress);
    sunFollow(camZ);
    frontier = Math.min(frontier, camZ - FOG_LEAD);
    FOG_U.frontier.value = -1e5; // mist switched off: the whole street is visible in daylight

    setEra(eraAtU(progress), false);
    updateWorld(now);
    if (!streamCurve && TOWER.faceX) buildStreamCurve();
    updateParticles(dt, now, ERAS[eraIdx].key);
    updateMan(progress);
    updateGirl(progress, camZ, dt);
    updateWords(progress);
    updateLabels();
    closingA = Math.min(1, Math.max(0, (progress - CLOSING.showFrom) / (1 - CLOSING.showFrom) * 1.6));
    closingEl.style.opacity = closingA.toFixed(2);

    const y = Math.round(yearAtU(progress));
    if (y !== shownYear) { shownYear = y; yearEl.textContent = String(y); }

    post.uniforms.uTime.value = now / 1000;
    updateFlash(now);
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
                   get camZ() { return camera.position.z; }, get drift() { return [driftX, driftY, parallaxFade(progress)]; }, get warm() { return warm; }, hitch, get scrollY() { return window.scrollY; }, get print() { return mixCur.print; }, BOUNDS, jumpToYear,
                   get shadow() { let c = 0, r = 0, t = 0, black = 0; scene.traverse(o => { if (o.isMesh) { t++; if (o.castShadow) c++; if (o.receiveShadow) r++; const m = Array.isArray(o.material) ? o.material[0] : o.material; if (m && m.vertexColors && o.geometry && !o.geometry.attributes.color) black++; } });
                     return { enabled: renderer.shadowMap.enabled, lightCasts: key.castShadow, meshes: t, casters: c, receivers: r, uncoloured: black, map: !!key.shadow.map, size: key.shadow.mapSize.x,
                              box: [key.shadow.camera.left, key.shadow.camera.right], pos: key.position.toArray().map(v => +v.toFixed(1)), target: key.target.position.toArray().map(v => +v.toFixed(1)), camZ: +camera.position.z.toFixed(1) }; } };

  // The first frame does the one-time work (shadow flags, warm-up), so it must not run before the
  // scene files have built: the parser may yield to a frame between two script tags, and it did
  // once the environment map was generated at load. DOMContentLoaded fires after the last script.
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => requestAnimationFrame(frame));
  else requestAnimationFrame(frame);
})();
