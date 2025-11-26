chrome.action.onClicked.addListener(async (tab) => {
    chrome.sidePanel.setOptions({
        tabId: tab.id,
        path: "index.html",
        enabled: true
    }).catch(() => { });

    chrome.sidePanel.open({ tabId: tab.id });
    let capturing = await chrome.tabs.captureVisibleTab(); // test
    console.log(capturing);
});
