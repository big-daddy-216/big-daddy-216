# Site photos & video

All photos and video on **bigdaddyand.co** live here as ordinary files, so they
are easy to swap without touching the site's code.

```
assets/
├── photos/                     ← live / venue shots
│   ├── arena-keys.jpg          ← Hero background  +  "Sold-out arena" highlight
│   ├── shred-shed-full.jpg     ← "The Shred Shed · where it started" highlight
│   └── shred-shed-wide.jpg     ← spare — not on the page right now
├── posters/                    ← band-member posters (portrait)
│   ├── tim-keyboard-commando.jpg   ← Tim Nash (Keys)
│   ├── dylan-bass-legend.jpg       ← Dylan Merriman (Bass)
│   ├── dirty-mike.jpg              ← Dirty Mike (Guitar)
│   └── tyler-on-the-drums.jpg      ← Tyler (Drums)
└── video/                       ← the "Chasing Big Daddy" music video
    ├── chasing-big-daddy-banner.mp4  ← 10s full-width looping banner
    ├── chasing-big-daddy-teaser.mp4  ← 4s clip in the Live & Loud grid
    └── *-poster.jpg                  ← the still each clip shows while it loads
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
  memberTimNash:       "assets/posters/tim-keyboard-commando.jpg",
  memberDylanMerriman: "assets/posters/dylan-bass-legend.jpg",
  memberDirtyMike:     "assets/posters/dirty-mike.jpg",
  memberTyler:         "assets/posters/tyler-on-the-drums.jpg",
};
```

> Tyler used to render as a "WANTED — drummer" placeholder. Dropping
> `tyler-on-the-drums.jpg` into `posters/` and adding the `memberTyler` line
> above promoted him to a full member — a live example of the workflow below.

## The video (`assets/video/`)

Two clips from the *Chasing Big Daddy* music video, listed in their own
**`SITE VIDEO MAP`** (`window.BD_VIDEOS`) right below the photo map in
`index.html`:

```js
window.BD_VIDEOS = {
  banner:       "assets/video/chasing-big-daddy-banner.mp4",   // full-width loop
  bannerPoster: "assets/video/chasing-big-daddy-banner-poster.jpg",
  teaser:       "assets/video/chasing-big-daddy-teaser.mp4",   // Live & Loud tile
  teaserPoster: "assets/video/chasing-big-daddy-teaser-poster.jpg",
  kicker:       "Official Music Video",   // words on the banner
  title:        "Chasing Big Daddy",
  teaserCap:    "From the video · Chasing Big Daddy",
};
```

- **The banner** sits under the awards strip and loops **silently**. Clicking it
  (or the "Tap for Sound" button) turns the sound on; scrolling past it turns the
  sound back off.
- **The teaser tile** loops silently in the *Live & Loud* grid and opens a
  full-screen player — with sound and normal video controls — when clicked.
- Both clips **only download once they scroll into view**, and neither auto-plays
  for visitors whose system asks for reduced motion. That keeps the banner's file
  size off the first page load.
- The `*-poster.jpg` stills are the first frame of each clip; they show while the
  video loads. If you swap a clip, grab a fresh still or the old one will flash
  first.
- Square-ish source video works well: the banner crops to a wide strip from the
  middle of the frame.

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
- **Video:** the banner is silent until clicked; the *Live & Loud* clip opens a
  full-screen player. Both pause when they scroll out of view.
- **Mobile:** layout scales down (single-column highlights, 2-up posters,
  condensed tour rows, resized hero logo). The rules live in the `bd-enhance`
  `<style>` block in `index.html`.
