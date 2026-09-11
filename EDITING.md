# Editing the site

Everything that shows up on **bigdaddyand.co** is now plain, editable text — no
bundles, no encoding. This guide says exactly which file to open for each change.

## The big picture

```
index.html              ← the home page: all the words live here
jam.html                ← "Join the Company — Jam With Us!" (synth + the board)
music.html              ← the records, played from the media bucket (+ the upload panel)
videos.html             ← the clips, played from the media bucket
assets/
  css/  site.css         ← colors, fonts, type scale (the "design system")
        enhance.css      ← responsive tweaks, lightbox, the top bar + mobile menu
        jam.css          ← styles used only by the jam page
        media.css        ← styles for the music and video pages
  data/ catalog.js       ← the hand-edited song/video list (uploads go in the database)
  fonts/ *.woff2         ← the 4 type families, as real font files
  js/   react…, babel…   ← libraries (don't touch)
        design-system.js ← reusable pieces: buttons, cards, posters, album tiles
        site-nav.js      ← the top bar, shared by every page
        catalog.js       ← the library: reads /api/media + catalog.js, sends uploads
        lightbox.js      ← photo enlarge behavior
        jam-engine.js    ← the synth: sound, MIDI export, loop codes
  photos/ posters/ brand/ ← all images (see assets/README.md)

functions/              ← the back end: the board + the music library (Pages Functions)
migrations/             ← the database tables
scripts/d1.mjs          ← migrations + moderation, from your own machine
scripts/upload-song.mjs ← put a song up from your own machine
wrangler.toml           ← which database and bucket to use
```

The words on the pages are still just words in the HTML. `functions/` and
`migrations/` are the only genuinely new machinery; they matter to the jam
board and to putting songs up.

To preview locally: either **double-click `index.html`**, or run a tiny server
from this folder — `python -m http.server 8217` — and open
`http://localhost:8217`. (A server matches how GitHub Pages serves it.)

The jam page is at `http://localhost:8217/jam.html`. **Preview that one through
the server rather than by double-clicking it** — browsers apply tighter rules to
pages opened straight off the disk, and the microphone won't work at all from a
`file://` page.

**The board won't work locally**, and it says so rather than looking broken: it
needs the back end, which only exists on the deployed site. Everything else —
the studio, the keyboard, the grid, downloading a `.mid` — works fine against
the little Python server. To try the board itself, push to a branch and use the
preview address Cloudflare builds for it.

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
page: a visitor builds a two-bar loop, records riffs over it, and submits the
result to the band for review. It's linked from the **hero button on the home
page**, the top nav, and the footer's **Band** column.

What's in it:

- **One bar (16 steps) by default, two bars (32) on request.** A `1 Bar / 2 Bars`
  toggle in the transport. Going longer keeps everything; going shorter asks
  first if there's anything in the back half. Six drum lanes, plus a lane for a
  recorded sample.
- **Four keyboard layers**, each with its own voice, mute, solo and clear.
  Record a riff, let it loop, then riff over it on the next layer. The selected
  layer (the highlighted card) is the one the keyboard plays and records into.
- **Five voices**: Rock Organ, Fuzz Bass, E-Piano, Synth and Choir.
- **Copy, paste and Double It** for building a full beat without programming
  every step by hand.
- **A microphone sample pad** — see below.

### The jam board — where loops go now

> **Not switched on yet?** The board needs a one-time Cloudflare setup —
> see [`SETUP-CLOUDFLARE.md`](SETUP-CLOUDFLARE.md). Until that's done the page
> works exactly as it always has and the board says it can't be reached.

Underneath the studio there's a **board**: everyone's published loops, newest
first. Anyone with the link can listen. Putting something up needs **the band
word** — one shared passphrase you hand out to whoever you want posting. It's
typed once and the browser remembers it.

The rule that shapes the whole thing: **a published jam is never edited.**
Tapping *"Jam on this"* loads somebody's loop into the studio and remembers
whose it was; publishing then posts a *new* jam that points back at theirs.
Nothing anyone does can change what you put up. That's enforced in the database
itself, not just in the page, so it stays true even if something goes wrong
elsewhere.

Each poster gets a **withdrawal token** once, at the moment they publish. It's
the only way to take a jam down, and the browser that posted it keeps a copy so
a *Withdraw* button shows up on your own cards. Withdrawing hides the jam but
keeps the row — anything other people built on it stays standing.

