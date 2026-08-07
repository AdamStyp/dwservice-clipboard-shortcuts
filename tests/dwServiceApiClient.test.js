// SPDX-License-Identifier: MPL-2.0
// Copyright (c) 2026 Adam Stypulkowski
const test = require("node:test");
const assert = require("node:assert/strict");

delete globalThis.DWClipboard;
require("../src/content/dwServiceApiClient.js");

class FakeCustomEvent extends Event {
  constructor(type, options = {}) {
    super(type);
    this.detail = options.detail;
  }
}

test("sends a DWService API request and resolves the matching response", async () => {
  const previousCustomEvent = globalThis.CustomEvent;
  globalThis.CustomEvent = FakeCustomEvent;

  try {
    const events = new EventTarget();
    events.setTimeout = setTimeout;
    events.clearTimeout = clearTimeout;
    const client = new globalThis.DWClipboard.DwServiceApiClient({ debug() {} }, events);

    events.addEventListener("DWClipboardShortcuts:dwserviceApiRequest", (event) => {
      const request = JSON.parse(event.detail);
      assert.equal(request.action, "pasteText");
      assert.deepEqual(request.payload, { text: "hello" });

      events.dispatchEvent(new CustomEvent("DWClipboardShortcuts:dwserviceApiResponse", {
        detail: JSON.stringify({
          id: request.id,
          ok: true,
          result: { length: 5 }
        })
      }));
    });

    const result = await client.pasteText("hello");
    assert.deepEqual(result, { length: 5 });
  } finally {
    globalThis.CustomEvent = previousCustomEvent;
  }
});

test("rejects when the DWService API response reports an error", async () => {
  const previousCustomEvent = globalThis.CustomEvent;
  globalThis.CustomEvent = FakeCustomEvent;

  try {
    const events = new EventTarget();
    events.setTimeout = setTimeout;
    events.clearTimeout = clearTimeout;
    const client = new globalThis.DWClipboard.DwServiceApiClient({ debug() {} }, events);

    events.addEventListener("DWClipboardShortcuts:dwserviceApiRequest", (event) => {
      const request = JSON.parse(event.detail);
      events.dispatchEvent(new CustomEvent("DWClipboardShortcuts:dwserviceApiResponse", {
        detail: JSON.stringify({
          id: request.id,
          ok: false,
          error: { name: "Error", message: "not connected" }
        })
      }));
    });

    await assert.rejects(
      () => client.readRemoteClipboard(),
      /not connected/
    );
  } finally {
    globalThis.CustomEvent = previousCustomEvent;
  }
});

test("retries a DWService API request after resetting the bridge cache", async () => {
  const previousCustomEvent = globalThis.CustomEvent;
  const previousChrome = globalThis.chrome;
  globalThis.CustomEvent = FakeCustomEvent;

  try {
    const messages = [];
    globalThis.chrome = {
      runtime: {
        lastError: null,
        sendMessage(message, callback) {
          messages.push(message);
          callback({ ok: false });
        }
      }
    };

    const events = new EventTarget();
    events.setTimeout = setTimeout;
    events.clearTimeout = clearTimeout;
    const client = new globalThis.DWClipboard.DwServiceApiClient({ debug() {} }, events);
    const actions = [];

    events.addEventListener("DWClipboardShortcuts:dwserviceApiRequest", (event) => {
      const request = JSON.parse(event.detail);
      actions.push(request.action);

      if (request.action === "pasteText" && actions.filter((action) => action === "pasteText").length === 1) {
        events.dispatchEvent(new CustomEvent("DWClipboardShortcuts:dwserviceApiResponse", {
          detail: JSON.stringify({
            id: request.id,
            ok: false,
            error: { name: "Error", message: "stale bridge" }
          })
        }));
        return;
      }

      events.dispatchEvent(new CustomEvent("DWClipboardShortcuts:dwserviceApiResponse", {
        detail: JSON.stringify({
          id: request.id,
          ok: true,
          result: request.action === "resetCache" ? { reset: true } : { length: 5 }
        })
      }));
    });

    const result = await client.pasteText("hello");

    assert.deepEqual(result, { length: 5 });
    assert.deepEqual(actions, ["pasteText", "resetCache", "pasteText"]);
    assert.deepEqual(messages, [{ type: "DWClipboardShortcuts:ensureContentScripts" }]);
  } finally {
    globalThis.CustomEvent = previousCustomEvent;
    restoreGlobal("chrome", previousChrome);
  }
});

function restoreGlobal(name, value) {
  if (value === undefined) {
    delete globalThis[name];
    return;
  }

  Object.defineProperty(globalThis, name, {
    value,
    configurable: true,
    writable: true
  });
}
