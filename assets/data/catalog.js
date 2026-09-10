/* ===================================================================
   THE MUSIC AND VIDEO LIBRARY

   This is the file you edit to put a song or a clip on the site. Upload
   the actual file to the R2 bucket first (see EDITING.md), then add a
   block here with the key it landed under.

   `src`, `cover` and `poster` are KEYS INSIDE THE BUCKET, not full web
   addresses — assets/js/catalog.js turns them into addresses at render
   time. That way, if the media ever moves, one line changes instead of
   every entry.

   Loaded as a plain <script>, not fetched, so the pages still work when
   opened straight off the disk.

   Every field here is a column in migrations/0002_media.sql. That's
   deliberate: when the upload page arrives, this file gets imported into
   the database and the pages carry on reading the same shape.
   =================================================================== */
window.BD_CATALOG = {
  /* ---- Songs, newest first ----------------------------------------
     slug        short name, unique, used in the address bar
     title       what it's called
     album       which record it's from, or leave it out for a single
     year        when it came out
     duration_s  length in seconds — shown before the track loads
     src         the mp3's key in the bucket
     cover       artwork; a key in the bucket, or a path in assets/albums/
     blurb       a line or two about it
     credits     who played what
     sort_order  bigger numbers come first
     ------------------------------------------------------------------ */
  tracks: [
    // {
    //   slug: 'chasing-big-daddy',
    //   title: 'Chasing Big Daddy',
    //   album: 'Chasing Big Daddy',
    //   year: 2026,
    //   duration_s: 214,
    //   src: 'music/chasing-big-daddy/chasing-big-daddy.mp3',
    //   cover: 'assets/albums/chasing-big-daddy.jpg',
    //   blurb: 'The one that started it.',
    //   credits: '',
    //   sort_order: 100
    // }
  ],

  /* ---- Videos, newest first ---------------------------------------
     Same idea. `poster` is the still shown before it plays — always set
     one, or the tile is a black rectangle until someone hits play.
     ------------------------------------------------------------------ */
  videos: [
    /* These two still live in the repo, so they play with no setup at all.
       Once the bucket is up, upload them and change these four lines to bare
       keys ('video/chasing-big-daddy-banner.mp4' and so on) — the page picks
       up the change with nothing else touched. See SETUP-CLOUDFLARE.md. */
    {
      slug: 'chasing-big-daddy',
      title: 'Chasing Big Daddy',
      year: 2026,
      duration_s: null,
      src: 'assets/video/chasing-big-daddy-banner.mp4',
      poster: 'assets/video/chasing-big-daddy-banner-poster.jpg',
      blurb: 'The music video, in full.',
      credits: '',
      sort_order: 100
    },
    {
      slug: 'chasing-big-daddy-teaser',
      title: 'Chasing Big Daddy — Teaser',
      year: 2026,
      duration_s: null,
      src: 'assets/video/chasing-big-daddy-teaser.mp4',
      poster: 'assets/video/chasing-big-daddy-teaser-poster.jpg',
      blurb: 'The short one.',
      credits: '',
      sort_order: 90
    }
  ]
};
