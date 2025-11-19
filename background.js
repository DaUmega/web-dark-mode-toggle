// background.js
let globalEnabled = false;

function updateActionUI() {
  chrome.action.setTitle({
    title: globalEnabled ? "Dark Mode: ON" : "Dark Mode: OFF"
  });
  chrome.action.setBadgeText({ text: globalEnabled ? "ON" : "" });
}

chrome.action.onClicked.addListener(async (tab) => {
  globalEnabled = !globalEnabled;
  updateActionUI();

  // Broadcast to ALL tabs
  const tabs = await chrome.tabs.query({});
  for (const t of tabs) {
    if (t.id) {
      chrome.tabs.sendMessage(t.id, { udmSet: globalEnabled });
    }
  }
});

chrome.runtime.onMessage.addListener((msg, sender, send) => {
  if (msg.udmGetState) {
    send({ enabled: globalEnabled });
  }
});

function notifyTab(tabId) {
  if (!tabId) return;
  chrome.tabs.sendMessage(tabId, { udmActivate: globalEnabled }, () => {
    // sendMessage may fail if content script isn't ready; ignore errors
  });
}

// When a tab updates (navigation / load), ask the content script to ensure the page script is injected + activated
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' || changeInfo.url) {
    notifyTab(tabId);
  }
});

// When a new tab is created, notify it shortly after (give document_start a moment)
chrome.tabs.onCreated.addListener((tab) => {
  if (tab.id) {
    setTimeout(() => notifyTab(tab.id), 100);
  }
});
