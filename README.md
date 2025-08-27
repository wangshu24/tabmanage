# ByeTabs – Chrome Extension

ByeTabs is a lightweight Chrome extension that lets you **bookmark up to 10 tabs** in a priority list for quick access and does background clean up of inactive tabs to save memory.  
It comes with both a **popup UI** and a **page overlay** so you can view and switch to your important tabs anytime.

---

## ✨ Features
- Add the current tab to a priority list (max 3 items).
- Popup view with clean, card-style display of tabs.
- Overlay injected directly into the page showing the list.
- Duplicate protection: if you try to add the same tab again, the existing entry **blinks red** instead of being duplicated.
- Live updates: the popup and overlay automatically sync when tabs are added/removed.
- Keyboard hint in overlay (`1`–`0`) for quick tab switching (to be implemented / extendable).

---

## 🛠 Usage
1. Open any tab you want to keep.
2. Click the extension icon → **“Add Current Tab”** in the popup.
3. The tab appears in both:
   - The **popup list** inside the extension icon menu.
   - The **overlay** injected into the current page.
4. If you try to add the same tab again, the existing entry will **blink red** in both the popup and overlay.

---

## 📸 UI Overview
- **Popup**
  - Minimal card-style list of priority tabs.
  - Buttons to add current tab, remove a tab, and remove all.
- **Overlay**
  - Small floating box in the top-right corner of the page.
  - Lists your priority tabs.
  - Keyboard hint: `1`–`0` to jump between them.

---

## 📦 Cloning & Self-Hosting

You can run ByeTabs locally in developer mode:

1. **Clone the repo:**
   ```sh
   git clone https://github.com/your-username/priority-tabs.git
   cd priority-tabs
   ```
2. **Set up Git hooks (recommended):**
   ```sh
   # Ensure the script is executable
   chmod +x setup-hooks.sh
   setup-hooks.sh
   ```
3. **Load unpacked extension:**
   - Open Chrome and go to `chrome://extensions`.
   - Enable **Developer mode**.
   - Click **Load unpacked** and select the `priority-tabs` directory.
4. Done!

---

## ⚡ Roadmap / Ideas
- [ ] Make overlay tab entries clickable → instantly switch to that tab.
- [ ] Options page for customization (e.g., max tab count, styling).
- [ ] Dark/light theme auto-detection.

---

## 📝 License
MIT License © 2025  
Feel free to fork and extend!
