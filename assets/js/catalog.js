/* ===================================================================
   Turning catalog entries into things a page can use.

   Three jobs:

     1. Resolve bucket keys into real addresses. Entries store a key like
        "music/pretzel-sunday/track.mp3"; this puts the media host in
        front of it. Anything that already looks like an address, or that
        points into assets/, is left exactly as it is — so album art can
        keep living in the repo while the audio lives in the bucket.

     2. Give the pages one place to get their list from. There are two
        sources, merged: whatever has been uploaded through the site
        (GET /api/media, the database) and the hand-edited file in
        assets/data/catalog.js. The database wins when both have the
        same slug. If the API can't be reached — the page was opened off
        the disk, or the back end is down — the file alone is the list,
        so the page never looks broken.

     3. Send uploads. The song goes up as a raw request body, with the
        words about it in a header, so the server can stream it into the
        bucket without holding it in memory. XMLHttpRequest rather than
        fetch, because only XHR reports upload progress.

   Exposed as window.BDCatalog.
   =================================================================== */
(function () {
  'use strict';

  /* Where the bucket is served from. The custom domain handles Range
     requests natively, which is what makes seeking work in an <audio>
     or <video> element — a hand-rolled proxy usually doesn't. */
  var MEDIA_BASE = 'https://media.bigdaddyand.co';

  /* Off the disk there is no back end to talk to. Say so rather than fail. */
  var API_READY = location.protocol === 'http:' || location.protocol === 'https:';

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

  /* ---- talking to the API ---------------------------------------- */

  function apiError(status, data) {
    var err = new Error((data && data.message) || 'That did not work.');
    err.code = (data && data.error) || 'http_' + status;
    err.status = status;
    return err;
  }

  function apiCall(path, options) {
    return fetch(path, Object.assign({ credentials: 'same-origin' }, options)).then(function (res) {
      return res.json().catch(function () { return null; }).then(function (data) {
        if (!res.ok) throw apiError(res.status, data);
        return data;
      });
    });
  }

  /* file: a File from an <input>. meta: { title, album, year, … } — see
     functions/lib/media.js for what's read. onProgress gets 0..1. */
  function upload(path, file, meta, onProgress) {
    return new Promise(function (resolveP, rejectP) {
      var xhr = new XMLHttpRequest();
      xhr.open('POST', path);
      xhr.setRequestHeader('Content-Type', file.type || 'application/octet-stream');
      xhr.setRequestHeader('X-Media-Meta',
        encodeURIComponent(JSON.stringify(Object.assign({ filename: file.name }, meta || {}))));
      xhr.upload.onprogress = function (ev) {
        if (onProgress && ev.lengthComputable) onProgress(ev.loaded / ev.total);
      };
      xhr.onload = function () {
        var data = null;
        try { data = JSON.parse(xhr.responseText); } catch (e) {}
        if (xhr.status >= 200 && xhr.status < 300) resolveP(data);
        else rejectP(apiError(xhr.status, data));
      };
      xhr.onerror = function () { rejectP(apiError(0, { message: 'The upload was cut off. Check the connection and try again.' })); };
      xhr.send(file);
    });
  }

  var API = {
    ready: API_READY,
    mayPost: function () { return apiCall('/api/session'); },
    signIn: function (passphrase) {
      return apiCall('/api/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ passphrase: passphrase })
      });
    },
    list: function (kind) { return apiCall('/api/media?kind=' + encodeURIComponent(kind)); },
    uploadArt: function (file, onProgress) { return upload('/api/media/art', file, {}, onProgress); },
    uploadTrack: function (file, meta, onProgress) {
      return upload('/api/media', file, Object.assign({ kind: 'track' }, meta), onProgress);
    }
  };

  /* ---- the list ---------------------------------------------------- */

  function merge(uploaded, inline) {
    var seen = {};
    var all = [];
    uploaded.concat(inline).forEach(function (item) {
      if (!item || !item.src || seen[item.slug]) return;
      seen[item.slug] = true;
      all.push(item);
    });
    return all.map(prepare).sort(bySortOrder);
  }

  /* kind: 'tracks' | 'videos'. Always resolves — a missing catalog is an
     empty page, not a broken one. */
  function load(kind) {
    var inline = (window.BD_CATALOG && window.BD_CATALOG[kind]) || [];
    if (!API_READY) return Promise.resolve(merge([], inline));
    return API.list(kind)
      .then(function (data) { return merge((data && data.items) || [], inline); })
      .catch(function () { return merge([], inline); });
  }

  /* mm:ss, or a dash when the length isn't known yet. */
  function duration(seconds) {
    if (!seconds && seconds !== 0) return '—';
    var mins = Math.floor(seconds / 60);
    var secs = Math.round(seconds % 60);
    return mins + ':' + (secs < 10 ? '0' : '') + secs;
  }

  /* How long an audio file is, measured by the browser before it goes
     anywhere. Resolves null if the browser can't read it — the page still
     shows the length once the track actually plays. */
  function measure(file) {
    return new Promise(function (resolveP) {
      var url = URL.createObjectURL(file);
      var audio = document.createElement('audio');
      var done = function (secs) { URL.revokeObjectURL(url); resolveP(secs); };
      audio.preload = 'metadata';
      audio.onloadedmetadata = function () {
        done(isFinite(audio.duration) && audio.duration > 0 ? audio.duration : null);
      };
      audio.onerror = function () { done(null); };
      audio.src = url;
    });
  }

  window.BDCatalog = {
    load: load,
    prepare: prepare,
    resolve: resolve,
    duration: duration,
    measure: measure,
    api: API,
    MEDIA_BASE: MEDIA_BASE
  };
})();
