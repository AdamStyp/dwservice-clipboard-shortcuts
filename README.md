# DWService Clipboard Shortcuts

Manifest V3 extension for Chrome and Microsoft Edge that maps `Ctrl+C` and `Ctrl+V` to DWService remote desktop clipboard operations.

The extension handles text only. It does not implement full RDP clipboard redirection, does not store clipboard history, and does not add telemetry.

## How It Works

- `Ctrl+V` reads local text with `navigator.clipboard.readText()`, sends it to DWService through the active remote desktop page, and asks DWService to issue remote `Ctrl+V`.
- `Ctrl+C` is allowed to reach the remote session first. After the configured delay, the extension asks DWService for the remote clipboard text and writes it locally with `navigator.clipboard.writeText()`.
- Normal page fields such as `input`, `textarea`, `select`, `contenteditable`, CodeMirror, and Monaco editors are ignored.
- The extension does not click DWService toolbar buttons, does not automate the DWService clipboard dialog, and does not use `document.execCommand("paste")`.

## Project Structure

```text
ARCHITECTURE.md
CHANGELOG.md
CONTRIBUTING.md
manifest.json
package.json
PRIVACY.md
README.md
SECURITY.md
TESTING.md
src/
  shared/
    settings.js
  content/
    clipboardBridge.js
    constants.js
    contentScript.js
    domUtils.js
    dwServiceApiBridge.js
    dwServiceApiClient.js
    logger.js
    sessionDetector.js
    settingsStore.js
  popup/
    popup.css
    popup.html
    popup.js
tests/
  clipboardBridge.test.js
  dwServiceApiBridge.test.js
  dwServiceApiClient.test.js
  settings.test.js
```

## Install in Chrome

1. Open `chrome://extensions`.
2. Enable `Developer mode`.
3. Click `Load unpacked`.
4. Select this project directory.
5. Open DWService and start a remote desktop session.

## Install in Microsoft Edge

1. Open `edge://extensions`.
2. Enable `Developer mode`.
3. Click `Load unpacked`.
4. Select this project directory.
5. Open DWService and start a remote desktop session.

## Popup Options

- Enable extension
- Handle `Ctrl+C`
- Handle `Ctrl+V`
- Debug mode
- `Ctrl+C` sync delay, default `500 ms`

Settings are stored with `chrome.storage.sync`.

## Tests

```sh
npm test
```

The tests use Node's built-in `node:test` runner and do not require external packages.

## Debugging

1. Enable `Debug mode` in the extension popup.
2. Refresh the DWService remote desktop page.
3. Open DevTools on the DWService page.
4. Filter console messages by:

```text
[DWService Clipboard]
```

Debug logs may contain operation names, error names, and text lengths. They must not contain clipboard text.

If DWService changes its runtime structure, update `src/content/dwServiceApiBridge.js`. The bridge currently locates the active `dws.agent.desktop.Desktop.common` object and uses:

- `sendSetClipboardData("text", text)`
- `sendGetClipboardData()`
- `sendKeyboard("KEY", "V", true, false, false, false)`

## Permissions

The extension requests:

- `storage` for popup settings
- `clipboardRead` to read local text during `Ctrl+V`
- `clipboardWrite` to write remote text after `Ctrl+C`

Content scripts run only on:

- `https://dwservice.net/*`
- `https://access.dwservice.net/*`
- `https://www.dwservice.net/*`
- `https://*.dwservice.net/*`

## Privacy Boundary

Clipboard text is processed only after the user presses `Ctrl+C` or `Ctrl+V` in a detected DWService remote desktop session.

For local-to-remote paste, the text is necessarily passed to the active DWService page and then through DWService's own authenticated remote desktop channel to the selected agent. The extension does not send clipboard content to any other host and does not persist it.

## Limitations

- Text only.
- No files, images, HTML, or binary clipboard formats.
- Browser clipboard access can fail if Chrome or Edge requires focus, HTTPS, permission, or a direct user gesture.
- The implementation depends on DWService exposing the current `Desktop.common` runtime methods in the active session page.
