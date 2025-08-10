// Initial install con
chrome.runtime.onInstalled.addListener(() => {
  chrome.action.setBadgeText({
    text: "Inactive",
  });
  chrome.alarms.create("periodicCheck", {
    delayInMinutes: 1, //first run after 1min
    periodInMinutes: 1, //periodic check every 1min
  });
});

function displayTabs() {
  chrome.tabs.query({}, (tabs) => {
    tabs.forEach((tab) => {
      console.log(tab);
    });
  });
}

async function cleanTabs() {
  try {
    const tabs = await chrome.tabs.query({});
    tabs.forEach(async (tab) => {
      if (!tab.active && !tab.pinned && !tab.discarded && !tab.audible) {
        try {
          await chrome.tabs.discard(tab.id);
        } catch (err) {
          console.log("error discaring tabs: ", err);
        }
      }
    });
  } catch (err) {
    console.log("error from cleanTabs operation: ", err);
  }
}

const extensions = "https://developer.chrome.com/docs/extensions";
const webstore = "https://developer.chrome.com/docs/webstore";

chrome.action.onClicked.addListener((tab) => {
  displayTabs();
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
    cleanTabs();
  }
});
