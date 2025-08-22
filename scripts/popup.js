// Add current tab to storage
document.getElementById("add").addEventListener("click", async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

  chrome.storage.local.get("priorityTabs").then((result) => {
    let tabs = result.priorityTabs || [];
    const newTab = {
      id: tab.id,
      title: tab.title,
      url: tab.url,
      // favIcon: tab.favIconUrl
    };

    const isTabNew = tabs.some((t) => t.url === newTab.url);

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

    // Add new tab
    if (tabs.length >= 10) tabs.shift();
    tabs.push(newTab);
    chrome.storage.local.set({ priorityTabs: tabs });
  });
});

// Listen for changes and update UI live
chrome.storage.onChanged.addListener((changes, areaName) => {
  console.log("reading changes: ", changes);
  if (areaName === "local" && changes.priorityTabs) {
    renderPriorityTabs(changes.priorityTabs.newValue);
  }
});

// Render existing storage on popup open
chrome.storage.local.get("priorityTabs").then((result) => {
  renderPriorityTabs(result.priorityTabs);
});

// Helper: render tab list
function renderPriorityTabs(tabs) {
  const container = document.getElementById("priority-tabs");
  container.innerHTML = "";
  tabs.forEach((tab, i) => {
    const div = document.createElement("div");
    div.className = "tab-item";
    div.dataset.url = tab.url; // store url for lookup
    div.innerHTML = `<strong>${i + 1}. ${tab.title}</strong>
                     <span>${tab.url}</span>`;
    container.appendChild(div);
  });
}

document.getElementById("refresh").addEventListener("click", () => {
  chrome.runtime.sendMessage({ action: "displayDiscardedTabs" });
  chrome.runtime.sendMessage({ action: "getLocalStorage" });
});
