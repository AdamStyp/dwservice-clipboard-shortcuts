// SPDX-License-Identifier: MPL-2.0
// Copyright (c) 2026 Adam Stypulkowski
const test = require("node:test");
const assert = require("node:assert/strict");

delete globalThis.DWClipboard;

Object.defineProperty(globalThis, "location", {
  value: {
    hostname: "access.dwservice.net",
    pathname: "/opaque-session-token",
    hash: "",
    search: ""
  },
  configurable: true
});

require("../src/content/constants.js");
require("../src/content/sessionDetector.js");

test("detects a DWService remote desktop on opaque access URLs when remote UI is visible", () => {
  const detector = new globalThis.DWClipboard.SessionDetector(createDom(true));

  assert.equal(detector.isRemoteSession(), true);
});

test("does not detect a DWService session when no remote UI hint is visible", () => {
  const detector = new globalThis.DWClipboard.SessionDetector(createDom(false));

  assert.equal(detector.isRemoteSession(), false);
});

test("does not detect remote sessions outside the DWService access host", () => {
  globalThis.location.hostname = "www.dwservice.net";

  try {
    const detector = new globalThis.DWClipboard.SessionDetector(createDom(true));
    assert.equal(detector.isRemoteSession(), false);
  } finally {
    globalThis.location.hostname = "access.dwservice.net";
  }
});

function createDom(hasRemoteUi) {
  return {
    findFirstVisible(selectors) {
      assert.ok(Array.isArray(selectors));
      return hasRemoteUi ? {} : null;
    }
  };
}
