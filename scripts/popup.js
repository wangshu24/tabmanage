import {
  renderPriorityTabs,
  implicitKeyPriorityTab,
  getPriorityTabs,
} from "./shared/priorityTab.js";
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

  let tabs = await getPriorityTabs();
  let newTab = {
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

  // Limit check
  if (tabs.length >= 10) {
    showLimitMessage(
      "Priority Tabs limit reached. Remove a tab before adding another."
    );
    return;
  }

  newTab = await implicitKeyPriorityTab(newTab, tabs);

  if (!newTab) {
    showLimitMessage(
      "All keyboard shortcuts (0-9) are taken. Remove a tab before adding another."
    );
    return;
  }

  isDev && console.log("Adding newTab: ", newTab);
  tabs.push(newTab);
  chrome.storage.local.set({ priorityTabs: tabs });
});

document.getElementById("flush").addEventListener("click", async () => {
  chrome.storage.local.set({ priorityTabs: [] });
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

// Function to show temporary flashing message
function showLimitMessage(msg) {
  const messageDiv = document.getElementById("message");
  if (!messageDiv) return;

  messageDiv.textContent = msg;
  messageDiv.classList.add("blink-outline");
  messageDiv.classList.remove("blink"); // reset animation
  void messageDiv.offsetWidth; // force reflow
  messageDiv.classList.add("blink"); // trigger blink

  // Clear message after animation completes (3 blinks × 0.5s)
  setTimeout(() => {
    messageDiv.textContent = "";
    messageDiv.classList.remove("blink");
  }, 5000);
}
