# Architecture

DWService Clipboard Shortcuts is a small Manifest V3 extension for Chrome and Microsoft Edge. It runs only on DWService pages.

Shortcut handling happens in content scripts on the active DWService remote desktop page. A small background service worker exists only to re-inject those scripts into already-open DWService tabs when the extension starts, updates, or receives a recovery request. The popup only edits settings in `chrome.storage.sync`.

## Runtime Flow

1. `contentScript.js` listens for `Ctrl+C` and `Ctrl+V` in capture phase.
2. `SessionDetector` confirms that the current page is an `access.dwservice.net` remote desktop screen.
3. `DomUtils` skips normal editable page fields and local text selections.
4. `ClipboardBridge` reads or writes local text through the browser Clipboard API.
5. `DwServiceApiClient` sends a JSON request from the isolated extension world.
6. `DwServiceApiBridge` receives that request in the page main world and calls DWService's active desktop runtime.
7. If the request fails because the DWService runtime or bridge became stale, `DwServiceApiClient` asks the bridge to clear its cache, requests background reinjection, and retries once.
8. `DebugLogger` logs only when debug mode is enabled.

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

It also supports a `resetCache` request so the isolated-world client can force a fresh runtime lookup after DWService rebuilds the active session object.

### `src/content/dwServiceApiClient.js`

Runs in the isolated extension world. It sends request/response events to the main-world bridge and applies timeouts.

### `src/content/clipboardBridge.js`

Thin wrapper around `navigator.clipboard.readText()` and `navigator.clipboard.writeText()`.

It does not use hidden textareas, `execCommand`, synthetic paste events, or DOM fallbacks.

### `src/content/sessionDetector.js`

Limits shortcut handling to DWService remote desktop pages. A page must be on `access.dwservice.net` and expose remote surface or toolbar signals. It does not depend on URL keywords because DWService access URLs can be opaque session routes.

### `src/content/domUtils.js`

Contains minimal DOM helpers for visibility checks and editable-target detection.

### `src/content/settingsStore.js`

Loads settings from `chrome.storage.sync` and watches for updates.

### `src/popup/*`

Provides the extension options UI. It has no access to clipboard content.

### `src/background/background.js`

Runs as the MV3 background service worker. It injects the main-world bridge first, then the isolated-world content scripts, into DWService tabs only. It does not read clipboard content and does not create network requests.

## Assets

Extension icons live in `assets/icons/`. The source artwork is `assets/icon-source.png`; generated icon sizes are referenced from `manifest.json`.

## Design Boundaries

- No full RDP clipboard redirection.
- No clipboard history.
- No telemetry.
- Background worker is limited to DWService-only content script reinjection.
- No DOM automation of DWService clipboard dialogs.
- No toolbar clicking by index, selector, or screen position.
- No file, image, HTML, or binary clipboard support.

## Privacy Boundary

The local clipboard text is passed to the active DWService page only when the user presses `Ctrl+V` in a detected remote desktop session.

From that point, DWService's own authenticated session is responsible for delivering the text to the selected remote agent. The extension does not send clipboard content to unrelated hosts and does not store it.
