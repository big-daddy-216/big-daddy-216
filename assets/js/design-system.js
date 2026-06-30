/* @ds-bundle: {"format":3,"namespace":"NashSMomDesignSystem_77335a","components":[{"name":"AlbumCover","sourcePath":"components/band/AlbumCover.jsx"},{"name":"AwardLaurel","sourcePath":"components/band/AwardLaurel.jsx"},{"name":"MemberPoster","sourcePath":"components/band/MemberPoster.jsx"},{"name":"SectionHeading","sourcePath":"components/band/SectionHeading.jsx"},{"name":"TourDate","sourcePath":"components/band/TourDate.jsx"},{"name":"Wordmark","sourcePath":"components/brand/Wordmark.jsx"},{"name":"Button","sourcePath":"components/core/Button.jsx"},{"name":"Card","sourcePath":"components/core/Card.jsx"},{"name":"Field","sourcePath":"components/core/Field.jsx"},{"name":"Stamp","sourcePath":"components/core/Stamp.jsx"}],"sourceHashes":{"components/band/AlbumCover.jsx":"2c9c7a87ea5d","components/band/AwardLaurel.jsx":"862b776290c4","components/band/MemberPoster.jsx":"d76bbfe89f1e","components/band/SectionHeading.jsx":"c0aa53f0648c","components/band/TourDate.jsx":"5714cf76d85d","components/brand/Wordmark.jsx":"2acc3fc68a52","components/core/Button.jsx":"3f9eb6c008c7","components/core/Card.jsx":"8e9d51e2f352","components/core/Field.jsx":"3455f3e26725","components/core/Stamp.jsx":"8222e89c6348","ui_kits/website/site-sections-1.jsx":"d2d4d555a6cb","ui_kits/website/site-sections-2.jsx":"8a227e5b23f5"},"inlinedExternals":[],"unexposedExports":[]} */

(() => {

const __ds_ns = (window.NashSMomDesignSystem_77335a = window.NashSMomDesignSystem_77335a || {});

const __ds_scope = {};

(__ds_ns.__errors = __ds_ns.__errors || []);

// components/band/AlbumCover.jsx
try { (() => {
/**
 * Nash's Mom — AlbumCover.
 * A floating record/album tile. Accepts cover art (src) or renders a typographic
 * cover from the title. Gentle bob animation + ember lift on hover. Used in the
 * floating discography section.
 */
function AlbumCover({
  title = 'Untitled',
  year = '',
  src = null,
  theme = 'ember',
  // 'ember' | 'volt' | 'flag' | 'mono'
  float = true,
  delay = 0,
  size = 200,
  onClick,
  style = {}
}) {
  const [hover, setHover] = React.useState(false);
  const themes = {
    ember: 'linear-gradient(150deg, #2A1606, #6E3A0B 55%, #11151F)',
    volt: 'linear-gradient(150deg, #06222F, #0B4C6E 55%, #11151F)',
    flag: 'linear-gradient(150deg, #2A0A06, #7A1C12 55%, #11151F)',
    mono: 'linear-gradient(150deg, #1B2230, #0B0E16 60%, #07090F)'
  };
  const accent = {
    ember: 'var(--ember-glow)',
    volt: 'var(--volt-glow)',
    flag: 'var(--rouge-500)',
    mono: 'var(--bone-300)'
  }[theme];
  const animName = `nm-bob-${delay}`;
  return /*#__PURE__*/React.createElement("div", {
    onMouseEnter: () => setHover(true),
    onMouseLeave: () => setHover(false),
    onClick: onClick,
    style: {
      width: size,
      height: size,
      flex: '0 0 auto',
      position: 'relative',
      borderRadius: 'var(--r-md)',
      overflow: 'hidden',
      cursor: onClick ? 'pointer' : 'default',
      boxShadow: hover ? 'var(--glow-ember-hot)' : 'var(--shadow-lg)',
      transform: hover ? 'translateY(-8px) scale(1.03)' : 'none',
      transition: 'transform var(--dur-med) var(--ease-out), box-shadow var(--dur-med) var(--ease-out)',
      animation: float ? `${animName} 6s ease-in-out ${delay}s infinite` : 'none',
      ...style
    }
  }, /*#__PURE__*/React.createElement("style", null, `@keyframes ${animName}{0%,100%{margin-top:0}50%{margin-top:-12px}}`), src ? /*#__PURE__*/React.createElement("img", {
    src: src,
    alt: title,
    style: {
      width: '100%',
      height: '100%',
      objectFit: 'cover'
    }
  }) : /*#__PURE__*/React.createElement("div", {
    style: {
      width: '100%',
      height: '100%',
      background: themes[theme],
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between',
      padding: 16,
      border: '1px solid var(--border-hairline)'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-stamp)',
      fontSize: 10,
      letterSpacing: '.2em',
      color: accent,
      textTransform: 'uppercase'
    }
  }, "Big Daddy & Co."), /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-display)',
      textTransform: 'uppercase',
      fontSize: size * 0.16,
      lineHeight: 0.9,
      color: 'var(--bone-100)',
      textShadow: '0 2px 18px rgba(0,0,0,.6)'
    }
  }, title)), /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      inset: 0,
      background: 'radial-gradient(120% 80% at 20% 0%, rgba(255,255,255,.12), rgba(0,0,0,0) 50%)',
      pointerEvents: 'none'
    }
  }), year && /*#__PURE__*/React.createElement("span", {
    style: {
      position: 'absolute',
      bottom: 8,
      right: 10,
      fontFamily: 'var(--font-stamp)',
      fontSize: 10,
      letterSpacing: '.12em',
      color: 'rgba(246,241,230,.7)'
    }
  }, year));
}
Object.assign(__ds_scope, { AlbumCover });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/band/AlbumCover.jsx", error: String((e && e.message) || e) }); }

