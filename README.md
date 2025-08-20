# Priority Tabs – Chrome Extension

Priority Tabs is a lightweight Chrome extension that lets you **bookmark up to 10 tabs** in a priority list for quick access.  
It comes with both a **popup UI** and a **page overlay** so you can view and switch to your important tabs anytime.

---

## ✨ Features
- Add the current tab to a priority list (max 10 items).
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
  - Minimal card-style list of priority tabs with spacing.
  - Buttons to add current tab and refresh list.
- **Overlay**
  - Small floating box in the top-right corner of the page.
  - Lists your priority tabs.
  - Keyboard hint: `1`–`0` to jump between them.

---

## ⚡ Roadmap / Ideas
- [ ] Make overlay tab entries clickable → instantly switch to that tab.
- [ ] Options page for customization (e.g., max tab count, styling).
- [ ] Dark/light theme auto-detection.

---

## 📝 License
MIT License © 2025  
Feel free to fork and extend!

