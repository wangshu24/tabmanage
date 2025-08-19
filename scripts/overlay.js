(async function () {
  console.log("init popup.js");
  if (document.getElementById("priority-overlay")) return;
  console.log("script activated");
  const overlay = document.createElement("div");
  overlay.id = "priority-overlay";
  overlay.style.position = "fixed";
  overlay.style.top = "20px";
  overlay.style.right = "20px";
  overlay.style.background = "rgba(0,0,0,0.8)";
  overlay.style.color = "white";
  overlay.style.padding = "10px";
  overlay.style.borderRadius = "8px";
  overlay.style.fontFamily = "sans-serif";
  overlay.style.zIndex = 999999;

  const { priorityTabs } = await chrome.storage.local.get("priorityTabs");
  const list = priorityTabs || [];

  overlay.innerHTML =
    "<b>Priority Tabs:</b><br>" +
    list.map((t, i) => `${i + 1}. ${t.title}`).join("<br>") +
    "<br><small>Press 1 - 0 to switch</small>";

  document.body.appendChild(overlay);

  const keyHandler = (e) => {
    console.log("received event: ", e);
    if (/^[0-9]$/.test(e.key)) {
      let idx = parseInt(e.key, 10) - 1;
      if (e.key === "0") idx = 9; // map 0 → 10th tab
      if (list[idx]) {
        chrome.runtime.sendMessage({ action: "switchToTab", index: idx });
        removeOverlay();
      }
    }
    if (e.key === "Escape") removeOverlay();
  };

  function removeOverlay() {
    document.removeEventListener("keydown", keyHandler);
    overlay.remove();
  }

  document.addEventListener("keydown", keyHandler);
})();
