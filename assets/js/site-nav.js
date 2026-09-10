/* ===================================================================
   THE TOP BAR — one copy, used by every page.

   This used to be hand-copied JSX in each page, and the copies had
   already drifted apart: different links, different buttons, different
   ways of writing the same href. With four pages that gets worse, so it
   lives here now. Change a link once and every page follows.

   Written in plain React.createElement rather than JSX on purpose: this
   loads as an ordinary <script>, the way jam-engine.js does, so it does
   not have to wait for Babel to compile it in the browser.

   It is deliberately NOT in design-system.js — that file is generated,
   and anything hand-written in it gets wiped the next time it's rebuilt.

   Exposed as window.BDNav.
   =================================================================== */
(function () {
  'use strict';

  var e = React.createElement;

  /* `anchor: true` means the target is a section of the home page, so the
     href has to grow an "index.html" prefix everywhere except there. */
  var LINKS = [
    { label: 'Shows',       href: '#shows',     anchor: true,  key: 'shows' },
    { label: 'Music',       href: 'music.html',                key: 'music' },
    { label: 'Videos',      href: 'videos.html',               key: 'videos' },
    { label: 'The Band',    href: '#theband',   anchor: true,  key: 'theband' },
    { label: 'Jam With Us', href: 'jam.html',                  key: 'jam' }
  ];

  function hrefFor(link, onIndex) {
    if (!link.anchor) return link.href;
    return onIndex ? link.href : 'index.html' + link.href;
  }

  var linkStyle = {
    fontFamily: 'var(--font-heading)',
    fontWeight: 500,
    fontSize: 14,
    textTransform: 'uppercase',
    letterSpacing: '.1em',
    textDecoration: 'none'
  };

  /* ---------------------------------------------------------------
     The hamburger. Below 860px the link row is hidden, and until now
     nothing replaced it — on a phone the site had no navigation at all
     beyond the logo. With four pages that isn't survivable.
     --------------------------------------------------------------- */
  function MenuButton(props) {
    return e('button', {
      type: 'button',
      className: 'bd-navtoggle',
      'aria-expanded': props.open ? 'true' : 'false',
      'aria-controls': 'bd-navpanel',
      'aria-label': props.open ? 'Close menu' : 'Menu',
      onClick: props.onToggle
    }, e('span', { className: 'bd-navtoggle-bars', 'aria-hidden': 'true' },
      e('span', null), e('span', null), e('span', null)));
  }

  function Panel(props) {
    var panelRef = React.useRef(null);

    /* While the panel is open it owns the keyboard: Escape closes it and
       Tab cycles inside it rather than wandering into the page behind. */
    React.useEffect(function () {
      if (!props.open) return undefined;

      var root = document.documentElement;
      var previousOverflow = root.style.overflow;
      root.style.overflow = 'hidden';          // same trick lightbox.js uses

      function onKey(ev) {
        if (ev.key === 'Escape') { props.onClose(); return; }
        if (ev.key !== 'Tab' || !panelRef.current) return;

        var focusable = panelRef.current.querySelectorAll('a[href], button');
        if (!focusable.length) return;
        var first = focusable[0];
        var last = focusable[focusable.length - 1];

        if (ev.shiftKey && document.activeElement === first) {
          ev.preventDefault(); last.focus();
        } else if (!ev.shiftKey && document.activeElement === last) {
          ev.preventDefault(); first.focus();
        }
      }

      document.addEventListener('keydown', onKey);
      var firstLink = panelRef.current && panelRef.current.querySelector('a[href]');
      if (firstLink) firstLink.focus();

      return function () {
        document.removeEventListener('keydown', onKey);
        root.style.overflow = previousOverflow;
      };
    }, [props.open]);

    if (!props.open) return null;

    return e('div', {
      className: 'bd-navpanel',
      id: 'bd-navpanel',
      ref: panelRef,
      onClick: function (ev) { if (ev.target === ev.currentTarget) props.onClose(); }
    }, e('nav', { className: 'bd-navpanel-inner', 'aria-label': 'Site' },
      LINKS.map(function (l) {
        return e('a', {
          key: l.key,
          href: hrefFor(l, props.onIndex),
          className: 'bd-navpanel-link',
          'aria-current': props.current === l.key ? 'page' : null,
          onClick: props.onClose
        }, l.label);
      }),
      props.cta ? e('a', {
        href: props.cta.href || '#book',
        className: 'bd-navpanel-cta',
        onClick: props.onClose
      }, props.cta.label) : null
    ));
  }

  /* ---------------------------------------------------------------
     props:
       current  'shows' | 'music' | 'videos' | 'theband' | 'jam' | null
       onIndex  true when rendering on index.html, so anchors stay bare
       cta      { label, href } or { label, onClick } for the right-hand button
     --------------------------------------------------------------- */
  function Nav(props) {
    var current = props.current || null;
    var onIndex = !!props.onIndex;
    var cta = props.cta || null;

    var solidState = React.useState(false);
    var solid = solidState[0], setSolid = solidState[1];
    var openState = React.useState(false);
    var open = openState[0], setOpen = openState[1];

    React.useEffect(function () {
      function onScroll() { setSolid(window.scrollY > 40); }
      onScroll();
      window.addEventListener('scroll', onScroll, { passive: true });
      return function () { window.removeEventListener('scroll', onScroll); };
    }, []);

    /* A phone rotated to landscape can cross the breakpoint with the panel
       still open, leaving the page scroll-locked behind a hidden panel. */
    React.useEffect(function () {
      if (!open) return undefined;
      function onResize() { if (window.innerWidth > 860) setOpen(false); }
      window.addEventListener('resize', onResize);
      return function () { window.removeEventListener('resize', onResize); };
    }, [open]);

    var logo = e('img', {
      src: 'assets/brand/big-daddy-wordmark.svg',
      alt: 'Big Daddy and Co.',
      style: { height: 34, width: 'auto', display: 'block' }
    });

    return e('header', {
      className: 'bd-header' + (solid ? ' is-solid' : ''),
      style: {
        position: 'sticky', top: 0, zIndex: 50,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '14px clamp(20px,5vw,64px)',
        background: solid ? 'rgba(7,9,15,0.86)' : 'transparent',
        backdropFilter: solid ? 'blur(10px) saturate(1.2)' : 'none',
        WebkitBackdropFilter: solid ? 'blur(10px) saturate(1.2)' : 'none',
        borderBottom: '1px solid ' + (solid ? 'var(--border-hairline)' : 'transparent'),
        transition: 'background var(--dur-med) var(--ease-out), border-color var(--dur-med) var(--ease-out)'
      }
    },
      onIndex
        ? logo
        : e('a', { href: 'index.html', 'aria-label': 'Big Daddy and Co. — home',
                   style: { display: 'block', lineHeight: 0 } }, logo),

      e('nav', { style: { display: 'flex', alignItems: 'center', gap: 28 },
                 'aria-label': 'Main' },
        e('div', { className: 'nm-navlinks bd-navlinks', style: { display: 'flex', gap: 26 } },
          LINKS.map(function (l) {
            return e('a', {
              key: l.key,
              href: hrefFor(l, onIndex),
              className: 'bd-navlink' + (current === l.key ? ' is-current' : ''),
              'aria-current': current === l.key ? 'page' : null,
              style: linkStyle
            }, l.label);
          })
        ),
        cta ? e(window.NashSMomDesignSystem_77335a.Button, {
          variant: cta.variant || 'primary', size: 'sm',
          as: cta.href ? 'a' : 'button',
          href: cta.href,
          onClick: cta.onClick,
          className: 'bd-navcta'
        }, cta.label) : null,
        e(MenuButton, { open: open, onToggle: function () { setOpen(!open); } })
      ),

      e(Panel, {
        open: open, onClose: function () { setOpen(false); },
        current: current, onIndex: onIndex, cta: cta
      })
    );
  }

  window.BDNav = { Nav: Nav, LINKS: LINKS, hrefFor: hrefFor };
})();
