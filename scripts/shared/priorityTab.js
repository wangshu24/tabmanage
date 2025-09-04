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

/**
 * Fetch current priority tabs from chrome.storage
 * @returns {Promise<Array>} - Array of {id, title, url, favIcon, key} objects
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
    isDev &&
      console.log("Priority tab URL updated check:", priorityTabs[index]);
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
 * Render priority tabs into a container
 * @param {Array} Array of {id, title, url, favIcon, key} objects - Render function
 */
export function renderPriorityTabs(tabs) {
  const container = document.getElementById("priority-tabs");
  container.innerHTML = "";
  tabs.forEach((tab, i) => {
    const div = document.createElement("div");
    div.className = "tab-item";
    div.dataset.id = tab.id;
    div.dataset.url = tab.url; // store url for lookup
    isDev && console.log("favicon hook check : ", tab);
    div.innerHTML = `
      <span class="tab-key">${i + 1}</span>
      <strong class="tab-title" title="${tab.url}">${tab.title}</strong>
      <button class="delete-btn" data-id="${tab.id}">✕</button>
    `;

    div.querySelector(".delete-btn").addEventListener("click", async () => {
      await removePriorityTab(tab.id);
    });
    container.appendChild(div);
  });
}

/**
 * Implicit key assignment for priority tab
 * Tracing the list of object keys
 * And implicitly assign the left most key to the new tab
 * If the new tab was not provided with a key,
 * @param {Object} tab - Chrome Tab object
 * @param {Array} localStorage - Array of {id, title, url, favIcon, key} objects
 * @return {Object} tab - Chrome Tab object with key assigned
 */
export async function implicitKeyPriorityTab(tab, localStorage) {
  let key = -1;
  if (localStorage.length === 0) {
    key = 1;
  } else {
    let keys = [];
    let hasZero = false;
    // Checking for 0 and sorting the rest
    // Mimic the order of numkeys on keyboard
    for (const t of localStorage) {
      if (t.key !== 0) {
        keys.push(t.key);
      } else {
        hasZero = true;
      }
    }
    keys = keys.sort((a, b) => a - b);
    // Find the first gap in the sequence
    for (let i = 0; i < keys.length; i++) {
      if (keys[i] !== i + 1) {
        key = i + 1;
        break;
      }
    }

    // If no gaps, check if 0 is available
    if (hasZero) {
      console.warn("0 key unavailable, please remove a tab to add more.");
      return;
    } else {
      key = 0;
    }
  }

  tab.key = key;
  return tab;
}

/**
 * Sort priority tabs by key
 * This function should be called whenever any addition, removal, or update to the priority tab happens
 * @param {Array} tabs - Array of {id, title, url, favIcon, key} objects
 */
export function sortPriorityTabs(tabs) {
  return tabs.sort((a, b) => a.key - b.key);
}
