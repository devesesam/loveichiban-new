/**
 * Fetches the Google rating + reviews for Ichiban at build time and writes
 * src/data/reviews.json for the ReviewsSection component.
 *
 * Runs automatically via the "prebuild" npm script. Designed to NEVER break a
 * build: if the API key is missing or the request fails, it warns and exits 0,
 * leaving the committed reviews.json in place.
 *
 * Setup:
 *   1. Google Cloud console → create an API key restricted to "Places API (New)".
 *   2. Set GOOGLE_PLACES_API_KEY in Netlify env vars (and a local .env if wanted).
 *   3. Find the Place ID once via https://developers.google.com/maps/documentation/places/web-service/place-id
 *      (search "Ichiban The Historic Village Tauranga") and set it below or via
 *      GOOGLE_PLACE_ID.
 *
 * Notes: Places API (New) returns at most 5 reviews, chosen by Google. One call
 * per build — cost is negligible. Reviews must be attributed to Google in the UI.
 */

import { writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

// PLACEHOLDER: set the real Place ID here once looked up (see header comment).
const PLACE_ID = process.env.GOOGLE_PLACE_ID ?? '';
const API_KEY = process.env.GOOGLE_PLACES_API_KEY;

const OUT_FILE = fileURLToPath(new URL('../src/data/reviews.json', import.meta.url));
const MAX_TEXT_LENGTH = 280;
const MIN_RATING = 4;

function truncate(text) {
  if (text.length <= MAX_TEXT_LENGTH) return text;
  return `${text.slice(0, MAX_TEXT_LENGTH).replace(/\s+\S*$/, '')}…`;
}

async function main() {
  if (!API_KEY) {
    console.warn('[fetch-reviews] GOOGLE_PLACES_API_KEY not set — keeping committed reviews.json');
    return;
  }

  if (!PLACE_ID) {
    console.warn('[fetch-reviews] Place ID not set — keeping committed reviews.json');
    return;
  }

  const url = `https://places.googleapis.com/v1/places/${PLACE_ID}`;
  const response = await fetch(url, {
    headers: {
      'X-Goog-Api-Key': API_KEY,
      'X-Goog-FieldMask': 'rating,userRatingCount,reviews',
    },
  });

  if (!response.ok) {
    throw new Error(`Places API responded ${response.status}: ${await response.text()}`);
  }

  const data = await response.json();

  if (typeof data.rating !== 'number' || !Array.isArray(data.reviews)) {
    throw new Error(`Unexpected Places API response shape: ${JSON.stringify(data).slice(0, 300)}`);
  }

  const reviews = data.reviews
    .filter((r) => (r.rating ?? 0) >= MIN_RATING && r.text?.text)
    .map((r) => ({
      author: r.authorAttribution?.displayName ?? 'Google user',
      rating: r.rating,
      text: truncate(r.text.text.trim()),
      relativeTime: r.relativePublishTimeDescription ?? '',
    }));

  const out = {
    placeholder: false,
    rating: data.rating,
    userRatingCount: data.userRatingCount ?? null,
    fetchedAt: new Date().toISOString(),
    reviews,
  };

  await writeFile(OUT_FILE, `${JSON.stringify(out, null, 2)}\n`, 'utf8');
  console.log(
    `[fetch-reviews] Wrote ${reviews.length} reviews (rating ${data.rating}, ${data.userRatingCount} total) to src/data/reviews.json`
  );
}

main().catch((error) => {
  console.warn(`[fetch-reviews] Failed (${error.message}) — keeping committed reviews.json`);
});