// components/band/AwardLaurel.jsx
try { (() => {
/**
 * Nash's Mom — AwardLaurel.
 * Laurel-wreath accolade badge for Grammy noms & festival honors. PLACEHOLDER
 * copy by design — the band fills in real awards. Pure CSS laurels (no image).
 */
function AwardLaurel({
  title = 'Award Title',
  detail = 'Placeholder — add yours',
  year = '20XX',
  tone = 'ember',
  // 'ember' | 'volt' | 'bone'
  placeholder = true,
  style = {}
}) {
  const tones = {
    ember: 'var(--ember-glow)',
    volt: 'var(--volt-glow)',
    bone: 'var(--bone-200)'
  };
  const c = tones[tone] || tones.ember;
  const Leaf = ({
    flip
  }) => /*#__PURE__*/React.createElement("svg", {
    width: "26",
    height: "80",
    viewBox: "0 0 26 80",
    fill: "none",
    "aria-hidden": "true",
    style: {
      transform: flip ? 'scaleX(-1)' : 'none'
    }
  }, /*#__PURE__*/React.createElement("path", {
    d: "M22 4 C8 14 4 34 8 56 C9 64 12 72 16 78",
    stroke: c,
    strokeWidth: "2",
    fill: "none",
    strokeLinecap: "round"
  }), [12, 24, 36, 48, 60].map((y, i) => /*#__PURE__*/React.createElement("path", {
    key: i,
    d: `M${16 - i * 0.4} ${y} C${8 - i} ${y - 4} ${5 - i} ${y + 4} ${10 - i} ${y + 10}`,
    stroke: c,
    strokeWidth: "2",
    fill: "none",
    strokeLinecap: "round",
    opacity: "0.92"
  })));
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 4,
      padding: '8px 4px',
      position: 'relative',
      ...style
    }
  }, /*#__PURE__*/React.createElement(Leaf, null), /*#__PURE__*/React.createElement("div", {
    style: {
      textAlign: 'center',
      padding: '0 6px',
      minWidth: 130
    }
  }, placeholder && /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: 'var(--font-stamp)',
      fontSize: 9,
      letterSpacing: '.2em',
      color: '#D4AF37',
      textTransform: 'uppercase',
      marginBottom: 4
    }
  }, "\u2605 Award \u2605"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: 'var(--font-stamp)',
      fontSize: 11,
      letterSpacing: '.16em',
      color: c,
      textTransform: 'uppercase'
    }
  }, year), /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: 'var(--font-heading)',
      fontWeight: 600,
      fontSize: 17,
      color: 'var(--bone-100)',
      textTransform: 'uppercase',
      lineHeight: 1.05,
      margin: '2px 0'
    }
  }, title), /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: 'var(--font-body)',
      fontSize: 12,
      color: 'var(--bone-400)'
    }
  }, detail)), /*#__PURE__*/React.createElement(Leaf, {
    flip: true
  }));
}
Object.assign(__ds_scope, { AwardLaurel });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/band/AwardLaurel.jsx", error: String((e && e.message) || e) }); }

// components/band/MemberPoster.jsx
try { (() => {
/**
 * Nash's Mom — MemberPoster.
 * Band-member tile in the gritty tour-poster style. Shows the member's poster
 * art (src) with a name/instrument plate, OR a "WANTED" placeholder when the
 * member photo is missing (e.g. Tyler on drums).
 */
function MemberPoster({
  name = 'Member',
  nickname = '',
  instrument = '',
  src = null,
  wanted = false,
  reward = '$5,000',
  style = {}
}) {
  const [hover, setHover] = React.useState(false);
  if (wanted) {
    return /*#__PURE__*/React.createElement("div", {
      style: {
        position: 'relative',
        aspectRatio: '3/4',
        borderRadius: 'var(--r-sm)',
        background: '#E9DEC2',
        color: '#2A1C0C',
        overflow: 'hidden',
        border: '2px solid #2A1C0C',
        boxShadow: 'var(--shadow-lg)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '20px 16px',
        textAlign: 'center',
        fontFamily: 'var(--font-display)',
        ...style
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        fontFamily: 'var(--font-stamp)',
        letterSpacing: '.28em',
        fontSize: 11,
        marginBottom: 4
      }
    }, "\u2605 \u2605 \u2605"), /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 'clamp(40px,7vw,64px)',
        lineHeight: .82,
        letterSpacing: '.02em'
      }
    }, "Wanted"), /*#__PURE__*/React.createElement("div", {
      style: {
        fontFamily: 'var(--font-stamp)',
        letterSpacing: '.22em',
        fontSize: 11,
        margin: '6px 0 14px'
      }
    }, "Dead or Alive \xB7 For Drumming"), /*#__PURE__*/React.createElement("div", {
      style: {
        flex: 1,
        width: '100%',
        border: '2px solid #2A1C0C',
        background: '#cdbf9d',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundImage: 'repeating-linear-gradient(45deg, rgba(42,28,12,.06) 0 8px, transparent 8px 16px)'
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        fontFamily: 'var(--font-stamp)',
        fontSize: 13,
        letterSpacing: '.18em',
        opacity: .6,
        padding: 12
      }
    }, "\u25CD PHOTO PENDING")), /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 'clamp(24px,4vw,34px)',
        lineHeight: 1,
        marginTop: 12
      }
    }, name), /*#__PURE__*/React.createElement("div", {
      style: {
        fontFamily: 'var(--font-stamp)',
        letterSpacing: '.18em',
        fontSize: 11,
        marginTop: 4
      }
    }, instrument || 'Drums', " \xB7 Reward ", reward), /*#__PURE__*/React.createElement("div", {
      style: {
        fontFamily: 'var(--font-stamp)',
        letterSpacing: '.14em',
        fontSize: 9,
        marginTop: 10,
        opacity: .55
      }
    }, "Placeholder \u2014 drop in Tyler's poster"));
  }
  return /*#__PURE__*/React.createElement("div", {
    onMouseEnter: () => setHover(true),
    onMouseLeave: () => setHover(false),
    style: {
      position: 'relative',
      aspectRatio: '3/4',
      borderRadius: 'var(--r-sm)',
      overflow: 'hidden',
      border: '1px solid var(--border-hairline)',
      boxShadow: hover ? 'var(--glow-ember-hot)' : 'var(--shadow-lg)',
      transform: hover ? 'translateY(-6px)' : 'none',
      transition: 'transform var(--dur-med) var(--ease-out), box-shadow var(--dur-med) var(--ease-out)',
      ...style
    }
  }, src && /*#__PURE__*/React.createElement("img", {
    src: src,
    alt: name,
    style: {
      width: '100%',
      height: '100%',
      objectFit: 'cover',
      filter: hover ? 'none' : 'saturate(0.92) brightness(0.95)',
      transition: 'filter var(--dur-med), transform var(--dur-slow)',
      transform: hover ? 'scale(1.04)' : 'none'
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      inset: 0,
      background: 'var(--scrim-bottom)'
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      left: 16,
      right: 16,
      bottom: 16
    }
  }, nickname && /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: 'var(--font-stamp)',
      fontSize: 11,
      letterSpacing: '.18em',
      color: 'var(--ember-glow)',
      textTransform: 'uppercase'
    }
  }, nickname), /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: 'var(--font-display)',
      fontSize: 34,
      lineHeight: .9,
      color: 'var(--bone-100)',
      textTransform: 'uppercase',
      textShadow: '0 2px 16px rgba(0,0,0,.7)'
    }
  }, name), instrument && /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: 'var(--font-heading)',
      fontSize: 14,
      fontWeight: 500,
      color: 'var(--bone-300)',
      textTransform: 'uppercase',
      letterSpacing: '.08em',
      marginTop: 2
    }
  }, instrument)));
}
Object.assign(__ds_scope, { MemberPoster });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/band/MemberPoster.jsx", error: String((e && e.message) || e) }); }

