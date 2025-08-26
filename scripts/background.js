import { getPriorityTabs, updatePriorityTab } from "./shared/priorityTab.js";
import { isDevBuild } from "./shared/devTool.js";

/************************************************************
 * CHROME SETUP
 * ----------------------------------------------------------
 * Handles integration with Chrome APIs (tabs, storage, etc.)
 ************************************************************/

const isDev = isDevBuild();

// Initialize extension configuration when extension is installed
chrome.runtime.onInstalled.addListener(() => {
  isDev && console.info("Extension installed");

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
        isDev && console.warn(`Could not discard tab ${tab.id}:`, err);
      }
    }
  }
});

// Message handler pipeline
// Listen for all messages
// From popup.js and overlay.js
chrome.runtime.onMessage.addListener(async (message) => {
  switch (message.action) {
    // Dev util
    case "getPriorityTabs":
      await getPriorityTabs();
      break;
    // Dev util
    case "displayDiscardedTabs":
      displayDiscardedTabs();
      break;
    case "displayInactiveTabs":
      displayInactiveTabs();
    case "displayAllTabs":
      displayAllTabs();
      break;
    // Handle priority tabs overlay and hotkey switch
    case "switchToTab":
      const { priorityTabs } = await chrome.storage.local.get("priorityTabs");
      const tabInfo = priorityTabs?.[message.index];
      if (tabInfo && tabInfo.id) {
        try {
          await chrome.tabs.update(tabInfo.id, { active: true });
        } catch (e) {
          isDev &&
            console.warn("Tab may be closed, removing from priority list");
        }
      }
      break;
    case "findDivergentTabs":
      findDivergentTabs();
      break;
    default:
      isDev && console.log("default message handler: ", message);
  }
});

// Handle alarms
chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name === "periodicCheck") {
    cleanTabs();
    await getPriorityTabs();
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
  isDev && console.log("tab removed: ", tabId);
  let { priorityTabs } = await chrome.storage.local.get("priorityTabs");
  priorityTabs = (priorityTabs || []).filter((t) => t.id !== tabId);
  await chrome.storage.local.set({ priorityTabs });
});

// Handle normal navigations (full reload, non-SPA)
// Fires when a tab updates (like URL change, title, status, etc.)
chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  if (changeInfo.status === "complete") {
    isDev && console.log("Tab URL changed (normal):", tabId, changeInfo, tab);
    await updatePriorityTab(tabId, tab);
  }
});

// Handle SPA navigations (history.pushState / replaceState)
// This catches URL changes without page reload
chrome.webNavigation.onHistoryStateUpdated.addListener(async (details) => {
  isDev && console.log("Tab URL changed (SPA):", details);
  await updatePriorityTab(details.tabId, details);
});

/************************************************************
 * SERVICE FUNCTIONS
 * ----------------------------------------------------------
 * Core helpers that manage business logic for the extension
 ************************************************************/

/**
 * Clean tabs by discarding inactive tabs.
 */
async function cleanTabs() {
  try {
    let tabs = await getAllNonActiveTabs();
    isDev && console.log("cleaning tabs: ", tabs);
    for (const tab of tabs) {
      if (!tabMatch(tab)) {
        try {
          chrome.tabs.discard(tab.id);
        } catch (err) {
          isDev && console.error("error discaring tabs: ", err);
        }
      }
    }
  } catch (err) {
    isDev && console.error("error from cleanTabs operation: ", err);
  }
}

/************************************************************
 * DEV UTILITIES
 * ----------------------------------------------------------
 * Debugging, monitoring, and testing-only helpers
 ************************************************************/

/**
 * Check if url is in local storage.
 * @param {Object} tab - Tab to check
 */
async function tabMatch(url) {
  const localStorage = await getPriorityTabs();
  return localStorage.some((tab) => url === tab.url);
}

/**
 * Display all tabs.
 */
async function displayAllTabs() {
  const tabs = await chrome.tabs.query({});
  isDev && console.log("all tabs: ", tabs);
}

/**
 * Display all discarded tabs.
 */
async function displayDiscardedTabs() {
  const tabs = await chrome.tabs.query({ discarded: true });
  isDev && console.log("discarded tabs: ", tabs);
}

/**
 * Get all inactive tabs.
 */
async function getAllNonActiveTabs() {
  const tabs = await chrome.tabs.query({
    active: false,
    audible: false,
    discarded: false,
    pinned: false,
  });
  return tabs;
}

/**
 * Display all inactive tabs.
 */
async function displayInactiveTabs() {
  const tabs = await getAllNonActiveTabs();
  isDev && console.log("displayInactiveTabs: ", tabs);

  for (const tab of tabs) {
    if (await tabMatch(tab)) {
      isDev &&
        console.info("found inactive pinned tab: ", tab.id, " ", tab.url);
    }
  }
}

/**
 * Find divergent tabs.
 */
async function findDivergentTabs() {
  isDev && console.info("findDivergentTabs");
  const tabs = await chrome.tabs.query({});
  const localStorage = await getPriorityTabs();

  let pinned = {};
  for (const storedTab of localStorage) {
    pinned[storedTab.id] = storedTab.url;
  }

  for (const tab of tabs) {
    if (pinned[tab.id] && pinned[tab.id] !== tab.url) {
      isDev &&
        console.warn(
          "found divergent tab: ",
          tab.id,
          " ",
          tab.url,
          " differ from ",
          pinned[tab.id]
        );
    }
  }
}
