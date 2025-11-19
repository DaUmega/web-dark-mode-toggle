// content.js
function injectPageScript() {
  const MARKER = 'data-udm-injected';
  if (document.querySelector(`script[${MARKER}]`)) return;

  const script = document.createElement('script');
  script.src = chrome.runtime.getURL('script.js');
  script.setAttribute(MARKER, '1');
  script.onload = () => script.remove();
  (document.head || document.documentElement).appendChild(script);
}

function applyDarkModeFromBackground() {
  chrome.runtime.sendMessage({ udmGetState: true }, (resp) => {
    window.postMessage({ udmApply: resp && resp.enabled }, "*");
  });
}

// Handle messages from background
chrome.runtime.onMessage.addListener((msg) => {
  if (msg.udmSet !== undefined) {
    window.postMessage({ udmApply: msg.udmSet }, "*");
  }
  if (msg.udmActivate !== undefined) {
    injectPageScript();
    window.postMessage({ udmApply: msg.udmActivate }, "*");
  }
});

// Relay messages from page to background
window.addEventListener("message", (e) => {
  if (e.data?.udmFromPage !== undefined) {
    chrome.runtime.sendMessage({ udmUserToggled: e.data.udmFromPage });
  }
});

// Inject on initial load
injectPageScript();
applyDarkModeFromBackground();

// SPA & href change support
(function watchNavigationChanges() {
  let lastHref = location.href;

  function handleUrlChange() {
    injectPageScript();
    applyDarkModeFromBackground();
  }

  const _push = history.pushState;
  history.pushState = function (...args) {
    const rv = _push.apply(this, args);
    handleUrlChange();
    return rv;
  };

  const _replace = history.replaceState;
  history.replaceState = function (...args) {
    const rv = _replace.apply(this, args);
    handleUrlChange();
    return rv;
  };

  window.addEventListener('popstate', handleUrlChange);

  // Detect programmatic href changes
  setInterval(() => {
    if (location.href !== lastHref) {
      lastHref = location.href;
      handleUrlChange();
    }
  }, 200);
})();
