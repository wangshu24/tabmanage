(async function () {
  if (document.getElementById("priority-overlay")) return;

  const overlay = document.createElement("div");
  overlay.id = "priority-overlay";
  overlay.style = `
    position:fixed;top:20px;right:20px;
    background:rgba(0,0,0,0.8);color:white;
    padding:10px;border-radius:8px;
    font-family:sans-serif;z-index:999999;
  `;

  const { priorityTabs } = await chrome.storage.local.get("priorityTabs");
  const list = priorityTabs || [];

  overlay.innerHTML =
    "<b>Priority Tabs:</b><br>" +
    list.map((t, i) => `${i + 1}. ${t.title}`).join("<br>") +
    "<br><small>Press 1 - 0 to switch</small>";

  document.body.appendChild(overlay);

  function removeOverlay() {
    document.removeEventListener("keydown", keyHandler);
    overlay.remove();
  }

  const keyHandler = (e) => {
    if (/^[0-9]$/.test(e.key)) {
      console.log("received key: ", e.key);
      let idx = parseInt(e.key, 10) - 1;
      if (e.key === "0") idx = 9; // map 0 → 10th tab
      if (list[idx]) {
        chrome.runtime.sendMessage({ action: "switchToTab", index: idx });
        removeOverlay();
      }
    } else {
      removeOverlay();
    }
    if (e.key === "Escape") removeOverlay();
  };

  document.addEventListener("keydown", keyHandler);
})();
