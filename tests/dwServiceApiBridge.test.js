const test = require("node:test");
const assert = require("node:assert/strict");

delete globalThis.DWClipboardMain;
require("../src/content/dwServiceApiBridge.js");

class FakeCustomEvent extends Event {
  constructor(type, options = {}) {
    super(type);
    this.detail = options.detail;
  }
}

test("uses the connected DWService common instance instead of prototypes", async () => {
  const previousCustomEvent = globalThis.CustomEvent;
  globalThis.CustomEvent = FakeCustomEvent;

  try {
    const calls = [];
    const commonPrototype = {
      sendSetClipboardData() {},
      sendGetClipboardData() {},
      sendKeyboard() {},
      isConnect() {
        return false;
      }
    };
    const connectedCommon = Object.assign(Object.create(commonPrototype), {
      socketAgent: {},
      idConnection: "agent-1",
      isConnect: () => true,
      sendSetClipboardData(type, text) {
        calls.push(["set", type, text]);
        return dwResolved();
      },
      sendKeyboard(type, key, ctrl, alt, shift, command) {
        calls.push(["keyboard", type, key, ctrl, alt, shift, command]);
      }
    });
    const root = createRoot({
      dws: {
        ui: {
          Component: {
            _list: [
              Object.create(commonPrototype),
              { common: connectedCommon }
            ]
          }
        }
      }
    });
    const bridge = new globalThis.DWClipboardMain.DwServiceApiBridge(root);
    bridge.install();

    const response = waitForResponse(root);
    root.dispatchEvent(new CustomEvent("DWClipboardShortcuts:dwserviceApiRequest", {
      detail: JSON.stringify({
        id: "request-1",
        action: "pasteText",
        payload: { text: "hello" }
      })
    }));

    assert.deepEqual(await response, {
      id: "request-1",
      ok: true,
      result: { length: 5 },
      error: null
    });
    assert.deepEqual(calls, [
      ["set", "text", "hello"],
      ["keyboard", "KEY", "V", true, false, false, false]
    ]);
  } finally {
    globalThis.CustomEvent = previousCustomEvent;
  }
});

test("returns remote clipboard text from the DWService common instance", async () => {
  const previousCustomEvent = globalThis.CustomEvent;
  globalThis.CustomEvent = FakeCustomEvent;

  try {
    const root = createRoot({
      dws: {
        ui: {
          Component: {
            _list: [{
              common: {
                socketAgent: {},
                idConnection: "agent-1",
                isConnect: () => true,
                sendSetClipboardData() {},
                sendKeyboard() {},
                sendGetClipboardData() {
                  return dwResolved({ text: "remote text" });
                }
              }
            }]
          }
        }
      }
    });
    new globalThis.DWClipboardMain.DwServiceApiBridge(root).install();

    const response = waitForResponse(root);
    root.dispatchEvent(new CustomEvent("DWClipboardShortcuts:dwserviceApiRequest", {
      detail: JSON.stringify({
        id: "request-2",
        action: "readRemoteClipboard"
      })
    }));

    assert.deepEqual(await response, {
      id: "request-2",
      ok: true,
      result: { text: "remote text" },
      error: null
    });
  } finally {
    globalThis.CustomEvent = previousCustomEvent;
  }
});

function createRoot(properties) {
  const root = new EventTarget();
  Object.assign(root, properties, {
    setTimeout,
    clearTimeout
  });
  return root;
}

function waitForResponse(root) {
  return new Promise((resolve) => {
    root.addEventListener("DWClipboardShortcuts:dwserviceApiResponse", (event) => {
      resolve(JSON.parse(event.detail));
    }, { once: true });
  });
}

function dwResolved(value) {
  return {
    then(callback) {
      setTimeout(() => {
        callback({
          isResolved: () => true,
          isRejected: () => false,
          getResolvedValue: () => value
        });
      }, 0);
    }
  };
}
