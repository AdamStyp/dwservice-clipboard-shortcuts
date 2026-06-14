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

### `tests/contentScript.integration.test.js`

Verifies that `Ctrl+V` on an opaque `access.dwservice.net` session URL dispatches a DWService paste request and that editable page fields are not intercepted.

### `tests/dwServiceApiClient.test.js`

Verifies isolated-world request serialization, matching responses, and error responses.

### `tests/dwServiceApiBridge.test.js`

Verifies that the main-world bridge:

- prefers a connected DWService `common` instance over prototypes,
- returns remote clipboard text from `sendGetClipboardData()`,
- accepts a connected DWService `common` instance when internal field names change,
- calls `sendSetClipboardData()` followed by DWService remote `Ctrl+V`.

### `tests/sessionDetector.test.js`

Verifies remote desktop detection on opaque `https://access.dwservice.net/` URLs and confirms that non-session pages are ignored.

### `tests/manifest.test.js`

Verifies minimal permissions, DWService-only host matches, and packaged icon references.

## Manual Regression Checklist

Manual remote-machine compatibility has currently been verified only with Windows remote desktop sessions. Linux and macOS remote machines are not yet confirmed and should be tested separately before claiming support.

1. Load the extension unpacked in Chrome.
2. Load the extension unpacked in Microsoft Edge.
3. Open a DWService remote desktop session on `https://access.dwservice.net/` connected to a Windows remote machine.
4. Confirm `Ctrl+V` does not run inside DWService login fields or normal page form fields.
5. Copy local text, focus a remote text field, press `Ctrl+V`, and verify text appears remotely.
6. Select text remotely, press `Ctrl+C`, wait for the configured delay, and verify local clipboard text changes.
7. Enable debug mode and confirm logs use the `[DWService Clipboard]` prefix.
8. Confirm debug logs never print clipboard content.
9. Disable the extension in the popup and confirm shortcuts are no longer handled.
10. Disable only `Ctrl+C` or only `Ctrl+V` and confirm each option is respected.

## Release Package Checklist

1. Build `dist/dwservice-clipboard-shortcuts-0.1.0.zip`.
2. Confirm the ZIP contains `manifest.json`, `src/`, `assets/`, tests, and documentation.
3. Extract the ZIP to a clean folder.
4. Load the extracted folder with `Load unpacked`.
5. Run the manual regression checklist against the extracted package.

## Adding Tests

Prefer tests for:

- settings migration or normalization,
- request/response behavior,
- DWService runtime bridge lookup,
- Clipboard API failure handling,
- editable-target detection,
- manifest permissions, hosts, and assets.

Keep tests independent from DWService network availability.
