# Ichiban Pokedon — loveichiban.co.nz

Website for **Ichiban Pokedon**, a Japanese fast-casual restaurant (poke & donburi) at The Historic Village, Tauranga, New Zealand.

## Tech stack

- [Astro 7](https://astro.build) — static output, no client framework
- Plain CSS with design tokens in `src/styles/global.css` (page styles are scoped `<style>` blocks)
- `@fontsource-variable/inter` — self-hosted Inter variable font
- `@astrojs/sitemap` — sitemap at `/sitemap-index.xml`
- Netlify — deploys `master` from GitHub (`devesesam/loveichiban-new`), Netlify Forms for the contact + catering forms

## Commands

| Command | What it does |
| --- | --- |
| `npm run dev` | Dev server at `localhost:4321` |
| `npm run build` | Fetches Google reviews (`prebuild`), then builds to `dist/` |
| `npm run preview` | Serves the built `dist/` locally |
| `node execution/recompress_images.mjs` | Recompress images in `src/assets/images/` (backs up originals to `.tmp/image-backups/`) |
| `node execution/generate_favicons.mjs` | Regenerate favicon set + `og-image.jpg` from the logo/hero |

## Editing content (no code knowledge needed beyond the file)

All business content lives in `src/data/`:

- **`src/data/site.ts`** — phone, email, address, socials, **opening hours**, nav. Hours are currently empty (the site shows "call us for current hours"); fill the `hours` array when confirmed.
- **`src/data/menu.ts`** — the entire menu. Items without a `price`/`prices` render with no price (Breakfast/Sides/Extras are awaiting prices).
- **`src/data/reviews.json`** — Google reviews fallback; overwritten at build time when the API key is configured (see below).

Page images are imported at the top of `src/pages/index.astro` and `src/pages/catering.astro` with `PLACEHOLDER` comments — swap the import paths when new photography arrives, then run the recompress script.

## Google Reviews pipeline

`scripts/fetch-reviews.mjs` runs before every build and writes `src/data/reviews.json` (rating, review count, up to 5 reviews). It **never fails a build** — with no key it warns and keeps the committed JSON, and the homepage shows a "read our reviews on Google" link instead of review cards.

Setup (once):

1. In Google Cloud console, create an API key restricted to **Places API (New)**.
2. Add `GOOGLE_PLACES_API_KEY` to Netlify → Site settings → Environment variables.
3. Find the business's Place ID via the [Place ID Finder](https://developers.google.com/maps/documentation/places/web-service/place-id) (search "Ichiban The Historic Village Tauranga") and set it as `GOOGLE_PLACE_ID` (env var) or hardcode it in the script.

Reviews refresh whenever the site rebuilds. For automatic freshness, create a Netlify Build Hook and trigger it weekly (e.g. a scheduled GitHub Action that `curl -X POST`s the hook URL).

## Netlify Forms + Resend notifications

The contact (`name="contact"`) and catering (`name="catering"`) forms use Netlify Forms — no backend. Every submission is stored in the Netlify → Forms dashboard. Notes:

- **Form detection must be enabled** in Netlify → Forms before the first deploy that includes the forms.
- Forms only work on Netlify-served deploys (deploy previews included) — not `npm run preview`.

Notification emails are sent by `netlify/functions/submission-created.mjs` (Netlify runs it automatically on each submission) via **Resend**, from the verified `streamlineai.co.nz` domain, with Reply-To set to the customer's email. Config via Netlify env vars:

| Var | Purpose | Default |
| --- | --- | --- |
| `RESEND_API_KEY` | required — function skips silently without it | — |
| `NOTIFY_EMAIL` | who receives submissions | `talktoichiban@hotmail.com` |
| `RESEND_FROM` | sender identity | `Ichiban Website <ichiban@streamlineai.co.nz>` |

A Resend failure never loses an enquiry — it's always in the Forms dashboard. Netlify's built-in email notification (Forms → Notifications) can be enabled as a belt-and-braces backup; it sends from `formresponses@netlify.com`.

## Deploy

Push to `master` → Netlify builds (`npm run build`, Node 22) and publishes `dist/`. Redirects and cache headers live in `netlify.toml`.
