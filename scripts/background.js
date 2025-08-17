// Initial install con
chrome.runtime.onInstalled.addListener(() => {
  chrome.action.setBadgeText({
    text: "Inactive",
  });
  chrome.alarms.create("periodicCheck", {
    delayInMinutes: 1, //first run after 10min
    periodInMinutes: 1, //periodic check every 8min
  });

  chrome.storage.local.set({ priorityTabs: [] });
});

// Execution on startup
// Can be configured as user setting
// For now, defaulted to discaring all none active tabs
// Can be extended to only keeping prioritized
chrome.runtime.onStartup.addListener(async () => {
  const tabs = await chrome.tabs.query({});
  for (const tab of tabs) {
    // Keep only active tab in each window loaded
    if (!tab.active && !tab.discarded) {
      try {
        await chrome.tabs.discard(tab.id);
      } catch (err) {
        console.warn(`Could not discard tab ${tab.id}:`, err);
      }
    }
  }
});

async function displayTabs() {
  tabs = await chrome.tabs.query({});
  console.log("all tabs: ", tabs);
}

function displayInactiveTabs() {
  chrome.tabs.query(
    { active: false, audible: false, discarded: false, pinned: false },
    (tabs) => {
      console.log("displayInactiveTabs: ", tabs);
      tabs.forEach((tab) => {
        if (patternMatch(tab.url)) {
          console.log("found match : ", tab.id, " ", tab.url);
        }
      });
    }
  );
}

async function displayLocalStorage() {
  tabs = await chrome.storage.local.get("priorityTabs");
  console.log(tabs);
}

// To be rewritten into tabs match
// Does deep comparisions to know if
// it's the tab we want to keep
const excludedURL = [
  "developer.chrome.com/docs/extensions/reference",
  "chatgpt.com/c/",
];
function URLMatch(url) {
  console.log("inspecting: ", url);
  return excludedURL.some((exurl) => url.includes(exurl));
}

async function cleanTabs() {
  try {
    const tabs = await chrome.tabs.query({
      active: false,
      audible: false,
      discarded: false,
      pinned: false,
    });
    for (tab of tabs) {
      if (!URLMatch(tab.url)) {
        try {
          console.log("discarding tab: ", tab.id, " with url: ", tab.url);
          await chrome.tabs.discard(tab.id);
        } catch (err) {
          console.log("error discaring tabs: ", err);
        }
      } else {
        continue;
      }
    }
  } catch (err) {
    console.log("error from cleanTabs operation: ", err);
  }
}

const extensions = "https://developer.chrome.com/docs/extensions";
const webstore = "https://developer.chrome.com/docs/webstore";

chrome.action.onClicked.addListener((tab) => {
  displayInactiveTabs();
  // displayTabs();
  displayLocalStorage();
  if (tab.url.startsWith(extensions) || tab.url.startsWith(webstore)) {
    const prevState = chrome.action.getBadgeText({ tabId: tab.id });
    const nextState = prevState === "ON" ? "OFF" : "ON";

    chrome.action.setBadgeText({
      tabId: tab.id,
      text: nextState,
    });

    if (nextState === "ON") {
      chrome.scripting.insertCSS({
        files: ["focus-mode.css"],
        target: { tabId: tab.id },
      });
    } else if (nextState === "OFF") {
      chrome.scripting.removeCSS({
        files: ["focus-mode.css"],
        target: { tabId: tab.id },
      });
    }
  }
});

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === "periodicCheck") {
    console.log("performing periodic check");
    // cleanTabs();
  }
});

// Handle open-priority-overlay command
chrome.commands.onCommand.addListener(async (command) => {
  if (command === "open-priority-overlay") {
    const [tab] = await chrome.tabs.query({
      active: true,
      currentWindow: true,
    });
    if (tab?.id) {
      await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        files: ["scripts/overlay.js"],
      });
    }
  }
});

// Listen for adding a tab to priority list
chrome.runtime.onMessage.addListener(async (msg, sender) => {
  // displayInactiveTabs();
  // displayLocalStorage();
  console.log(msg, "sender: ", sender);
  if (msg.action === "addPriorityTab" && sender.tab) {
    let { priorityTabs } = await chrome.storage.local.get("priorityTabs");
    if (priorityTabs.length >= 10) priorityTabs.shift();
    priorityTabs.push({ id: sender.tab.id, title: sender.tab.title });
    await chrome.storage.local.set({ priorityTabs });
  }
});

// Switching tabs hotkey listener
chrome.runtime.onMessage.addListener(async (msg) => {
  if (msg.action === "switchToTab") {
    const { priorityTabs } = await chrome.storage.local.get("priorityTabs");
    const tabInfo = priorityTabs?.[msg.index];
    if (tabInfo && tabInfo.id) {
      try {
        await chrome.tabs.update(tabInfo.id, { active: true });
      } catch (e) {
        console.warn("Tab may be closed, removing from priority list");
      }
    }
  }
});
