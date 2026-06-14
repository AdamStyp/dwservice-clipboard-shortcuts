# Architecture

DWService Clipboard Shortcuts is a small Manifest V3 extension. It runs only on DWService pages and has no background worker.

All shortcut handling happens in content scripts on the active DWService remote desktop page. The popup only edits settings in `chrome.storage.sync`.

## Runtime Flow

1. `contentScript.js` listens for `Ctrl+C` and `Ctrl+V` in capture phase.
2. `SessionDetector` confirms that the current page is an `access.dwservice.net` remote desktop screen.
3. `DomUtils` skips normal editable page fields and local text selections.
4. `ClipboardBridge` reads or writes local text through the browser Clipboard API.
5. `DwServiceApiClient` sends a JSON request from the isolated extension world.
6. `DwServiceApiBridge` receives that request in the page main world and calls DWService's active desktop runtime.
7. `DebugLogger` logs only when debug mode is enabled.

## Main Modules

### `src/content/contentScript.js`

Coordinates settings, shortcut detection, session checks, local clipboard access, and DWService API calls.

### `src/content/dwServiceApiBridge.js`

Runs in the page main world. It locates the live DWService desktop component and extracts `Desktop.common`.

The bridge calls these DWService methods:

- `sendSetClipboardData("text", text)` to send local text to the remote clipboard,
- `sendGetClipboardData()` to read the remote clipboard,
- `sendKeyboard("KEY", "V", true, false, false, false)` to paste remotely.

The bridge does not inspect clipboard text beyond passing it to DWService.

### `src/content/dwServiceApiClient.js`

Runs in the isolated extension world. It sends request/response events to the main-world bridge and applies timeouts.

### `src/content/clipboardBridge.js`

Thin wrapper around `navigator.clipboard.readText()` and `navigator.clipboard.writeText()`.

It does not use hidden textareas, `execCommand`, synthetic paste events, or DOM fallbacks.

### `src/content/sessionDetector.js`

Limits shortcut handling to DWService remote desktop pages. A page must be on `access.dwservice.net`, have a remote-desktop-like URL, and expose remote surface or toolbar signals.

### `src/content/domUtils.js`

Contains minimal DOM helpers for visibility checks and editable-target detection.

### `src/content/settingsStore.js`

Loads settings from `chrome.storage.sync` and watches for updates.

### `src/popup/*`

Provides the extension options UI. It has no access to clipboard content.

### `assets/*`

Contains the extension icon set referenced by `manifest.json`. `assets/icon-source.png` is the selected source artwork, and `assets/icons/*.png` are the browser-facing icon sizes.

## Project Metadata

- Author and maintainer: Adam Stypulkowski <adam.stypulkowski@itprosupport.eu>
- License: Mozilla Public License Version 2.0 (`MPL-2.0`)
- Notice: `NOTICE.md`
- Authors file: `AUTHORS.md`

## Design Boundaries

- No full RDP clipboard redirection.
- No clipboard history.
- No telemetry.
- No background worker.
- No independent network requests.
- No DOM automation of DWService clipboard dialogs.
- No toolbar clicking by index, selector, or screen position.
- No file, image, HTML, or binary clipboard support.

## Privacy Boundary

The local clipboard text is passed to the active DWService page only when the user presses `Ctrl+V` in a detected remote desktop session.

From that point, DWService's own authenticated session is responsible for delivering the text to the selected remote agent. The extension does not send clipboard content to unrelated hosts and does not store it.

The primary privacy risk is intentional exposure to the active DWService page and selected remote machine. The extension avoids adding a second transport path, telemetry path, or clipboard history store.
