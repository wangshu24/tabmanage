// Initial install con
chrome.runtime.onInstalled.addListener(() => {
  chrome.action.setBadgeText({
    text: "Inactive",
  });
  chrome.alarms.create("periodicCheck", {
    delayInMinutes: 1, //first run after 1min
    periodInMinutes: 1, //periodic check every 1min
  });

  chrome.storage.local.set({ pinnedTabs: [] });
});

// Execution on startup
// Can be configured as user setting
// For now, defaulted to discaring all none active tabs
// Can be extended to only keeping prioritized
chrome.runtime.onStartup.addListener(async () => {
  const tabs = await chrome.tabs.query({});
  for (const tab of tabs) {
    // Keep only active tab in each window loaded
    if (!tab.active && !tab.discarded) {
      try {
        await chrome.tabs.discard(tab.id);
      } catch (err) {
        console.warn(`Could not discard tab ${tab.id}:`, err);
      }
    }
  }
});

function displayTabs() {
  chrome.tabs.query(
    { active: false, audible: false, discarded: false, pinned: false },
    (tabs) => {
      tabs.forEach((tab) => {
        console.log(tab);
      });
    }
  );
}

async function displayLocalStorage() {
  tabs = await chrome.storage.local.get("pinnedTabs");
  console.log(tabs);
}

async function cleanTabs() {
  try {
    const tabs = await chrome.tabs.query({
      active: false,
      audible: false,
      discarded: false,
      pinned: false,
    });
    for (tab of tabs) {
      try {
        await chrome.tabs.discard(tab.id);
      } catch (err) {
        console.log("error discaring tabs: ", err);
      }
    }
  } catch (err) {
    console.log("error from cleanTabs operation: ", err);
  }
}

const extensions = "https://developer.chrome.com/docs/extensions";
const webstore = "https://developer.chrome.com/docs/webstore";

chrome.action.onClicked.addListener((tab) => {
  displayTabs();
  displayLocalStorage();
  if (tab.url.startsWith(extensions) || tab.url.startsWith(webstore)) {
    const prevState = chrome.action.getBadgeText({ tabId: tab.id });
    const nextState = prevState === "ON" ? "OFF" : "ON";

    chrome.action.setBadgeText({
      tabId: tab.id,
      text: nextState,
    });

    if (nextState === "ON") {
      chrome.scripting.insertCSS({
        files: ["focus-mode.css"],
        target: { tabId: tab.id },
      });
    } else if (nextState === "OFF") {
      chrome.scripting.removeCSS({
        files: ["focus-mode.css"],
        target: { tabId: tab.id },
      });
    }
  }
});

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === "periodicCheck") {
    console.log("performing periodic check");
    cleanTabs();
  }
});
