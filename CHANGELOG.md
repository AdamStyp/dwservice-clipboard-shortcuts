# Changelog

## 0.1.1

Current release build of DWService Clipboard Shortcuts.

### Changed

- Added background self-healing injection for already-open DWService tabs after install, update, startup, or bridge recovery request.
- Added one-time retry after DWService bridge cache reset when the runtime object becomes stale.
- Added cleanup for reinjected content scripts so shortcut and settings listeners are not duplicated.
- Added the `scripting` permission with host access limited to DWService domains only.
- Expanded regression tests for background reinjection, duplicate listener prevention, bridge cache reset, retry behavior, manifest permissions, and package metadata.
- Updated documentation to explain the new recovery behavior and the remaining cases where a tab refresh can still be required.

### Boundaries

- Text only.
- No clipboard history.
- No telemetry.
- No background network service.
- No DWService dialog automation.
- No synthetic paste events.
- No files, images, HTML, or binary clipboard formats.
- Linux and macOS remote machines are not yet confirmed.

## 0.1.0

Initial release build of DWService Clipboard Shortcuts.

### Included

- Manifest V3 extension for Google Chrome and Microsoft Edge.
- Content scripts scoped to DWService domains, including `https://access.dwservice.net/*`.
- Popup settings for enabling the extension, `Ctrl+C`, `Ctrl+V`, debug mode, and copy delay.
- Local text clipboard access through the browser Clipboard API.
- DWService runtime bridge for `sendSetClipboardData`, `sendGetClipboardData`, and `sendKeyboard`.
- `Ctrl+V` flow that sends local text to the remote clipboard and then issues remote `Ctrl+V`.
- `Ctrl+C` flow that waits for the remote copy action and then reads remote text through DWService.
- Remote desktop detection for opaque `https://access.dwservice.net/` session URLs.
- Defensive DWService runtime detection when internal field names change.
- Professional extension icon assets referenced from `manifest.json`.
- Regression tests for settings, Clipboard API access, content script shortcut flow, session detection, DWService API client, DWService API bridge, manifest boundaries, and package license metadata.
- Documentation for installation, architecture, testing, privacy, security, contribution rules, license, author, disclaimer, and the Windows-only manual remote-machine test status.
