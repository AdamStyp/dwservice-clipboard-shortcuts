# Changelog

## 0.1.2

Current build of DWService Clipboard Shortcuts.

### Included

- Manifest V3 extension for Chrome and Microsoft Edge.
- Content scripts scoped to DWService domains, including `https://access.dwservice.net/*`.
- Popup settings for enabling the extension, `Ctrl+C`, `Ctrl+V`, debug mode, and copy delay.
- Local text clipboard access through the browser Clipboard API.
- DWService runtime bridge for `sendSetClipboardData`, `sendGetClipboardData`, and `sendKeyboard`.
- `Ctrl+V` flow that sends local text to the remote clipboard and then issues remote `Ctrl+V`.
- `Ctrl+C` flow that waits for the remote copy action and then reads remote text through DWService.
- Professional extension icon set for Chrome and Microsoft Edge.
- MPL-2.0 license metadata, notice, and author contact.
- More tolerant DWService session detection for opaque `access.dwservice.net` remote desktop URLs.
- More tolerant DWService runtime bridge detection when internal field names change.
- Regression tests for settings, Clipboard API access, DWService API client, DWService API bridge, session detection, manifest permissions, host scope, and icon assets.
- Documentation for installation, architecture, testing, privacy, security, and contribution rules.

### Boundaries

- Text only.
- No clipboard history.
- No telemetry.
- No background worker.
- No DWService dialog automation.
- No synthetic paste events.
- No files, images, HTML, or binary clipboard formats.
