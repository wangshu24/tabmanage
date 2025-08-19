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
  let altDown = false;
  let pDown = false;

  function keyDownHandler(e) {
    if (e.key === "Alt") altDown = true;
    if (e.key.toLowerCase() === "p") pDown = true;

    if (/^[0-9]$/.test(e.key) && altDown && pDown) {
      let idx = parseInt(e.key, 10) - 1;
      if (e.key === "0") idx = 9; // map 0 → 10th tab
      if (list[idx]) {
        console.log("combo detected: Alt+P+" + e.key);
        chrome.runtime.sendMessage({ action: "switchToTab", index: idx });
        removeOverlay();
      }
    }
  }

  function keyUpHandler(e) {
    if (e.key === "Alt") altDown = false;
    if (e.key.toLowerCase() === "p") pDown = false;
  }

  function removeOverlay() {
    document.removeEventListener("keydown", keyDownHandler);
    document.removeEventListener("keyup", keyUpHandler);
    overlay.remove();
  }

  document.addEventListener("keydown", keyDownHandler);
  document.addEventListener("keyup", keyUpHandler);
})();
