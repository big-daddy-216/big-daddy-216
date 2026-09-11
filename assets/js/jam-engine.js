/* Big Daddy and Co. — Jam Engine
   ================================================================
   Everything that makes noise, everything that turns a loop into a
   file, and everything that turns a loop into a shareable code.

   This file has NO user-interface in it and no React. The page
   (jam.html) draws the buttons; this file does the work. That split
   means you can poke at the engine straight from the browser console:

       BDJam.playDrum('kick')
       BDJam.encodeLoop(BDJam.emptyPattern())

   Nothing here needs a build step. Plain old browser JavaScript.
   ================================================================ */
(function () {
  'use strict';

  /* ---------------------------------------------------------------
     THE SHAPE OF A LOOP
     One bar of 4/4 by default, sliced into 16 sixteenth-notes
     ("steps"). A loop can be switched to two bars — 32 steps — and
     carries its own length, so both sizes coexist happily.
     --------------------------------------------------------------- */

  var STEPS_PER_BEAT = 4;
  var STEPS_DEFAULT = 16;       // one bar of 4/4
  var STEPS_MAX = 32;           // two bars, for anyone who wants the room
  var MAX_LAYERS = 4;

  /* The lengths a loop can be. Anything added here has to stay a whole
     number of bars, and no longer than STEPS_MAX — the shared loop code
     stores the step count in a single byte and the grid assumes bars. */
  var LENGTHS = [
    { steps: 16, label: '1 Bar',  hint: '16 steps' },
    { steps: 32, label: '2 Bars', hint: '32 steps' }
  ];

  /* The six drum lanes, top to bottom. `midi` is the General MIDI
     drum note each lane exports as, so the .mid file lands on the
     right pads in any DAW. */
  var LANES = [
    { id: 'kick',  label: 'Kick',       midi: 36 },
    { id: 'snare', label: 'Snare',      midi: 38 },
    { id: 'clap',  label: 'Clap',       midi: 39 },
    { id: 'hat',   label: 'Closed Hat', midi: 42 },
    { id: 'ohat',  label: 'Open Hat',   midi: 46 },
    { id: 'cow',   label: 'Cowbell',    midi: 56 }
  ];

  /* The keyboard voices. `program` is the General MIDI patch number
     written into the exported file. */
  var VOICES = [
    { id: 'organ',    label: 'Rock Organ', program: 18 },
    { id: 'fuzzbass', label: 'Fuzz Bass',  program: 39 },
    { id: 'epiano',   label: 'E-Piano',    program: 4  },
    { id: 'synth',    label: 'Synth',      program: 81 },
    { id: 'choir',    label: 'Choir',      program: 52 }
  ];

  var BPM_MIN = 60, BPM_MAX = 180, BPM_DEFAULT = 108;
  var MAX_NOTES = 96;           // per layer, to keep the shared code sane
  var MAX_SAMPLE_SECONDS = 4;

  function blankSteps(count) { return new Array(count).fill(false); }

  /* How long a given loop is. Older patterns (and anything half-built)
     may not carry the field, so this is the only place that guesses. */
  function patternSteps(pattern) {
    var n = pattern && pattern.steps;
    return (n === 16 || n === 32) ? n : STEPS_DEFAULT;
  }

  function emptyLayer(voiceId) {
    return { voice: voiceId || VOICES[0].id, muted: false, solo: false, notes: [] };
  }

  /* A loop is: a tempo, six drum lanes, one lane for a recorded sample,
     and up to four independent keyboard layers each with its own voice.
     The sample lane holds only the *pattern* — the audio itself lives in
     the engine. It stays on this machine unless the visitor
     deliberately publishes a jam with the sample included. */
  function emptyPattern(steps) {
    var count = (steps === 16 || steps === 32) ? steps : STEPS_DEFAULT;
    var drums = [];
    for (var i = 0; i < LANES.length; i++) drums.push(blankSteps(count));
    var layers = [];
    for (var l = 0; l < MAX_LAYERS; l++) {
      layers.push(emptyLayer(VOICES[Math.min(l, VOICES.length - 1)].id));
    }
    // Layer 1 starts on the organ; the rest get distinct voices so
    // stacking something new is one click rather than three.
    layers[0].voice = 'organ';
    if (layers[1]) layers[1].voice = 'fuzzbass';
    if (layers[2]) layers[2].voice = 'epiano';
    if (layers[3]) layers[3].voice = 'choir';
    return { bpm: BPM_DEFAULT, steps: count, drums: drums, sample: blankSteps(count), layers: layers };
  }

  function clamp(n, lo, hi) { return n < lo ? lo : (n > hi ? hi : n); }

  function voiceIndex(id) {
    for (var i = 0; i < VOICES.length; i++) { if (VOICES[i].id === id) return i; }
    return 0;
  }

  /* ---------------------------------------------------------------
     AUDIO
     One AudioContext for the page, built the first time the visitor
     actually does something. Browsers (iOS especially) refuse to
     start audio outside a real click/tap, so nothing is created
     until ensureAudio() runs inside a gesture handler.
     --------------------------------------------------------------- */

  var ctx = null, master = null, noiseBuf = null;

  function ensureAudio() {
    if (!ctx) {
      var AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      ctx = new AC();

      // A gentle limiter so stacked notes never clip into crackle.
      var comp = ctx.createDynamicsCompressor();
      comp.threshold.value = -12;
      comp.knee.value = 14;
      comp.ratio.value = 8;
      comp.attack.value = 0.003;
      comp.release.value = 0.18;

      master = ctx.createGain();
      master.gain.value = 0.8;
      master.connect(comp);
      comp.connect(ctx.destination);

      noiseBuf = buildNoise();

      /* iOS parks the context in 'interrupted' after a phone call or
         Siri, and coming back to the tab needs a nudge either way. */
      if (ctx.addEventListener) {
        ctx.addEventListener('statechange', function () {
          if (ctx.state === 'interrupted' && ctx.resume) {
            try { ctx.resume(); } catch (e) {}
          }
        });
      }
      document.addEventListener('visibilitychange', function () {
        if (!document.hidden && ctx && ctx.state !== 'running' && ctx.resume) {
          try { ctx.resume(); } catch (e) {}
        }
      });
    }

    // Browsers hold the context suspended until a real gesture resumes
    // it — which is why every caller of this runs inside a click.
    if (ctx.state !== 'running' && ctx.resume) {
      try { ctx.resume(); } catch (e) {}
    }
    return ctx;
  }

  function audioReady() { return !!ctx && ctx.state === 'running'; }
  function now() { return ctx ? ctx.currentTime : 0; }

  /* Two seconds of white noise, generated once and replayed by cheap
     throwaway source nodes. Regenerating per hit would be wasteful. */
  function buildNoise() {
    var len = Math.floor(ctx.sampleRate * 2);
    var buf = ctx.createBuffer(1, len, ctx.sampleRate);
    var data = buf.getChannelData(0);
    for (var i = 0; i < len; i++) { data[i] = Math.random() * 2 - 1; }
    return buf;
  }

  function noiseSource() {
    var src = ctx.createBufferSource();
    src.buffer = noiseBuf;
    src.loop = true;
    // Start from a random spot so repeated hits don't sound identical.
    src.__offset = Math.random() * 1.5;
    return src;
  }

  /* An exponential ramp to exactly 0 throws, so every fade lands on a
     near-silent epsilon and is then pinned to true zero. This is the
     difference between a clean decay and a click on every note. */
  var EPS = 0.0001;

  function decayTo(param, t0, peak, endTime) {
    param.cancelScheduledValues(t0);
    param.setValueAtTime(EPS, t0);
    param.exponentialRampToValueAtTime(Math.max(peak, EPS * 2), t0 + 0.004);
    param.exponentialRampToValueAtTime(EPS, endTime);
    param.setValueAtTime(0, endTime);
  }

  /* A note whose full length is known up front — anything the
     sequencer plays. Attack, hold, release, all scheduled at once. */
  function shape(param, t0, tOff, peak, attackTime, releaseTime) {
    var p = Math.max(peak, EPS * 2);
    var hold = Math.max(tOff, t0 + attackTime + 0.01);
    param.cancelScheduledValues(t0);
    param.setValueAtTime(EPS, t0);
    param.exponentialRampToValueAtTime(p, t0 + attackTime);
    param.setValueAtTime(p, hold);
    param.exponentialRampToValueAtTime(EPS, hold + releaseTime);
    param.setValueAtTime(0, hold + releaseTime);
    return hold + releaseTime;
  }

  /* A note held by a finger, whose length nobody knows yet: rise to
     the peak and stay there until someone lets go. */
  function attackOnly(param, t0, peak, attackTime) {
    var p = Math.max(peak, EPS * 2);
    param.cancelScheduledValues(t0);
    param.setValueAtTime(EPS, t0);
    param.exponentialRampToValueAtTime(p, t0 + attackTime);
  }

  /* Let go. Reading param.value is only meaningful for "about now",
     which is exactly when a key release happens. */
  function releaseFrom(param, t, releaseTime) {
    param.cancelScheduledValues(t);
    param.setValueAtTime(Math.max(param.value, EPS * 2), t);
    param.exponentialRampToValueAtTime(EPS, t + releaseTime);
    param.setValueAtTime(0, t + releaseTime);
    return t + releaseTime;
  }

  function midiToHz(m) { return 440 * Math.pow(2, (m - 69) / 12); }

  /* A soft-clipping curve for the fuzz bass — higher `drive` is dirtier.
     The length is deliberately ODD so that one sample sits exactly at
     x = 0; with an even length, this asymmetric curve would map silence
     to a non-zero value and leave a DC offset thumping under every note. */
  function fuzzCurve(drive) {
    var n = 4097, curve = new Float32Array(n);
    var norm = Math.tanh(drive * 1.08);
    for (var i = 0; i < n; i++) {
      var x = (i / (n - 1)) * 2 - 1;
      // A touch of even harmonic makes it read as fuzz rather than buzz.
      curve[i] = Math.tanh(drive * (x + 0.08 * x * x)) / norm;
    }
    return curve;
  }
  var FUZZ_CURVE = null;

  /* Source nodes disconnect themselves when they finish; the gains and
     filters behind them do not, and stay wired to the destination for
     the life of the page. At sixteenth notes that's thousands of live
     nodes inside a few minutes, which ends in crackle. */
  function releaseOnEnd(source, nodes) {
    source.onended = function () {
      try { source.disconnect(); } catch (e) {}
      for (var i = 0; i < nodes.length; i++) {
        try { nodes[i].disconnect(); } catch (e2) {}
      }
    };
  }

  /* ---------------------------------------------------------------
     KEYBOARD VOICES

     Each builder wires up its oscillators and hands them back. It
     deliberately does NOT set the output gain or stop anything,
     because the two callers need different things: the sequencer
     knows a note's full length up front, while a finger resting on a
     key doesn't. So the envelope is the caller's job.
     --------------------------------------------------------------- */

  /* Drawbar-ish organ: fundamental plus octave and fifth, lightly
     detuned, with a slow vibrato over the top. */
  function buildOrgan(out, hz, when, tOff, vel) {
    var oscs = [], nodes = [];

    var vib = ctx.createOscillator();
    var vibAmt = ctx.createGain();
    vib.frequency.value = 5.6;
    vibAmt.gain.value = hz * 0.004;
    vib.connect(vibAmt);
    oscs.push(vib); nodes.push(vibAmt);

    [{ mult: 1, gain: 1.0,  detune: 0,  type: 'sawtooth' },
     { mult: 2, gain: 0.45, detune: 4,  type: 'square'   },
     { mult: 3, gain: 0.22, detune: -6, type: 'sine'     }].forEach(function (p) {
      var osc = ctx.createOscillator();
      var g = ctx.createGain();
      osc.type = p.type;
      osc.frequency.value = hz * p.mult;
      osc.detune.value = p.detune;
      g.gain.value = p.gain;
      vibAmt.connect(osc.frequency);
      osc.connect(g);
      g.connect(out);
      oscs.push(osc); nodes.push(g);
    });

    return { oscs: oscs, nodes: nodes, peak: 0.16 * vel, attack: 0.012, release: 0.12 };
  }

  /* Saw and sub through a soft-clipper into a sweeping lowpass —
     dirty, but round underneath. */
  function buildFuzzBass(out, hz, when, tOff, vel) {
    if (!FUZZ_CURVE) FUZZ_CURVE = fuzzCurve(8);

    var osc = ctx.createOscillator();
    osc.type = 'sawtooth';
    osc.frequency.value = hz;

    var sub = ctx.createOscillator();
    sub.type = 'sine';
    sub.frequency.value = hz / 2;
    var subG = ctx.createGain();
    subG.gain.value = 0.5;

    // How hard the signal hits the shaper *is* the drive control.
    var pre = ctx.createGain();
    pre.gain.value = 3;

    var drive = ctx.createWaveShaper();
    drive.curve = FUZZ_CURVE;
    // Without oversampling, the harmonics this generates run past
    // Nyquist and fold back down as inharmonic metallic noise. This is
    // the difference between a fuzz pedal and something broken.
    drive.oversample = '4x';

    // Catches any DC the asymmetric curve leaves behind.
    var dc = ctx.createBiquadFilter();
    dc.type = 'highpass';
    dc.frequency.value = 25;

    var lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.Q.value = 6;
    lp.frequency.setValueAtTime(Math.min(hz * 8, 3200), when);
    lp.frequency.exponentialRampToValueAtTime(
      Math.max(hz * 2.2, 90), Math.max(tOff, when + 0.06));

    osc.connect(pre);
    sub.connect(subG); subG.connect(pre);
    pre.connect(drive); drive.connect(dc); dc.connect(lp); lp.connect(out);

    return {
      oscs: [osc, sub],
      nodes: [subG, pre, drive, dc, lp],
      peak: 0.22 * vel, attack: 0.008, release: 0.1
    };
  }

  /* Two-operator FM — a sine bent by another sine. The modulation
     falls away fast, which is what makes the attack sparkle and the
     tail go mellow. */
  function buildEPiano(out, hz, when, tOff, vel) {
    var carrier = ctx.createOscillator();
    carrier.type = 'sine';
    carrier.frequency.value = hz;

    var mod = ctx.createOscillator();
    mod.type = 'sine';
    mod.frequency.value = hz * 2;

    var modAmt = ctx.createGain();
    modAmt.gain.setValueAtTime(hz * 2.6, when);
    modAmt.gain.exponentialRampToValueAtTime(hz * 0.12, when + 0.35);

    mod.connect(modAmt);
    modAmt.connect(carrier.frequency);
    carrier.connect(out);

    return {
      oscs: [carrier, mod],
      nodes: [modAmt],
      peak: 0.19 * vel, attack: 0.005, release: 0.22
    };
  }

  /* Supersaw lead: several sawtooths detuned a few cents either side of
     the note. The tiny pitch differences beat against each other, which
     is the whole trick — one saw sounds thin, five sound enormous. */
  function buildSynth(out, hz, when, tOff, vel) {
    var oscs = [], nodes = [];

    var lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.Q.value = 9;
    lp.frequency.setValueAtTime(Math.min(hz * 12, 7000), when);
    lp.frequency.exponentialRampToValueAtTime(
      Math.max(hz * 2.5, 240), Math.max(tOff, when + 0.14));
    lp.connect(out);
    nodes.push(lp);

    [-14, -7, 0, 7, 14].forEach(function (cents) {
      var osc = ctx.createOscillator();
      osc.type = 'sawtooth';
      osc.frequency.value = hz;
      osc.detune.value = cents;
      var g = ctx.createGain();
      g.gain.value = cents === 0 ? 0.34 : 0.24;
      osc.connect(g);
      g.connect(lp);
      oscs.push(osc);
      nodes.push(g);
    });

    return { oscs: oscs, nodes: nodes, peak: 0.15 * vel, attack: 0.006, release: 0.16 };
  }

  /* Choir "aah": a couple of detuned sawtooths pushed through three
     bandpass filters parked on the formants of an open vowel. Slow in,
     slow out, with a little vibrato so it breathes instead of droning. */
  function buildChoir(out, hz, when, tOff, vel) {
    var oscs = [], nodes = [];

    var mix = ctx.createGain();
    mix.gain.value = 1;
    mix.connect(out);
    nodes.push(mix);

    // frequency, relative level, resonance — roughly an "aah"
    var bands = [[800, 1.0, 9], [1150, 0.6, 11], [2900, 0.22, 13]].map(function (f) {
      var bp = ctx.createBiquadFilter();
      bp.type = 'bandpass';
      bp.frequency.value = f[0];
      bp.Q.value = f[2];
      var bg = ctx.createGain();
      bg.gain.value = f[1];
      bp.connect(bg);
      bg.connect(mix);
      nodes.push(bp, bg);
      return bp;
    });

    var vib = ctx.createOscillator();
    var vibAmt = ctx.createGain();
    vib.frequency.value = 4.7;
    vibAmt.gain.value = hz * 0.007;
    vib.connect(vibAmt);
    oscs.push(vib);
    nodes.push(vibAmt);

    [-8, 8].forEach(function (cents) {
      var osc = ctx.createOscillator();
      osc.type = 'sawtooth';
      osc.frequency.value = hz;
      osc.detune.value = cents;
      vibAmt.connect(osc.frequency);
      bands.forEach(function (bp) { osc.connect(bp); });
      oscs.push(osc);
    });

    // Slow attack and a long tail are what make it read as voices
    // rather than as a synth pretending to be voices.
    return { oscs: oscs, nodes: nodes, peak: 0.2 * vel, attack: 0.15, release: 0.4 };
  }

  var BUILDERS = {
    organ: buildOrgan,
    fuzzbass: buildFuzzBass,
    epiano: buildEPiano,
    synth: buildSynth,
    choir: buildChoir
  };

  function buildVoice(voiceId, out, hz, when, tOff, vel) {
    return (BUILDERS[voiceId] || buildOrgan)(out, hz, when, tOff, vel);
  }

  function normVel(v) { return clamp((v == null ? 100 : v) / 127, 0.05, 1); }

  /* A note of known length — what the sequencer plays. */
  function playNote(voiceId, midi, when, dur, velocity) {
    if (!ensureAudio()) return 0;
    when = Math.max(when || now(), now());
    dur = Math.max(dur || 0.25, 0.05);

    var out = ctx.createGain();
    out.connect(master);

    var tOff = when + dur;
    var v = buildVoice(voiceId, out, midiToHz(midi), when, tOff, normVel(velocity));
    var ends = shape(out.gain, when, tOff, v.peak, v.attack, v.release);

    // Stopping only after the envelope has reached zero — cutting a
    // waveform off mid-cycle is what a click is.
    v.oscs.forEach(function (o) { o.start(when); o.stop(ends + 0.02); });
    releaseOnEnd(v.oscs[v.oscs.length - 1], v.oscs.concat(v.nodes, [out]));

    return ends;
  }

  /* A note held by a finger, whose length nobody knows yet. Returns a
     handle to hand back to noteOff(). */
  function noteOn(voiceId, midi, velocity) {
    if (!ensureAudio()) return null;
    var when = now();

    var out = ctx.createGain();
    out.connect(master);

    // A nominal half-second only so the filter sweep has somewhere to
    // go; the real length is however long the key stays down.
    var v = buildVoice(voiceId, out, midiToHz(midi), when, when + 0.5, normVel(velocity));
    attackOnly(out.gain, when, v.peak, v.attack);
    v.oscs.forEach(function (o) { o.start(when); });

    var handle = { out: out, voice: v, startedAt: when, off: false };
    // If a pointer is lost off the edge of the screen we'd never hear
    // about the release, so no note is allowed to ring forever.
    handle.guard = window.setTimeout(function () { noteOff(handle); }, 12000);
    return handle;
  }

  function noteOff(handle) {
    if (!handle || handle.off) return 0;
    handle.off = true;
    if (handle.guard) window.clearTimeout(handle.guard);

    var v = handle.voice;
    var ends = releaseFrom(handle.out.gain, now(), v.release);
    v.oscs.forEach(function (o) { try { o.stop(ends + 0.02); } catch (e) {} });
    releaseOnEnd(v.oscs[v.oscs.length - 1], v.oscs.concat(v.nodes, [handle.out]));
    return ends;
  }

  /* ---------------------------------------------------------------
     DRUM VOICES
     All synthesized — no samples to download.
     --------------------------------------------------------------- */

  function playDrum(laneId, when, velocity) {
    if (!ensureAudio()) return;
    when = when || now();
    var vel = clamp((velocity == null ? 110 : velocity) / 127, 0.05, 1);
    switch (laneId) {
      case 'kick':  return drumKick(when, vel);
      case 'snare': return drumSnare(when, vel);
      case 'clap':  return drumClap(when, vel);
      case 'hat':   return drumHat(when, vel, 0.045, 7800);
      case 'ohat':  return drumHat(when, vel, 0.32, 6600);
      case 'cow':   return drumCowbell(when, vel);
    }
  }

  function drumKick(t, vel) {
    var osc = ctx.createOscillator();
    var g = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(150, t);
    osc.frequency.exponentialRampToValueAtTime(48, t + 0.12);
    decayTo(g.gain, t, 0.9 * vel, t + 0.42);
    osc.connect(g); g.connect(master);
    osc.start(t); osc.stop(t + 0.45);
    releaseOnEnd(osc, [g]);

    // A click of noise at the very front gives the beater some bite.
    var n = noiseSource();
    var ng = ctx.createGain();
    var hp = ctx.createBiquadFilter();
    hp.type = 'highpass'; hp.frequency.value = 1200;
    decayTo(ng.gain, t, 0.18 * vel, t + 0.03);
    n.connect(hp); hp.connect(ng); ng.connect(master);
    n.start(t, n.__offset); n.stop(t + 0.05);
    releaseOnEnd(n, [hp, ng]);
  }

  function drumSnare(t, vel) {
    var n = noiseSource();
    var bp = ctx.createBiquadFilter();
    bp.type = 'bandpass'; bp.frequency.value = 1900; bp.Q.value = 0.7;
    var ng = ctx.createGain();
    decayTo(ng.gain, t, 0.55 * vel, t + 0.19);
    n.connect(bp); bp.connect(ng); ng.connect(master);
    n.start(t, n.__offset); n.stop(t + 0.22);
    releaseOnEnd(n, [bp, ng]);

    // Body tone underneath the rattle.
    var osc = ctx.createOscillator();
    var g = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(190, t);
    osc.frequency.exponentialRampToValueAtTime(120, t + 0.1);
    decayTo(g.gain, t, 0.3 * vel, t + 0.12);
    osc.connect(g); g.connect(master);
    osc.start(t); osc.stop(t + 0.14);
    releaseOnEnd(osc, [g]);
  }

  function drumClap(t, vel) {
    // Three fast bursts and a longer tail — the classic clap trick.
    var offsets = [0, 0.011, 0.023, 0.038];
    offsets.forEach(function (o, i) {
      var last = i === offsets.length - 1;
      var n = noiseSource();
      var bp = ctx.createBiquadFilter();
      bp.type = 'bandpass'; bp.frequency.value = 1150; bp.Q.value = 1.1;
      var g = ctx.createGain();
      var dur = last ? 0.16 : 0.022;
      decayTo(g.gain, t + o, (last ? 0.4 : 0.5) * vel, t + o + dur);
      n.connect(bp); bp.connect(g); g.connect(master);
      n.start(t + o, n.__offset); n.stop(t + o + dur + 0.02);
      releaseOnEnd(n, [bp, g]);
    });
  }

  function drumHat(t, vel, dur, cutoff) {
    var n = noiseSource();
    var hp = ctx.createBiquadFilter();
    hp.type = 'highpass'; hp.frequency.value = cutoff;
    var g = ctx.createGain();
    decayTo(g.gain, t, 0.3 * vel, t + dur);
    n.connect(hp); hp.connect(g); g.connect(master);
    n.start(t, n.__offset); n.stop(t + dur + 0.03);
    releaseOnEnd(n, [hp, g]);
  }

  function drumCowbell(t, vel) {
    var g = ctx.createGain();
    var bp = ctx.createBiquadFilter();
    bp.type = 'bandpass'; bp.frequency.value = 2640; bp.Q.value = 2.2;
    decayTo(g.gain, t, 0.34 * vel, t + 0.3);
    var oscs = [587, 845].map(function (f) {
      var osc = ctx.createOscillator();
      osc.type = 'square';
      osc.frequency.value = f;
      osc.connect(bp);
      osc.start(t); osc.stop(t + 0.32);
      return osc;
    });
    bp.connect(g); g.connect(master);
    releaseOnEnd(oscs[oscs.length - 1], [oscs[0], bp, g]);
  }

  /* ---------------------------------------------------------------
     THE SAMPLE PAD

     A short recording made with the visitor's own microphone. Two
     rules shape everything here:

       1. The microphone is only ever opened from a deliberate tap on
          the record button, and the stream's tracks are stopped the
          moment recording ends, so the browser's "recording" light
          goes out instead of lingering.
       2. The audio stays on this machine unless the visitor publishes a
          jam to the board and ticks "include my recording". It is never
          in the loop code and never in the .mid — MIDI carries notes,
          not sound — so nothing travels by accident. Uploading is only
          ever the result of a deliberate publish.

     Samples live in SLOTS rather than in one variable. The studio holds
     the visitor's own recording under 'studio'; previewing somebody
     else's jam from the board loads theirs under 'preview'. Without
     that split, listening to the board would quietly destroy whatever
     the visitor had just recorded.
     --------------------------------------------------------------- */

  var samples = { studio: null, preview: null };
  var sampleBlobs = { studio: null, preview: null };
  var activeSampleSlot = 'studio';
  var activeRecording = null;

  function slotName(slot) { return slot === 'preview' ? 'preview' : 'studio'; }

  function hasSample(slot) { return !!samples[slotName(slot)]; }

  function clearSample(slot) {
    var k = slotName(slot);
    samples[k] = null;
    sampleBlobs[k] = null;
  }

  /* Which slot the sequencer and keyboard should sound. The board sets
     this to 'preview' while playing somebody else's jam and puts it
     back afterwards. */
  function useSample(slot) { activeSampleSlot = slotName(slot); }
  function activeSample() { return activeSampleSlot; }

  function sampleInfo(slot) {
    var k = slotName(slot);
    var buf = samples[k];
    if (!buf) return null;
    var blob = sampleBlobs[k];
    return {
      seconds: Math.round(buf.duration * 10) / 10,
      bytes: blob ? blob.size : 0,
      mime: blob ? blob.type : null
    };
  }

  /* The upload payload for a slot, or null if there's nothing to send. */
  function sampleBlob(slot) { return sampleBlobs[slotName(slot)] || null; }

  /* Why the mic can't be used, or null if it can. Checked before
     asking, so the page can explain instead of failing silently. */
  function micBlockedReason() {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      // Browsers only expose this on https (localhost counts).
      return window.isSecureContext === false ? 'insecure' : 'unsupported';
    }
    if (typeof window.MediaRecorder === 'undefined') return 'unsupported';
    return null;
  }

  function stopStream(stream) {
    try {
      stream.getTracks().forEach(function (t) { t.stop(); });
    } catch (e) {}
  }

  function blobToArrayBuffer(blob) {
    if (blob.arrayBuffer) return blob.arrayBuffer();
    return new Promise(function (resolve, reject) {
      var fr = new FileReader();
      fr.onload = function () { resolve(fr.result); };
      fr.onerror = function () { reject(new Error('read-failed')); };
      fr.readAsArrayBuffer(blob);
    });
  }

  /* ---- getting a recording into a shape every browser can read ----

     MediaRecorder hands back WebM/Opus on Chrome and Firefox, and
     MP4/AAC on Safari. Safari's decodeAudioData cannot read WebM/Opus
     at all — so storing the raw blob would mean every sample recorded
     on a laptop is silent on every iPhone, with no error to explain it.

     So the buffer is re-encoded to 16-bit mono PCM at 22.05 kHz before
     it goes anywhere. Four seconds is about 176 KB, and there is no
     browser with Web Audio that can't decode a WAV. */

  var SAMPLE_UPLOAD_RATE = 22050;

  function encodeWav(buffer) {
    var frames = buffer.length;
    var data = buffer.getChannelData(0);
    var total = 44 + frames * 2;
    var ab = new ArrayBuffer(total);
    var view = new DataView(ab);

    function ascii(offset, text) {
      for (var i = 0; i < text.length; i++) view.setUint8(offset + i, text.charCodeAt(i));
    }

    ascii(0, 'RIFF');
    view.setUint32(4, total - 8, true);
    ascii(8, 'WAVE');
    ascii(12, 'fmt ');
    view.setUint32(16, 16, true);           // PCM header length
    view.setUint16(20, 1, true);            // format: PCM
    view.setUint16(22, 1, true);            // channels: mono
    view.setUint32(24, buffer.sampleRate, true);
    view.setUint32(28, buffer.sampleRate * 2, true);  // byte rate
    view.setUint16(32, 2, true);            // block align
    view.setUint16(34, 16, true);           // bits per sample
    ascii(36, 'data');
    view.setUint32(40, frames * 2, true);

    var offset = 44;
    for (var i = 0; i < frames; i++) {
      var v = data[i];
      if (v > 1) v = 1; else if (v < -1) v = -1;
      view.setInt16(offset, v < 0 ? v * 0x8000 : v * 0x7fff, true);
      offset += 2;
    }
    return new Blob([ab], { type: 'audio/wav' });
  }

  /* Downmix to mono and resample, using an OfflineAudioContext so the
     browser does the filtering properly rather than us dropping samples
     and aliasing the result. Falls back to the buffer as recorded. */
  function toUploadBuffer(buffer) {
    var Offline = window.OfflineAudioContext || window.webkitOfflineAudioContext;
    if (!Offline) return Promise.resolve(buffer);

    var frames = Math.max(1, Math.ceil(buffer.duration * SAMPLE_UPLOAD_RATE));
    var off;
    try {
      off = new Offline(1, frames, SAMPLE_UPLOAD_RATE);
    } catch (e) {
      return Promise.resolve(buffer);
    }

    var src = off.createBufferSource();
    src.buffer = buffer;
    src.connect(off.destination);
    src.start();

    return new Promise(function (resolve) {
      // Safari has historically only had the callback form.
      off.oncomplete = function (e) { resolve(e.renderedBuffer); };
      var out = off.startRendering();
      if (out && typeof out.then === 'function') out.then(resolve, function () { resolve(buffer); });
    });
  }

  function trimTo(buffer, seconds) {
    if (buffer.duration <= seconds) return buffer;
    var frames = Math.floor(seconds * buffer.sampleRate);
    var out = ctx.createBuffer(buffer.numberOfChannels, frames, buffer.sampleRate);
    for (var c = 0; c < buffer.numberOfChannels; c++) {
      out.getChannelData(c).set(buffer.getChannelData(c).subarray(0, frames));
    }
    return out;
  }

  /* Opens the mic, records, and resolves with { seconds }. Rejects with
     an Error whose message is one of: insecure, unsupported, denied,
     no-device, decode-failed, empty. */
  function recordSample(maxSeconds, onReady) {
    maxSeconds = Math.min(maxSeconds || MAX_SAMPLE_SECONDS, MAX_SAMPLE_SECONDS);

    return new Promise(function (resolve, reject) {
      var blocked = micBlockedReason();
      if (blocked) { reject(new Error(blocked)); return; }
      if (!ensureAudio()) { reject(new Error('unsupported')); return; }

      navigator.mediaDevices.getUserMedia({ audio: true }).then(function (stream) {
        var rec;
        try {
          rec = new MediaRecorder(stream);
        } catch (e) {
          stopStream(stream);
          reject(new Error('unsupported'));
          return;
        }

        var chunks = [];
        var timer = window.setTimeout(finish, maxSeconds * 1000);

        function finish() {
          window.clearTimeout(timer);
          if (rec.state !== 'inactive') { try { rec.stop(); } catch (e) {} }
        }

        rec.ondataavailable = function (e) {
          if (e.data && e.data.size) chunks.push(e.data);
        };

        rec.onstop = function () {
          window.clearTimeout(timer);
          stopStream(stream);          // releases the mic indicator
          activeRecording = null;
          if (!chunks.length) { reject(new Error('empty')); return; }

          blobToArrayBuffer(new Blob(chunks, { type: rec.mimeType || 'audio/webm' }))
            .then(function (buf) {
              // Callback form, because Safari's promise form is patchy.
              ctx.decodeAudioData(buf, function (audio) {
                var trimmed = trimTo(audio, maxSeconds);
                samples.studio = trimmed;
                /* Re-encoded now rather than at publish time, so the
                   panel can show the real size before anyone commits. */
                toUploadBuffer(trimmed).then(function (ready) {
                  sampleBlobs.studio = encodeWav(ready);
                  resolve(sampleInfo('studio'));
                }, function () {
                  sampleBlobs.studio = null;
                  resolve(sampleInfo('studio'));
                });
              }, function () { reject(new Error('decode-failed')); });
            })
            .catch(function () { reject(new Error('decode-failed')); });
        };

        // Stopping early is the common case — the button says "Stop".
        activeRecording = { stop: finish, startedAt: Date.now(), maxSeconds: maxSeconds };
        rec.start();
        if (onReady) onReady(activeRecording);
      }, function (err) {
        var name = (err && err.name) || '';
        if (name === 'NotAllowedError' || name === 'SecurityError') reject(new Error('denied'));
        else if (name === 'NotFoundError' || name === 'DevicesNotFoundError') reject(new Error('no-device'));
        else reject(new Error('unsupported'));
      });
    });
  }

  function isRecordingSample() { return !!activeRecording; }
  function stopSampleRecording() { if (activeRecording) activeRecording.stop(); }

  /* Pull somebody else's published sample in so their jam sounds the
     way they made it.

     This needs CORS on the bucket. A cross-origin fetch without it
     yields an opaque response whose arrayBuffer() is empty, and
     decodeAudioData then fails with 'decode-failed' — which looks like
     a codec problem and is really a configuration one. If board samples
     ever go silent, check the R2 CORS policy first. */
  function loadSampleFromUrl(url, slot) {
    var k = slotName(slot);
    if (!ensureAudio()) return Promise.reject(new Error('unsupported'));

    return fetch(url, { mode: 'cors', credentials: 'omit' })
      .then(function (r) {
        if (!r.ok) throw new Error('fetch-failed');
        return r.arrayBuffer();
      })
      .then(function (buf) {
        return new Promise(function (resolve, reject) {
          ctx.decodeAudioData(buf, function (audio) {
            samples[k] = trimTo(audio, MAX_SAMPLE_SECONDS);
            sampleBlobs[k] = null;      // not ours to re-upload
            resolve(sampleInfo(k));
          }, function () { reject(new Error('decode-failed')); });
        });
      });
  }

  /* Play the sample. Pass a midi note to pitch it — the keyboard uses
     this, the grid lane doesn't. `slot` defaults to whichever slot is
     currently active, so existing callers are unaffected. */
  function playSample(when, midi, velocity, slot) {
    if (!ensureAudio()) return 0;
    var buffer = samples[slot ? slotName(slot) : activeSampleSlot];
    if (!buffer) return 0;
    when = Math.max(when || now(), now());

    var src = ctx.createBufferSource();
    src.buffer = buffer;
    var rate = (midi == null) ? 1 : Math.pow(2, (midi - 60) / 12);
    src.playbackRate.value = rate;

    var g = ctx.createGain();
    var vel = clamp((velocity == null ? 110 : velocity) / 127, 0.05, 1);
    g.gain.setValueAtTime(vel * 0.9, when);

    src.connect(g);
    g.connect(master);

    var dur = buffer.duration / rate;
    src.start(when);
    // A short fade stops the tail clicking when it's cut off.
    g.gain.setValueAtTime(vel * 0.9, when + Math.max(dur - 0.02, 0.01));
    g.gain.exponentialRampToValueAtTime(EPS, when + dur);
    src.stop(when + dur + 0.03);
    releaseOnEnd(src, [g]);
    return when + dur;
  }

  /* A dry click for the metronome. Accented on the downbeat. */
  function playClick(t, accent) {
    if (!ensureAudio()) return;
    var osc = ctx.createOscillator();
    var g = ctx.createGain();
    osc.type = 'square';
    osc.frequency.value = accent ? 1600 : 1050;
    decayTo(g.gain, t, accent ? 0.16 : 0.09, t + 0.035);
    osc.connect(g); g.connect(master);
    osc.start(t); osc.stop(t + 0.05);
    releaseOnEnd(osc, [g]);
  }

  /* ---------------------------------------------------------------
     THE TRANSPORT
     Web Audio's clock is sample-accurate; JavaScript timers are not.
     So the timer never plays a note directly — it wakes up often and
     schedules whatever falls inside a short lookahead window, always
     against ctx.currentTime. That's what keeps the groove steady.
     --------------------------------------------------------------- */

  var TICK_MS = 25;
  var LOOKAHEAD = 0.1;        // seconds scheduled ahead while visible
  var LOOKAHEAD_HIDDEN = 2.0; // background tabs throttle timers hard

  var timer = null;
  var nextStepTime = 0;
  var currentStep = 0;
  var playQueue = [];         // {step, time} for the moving playhead
  var lastHeardStep = -1;     // what's sounding right now, for the display
  var live = null;            // callbacks + latest pattern from the page
  var owner = null;           // who asked for the transport: 'studio' or 'board:<id>'

  /* How far behind the clock the sound actually is. */
  function latency() {
    if (!ctx) return 0;
    return ctx.outputLatency || ctx.baseLatency || 0;
  }

  function stepDuration(bpm) { return 60 / clamp(bpm, BPM_MIN, BPM_MAX) / 4; }

  function isPlaying() { return timer !== null; }

  /* `getState` is called fresh on every scheduled step, so tempo,
     pattern edits and the metronome toggle all take effect mid-loop
     without restarting the transport. */
  function start(getState, who) {
    if (timer) return;
    if (!ensureAudio()) return;
    live = getState;
    owner = who || 'studio';
    currentStep = 0;
    playQueue.length = 0;
    lastHeardStep = -1;
    nextStepTime = now() + 0.08;   // a beat of headroom before step 1
    timer = window.setInterval(scheduler, TICK_MS);
    scheduler();
  }

  function stop() {
    if (timer) { window.clearInterval(timer); timer = null; }
    playQueue.length = 0;
    lastHeardStep = -1;
    live = null;
    owner = null;
  }

  /* There is one transport and one audio context, so the studio and the
     board take turns rather than playing over each other. This is how
     each side knows whether the sound currently coming out is its own. */
  function transportOwner() { return owner; }

  function scheduler() {
    if (!live || !ctx) return;
    var t = now();

    /* If the clock ever falls behind — a hidden tab, a long garbage
       collection, the machine going to sleep — every missed step would
       otherwise be scheduled in the past and fire at once, in a burst.
       Re-anchoring to the present drops the missed steps instead. */
    if (nextStepTime < t) nextStepTime = t + 0.01;

    var horizon = t + (document.hidden ? LOOKAHEAD_HIDDEN : LOOKAHEAD);
    var guard = 0;

    while (nextStepTime < horizon && guard++ < 512) {
      var state = live();
      scheduleStep(state, currentStep, nextStepTime);
      playQueue.push({ step: currentStep, time: nextStepTime });
      nextStepTime += stepDuration(state.bpm);
      currentStep = (currentStep + 1) % patternSteps(state.pattern);
    }

    /* The playhead normally drains this queue, but requestAnimationFrame
       is paused outright in a hidden tab — so it has to be trimmed here
       too, or a page left in a background tab grows it without limit.

       The margin matters: the playhead reads the queue through the
       output latency, i.e. slightly in the past. Trimming to the bare
       present would throw away the step that is actually being heard,
       and at slow tempos there'd be no entry left to report. */
    var cutoff = t - latency() - 0.5;
    while (playQueue.length > 1 && playQueue[0].time < cutoff) playQueue.shift();
    if (playQueue.length > 64) playQueue.splice(0, playQueue.length - 64);
  }

  function scheduleStep(state, step, when) {
    var p = state.pattern;

    for (var l = 0; l < LANES.length; l++) {
      if (p.drums[l] && p.drums[l][step]) playDrum(LANES[l].id, when);
    }

    if (p.sample && p.sample[step]) playSample(when, null, null, state.sampleSlot);

    /* Solo wins over mute: if anything is soloed, only soloed layers
       sound. Otherwise everything that isn't muted plays. */
    var soloing = p.layers.some(function (ly) { return ly.solo; });
    var dur = stepDuration(state.bpm);

    p.layers.forEach(function (layer) {
      if (soloing ? !layer.solo : layer.muted) return;
      for (var i = 0; i < layer.notes.length; i++) {
        var n = layer.notes[i];
        if (n.step === step) {
          playNote(layer.voice, n.midi, when, dur * n.len * 0.95, n.velocity || 100);
        }
      }
    });

    if (state.metronome && step % STEPS_PER_BEAT === 0) playClick(when, step === 0);
  }

  /* The playhead is drawn from the same audio clock the notes use, so
     the highlight lands with the sound instead of drifting off it.
     Entries are consumed as they pass, so the queue stays tiny. */
  function currentPlayStep() {
    if (!ctx || !playQueue.length) return lastHeardStep;
    /* Sound scheduled for time T isn't heard until T + output latency.
       Comparing against the raw clock makes the highlight run ahead of
       the beat — barely noticeable on wired output, glaring over
       Bluetooth headphones, where it can be a fifth of a second. */
    var t = now() - latency();
    // Drop steps that have already gone by, keeping the sounding one at
    // the head. Bounded by the lookahead window.
    while (playQueue.length > 1 && playQueue[1].time <= t) playQueue.shift();
    /* If the head hasn't been reached yet, the step before it is still
       ringing — keep showing that rather than blanking the playhead. */
    if (playQueue[0].time <= t) lastHeardStep = playQueue[0].step;
    return lastHeardStep;
  }

  /* Which step is a note played *right now* closest to? Used to
     quantize live playing — snapping to the nearest step rather than
     the last one means a note played a hair early still lands on the
     beat instead of dragging behind it. */
  function liveStep() {
    if (!isPlaying() || !ctx || !playQueue.length) return 0;
    currentPlayStep();                       // drain what's already past
    var t = now();
    var best = playQueue[0], bestDist = Math.abs(best.time - t);
    for (var i = 1; i < playQueue.length; i++) {
      var d = Math.abs(playQueue[i].time - t);
      if (d < bestDist) { bestDist = d; best = playQueue[i]; }
    }
    return best.step;
  }

  /* ---------------------------------------------------------------
     MIDI FILE WRITER
     A real Standard MIDI File, byte by byte. Format 1, three tracks:
     tempo map, keys, drums.
     --------------------------------------------------------------- */

  var TPQ = 96;                        // ticks per quarter note
  var TICKS_PER_STEP = TPQ / 4;        // 24 ticks per sixteenth
  /* How many ticks the whole loop runs to. Tracks are padded out to
     this so a DAW imports a clip of exactly the right length instead of
     one that stops at the last hit. */
  function loopTicks(pattern) { return patternSteps(pattern) * TICKS_PER_STEP; }

  /* Variable-length quantity — MIDI's 7-bits-per-byte integer format.
     n=0 has to produce a single 0x00 byte, and a negative number must
     never sneak through: `-24 & 0x7f` is 104, which would write a
     plausible-looking but completely wrong delta instead of failing. */
  function vlq(n) {
    n = Math.round(Number(n));
    if (!isFinite(n) || n < 0) n = 0;
    if (n > 0x0fffffff) n = 0x0fffffff;   // the format's ceiling
    var bytes = [n & 0x7f];
    n = Math.floor(n / 128);
    while (n > 0) {
      bytes.unshift((n & 0x7f) | 0x80);
      n = Math.floor(n / 128);
    }
    return bytes;
  }

  function u16(n) { return [(n >> 8) & 0xff, n & 0xff]; }
  function u32(n) { return [(n >>> 24) & 0xff, (n >>> 16) & 0xff, (n >>> 8) & 0xff, n & 0xff]; }

  function ascii(s) {
    var out = [];
    for (var i = 0; i < s.length; i++) out.push(s.charCodeAt(i) & 0x7f);
    return out;
  }

  function metaEvent(type, data) {
    return [0xff, type].concat(vlq(data.length), data);
  }

  /* Events carry an `order` so that at an identical tick the setup
     events come first and note-offs land before note-ons — otherwise
     a repeated note can be silenced by its own predecessor. */
  var ORDER_SETUP = 0, ORDER_OFF = 1, ORDER_ON = 2;

  function buildTrack(events, totalTicks) {
    events.sort(function (a, b) {
      return (a.tick - b.tick) || (a.order - b.order) || (a.seq - b.seq);
    });

    /* Every track is padded out to the full bar before its end-of-track
       marker. DAWs take the imported clip length from where the track
       ends, so without this a loop whose last hit is on step 8 imports
       as a half-bar clip that loops out of time. */
    var last = 0;
    for (var i = 0; i < events.length; i++) {
      if (events[i].tick > last) last = events[i].tick;
    }
    var endTick = Math.max(totalTicks, last);

    var body = [], prev = 0;
    for (var j = 0; j < events.length; j++) {
      body = body.concat(vlq(events[j].tick - prev), events[j].bytes);
      prev = events[j].tick;
    }
    body = body.concat(vlq(endTick - prev), [0xff, 0x2f, 0x00]);

    // The chunk length counts only what follows the length field.
    return [0x4d, 0x54, 0x72, 0x6b].concat(u32(body.length), body);
  }

  /* Turn onsets into matched note-on/note-off pairs.

     The subtle part is repeated pitches: if a note is held longer than
     the gap before the same pitch plays again, the first note's "off"
     would land after the second note's "on" and silence it. So each
     note is truncated at the next onset of the same pitch. */
  function emitNotes(list, channel, onsets, ev, totalTicks) {
    var byPitch = {};
    onsets.forEach(function (o) {
      if (o.start >= totalTicks) return;
      var k = clamp(Math.round(o.note), 0, 127);
      (byPitch[k] = byPitch[k] || []).push({
        note: k, vel: o.vel, start: Math.round(o.start), end: Math.round(o.end)
      });
    });

    Object.keys(byPitch).forEach(function (k) {
      var arr = byPitch[k].sort(function (a, b) { return a.start - b.start; });
      for (var i = 0; i < arr.length; i++) {
        var o = arr[i];
        if (i > 0 && arr[i - 1].start === o.start) continue;   // same pitch, same step
        var nextStart = (i + 1 < arr.length) ? arr[i + 1].start : Infinity;
        var end = Math.min(o.end, nextStart, totalTicks);
        if (end <= o.start) end = Math.min(o.start + 1, totalTicks);
        if (end <= o.start) continue;
        // A note-on with velocity 0 *is* a note-off to every parser.
        var vel = Math.max(1, clamp(Math.round(o.vel), 1, 127));
        list.push(ev(o.start, ORDER_ON,  [0x90 | (channel & 0x0f), o.note, vel]));
        list.push(ev(end,     ORDER_OFF, [0x80 | (channel & 0x0f), o.note, 0x40]));
      }
    });
  }

  function buildMidi(pattern) {
    // An empty tempo box yields "" -> 0 -> Infinity microseconds, which
    // writes a tempo of zero and makes DAWs divide by it.
    var bpmRaw = Number(pattern.bpm);
    var bpm = clamp(isFinite(bpmRaw) && bpmRaw > 0 ? bpmRaw : BPM_DEFAULT, BPM_MIN, BPM_MAX);
    var steps = patternSteps(pattern);
    var total = loopTicks(pattern);
    var usPerQuarter = clamp(Math.round(60000000 / bpm), 1, 0xffffff);
    var seq = 0;
    function ev(tick, order, bytes) {
      return { tick: tick, order: order, seq: seq++, bytes: bytes };
    }

    /* Track 0 — tempo map */
    var t0 = [
      ev(0, ORDER_SETUP, metaEvent(0x03, ascii('Big Daddy Jam'))),
      ev(0, ORDER_SETUP, metaEvent(0x51, [
        (usPerQuarter >> 16) & 0xff, (usPerQuarter >> 8) & 0xff, usPerQuarter & 0xff
      ])),
      // 4/4, 24 MIDI clocks per metronome click, 8 32nds per quarter
      ev(0, ORDER_SETUP, metaEvent(0x58, [0x04, 0x02, 0x18, 0x08]))
    ];

    /* One track per keyboard layer that actually has notes in it, each
       on its own channel with its own patch, so they arrive in a DAW as
       separate parts you can mute and edit independently. Channel 9 is
       skipped — that one is reserved for drums. */
    var layerTracks = [];
    var channel = 0;
    (pattern.layers || []).forEach(function (layer, idx) {
      if (!layer.notes.length) return;
      if (channel === 9) channel = 10;
      if (channel > 15) return;               // 16 channels, and that's that

      var vIdx = voiceIndex(layer.voice);
      var name = 'Layer ' + (idx + 1) + ' — ' + VOICES[vIdx].label;
      var trk = [
        ev(0, ORDER_SETUP, metaEvent(0x03, ascii(name))),
        ev(0, ORDER_SETUP, [0xc0 | channel, VOICES[vIdx].program & 0x7f])
      ];
      emitNotes(trk, channel, layer.notes.map(function (n) {
        var startTick = clamp(n.step, 0, steps - 1) * TICKS_PER_STEP;
        return {
          note: n.midi,
          vel: n.velocity || 100,
          start: startTick,
          end: startTick + clamp(n.len || 1, 1, steps) * TICKS_PER_STEP
        };
      }), ev, total);
      layerTracks.push(buildTrack(trk, total));
      channel++;
    });

    /* Drums on channel 10 (index 9). The program change picks the GM
       Standard Kit, which softsynths need and DAWs ignore. */
    var td = [
      ev(0, ORDER_SETUP, metaEvent(0x03, ascii('Drums'))),
      ev(0, ORDER_SETUP, [0xc9, 0x00])
    ];
    var hits = [];
    for (var l = 0; l < LANES.length; l++) {
      for (var s = 0; s < steps; s++) {
        if (!pattern.drums[l] || !pattern.drums[l][s]) continue;
        var tick = s * TICKS_PER_STEP;
        hits.push({ note: LANES[l].midi, vel: 110, start: tick, end: tick + 12 });
      }
    }
    emitNotes(td, 9, hits, ev, total);

    /* The sample lane is deliberately absent: a MIDI file carries notes,
       not audio, so there is nothing here that could represent it. */

    var tracks = [buildTrack(t0, total)].concat(layerTracks, [buildTrack(td, total)]);

    // The track count is derived, never hard-coded — a header that
    // disagrees with the chunks that follow makes parsers read past the
    // end of the file.
    var all = [0x4d, 0x54, 0x68, 0x64]
      .concat(u32(6), u16(1), u16(tracks.length), u16(TPQ));
    tracks.forEach(function (t) { all = all.concat(t); });

    return new Uint8Array(all);
  }

  function downloadMidi(pattern, filename) {
    var blob = new Blob([buildMidi(pattern)], { type: 'audio/midi' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = filename || 'big-daddy-jam.mid';
    a.rel = 'noopener';
    a.style.display = 'none';
    document.body.appendChild(a);   // Firefox won't click a detached anchor
    a.click();
    document.body.removeChild(a);
    // Safari aborts the save if the URL is revoked too eagerly.
    window.setTimeout(function () { URL.revokeObjectURL(url); }, 10000);
  }

  /* ---------------------------------------------------------------
     THE LOOP CODE
     A whole loop squeezed into a short, URL-safe string. This is what
     rides along in the email, and what a #loop=... link decodes.

       byte 0        magic (0xBD)
       byte 1        format version
       byte 2        bpm - 40
       byte 3        keyboard voice index
       bytes 4..15   6 drum lanes x 16 steps, as a bitmask
       byte 16       how many keyboard notes follow
       then 3 bytes each: step, midi note, length in steps

     The version byte means today's links keep working even if the
     format grows later.
     --------------------------------------------------------------- */

  var MAGIC = 0xbd, VERSION = 2;

  function toBase64Url(bytes) {
    var s = '';
    for (var i = 0; i < bytes.length; i++) s += String.fromCharCode(bytes[i]);
    return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  }

  function fromBase64Url(str) {
    var s = String(str).replace(/-/g, '+').replace(/_/g, '/');
    while (s.length % 4) s += '=';
    var bin = atob(s);
    var out = new Uint8Array(bin.length);
    for (var i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
    return out;
  }

  /* Pack an array of booleans into bytes, low bit first. */
  function packBits(arr, count) {
    var out = [];
    for (var byte = 0; byte * 8 < count; byte++) {
      var b = 0;
      for (var bit = 0; bit < 8; bit++) {
        var i = byte * 8 + bit;
        if (i < count && arr[i]) b |= (1 << bit);
      }
      out.push(b);
    }
    return out;
  }

  function unpackBits(bytes, offset, count) {
    var out = new Array(count);
    for (var i = 0; i < count; i++) {
      out[i] = !!(bytes[offset + (i >> 3)] & (1 << (i % 8)));
    }
    return out;
  }

  function bytesPerLane(count) { return Math.ceil(count / 8); }

  /* Format 2:
       byte 0        magic (0xBD)
       byte 1        version (2)
       byte 2        bpm - 40
       byte 3        step count
       byte 4        layer count
       then          6 drum lanes, each ceil(steps/8) bytes
       then per layer:
                     byte  voice index, with mute in bit 7 and solo in bit 6
                     byte  note count
                     3 bytes per note: step, midi, length in steps

     The sample lane is deliberately not in here. The audio can't travel,
     so a pattern of hits that make no sound would only confuse whoever
     opened the link. */
  function encodeLoop(pattern) {
    var steps = patternSteps(pattern);
    var layers = (pattern.layers || []).slice(0, MAX_LAYERS);

    var bytes = [
      MAGIC,
      VERSION,
      clamp(Math.round(pattern.bpm), 40, 295) - 40,
      steps,
      layers.length
    ];

    for (var l = 0; l < LANES.length; l++) {
      bytes = bytes.concat(packBits(pattern.drums[l] || [], steps));
    }

    layers.forEach(function (layer) {
      var flags = voiceIndex(layer.voice) & 0x0f;
      if (layer.muted) flags |= 0x80;
      if (layer.solo) flags |= 0x40;
      var notes = layer.notes.slice(0, MAX_NOTES);
      bytes.push(flags, notes.length);
      notes.forEach(function (n) {
        bytes.push(
          clamp(n.step, 0, steps - 1),
          clamp(n.midi, 0, 127),
          clamp(n.len || 1, 1, steps)
        );
      });
    });

    return toBase64Url(bytes);
  }

  /* Version 1 was a single 16-step bar with one keys track. Those links
     are still out in the world, so they're read and widened into the
     current shape rather than rejected: the old bar lands in the first
     half of the loop, and its notes become layer one. */
  function decodeV1(b) {
    var OLD_STEPS = 16, OLD_HEADER = 17;
    if (b.length < OLD_HEADER) return null;

    var p = emptyPattern(OLD_STEPS);
    p.bpm = clamp(b[2] + 40, BPM_MIN, BPM_MAX);
    p.layers[0].voice = (VOICES[b[3]] || VOICES[0]).id;

    for (var l = 0; l < LANES.length; l++) {
      var lo = b[4 + l * 2], hi = b[5 + l * 2];
      for (var s = 0; s < 8; s++) p.drums[l][s] = !!(lo & (1 << s));
      for (var s2 = 0; s2 < 8; s2++) p.drums[l][s2 + 8] = !!(hi & (1 << s2));
    }

    var count = b[16];
    if (b.length < OLD_HEADER + count * 3) return null;
    for (var i = 0; i < count; i++) {
      var o = OLD_HEADER + i * 3;
      p.layers[0].notes.push({
        step: clamp(b[o], 0, OLD_STEPS - 1),
        midi: clamp(b[o + 1], 0, 127),
        len: clamp(b[o + 2], 1, OLD_STEPS),
        velocity: 100
      });
    }
    return p;
  }

  /* Returns a pattern, or null if the code is damaged. Callers show a
     friendly message rather than letting anything throw. */
  function decodeLoop(code) {
    try {
      if (!code) return null;
      var b = fromBase64Url(code);
      if (b.length < 5 || b[0] !== MAGIC) return null;
      if (b[1] === 1) return decodeV1(b);
      if (b[1] !== VERSION) return null;

      var steps = (b[3] === 16 || b[3] === 32) ? b[3] : STEPS_DEFAULT;
      var layerCount = clamp(b[4], 0, MAX_LAYERS);
      var laneBytes = bytesPerLane(steps);
      var offset = 5;
      if (b.length < offset + LANES.length * laneBytes) return null;

      var p = emptyPattern(steps);
      p.bpm = clamp(b[2] + 40, BPM_MIN, BPM_MAX);

      for (var l = 0; l < LANES.length; l++) {
        var lane = unpackBits(b, offset, steps);
        for (var s = 0; s < steps; s++) p.drums[l][s] = !!lane[s];
        offset += laneBytes;
      }

      for (var li = 0; li < layerCount; li++) {
        if (offset + 2 > b.length) return null;
        var flags = b[offset++];
        var count = b[offset++];
        if (offset + count * 3 > b.length) return null;

        var layer = p.layers[li] || (p.layers[li] = emptyLayer());
        layer.voice = (VOICES[flags & 0x0f] || VOICES[0]).id;
        layer.muted = !!(flags & 0x80);
        layer.solo = !!(flags & 0x40);
        layer.notes = [];
        for (var n = 0; n < count; n++) {
          layer.notes.push({
            step: clamp(b[offset], 0, steps - 1),
            midi: clamp(b[offset + 1], 0, 127),
            len: clamp(b[offset + 2], 1, steps),
            velocity: 100
          });
          offset += 3;
        }
      }
      return p;
    } catch (e) {
      return null;
    }
  }

  /* ---------------------------------------------------------------
     COPY / PASTE
     Pure functions over a pattern, so they are easy to reason about
     and easy to test. `scope` is 'all', 'drums' or 'keys'.
     --------------------------------------------------------------- */

  function copyRange(pattern, fromStep, length, scope) {
    scope = scope || 'all';
    var clip = { length: length, scope: scope, drums: null, sample: null, layers: null };

    if (scope !== 'keys') {
      clip.drums = pattern.drums.map(function (row) {
        return row.slice(fromStep, fromStep + length);
      });
      clip.sample = (pattern.sample || []).slice(fromStep, fromStep + length);
    }
    if (scope !== 'drums') {
      clip.layers = pattern.layers.map(function (layer) {
        return layer.notes
          .filter(function (n) { return n.step >= fromStep && n.step < fromStep + length; })
          .map(function (n) {
            return { step: n.step - fromStep, midi: n.midi, len: n.len, velocity: n.velocity };
          });
      });
    }
    return clip;
  }

  /* Returns a new pattern with the clip written in at `atStep`. Whatever
     was already in the target range is replaced rather than layered on
     top, so pasting twice gives the same result as pasting once. */
  function pasteRange(pattern, clip, atStep) {
    if (!clip) return pattern;
    var steps = patternSteps(pattern);
    var len = Math.min(clip.length, steps - atStep);
    if (len <= 0) return pattern;

    var next = {
      bpm: pattern.bpm,
      steps: steps,
      drums: pattern.drums.map(function (row) { return row.slice(); }),
      sample: (pattern.sample || blankSteps(steps)).slice(),
      layers: pattern.layers.map(function (layer) {
        return {
          voice: layer.voice, muted: layer.muted, solo: layer.solo,
          notes: layer.notes.slice()
        };
      })
    };

    if (clip.drums) {
      for (var l = 0; l < next.drums.length; l++) {
        for (var s = 0; s < len; s++) next.drums[l][atStep + s] = !!clip.drums[l][s];
      }
      for (var s2 = 0; s2 < len; s2++) {
        next.sample[atStep + s2] = !!(clip.sample && clip.sample[s2]);
      }
    }

    if (clip.layers) {
      next.layers.forEach(function (layer, i) {
        // Clear the target window first, then drop the copied notes in.
        layer.notes = layer.notes.filter(function (n) {
          return n.step < atStep || n.step >= atStep + len;
        });
        (clip.layers[i] || []).forEach(function (n) {
          if (layer.notes.length >= MAX_NOTES) return;
          layer.notes.push({
            step: atStep + n.step, midi: n.midi, len: n.len, velocity: n.velocity || 100
          });
        });
      });
    }
    return next;
  }

  /* Is there anything at or past `fromStep`? Asked before shortening a
     loop, so the page can warn that the back half is about to go rather
     than silently dropping someone's work. */
  function contentBeyond(pattern, fromStep) {
    var steps = patternSteps(pattern);
    for (var s = fromStep; s < steps; s++) {
      for (var l = 0; l < pattern.drums.length; l++) {
        if (pattern.drums[l][s]) return true;
      }
      if (pattern.sample && pattern.sample[s]) return true;
    }
    return (pattern.layers || []).some(function (layer) {
      return layer.notes.some(function (n) { return n.step >= fromStep; });
    });
  }

  /* Returns a new pattern at a different length. Growing pads the new
     space with silence; shrinking keeps whatever fits and drops the rest,
     which is why callers check contentBeyond() first. Notes that would
     run past the new end are shortened to it, not thrown away. */
  function changeLength(pattern, nextSteps) {
    var cur = patternSteps(pattern);
    if (nextSteps !== 16 && nextSteps !== 32) return pattern;
    if (nextSteps === cur) return pattern;

    var fit = function (row) {
      var out = row.slice(0, nextSteps);
      while (out.length < nextSteps) out.push(false);
      return out;
    };

    return {
      bpm: pattern.bpm,
      steps: nextSteps,
      drums: pattern.drums.map(fit),
      sample: fit(pattern.sample || []),
      layers: pattern.layers.map(function (layer) {
        return {
          voice: layer.voice, muted: layer.muted, solo: layer.solo,
          notes: layer.notes
            .filter(function (n) { return n.step < nextSteps; })
            .map(function (n) {
              return {
                step: n.step, midi: n.midi, velocity: n.velocity,
                len: Math.min(n.len, nextSteps - n.step)
              };
            })
        };
      })
    };
  }

  /* The common case: make the back half match the front half. */
  function duplicateFirstHalf(pattern) {
    var half = patternSteps(pattern) / 2;
    return pasteRange(pattern, copyRange(pattern, 0, half, 'all'), half);
  }

  function isEmptyPattern(p) {
    var steps = patternSteps(p);
    if ((p.layers || []).some(function (ly) { return ly.notes.length; })) return false;
    for (var l = 0; l < p.drums.length; l++) {
      for (var s = 0; s < steps; s++) { if (p.drums[l][s]) return false; }
    }
    // A sample arrangement counts as work, even though the audio behind
    // it only leaves this machine on a deliberate publish.
    for (var s2 = 0; s2 < steps; s2++) { if (p.sample && p.sample[s2]) return false; }
    return true;
  }

  function countNotes(p) {
    return (p.layers || []).reduce(function (n, ly) { return n + ly.notes.length; }, 0);
  }

  /* ------------------------------------------------------------- */

  window.BDJam = {
    // shape
    STEPS_DEFAULT: STEPS_DEFAULT,
    STEPS_MAX: STEPS_MAX,
    LENGTHS: LENGTHS,
    patternSteps: patternSteps,
    changeLength: changeLength,
    contentBeyond: contentBeyond,
    STEPS_PER_BEAT: STEPS_PER_BEAT,
    MAX_LAYERS: MAX_LAYERS,
    LANES: LANES,
    VOICES: VOICES,
    BPM_MIN: BPM_MIN,
    BPM_MAX: BPM_MAX,
    BPM_DEFAULT: BPM_DEFAULT,
    MAX_NOTES: MAX_NOTES,
    MAX_SAMPLE_SECONDS: MAX_SAMPLE_SECONDS,
    emptyPattern: emptyPattern,
    emptyLayer: emptyLayer,
    isEmptyPattern: isEmptyPattern,
    countNotes: countNotes,

    // audio
    ensureAudio: ensureAudio,
    audioReady: audioReady,
    now: now,
    playNote: playNote,
    noteOn: noteOn,
    noteOff: noteOff,
    playDrum: playDrum,
    playClick: playClick,

    // the microphone sample pad
    micBlockedReason: micBlockedReason,
    recordSample: recordSample,
    stopSampleRecording: stopSampleRecording,
    isRecordingSample: isRecordingSample,
    playSample: playSample,
    hasSample: hasSample,
    clearSample: clearSample,
    sampleInfo: sampleInfo,
    sampleBlob: sampleBlob,
    loadSampleFromUrl: loadSampleFromUrl,
    useSample: useSample,
    activeSample: activeSample,
    encodeWav: encodeWav,

    // transport
    start: start,
    stop: stop,
    transportOwner: transportOwner,
    isPlaying: isPlaying,
    currentPlayStep: currentPlayStep,
    liveStep: liveStep,
    stepDuration: stepDuration,

    // arranging
    copyRange: copyRange,
    pasteRange: pasteRange,
    duplicateFirstHalf: duplicateFirstHalf,

    // export & sharing
    buildMidi: buildMidi,
    downloadMidi: downloadMidi,
    encodeLoop: encodeLoop,
    decodeLoop: decodeLoop
  };
})();
