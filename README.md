# DWService Clipboard Shortcuts

DWService Clipboard Shortcuts solves the annoying DWService remote desktop clipboard problem: copying or pasting text normally requires DWService clipboard dialogs every time, but this extension lets you move text between the local browser clipboard and the remote desktop with RDP-like `Ctrl+C` and `Ctrl+V`.

It is a Manifest V3 extension for Chrome and Microsoft Edge that maps `Ctrl+C` and `Ctrl+V` to DWService remote desktop clipboard operations.

The extension handles text only. It does not implement full RDP clipboard redirection, does not store clipboard history, and does not add telemetry.

## How It Works

- `Ctrl+V` reads local text with `navigator.clipboard.readText()`, sends it to DWService through the active remote desktop page, and asks DWService to issue remote `Ctrl+V`.
- `Ctrl+C` is allowed to reach the remote session first. After the configured delay, the extension asks DWService for the remote clipboard text and writes it locally with `navigator.clipboard.writeText()`.
- Normal page fields such as `input`, `textarea`, `select`, `contenteditable`, CodeMirror, and Monaco editors are ignored.
- The extension does not click DWService toolbar buttons, does not automate the DWService clipboard dialog, and does not use `document.execCommand("paste")`.

## Project Structure

```text
ARCHITECTURE.md
AUTHORS.md
CHANGELOG.md
CONTRIBUTING.md
DISCLAIMER.md
LICENSE
manifest.json
NOTICE.md
package.json
PRIVACY.md
README.md
SECURITY.md
TESTING.md
assets/
  icon-source.png
  icons/
    icon16.png
    icon32.png
    icon48.png
    icon128.png
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
  manifest.test.js
  settings.test.js
```

## Install in Chrome

From a release ZIP:

1. Download `dwservice-clipboard-shortcuts-0.1.2.zip` from GitHub Releases.
2. Extract the ZIP to a local folder.
3. Open `chrome://extensions`.
4. Enable `Developer mode`.
5. Click `Load unpacked`.
6. Select the extracted folder.
7. Open DWService and start a remote desktop session.

From the repository checkout:

1. Open `chrome://extensions`.
2. Enable `Developer mode`.
3. Click `Load unpacked`.
4. Select this project directory.
5. Open DWService and start a remote desktop session.

## Install in Microsoft Edge

From a release ZIP:

1. Download `dwservice-clipboard-shortcuts-0.1.2.zip` from GitHub Releases.
2. Extract the ZIP to a local folder.
3. Open `edge://extensions`.
4. Enable `Developer mode`.
5. Click `Load unpacked`.
6. Select the extracted folder.
7. Open DWService and start a remote desktop session.

From the repository checkout:

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

After installing, updating, or reloading the extension in `chrome://extensions` or `edge://extensions`, refresh the active DWService remote desktop tab. Chrome and Edge do not reliably inject updated content scripts into tabs that were already open before the extension reload.

## Permissions

The extension requests:

- `storage` for popup settings
- `clipboardRead` to read local text during `Ctrl+V`
- `clipboardWrite` to write remote text after `Ctrl+C`

It does not use a background worker and does not create independent network requests.

Content scripts run only on:

- `https://dwservice.net/*`
- `https://access.dwservice.net/*`
- `https://www.dwservice.net/*`
- `https://*.dwservice.net/*`

## Privacy Boundary

Clipboard text is processed only after the user presses `Ctrl+C` or `Ctrl+V` in a detected DWService remote desktop session.

For local-to-remote paste, the text is necessarily passed to the active DWService page and then through DWService's own authenticated remote desktop channel to the selected agent. The extension does not send clipboard content to any other host and does not persist it.

The main privacy risk is the same boundary as the active remote desktop session: the DWService page and selected remote agent receive text that the user intentionally sends through `Ctrl+V`, and remote text returned by DWService can be written to the local clipboard after `Ctrl+C`.

## Limitations

- Text only.
- No files, images, HTML, or binary clipboard formats.
- Browser clipboard access can fail if Chrome or Edge requires focus, HTTPS, permission, or a direct user gesture.
- The implementation depends on DWService exposing the current `Desktop.common` runtime methods in the active session page.

## Use At Your Own Risk

This extension is provided as-is, without warranties or guarantees. Use it at your own risk.

To the maximum extent permitted by applicable law, the author is not liable for any direct, indirect, incidental, consequential, special, exemplary, or other damages arising from use of this extension, including clipboard mistakes, data loss, remote session issues, security incidents, service interruption, or incompatibility with DWService, Chrome, Edge, operating systems, or remote agents.

See `DISCLAIMER.md`, `LICENSE`, and `NOTICE.md`.

## Author And License

Author and maintainer: Adam Stypulkowski <adam.stypulkowski@itprosupport.eu>

License: Mozilla Public License Version 2.0 (`MPL-2.0`). The license choice is intended to align with the DWService Agent core licensing model. The DWService Agent README states that its core component is released under MPLv2, while other components can use their own licenses.

See `LICENSE`, `NOTICE.md`, and `AUTHORS.md`.

DWService Clipboard Shortcuts is an independent browser extension. It is not affiliated with, sponsored by, or endorsed by DWService unless a separate written statement says otherwise.