// components/band/SectionHeading.jsx
try { (() => {
/**
 * Nash's Mom — SectionHeading.
 * Poster-style section header: typewriter kicker over a towering Anton display
 * line, with an optional ember rule. The recurring rhythm device across the site.
 */
function SectionHeading({
  kicker,
  title,
  align = 'left',
  // 'left' | 'center'
  rule = true,
  glow = false,
  style = {}
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      alignItems: align === 'center' ? 'center' : 'flex-start',
      textAlign: align,
      gap: 12,
      ...style
    }
  }, kicker && /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-stamp)',
      textTransform: 'uppercase',
      letterSpacing: '.2em',
      fontSize: 13,
      color: 'var(--ember-500)',
      display: 'inline-flex',
      alignItems: 'center',
      gap: 10
    }
  }, rule && /*#__PURE__*/React.createElement("span", {
    style: {
      width: 28,
      height: 2,
      background: 'var(--ember-500)'
    }
  }), kicker), /*#__PURE__*/React.createElement("h2", {
    style: {
      fontFamily: 'var(--font-display)',
      textTransform: 'uppercase',
      lineHeight: 0.92,
      letterSpacing: '-0.01em',
      fontSize: 'var(--fs-d1)',
      color: 'var(--bone-100)',
      margin: 0,
      textShadow: glow ? 'var(--text-glow-ember)' : 'none'
    }
  }, title));
}
Object.assign(__ds_scope, { SectionHeading });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/band/SectionHeading.jsx", error: String((e && e.message) || e) }); }

// components/brand/Wordmark.jsx
try { (() => {
/**
 * Big Daddy and Co. — Wordmark.
 * The band's logotype. "BIG DADDY" sits big in condensed Anton; "and Co." rides
 * smaller and offset, à la "Grateful Dead and Co.". Use in nav, hero, and footer.
 */
function Wordmark({
  size = 48,
  // px height of the BIG DADDY line
  layout = 'inline',
  // 'inline' | 'stacked'
  glow = false,
  tone = 'bone',
  // 'bone' | 'ember'
  style = {}
}) {
  const mainColor = tone === 'ember' ? 'var(--ember-glow)' : 'var(--bone-100)';
  const coSize = Math.round(size * 0.34);
  const main = /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-display)',
      textTransform: 'uppercase',
      fontSize: size,
      lineHeight: 0.86,
      letterSpacing: '-0.005em',
      color: mainColor,
      textShadow: glow ? 'var(--text-glow-ember)' : 'none'
    }
  }, "Big Daddy");
  const co = /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-stamp)',
      textTransform: 'uppercase',
      fontSize: coSize,
      letterSpacing: '.14em',
      color: 'var(--ember-500)',
      whiteSpace: 'nowrap'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontStyle: 'italic',
      textTransform: 'none',
      fontFamily: 'var(--font-body)',
      fontWeight: 500,
      color: 'var(--bone-300)'
    }
  }, "and"), ' ', "Co.");
  return /*#__PURE__*/React.createElement("span", {
    "aria-label": "Big Daddy and Co.",
    style: {
      display: 'inline-flex',
      flexDirection: layout === 'stacked' ? 'column' : 'row',
      alignItems: layout === 'stacked' ? 'flex-start' : 'baseline',
      gap: layout === 'stacked' ? 0 : Math.round(size * 0.18),
      lineHeight: 0.86,
      ...style
    }
  }, main, /*#__PURE__*/React.createElement("span", {
    style: {
      marginTop: layout === 'stacked' ? Math.round(size * 0.04) : 0
    }
  }, co));
}
Object.assign(__ds_scope, { Wordmark });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/brand/Wordmark.jsx", error: String((e && e.message) || e) }); }

// components/core/Button.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * Nash's Mom — Button.
 * Stage-ready CTA. Ember-filled primary glows like a hot spark; outline/ghost
 * for secondary actions. Uppercase Oswald, hard-ish edges.
 */
function Button({
  children,
  variant = 'primary',
  // 'primary' | 'outline' | 'ghost' | 'flag'
  size = 'md',
  // 'sm' | 'md' | 'lg'
  as = 'button',
  iconLeft = null,
  iconRight = null,
  disabled = false,
  style = {},
  ...rest
}) {
  const sizes = {
    sm: {
      padding: '8px 16px',
      fontSize: 13,
      letterSpacing: '.1em'
    },
    md: {
      padding: '12px 24px',
      fontSize: 15,
      letterSpacing: '.1em'
    },
    lg: {
      padding: '16px 34px',
      fontSize: 18,
      letterSpacing: '.08em'
    }
  };
  const base = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    fontFamily: 'var(--font-heading)',
    fontWeight: 600,
    textTransform: 'uppercase',
    border: '1px solid transparent',
    borderRadius: 'var(--r-sm)',
    cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.45 : 1,
    transition: 'transform var(--dur-fast) var(--ease-out), box-shadow var(--dur-med) var(--ease-out), background var(--dur-fast) var(--ease-out)',
    lineHeight: 1,
    whiteSpace: 'nowrap',
    ...sizes[size]
  };
  const variants = {
    primary: {
      background: 'var(--ember-500)',
      color: 'var(--text-on-ember)',
      boxShadow: 'var(--glow-ember)'
    },
    flag: {
      background: 'var(--rouge-500)',
      color: 'var(--bone-100)',
      boxShadow: 'var(--shadow-sm)'
    },
    outline: {
      background: 'transparent',
      color: 'var(--bone-100)',
      borderColor: 'var(--border-strong)'
    },
    ghost: {
      background: 'transparent',
      color: 'var(--bone-200)'
    }
  };
  const Tag = as;
  const [hover, setHover] = React.useState(false);
  const [press, setPress] = React.useState(false);
  const hoverFx = !disabled && hover ? variant === 'primary' ? {
    background: 'var(--ember-glow)',
    boxShadow: 'var(--glow-ember-hot)'
  } : variant === 'flag' ? {
    background: 'var(--rouge-600)'
  } : variant === 'outline' ? {
    borderColor: 'var(--ember-500)',
    color: 'var(--ember-glow)'
  } : {
    color: 'var(--ember-glow)'
  } : {};
  return /*#__PURE__*/React.createElement(Tag, _extends({
    style: {
      ...base,
      ...variants[variant],
      ...hoverFx,
      transform: !disabled && press ? 'translateY(1px) scale(0.985)' : 'none',
      ...style
    },
    disabled: Tag === 'button' ? disabled : undefined,
    onMouseEnter: () => setHover(true),
    onMouseLeave: () => {
      setHover(false);
      setPress(false);
    },
    onMouseDown: () => setPress(true),
    onMouseUp: () => setPress(false)
  }, rest), iconLeft, /*#__PURE__*/React.createElement("span", null, children), iconRight);
}
Object.assign(__ds_scope, { Button });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Button.jsx", error: String((e && e.message) || e) }); }

