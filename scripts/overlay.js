(async function () {
  if (document.getElementById("priority-overlay")) return;

  const overlay = document.createElement("div");
  overlay.id = "priority-overlay";
  overlay.style = `
    position:fixed;top:20px;right:20px;
    background:rgba(0,0,0,0.8);color:white;
    padding:10px;border-radius:8px;
    font-family:sans-serif;z-index:999999;
    cursor: pointer;
  `;

  const { priorityTabs } = await chrome.storage.local.get("priorityTabs");
  const tabEntries = Object.entries(priorityTabs || {});

  // Sort by key for consistent ordering
  tabEntries.sort(([, a], [, b]) => a.key - b.key);

  overlay.innerHTML =
    "<b>Priority Tabs:</b><br>" +
    tabEntries.map(([, tab]) => `${tab.key}. ${tab.title}`).join("<br>") +
    "<br><small>Press 1 - 0 to switch</small>" +
    "<br><small>(Click to close · Press 1-0 to switch)</small>";

  document.body.appendChild(overlay);

  function removeOverlay() {
    document.removeEventListener("keydown", keyHandler);
    overlay.remove();
  }

  const keyHandler = (e) => {
    if (/^[0-9]$/.test(e.key)) {
      let keyNum = parseInt(e.key, 10);
      if (keyNum === 0) keyNum = 10; // map 0 → 10th tab

      // Find tab with matching key
      const tabEntry = tabEntries.find(([, tab]) => tab.key === keyNum);
      if (tabEntry) {
        const tabIndex = tabEntries.indexOf(tabEntry);
        chrome.runtime.sendMessage({ action: "switchToTab", numkey: tabIndex });
        removeOverlay();
      }
    } else {
      removeOverlay();
    }
    if (e.key === "Escape") removeOverlay();
  };

  document.addEventListener("keydown", keyHandler);
})();
