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

/**
 * Fetch current priority tabs from chrome.storage
 * @returns {Promise<Array>} - Array of {id, title} objects
 */
export async function getPriorityTabs() {
  let { priorityTabs } = await chrome.storage.local.get("priorityTabs");
  return priorityTabs || [];
}

/**
 * Add a new tab into priority list if not already included
 * @param {Object} tab - Chrome Tab object
 */
export async function addPriorityTab(tab) {
  let tabs = await getPriorityTabs();
  if (!tabs.some((t) => t.id === tab.id)) {
    tabs.push({ id: tab.id, title: tab.title });
    await chrome.storage.local.set({ priorityTabs: tabs });
  }
}

/**
 * Remove a tab by its ID from priority list
 * @param {number} tabId - ID of the tab to remove
 */
export async function removePriorityTab(tabId) {
  let tabs = await getPriorityTabs();
  tabs = tabs.filter((t) => t.id !== tabId);
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
