const test = require("node:test");
const assert = require("node:assert/strict");

delete globalThis.DWClipboard;
require("../src/content/clipboardBridge.js");

test("reads local text through the Clipboard API only", async () => {
  const previousNavigator = globalThis.navigator;
  Object.defineProperty(globalThis, "navigator", {
    configurable: true,
    value: {
      clipboard: {
        readText: async () => "local text"
      }
    }
  });

  try {
    const bridge = new globalThis.DWClipboard.ClipboardBridge({ debug() {} });
    assert.equal(await bridge.readLocalText(), "local text");
  } finally {
    Object.defineProperty(globalThis, "navigator", {
      configurable: true,
      value: previousNavigator
    });
  }
});

test("writes local text through the Clipboard API only", async () => {
  const previousNavigator = globalThis.navigator;
  const writes = [];
  Object.defineProperty(globalThis, "navigator", {
    configurable: true,
    value: {
      clipboard: {
        writeText: async (text) => writes.push(text)
      }
    }
  });

  try {
    const bridge = new globalThis.DWClipboard.ClipboardBridge({ debug() {} });
    assert.equal(await bridge.writeLocalText("remote text"), true);
    assert.deepEqual(writes, ["remote text"]);
  } finally {
    Object.defineProperty(globalThis, "navigator", {
      configurable: true,
      value: previousNavigator
    });
  }
});
