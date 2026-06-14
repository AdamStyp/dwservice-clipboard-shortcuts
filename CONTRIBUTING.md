# Contributing

This project is intentionally small. Changes should preserve the local-only privacy model and avoid broad permissions.

## Development Principles

- Keep source files focused and below 300 lines when practical.
- Keep code, UI text, and documentation in English.
- Do not add telemetry, analytics, remote services, or clipboard history.
- Do not add a background worker unless a concrete background responsibility appears.
- Do not add broad host permissions.
- Do not automate DWService dialogs or click controls by index or position.
- Prefer DWService runtime APIs over DOM automation.

## Local Workflow

1. Make the smallest change that solves the issue.
2. Add or update tests when behavior changes.
3. Run:

```sh
npm test
```

4. Load the extension unpacked in Chrome or Edge for manual verification when shortcut behavior changes.

## Code Style

- Use plain JavaScript compatible with Manifest V3 content scripts.
- Avoid build steps unless they provide clear value.
- Keep shared browser globals under the `DWClipboard` namespace.
- Keep the main-world bridge under `DWClipboardMain`.
- Keep comments short and useful.

## DWService Runtime Changes

If DWService changes its JavaScript runtime:

1. Inspect the active remote desktop page in DevTools.
2. Locate the active desktop component and its `common` clipboard methods.
3. Update `src/content/dwServiceApiBridge.js`.
4. Add or update bridge tests.
5. Verify debug logs do not expose clipboard text.

## Pull Request Checklist

- Tests pass.
- Clipboard content is not logged or stored.
- Extension permissions remain minimal.
- Host matches remain limited to DWService domains.
- Documentation reflects current behavior.
