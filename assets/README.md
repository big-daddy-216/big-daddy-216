# Site photos

All photos on **bigdaddyand.co** live here as ordinary image files, so they are
easy to swap without touching the site's code.

```
assets/
├── photos/                     ← live / venue shots
│   ├── arena-keys.jpg          ← Hero background  +  "Sold-out arena" highlight
│   ├── shred-shed-full.jpg     ← "The Shred Shed · where it started" highlight
│   └── shred-shed-wide.jpg     ← "Basement floor · stars & stripes" highlight
└── posters/                    ← band-member posters (portrait)
    ├── tim-keyboard-commando.jpg   ← Tim Nash (Keys)
    ├── dylan-bass-legend.jpg       ← Dylan Merriman (Bass)
    ├── dirty-mike.jpg              ← Dirty Mike (Guitar)
    └── tyler-on-the-drums.jpg      ← Tyler (Drums)
```

> `arena-keys.jpg` is used in **two** places — the hero background and the tall
> "Sold-out arena" highlight tile. Change the file and both update together.

## How to update a photo

**The easy way — keep the same slot:**
Replace the file in `assets/` with a new image **using the exact same filename**,
then commit. That's it — nothing else to edit.

- Same shape works best: the `photos/` shots are landscape-ish, the `posters/`
  are tall portraits. Match the orientation so the crop looks right.
- Keep files reasonably sized (these are ~200 KB–1 MB). Very large files just
  make the page slower to load.

**Point a slot at a differently-named file (optional):**
Open [`../index.html`](../index.html) and find the **`SITE PHOTO MAP`** block near
the top (a short `window.BD_IMAGES = { … }` list). Each line maps a slot on the
page to a file under `assets/`. Change a path there to repoint a slot — no other
edits, no rebuild needed.

```js
window.BD_IMAGES = {
  heroBackground:      "assets/photos/arena-keys.jpg",
  highlightArena:      "assets/photos/arena-keys.jpg",
  highlightShredShed:  "assets/photos/shred-shed-full.jpg",
  highlightBasement:   "assets/photos/shred-shed-wide.jpg",
  memberTimNash:       "assets/posters/tim-keyboard-commando.jpg",
  memberDylanMerriman: "assets/posters/dylan-bass-legend.jpg",
  memberDirtyMike:     "assets/posters/dirty-mike.jpg",
  memberTyler:         "assets/posters/tyler-on-the-drums.jpg",
};
```

> Tyler used to render as a "WANTED — drummer" placeholder. Dropping
> `tyler-on-the-drums.jpg` into `posters/` and adding the `memberTyler` line
> above promoted him to a full member — a live example of the workflow below.

## Adding a brand-new photo slot

1. Drop the image in `assets/photos/` or `assets/posters/`.
2. Add a key for it to the `SITE PHOTO MAP` in `index.html`.
3. Reference it from the relevant component as `window.BD_IMAGES.<yourKey>`.

(Steps 1–2 alone cover swapping existing photos; step 3 is only for new slots.)

## Brand assets (`assets/brand/`)

The Big Daddy catfish brand kit — logos, icons, and social card — lives in
`assets/brand/`. These are wired into the site:

- **`big-daddy-wordmark.svg`** — header logo (nav) and footer lockup.
- **`big-daddy-logo-badge.svg`** — circular tour stamp shown in **The Big Tour** section.
- **favicon / icons / `site.webmanifest`** — tab icon + "add to home screen" (PWA),
  linked from the `<head>` of `index.html`.
- **`big-daddy-og-banner.png`** — the image shown when the site is shared on
  social media (Open Graph / Twitter card).

To restyle the header or tour badge, swap the matching SVG in `assets/brand/`
(same filename) — same drop-in workflow as the photos.

## Interactive / mobile notes

- **Tap to enlarge:** any photo in *Live & Loud* or *The Band* opens full-size in
  a lightbox (tap/click the backdrop or press Esc to close). Wired in the
  `bd-lightbox` block near the bottom of `index.html`.
- **Mobile:** layout scales down (single-column highlights, 2-up posters,
  condensed tour rows, resized hero logo). The rules live in the `bd-enhance`
  `<style>` block in `index.html`.
