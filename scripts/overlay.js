(async function () {
  if (document.getElementById("priority-overlay")) return;

  // Get current tab info with real tab ID from background
  const getCurrentTab = async () => {
    // Request current tab info from background script
    return new Promise((resolve) => {
      chrome.runtime.sendMessage(
        { action: "getCurrentTabInfo" },
        (response) => {
          if (response && response.tab) {
            resolve({
              id: response.tab.id,
              title: response.tab.title,
              url: response.tab.url,
              favIconUrl: response.tab.favIconUrl,
            });
          } else {
            // Fallback to page info if background doesn't respond
            resolve({
              id: Date.now(), // Still use fake ID as fallback
              title: document.title,
              url: window.location.href,
              favIconUrl:
                document.querySelector('link[rel="icon"]')?.href ||
                document.querySelector('link[rel="shortcut icon"]')?.href ||
                null,
            });
          }
        }
      );
    });
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
    const currentTab = await getCurrentTab();

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

    // Update the overlay display immediately
    updateOverlayContent();
  };

  // Function to generate overlay content
  const generateOverlayContent = (tabsList) => {
    // Sort tabs by key for display
    const sortedTabs = tabsList.sort((a, b) => {
      // Handle key 0 (should appear last)
      if (a.key === 0 && b.key !== 0) return 1;
      if (b.key === 0 && a.key !== 0) return -1;
      return a.key - b.key;
    });

    return (
      "<b>Priority Tabs:</b><br>" +
      sortedTabs
        .map((t) => `${t.key === 0 ? "0" : t.key}. ${t.title}`)
        .join("<br>") +
      "<br><small>Press 1-9,0 to add current tab</small>" +
      "<br><small>Shift+1-9,0 to switch to tab</small>" +
      "<br><small>(Any other key to close)</small>"
    );
  };

  // Function to update overlay content
  const updateOverlayContent = async () => {
    const { priorityTabs } = await chrome.storage.local.get("priorityTabs");
    const updatedTabs = priorityTabs || [];
    overlay.innerHTML = generateOverlayContent(updatedTabs);

    // Update the tabs variable for key handlers
    tabs.length = 0; // Clear existing array
    tabs.push(...updatedTabs); // Add updated tabs
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

  overlay.innerHTML = generateOverlayContent(tabs);
  document.body.appendChild(overlay);

  function removeOverlay() {
    document.removeEventListener("keydown", keyHandler);
    document.removeEventListener("click", clickHandler);
    overlay.remove();
  }

  // Track Shift key state for switching to existing tabs
  let shiftPressed = false;

  const keyHandler = (e) => {
    // Track Shift key
    if (e.key === "Shift") {
      shiftPressed = true;
      return;
    }

    // Check for number keys using key codes (more reliable with modifiers)
    const isNumberKey =
      (e.code >= "Digit0" && e.code <= "Digit9") ||
      (e.code >= "Numpad0" && e.code <= "Numpad9");

    if (isNumberKey) {
      // Extract the number from the key code
      let keyPressed;
      if (e.code.startsWith("Digit")) {
        keyPressed = parseInt(e.code.replace("Digit", ""), 10);
      } else {
        keyPressed = parseInt(e.code.replace("Numpad", ""), 10);
      }

      const targetKey = keyPressed === 0 ? 0 : keyPressed;

      if (shiftPressed || e.shiftKey) {
        // Shift+Number: Switch to existing tab
        const targetTab = tabs.find((tab) => tab.key === targetKey);
        console.log(
          "Shift+Number pressed - targetKey:",
          targetKey,
          "targetTab:",
          targetTab,
          "all tabs:",
          tabs
        );
        if (targetTab) {
          const numkey = keyPressed === 0 ? 9 : keyPressed - 1;
          console.log(
            "Sending switchToTab message - numkey:",
            numkey,
            "for tab:",
            targetTab
          );
          chrome.runtime.sendMessage({ action: "switchToTab", numkey: numkey });
          removeOverlay();
        } else {
          console.log("No target tab found for key:", targetKey);
        }
      } else {
        // Just Number: Add current tab to that key
        e.preventDefault();
        addTabWithKey(targetKey);
      }
    } else {
      // Any other key (not Shift, not 0-9) closes the overlay
      removeOverlay();
    }
  };

  const keyUpHandler = (e) => {
    if (e.key === "Shift") {
      shiftPressed = false;
    }
  };

  // Click handler to close overlay when clicking outside
  const clickHandler = (e) => {
    // If click is outside the overlay, close it
    if (!overlay.contains(e.target)) {
      removeOverlay();
    }
  };

  document.addEventListener("keydown", keyHandler);
  document.addEventListener("keyup", keyUpHandler);
  // Add click listener to document to catch clicks outside overlay
  document.addEventListener("click", clickHandler);

  // Clean up all listeners when overlay is removed
  const originalRemoveOverlay = removeOverlay;
  removeOverlay = function () {
    document.removeEventListener("keyup", keyUpHandler);
    originalRemoveOverlay();
  };

  // Prevent overlay click from bubbling up to document click handler
  overlay.addEventListener("click", (e) => {
    e.stopPropagation();
  });
})();
