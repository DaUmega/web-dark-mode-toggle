// background.js

async function getDarkModeState() {
  const stored = await chrome.storage.local.get({ darkMode: false });
  return stored.darkMode;
}

async function setDarkModeState(enabled) {
  await chrome.storage.local.set({ darkMode: enabled });
}

async function updateActionUI() {
  const enabled = await getDarkModeState();
  chrome.action.setTitle({ title: enabled ? "Dark Mode: ON" : "Dark Mode: OFF" });
  chrome.action.setBadgeText({ text: enabled ? "ON" : "" });
}

// Initialize UI
updateActionUI();

// Toggle dark mode on toolbar click
chrome.action.onClicked.addListener(async () => {
  const current = await getDarkModeState();
  const newState = !current;

  await setDarkModeState(newState);
  updateActionUI();

  // Broadcast to all tabs
  const tabs = await chrome.tabs.query({});
  for (const t of tabs) {
    if (t.id) {
      chrome.tabs.sendMessage(t.id, { udmSet: newState });
    }
  }
});

// Respond to content script requests for state
chrome.runtime.onMessage.addListener(async (msg, sender, send) => {
  if (msg.udmGetState) {
    const enabled = await getDarkModeState();
    send({ enabled });
  }

  if (msg.udmUserToggled !== undefined) {
    await setDarkModeState();
    updateActionUI();
    const tabs = await chrome.tabs.query({});
    for (const t of tabs) {
      if (t.id) chrome.tabs.sendMessage(t.id, { udmSet: msg.udmUserToggled });
    }
  }
});

function notifyTab(tabId) {
  if (!tabId) return;
  getDarkModeState().then(enabled => {
    chrome.tabs.sendMessage(tabId, { udmActivate: enabled }, () => { });
  });
}

// Notify tabs when updated or created
chrome.tabs.onUpdated.addListener((tabId, changeInfo) => {
  if (changeInfo.status === 'complete' || changeInfo.url) {
    notifyTab(tabId);
  }
});
chrome.tabs.onCreated.addListener((tab) => {
  if (tab.id) setTimeout(() => notifyTab(tab.id), 100);
});
