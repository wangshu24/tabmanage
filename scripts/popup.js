import { renderPriorityTabs } from "./shared/priorityTab.js";
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
document.getElementById("add").addEventListener("click", async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

  chrome.storage.local.get("priorityTabs").then((result) => {
    let tabs = result.priorityTabs || [];
    const newTab = {
      id: tab.id,
      title: tab.title,
      url: tab.url,
      favIcon: tab.favIconUrl,
    };

    const isTabNew = tabs.some((t) => t.id === newTab.id);

    if (isTabNew) {
      // Tab already exists → blink its entry
      const existing = document.querySelector(
        `.tab-item[data-url="${CSS.escape(newTab.url)}"]`
      );
      if (existing) {
        existing.classList.remove("blink"); // restart animation if already applied
        void existing.offsetWidth; // force reflow
        existing.classList.add("blink");
      }
      return;
    }

    // Add new tab to local storage
    if (tabs.length >= 10) tabs.shift();
    tabs.push(newTab);
    chrome.storage.local.set({ priorityTabs: tabs });
  });
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