// components/core/Card.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * Nash's Mom — Card.
 * Dark road-case panel. Optional ember/volt edge glow on hover for interactive
 * cards. Use as a container for shows, albums, content blocks.
 */
function Card({
  children,
  interactive = false,
  glow = 'ember',
  // 'ember' | 'volt' | 'none'
  padding = 'var(--sp-5)',
  style = {},
  ...rest
}) {
  const [hover, setHover] = React.useState(false);
  const glows = {
    ember: 'var(--glow-ember)',
    volt: 'var(--glow-volt)',
    none: 'var(--shadow-md)'
  };
  return /*#__PURE__*/React.createElement("div", _extends({
    onMouseEnter: () => setHover(true),
    onMouseLeave: () => setHover(false),
    style: {
      position: 'relative',
      background: 'var(--surface-card)',
      border: '1px solid var(--border-hairline)',
      borderRadius: 'var(--r-lg)',
      padding,
      boxShadow: interactive && hover ? glows[glow] : 'var(--shadow-md)',
      borderColor: interactive && hover && glow !== 'none' ? glow === 'volt' ? 'var(--volt-500)' : 'var(--ember-500)' : 'var(--border-hairline)',
      transform: interactive && hover ? 'translateY(-3px)' : 'none',
      transition: 'all var(--dur-med) var(--ease-out)',
      cursor: interactive ? 'pointer' : 'default',
      ...style
    }
  }, rest), children);
}
Object.assign(__ds_scope, { Card });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Card.jsx", error: String((e && e.message) || e) }); }

// components/core/Field.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * Nash's Mom — Field.
 * Form control for the booking form: text, email, textarea, or select.
 * Dark inset, ember focus glow, stamp-style label.
 */
function Field({
  label,
  type = 'text',
  // 'text' | 'email' | 'tel' | 'textarea' | 'select'
  options = [],
  // for select: [{value,label}]
  required = false,
  hint = '',
  rows = 4,
  style = {},
  ...rest
}) {
  const [focus, setFocus] = React.useState(false);
  const controlStyle = {
    width: '100%',
    fontFamily: 'var(--font-body)',
    fontSize: 16,
    color: 'var(--bone-100)',
    background: 'var(--stage-black)',
    border: `1px solid ${focus ? 'var(--ember-500)' : 'var(--border-strong)'}`,
    borderRadius: 'var(--r-sm)',
    padding: '12px 14px',
    outline: 'none',
    boxShadow: focus ? 'var(--glow-ember)' : 'var(--inset-soft)',
    transition: 'border-color var(--dur-fast), box-shadow var(--dur-med)'
  };
  const handlers = {
    onFocus: () => setFocus(true),
    onBlur: () => setFocus(false)
  };
  return /*#__PURE__*/React.createElement("label", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 8,
      ...style
    }
  }, label && /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-stamp)',
      textTransform: 'uppercase',
      letterSpacing: '.14em',
      fontSize: 11,
      color: 'var(--bone-300)'
    }
  }, label, required && /*#__PURE__*/React.createElement("span", {
    style: {
      color: 'var(--ember-500)'
    }
  }, " \u2605")), type === 'textarea' ? /*#__PURE__*/React.createElement("textarea", _extends({
    rows: rows,
    required: required,
    style: {
      ...controlStyle,
      resize: 'vertical'
    }
  }, handlers, rest)) : type === 'select' ? /*#__PURE__*/React.createElement("select", _extends({
    required: required,
    style: controlStyle
  }, handlers, rest), options.map(o => /*#__PURE__*/React.createElement("option", {
    key: o.value,
    value: o.value,
    style: {
      background: 'var(--stage-800)'
    }
  }, o.label))) : /*#__PURE__*/React.createElement("input", _extends({
    type: type,
    required: required,
    style: controlStyle
  }, handlers, rest)), hint && /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 12,
      color: 'var(--bone-400)'
    }
  }, hint));
}
Object.assign(__ds_scope, { Field });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Field.jsx", error: String((e && e.message) || e) }); }

// components/core/Stamp.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * Nash's Mom — Stamp.
 * A ticket-stamp / status chip in typewriter Special Elite. Used for
 * "SOLD OUT", "ON SALE", venue tags, "21+", etc. Slightly rotated, inked edge.
 */
function Stamp({
  children,
  tone = 'ember',
  // 'ember' | 'volt' | 'flag' | 'bone' | 'sold'
  rotate = 0,
  outline = true,
  style = {},
  ...rest
}) {
  const tones = {
    ember: {
      color: 'var(--ember-500)',
      border: 'var(--ember-500)'
    },
    volt: {
      color: 'var(--volt-glow)',
      border: 'var(--volt-500)'
    },
    flag: {
      color: 'var(--rouge-500)',
      border: 'var(--rouge-500)'
    },
    bone: {
      color: 'var(--bone-300)',
      border: 'var(--border-strong)'
    },
    sold: {
      color: 'var(--bone-400)',
      border: 'var(--bone-400)'
    }
  };
  const t = tones[tone] || tones.ember;
  return /*#__PURE__*/React.createElement("span", _extends({
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: 6,
      fontFamily: 'var(--font-stamp)',
      textTransform: 'uppercase',
      letterSpacing: '.14em',
      fontSize: 11,
      lineHeight: 1,
      padding: '6px 10px',
      color: t.color,
      border: outline ? `1.5px solid ${t.border}` : 'none',
      borderRadius: 'var(--r-sm)',
      background: 'rgba(7,9,15,0.35)',
      transform: `rotate(${rotate}deg)`,
      textDecoration: tone === 'sold' ? 'line-through' : 'none',
      ...style
    }
  }, rest), children);
}
Object.assign(__ds_scope, { Stamp });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Stamp.jsx", error: String((e && e.message) || e) }); }

