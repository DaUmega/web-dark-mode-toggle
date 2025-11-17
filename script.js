/*!
 * Standalone universal dark mode toggle that can be included via <script src="..."></script>
 * - Configure without editing this file using global vars:
 *   window.UNIVERSAL_DARK_MODE_OPTIONS = { exclude: ['.no-dark', 'no-dark2'], position: "bottom-right" }
 *   or legacy globals:
 *   window.UNIVERSAL_DARK_MODE_EXCLUDE = [...];
 *   window.UNIVERSAL_DARK_MODE_POSITION = "top-left";
 *
 * Position values supported:
 *  "top-left" | "top-center" | "top-right"
 *  "middle-left" | "middle-center" | "middle-right"
 *  "bottom-left" | "bottom-center" | "bottom-right"   (default)
 *
 * Author: DaUmega
 */

(function _UniversalDarkMode() {
  if (window.__UNIVERSAL_DARK_MODE_LOADED__) return;
  window.__UNIVERSAL_DARK_MODE_LOADED__ = true;

  const STORAGE_KEY = 'darkMode';
  const TOGGLE_ID = 'universal-dark-mode-toggle';
  const STYLE_ID = 'universal-dark-mode-sheet';
  const UDM_SUFFIX = Math.random().toString(36).slice(2,8);
  const HTML = document.documentElement;

  const userOpts = (window.UNIVERSAL_DARK_MODE_OPTIONS && typeof window.UNIVERSAL_DARK_MODE_OPTIONS === 'object')
    ? Object.assign({}, window.UNIVERSAL_DARK_MODE_OPTIONS)
    : {};

  const DEFAULT_POSITION = 'bottom-right';
  const POSITION = (userOpts.position || DEFAULT_POSITION).toLowerCase();
  const EXCLUDE = userOpts.exclude || [];

  const DEFAULT_THEME = {
    bg: '#0f0f10',
    surface: '#1e1e1e',
    text: '#eaeaea',
    muted: '#bdbdbd',
    accent: '#6EA8FE'
  };
  const THEME = Object.assign({}, DEFAULT_THEME, window.UNIVERSAL_DARK_MODE_THEME || {});

  const css = (x) => x.join("\n");

  if (!document.getElementById(STYLE_ID)) {
    const s = document.createElement("style");
    s.id = STYLE_ID;

    const rootClass = `udm-dark-${UDM_SUFFIX}`;
    const notExcluded = `:not(.udm-exclude):not([data-udm-exclude])`;

    s.textContent = css([
      `html.${rootClass} {
        --udm-bg: ${THEME.bg} !important;
        --udm-surface: ${THEME.surface} !important;
        --udm-text: ${THEME.text} !important;
        --udm-muted: ${THEME.muted} !important;
        --udm-accent: ${THEME.accent} !important;
        color-scheme: dark !important;
      }`,

      `html.${rootClass} ${notExcluded},
       html.${rootClass} ${notExcluded} * {
        background-color: var(--udm-bg) !important;
        color: var(--udm-text) !important;
        border-color: rgba(255,255,255,0.06) !important;
        text-shadow: none !important;
        box-shadow: none !important;
      }`,

      `html.${rootClass} ${notExcluded} [style*="background"] {
        filter: brightness(0.85) contrast(0.95) !important;
      }`,

      `html.${rootClass} ${notExcluded} a,
       html.${rootClass} ${notExcluded} a * {
        color: var(--udm-accent) !important;
      }`,

      `html.${rootClass} ${notExcluded} svg {
        fill: currentColor !important;
        stroke: currentColor !important;
      }`,

      `html.${rootClass} ${notExcluded} ::placeholder {
        color: rgba(255,255,255,0.45) !important;
      }`,

      `.udm-dim { filter: brightness(0.85) contrast(0.95) !important; background-color: transparent !important; }`,
      `.udm-exclude, [data-udm-exclude] { all: initial !important; }`
    ]);

    document.head.appendChild(s);
  }

  function markNodeExcluded(el) { try { el.classList.add("udm-exclude"); } catch(_){} }

  function applyExclusionsToNode(el) {
    if (!EXCLUDE) return;
    if (typeof EXCLUDE === "function") {
      if (EXCLUDE(el)) markNodeExcluded(el);
    } else if (Array.isArray(EXCLUDE)) {
      for (const rule of EXCLUDE) {
        try {
          if (typeof rule === "string" && el.matches(rule)) markNodeExcluded(el);
          else if (rule instanceof Element && el === rule) markNodeExcluded(el);
          else if (typeof rule === "function" && rule(el)) markNodeExcluded(el);
        } catch(_) {}
      }
    }
  }

  const rootClassName = `udm-dark-${UDM_SUFFIX}`;
  function enableDark() { HTML.classList.add(rootClassName); }
  function disableDark() { HTML.classList.remove(rootClassName); }
  function isEnabled() { return HTML.classList.contains(rootClassName); }

  const SPAObserver = new MutationObserver((muts) => {
    for (const m of muts) {
      if (m.removedNodes) {
        for (const n of m.removedNodes) {
          if (n.id === STYLE_ID) document.head.appendChild(n);
        }
      }
      if (m.addedNodes) {
        for (const n of m.addedNodes) {
          if (!(n instanceof Element)) continue;
          applyExclusionsToNode(n);
          if (isEnabled()) {
            n.querySelectorAll?.("img,video,picture,canvas,[style*='background']").forEach(x => {
              x.classList.add("udm-dim"); // dim all elements unconditionally
            });
          }
        }
      }
    }
  });

  SPAObserver.observe(document.documentElement, {
    subtree: true,
    childList: true
  });

  function buildPositionStyle(pos) {
    const base = { position: 'fixed', maxWidth: '35px', zIndex: 2147483647, background: 'transparent', border: '2px solid rgba(200,200,200,0.22)', borderRadius: '8px', fontSize: '1.4rem', cursor: 'pointer', padding: '6px', lineHeight: '1', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'transform 0.18s ease,border-color 0.18s ease,opacity 0.18s ease' };
    const gap = '15px';
    switch((pos||'').toLowerCase()){
      case 'top-left': Object.assign(base,{top:gap,left:gap}); break;
      case 'top-center': Object.assign(base,{top:gap,left:'50%',transform:'translateX(-50%)'}); break;
      case 'top-right': Object.assign(base,{top:gap,right:gap}); break;
      case 'middle-left': Object.assign(base,{top:'50%',left:gap,transform:'translateY(-50%)'}); break;
      case 'middle-center': Object.assign(base,{top:'50%',left:'50%',transform:'translate(-50%, -50%)'}); break;
      case 'middle-right': Object.assign(base,{top:'50%',right:gap,transform:'translateY(-50%)'}); break;
      case 'bottom-left': Object.assign(base,{bottom:gap,left:gap}); break;
      case 'bottom-center': Object.assign(base,{bottom:gap,left:'50%',transform:'translateX(-50%)'}); break;
      case 'bottom-right':
      default: Object.assign(base,{bottom:gap,right:gap}); break;
    }
    return base;
  }

  function ensureToggle() {
    let t = document.getElementById(TOGGLE_ID);
    if (!t) {
      t = document.createElement("button");
      t.id = TOGGLE_ID;
      t.textContent = "🌙";
      Object.assign(t.style, buildPositionStyle(POSITION));
      t.onclick = () => {
        const en = !isEnabled();
        en ? enableDark() : disableDark();
        t.textContent = en ? "☀️" : "🌙";
        localStorage.setItem(STORAGE_KEY, en ? "true" : "false");
      };
      document.body.appendChild(t);
    }
  }

  function init() {
    ensureToggle();
    if (localStorage.getItem(STORAGE_KEY) === "true") {
      enableDark();
      const t = document.getElementById(TOGGLE_ID);
      if (t) t.textContent = "☀️";
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init, { once: true });
  } else init();

  window.UNIVERSAL_DARK_MODE = {
    enable: enableDark,
    disable: disableDark,
    toggle() { document.getElementById(TOGGLE_ID)?.click() },
    isEnabled,
    setExclusions(v){ userOpts.exclude = v }
  };
})();
