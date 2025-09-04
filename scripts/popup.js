import { renderPriorityTabs, getPriorityTabs } from "./shared/priorityTab.js";
import { isDevBuild, setupDevTools } from "./shared/devTool.js";

let isDev = false;
if (isDevBuild()) {
  // Dynamically import dev-only code
  setupDevTools();
  isDev = true;
} else {
  // Hide dev-only UI
  const refreshBtn = document.getElementById("refresh");
  if (refreshBtn) refreshBtn.style.display = "none";
  isDev = false;
}

// Add current tab to storage when clicked
// By default, when adding using the extension popup
// Tab will be added to the most right left available
// Key on the keyboard
document.getElementById("add").addEventListener("click", async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  isDev && console.log("Adding tab:", tab);

  let tabObjects = await getPriorityTabs();

  if (tabObjects[tab.id]) {
    // Tab already exists → blink its entry
    const existing = document.querySelector(`.tab-item[data-id="${tab.id}"]`);
    if (existing) {
      existing.classList.remove("blink"); // restart animation if already applied
      void existing.offsetWidth; // force reflow
      existing.classList.add("blink");
    }
    return;
  }

  // Find next available key (1-10)
  const existingKeys = Object.values(tabObjects)
    .map((t) => t.key)
    .sort((a, b) => a - b);
  let nextKey = 1;
  for (let i = 1; i <= 10; i++) {
    if (!existingKeys.includes(i)) {
      nextKey = i;
      break;
    }
  }

  // Don't add if we already have 10 tabs
  if (Object.keys(tabObjects).length >= 10) {
    isDev && console.log("Maximum tabs reached (10)");
    return;
  }

  // Add new tab to storage
  tabObjects[tab.id] = {
    key: nextKey,
    title: tab.title,
    url: tab.url,
    favIconUrl: tab.favIconUrl,
  };

  await chrome.storage.local.set({ priorityTabs: tabObjects });
  isDev && console.log("Tab added:", tabObjects[tab.id]);
});

document.getElementById("flush").addEventListener("click", async () => {
  chrome.storage.local.set({ priorityTabs: {} });
});

// Listen for changes and update UI live
chrome.storage.onChanged.addListener((changes, areaName) => {
  isDev && console.log("reading changes: ", changes);
  if (areaName === "local" && changes.priorityTabs) {
    renderPriorityTabs(changes.priorityTabs.newValue);
  }
});

// Render existing storage on popup open
chrome.storage.local.get("priorityTabs").then((result) => {
  renderPriorityTabs(result.priorityTabs);
});
