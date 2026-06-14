# Testing

The project uses Node's built-in `node:test` runner. Tests focus on pure logic so they can run without Chrome, Edge, or a live DWService session.

## Run Tests

```sh
npm test
```

## Current Coverage

### `tests/settings.test.js`

Verifies settings normalization and copy delay clamping.

### `tests/clipboardBridge.test.js`

Verifies that local reads and writes use only `navigator.clipboard.readText()` and `navigator.clipboard.writeText()`.

### `tests/dwServiceApiClient.test.js`

Verifies isolated-world request serialization, matching responses, and error responses.

### `tests/dwServiceApiBridge.test.js`

Verifies that the main-world bridge:

- prefers a connected DWService `common` instance over prototypes,
- returns remote clipboard text from `sendGetClipboardData()`,
- calls `sendSetClipboardData()` followed by DWService remote `Ctrl+V`.

### `tests/manifest.test.js`

Verifies that the manifest keeps minimal permissions, stays scoped to DWService hosts, and points to existing Chrome/Edge icon assets.

### `tests/sessionDetector.test.js`

Verifies that opaque `access.dwservice.net` URLs are accepted when visible remote desktop UI hints are present, while non-session pages and non-access hosts are ignored.

## Manual Regression Checklist

1. Load the extension unpacked in Chrome.
2. Load the extension unpacked in Microsoft Edge.
3. Open a DWService remote desktop session on `https://access.dwservice.net/`.
4. Confirm `Ctrl+V` does not run inside DWService login fields or normal page form fields.
5. Copy local text, focus a remote text field, press `Ctrl+V`, and verify text appears remotely.
6. Select text remotely, press `Ctrl+C`, wait for the configured delay, and verify local clipboard text changes.
7. Enable debug mode and confirm logs use the `[DWService Clipboard]` prefix.
8. Confirm debug logs never print clipboard content.
9. Disable the extension in the popup and confirm shortcuts are no longer handled.
10. Disable only `Ctrl+C` or only `Ctrl+V` and confirm each option is respected.

## Adding Tests

Prefer tests for:

- settings migration or normalization,
- request/response behavior,
- DWService runtime bridge lookup,
- Clipboard API failure handling,
- editable-target detection.

Keep tests independent from DWService network availability.
