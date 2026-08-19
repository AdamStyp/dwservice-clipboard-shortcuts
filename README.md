# DWService Clipboard Shortcuts

Automatically use `Ctrl+C` and `Ctrl+V` for text clipboard transfers between your local computer and a DWService remote desktop session. This Chrome and Edge extension removes the need to click the Copy and Paste buttons in the DWService toolbar each time you move text between local and remote clipboards.

This is a Manifest V3 extension that runs only on DWService pages. It currently synchronizes text only.

## Why?

The standard DWService clipboard workflow requires using the Copy and Paste controls in the remote desktop toolbar. This extension lets you use the familiar keyboard shortcuts instead, making text transfer feel more like a seamless remote desktop clipboard.

DWService Clipboard Shortcuts is an independent community project, not an official DWService product.

## What It Does

- **`Ctrl+C`: remote to local clipboard.** The shortcut reaches the remote session first. After the configured delay, the extension asks DWService for the remote clipboard text and writes it locally with `navigator.clipboard.writeText()`.
- **`Ctrl+V`: local to remote clipboard.** The extension reads local text with `navigator.clipboard.readText()`, sends it to the active DWService remote desktop page, and asks DWService to issue remote `Ctrl+V`.
- Text is transferred while a DWService remote desktop session is active; images, files, and other binary clipboard formats are not supported.
- You can copy and paste without clicking the DWService toolbar's Copy and Paste buttons.
- Normal page fields such as `input`, `textarea`, `select`, `contenteditable`, CodeMirror, and Monaco editors are ignored.
- A small background worker can re-inject the DWService content scripts into already-open DWService tabs after extension install, update, startup, or a detected bridge failure.
- The extension does not click DWService toolbar buttons, does not automate dialog controls, and does not use hidden paste fields.

## Installation

### Chrome

1. Download and extract `dwservice-clipboard-shortcuts-0.1.1.zip` from the GitHub release, or clone/download this repository.
2. Open `chrome://extensions`.
3. Enable **Developer mode**.
4. Click **Load unpacked** and select the extracted package or project directory.
5. Open or refresh `https://access.dwservice.net/` and start a remote desktop session.

### Edge

1. Download and extract `dwservice-clipboard-shortcuts-0.1.1.zip` from the GitHub release, or clone/download this repository.
2. Open `edge://extensions`.
3. Enable **Developer mode**.
4. Click **Load unpacked** and select the extracted package or project directory.
5. Open or refresh `https://access.dwservice.net/` and start a remote desktop session.

After updating or reloading the extension, the background worker attempts to attach the content scripts to already-open DWService tabs automatically. If shortcuts still do not work, refresh the DWService tab and reopen the remote desktop session.

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
- `clipboardWrite` to write remote text after `Ctrl+C`,
- `scripting` to re-inject the extension scripts into already-open DWService tabs when Chrome or Edge did not attach them during page load.

Content scripts and programmatic script injection are scoped only to:

- `https://dwservice.net/*`
- `https://access.dwservice.net/*`
- `https://www.dwservice.net/*`
- `https://*.dwservice.net/*`

## Security & Privacy

Clipboard text is processed only after the user presses `Ctrl+C` or `Ctrl+V` in a detected DWService remote desktop session.

The extension has no telemetry, does not store clipboard history, and does not send clipboard content to a server operated by the author. For local-to-remote paste, the text is necessarily passed to the active DWService page and then through DWService's own authenticated remote desktop channel to the selected agent. Clipboard read and write permissions are required because clipboard transfer is the extension's core function.

See [PRIVACY.md](PRIVACY.md) and [SECURITY.md](SECURITY.md) for the complete data flow, permissions, and security model.

## Limitations

- Only text is currently synchronized; files, images, HTML, and other binary clipboard formats are not supported.
- An active DWService remote desktop session is required.
- No full RDP clipboard redirection.
- Manual remote-machine testing has currently been performed only with Windows remote desktop sessions.
- Linux and macOS remote machines are not yet confirmed. They may work when DWService Agent exposes compatible text clipboard methods and the remote graphical environment accepts standard `Ctrl+C`/`Ctrl+V` shortcuts.
- Browser clipboard access can fail if Chrome or Edge requires focus, HTTPS, permission, or a direct user gesture.
- The extension can recover from common DWService page/runtime rebuilds, but a tab refresh can still be required after unusual browser or extension lifecycle failures.
- The implementation depends on DWService exposing the current `Desktop.common` runtime methods in the active session page.
- Changes to DWService's internal client API may require an extension update.

## Tests

```sh
npm test
```

The tests use Node's built-in `node:test` runner and do not require external packages.

## Not Affiliated With DWService

This is an independent community project and is not affiliated with, endorsed by, or maintained by DWService.

## Search Terms

People looking for this project may describe it as **DWService clipboard synchronization**, **DWService automatic copy and paste**, **DWService Ctrl+C Ctrl+V**, a **DWService clipboard shortcut**, a **DWService Chrome extension** or **DWService Edge extension**, **copy paste between local and remote DWService computer**, **seamless clipboard for DWService**, or **automatic DWService remote clipboard**.

## License, Author, And Disclaimer

Author and maintainer: Adam Stypulkowski <adam.stypulkowski@itprosupport.eu>

This project is licensed under the Mozilla Public License Version 2.0 (`MPL-2.0`) to align with the DWService Agent core licensing model.

This software is provided as-is. Use it at your own risk. To the maximum extent permitted by applicable law, the author and maintainer is not liable for damages, losses, security incidents, service interruptions, clipboard mistakes, or other consequences arising from use of this software. See `DISCLAIMER.md` and `LICENSE`.
