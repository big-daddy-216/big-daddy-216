# Editing the site

Everything that shows up on **bigdaddyand.co** is now plain, editable text — no
bundles, no encoding. This guide says exactly which file to open for each change.

## The big picture

```
index.html              ← the home page: all the words live here
jam.html                ← "Join the Company — Jam With Us!" (the synth page)
assets/
  css/  site.css         ← colors, fonts, type scale (the "design system")
        enhance.css      ← responsive tweaks + tap-to-enlarge lightbox
        jam.css          ← styles used only by the jam page
  fonts/ *.woff2         ← the 4 type families, as real font files
  js/   react…, babel…   ← libraries (don't touch)
        design-system.js ← reusable pieces: buttons, cards, posters, album tiles
        lightbox.js      ← photo enlarge behavior
        jam-engine.js    ← the synth: sound, MIDI export, loop codes
  photos/ posters/ brand/ ← all images (see assets/README.md)
  video/  *.mp4          ← the "Chasing Big Daddy" clips + their poster stills
```

To preview locally: either **double-click `index.html`**, or run a tiny server
from this folder — `python -m http.server 8217` — and open
`http://localhost:8217`. (A server matches how GitHub Pages serves it.)

The jam page is at `http://localhost:8217/jam.html`. **Preview that one through
the server rather than by double-clicking it** — browsers apply tighter rules to
pages opened straight off the disk, and sending a loop won't work from a `file://`
page in any case, since the mail service won't accept a request from one.

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
| **Jam page words + settings** | `jam.html` (see [The jam page](#the-jam-page-join-the-company)) |

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

## The jam page ("Join the Company")

`jam.html` is a little synth and drum machine, written up as a (joking) careers
page: a visitor programs a one-bar loop, plays something over it, and submits it
to the band for review. It's linked from the **hero button on the home page**,
the top nav, and the footer's **Band** column.

### ⚠️ Switching sending on — the one thing left to do

Out of the box the page works, but **the Send button can't actually deliver
anything**, and it says so plainly rather than pretending. To turn it on:

1. Go to **[web3forms.com](https://web3forms.com)** and enter the band's email
   address. They'll email back an **access key** — a long string of letters and
   numbers. It's free (250 loops a month) and there's no account to create.
2. Open `jam.html`, find `window.BD_JAM` near the top, and paste the key in
   place of `PASTE-YOUR-WEB3FORMS-ACCESS-KEY-HERE`.
3. Save. Done.

That same block also holds `siteUrl` (where the "listen to this loop" link in
your email points — leave it as the live address) and `subject` (the subject
line on the mail you receive).

The access key is *meant* to be public — it only ever lets someone send mail
**to** you — so it's safe sitting in the page.

### How a loop actually reaches you

Free form services won't carry file attachments, so the loop travels as **text**
instead. Your email contains a link like
`https://bigdaddyand.co/jam.html#loop=vQFEAP__…`. Click it and the visitor's
exact loop opens on the page, ready to play, with a **Download .mid** button
right there. A busy loop is only about 40 characters, and the part after the `#`
is never sent to any server — it only ever travels in the email.

Visitors can always download their own `.mid` and copy their own link, whether
or not sending is switched on.

### Playing it from the computer keyboard

All 25 keys on screen can be played by typing, by treating your keyboard as
two little pianos stacked on each other:

```
upper octave    q 2 w 3 e r 5 t 6 y 7 u i
lower octave    z s x d c v g b h n j m , l . ; /
```

In each pair the flat row is the white notes and the row above holds their
sharps, sitting where the black keys would be. It's the layout trackers and
DAWs have used for decades. The rows overlap by five notes in the middle on
purpose, so you can play across the join without moving hands.

Space starts and stops; ◀ ▶ (or the arrow keys) shift the whole thing by an
octave. To change the mapping, edit `LOWER_ROW_KEYS` and `UPPER_ROW_KEYS` in
`jam.html` — the labels printed on the keys follow automatically.

On a phone or tablet the keyboard **splits in half**, stacking the two octaves
so every key is about twice as wide. That happens below 820px, in `jam.css`.

### Changing the words

All the copy is in the single `<script type="text/babel">` block in `jam.html`,
same idea as `index.html`:

| You want to change… | Find this in `jam.html` |
|---|---|
| The job posting (headline + pitch) | the `JamIntro` function |
| The stamps ("Fully remote", "216 born & raised"…) | the `<Stamp>` lines in `JamIntro` |
| "Step One / The Audition" blurb | the `Studio` function |
| "Step Two / Submit For Review" + form labels | the `SendPanel` function |
| The "Position Applying For" dropdown | `const INSTRUMENTS = [ … ]` |
| What the confirmation says after submitting | the `sent` branch in `SendPanel` |
| Footer + the equal-opportunity gag | the `JamFooter` function |
| Where the email goes / subject line | `window.BD_JAM` in the `<head>` |

The field names in the submitted form (`position_applying_for`, `cover_letter`,
`listen_to_the_loop`…) are what show up as the labels in the email you receive,
so rename those if you'd rather read something else.

### Changing the sound

`assets/js/jam-engine.js` holds everything that makes noise. It has no interface
code in it, so you can poke at it from the browser console — try `BDJam.playDrum('kick')`.

| You want to change… | Find this in `jam-engine.js` |
|---|---|
| The six drum lanes (or their MIDI notes) | `const LANES = [ … ]` |
| The three keyboard voices | `const VOICES = [ … ]` and the `build…` functions |
| Tempo range and default | `BPM_MIN`, `BPM_MAX`, `BPM_DEFAULT` |
| How the kick/snare/hat sound | `drumKick`, `drumSnare`, `drumHat`, … |

One rule if you edit the sound: never fade a volume to exactly `0` with
`exponentialRampToValueAtTime` — browsers throw an error. Fade to the tiny value
`EPS` and then set `0`, the way the existing code does.

### Layout and colors

`assets/css/jam.css` — only this page loads it, so nothing you change there can
affect the home page. It uses the same named colors and fonts from `site.css`.

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
