// SPDX-License-Identifier: MPL-2.0
// Copyright (c) 2026 Adam Stypulkowski
const test = require("node:test");
const assert = require("node:assert/strict");

delete globalThis.DWClipboardBackground;
delete globalThis.chrome;
require("../src/background/background.js");

test("background URL matching stays limited to DWService HTTPS hosts", () => {
  const controller = new globalThis.DWClipboardBackground.BackgroundController(null);

  assert.equal(controller.isDwServiceUrl("https://access.dwservice.net/"), true);
  assert.equal(controller.isDwServiceUrl("https://www.dwservice.net/app"), true);
  assert.equal(controller.isDwServiceUrl("https://node.dwservice.net/path"), true);
  assert.equal(controller.isDwServiceUrl("http://access.dwservice.net/"), false);
  assert.equal(controller.isDwServiceUrl("https://dwservice.net.evil.example/"), false);
  assert.equal(controller.isDwServiceUrl("https://example.com/"), false);
});

test("background injection keeps main-world bridge before isolated content scripts", () => {
  const background = globalThis.DWClipboardBackground;

  assert.deepEqual(background.MAIN_WORLD_FILES, [
    "src/content/dwServiceApiBridge.js"
  ]);
  assert.equal(
    background.ISOLATED_WORLD_FILES.at(-1),
    "src/content/contentScript.js"
  );
  assert.ok(background.DW_HOST_PATTERNS.includes("https://access.dwservice.net/*"));
});
