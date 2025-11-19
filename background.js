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
