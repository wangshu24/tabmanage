// devTools.js
// Purpose: Developer-only diagnostic and inspection functions for tabs.
// Loaded dynamically only in dev/unpacked mode.

// Purpose: User-facing popup logic, with optional dev tools injection.
export function isDevBuild() {
  const manifest = chrome.runtime.getManifest();
  return !manifest.key; // true if unpacked, false if Web Store
}

export function setupDevTools() {
  const refreshBtn = document.getElementById("refresh");
  if (!refreshBtn) return;

  refreshBtn.addEventListener("click", () => {
    chrome.runtime.sendMessage({ action: "displayDiscardedTabs" });
    chrome.runtime.sendMessage({ action: "getPriorityTabs" });
    chrome.runtime.sendMessage({ action: "displayAllTabs" });
    chrome.runtime.sendMessage({ action: "displayInactiveTabs" });
    chrome.runtime.sendMessage({ action: "findDivergentTabs" });
  });
}
