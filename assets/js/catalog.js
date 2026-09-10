/* ===================================================================
   Turning catalog entries into things a page can use.

   Two jobs:

     1. Resolve bucket keys into real addresses. Entries store a key like
        "music/pretzel-sunday/track.mp3"; this puts the media host in
        front of it. Anything that already looks like an address, or that
        points into assets/, is left exactly as it is — so album art can
        keep living in the repo while the audio lives in the bucket.

     2. Give the pages one place to get their list from. Today that's the
        hand-edited file in assets/data/catalog.js. When the upload page
        arrives, the fetch inside load() switches to /api/media and
        nothing else on either page changes.

   Exposed as window.BDCatalog.
   =================================================================== */
(function () {
  'use strict';

  /* Where the bucket is served from. The custom domain handles Range
     requests natively, which is what makes seeking work in an <audio>
     or <video> element — a hand-rolled proxy usually doesn't. */
  var MEDIA_BASE = 'https://media.bigdaddyand.co';

  function resolve(key) {
    if (!key) return null;
    if (/^https?:\/\//i.test(key) || key.indexOf('assets/') === 0) return key;
    return MEDIA_BASE + '/' + key.replace(/^\/+/, '');
  }

  function prepare(item) {
    var out = {};
    for (var k in item) if (Object.prototype.hasOwnProperty.call(item, k)) out[k] = item[k];
    out.src = resolve(item.src);
    out.cover = resolve(item.cover);
    out.poster = resolve(item.poster);
    return out;
  }

  function bySortOrder(a, b) {
    return (b.sort_order || 0) - (a.sort_order || 0) ||
           (b.year || 0) - (a.year || 0) ||
           String(a.title).localeCompare(String(b.title));
  }

  /* kind: 'tracks' | 'videos'. Always resolves — a missing catalog is an
     empty page, not a broken one. */
  function load(kind) {
    var inline = (window.BD_CATALOG && window.BD_CATALOG[kind]) || [];
    var ready = inline.filter(function (i) { return i && i.src; }).map(prepare).sort(bySortOrder);
    return Promise.resolve(ready);
  }

  /* mm:ss, or a dash when the length isn't known yet. */
  function duration(seconds) {
    if (!seconds && seconds !== 0) return '—';
    var mins = Math.floor(seconds / 60);
    var secs = Math.round(seconds % 60);
    return mins + ':' + (secs < 10 ? '0' : '') + secs;
  }

  window.BDCatalog = {
    load: load,
    resolve: resolve,
    duration: duration,
    MEDIA_BASE: MEDIA_BASE
  };
})();
