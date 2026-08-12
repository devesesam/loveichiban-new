/**
 * One-off: prepare Diego's round-2 image drop (July 2026).
 *
 *   node execution/prepare_round2_images.mjs
 *
 * Two of the supplied files are chroma-key shots with no alpha channel:
 * the new logo sits on green, the new hero bowl on magenta. Both are keyed
 * out to transparency here with a feathered threshold plus spill removal, so
 * no coloured fringe survives on the white bowl rim / black logo ring.
 *
 * Sources are read from .tmp/image-backups/ (gitignored), where the originals
 * were archived, so this script is safely re-runnable.
 */

import sharp from 'sharp';
import { fileURLToPath } from 'node:url';

const root = (p) => fileURLToPath(new URL(`../${p}`, import.meta.url));
const src = (name) => root(`.tmp/image-backups/${name}`); // originals live here after the first run
const img = (name) => root(`src/assets/images/${name}`);

/**
 * Key out a flat chroma background.
 *
 * `score(r, g, b)` returns how strongly a pixel matches the screen colour,
 * expressed as the dominance (0-255) of the screen channel(s) over the rest.
 * Pixels above `hard` go fully transparent, below `soft` stay fully opaque,
 * and the band between is feathered so edges stay smooth. Partially keyed
 * pixels also get the screen colour pulled back out (despill) so the halo
 * doesn't tint the subject.
 */
async function chromaKey(src, dest, { score, despill, hard = 90, soft = 30 }) {
  const { data, info } = await sharp(src)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const px = info.width * info.height;
  for (let i = 0; i < px; i++) {
    const o = i * info.channels;
    const r = data[o];
    const g = data[o + 1];
    const b = data[o + 2];
    const s = score(r, g, b);

    if (s >= hard) {
      data[o + 3] = 0;
      continue;
    }
    if (s > soft) {
      const t = (s - soft) / (hard - soft); // 0 = keep, 1 = drop
      data[o + 3] = Math.round(255 * (1 - t));
      despill(data, o);
    }
  }

  await sharp(data, { raw: { width: info.width, height: info.height, channels: info.channels } })
    .png({ compressionLevel: 9 })
    .toBuffer()
    .then((buf) => sharp(buf).trim({ threshold: 0 }).png({ compressionLevel: 9 }).toFile(dest));
}

// --- new logo: green screen -------------------------------------------------
await chromaKey(src('logo new.png'), img('logo.png'), {
  score: (r, g, b) => g - Math.max(r, b),
  // pull green back to the neighbouring channels' level
  despill: (d, o) => {
    const cap = Math.max(d[o], d[o + 2]);
    if (d[o + 1] > cap) d[o + 1] = cap;
  },
});

// --- new hero bowl: magenta screen ------------------------------------------
await chromaKey(src('new bowl.png'), img('hero-bowl.png'), {
  score: (r, g, b) => Math.min(r, b) - g,
  // magenta spill = red+blue above green; bring both down toward green
  despill: (d, o) => {
    const cap = Math.round((d[o] + d[o + 2]) / 2);
    const target = Math.max(d[o + 1], Math.round(cap * 0.9));
    if (d[o] > target) d[o] = target;
    if (d[o + 2] > target) d[o + 2] = target;
  },
});

// --- mural: crop the bench + ceiling away, lighten and desaturate ------------
{
  const m = await sharp(src('mural.png')).metadata();
  await sharp(src('mural.png'))
    .extract({
      left: 0,
      top: Math.round(m.height * 0.02),
      width: m.width,
      height: Math.round(m.height * 0.78), // drops the black shelf along the bottom
    })
    .modulate({ saturation: 0.55, brightness: 1.12 })
    .resize({ width: 1600, withoutEnlargement: true })
    .png({ compressionLevel: 9 })
    .toFile(img('mural.png'));
}

// --- straight photo conversions ---------------------------------------------
const photos = [
  ['wedding.jfif', 'wedding.jpg'],
  ['caravan.png', 'food-truck.jpg'],
  ['bowl inna hand.jfif', 'bowl-in-hand.jpg'],
];

for (const [srcName, dest] of photos) {
  await sharp(src(srcName))
    .rotate()
    .resize({ width: 1600, withoutEnlargement: true })
    .jpeg({ quality: 78, mozjpeg: true })
    .toFile(img(dest));
}

// --- report ------------------------------------------------------------------
const outputs = [
  'logo.png',
  'hero-bowl.png',
  'mural.png',
  'wedding.jpg',
  'food-truck.jpg',
  'bowl-in-hand.jpg',
];
const { statSync } = await import('node:fs');
for (const name of outputs) {
  const meta = await sharp(img(name)).metadata();
  const kb = Math.round(statSync(img(name)).size / 1024);
  console.log(`${name.padEnd(18)} ${`${meta.width}x${meta.height}`.padEnd(12)} alpha:${String(meta.hasAlpha).padEnd(6)} ${kb}KB`);
}
