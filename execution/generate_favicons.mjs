/**
 * One-off asset generator: favicon set + default og-image.
 *
 *   node execution/generate_favicons.mjs
 *
 * Inputs:  src/assets/images/logo.png, src/assets/images/hero.jpg
 * Outputs: public/favicon.ico (32px PNG-in-ICO fallback: browsers accept PNG data),
 *          public/favicon.png (96px), public/apple-touch-icon.png (180px),
 *          public/icon-192.png, public/icon-512.png, public/site.webmanifest,
 *          public/og-image.jpg (1200×630 crop of the hero — replace with Diego's
 *          shot when supplied).
 */

import sharp from 'sharp';
import { writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const root = (p) => fileURLToPath(new URL(`../${p}`, import.meta.url));

const logo = root('src/assets/images/logo.png');
const hero = root('src/assets/images/hero.jpg');

// PNG resized outputs
const targets = [
  { file: 'public/favicon.png', size: 96 },
  { file: 'public/apple-touch-icon.png', size: 180 },
  { file: 'public/icon-192.png', size: 192 },
  { file: 'public/icon-512.png', size: 512 },
];

for (const { file, size } of targets) {
  await sharp(logo)
    .resize(size, size, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 0 } })
    .png({ compressionLevel: 9 })
    .toFile(root(file));
  console.log(`✓ ${file} (${size}px)`);
}

// .ico — single 32px PNG wrapped in an ICO container
const png32 = await sharp(logo)
  .resize(32, 32, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 0 } })
  .png({ compressionLevel: 9 })
  .toBuffer();

const icoHeader = Buffer.alloc(6);
icoHeader.writeUInt16LE(0, 0); // reserved
icoHeader.writeUInt16LE(1, 2); // type: icon
icoHeader.writeUInt16LE(1, 4); // count

const icoEntry = Buffer.alloc(16);
icoEntry.writeUInt8(32, 0); // width
icoEntry.writeUInt8(32, 1); // height
icoEntry.writeUInt8(0, 2); // palette
icoEntry.writeUInt8(0, 3); // reserved
icoEntry.writeUInt16LE(1, 4); // color planes
icoEntry.writeUInt16LE(32, 6); // bits per pixel
icoEntry.writeUInt32LE(png32.length, 8); // size
icoEntry.writeUInt32LE(22, 12); // offset

await writeFile(root('public/favicon.ico'), Buffer.concat([icoHeader, icoEntry, png32]));
console.log('✓ public/favicon.ico (32px)');

// Web manifest
const manifest = {
  name: 'Ichiban Pokedon',
  short_name: 'Ichiban',
  icons: [
    { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
    { src: '/icon-512.png', sizes: '512x512', type: 'image/png' },
  ],
  theme_color: '#ffffff',
  background_color: '#ffffff',
  display: 'browser',
};
await writeFile(root('public/site.webmanifest'), `${JSON.stringify(manifest, null, 2)}\n`);
console.log('✓ public/site.webmanifest');

// Default og-image — 1200×630 center crop of the hero
await sharp(hero)
  .resize(1200, 630, { fit: 'cover', position: 'attention' })
  .jpeg({ quality: 80, mozjpeg: true })
  .toFile(root('public/og-image.jpg'));
console.log('✓ public/og-image.jpg (1200×630)');
