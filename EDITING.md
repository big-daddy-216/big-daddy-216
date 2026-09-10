# Editing the site

Everything that shows up on **bigdaddyand.co** is now plain, editable text — no
bundles, no encoding. This guide says exactly which file to open for each change.

## The big picture

```
index.html              ← the page itself: all the words live here
assets/
  css/  site.css         ← colors, fonts, type scale (the "design system")
        enhance.css      ← responsive tweaks + tap-to-enlarge lightbox
  fonts/ *.woff2         ← the 4 type families, as real font files
  js/   react…, babel…   ← libraries (don't touch)
        design-system.js ← reusable pieces: buttons, cards, posters, album tiles
        lightbox.js      ← photo enlarge behavior
  photos/ posters/ brand/ ← all images (see assets/README.md)
  video/  *.mp4          ← the "Chasing Big Daddy" clips + their poster stills
```

To preview locally: either **double-click `index.html`**, or run a tiny server
from this folder — `python -m http.server 8217` — and open
`http://localhost:8217`. (A server matches how GitHub Pages serves it.)

## Changing text — open `index.html`

All the copy is in two clearly-labelled `<script type="text/babel">` blocks near
the bottom of `index.html`. Find the bit you want and edit the words in quotes.

| You want to change… | Find this in `index.html` |
|---|---|
| Top nav links | `const NAV_LINKS = [ … ]` |
| Hero headline stamps ("World Tour 2026") | the `<Stamp>` lines in `Hero` |
| Hero paragraph | the `<p>` inside `Hero` |
| Awards strip | `const awards = [ … ]` in `AwardsStrip` |
| "Live & Loud" photo captions | `const shots = [ … ]` in `Highlights` |
| Albums / discography | `const ALBUMS = [ … ]` |
| Music-video files & banner wording | `window.BD_VIDEOS = { … }` (top of the file) |
| Band members (name, nickname, instrument) | `const MEMBERS = [ … ]` |
| **Tour dates** | `const TOUR = [ … ]` |
| Booking blurb + form labels | the `Booking` function |
| Footer links, email, copyright | the `Footer` function |

### Example — add a tour date
Find `const TOUR = [` and add a line in the same shape as the others:

```js
{ year: 2026, month: 'NOV', day: '01', city: 'Austin, TX', venue: 'Stubbs', status: 'onsale' },
```

`status` is one of `'soldout'`, `'lowtix'`, or `'onsale'` (controls the ticket badge).

**Dates take care of themselves.** Every row carries a `year`, and any show whose
date has passed is drawn automatically as a struck-out "Played" row with no
tickets link. The section kicker (`SEP – OCT 2026`) and the "N Shows Left" stamp
are counted from whatever is still upcoming — so the schedule stays current on
its own. Leave played shows in the list; they read as tour history.

## The music video
The two clips live in `assets/video/` and are wired up through the **SITE VIDEO
MAP** (`window.BD_VIDEOS`) at the top of `index.html` — same idea as the photo
map. The banner loops silently under the awards strip until someone clicks it for
sound; the short clip in *Live & Loud* opens a full-screen player. Details and
swap instructions: [`assets/README.md`](assets/README.md).

## Changing photos
See [`assets/README.md`](assets/README.md). Short version: drop a new image into
`assets/photos/` or `assets/posters/` using the **same filename**, and it swaps in
automatically. To repoint a slot at a different filename, edit the **SITE PHOTO
MAP** (`window.BD_IMAGES`) at the top of `index.html`.

## Changing colors, fonts, spacing
Open `assets/css/site.css`. The top of the file is a set of named values (CSS
variables) like `--ember-500` (the orange accent) and `--font-display`. Change a
value once and it updates everywhere it's used.

## How the page is built (for reference)
The page is a small React app. `index.html` loads React + an in-browser compiler
(Babel), then the design-system components, then the two content blocks, then a
short `App` that stacks the sections. Because compiling happens in the browser,
there's **no build step** — edit, save, reload. (If the site ever feels slow to
start, the libraries in `assets/js/` could be swapped for CDN links or the JSX
pre-compiled, but neither is required.)
