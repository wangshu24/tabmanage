// Initial install con
chrome.runtime.onInstalled.addListener(() => {
  chrome.action.setBadgeText({
    text: "Inactive",
  });
  chrome.alarms.create("periodicCheck", {
    delayInMinutes: 1, //first run after 10min
    periodInMinutes: 1, //periodic check every 8min
  });

  chrome.storage.local.set({ priorityTabs: [] });
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

// Discard tabs functionality
async function cleanTabs() {
  try {
    let tabs = await chrome.tabs.query({
      active: false,
      audible: false,
      discarded: false,
      pinned: false,
    });
    for (tab of tabs) {
      if (!URLMatch(tab.url)) {
        try {
          console.log("discarding tab: ", tab.id, " with url: ", tab.url);
          await chrome.tabs.discard(tab.id);
        } catch (err) {
          console.log("error discaring tabs: ", err);
        }
      }
    }
  } catch (err) {
    console.log("error from cleanTabs operation: ", err);
  }
}

function getStorage(key) {
  return new Promise((resolve) => {
    chrome.storage.local.get(key, (result) => resolve(result[key]));
  });
}

const extensions = "https://developer.chrome.com/docs/extensions";
const webstore = "https://developer.chrome.com/docs/webstore";

// Listen for messages from popup.js
chrome.runtime.onMessage.addListener(async (message) => {
  switch (message.action) {
    case "getLocalStorage":
      await getLocalStorage();
      break;
    case "displayDiscardedTabs":
      displayDiscardedTabs();
      break;
    case "switchToTab":
      console.log("switchToTab handler: ", message);
      break;
    default:
      console.log("default message handler: ", message);
  }
});

// Handle alarms
chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === "periodicCheck") {
    console.log("performing periodic check");
    cleanTabs();
    getLocalStorage();
  }
});

// Open chord overlay
// Handle open-priority-overlay command
chrome.commands.onCommand.addListener(async (command) => {
  if (command === "open-priority-overlay") {
    const [activeTab] = await chrome.tabs.query({
      active: true,
      currentWindow: true,
    });
    if (activeTab?.id) {
      console.log("injecting overlay.js");
      await chrome.scripting.executeScript({
        target: { tabId: activeTab.id },
        files: ["scripts/overlay.js"],
      });
    }
  }
});

// Switching tabs hotkey listener
chrome.runtime.onMessage.addListener(async (msg) => {
  console.log("switchToTab message triggered: ", msg);
  if (msg.action === "switchToTab") {
    const { priorityTabs } = await chrome.storage.local.get("priorityTabs");
    const tabInfo = priorityTabs?.[msg.index];
    if (tabInfo && tabInfo.id) {
      try {
        await chrome.tabs.update(tabInfo.id, { active: true });
      } catch (e) {
        console.warn("Tab may be closed, removing from priority list");
      }
    }
  }
});

//// Developer utilities function ////
async function URLMatch(url) {
  localStorage = await getLocalStorage();
  return localStorage.some((tab) => url.includes(tab.url));
}

async function displayAllTabs() {
  tabs = await chrome.tabs.query({});
  console.log("all tabs: ", tabs);
}

async function displayDiscardedTabs() {
  tabs = await chrome.tabs.query({ discarded: true });
  console.log("discarded tabs: ", tabs);
}

async function getLocalStorage() {
  const tabs = await getStorage("priorityTabs");
  console.log(tabs); // now this will show the updated list
}

function displayInactiveTabs() {
  chrome.tabs.query(
    { active: false, audible: false, discarded: false, pinned: false },
    (tabs) => {
      console.log("displayInactiveTabs: ", tabs);
      tabs.forEach((tab) => {
        if (URLMatch(tab.url)) {
          console.log("found match : ", tab.id, " ", tab.url);
        }
      });
    }
  );
}

async function getLocalStorage() {
  let { priorityTabs } = await chrome.storage.local.get("priorityTabs");
  return priorityTabs;
}
