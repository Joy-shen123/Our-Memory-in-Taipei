// tools/scene-dump.js — write a slice of the running page out as JSON, for asset/blender/scene_import.py.
//
// Why this exists: the buildings are glb files, but WHERE each one stands is decided in JavaScript
// (scene-red.js, scene-dadao.js, scene-tower.js, app.js). Blender can open one building and cannot
// open the street. This reads the street back out of the live scene graph — every visible mesh and
// every instance of every InstancedMesh — and writes world transforms, colours, raw geometry for
// the JS-only parts, the glb source name for the rest, the canvas textures, the camera and the sun.
//
// It is loaded by index.html after models.js and does nothing at all unless it is asked to run, so
// the page is unchanged. Two ways to ask:
//
//   http://localhost:8017/index.html?dump=0.44&zmin=-290&zmax=-140[&post=1][&notex=1][&wait=150]
//       scrolls to the fraction, waits for the era tween, dumps, then POSTs the JSON to
//       /__dump__/<name>.json (with post=1, needs tools/dump-server.py) or downloads it.
//
//   window.__dumpScene({ fraction, zMin, zMax, textures })     -> the JSON object, in the console
//   window.__dumpAt({ fraction, zMin, zMax, post, name })       -> scroll, settle, dump, deliver
//
// Defaults for the z-range: the 180 units the camera can actually see from where it stands
// (camZ + 30 … camZ − 150). Long strips that straddle the range — the road, the two sidewalks, the
// ground — are kept whole; selection is by world bounding box overlap, not by centre point.
//
// What it cannot carry, and says so in meta.notes: the sky dome (a gradient shader — the importer
// rebuilds it as a Blender world instead), the two particle systems (THREE.Points), and the girl's
// and the man's animation (one frame, whichever was on screen).
(function () {
  if (!window.THREE) return;

  // ── provenance: which glb each geometry came from ───────────────────────────
  // models.js clones a glb primitive's geometry for MODELS.instance, so the clone's uuid does not
  // match the glb's. Both MODELS entry points are wrapped here, at load time, so every geometry the
  // page takes out of a glb is tagged the moment it is taken: nothing is guessed afterwards.
  const byGeo = new Map();        // geometry.uuid -> { model, node, mat }
  const bySet = new Map();        // InstancedMesh.uuid -> { model, node, mat, preScaleY }
  const seen = {};

  const palName = (() => {
    const inv = {};
    const P = (window.DATA && window.DATA.PALETTE) || {};
    Object.keys(P).forEach(k => inv[P[k].replace('#', '').toLowerCase()] = k);
    return hex => inv[hex] || null;
  })();

  function nodeOf(mesh, root) {                       // the glTF node: the child of the gltf scene
    let o = mesh, prev = mesh;
    while (o && o.parent && o !== root) { prev = o; o = o.parent; }
    return (prev && prev.name) || (mesh.name || 'main');
  }

  function tagGltf(name, gltf) {
    gltf.scene.traverse(o => {
      if (!o.isMesh) return;
      const hex = o.material && o.material.color ? o.material.color.getHexString() : 'ffffff';
      byGeo.set(o.geometry.uuid, { model: name, node: nodeOf(o, gltf.scene), mat: palName(hex) || ('#' + hex) });
    });
  }

  if (window.MODELS) {
    const load0 = MODELS.load, inst0 = MODELS.instance;
    MODELS.load = function (name, cb) {
      load0(name, gltf => { if (!seen[name]) { seen[name] = 1; tagGltf(name, gltf); } cb(gltf); });
    };
    MODELS.instance = function (root, items, opts) {
      const ps = MODELS.prims(root);
      let top = 0;
      ps.forEach(p => { p.geometry.computeBoundingBox(); top = Math.max(top, p.geometry.boundingBox.max.y); });
      const H = ((opts || {}).height) || top || 1;                       // models.js: geo is scaled 1/H in y
      const sets = inst0.call(MODELS, root, items, opts);
      sets.forEach((set, i) => {
        const tag = ps[i] && byGeo.get(ps[i].geometry.uuid);
        if (tag && set && set.mesh) bySet.set(set.mesh.uuid, Object.assign({}, tag, { preScaleY: 1 / H }));
      });
      return sets;
    };
  }

  // ── the dump ────────────────────────────────────────────────────────────────
  const hexOf = c => '#' + c.getHexString();
  const arr16 = m => Array.from(m.elements).map(v => Math.abs(v) < 1e-9 ? 0 : +v.toFixed(6));

  function dump(opts) {
    opts = opts || {};
    const S = window.SCENE, F = window.__fog;
    if (!S || !F) throw new Error('the page has not finished building: window.SCENE / window.__fog missing');
    const scene = S.scene;
    const camZ = F.camZ;
    const zMax = opts.zMax != null ? opts.zMax : camZ + 30;              // nearest to the camera
    const zMin = opts.zMin != null ? opts.zMin : camZ - 150;             // farthest down the street
    const wantTex = opts.textures !== false;

    scene.updateMatrixWorld(true);

    const geos = [], geoId = new Map();
    const mats = [], matId = new Map();
    const texs = [], texId = new Map();
    const objects = [];
    const counts = {}, skipped = {};
    const note = (k) => skipped[k] = (skipped[k] || 0) + 1;

    // textures: the canvas each one draws on is the identity, because lit() clones the map object
    // but shares its canvas, and only the repeat differs per material.
    function texture(t) {
      if (!wantTex || !t || !t.image) return null;
      const img = t.image;
      if (texId.has(img)) return texId.get(img);
      let png = null;
      try {
        if (img.toDataURL) png = img.toDataURL('image/png');
        else if (img.width) { const c = document.createElement('canvas'); c.width = img.width; c.height = img.height; c.getContext('2d').drawImage(img, 0, 0); png = c.toDataURL('image/png'); }
      } catch (e) { png = null; }
      if (!png) { note('texture could not be read'); return null; }
      const id = texs.length;
      texs.push({ id, w: img.width, h: img.height, png: png.slice(png.indexOf(',') + 1) });
      texId.set(img, id);
      return id;
    }

    function material(m, overrideColor) {
      const map = texture(m.map), nrm = texture(m.normalMap), emap = texture(m.emissiveMap);
      const rep = m.map ? [m.map.repeat.x, m.map.repeat.y] : [1, 1];
      const off = m.map ? [m.map.offset.x, m.map.offset.y] : [0, 0];
      const key = [overrideColor || (m.color ? hexOf(m.color) : '#ffffff'), m.emissive ? hexOf(m.emissive) : '', m.emissiveIntensity || 0,
                   m.roughness == null ? '' : m.roughness, m.metalness == null ? '' : m.metalness, !!m.vertexColors,
                   m.transparent ? (m.opacity == null ? 1 : m.opacity) : '', map, nrm, emap, rep, off, m.side].join('|');
      if (matId.has(key)) return matId.get(key);
      const id = mats.length;
      mats.push({
        id, name: (m.name || 'mat') + '_' + id,
        color: overrideColor || (m.color ? hexOf(m.color) : '#ffffff'),
        emissive: m.emissive && m.emissive.getHex() ? hexOf(m.emissive) : null,
        emissiveIntensity: m.emissive && m.emissive.getHex() ? (m.emissiveIntensity == null ? 1 : m.emissiveIntensity) : 0,
        roughness: m.roughness == null ? 0.92 : m.roughness,
        metalness: m.metalness == null ? 0 : m.metalness,
        vertexColors: !!m.vertexColors,
        opacity: m.transparent ? (m.opacity == null ? 1 : m.opacity) : 1,
        transparent: !!m.transparent,
        unlit: !!(m.isMeshBasicMaterial),
        doubleSided: m.side === THREE.DoubleSide,
        map, normalMap: nrm, emissiveMap: emap, repeat: rep, offset: off
      });
      matId.set(key, id);
      return id;
    }

    function geometry(g, name) {
      if (geoId.has(g.uuid)) return geoId.get(g.uuid);
      const id = geos.length, p = g.attributes.position;
      if (!p) { note('geometry with no position attribute'); return null; }
      const r6 = a => Array.from(a).map(v => +v.toFixed(5));
      geos.push({
        id, name: name || g.type || ('geo' + id),
        position: r6(p.array),
        index: g.index ? Array.from(g.index.array) : null,
        normal: g.attributes.normal ? r6(g.attributes.normal.array) : null,
        uv: g.attributes.uv ? r6(g.attributes.uv.array) : null,
        color: g.attributes.color ? r6(g.attributes.color.array) : null
      });
      geoId.set(g.uuid, id);
      return id;
    }

    // world bounding box of geometry `g` under matrix `m`, tested against the z slice
    const _b = new THREE.Box3(), _v = new THREE.Vector3();
    function inSlice(g, m) {
      if (!g.boundingBox) g.computeBoundingBox();
      _b.copy(g.boundingBox).applyMatrix4(m);
      return _b.max.z >= zMin && _b.min.z <= zMax;
    }
    const tiny = m => { m.decompose(_v, new THREE.Quaternion(), _v); return false; };

    const P = new THREE.Vector3(), Q = new THREE.Quaternion(), SC = new THREE.Vector3();
    function emit(o, matrix, rec) {
      const dec = matrix.clone();
      dec.decompose(P, Q, SC);
      if (Math.abs(SC.x) < 1e-3 || Math.abs(SC.y) < 1e-3 || Math.abs(SC.z) < 1e-3) return false;   // an item absent in this era: dropped to y -50, scale 1e-4
      objects.push(Object.assign({ name: o.name || o.type, matrix: arr16(matrix) }, rec));
      return true;
    }

    const visible = o => { let p = o; while (p) { if (!p.visible) return false; p = p.parent; } return true; };

    const M = new THREE.Matrix4(), MI = new THREE.Matrix4(), PS = new THREE.Matrix4();
    scene.traverse(o => {
      if (o.isPoints) { note('THREE.Points particle system'); return; }
      if (!o.isMesh && !o.isInstancedMesh) return;
      const m0 = Array.isArray(o.material) ? o.material[0] : o.material;
      if (!m0) return;
      if (m0.isShaderMaterial && !m0.isMeshStandardMaterial) { note('ShaderMaterial (the sky dome — rebuilt as a Blender world)'); return; }
      if (!visible(o)) { note('hidden object'); return; }
      // the backdrop rides along with every slice: the mountain ring is what the page shows behind
      // the street, and it is the one thing whose world box has nothing to do with the z-range.
      // By name, not by a material test: the asset library's unfog() sets fog false on every
      // library item and some of them are MeshBasic, so any heuristic drags the whole street into
      // every slice. app.js names the one object this is meant for.
      const backdrop = o.name === 'backdrop-mountains';

      if (o.isInstancedMesh) {
        const tag = bySet.get(o.uuid);
        let n = 0;
        for (let i = 0; i < o.count; i++) {
          o.getMatrixAt(i, MI);
          M.multiplyMatrices(o.matrixWorld, MI);
          if (!backdrop && !inSlice(o.geometry, M)) continue;
          let col = null;
          if (o.instanceColor) {
            const a = o.instanceColor.array;
            col = '#' + new THREE.Color(a[i * 3], a[i * 3 + 1], a[i * 3 + 2]).getHexString();
          }
          let mtx = M, rec;
          if (tag) {
            PS.makeScale(1, tag.preScaleY, 1);                 // undone here: the importer places the glb's own mesh
            mtx = M.clone().multiply(PS);
            rec = { source: 'glb', model: tag.model, node: tag.node, prim: tag.mat, mat: material(m0, col), inst: i };
          } else {
            rec = { source: 'geo', geo: geometry(o.geometry, o.name), mat: material(m0, col), inst: i, backdrop: backdrop || undefined };
          }
          if (emit(o, mtx, rec)) { n++; }
        }
        if (n) {
          const k = tag ? tag.model : (backdrop ? 'js:backdrop' : 'js:instanced');
          counts[k] = (counts[k] || 0) + n;
        }
        return;
      }

      if (!backdrop && !inSlice(o.geometry, o.matrixWorld)) return;
      const tag = byGeo.get(o.geometry.uuid);
      const rec = tag
        ? { source: 'glb', model: tag.model, node: tag.node, prim: tag.mat, mat: material(m0) }
        : { source: 'geo', geo: geometry(o.geometry, o.name), mat: material(m0), backdrop: backdrop || undefined };
      if (emit(o, o.matrixWorld, rec)) {
        const k = tag ? tag.model : 'js:mesh';
        counts[k] = (counts[k] || 0) + 1;
      }
    });

    // ── camera, sun, sky ──────────────────────────────────────────────────────
    const camera = (() => {
      const use = F.camera || S.camera || scene.children.find(c => c.isCamera) || null;
      if (!use) { note('the camera is not reachable: app.js must expose it on window.__fog'); return null; }
      use.updateMatrixWorld(true);
      return { matrix: arr16(use.matrixWorld), fov: use.fov, aspect: use.aspect, near: use.near, far: use.far,
               position: use.getWorldPosition(new THREE.Vector3()).toArray().map(v => +v.toFixed(4)) };
    })();

    let sun = null, hemi = null, sky = null;
    scene.traverse(o => {
      if (o.isDirectionalLight && !sun) {
        sun = { position: o.position.toArray().map(v => +v.toFixed(3)),
                target: o.target.position.toArray().map(v => +v.toFixed(3)),
                color: hexOf(o.color), intensity: o.intensity, castShadow: !!o.castShadow };
      }
      if (o.isHemisphereLight && !hemi) hemi = { sky: hexOf(o.color), ground: hexOf(o.groundColor), intensity: o.intensity };
      if (o.material && o.material.uniforms && o.material.uniforms.horizon && !sky)
        sky = { horizon: hexOf(o.material.uniforms.horizon.value), top: hexOf(o.material.uniforms.top.value) };
    });

    const bytes = JSON.stringify(texs).length;
    return {
      meta: {
        generated: new Date().toISOString(),
        page: location.href, fraction: +F.progress.toFixed(4), year: F.year, era: F.era,
        camZ: +camZ.toFixed(3), zMin, zMax, units: 'metres', up: 'Y (three.js) — the importer converts to Blender Z-up',
        viewport: [window.innerWidth, window.innerHeight],
        notes: [
          'the sky dome is a two-stop gradient ShaderMaterial; the importer rebuilds it as a Blender world, not as a mesh',
          'the two THREE.Points particle systems are not exported',
          'the girl and the climbing man are exported in whatever pose the frame was on',
          'canvas-drawn text (signs, posters, name boards, price boards, neon) is exported as baked PNG textures, not as geometry'
        ]
      },
      camera, sun, hemi, sky,
      counts: { byModel: counts, objects: objects.length, geometries: geos.length, materials: mats.length, textures: texs.length, textureBytes: bytes, skipped },
      textures: texs, materials: mats, geometries: geos, objects: objects
    };
  }

  // ── running it ──────────────────────────────────────────────────────────────
  const frames = n => new Promise(r => { let i = 0; (function t() { if (++i < n) requestAnimationFrame(t); else r(); })(); });

  async function scrollTo(f, wait) {
    const max = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
    window.scrollTo(0, f * max);
    await frames(wait || 150);                 // the scroll damping and the 500 ms era tween both settle
  }

  async function deliver(data, name, post) {
    const body = JSON.stringify(data);
    if (post) {
      const r = await fetch('/__dump__/' + name, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body });
      return (r.ok ? 'posted ' : 'POST failed ' + r.status + ' ') + name + ' (' + (body.length / 1048576).toFixed(2) + ' MB)';
    }
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([body], { type: 'application/json' }));
    a.download = name; a.click();
    return 'downloaded ' + name;
  }

  window.__dumpScene = dump;
  window.__dumpAt = async function (o) {
    o = o || {};
    await scrollTo(o.fraction == null ? 0.44 : o.fraction, o.wait);
    const data = dump(o);
    const name = o.name || ('scene-' + (o.fraction == null ? 0.44 : o.fraction).toFixed(2) + '.json');
    const msg = await deliver(data, name, o.post);
    return { msg, counts: data.counts, meta: data.meta };
  };

  const q = new URLSearchParams(location.search);
  if (q.has('dump')) {
    window.addEventListener('load', async () => {
      await frames(60);
      const num = k => q.has(k) ? parseFloat(q.get(k)) : undefined;
      window.__dumpResult = 'running';
      try {
        window.__dumpResult = await window.__dumpAt({
          fraction: parseFloat(q.get('dump')), zMin: num('zmin'), zMax: num('zmax'),
          textures: !q.has('notex'), post: q.has('post'), wait: num('wait'), name: q.get('name') || undefined
        });
      } catch (e) { window.__dumpResult = { error: e.message + '\n' + e.stack }; }
      console.log('[scene-dump]', JSON.stringify(window.__dumpResult && window.__dumpResult.counts || window.__dumpResult));
    });
  }
})();
