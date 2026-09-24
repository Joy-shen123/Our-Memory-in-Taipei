// models.js — the glb models (issue #5). Loaded before app.js; everything here that touches the
// engine (window.SCENE) runs inside load callbacks, after every script has run.
// Every model is built by a Blender script in asset/blender/ and exported to asset/models/
// (see asset/blender/stylized.py), then packed in place by tools/pack-models.sh (meshopt, fault 1,
// 2026-09-24): the loader needs meshopt_decoder.js, loaded after GLTFLoader.js. This file loads them
// once, hands the scene files what they need, and keeps the page's look on them: Lambert materials
// with the fog chunk, flat palette colours carried over from the glb, shadows on.
//
//   MODELS.load(name, cb)              loads asset/models/<name>.glb once, calls back (cached)
//   MODELS.lambertize(root)            swaps the loader's Standard materials for the page's Lambert
//   MODELS.node(root, name)            the glb node called name (a script's group=)
//   MODELS.prims(root)                 every mesh under root: [{ mesh, geometry, color }]
//   MODELS.unitGeo(geometry)           a copy with height 1 and base at y 0, for instSet items
//                                       whose h is the real height ({ geo, height })
//   MODELS.instance(node, items, opts) one instSet per primitive of node, items shared, so a glb
//                                       street element gets the engine's per-era height tween
//
// Late models (fault 1, CJ 2026-09-24: 「東西太多loading太久」). The camera opens in Ximending and
// takes a while to reach Dadaocheng, so chapter 2's and chapter 3's models are held out of the first
// request: a load() for one of them queues its callback, and the fetch starts when the scroll gets
// near (LATE_AT) or, whichever comes first, LATE_IDLE_MS after the page's load event — chapter 2's
// group, then chapter 3's once it is in. A model that arrives this way rises out of the ground over
// the engine's era tween (SCENE.rise, instSet's rise option) instead of popping in, so a bay that
// lands while the camera can already see down the street grows the way the era change grows things.
(function () {
  if (!window.THREE) return;
  const loader = THREE.GLTFLoader ? new THREE.GLTFLoader() : null;
  if (loader && window.MeshoptDecoder) loader.setMeshoptDecoder(window.MeshoptDecoder);
  else if (loader) console.error('meshopt_decoder.js is missing: the packed glbs need it (load it after GLTFLoader.js)');
  const cache = {};

  // group 1 = Spring Festival (z -140 … -290), group 2 = The Future (z -290 on). Everything else,
  // and anything shared with chapter 1 (props, lamp, tree, girl), is in the first request.
  const LATE = { 'dihua-min': 1, 'dihua-yang': 1, 'dihua-baroque': 1, 'dihua-zone2': 1, 'dadao-entrance': 1, 'stall': 1, 'temple': 1, 'yongle': 1, 'tower101': 2 };
  const LATE_AT = [0, 0.04, 0.30];      // scroll fraction that releases a group early (chapter 2 begins at 0.347, chapter 3 at 0.582)
  const LATE_IDLE_MS = 1500;            // after the load event, group 1 starts anyway; group 2 follows it
  const held = { 1: [], 2: [] }, released = { 1: false, 2: false }, inflight = { 1: 0, 2: 0 };

  function load(name, cb) {
    if (!loader) { console.error('THREE.GLTFLoader is missing: load GLTFLoader.js after three.min.js'); return; }
    const e = cache[name];
    if (e && e.gltf) { cb(e.gltf); return; }
    if (e) { e.waiting.push(cb); return; }
    cache[name] = { waiting: [cb], group: LATE[name] || 0 };
    if (LATE[name] && !released[LATE[name]]) { held[LATE[name]].push(name); return; }
    fetch(name);
  }
  function fetch(name) {
    const g = cache[name].group;
    if (g) inflight[g]++;
    loader.load('asset/models/' + name + '.glb', gltf => {
      gltf.scene.userData.late = g > 0;                                  // a late group: rise, do not pop
      const w = cache[name].waiting;
      cache[name] = { gltf, waiting: [], group: g };
      w.forEach(f => f(gltf));
      done(g);
    }, undefined, err => { console.error(name + '.glb failed to load', err); done(g); });
  }
  function done(g) { if (g && --inflight[g] === 0 && g === 1) release(2); }
  function release(g) {
    if (released[g]) return;
    released[g] = true;
    const names = held[g]; held[g] = [];
    names.forEach(fetch);
    if (g === 1 && !names.length) release(2);
  }
  const scrollFrac = () => window.scrollY / Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
  function onScroll() {
    const f = scrollFrac();
    if (f >= LATE_AT[1]) release(1);
    if (f >= LATE_AT[2]) release(2);
    if (released[2]) window.removeEventListener('scroll', onScroll);
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  const idle = () => setTimeout(() => release(1), LATE_IDLE_MS);
  if (document.readyState === 'complete') idle(); else window.addEventListener('load', idle);

  const isLate = o => { for (let p = o; p; p = p.parent) if (p.userData && p.userData.late) return true; return false; };

  function lambertize(root) {
    const { withFog, rise } = window.SCENE;
    root.traverse(o => {
      if (!o.isMesh) return;
      o.material = withFog(new THREE.MeshLambertMaterial({ color: o.material.color }));
      o.castShadow = o.receiveShadow = true;
    });
    if (rise && isLate(root)) rise(root);
    return root;
  }

  const node = (root, name) => root.getObjectByName(name) || null;

  function prims(root) {
    const out = [];
    root.traverse(o => { if (o.isMesh) out.push({ mesh: o, geometry: o.geometry, color: o.material.color.clone() }); });
    return out;
  }

  function unitGeo(geometry) {
    const g = geometry.clone();
    g.computeBoundingBox();
    const b = g.boundingBox, h = (b.max.y - b.min.y) || 1;
    g.translate(0, -b.min.y, 0);
    g.scale(1, 1 / h, 1);
    return { geo: g, height: h };
  }

  // instance(node, items, opts): items are instSet items ({ x, z, y?, w, d, r?, h:{era…}, c? });
  // every primitive of the node becomes one instSet over the same items. opts.height (default the
  // node's own height) is what an item's h of 1 means: items usually say h: only-eras(1), and the
  // real height comes from the model. opts.colorPrim = the material colour name whose primitive
  // takes per-item colours (it.c) — its material goes white so the instance colour is the colour.
  // opts.emissive = { color, intensity } for the 'lamp' primitives (lantern heads, bulbs).
  function instance(root, items, opts) {
    opts = opts || {};
    const { instSet, withFog } = window.SCENE;
    const ps = prims(root);
    let top = 0;
    ps.forEach(p => { p.geometry.computeBoundingBox(); top = Math.max(top, p.geometry.boundingBox.max.y); });
    const H = opts.height || top || 1;
    const sets = [], late = isLate(root);
    ps.forEach(p => {
      const g = p.geometry.clone();
      g.scale(1, 1 / H, 1);                                      // base stays at y 0, model top → 1
      const isColor = opts.colorPrim && p.color.getHex() === window.SCENE.C(opts.colorPrim).getHex();
      const m = new THREE.MeshLambertMaterial({ color: isColor ? 0xffffff : p.color });
      if (opts.emissive && p.color.getHex() === window.SCENE.C('lamp').getHex()) { m.emissive = window.SCENE.C('lamp'); m.emissiveIntensity = opts.emissive; }
      const its = items.map(it => Object.assign({}, it, { h: scaleH(it.h, H), c: isColor ? it.c : undefined }));
      sets.push(instSet(g, m, its, { colors: !!isColor, rise: late }));
    });
    return sets;
  }
  const scaleH = (h, H) => { const o = {}; Object.keys(h).forEach(k => o[k] = h[k] * H); return o; };

  window.MODELS = { load, lambertize, node, prims, unitGeo, instance,
                    get late() { return { released: { ...released }, held: { 1: held[1].slice(), 2: held[2].slice() }, inflight: { ...inflight } }; } };
})();
