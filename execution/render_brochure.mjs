/**
 * Renders the catering brochure PDF to page images for the unlisted
 * /event-catering-guide-2026 page, and copies the PDF itself to public/.
 *
 *   node execution/render_brochure.mjs
 *
 * Re-run this whenever Diego supplies an updated brochure: drop the new PDF in
 * at SOURCE_PDF and run the script — the page component picks up whatever
 * pages exist.
 *
 * Inline PDF embedding is unreliable on phones (iOS Safari and Android Chrome
 * both mishandle it), and this page is reached by QR code at the food truck,
 * so the pages are served as plain images instead. The PDF stays available as
 * a download for anyone who wants the real file.
 */

import * as mupdf from 'mupdf';
import sharp from 'sharp';
import { readFileSync, writeFileSync, copyFileSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const root = (p) => fileURLToPath(new URL(`../${p}`, import.meta.url));

const SOURCE_PDF = root('.tmp/image-backups/ICHIBAN-Catering-Brochure-Final.pdf');
const PUBLIC_PDF = root('public/ichiban-catering-brochure-2026.pdf');
const TARGET_WIDTH = 1600; // plenty for a phone at 2x, and for desktop reading

const doc = mupdf.Document.openDocument(readFileSync(SOURCE_PDF), 'application/pdf');
const pageCount = doc.countPages();

for (let i = 0; i < pageCount; i++) {
  const page = doc.loadPage(i);
  const [, , widthPts] = page.getBounds();
  const scale = TARGET_WIDTH / widthPts;

  const pixmap = page.toPixmap(
    mupdf.Matrix.scale(scale, scale),
    mupdf.ColorSpace.DeviceRGB,
    false, // no alpha — brochure pages are opaque
    true
  );

  // Brochure pages mix photography with text, so JPEG at high quality keeps
  // the file small without visible artefacts on the type.
  const dest = root(`src/assets/images/brochure-${i + 1}.jpg`);
  await sharp(pixmap.asPNG()).jpeg({ quality: 90, mozjpeg: true }).toFile(dest);

  const meta = await sharp(dest).metadata();
  const kb = Math.round(statSync(dest).size / 1024);
  console.log(`brochure-${i + 1}.jpg  ${meta.width}x${meta.height}  ${kb}KB`);

  // First line or two of each page, to inform the alt text written by hand.
  const text = page.toStructuredText().asText().trim().split('\n').filter(Boolean);
  console.log(`   text: ${text.slice(0, 3).join(' / ').slice(0, 160) || '(no extractable text)'}`);
}

copyFileSync(SOURCE_PDF, PUBLIC_PDF);
console.log(`\nCopied PDF -> public/ (${Math.round(statSync(PUBLIC_PDF).size / 1024)}KB), ${pageCount} pages rendered`);