// components/band/TourDate.jsx
try { (() => {
/**
 * Nash's Mom — TourDate.
 * A single row in the tour list. Date block, city/venue, status stamp, and a
 * tickets CTA. Sold-out rows dim and disable. Built for "The Big Tour".
 */
function TourDate({
  month,
  day,
  city,
  venue,
  status = 'onsale',
  // 'onsale' | 'soldout' | 'lowtix'
  onTickets,
  style = {}
}) {
  const [hover, setHover] = React.useState(false);
  const sold = status === 'soldout';
  const statusStamp = {
    onsale: /*#__PURE__*/React.createElement(__ds_scope.Stamp, {
      tone: "volt",
      rotate: -2
    }, "On Sale"),
    lowtix: /*#__PURE__*/React.createElement(__ds_scope.Stamp, {
      tone: "ember",
      rotate: -2
    }, "Low Tix"),
    soldout: /*#__PURE__*/React.createElement(__ds_scope.Stamp, {
      tone: "sold",
      rotate: -2
    }, "Sold Out")
  }[status];
  return /*#__PURE__*/React.createElement("div", {
    onMouseEnter: () => setHover(true),
    onMouseLeave: () => setHover(false),
    style: {
      display: 'grid',
      gridTemplateColumns: '84px 1fr auto auto',
      alignItems: 'center',
      gap: 'var(--sp-5)',
      padding: '18px var(--sp-5)',
      borderBottom: '1px solid var(--border-hairline)',
      background: hover && !sold ? 'var(--surface-raised)' : 'transparent',
      opacity: sold ? 0.55 : 1,
      transition: 'background var(--dur-fast) var(--ease-out)',
      ...style
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      lineHeight: 1
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-stamp)',
      fontSize: 12,
      letterSpacing: '.12em',
      color: 'var(--ember-500)',
      textTransform: 'uppercase'
    }
  }, month), /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-display)',
      fontSize: 40,
      color: 'var(--bone-100)'
    }
  }, day)), /*#__PURE__*/React.createElement("div", {
    style: {
      minWidth: 0
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: 'var(--font-heading)',
      fontWeight: 600,
      fontSize: 22,
      color: 'var(--bone-100)',
      textTransform: 'uppercase',
      letterSpacing: '.01em'
    }
  }, city), /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: 'var(--font-body)',
      fontSize: 15,
      color: 'var(--bone-400)'
    }
  }, venue)), /*#__PURE__*/React.createElement("div", null, statusStamp), /*#__PURE__*/React.createElement("div", null, sold ? /*#__PURE__*/React.createElement(__ds_scope.Button, {
    variant: "ghost",
    size: "sm",
    disabled: true
  }, "Sold Out") : /*#__PURE__*/React.createElement(__ds_scope.Button, {
    variant: "primary",
    size: "sm",
    onClick: onTickets
  }, "Tickets")));
}
Object.assign(__ds_scope, { TourDate });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/band/TourDate.jsx", error: String((e && e.message) || e) }); }

// ui_kits/website/site-sections-1.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/* Big Daddy and Co. — website sections (part 1): Nav, Hero, Awards, Highlights.
   Composes primitives from the design-system bundle namespace. */

