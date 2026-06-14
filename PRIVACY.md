# Privacy

DWService Clipboard Shortcuts is designed for local, user-triggered text clipboard transfer inside an active DWService remote desktop session.

Privacy contact: Adam Stypulkowski <adam.stypulkowski@itprosupport.eu>

## Data Processed

The extension can process text clipboard content only when the user presses:

- `Ctrl+V` in a detected DWService remote desktop session,
- `Ctrl+C` in a detected DWService remote desktop session.

The extension does not process files, images, HTML clipboard formats, binary clipboard data, or clipboard history.

## Local-To-Remote Paste

When the user presses `Ctrl+V`, the extension:

1. reads local text with `navigator.clipboard.readText()`,
2. sends that text to the active DWService page through an in-page event,
3. calls DWService's own `sendSetClipboardData("text", text)`,
4. asks DWService to send remote `Ctrl+V`.

This means clipboard text is visible to the active DWService page because DWService is the intended remote desktop transport. The extension does not send the text to any other host.

## Remote-To-Local Copy

When the user presses `Ctrl+C`, the extension:

1. lets the remote session receive the shortcut,
2. waits for the configured delay,
3. calls DWService's `sendGetClipboardData()`,
4. writes returned text locally with `navigator.clipboard.writeText()`.

## Storage

Only settings are stored in `chrome.storage.sync`:

- extension enabled state,
- `Ctrl+C` enabled state,
- `Ctrl+V` enabled state,
- debug mode,
- copy synchronization delay.

Clipboard content is not stored.

## Logging

Debug mode logs diagnostic messages to the DWService page console. Logs may include:

- operation names,
- error names and messages,
- clipboard text lengths.

Logs must not include clipboard text.

## Network

The extension does not create its own network requests and does not include telemetry. Clipboard transfer happens through the already active DWService page and DWService's own remote desktop connection.

## Permissions

The extension requests:

- `storage`,
- `clipboardRead`,
- `clipboardWrite`.

Host access is limited to DWService domains listed in `manifest.json`.

## Privacy Risks

- The active DWService page can receive clipboard text that the user intentionally sends with `Ctrl+V`.
- The selected remote agent can receive that text through DWService's normal authenticated remote desktop channel.
- Text returned by DWService after `Ctrl+C` can overwrite the local browser clipboard.
- A compromised DWService page or remote machine could observe text that the user sends to that session.

The extension mitigates additional risk by avoiding telemetry, avoiding clipboard history, avoiding non-DWService network requests, and keeping debug logs free of clipboard content.
