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
