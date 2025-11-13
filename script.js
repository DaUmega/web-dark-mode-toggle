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

  const STORAGE_KEY = "darkMode";
  const TOGGLE_ID = "universal-dark-mode-toggle";
  const STYLE_ID = "universal-dark-mode-sheet";
  const SESSION_INIT = "udmInitialized";
  const SESSION_USER_TOGGLED = "udmUserToggled";
  const UDM_SUFFIX = Math.random().toString(36).slice(2,8); // e.g. 'a1b2c3', css name suffix to avoid collisions with site styles
  const BODY = document.body;
  let applyTimer = 0, observer = null;

  // read options from globals (user may set these before including this script)
  const userOpts = (window.UNIVERSAL_DARK_MODE_OPTIONS && typeof window.UNIVERSAL_DARK_MODE_OPTIONS === "object")
    ? window.UNIVERSAL_DARK_MODE_OPTIONS
    : {};

  // legacy global support
  if (!userOpts.exclude && Array.isArray(window.UNIVERSAL_DARK_MODE_EXCLUDE)) userOpts.exclude = window.UNIVERSAL_DARK_MODE_EXCLUDE;
  if (!userOpts.position && typeof window.UNIVERSAL_DARK_MODE_POSITION === "string") userOpts.position = window.UNIVERSAL_DARK_MODE_POSITION;

  const DEFAULT_POSITION = "bottom-right";
  const POSITION = (userOpts.position || DEFAULT_POSITION).toLowerCase();

  // Exclusions can be: array of CSS selectors (strings), array of DOM elements, a function(el) => boolean
  const EXCLUDE = userOpts.exclude || [];

  // insert stylesheet once
  if (!document.getElementById(STYLE_ID)) {
    const s = document.createElement("style");
    s.id = STYLE_ID;
    s.textContent = `
      .dark-mode-${UDM_SUFFIX} { --udm-bg-${UDM_SUFFIX}:#0f0f10; --udm-surface-${UDM_SUFFIX}:#1e1e1e; --udm-text-${UDM_SUFFIX}:#eaeaea; --udm-muted-${UDM_SUFFIX}:#bdbdbd; --udm-accent-${UDM_SUFFIX}:#eaeaea; }
      .dark-mode-${UDM_SUFFIX}, .dark-mode-${UDM_SUFFIX} body { background-color: var(--udm-bg-${UDM_SUFFIX}) !important; color: var(--udm-text-${UDM_SUFFIX}) !important; }
      .dark-mode-${UDM_SUFFIX} .udm-btn-${UDM_SUFFIX} { background:#2a2a2a !important; color:var(--udm-text-${UDM_SUFFIX}) !important; border:1px solid rgba(200,200,200,0.45) !important; border-radius:8px !important; box-shadow:0 0 10px rgba(200,200,200,0.18) !important; }
      .dark-mode-${UDM_SUFFIX} .udm-text-${UDM_SUFFIX} { color: var(--udm-text-${UDM_SUFFIX}) !important; }
      .dark-mode-${UDM_SUFFIX} .udm-panel-${UDM_SUFFIX} { background:var(--udm-surface-${UDM_SUFFIX}) !important; color:var(--udm-text-${UDM_SUFFIX}) !important; border:1px solid rgba(255,255,255,0.03) !important; box-shadow:0 6px 18px rgba(0,0,0,0.35) inset !important; }
      .udm-transition-${UDM_SUFFIX} * { transition: color 0.25s ease, background-color 0.25s ease, border-color 0.25s ease, box-shadow 0.25s ease !important; }
    `;
    document.head.appendChild(s);
  }

  function parseRgb(str) {
    if (!str) return null;
    const m = String(str).match(/rgba?\((\d+)[^\d]+(\d+)[^\d]+(\d+)/i);
    if (m) return [+m[1], +m[2], +m[3]];
    const h = (String(str).match(/^#([0-9a-f]{6})$/i) || [])[1];
    return h ? [parseInt(h.slice(0,2),16), parseInt(h.slice(2,4),16), parseInt(h.slice(4,6),16)] : null;
  }
  const brightness = rgb => rgb ? (rgb[0]*299 + rgb[1]*587 + rgb[2]*114)/1000 : 255;

  function isExcluded(el) {
    try {
      if (!EXCLUDE || !EXCLUDE.length) return false;
      // If user provided a function as exclude
      if (typeof EXCLUDE === "function") return !!EXCLUDE(el);
      // If EXCLUDE is array-like
      for (let sel of EXCLUDE) {
        if (!sel) continue;
        if (typeof sel === "string") {
          try { if (el.matches(sel)) return true; } catch(_) { /* invalid selector - skip */ }
        } else if (sel instanceof Element) {
          if (el === sel || sel.contains(el)) return true;
        } else if (typeof sel === "function") {
          try { if (sel(el)) return true; } catch(_) {}
        }
      }
    } catch (e) {}
    return false;
  }

  function applyDark() {
    clearTimeout(applyTimer);
    applyTimer = setTimeout(() => requestAnimationFrame(() => {
      const all = document.querySelectorAll("body *");
      for (let i = 0; i < all.length; i++) {
        const el = all[i];
        if (!el || el.dataset.udmProcessed || isExcluded(el)) continue;
        try {
          el.dataset.udmOriginalStyle = el.getAttribute("style") || "";
          const cs = getComputedStyle(el);
          const bg = cs.backgroundColor || "";
          const fs = parseFloat(cs.fontSize || 0);
          const added = [];
          if (el.tagName === "BUTTON" || el.getAttribute("role") === "button" ||
              (el.tagName === "INPUT" && ["button","submit","reset"].includes((el.type||"").toLowerCase()))) {
            added.push(`udm-btn-${UDM_SUFFIX}`); el.classList.add(`udm-btn-${UDM_SUFFIX}`);
          } else {
            const txt = (el.textContent || "").trim();
            if (txt) {
              added.push(`udm-text-${UDM_SUFFIX}`); 
              el.classList.add(`udm-text-${UDM_SUFFIX}`);
            }
            const rgb = parseRgb(bg);
            if ((rgb && brightness(rgb) > 150) || (cs.backgroundImage && cs.backgroundImage !== "none")) {
              added.push(`udm-panel-${UDM_SUFFIX}`); el.classList.add(`udm-panel-${UDM_SUFFIX}`);
            }
          }
          if (added.length) el.dataset.udmAddedClasses = added.join(" ");
          el.dataset.udmProcessed = "1";
        } catch (e) { /* ignore individual errors */ }
      }
    }), 50);
  }

  function restoreStyles() {
    clearTimeout(applyTimer);
    if (observer) { try { observer.disconnect(); } catch(_) {} }
    const processed = document.querySelectorAll("[data-udm-processed='1']");
    for (let i = 0; i < processed.length; i++) {
      const el = processed[i];
      try {
        const orig = el.dataset.udmOriginalStyle || "";
        if (orig) el.setAttribute("style", orig); else el.removeAttribute("style");
        (el.dataset.udmAddedClasses || "").split(/\s+/).forEach(c => c && el.classList.remove(c));
        delete el.dataset.udmProcessed; delete el.dataset.udmOriginalStyle; delete el.dataset.udmAddedClasses;
      } catch (e) {}
    }
    BODY.classList.remove(`dark-mode-${UDM_SUFFIX}`);
  }

  function buildPositionStyle(pos) {
    // returns an object of style properties to apply to the toggle element
    const base = { position: "fixed", maxWidth: "35px", zIndex: 2147483647, background: "transparent", border: "2px solid rgba(200,200,200,0.22)", borderRadius: "8px", fontSize: "1.4rem", cursor: "pointer", padding: "6px", lineHeight: "1", display: "flex", alignItems: "center", justifyContent: "center", transition: "transform 0.18s ease,border-color 0.18s ease,opacity 0.18s ease" };
    // defaults
    const gap = "15px";
    switch ((pos||"").toLowerCase()) {
      case "top-left": Object.assign(base, { top: gap, left: gap }); break;
      case "top-center": Object.assign(base, { top: gap, left: "50%", transform: "translateX(-50%)" }); break;
      case "top-right": Object.assign(base, { top: gap, right: gap }); break;
      case "middle-left": Object.assign(base, { top: "50%", left: gap, transform: "translateY(-50%)" }); break;
      case "middle-center": Object.assign(base, { top: "50%", left: "50%", transform: "translate(-50%, -50%)" }); break;
      case "middle-right": Object.assign(base, { top: "50%", right: gap, transform: "translateY(-50%)" }); break;
      case "bottom-left": Object.assign(base, { bottom: gap, left: gap }); break;
      case "bottom-center": Object.assign(base, { bottom: gap, left: "50%", transform: "translateX(-50%)" }); break;
      case "bottom-right":
      default: Object.assign(base, { bottom: gap, right: gap }); break;
    }
    return base;
  }

  function ensureToggle() {
    let t = document.getElementById(TOGGLE_ID);
    if (!t) {
      t = Object.assign(document.createElement("button"), {
        id: TOGGLE_ID,
        ariaLabel: "Toggle dark mode",
        textContent: "🌙",
        onclick() {
          const enabled = BODY.classList.toggle(`dark-mode-${UDM_SUFFIX}`);
          this.textContent = enabled ? "☀️" : "🌙";
          sessionStorage.setItem(SESSION_USER_TOGGLED, "1");
          localStorage.setItem(STORAGE_KEY, enabled ? "true" : "false");
          if (enabled) {
            BODY.classList.add(`udm-transition-${UDM_SUFFIX}`);
            applyDark();
            startObserver();
            setTimeout(() => BODY.classList.remove(`udm-transition-${UDM_SUFFIX}`), 260);
          } else restoreStyles();
        }
      });
      const styleObj = buildPositionStyle(POSITION);
      Object.assign(t.style, styleObj);
      t.onmouseenter = () => { t.style.transform = (t.style.transform ? t.style.transform + " scale(1.15)" : "scale(1.15)"); t.style.borderColor = "rgba(200,200,200,0.7)"; };
      t.onmouseleave = () => { // remove scale only, keep translate if present
        const tx = (styleObj.transform || "");
        t.style.transform = tx;
        t.style.borderColor = "rgba(200,200,200,0.22)";
      };
      // small accessibility: allow keyboard toggle
      t.addEventListener("keydown", (ev) => { if (ev.key === "Enter" || ev.key === " ") { ev.preventDefault(); t.click(); }});
      document.body.appendChild(t);
    } else {
      // update position if user changed global before load or at runtime
      Object.assign(t.style, buildPositionStyle(POSITION));
    }
    return t;
  }

  function startObserver() {
    try {
      if (observer) observer.disconnect();
      observer = new MutationObserver(muts => {
        if (!isEnabled()) return;
        for (let m of muts) {
          if (m.addedNodes && m.addedNodes.length) { applyDark(); break; }
        }
      });
      observer.observe(document.body, { childList: true, subtree: true });
    } catch (e) { /* noop */ }
  }

  const isEnabled = () => BODY.classList.contains(`dark-mode-${UDM_SUFFIX}`);

  function init() {
    const toggle = ensureToggle();
    const saved = localStorage.getItem(STORAGE_KEY);
    const inited = sessionStorage.getItem(SESSION_INIT);
    if (!inited) {
      sessionStorage.setItem(SESSION_INIT, "1");
      toggle.textContent = saved === "true" ? "☀️" : "🌙";
      return;
    }
    const userToggled = sessionStorage.getItem(SESSION_USER_TOGGLED);
    if (userToggled === "1" || saved === "true") {
      BODY.classList.toggle(`dark-mode-${UDM_SUFFIX}`, saved === "true");
      toggle.textContent = saved === "true" ? "☀️" : "🌙";
      if (saved === "true") { applyDark(); startObserver(); }
    } else toggle.textContent = "🌙";
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init, { once: true });
  else init();

  window.addEventListener("popstate", () => { clearTimeout(applyTimer); applyTimer = setTimeout(init, 40); });

  // expose a small API for runtime control if needed
  window.UNIVERSAL_DARK_MODE = {
    enable() { if (!isEnabled()) { document.getElementById(TOGGLE_ID)?.click(); } },
    disable() { if (isEnabled()) { document.getElementById(TOGGLE_ID)?.click(); } },
    toggle() { document.getElementById(TOGGLE_ID)?.click(); },
    isEnabled,
    // replace exclusions at runtime
    setExclusions(v) { if (Array.isArray(v) || typeof v === "function") { if (Array.isArray(v)) { userOpts.exclude = v; } else userOpts.exclude = v; } },
    // set position at runtime (one of the supported strings)
    setPosition(p) { if (typeof p === "string") { try { userOpts.position = p; const el = document.getElementById(TOGGLE_ID); Object.assign(el.style, buildPositionStyle(p)); } catch(_) {} } }
  };
})();
