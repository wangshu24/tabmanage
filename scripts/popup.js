// Add current tab to storage
document.getElementById("add").addEventListener("click", async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

  chrome.storage.local.get("priorityTabs").then((result) => {
    let tabs = result.priorityTabs;
    const newTab = {
      id: tab.id,
      title: tab.title,
      url: tab.url,
    };
    // Only add to store if tab is not already part of it
    let isTabNew = isTabStored(newTab, tabs);
    console.log("stored tabs: ", tabs, " and is tab new: ", isTabNew);
    if (!isTabNew) {
      console.log("adding new tab: ", newTab);
      // keep only max 10
      if (tabs.length >= 10) tabs.shift();
      tabs.push({
        id: tab.id,
        title: tab.title,
        url: tab.url,
      });
      chrome.storage.local.set({ priorityTabs: tabs });
    }
  });
});

function isTabStored(newTab, storedTabs) {
  return storedTabs.some((tab) => {
    console.log(
      "inspecting tab: ",
      tab,
      "found tab === newTab: ",
      tab.url === newTab.url
    );
    return tab.url === newTab.url;
  });
}

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
  tabs.forEach((tab, i) => {
    const div = document.createElement("div");
    div.textContent = `${i + 1}. ${tab.title}`;
    container.appendChild(div);
  });
}

document.getElementById("refresh").addEventListener("click", () => {
  chrome.runtime.sendMessage({ action: "displayDiscardedTabs" });
  chrome.runtime.sendMessage({ action: "getLocalStorage" });
});
