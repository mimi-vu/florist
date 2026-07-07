// Usage:  node scripts/inspect-glb.mjs public/models/flowers/spider-lily-white.glb
// Prints the GLB's scene graph and highlights nodes you can register as
// separate flowers via `modelNode` in the catalog.

import fs from 'node:fs';
import path from 'node:path';

const file = process.argv[2];
if (!file) {
  console.error('Usage: node scripts/inspect-glb.mjs <path/to/model.glb>');
  process.exit(1);
}

const buf = fs.readFileSync(file);
if (buf.toString('utf8', 0, 4) !== 'glTF') {
  console.error('Not a valid GLB file (missing glTF magic header)');
  process.exit(1);
}

const jsonLen = buf.readUInt32LE(12);
const json = JSON.parse(buf.toString('utf8', 20, 20 + jsonLen));

const nodes = json.nodes ?? [];
const scenes = json.scenes ?? [];

console.log(`\n${path.basename(file)}\n${'='.repeat(50)}`);
if (json.asset?.extras?.title)   console.log(`Title:   ${json.asset.extras.title}`);
if (json.asset?.extras?.author)  console.log(`Author:  ${json.asset.extras.author}`);
if (json.asset?.extras?.license) console.log(`License: ${json.asset.extras.license}`);
console.log(`Nodes:   ${nodes.length}   Scenes: ${scenes.length}\n`);

function printNode(idx, depth = 0) {
  const node = nodes[idx];
  if (!node) return;
  const hasMesh = 'mesh' in node;
  const name = node.name || `(unnamed #${idx})`;
  const marker = hasMesh ? '\u25CF' : '\u25CB';
  console.log(`${'  '.repeat(depth)}${marker} ${name}${hasMesh ? ` [mesh #${node.mesh}]` : ''}`);
  (node.children ?? []).forEach((c) => printNode(c, depth + 1));
}

scenes.forEach((s, i) => {
  console.log(`Scene ${i}: ${s.name || '(unnamed)'}`);
  (s.nodes ?? []).forEach((idx) => printNode(idx, 1));
});

// Suggest candidate node names for splitting into multiple flowers.
const candidates = new Set();
function walk(idx, depth) {
  const node = nodes[idx];
  if (!node) return;
  const name = node.name || '';
  const hasMesh = 'mesh' in node;
  const wrapperName = /^(scene|sketchfab_model|root|gltf_scenerootnode)$/i.test(name);
  // Skip wrapper roots (depth 0-2) and reference cubes.
  if (!wrapperName && !/^_?cube(_\d+)?$/i.test(name) && (hasMesh || (node.children?.length ?? 0) > 0) && depth >= 2) {
    candidates.add(name);
  }
  (node.children ?? []).forEach((c) => walk(c, depth + 1));
}
scenes.forEach((s) => (s.nodes ?? []).forEach((idx) => walk(idx, 0)));

console.log('\nCandidate `modelNode` values (each could be a separate flower):');
if (candidates.size === 0) {
  console.log('  (none — the GLB looks like a single flower already; leave `modelNode` unset)');
} else {
  for (const name of candidates) console.log(`  "${name}"`);
}
console.log();
