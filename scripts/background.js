/************************************************************
 * CHROME SETUP
 * ----------------------------------------------------------
 * Handles integration with Chrome APIs (tabs, storage, etc.)
 ************************************************************/

// Initialize extension configuration when extension is installed
chrome.runtime.onInstalled.addListener(() => {
  chrome.alarms.create("periodicCheck", {
    delayInMinutes: 1, //first run after 1min
    periodInMinutes: 10, //periodic check every 10min
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

const extensions = "https://developer.chrome.com/docs/extensions";
const webstore = "https://developer.chrome.com/docs/webstore";

// Message handler pipeline
// Listen for all messages
// From popup.js and overlay.js
chrome.runtime.onMessage.addListener(async (message) => {
  switch (message.action) {
    // Dev util
    case "getLocalStorage":
      await getLocalStorage();
      break;

    // Dev util
    case "displayDiscardedTabs":
      displayDiscardedTabs();
      break;

    // Handle priority tabs overlay and hotkey switch
    case "switchToTab":
      const { priorityTabs } = await chrome.storage.local.get("priorityTabs");
      const tabInfo = priorityTabs?.[message.index];
      if (tabInfo && tabInfo.id) {
        try {
          await chrome.tabs.update(tabInfo.id, { active: true });
        } catch (e) {
          console.warn("Tab may be closed, removing from priority list");
        }
      }
      break;

    default:
      console.log("default message handler: ", message);
  }
});

// Handle alarms
chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === "periodicCheck") {
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
      await chrome.scripting.executeScript({
        target: { tabId: activeTab.id },
        files: ["scripts/overlay.js"],
      });
    }
  }
});

// Handle re-indexing priority tabs on inactive tabs removal
chrome.tabs.onRemoved.addListener(async (tabId) => {
  const { priorityTabs } = await chrome.storage.local.get("priorityTabs");
  const updatedPriorityTabs = priorityTabs.filter((tab) => tab.id !== tabId);
  await chrome.storage.local.set({ priorityTabs: updatedPriorityTabs });
});

/************************************************************
 * SERVICE FUNCTIONS
 * ----------------------------------------------------------
 * Core helpers that manage business logic for the extension
 ************************************************************/

/**
 * Get a value from chrome storage.
 * @param {string} key - The key to retrieve.
 * @returns {Promise<any>} A promise that resolves with the value.
 */
function getStorage(key) {
  return new Promise((resolve) => {
    chrome.storage.local.get(key, (result) => resolve(result[key]));
  });
}

/**
 * Clean tabs by discarding inactive tabs.
 */
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
          await chrome.tabs.discard(tab.id);
        } catch (err) {
          console.warn("error discaring tabs: ", err);
        }
      }
    }
  } catch (err) {
    console.warn("error from cleanTabs operation: ", err);
  }
}

/**
 * Get all tabs from local storage.
 */
async function getLocalStorage() {
  let { priorityTabs } = await chrome.storage.local.get("priorityTabs");
  return priorityTabs;
}

/************************************************************
 * DEV UTILITIES
 * ----------------------------------------------------------
 * Debugging, monitoring, and testing-only helpers
 ************************************************************/

/**
 * Log messages only when in dev mode.
 */
async function URLMatch(url) {
  localStorage = await getLocalStorage();
  return localStorage.some((tab) => url.includes(tab.url));
}

/**
 * Display all tabs.
 */
async function displayAllTabs() {
  tabs = await chrome.tabs.query({});
  console.log("all tabs: ", tabs);
}

/**
 * Display all discarded tabs.
 */
async function displayDiscardedTabs() {
  tabs = await chrome.tabs.query({ discarded: true });
  console.log("discarded tabs: ", tabs);
}

/**
 * Get all tabs from local storage.
 */
async function getLocalStorage() {
  const tabs = await getStorage("priorityTabs");
  console.log(tabs);
}

/**
 * Display all inactive tabs.
 */
function displayInactiveTabs() {
  chrome.tabs.query(
    { active: false, audible: false, discarded: false, pinned: false },
    (tabs) => {
      console.log("displayInactiveTabs: ", tabs);
      tabs.forEach((tab) => {
        if (URLMatch(tab.url)) {
          console.log("found inactive pinned tab: ", tab.id, " ", tab.url);
        }
      });
    }
  );
}