**To take something down yourself**, from this folder:

```bash
npm run jams
```

That lists the most recent jams with their ids. Then:

```bash
node scripts/d1.mjs hide abc123def456
```

(`node scripts/d1.mjs unhide <id>` puts it back. The Cloudflare dashboard's D1
console does the same job if you'd rather click.)

`'hidden'` means the band took it down; `'removed'` means the poster did. The
page words the two differently. Either way the row stays, so anything other
people built on it keeps working.

### Sending a loop straight to the band

The old *Submit For Review* form is still there, below the board, for anyone who
wants to send you something privately rather than post it publicly. It goes
through Formspree, and **that account's free tier is 50 submissions a month
across every form you own — including the Tevis Engineering Solutions contact
forms.** That's exactly why the board doesn't use it: a jam page that gets
passed around would quietly eat the quota a paying business depends on.

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

### The microphone sample pad

Visitors can record up to four seconds with their own microphone and lay it
into the grid, or play it pitched across the keyboard.

Once there's a recording, an **editor** opens under it: the waveform, with
draggable ends to cut it down to the part that matters, and controls for
pitch, low-pass, high-pass, resonance, drive, echo, volume and reverse. All of
it is live in the loop the moment it's touched, and none of it changes the
recording underneath — **Reset** puts everything back. **Set as cue** bakes the
cut and the effects into a fresh recording (rendered offline as a 32 kHz mono
WAV, which keeps four seconds under the board's 400 KB upload cap). Publishing
with unsaved edits bakes them first, so what the board hears is what the
visitor heard.

Every keyboard layer has a **volume slider**. Layers start at 60% because the
synth voices run a good deal hotter than the drums. The setting travels in the
loop code (format 3); loops published before it existed open at the default.

Two things are true of it, and the page says both out loud:

- **The mic is only ever opened by pressing the record button**, never on page
  load, and the stream is stopped the moment recording ends so the browser's
  recording indicator goes out.
- **The audio stays on the visitor's device unless they publish it.** It is
  never in the loop link and can't be in the `.mid` — a MIDI file stores notes,
  not sound — so nothing travels by accident. The one way it leaves is a
  deliberate publish to the board with *"include my recording"* ticked, and the
  box says in plain words that it gets uploaded and becomes public. Untick it
  and only the notes and drums go up.

> This used to read "the audio never leaves the visitor's device", which was
> true before the board existed. If you ever change how samples work, change
> that sentence in the same commit — a false promise about a microphone is
> worse than no promise at all. It appears in three places: here,
> `jam.html` (the sample pad's note), and the comment at the top of the sample
> section in `assets/js/jam-engine.js`.

**Recordings are converted to WAV before upload.** Browsers record in formats
they don't all agree on — Chrome and Firefox produce WebM/Opus, which Safari
cannot play back at all. Without the conversion, a sample recorded on a laptop
would be silent on every iPhone with nothing to explain why.

If the mic is blocked, missing, or the browser is too old, the pad says which
of those it was instead of failing quietly. Those messages live in
`MIC_MESSAGES` in `jam.html`.

### Changing the sound

`assets/js/jam-engine.js` holds everything that makes noise. It has no interface
code in it, so you can poke at it from the browser console — try `BDJam.playDrum('kick')`.

| You want to change… | Find this in `jam-engine.js` |
|---|---|
| The six drum lanes (or their MIDI notes) | `var LANES = [ … ]` |
| The five keyboard voices | `var VOICES = [ … ]` and the `build…` functions |
| Which loop lengths are offered, and the default | `var LENGTHS`, `STEPS_DEFAULT` |
| How many layers | `var MAX_LAYERS` |
| Tempo range and default | `BPM_MIN`, `BPM_MAX`, `BPM_DEFAULT` |
| How the kick/snare/hat sound | `drumKick`, `drumSnare`, `drumHat`, … |
| How long a sample can be | `MAX_SAMPLE_SECONDS` |

Each loop carries its own length, so 16- and 32-step loops share links, the
`.mid` export, and the jam board without any conversion. Only 16 and 32 are
valid: the shared code stores the step count in one byte and the grid assumes
whole bars, so adding a length means adding it to `LENGTHS` *and* to the checks
in `patternSteps` / `changeLength`.

Changing `MAX_LAYERS` changes the shared loop code too. That's fine — the code
carries a version number, and older links keep working: a link made before the
layers existed still opens as a one-bar loop with its notes on layer one.

One rule if you edit the sound: never fade a volume to exactly `0` with
`exponentialRampToValueAtTime` — browsers throw an error. Fade to the tiny value
`EPS` and then set `0`, the way the existing code does.

### Layout and colors

`assets/css/jam.css` — only this page loads it, so nothing you change there can
affect the home page. It uses the same named colors and fonts from `site.css`.

## Putting music and videos up

The actual audio and video live in the Cloudflare R2 bucket rather than in this
repository, because git is a bad place to keep hundred-megabyte files. The
list of what's there lives in the database, and the pages read it from
`/api/media`.

### To add a song — from the site

1. Open **bigdaddyand.co/music.html** and scroll to the bottom:
   *"Got the band word? Put a song up."*
2. Pick the file (MP3, M4A, WAV, OGG or FLAC — straight off a phone is fine).
   The title fills in from the filename and the length is measured before
   anything is sent; change whatever you like.
3. Album is optional. Songs with the same album name are grouped together and
   share artwork, so give the artwork once and every later song on that
   record picks it up. Leave it blank for a single.
4. Type the band word — the same one the jam board uses — and press
   **Put it up**. The bar fills, and the song is on the page for everyone.

The word is remembered by that browser for 90 days, same as on the jam page,
so the second song is just a file and a title.

> Anyone who has the band word can do this, not only you. That's the trade
> for having one word instead of two. If the word ever gets around further
> than you'd like, change it (`npm run secret:hash`, then update
> `JAM_PASSPHRASE_HASH` in Pages → Settings) and everyone signs in again.

### To add a song — from this machine

No browser and no band word; it uses `ADMIN_TOKEN` from `.dev.vars`:

```bash
npm run song -- "C:\path\to\4 Minute Clinic.m4a"
```

Title defaults to the filename. Add `--title`, `--album`, `--year`, `--blurb`,
`--credits` or `--cover art.jpg` as needed. The length is read out of the
file's own header.

### To see what's up, or take something down

```bash
npm run songs                                # everything, with slugs
node scripts/d1.mjs hide-song 4-minute-clinic
node scripts/d1.mjs unhide-song 4-minute-clinic
```

Hiding takes it off the page; the file stays in the bucket, so unhiding is
instant. A typo in a title is a one-line fix in the D1 console:
`UPDATE media SET title = 'Right Name' WHERE slug = '…'`.

Uploads land in the bucket under `music/<album>/<song>.<ext>`; artwork under
`music/covers/`. Songs with the same title get `-2`, `-3` — nothing is ever
overwritten.

### The square where the artwork would be

A record with no artwork — *Singles*, for one — shows a clip looping
silently in the square instead, like a gif. Which clip is set at the top of
`music.html` in `window.BD_MUSIC.artFallback`; set `loop` to `null` for a
plain tile with the album name on it. It only plays while it's on screen,
and people who've asked their system for reduced motion get the still.

### The hand-edited list still works

`assets/data/catalog.js` is read too, and merged with the database (the
database wins if both have the same `slug`). It's how the two videos are
listed today, and it's there for anything you'd rather wire up by hand:

1. Upload the file in the Cloudflare dashboard: **R2 → `bigdaddy-media` →
   Upload**, into a folder like `music/pretzel-sunday/`.
2. Add a block to `tracks` (or `videos`), copying the commented-out example.
   `src` is the **key inside the bucket**, not a full web address — the page
   adds the address part. Anything starting with `assets/` is served from the
   repo instead, which is how album art in `assets/albums/` works.
3. **For a video, always set a `poster`** — a still image — or the tile is a
   black rectangle until somebody presses play.
4. Save and push.

`sort_order` controls the running order; bigger numbers come first. Uploads
through the site start at 1000 and climb, so they sit above anything in the
file unless you say otherwise.

## The top bar

Every page shares one nav, in `assets/js/site-nav.js`. Edit the `LINKS` list
there and all four pages follow. It used to be copied into each page by hand,
and the copies had already drifted apart.

Below 860px the links collapse into a menu button. (Before this there was no
mobile navigation at all — the links were simply hidden.)

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