const {
  Wordmark,
  Button,
  Stamp,
  SectionHeading,
  AwardLaurel
} = window.NashSMomDesignSystem_77335a;
const NAV_LINKS = ['Shows', 'The Band', 'Records', 'Book Us'];
function Nav({
  onBook
}) {
  const [solid, setSolid] = React.useState(false);
  React.useEffect(() => {
    const el = document.querySelector('[data-scroll]') || window;
    const target = document.querySelector('[data-scroll]');
    const onScroll = () => setSolid((target ? target.scrollTop : window.scrollY) > 40);
    el.addEventListener('scroll', onScroll);
    return () => el.removeEventListener('scroll', onScroll);
  }, []);
  return /*#__PURE__*/React.createElement("header", {
    style: {
      position: 'sticky',
      top: 0,
      zIndex: 50,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '14px clamp(20px,5vw,64px)',
      background: solid ? 'rgba(7,9,15,0.86)' : 'transparent',
      backdropFilter: solid ? 'blur(10px) saturate(1.2)' : 'none',
      borderBottom: solid ? '1px solid var(--border-hairline)' : '1px solid transparent',
      transition: 'all var(--dur-med) var(--ease-out)'
    }
  }, /*#__PURE__*/React.createElement(Wordmark, {
    size: 34
  }), /*#__PURE__*/React.createElement("nav", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 28
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 26
    },
    className: "nm-navlinks"
  }, NAV_LINKS.map(l => /*#__PURE__*/React.createElement("a", {
    key: l,
    href: '#' + l.toLowerCase().replace(/\s/g, ''),
    style: {
      fontFamily: 'var(--font-heading)',
      fontWeight: 500,
      fontSize: 14,
      textTransform: 'uppercase',
      letterSpacing: '.1em',
      color: 'var(--bone-300)'
    },
    onMouseEnter: e => e.target.style.color = 'var(--ember-glow)',
    onMouseLeave: e => e.target.style.color = 'var(--bone-300)'
  }, l))), /*#__PURE__*/React.createElement(Button, {
    variant: "primary",
    size: "sm",
    onClick: onBook
  }, "Buy Tickets")));
}
function Hero({
  onTickets,
  onBook
}) {
  return /*#__PURE__*/React.createElement("section", {
    className: "nm-grain",
    style: {
      position: 'relative',
      minHeight: '92vh',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'flex-end',
      overflow: 'hidden',
      marginTop: '-72px',
      paddingTop: '72px'
    }
  }, /*#__PURE__*/React.createElement("img", {
    src: "../../assets/photos/arena-keys.jpg",
    alt: "Big Daddy and Co. live",
    style: {
      position: 'absolute',
      inset: 0,
      width: '100%',
      height: '100%',
      objectFit: 'cover',
      objectPosition: 'center 30%',
      filter: 'saturate(0.95) brightness(0.62)'
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      inset: 0,
      background: 'var(--scrim-full)'
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      inset: 0,
      background: 'var(--spot-ember)'
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'relative',
      zIndex: 3,
      padding: '0 clamp(20px,5vw,64px) clamp(48px,7vw,96px)',
      maxWidth: 1100
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 10,
      marginBottom: 22,
      flexWrap: 'wrap'
    }
  }, /*#__PURE__*/React.createElement(Stamp, {
    tone: "ember",
    rotate: -3
  }, "World Tour 2026"), /*#__PURE__*/React.createElement(Stamp, {
    tone: "volt",
    rotate: 2
  }, "New Record Out Now")), /*#__PURE__*/React.createElement(Wordmark, {
    size: 128,
    layout: "stacked",
    glow: true
  }), /*#__PURE__*/React.createElement("p", {
    style: {
      fontFamily: 'var(--font-body)',
      fontSize: 'var(--fs-lead)',
      color: 'var(--bone-200)',
      maxWidth: 600,
      marginTop: 24,
      lineHeight: 1.5
    }
  }, "A world-traveling jam band \u2014 equally at home in a sweaty basement and a sold-out arena. Four guys, a wall of keys, and a backwards cap."), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 14,
      marginTop: 30,
      flexWrap: 'wrap'
    }
  }, /*#__PURE__*/React.createElement(Button, {
    variant: "primary",
    size: "lg",
    onClick: onTickets
  }, "See Tour Dates"), /*#__PURE__*/React.createElement(Button, {
    variant: "outline",
    size: "lg",
    onClick: onBook
  }, "Book the Band"))));
}
function AwardsStrip() {
  const awards = [{
    year: '2025',
    title: 'Grammy Nomination',
    detail: 'Best Jam Performance',
    tone: 'ember'
  }, {
    year: '2024',
    title: 'Award Title Here',
    detail: 'Add your accolade',
    tone: 'bone'
  }, {
    year: '2024',
    title: 'Festival Honor',
    detail: 'Headliner — Add Fest',
    tone: 'volt'
  }, {
    year: '20XX',
    title: 'Your Award',
    detail: 'Placeholder — edit me',
    tone: 'bone'
  }];
  return /*#__PURE__*/React.createElement("section", {
    style: {
      borderTop: '1px solid var(--border-hairline)',
      borderBottom: '1px solid var(--border-hairline)',
      background: 'var(--surface-raised)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "nm-container",
    style: {
      padding: '28px clamp(20px,5vw,64px)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: 'var(--font-stamp)',
      fontSize: 11,
      letterSpacing: '.2em',
      textTransform: 'uppercase',
      color: 'var(--bone-400)',
      textAlign: 'center',
      marginBottom: 18
    }
  }, "\u2605 Accolades & Honors \xB7 placeholders \u2014 drop in your real awards \u2605"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 24,
      justifyContent: 'center',
      flexWrap: 'wrap'
    }
  }, awards.map((a, i) => /*#__PURE__*/React.createElement(AwardLaurel, _extends({
    key: i
  }, a))))));
}
function Highlights() {
  const shots = [{
    src: '../../assets/photos/arena-keys.jpg',
    cap: 'Sold-out arena · 18,000 strong',
    tall: true
  }, {
    src: '../../assets/photos/shred-shed-full.jpg',
    cap: 'The Shred Shed · where it started'
  }, {
    src: '../../assets/photos/shred-shed-wide.jpg',
    cap: 'Basement floor · stars & stripes'
  }];
  return /*#__PURE__*/React.createElement("section", {
    id: "shows",
    style: {
      padding: 'var(--section-y) 0'
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "nm-container"
  }, /*#__PURE__*/React.createElement(SectionHeading, {
    kicker: "Recent Highlights",
    title: "Live & Loud"
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: '1.4fr 1fr',
      gridAutoRows: '220px',
      gap: 16,
      marginTop: 40
    },
    className: "nm-highlights"
  }, shots.map((s, i) => /*#__PURE__*/React.createElement("figure", {
    key: i,
    className: "nm-grain",
    style: {
      position: 'relative',
      margin: 0,
      borderRadius: 'var(--r-md)',
      overflow: 'hidden',
      gridRow: s.tall ? 'span 2' : 'span 1',
      border: '1px solid var(--border-hairline)',
      boxShadow: 'var(--shadow-md)'
    }
  }, /*#__PURE__*/React.createElement("img", {
    src: s.src,
    alt: s.cap,
    style: {
      width: '100%',
      height: '100%',
      objectFit: 'cover',
      filter: 'saturate(0.95) brightness(0.82)'
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      inset: 0,
      background: 'var(--scrim-bottom)'
    }
  }), /*#__PURE__*/React.createElement("figcaption", {
    style: {
      position: 'absolute',
      left: 14,
      bottom: 12,
      zIndex: 3,
      fontFamily: 'var(--font-stamp)',
      fontSize: 11,
      letterSpacing: '.1em',
      color: 'var(--bone-100)',
      textTransform: 'uppercase'
    }
  }, s.cap))))));
}
Object.assign(window, {
  Nav,
  Hero,
  AwardsStrip,
  Highlights
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/website/site-sections-1.jsx", error: String((e && e.message) || e) }); }

// ui_kits/website/site-sections-2.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/* Big Daddy and Co. — website sections (part 2): Discography, Band, Big Tour, Booking, Footer. */

const {
  Wordmark: WM,
  Button: Btn,
  Stamp: Stmp,
  SectionHeading: SH,
  Card: Crd,
  AlbumCover: Album,
  MemberPoster: Poster,
  TourDate: Date,
  Field: Fld
} = window.NashSMomDesignSystem_77335a;
const ALBUMS = [{
  title: 'Shred Shed Sessions',
  year: '2022',
  theme: 'mono'
}, {
  title: 'Backwards & Barefoot',
  year: '2023',
  theme: 'ember'
}, {
  title: 'Pretzel Sunday',
  year: '2024',
  theme: 'flag'
}, {
  title: 'Arena Sized',
  year: '2026',
  theme: 'volt'
}];
function Discography() {
  return /*#__PURE__*/React.createElement("section", {
    id: "records",
    className: "nm-grain",
    style: {
      position: 'relative',
      padding: 'var(--section-y) 0',
      background: 'var(--stage-black)',
      borderTop: '1px solid var(--border-hairline)',
      overflow: 'hidden'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      inset: 0,
      background: 'var(--spot-ember)',
      opacity: 0.6
    }
  }), /*#__PURE__*/React.createElement("div", {
    className: "nm-container",
    style: {
      position: 'relative',
      zIndex: 2
    }
  }, /*#__PURE__*/React.createElement(SectionHeading, {
    kicker: "Discography",
    title: "The Records",
    align: "center",
    glow: true,
    style: {
      marginInline: 'auto'
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 'clamp(20px,4vw,56px)',
      justifyContent: 'center',
      flexWrap: 'wrap',
      marginTop: 56
    }
  }, ALBUMS.map((a, i) => /*#__PURE__*/React.createElement("div", {
    key: i,
    style: {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: 14
    }
  }, /*#__PURE__*/React.createElement(Album, _extends({}, a, {
    delay: i * 0.5,
    size: 190
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      textAlign: 'center'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: 'var(--font-heading)',
      fontWeight: 600,
      fontSize: 16,
      color: 'var(--bone-100)',
      textTransform: 'uppercase',
      letterSpacing: '.04em'
    }
  }, a.title), /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: 'var(--font-stamp)',
      fontSize: 11,
      color: 'var(--bone-400)',
      letterSpacing: '.1em'
    }
  }, a.year)))))));
}
const MEMBERS = [{
  src: '../../assets/posters/tim-keyboard-commando.jpg',
  nickname: 'The Keyboard Commando',
  name: 'Tim Nash',
  instrument: "Keys · Deborah's Son"
}, {
  src: '../../assets/posters/dylan-bass-legend.jpg',
  nickname: 'The Bass Legend',
  name: 'Dylan Merriman',
  instrument: 'Bass'
}, {
  src: '../../assets/posters/dirty-mike.jpg',
  nickname: 'On the Strings',
  name: 'Dirty Mike',
  instrument: 'Guitar'
}, {
  wanted: true,
  name: 'Tyler',
  instrument: 'Drums',
  reward: '$5,000'
}];
function TheBand() {
  return /*#__PURE__*/React.createElement("section", {
    id: "theband",
    style: {
      padding: 'var(--section-y) 0'
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "nm-container"
  }, /*#__PURE__*/React.createElement(SectionHeading, {
    kicker: "Wanted: Alive & On Stage",
    title: "The Band"
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
      gap: 20,
      marginTop: 40
    }
  }, MEMBERS.map((m, i) => /*#__PURE__*/React.createElement(Poster, _extends({
    key: i
  }, m))))));
}
const TOUR = [{
  month: 'AUG',
  day: '08',
  city: 'Asbury Park, NJ',
  venue: 'Stone Pony',
  status: 'soldout'
}, {
  month: 'AUG',
  day: '15',
  city: 'Brooklyn, NY',
  venue: 'Brooklyn Steel',
  status: 'lowtix'
}, {
  month: 'AUG',
  day: '23',
  city: 'Boston, MA',
  venue: 'Roadrunner',
  status: 'onsale'
}, {
  month: 'SEP',
  day: '05',
  city: 'Philadelphia, PA',
  venue: 'The Fillmore',
  status: 'onsale'
}, {
  month: 'SEP',
  day: '13',
  city: 'Washington, DC',
  venue: '9:30 Club',
  status: 'lowtix'
}, {
  month: 'SEP',
  day: '20',
  city: 'Richmond, VA',
  venue: 'The National',
  status: 'onsale'
}, {
  month: 'SEP',
  day: '27',
  city: 'Asheville, NC',
  venue: 'The Orange Peel',
  status: 'onsale'
}, {
  month: 'OCT',
  day: '04',
  city: 'Atlanta, GA',
  venue: 'Tabernacle',
  status: 'soldout'
}, {
  month: 'OCT',
  day: '11',
  city: 'Charleston, SC',
  venue: 'Music Farm',
  status: 'onsale'
}, {
  month: 'OCT',
  day: '18',
  city: 'Nashville, TN',
  venue: 'Ryman Auditorium',
  status: 'lowtix'
}, {
  month: 'OCT',
  day: '25',
  city: 'Miami, FL',
  venue: 'The Fillmore',
  status: 'onsale'
}];
function BigTour({
  onTickets
}) {
  return /*#__PURE__*/React.createElement("section", {
    id: "tour",
    className: "nm-grain",
    style: {
      position: 'relative',
      padding: 'var(--section-y) 0',
      background: 'var(--surface-raised)',
      borderTop: '1px solid var(--border-hairline)',
      borderBottom: '1px solid var(--border-hairline)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "nm-container",
    style: {
      position: 'relative',
      zIndex: 2
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'flex-end',
      justifyContent: 'space-between',
      flexWrap: 'wrap',
      gap: 16
    }
  }, /*#__PURE__*/React.createElement(SectionHeading, {
    kicker: "East Coast \xB7 Aug \u2013 Oct",
    title: "The Big Tour"
  }), /*#__PURE__*/React.createElement(Stmp, {
    tone: "ember",
    rotate: -2,
    style: {
      fontSize: 13
    }
  }, "11 Shows \xB7 All Ages")), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 40,
      borderTop: '1px solid var(--border-hairline)'
    }
  }, TOUR.map((t, i) => /*#__PURE__*/React.createElement(Date, _extends({
    key: i
  }, t, {
    onTickets: onTickets
  })))), /*#__PURE__*/React.createElement("p", {
    style: {
      fontFamily: 'var(--font-body)',
      fontSize: 14,
      color: 'var(--bone-400)',
      marginTop: 20
    }
  }, "More dates added weekly \u2014 international leg announced this fall. Want us in your city?", ' ', /*#__PURE__*/React.createElement("a", {
    href: "#book",
    style: {
      color: 'var(--ember-glow)'
    }
  }, "Get in touch."))));
}
function Booking({
  submitted,
  onSubmit
}) {
  return /*#__PURE__*/React.createElement("section", {
    id: "book",
    style: {
      padding: 'var(--section-y) 0'
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "nm-container",
    style: {
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: 'clamp(32px,5vw,80px)',
      alignItems: 'start'
    },
    className: "nm-booking"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement(SectionHeading, {
    kicker: "Book Us",
    title: /*#__PURE__*/React.createElement("span", null, "Bring The", /*#__PURE__*/React.createElement("br", null), "Big Tour Home")
  }), /*#__PURE__*/React.createElement("p", {
    style: {
      fontFamily: 'var(--font-body)',
      fontSize: 'var(--fs-lead)',
      color: 'var(--bone-300)',
      marginTop: 22,
      maxWidth: 440,
      lineHeight: 1.5
    }
  }, "Festivals, clubs, weddings, backyard pretzel parties \u2014 if there's a stage and a crowd, we'll be there. Tell us about the gig and our team will hit you back within 48 hours."), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 10,
      marginTop: 28,
      flexWrap: 'wrap'
    }
  }, /*#__PURE__*/React.createElement(Stmp, {
    tone: "bone"
  }, "No venue too small"), /*#__PURE__*/React.createElement(Stmp, {
    tone: "bone"
  }, "Will travel"), /*#__PURE__*/React.createElement(Stmp, {
    tone: "bone"
  }, "Have keys, will play"))), /*#__PURE__*/React.createElement(Crd, {
    padding: "clamp(24px,3vw,40px)"
  }, submitted ? /*#__PURE__*/React.createElement("div", {
    style: {
      textAlign: 'center',
      padding: '40px 0'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: 'var(--font-display)',
      fontSize: 44,
      color: 'var(--ember-glow)',
      textTransform: 'uppercase',
      lineHeight: 0.9
    }
  }, "You're In!"), /*#__PURE__*/React.createElement("p", {
    style: {
      color: 'var(--bone-300)',
      marginTop: 16
    }
  }, "Request received. We'll be in touch within 48 hours. Keep it loud.")) : /*#__PURE__*/React.createElement("form", {
    onSubmit: e => {
      e.preventDefault();
      onSubmit();
    },
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 18
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: 14
    }
  }, /*#__PURE__*/React.createElement(Fld, {
    label: "Your Name",
    placeholder: "Jane Promoter",
    required: true
  }), /*#__PURE__*/React.createElement(Fld, {
    label: "Email",
    type: "email",
    placeholder: "you@venue.com",
    required: true
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: 14
    }
  }, /*#__PURE__*/React.createElement(Fld, {
    label: "Venue / City",
    placeholder: "The Fillmore, Philly",
    required: true
  }), /*#__PURE__*/React.createElement(Fld, {
    label: "Event Type",
    type: "select",
    options: [{
      value: 'club',
      label: 'Club / Bar'
    }, {
      value: 'festival',
      label: 'Festival'
    }, {
      value: 'private',
      label: 'Private / Wedding'
    }, {
      value: 'arena',
      label: 'Arena / Theater'
    }, {
      value: 'basement',
      label: 'Backyard / Basement'
    }]
  })), /*#__PURE__*/React.createElement(Fld, {
    label: "Tell Us About The Gig",
    type: "textarea",
    rows: 4,
    placeholder: "Date, capacity, budget range, and how loud you want it."
  }), /*#__PURE__*/React.createElement(Btn, {
    variant: "primary",
    size: "lg",
    as: "button",
    type: "submit",
    style: {
      width: '100%'
    }
  }, "Send Booking Request")))));
}
function Footer() {
  return /*#__PURE__*/React.createElement("footer", {
    className: "nm-grain",
    style: {
      position: 'relative',
      background: 'var(--stage-black)',
      borderTop: '1px solid var(--border-hairline)',
      padding: '56px 0 36px'
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "nm-container",
    style: {
      position: 'relative',
      zIndex: 2
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      flexWrap: 'wrap',
      gap: 28
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement(WM, {
    size: 40,
    glow: true
  }), /*#__PURE__*/React.createElement("p", {
    style: {
      fontFamily: 'var(--font-stamp)',
      fontSize: 11,
      letterSpacing: '.14em',
      color: 'var(--bone-400)',
      marginTop: 14,
      textTransform: 'uppercase'
    }
  }, "Live from the Shred Shed to the world.")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 48,
      flexWrap: 'wrap'
    }
  }, [['Listen', ['Spotify', 'Apple Music', 'Bandcamp', 'YouTube']], ['Follow', ['Instagram', 'TikTok', 'X / Twitter']], ['Band', ['Tour', 'Merch', 'Press Kit', 'Book Us']]].map(([h, items]) => /*#__PURE__*/React.createElement("div", {
    key: h
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: 'var(--font-heading)',
      fontWeight: 600,
      fontSize: 13,
      textTransform: 'uppercase',
      letterSpacing: '.14em',
      color: 'var(--ember-500)',
      marginBottom: 12
    }
  }, h), items.map(it => /*#__PURE__*/React.createElement("a", {
    key: it,
    href: "#",
    style: {
      display: 'block',
      fontSize: 14,
      color: 'var(--bone-300)',
      marginBottom: 8
    },
    onMouseEnter: e => e.target.style.color = 'var(--bone-100)',
    onMouseLeave: e => e.target.style.color = 'var(--bone-300)'
  }, it)))))), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 40,
      paddingTop: 20,
      borderTop: '1px solid var(--border-hairline)',
      display: 'flex',
      justifyContent: 'space-between',
      flexWrap: 'wrap',
      gap: 10,
      fontFamily: 'var(--font-stamp)',
      fontSize: 10,
      letterSpacing: '.12em',
      color: 'var(--bone-400)',
      textTransform: 'uppercase'
    }
  }, /*#__PURE__*/React.createElement("span", null, "\xA9 2026 Big Daddy and Co. \xB7 All rights reserved"), /*#__PURE__*/React.createElement("span", null, "Booking \xB7 management@bigdaddyandco.com"))));
}
Object.assign(window, {
  Discography,
  TheBand,
  BigTour,
  Booking,
  Footer
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/website/site-sections-2.jsx", error: String((e && e.message) || e) }); }

__ds_ns.AlbumCover = __ds_scope.AlbumCover;

__ds_ns.AwardLaurel = __ds_scope.AwardLaurel;

__ds_ns.MemberPoster = __ds_scope.MemberPoster;

__ds_ns.SectionHeading = __ds_scope.SectionHeading;

__ds_ns.TourDate = __ds_scope.TourDate;

__ds_ns.Wordmark = __ds_scope.Wordmark;

__ds_ns.Button = __ds_scope.Button;

__ds_ns.Card = __ds_scope.Card;

__ds_ns.Field = __ds_scope.Field;

__ds_ns.Stamp = __ds_scope.Stamp;

})();
