(async function () {
  if (document.getElementById("priority-overlay")) return;

  // Get current tab info
  const getCurrentTab = () => {
    return {
      id: Math.random(), // This will be replaced by actual tab ID from background
      title: document.title,
      url: window.location.href,
      favIconUrl:
        document.querySelector('link[rel="icon"]')?.href ||
        document.querySelector('link[rel="shortcut icon"]')?.href ||
        null,
    };
  };

  // Show notification function
  const showNotification = (message, type = "info") => {
    // Remove any existing notification
    const existing = document.getElementById("priority-tab-notification");
    if (existing) existing.remove();

    const notification = document.createElement("div");
    notification.id = "priority-tab-notification";
    notification.style.cssText = `
      position: fixed;
      top: 60px;
      right: 20px;
      background: ${
        type === "success"
          ? "#4CAF50"
          : type === "error"
          ? "#f44336"
          : "#ff9800"
      };
      color: white;
      padding: 12px 16px;
      border-radius: 8px;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      font-size: 14px;
      font-weight: 500;
      box-shadow: 0 4px 12px rgba(0,0,0,0.3);
      z-index: 999998;
      max-width: 300px;
      word-wrap: break-word;
      animation: slideIn 0.3s ease-out;
    `;

    // Add CSS animation
    const style = document.createElement("style");
    style.textContent = `
      @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
      }
      @keyframes slideOut {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
      }
    `;
    document.head.appendChild(style);

    notification.textContent = message;
    document.body.appendChild(notification);

    // Auto-remove after 3 seconds
    setTimeout(() => {
      notification.style.animation = "slideOut 0.3s ease-in";
      setTimeout(() => {
        if (notification.parentNode) notification.remove();
        if (style.parentNode) style.remove();
      }, 300);
    }, 3000);
  };

  // Add tab with specific key function
  const addTabWithKey = async (targetKey) => {
    const { priorityTabs } = await chrome.storage.local.get("priorityTabs");
    let tabs = priorityTabs || [];
    const currentTab = getCurrentTab();

    // Check if tab is already in the list (by URL since we can't get real tab ID)
    const existingTab = tabs.find((t) => t.url === currentTab.url);
    if (existingTab) {
      showNotification(
        `Tab "${currentTab.title}" is already in priority list with key ${existingTab.key}`,
        "error"
      );
      return;
    }

    // Check if the target key is already taken
    const keyTaken = tabs.find((t) => t.key === targetKey);
    if (keyTaken) {
      showNotification(
        `Key ${targetKey} is already assigned to "${keyTaken.title}"`,
        "error"
      );
      return;
    }

    // Check if we're at the limit
    if (tabs.length >= 10) {
      showNotification(
        "Priority tabs limit reached (10). Remove a tab before adding another.",
        "error"
      );
      return;
    }

    // Add the tab with the specific key
    const newTab = {
      id: Date.now(), // Use timestamp as fake ID since we can't get real tab ID
      title: currentTab.title,
      url: currentTab.url,
      favIconUrl: currentTab.favIconUrl,
      key: targetKey,
    };

    tabs.push(newTab);
    await chrome.storage.local.set({ priorityTabs: tabs });

    showNotification(
      `Tab "${currentTab.title}" added to priority list with key ${targetKey}`,
      "success"
    );

    // Refresh the overlay display
    setTimeout(() => {
      removeOverlay();
      // Re-inject overlay to show updated list
      setTimeout(() => {
        chrome.runtime.sendMessage({ action: "open-priority-overlay" });
      }, 100);
    }, 1000);
  };

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
  const tabs = priorityTabs || [];

  // Sort tabs by key for display
  const sortedTabs = tabs.sort((a, b) => {
    // Handle key 0 (should appear last)
    if (a.key === 0 && b.key !== 0) return 1;
    if (b.key === 0 && a.key !== 0) return -1;
    return a.key - b.key;
  });

  overlay.innerHTML =
    "<b>Priority Tabs:</b><br>" +
    sortedTabs
      .map((t) => `${t.key === 0 ? "0" : t.key}. ${t.title}`)
      .join("<br>") +
    "<br><small>Press 1-9, 0 to switch</small>" +
    "<br><small>Alt+1-9,0 to add current tab</small>" +
    "<br><small>(Click to close · Esc to close)</small>";

  document.body.appendChild(overlay);

  function removeOverlay() {
    document.removeEventListener("keydown", keyHandler);
    overlay.remove();
  }

  // Track Alt key state
  let altPressed = false;

  const keyHandler = (e) => {
    // Track Alt key
    if (e.key === "Alt") {
      altPressed = true;
      return;
    }

    if (/^[0-9]$/.test(e.key)) {
      const keyPressed = parseInt(e.key, 10);
      const targetKey = keyPressed === 0 ? 0 : keyPressed;

      if (altPressed) {
        // Alt+Number: Add current tab to that key
        e.preventDefault();
        addTabWithKey(targetKey);
      } else {
        // Just Number: Switch to that tab
        const targetTab = tabs.find((tab) => tab.key === targetKey);
        if (targetTab) {
          const numkey = keyPressed === 0 ? 9 : keyPressed - 1;
          chrome.runtime.sendMessage({ action: "switchToTab", numkey: numkey });
          removeOverlay();
        }
      }
    } else if (e.key === "Escape") {
      removeOverlay();
    }
  };

  const keyUpHandler = (e) => {
    if (e.key === "Alt") {
      altPressed = false;
    }
  };

  document.addEventListener("keydown", keyHandler);
  document.addEventListener("keyup", keyUpHandler);

  // Clean up keyup listener when overlay is removed
  const originalRemoveOverlay = removeOverlay;
  removeOverlay = function () {
    document.removeEventListener("keyup", keyUpHandler);
    originalRemoveOverlay();
  };

  overlay.addEventListener("click", removeOverlay);
})();
