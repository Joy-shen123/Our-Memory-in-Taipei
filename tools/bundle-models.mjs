// Merge the per-model glbs into one bundle per load group, so the page makes three requests
// instead of eighteen. Each source file's roots are re-parented under a node named after the
// file, so MODELS.node(root, name) still finds what it always found.
import { NodeIO } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
import { readFileSync, existsSync } from 'node:fs';
import { MeshoptDecoder, MeshoptEncoder } from 'meshoptimizer';
import { mergeDocuments, unpartition, dedup, prune } from '@gltf-transform/functions';

const GROUPS = {
  'bundle-core':     ['bollard','chunghwa','girl','lamp','lux','props','red-house','shopfront','tree'],
  'bundle-dadao':    ['dihua-min','dihua-yang','dihua-baroque','dihua-zone2','dadao-entrance','stall','temple','yongle'],
  'bundle-tower':    ['tower101'],
};

const io = new NodeIO()
  .registerExtensions(ALL_EXTENSIONS)
  .registerDependencies({ 'meshopt.decoder': MeshoptDecoder, 'meshopt.encoder': MeshoptEncoder });

for (const [out, names] of Object.entries(GROUPS)) {
  let doc = null;
  for (const name of names) {
    const path = `asset/models/${name}.glb`;
    if (!existsSync(path)) { console.error(`missing ${path}`); process.exit(1); }
    const d = await io.read(path);
    // wrap this file's scene roots under one node carrying the file's name
    const scene = d.getRoot().listScenes()[0];
    const wrap = d.createNode(name);
    for (const child of scene.listChildren()) { scene.removeChild(child); wrap.addChild(child); }
    scene.addChild(wrap);
    if (!doc) { doc = d; doc.getRoot().listScenes()[0].setName(out); }
    else {
      mergeDocuments(doc, d);
      // merge brings a second scene; move its children into the first and drop it
      const scenes = doc.getRoot().listScenes();
      const first = scenes[0];
      for (const s of scenes.slice(1)) {
        for (const c of s.listChildren()) { s.removeChild(c); first.addChild(c); }
        s.dispose();
      }
    }
  }
  // no dedup(): the three dihua styles share node names (main, storey, crest) and dedup
  // collapses them, so yang and baroque lose their children.
  await doc.transform(unpartition());
  await io.write(`asset/models/${out}.glb`, doc);
  const kb = Math.round(readFileSync(`asset/models/${out}.glb`).length / 1024);
  console.log(`${out}.glb  ${names.length} models  ${kb} KB`);
}
