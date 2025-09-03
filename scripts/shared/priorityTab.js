import { isDevBuild } from "./devTool.js";
const isDev = isDevBuild();

// shared/priorityTabs.js
// ==================================================
// Shared utility module for managing priority tabs.
// Purpose: centralize all logic around fetching,
// adding, removing, and syncing tabs between popup
// and overlay UIs so there’s one source of truth.
//
// Responsibilities:
//   - Provide CRUD-like functions for priority tabs
//   - Keep storage and tab state in sync
//   - Expose a change listener for live UI updates
// ==================================================
// Data structures example:
//  {123456 :
//       {"key": 1,
//        "title": "Example Page",
//        "url": "https://example.com",
//        "favIconUrl": "https://example.com/favicon.ico"}
//  }

/**
 * Fetch current priority tabs from chrome.storage
 * @returns {Promise<Array>} - Array of {id, title} objects
 */
export async function getPriorityTabs() {
  let { priorityTabs } = await chrome.storage.local.get("priorityTabs");
  return priorityTabs || {};
}

/**
 * Add a new tab into priority list if not already included
 * @param {Object} tab - Chrome Tab object
 */
export async function addPriorityTab(tab, id) {
  let tabs = await getPriorityTabs();
  const keys = Object.keys(tabs).sort((a, b) => a - b);
  console.log(keys);
  if (!keys.some((t) => t.id === id)) {
    tabs[id] = {
      key: tab.key,
      title: tab.title,
      url: tab.url,
      favIconUrl: tab.favIcon,
    };
    await chrome.storage.local.set({ priorityTabs: tabs });
  }
}

/**
 * Remove a tab by its ID from priority list
 * @param {number} tabId - ID of the tab to remove
 */
export async function removePriorityTab(tabId) {
  let tabs = await getPriorityTabs();
  delete tabs.tabId;
  // tabs = tabs.filter((t) => t.id !== tabId);
  await chrome.storage.local.set({ priorityTabs: tabs });
}

/**
 * Setup listeners to auto-refresh when:
 *   1. priorityTabs storage changes
 *   2. a tab is closed
 * @param {function} callback - Render function to re-run
 */
export function listenPriorityTabsChanges(callback) {
  // Listen to storage updates (popup, overlay, background changes)
  chrome.storage.onChanged.addListener((changes, areaName) => {
    if (areaName === "local" && changes.priorityTabs) {
      callback(changes.priorityTabs.newValue || []);
    }
  });

  // Listen to tab close → auto-remove from storage
  chrome.tabs.onRemoved.addListener(async (tabId) => {
    await removePriorityTab(tabId);
    callback(await getPriorityTabs());
  });
}

/**
 * Update priority tab with new information
 * This function is called by the chrome.tabs.onUpdated listener
 * @param {string} string -  ID of tab being updated
 * @param {Object} newTab - Chrome Tab object
 */
export async function updatePriorityTab(tabId, newTab) {
  let priorityTabs = await getPriorityTabs();
  if (Object.keys(priorityTabs).length === 0) {
    priorityTabs = null;
    return;
  }

  if (priorityTabs[tabId]) {
    if (newTab.url) priorityTabs[tabId].url = newTab.url;
    if (newTab.title) priorityTabs[tabId].title = newTab.title;
    if (newTab.favIconUrl) priorityTabs[tabId].favIconUrl = newTab.favIconUrl;
    chrome.storage.local.set({ priorityTabs: priorityTabs });
    isDev &&
      console.log("Priority tab URL updated check:", priorityTabs[tabId]);
  }
}

/**
 * Forecful update priority tab with new information
 * This function is called by the chrome.webNavigation.onHistoryStateUpdated listener
 */
export async function forceUpdatePriorityTab(tabId, newTab) {
  let priorityTabs = await getPriorityTabs();
  if (priorityTabs.length === 0) {
    priorityTabs = null;
    return;
  }
}

/**
 * Render priority tabs into a container:
 *   1. priorityTabs storage changes
 *   2. a tab is closed
 * @param {Array} Array of {id, title} objects - Render function
 */
export function renderPriorityTabs(tabs) {
  const container = document.getElementById("priority-tabs");
  container.innerHTML = "";
  for (const [id, tab] of Object.entries(tabs)) {
    const div = document.createElement("div");
    div.className = "tab-item";
    div.dataset.id = id;
    div.dataset.url = tab.url; // store url for lookup
    isDev && console.log("favicon hook check : ", tab);
    div.innerHTML = `
      <span class="tab-key">${tab.key}</span>
      <strong class="tab-title" title="${tab.url}">${tab.title}</strong>
      <button class="delete-btn" data-id="${id}">✕</button>
      `;

    div.querySelector(".delete-btn").addEventListener("click", async () => {
      await removePriorityTab(id);
    });
    container.appendChild(div);
  }
}
