// models.js — the glb models (issue #5). Loaded before app.js; everything here that touches the
// engine (window.SCENE) runs inside load callbacks, after every script has run.
// Every model is built by a Blender script in asset/blender/ and exported to asset/models/
// (see asset/blender/stylized.py). This file loads them once, hands the scene files what they
// need, and keeps the page's look on them: Lambert materials with the fog chunk, flat palette
// colours carried over from the glb, shadows on.
//
//   MODELS.load(name, gltf => …)       loads asset/models/<name>.glb once, calls back (cached)
//   MODELS.lambertize(root)            swaps the loader's Standard materials for the page's Lambert
//   MODELS.node(root, name)            the glb node called name (a script's group=)
//   MODELS.prims(root)                 every mesh under root: [{ mesh, geometry, color }]
//   MODELS.unitGeo(geometry)           a copy with height 1 and base at y 0, for instSet items
//                                       whose h is the real height ({ geo, height })
//   MODELS.instance(node, items, opts) one instSet per primitive of node, items shared, so a glb
//                                       street element gets the engine's per-era height tween
(function () {
  if (!window.THREE) return;
  const loader = THREE.GLTFLoader ? new THREE.GLTFLoader() : null;
  const cache = {};

  function load(name, cb) {
    if (!loader) { console.error('THREE.GLTFLoader is missing: load GLTFLoader.js after three.min.js'); return; }
    const e = cache[name];
    if (e && e.gltf) { cb(e.gltf); return; }
    if (e) { e.waiting.push(cb); return; }
    cache[name] = { waiting: [cb] };
    loader.load('asset/models/' + name + '.glb', gltf => {
      const w = cache[name].waiting;
      cache[name] = { gltf, waiting: [] };
      w.forEach(f => f(gltf));
    }, undefined, err => console.error(name + '.glb failed to load', err));
  }

  function lambertize(root) {
    const { withFog } = window.SCENE;
    root.traverse(o => {
      if (!o.isMesh) return;
      o.material = withFog(new THREE.MeshLambertMaterial({ color: o.material.color }));
      o.castShadow = o.receiveShadow = true;
    });
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
    const sets = [];
    ps.forEach(p => {
      const g = p.geometry.clone();
      g.scale(1, 1 / H, 1);                                      // base stays at y 0, model top → 1
      const isColor = opts.colorPrim && p.color.getHex() === window.SCENE.C(opts.colorPrim).getHex();
      const m = new THREE.MeshLambertMaterial({ color: isColor ? 0xffffff : p.color });
      if (opts.emissive && p.color.getHex() === window.SCENE.C('lamp').getHex()) { m.emissive = window.SCENE.C('lamp'); m.emissiveIntensity = opts.emissive; }
      const its = items.map(it => Object.assign({}, it, { h: scaleH(it.h, H), c: isColor ? it.c : undefined }));
      sets.push(instSet(g, m, its, { colors: !!isColor }));
    });
    return sets;
  }
  const scaleH = (h, H) => { const o = {}; Object.keys(h).forEach(k => o[k] = h[k] * H); return o; };

  window.MODELS = { load, lambertize, node, prims, unitGeo, instance };
})();
