// Inject script.js into MAIN world
function injectPageScript() {
  const script = document.createElement("script");
  script.src = chrome.runtime.getURL("script.js");
  script.onload = () => script.remove();
  document.documentElement.appendChild(script);
}

// Relay state from background → page
chrome.runtime.onMessage.addListener((msg) => {
  if (msg.udmSet !== undefined) {
    window.postMessage({ udmApply: msg.udmSet }, "*");
  }
});

// Relay page toggle → background
window.addEventListener("message", (e) => {
  if (e.data?.udmFromPage !== undefined) {
    chrome.runtime.sendMessage({ udmUserToggled: e.data.udmFromPage });
  }
});

// Inject immediately
injectPageScript();

// Ask background for initial state
chrome.runtime.sendMessage({ udmGetState: true }, (resp) => {
  window.postMessage({ udmApply: resp.enabled }, "*");
});
