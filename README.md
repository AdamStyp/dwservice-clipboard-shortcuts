# DWService Clipboard Shortcuts

DWService Clipboard Shortcuts solves the annoying DWService remote desktop clipboard workflow where Copy and Paste open dialogs that must be handled manually every time. With this extension, text clipboard transfer works closer to RDP: focus the remote desktop session and use `Ctrl+C` or `Ctrl+V`.

This is a Manifest V3 extension for Google Chrome and Microsoft Edge. It handles text only, runs only on DWService pages, does not store clipboard history, and does not include telemetry.

## What It Does

- `Ctrl+V` reads local text with `navigator.clipboard.readText()`, sends it to the active DWService remote desktop page, and asks DWService to issue remote `Ctrl+V`.
- `Ctrl+C` is allowed to reach the remote session first. After the configured delay, the extension asks DWService for the remote clipboard text and writes it locally with `navigator.clipboard.writeText()`.
- Normal page fields such as `input`, `textarea`, `select`, `contenteditable`, CodeMirror, and Monaco editors are ignored.
- The extension does not click DWService toolbar buttons, does not automate dialog controls, and does not use hidden paste fields.

## Install From Release Package

1. Download `dwservice-clipboard-shortcuts-0.1.0.zip` from the GitHub release.
2. Extract the ZIP file to a local folder.
3. Open `chrome://extensions` or `edge://extensions`.
4. Enable `Developer mode`.
5. Click `Load unpacked`.
6. Select the extracted folder.
7. Open or refresh `https://access.dwservice.net/` and start a remote desktop session.

After updating or reloading the extension, refresh any already-open DWService tab so the content scripts are loaded again.

## Install From Source

1. Clone or download this repository.
2. Open `chrome://extensions` or `edge://extensions`.
3. Enable `Developer mode`.
4. Click `Load unpacked`.
5. Select the project directory.
6. Open or refresh a DWService remote desktop session.

## Popup Options

- Enable extension
- Handle `Ctrl+C`
- Handle `Ctrl+V`
- Debug mode
- `Ctrl+C` sync delay, default `500 ms`

Settings are stored with `chrome.storage.sync`. Clipboard text is not stored.

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

## Project Structure

```text
assets/
  icon-source.png
  icons/
manifest.json
package.json
src/
  shared/
  content/
  popup/
tests/
AUTHORS.md
ARCHITECTURE.md
CHANGELOG.md
CONTRIBUTING.md
DISCLAIMER.md
LICENSE
NOTICE.md
PRIVACY.md
SECURITY.md
TESTING.md
```

## Permissions

The extension requests only:

- `storage` for popup settings,
- `clipboardRead` to read local text during `Ctrl+V`,
- `clipboardWrite` to write remote text after `Ctrl+C`.

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
- No full RDP clipboard redirection.
- Browser clipboard access can fail if Chrome or Edge requires focus, HTTPS, permission, or a direct user gesture.
- The implementation depends on DWService exposing the current `Desktop.common` runtime methods in the active session page.

## Tests

```sh
npm test
```

The tests use Node's built-in `node:test` runner and do not require external packages.

## License, Author, And Disclaimer

Author and maintainer: Adam Stypulkowski <adam.stypulkowski@itprosupport.eu>

This project is licensed under the Mozilla Public License Version 2.0 (`MPL-2.0`) to align with the DWService Agent core licensing model.

This software is provided as-is. Use it at your own risk. To the maximum extent permitted by applicable law, the author and maintainer is not liable for damages, losses, security incidents, service interruptions, clipboard mistakes, or other consequences arising from use of this software. See `DISCLAIMER.md` and `LICENSE`.
