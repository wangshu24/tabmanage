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

/**
 * Update priority tab with new information
 * This function is called by the chrome.tabs.onUpdated listener
 * @param {string} string -  ID of tab being updated
 * @param {Object} newTab - Chrome Tab object
 */
export async function updatePriorityTab(tabId, newTab) {
  let priorityTabs = await getPriorityTabs();
  if (priorityTabs.length === 0) {
    priorityTabs = null;
    return;
  }

  const index = priorityTabs.findIndex((t) => t.id === tabId);
  if (index !== -1) {
    if (newTab.url) priorityTabs[index].url = newTab.url;
    if (newTab.title) priorityTabs[index].title = newTab.title;
    if (newTab.favIconUrl) priorityTabs[index].favIconUrl = newTab.favIconUrl;
    chrome.storage.local.set({ priorityTabs: priorityTabs });
    console.log("Priority tab URL updated:", priorityTabs[index]);
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
  tabs.forEach((tab, i) => {
    const div = document.createElement("div");
    div.className = "tab-item";
    div.dataset.url = tab.url; // store url for lookup
    console.log("favicon hook check again: ", tab);
    div.innerHTML = `
      <span style="
       display:inline-block;
       min-width:18px;
       padding:2px 6px;
       margin-right:6px;
       background:#e0e0e0;
       color:#333;
       border-radius:4px;
       font-size:12px;
       font-weight:bold;
       text-align:center;
       font-family:monospace;">
      ${i + 1}
      </span>
      <img src="${tab.favIcon || "icons/default.png"}"
       alt="favicon" 
       style="width:16px; height:16px; margin-right:6px; vertical-align:middle;" />
      <strong>${tab.title}</strong>
      <span style="margin-left:6px; color:#666; font-size:12px;">${
        tab.url
      }</span>
`;

    container.appendChild(div);
  });
}
