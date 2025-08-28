# Privacy Policy for Bye Tab Chrome Extension

**Last Updated:** January 2025

## Overview

Bye Tab is a Chrome extension that helps users manage their browser tabs by maintaining a priority list of important tabs and automatically discarding inactive tabs to improve browser performance. This privacy policy explains how we collect, use, and protect your information.

## Information We Collect

### Local Data Storage
- **Priority Tab List**: We store a list of your priority tabs (up to 10) including:
  - Tab titles
  - Tab URLs
  - Tab IDs (temporary browser identifiers)
  - Favicon URLs (when available)

### Browser Tab Information
- **Active Tab Information**: We access information about your currently active tab when you choose to add it to your priority list
- **Tab Status**: We monitor tab states (active, inactive, discarded) to manage tab lifecycle
- **Navigation Events**: We detect when tabs navigate to new URLs to keep your priority list updated

## How We Use Your Information

### Core Functionality
- **Priority Tab Management**: Store and manage your selected priority tabs for quick access
- **Tab Optimization**: Automatically discard inactive tabs to improve browser performance
- **URL Synchronization**: Update stored URLs when you navigate priority tabs to new pages
- **Quick Switching**: Enable keyboard shortcuts and overlay interface for fast tab switching

### Local Processing Only
- All data processing occurs locally on your device
- No information is transmitted to external servers
- No analytics or tracking data is collected
- No user accounts or authentication required

## Data Storage and Security

### Local Storage
- All data is stored locally using Chrome's `chrome.storage.local` API
- Data persists only on your local device
- No cloud storage or external databases are used

### Data Retention
- Priority tab data is retained until you:
  - Remove tabs from your priority list
  - Close the tabs (they are automatically removed)
  - Uninstall the extension

### Data Security
- Data is protected by Chrome's built-in security mechanisms
- No data transmission over networks
- No third-party access to your data

## Permissions Explained

### Required Permissions

**`tabs`**
- Purpose: Access tab information (title, URL, status) to manage your priority list
- Usage: Read tab details when adding to priority list, monitor tab status changes

**`activeTab`**
- Purpose: Access currently active tab information when you choose to add it
- Usage: Get current tab details when you click "Add Current Tab"

**`storage`**
- Purpose: Store your priority tab list locally on your device
- Usage: Save and retrieve your priority tabs between browser sessions

**`scripting`**
- Purpose: Inject overlay interface into web pages
- Usage: Display priority tab overlay when you use the keyboard shortcut

**`alarms`**
- Purpose: Schedule periodic tab cleanup operations
- Usage: Automatically discard inactive tabs at regular intervals

**`webNavigation`**
- Purpose: Detect when priority tabs navigate to new URLs
- Usage: Keep priority tab URLs synchronized when you navigate

**`host_permissions: ["<all_urls>"]`**
- Purpose: Allow overlay injection on any website
- Usage: Display priority tab overlay regardless of which website you're viewing
- Note: We do not access or modify website content, only inject our overlay interface

## Third-Party Services

We do not use any third-party services, analytics, or tracking tools. The extension operates entirely offline and locally.

## Data Sharing

We do not share, sell, or transmit any of your data to third parties. All functionality is local to your device.

## Children's Privacy

This extension does not knowingly collect information from children under 13. The extension is designed for general productivity use and does not target children specifically.

## Changes to This Policy

We may update this privacy policy from time to time. Any changes will be reflected in the "Last Updated" date at the top of this document. Continued use of the extension after changes constitutes acceptance of the updated policy.

## Contact Information

If you have questions about this privacy policy or the extension's data practices, you can:
- Review the open-source code on our repository
- Contact us through the Chrome Web Store support channels

## Your Rights

You have the right to:
- View all data stored by the extension through Chrome's developer tools
- Delete all extension data by uninstalling the extension
- Control which tabs are added to your priority list

## Technical Implementation

For transparency, here's how we handle your data technically:

### Data Structure
```json
{
  "priorityTabs": [
    {
      "id": 123,
      "title": "Example Page",
      "url": "https://example.com",
      "favIconUrl": "https://example.com/favicon.ico"
    }
  ]
}
```

### Storage Location
- Chrome Local Storage (`chrome.storage.local`)
- No external databases or cloud storage

### Data Lifecycle
1. You add a tab to priority list → Data stored locally
2. Tab URL changes → Local data updated automatically  
3. Tab closed → Data automatically removed
4. Extension uninstalled → All data deleted

---

This privacy policy is designed to be transparent about our minimal data collection and local-only processing approach. We believe in user privacy and have designed Bye Tab to work entirely on your device without any external data transmission.
