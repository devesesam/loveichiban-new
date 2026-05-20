// Recompress source images in src/assets/images/ to web-friendly sizes.
// Originals are copied to .tmp/image-backups/ before any file is touched.
// Re-run-safe: if a backup already exists, the existing backup is preserved
// and the original (from backup) is used as the recompression source so
// quality doesn't degrade across runs.
//
// Usage: node execution/recompress_images.mjs

import sharp from 'sharp';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const SRC_DIR = path.join(ROOT, 'src', 'assets', 'images');
const BACKUP_DIR = path.join(ROOT, '.tmp', 'image-backups');

// Per-file targets. width = max dimension (height auto); quality 0-100.
// special: "png-to-jpg" converts about-team.png to about-team.jpg and removes the .png.
const TARGETS = {
  'about-team.png': { width: 1200, quality: 80, convertTo: 'jpg' },
  'hero.jpg':       { width: 1920, quality: 75 },
  'catering.jpg':   { width: 1200, quality: 75 },
  'poke-bowl.jpg':  { width: 1200, quality: 75 },
  'gallery-1.jpg':  { width: 1200, quality: 75 },
  'gallery-2.jpg':  { width: 1200, quality: 75 },
  'gallery-3.jpg':  { width: 1200, quality: 75 },
  'gallery-4.jpg':  { width: 1200, quality: 75 },
  'shop.jpg':       { width: 1200, quality: 75 },
};

async function ensureDir(dir) {
  await fs.mkdir(dir, { recursive: true });
}

async function fileExists(p) {
  try { await fs.access(p); return true; } catch { return false; }
}

function fmtKB(bytes) {
  return `${(bytes / 1024).toFixed(0)} KB`;
}

async function processFile(filename, target) {
  const srcPath = path.join(SRC_DIR, filename);
  const backupPath = path.join(BACKUP_DIR, filename);

  if (!(await fileExists(srcPath)) && !(await fileExists(backupPath))) {
    console.log(`SKIP ${filename} — not found`);
    return;
  }

  // Back up original (idempotent — first run wins).
  if (!(await fileExists(backupPath))) {
    await fs.copyFile(srcPath, backupPath);
  }

  // Always recompress from the backup so re-runs don't compound quality loss.
  const inputPath = backupPath;
  const beforeBytes = (await fs.stat(srcPath).catch(() => ({ size: 0 }))).size;
  const backupBytes = (await fs.stat(backupPath)).size;

  let pipeline = sharp(inputPath).resize({ width: target.width, withoutEnlargement: true });

  let outputPath = srcPath;
  if (target.convertTo === 'jpg') {
    pipeline = pipeline.jpeg({ quality: target.quality, mozjpeg: true });
    outputPath = path.join(SRC_DIR, filename.replace(/\.png$/i, '.jpg'));
  } else if (filename.toLowerCase().endsWith('.jpg') || filename.toLowerCase().endsWith('.jpeg')) {
    pipeline = pipeline.jpeg({ quality: target.quality, mozjpeg: true });
  } else if (filename.toLowerCase().endsWith('.png')) {
    pipeline = pipeline.png({ quality: target.quality, compressionLevel: 9 });
  }

  await pipeline.toFile(outputPath + '.tmp');
  await fs.rename(outputPath + '.tmp', outputPath);

  // If we converted png → jpg, remove the original .png from src (backup keeps it).
  if (target.convertTo === 'jpg' && outputPath !== srcPath) {
    await fs.unlink(srcPath);
  }

  const afterBytes = (await fs.stat(outputPath)).size;
  const orig = backupBytes;
  const pct = ((1 - afterBytes / orig) * 100).toFixed(0);
  console.log(
    `OK   ${filename.padEnd(20)} ${fmtKB(orig).padStart(8)} → ${fmtKB(afterBytes).padStart(8)} (-${pct}%)` +
    (target.convertTo ? `  [→ ${path.basename(outputPath)}]` : '')
  );
}

async function main() {
  await ensureDir(BACKUP_DIR);
  console.log(`Backups: ${BACKUP_DIR}\n`);

  for (const [filename, target] of Object.entries(TARGETS)) {
    try {
      await processFile(filename, target);
    } catch (err) {
      console.error(`FAIL ${filename}: ${err.message}`);
    }
  }
  console.log('\nDone.');
}

main();
