const test = require("node:test");
const assert = require("node:assert/strict");

delete globalThis.DWClipboard;
require("../src/shared/settings.js");

test("sanitizeSettings clamps copy delay and normalizes booleans", () => {
  const settings = globalThis.DWClipboard.sanitizeSettings({
    enabled: 1,
    ctrlCEnabled: "",
    ctrlVEnabled: "yes",
    debug: 0,
    copyDelayMs: 12000
  });

  assert.deepEqual(settings, {
    enabled: true,
    ctrlCEnabled: false,
    ctrlVEnabled: true,
    debug: false,
    copyDelayMs: 5000
  });
});

test("sanitizeSettings falls back to the default delay when invalid", () => {
  const settings = globalThis.DWClipboard.sanitizeSettings({ copyDelayMs: "not-a-number" });
  assert.equal(settings.copyDelayMs, 500);
  assert.equal(settings.enabled, true);
  assert.equal(settings.ctrlCEnabled, true);
  assert.equal(settings.ctrlVEnabled, true);
});
