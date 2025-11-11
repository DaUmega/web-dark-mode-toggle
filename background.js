// background.js (service worker)
// On action click, inject the page-version of script.js into the page context,
// hide the in-page toggle button if present, then call the library toggle/enable.
//
// This tries to be minimal: we only need script.js as a web_accessible_resource.

chrome.action.onClicked.addListener(async (tab) => {
    if (!tab || !tab.id) return;
    try {
        // compute the extension-hosted URL for script.js and pass it to the page function
        const scriptUrl = chrome.runtime.getURL('script.js');

        await chrome.scripting.executeScript({
            target: { tabId: tab.id },
            // this function runs in the page (MAIN) context
            func: (url) => {
                try {
                    // create a script tag that loads the extension-hosted script.js
                    const s = document.createElement('script');
                    s.src = url;

                    s.onload = () => {
                        try {
                            // hide the page's in-page toggle button if it exists
                            const b = document.getElementById('universal-dark-mode-toggle');
                            if (b) b.style.display = 'none';

                            // call the library API (toggle if available, otherwise enable)
                            if (window.UNIVERSAL_DARK_MODE && typeof window.UNIVERSAL_DARK_MODE.toggle === 'function') {
                                window.UNIVERSAL_DARK_MODE.toggle();
                            } else if (window.UNIVERSAL_DARK_MODE && typeof window.UNIVERSAL_DARK_MODE.enable === 'function') {
                                window.UNIVERSAL_DARK_MODE.enable();
                            }
                        } catch (err) {
                            // swallow individual errors
                            console.error('UDM runner error', err);
                        } finally {
                            // remove the loader script element
                            try { s.parentNode && s.parentNode.removeChild(s); } catch (e) {}
                        }
                    };

                    s.onerror = (ev) => {
                        console.error('UDM loader failed to load script.js', ev);
                        try { s.parentNode && s.parentNode.removeChild(s); } catch (e) {}
                    };

                    (document.head || document.documentElement).appendChild(s);
                } catch (e) {
                    console.error('UDM inject func error', e);
                }
            },
            args: [scriptUrl],
            world: 'MAIN'
        });
    } catch (err) {
        console.error('UDM background injection failed:', err);
    }
});
