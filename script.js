/*!
 * Standalone universal dark mode toggle that can be included via <script src="..."></script>
 * - Configure without editing this file using global vars:
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

  const DEFAULT_THEME = {
    bg: '#0f0f10',
    surface: '#1e1e1e',
    text: '#dcdcdc',
    muted: '#9c9c9c',
    accent: '#8d99a5'
  };
  const THEME = Object.assign({}, DEFAULT_THEME, window.UNIVERSAL_DARK_MODE_THEME || {});

  const css = (x) => x.join("\n");

  if (!document.getElementById(STYLE_ID)) {
    const s = document.createElement("style");
    s.id = STYLE_ID;

    const rootClass = `udm-dark-${UDM_SUFFIX}`;

    s.textContent = css([
      `html.${rootClass} {
        --udm-bg: ${THEME.bg} !important;
        --udm-surface: ${THEME.surface} !important;
        --udm-text: ${THEME.text} !important;
        --udm-muted: ${THEME.muted} !important;
        --udm-accent: ${THEME.accent} !important;
        color-scheme: dark !important;
      }`,

      `html.${rootClass},
       html.${rootClass} * {
        background-color: var(--udm-bg) !important;
        color: var(--udm-text) !important;
        border-color: rgba(255,255,255,0.06) !important;
        text-shadow: none !important;
        box-shadow: none !important;
      }`,

      `html.${rootClass} [style*="background"] {
        filter: brightness(0.85) contrast(0.95) !important;
      }`,

      `html.${rootClass} a,
       html.${rootClass} a * {
        color: var(--udm-accent) !important;
      }`,

      `html.${rootClass} svg {
        fill: currentColor !important;
        stroke: currentColor !important;
      }`,

      `html.${rootClass} ::placeholder {
        color: rgba(255,255,255,0.45) !important;
      }`,

      `html.${rootClass} button {
        box-shadow: 0 1px 4px rgba(255,255,255,0.1) !important;
        border: 2px solid rgba(255,255,255,0.15) !important;
      }`,

      `.udm-dim { filter: brightness(0.85) contrast(0.95) !important; background-color: transparent !important; }`
    ]);

    document.head.appendChild(s);
  }

  const rootClassName = `udm-dark-${UDM_SUFFIX}`;
  function enableDark() { HTML.classList.add(rootClassName); localStorage.setItem(STORAGE_KEY, "true"); }
  function disableDark() { HTML.classList.remove(rootClassName); localStorage.setItem(STORAGE_KEY, "false"); }
  function isEnabled() { return HTML.classList.contains(rootClassName); }

  const SPAObserver = new MutationObserver((muts) => {
    for (const m of muts) {
      if (m.removedNodes) {
        for (const n of m.removedNodes) {
          if (n.id === STYLE_ID) document.head.appendChild(n);
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
    isEnabled
  };

  window.addEventListener("message", (e) => {
    if (e.data?.udmApply !== undefined) {
      const enabled = e.data.udmApply;
      if (enabled) window.UNIVERSAL_DARK_MODE.enable();
      else window.UNIVERSAL_DARK_MODE.disable();
      const tog = document.getElementById("universal-dark-mode-toggle");
      if (tog) tog.style.display = "none";
    }
  });
})();
