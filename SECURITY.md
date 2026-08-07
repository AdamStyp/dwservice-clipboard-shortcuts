# Security

## Supported Version

Security fixes target the current `master` branch.

## Security Model

The extension follows a local, user-triggered model:

- content scripts run only on DWService hosts listed in `manifest.json`,
- clipboard access is attempted only after `Ctrl+C` or `Ctrl+V` in a detected remote desktop session,
- settings are stored in `chrome.storage.sync`,
- clipboard content is not stored,
- clipboard content is not logged,
- the background worker can inject scripts only into DWService hosts listed in `manifest.json`,
- no telemetry is implemented,
- no background network service is used.

## Clipboard Boundary

For paste, clipboard text is passed into the active DWService page and then into DWService's own remote desktop channel. This is required for the feature to work.

The extension does not send clipboard content to non-DWService hosts and does not create independent network requests.

## Main Risks

- A compromised DWService page could observe clipboard text that the user intentionally sends to that page.
- Browser clipboard access can be denied by Chrome or Edge permission and focus rules.
- DWService runtime changes can break the bridge until `src/content/dwServiceApiBridge.js` is updated.
- Remote clipboard operations can paste into the wrong remote window if focus is not where the user expects it to be.

## Defensive Rules

The code should:

- avoid handling shortcuts inside normal editable page fields,
- keep permissions limited to `storage`, `clipboardRead`, `clipboardWrite`, and `scripting`,
- use `scripting` only for DWService-tab reinjection and recovery,
- keep host access limited to DWService domains,
- avoid logging clipboard content,
- avoid dialog automation and index-based clicking,
- treat Clipboard API and DWService API failures as non-fatal.

## Out Of Scope

- Bypassing browser clipboard permission prompts.
- Forwarding files, images, HTML, or binary clipboard formats.
- Clipboard synchronization outside the active DWService page.
- Compatibility with arbitrary DWService runtime changes without code updates.

## Liability Notice

Use this extension at your own risk. It is provided as-is and without warranties. To the maximum extent permitted by applicable law, the author and maintainer is not liable for damages, losses, security incidents, service interruptions, clipboard mistakes, or other consequences arising from use of this software. See `DISCLAIMER.md` and `LICENSE`.
