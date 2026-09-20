// 時代迷霧 · 大稻埕 — scroll rig, directional fog, era re-render, anchor silhouettes,
// the 月下老人 queue beat, and the uPrint post pass (woodblock → night photograph).

(function () {
  const { PALETTE, GRID, ERAS, TILES, CAM } = window.DATA;
  const C = k => new THREE.Color(PALETTE[k]);

  // ── tunables ──────────────────────────────────────────────────────────────────
  const FOG_LEAD = 44;        // how far ahead of the camera the fog frontier sits
  const FOG_SOFT = 28;        // width of the soft edge, in world units
  const HAZE_DENSITY = 0.006; // gentle distance haze so looking back still has depth
  const DAMP = 5.5;           // scroll damping. higher = snappier
  const ERA_MS = 500;         // the world re-renders into the next era over this long
  const LABEL_NEAR = 70;      // anchor labels fade in inside this distance
  // per-era mix of the five colours: sky/fog darkens, lamp light grows, print fades
  const ERA_MIX = { flee: { night: 0.0, lamp: 0.55, hemi: 0.7 }, tea: { night: 0.25, lamp: 0.8, hemi: 0.55 },
                    modern: { night: 0.5, lamp: 1.0, hemi: 0.45 }, now: { night: 0.75, lamp: 1.25, hemi: 0.35 } };

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
  flat(400, 900, 'ink', 0, 0, -200);
  flat(GRID.roadWidth, 620, 'haze', 0, 0.02, -200);
  flat(60, 620, 'haze', -50, -0.3, -200);

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
  function part(x, y, z, w, d, look, rotY) {
    const mesh = new THREE.Mesh(boxGeo, withFog(new THREE.MeshLambertMaterial({ color: C('bone') })));
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
  const same = (h, col) => ({ flee: { h, col }, tea: { h, col }, modern: { h, col }, now: { h, col } });
  const only = (eras, h, col) => { const o = {}; eras.forEach(k => o[k] = { h, col }); return o; };

  const tileX = tile => tile.grid[0] * GRID.laneX + tile.grid[0] * (tile.size[0] / 2 - 4);
  const tileZ = tile => -tile.grid[1] * GRID.lot;

  // generic lots: one plain box each, from the type table
  TILES.filter(t => !t.hero).forEach(t => part(tileX(t), 0, tileZ(t), t.size[0], t.size[1], t.byEra));

  // ── the four anchors, built from primitives ──────────────────────────────────
  const anchors = {};
  TILES.filter(t => t.hero).forEach(t => { anchors[t.id] = { tile: t, x: tileX(t), z: tileZ(t), top: 8 }; });
  const built = (t, k) => t.byEra[k].built;

  // 霞海城隍廟 — base, swallowtail-ish roof, two lamp posts, and the queue outside it in `now`
  (() => {
    const A = anchors.chenghuang, t = A.tile, x = A.x, z = A.z;
    const on = ERAS.map(e => e.key).filter(k => built(t, k));
    part(x, 0, z, 8, 8, only(on, 4.5, 'verm'));                    // hall
    part(x, 4.5, z, 9.6, 9.6, only(on, 1.1, 'ink'));               // roof slab
    part(x, 5.4, z, 1.6, 10.2, only(on, 1.6, 'ink'), Math.PI / 4); // ridge, a box on its edge
    part(x - 3.3, 0, z - 5.6, 0.5, 0.5, only(on, 3.2, 'lamp'));    // lamp posts by the door
    part(x + 3.3, 0, z - 5.6, 0.5, 0.5, only(on, 3.2, 'lamp'));
    part(x - 4, 0, z + 5.2, 0.6, 0.6, only(on, 2.4, 'lamp'));
    part(x + 4, 0, z + 5.2, 0.6, 0.6, only(on, 2.4, 'lamp'));
    // the queue: small figures in a line from the door, along the street, `now` only
    for (let i = 0; i < 14; i++) {
      const qx = x - 4.6 - (i < 4 ? 0 : (i - 4) * 0.02), qz = z + 4.6 - i * 1.15 + (i % 2) * 0.25;
      part(qx - (i % 3) * 0.35, 0, qz, 0.55, 0.45, only(['now'], 1.6 + (i % 3) * 0.1, i % 5 === 0 ? 'verm' : 'bone'));
    }
    A.top = 7.5;
  })();

  // 迪化街 — five shophouses in a row: arcade at street level, upper floor set back, parapet later
  (() => {
    const A = anchors.dihua, t = A.tile, x = A.x, z0 = A.z + 20;
    for (let i = 0; i < 5; i++) {
      const z = z0 - i * 10, v = (i % 2) * 0.4;
      part(x, 0, z, 9, 9, { flee: { h: 3.2, col: 'bone' }, tea: { h: 3.4, col: 'haze' }, modern: { h: 3.6, col: 'bone' }, now: { h: 3.6, col: 'bone' } });
      part(x + 1.2, 3.2, z, 6.6, 9, { flee: { h: 0.4 + v, col: 'haze' }, tea: { h: 2 + v, col: 'haze' }, modern: { h: 4.4 + v, col: 'bone' }, now: { h: 4.4 + v, col: 'bone' } });
      part(x - 2.6, 3.4, z, 1.2, 9, only(['modern', 'now'], 5.2 + v, 'bone'));    // pilasters at the street face
      part(x - 2.6, 8.6 + v, z, 1.4, 4, only(['modern', 'now'], 1.4, 'bone'));    // baroque parapet crest
      part(x - 3.2, 2.2, z, 0.3, 7, only(['now'], 0.6, 'verm'));                  // 年貨 shop sign band
    }
    A.top = 10;
  })();

  // 大稻埕碼頭 — a platform on the river, junks in `tea`, one left in `modern`, a park in `now`
  (() => {
    const A = anchors.wharf, x = A.x, z = A.z;
    part(x, 0, z, 14, 40, { flee: { h: 0.3, col: 'haze' }, tea: { h: 0.8, col: 'haze' }, modern: { h: 0.8, col: 'haze' }, now: { h: 0.8, col: 'haze' } });
    for (let i = 0; i < 4; i++) {
      const jz = z + 15 - i * 10, jx = x - 11, eras = i === 1 ? ['tea', 'modern'] : ['tea'];
      part(jx, -0.3, jz, 2.4, 7, only(eras, 1.4, 'ink'));           // hull
      part(jx, 1.1, jz + 0.6, 0.3, 0.3, only(eras, 7, 'bone'));     // mast
      part(jx, 2.6, jz + 0.9, 0.15, 3.4, only(eras, 4.6, 'bone'));  // sail
    }
    for (let i = 0; i < 6; i++) {                                    // tea chests on the wharf, `tea` only
      part(x + 3 + (i % 2) * 1.6, 0.8, z + 12 - i * 3.2, 1.2, 1.2, only(['tea'], 1.1, 'ink'));
    }
    for (let i = 0; i < 5; i++) {                                    // park trees, `now` only
      part(x + 4, 0.8, z + 16 - i * 8, 0.4, 0.4, only(['now'], 2.6, 'ink'));
      part(x + 4, 3.2, z + 16 - i * 8, 2.6, 2.6, only(['now'], 2.4, 'haze'));
    }
    A.top = 4;
  })();

  // 太平町 — tea factories, then the 1930s block: the theatre volume with a sign, cafés beside it
  (() => {
    const A = anchors.taiping, x = A.x, z0 = A.z + 15;
    part(x, 0, z0, 9, 10, { tea: { h: 4, col: 'haze' }, modern: { h: 12, col: 'bone' }, now: { h: 11, col: 'haze' } });   // 永樂座 volume
    part(x - 4.6, 7, z0, 0.4, 6, only(['modern'], 3, 'verm'));                                                          // its vertical sign
    part(x - 4.6, 3, z0, 0.4, 5, only(['now'], 1.2, 'lamp'));
    part(x, 0, z0 - 10, 9, 10, { tea: { h: 3.5, col: 'haze' }, modern: { h: 7, col: 'bone' }, now: { h: 10, col: 'haze' } });
    part(x, 0, z0 - 20, 9, 10, { tea: { h: 4, col: 'haze' }, modern: { h: 6, col: 'bone' }, now: { h: 12, col: 'haze' } });
    part(x, 0, z0 - 30, 9, 10, { tea: { h: 3, col: 'haze' }, modern: { h: 8, col: 'bone' }, now: { h: 9, col: 'haze' } });
    part(x - 2.6, 6.2, z0 - 10, 1.4, 5, only(['modern'], 1.4, 'bone'));                                                 // parapet crests
    part(x - 2.6, 5.2, z0 - 20, 1.4, 5, only(['modern'], 1.4, 'bone'));
    A.top = 13;
  })();

  // ── era state and the 500ms re-render ────────────────────────────────────────
  let eraIdx = 0, eraT0 = -1e9, eraFrom = 0, eraE = 1;
  function setEra(i, instant) {
    if (i === eraIdx && !instant) return;
    const now = performance.now();
    parts.forEach(p => { p.fromH = p.mesh.scale.y; p.fromC = p.mesh.material.color.clone(); });
    mixFrom = { night: mixCur.night, lamp: mixCur.lamp, hemi: mixCur.hemi, print: mixCur.print };
    eraFrom = eraIdx; eraIdx = i;
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
    skyC.copy(C('haze')).lerp(C('ink'), mixCur.night * 0.85).lerp(C('bone'), Math.max(0, mixCur.print - 0.3) * 1.2);
    scene.background.copy(skyC);
    scene.fog.color.copy(skyC);
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
    const apply = () => { eraLabelEl.textContent = era.label; eraYearsEl.textContent = era.years + ' · ' + era.en; };
    clearTimeout(swapTimer);
    if (instant) { eraBox.classList.remove('swap'); apply(); return; }
    eraBox.classList.add('swap');
    swapTimer = setTimeout(() => { apply(); eraBox.classList.remove('swap'); }, 240);
  }
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
        L.name.textContent = L.A.tile.name.zh;
        L.en.textContent = L.A.tile.name.en;
        L.cap.innerHTML = (s.caption || '').split('').map((ch, i) => `<span style="transition-delay:${i * 18}ms">${ch}</span>`).join('');
      }
      el = L.el;
      el.style.opacity = vis.toFixed(2);
      el.classList.toggle('on', vis > 0.6);
      const lx = Math.min(innerWidth - Math.min(380, innerWidth * 0.7 + 20), (wp.x + 1) / 2 * innerWidth);
      el.style.transform = `translate(${lx.toFixed(0)}px, ${((1 - wp.y) / 2 * innerHeight).toFixed(0)}px)`;
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
    frontier = Math.min(frontier, camZ - FOG_LEAD); // forward only: behind you stays clear
    FOG_U.frontier.value = frontier;

    setEra(eraAtU(progress), false);
    updateWorld(now);
    updateLabels();

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
