// SPDX-License-Identifier: MPL-2.0
// Copyright (c) 2026 Adam Stypulkowski
const test = require("node:test");
const assert = require("node:assert/strict");

const REQUEST_EVENT = "DWClipboardShortcuts:dwserviceApiRequest";
const RESPONSE_EVENT = "DWClipboardShortcuts:dwserviceApiResponse";

test("Ctrl+V dispatches a DWService paste request on opaque access URLs", async () => {
  const environment = installEnvironment({ hasRemoteSurface: true });

  try {
    loadContentScript();

    const requests = [];
    globalThis.addEventListener(REQUEST_EVENT, (event) => {
      const request = JSON.parse(event.detail);
      requests.push(request);
      globalThis.dispatchEvent(new CustomEvent(RESPONSE_EVENT, {
        detail: JSON.stringify({
          id: request.id,
          ok: true,
          result: { length: request.payload.text.length },
          error: null
        })
      }));
    });

    const keyEvent = createKeyEvent({ key: "v", code: "KeyV", target: new FakeElement() });
    environment.dispatchKeydown(keyEvent);
    await waitForAsyncWork();

    assert.equal(keyEvent.defaultPrevented, true);
    assert.equal(keyEvent.immediatePropagationStopped, true);
    assert.equal(requests.length, 1);
    assert.equal(requests[0].action, "pasteText");
    assert.deepEqual(requests[0].payload, { text: "local clipboard text" });
  } finally {
    environment.restore();
  }
});

test("Ctrl+V is not intercepted inside editable page fields", async () => {
  const environment = installEnvironment({ hasRemoteSurface: true });

  try {
    loadContentScript();

    const requests = [];
    globalThis.addEventListener(REQUEST_EVENT, (event) => {
      requests.push(JSON.parse(event.detail));
    });

    const keyEvent = createKeyEvent({
      key: "v",
      code: "KeyV",
      target: new FakeElement({ editable: true })
    });
    environment.dispatchKeydown(keyEvent);
    await waitForAsyncWork();

    assert.equal(keyEvent.defaultPrevented, false);
    assert.equal(keyEvent.immediatePropagationStopped, false);
    assert.equal(requests.length, 0);
  } finally {
    environment.restore();
  }
});

function installEnvironment({ hasRemoteSurface }) {
  clearContentScriptModules();
  delete globalThis.DWClipboard;

  const previous = {
    addEventListener: globalThis.addEventListener,
    removeEventListener: globalThis.removeEventListener,
    dispatchEvent: globalThis.dispatchEvent,
    CustomEvent: globalThis.CustomEvent,
    Element: globalThis.Element,
    chrome: globalThis.chrome,
    document: globalThis.document,
    location: globalThis.location,
    navigator: globalThis.navigator,
    getComputedStyle: globalThis.getComputedStyle,
    getSelection: globalThis.getSelection
  };

  const listeners = new Map();
  globalThis.addEventListener = (type, listener) => {
    const existing = listeners.get(type) || [];
    existing.push(listener);
    listeners.set(type, existing);
  };
  globalThis.removeEventListener = (type, listener) => {
    listeners.set(type, (listeners.get(type) || []).filter((item) => item !== listener));
  };
  globalThis.dispatchEvent = (event) => {
    for (const listener of listeners.get(event.type) || []) {
      listener(event);
    }
    return true;
  };

  globalThis.CustomEvent = class FakeCustomEvent {
    constructor(type, options = {}) {
      this.type = type;
      this.detail = options.detail;
    }
  };

  globalThis.Element = FakeElement;
  globalThis.getComputedStyle = () => ({ display: "block", visibility: "visible", opacity: "1" });
  globalThis.getSelection = () => ({ toString: () => "" });
  Object.defineProperty(globalThis, "location", {
    value: {
      hostname: "access.dwservice.net",
      pathname: "/opaque-session-token",
      hash: "",
      search: ""
    },
    configurable: true
  });

  const document = {
    defaultView: globalThis,
    querySelectorAll() {
      return hasRemoteSurface ? [new FakeElement()] : [];
    }
  };
  Object.defineProperty(globalThis, "document", { value: document, configurable: true });
  Object.defineProperty(globalThis, "navigator", {
    value: {
      clipboard: {
        readText: async () => "local clipboard text",
        writeText: async () => true
      }
    },
    configurable: true
  });

  globalThis.chrome = {
    storage: {
      sync: {
        get(defaults, callback) {
          callback(defaults);
        }
      },
      onChanged: {
        addListener() {}
      }
    }
  };

  return {
    dispatchKeydown(event) {
      for (const listener of listeners.get("keydown") || []) {
        listener(event);
      }
    },
    restore() {
      clearContentScriptModules();
      delete globalThis.DWClipboard;
      restoreGlobal("addEventListener", previous.addEventListener);
      restoreGlobal("removeEventListener", previous.removeEventListener);
      restoreGlobal("dispatchEvent", previous.dispatchEvent);
      restoreGlobal("CustomEvent", previous.CustomEvent);
      restoreGlobal("Element", previous.Element);
      restoreGlobal("chrome", previous.chrome);
      restoreGlobal("document", previous.document);
      restoreGlobal("location", previous.location);
      restoreGlobal("navigator", previous.navigator);
      restoreGlobal("getComputedStyle", previous.getComputedStyle);
      restoreGlobal("getSelection", previous.getSelection);
    }
  };
}

class FakeElement {
  constructor(options = {}) {
    this.editable = Boolean(options.editable);
    this.ownerDocument = globalThis.document;
  }

  closest() {
    return this.editable ? this : null;
  }

  getBoundingClientRect() {
    return { width: 100, height: 100 };
  }
}

function createKeyEvent({ key, code, target }) {
  return {
    defaultPrevented: false,
    immediatePropagationStopped: false,
    repeat: false,
    ctrlKey: true,
    altKey: false,
    metaKey: false,
    shiftKey: false,
    key,
    code,
    target,
    preventDefault() {
      this.defaultPrevented = true;
    },
    stopImmediatePropagation() {
      this.immediatePropagationStopped = true;
    }
  };
}

function loadContentScript() {
  [
    "../src/shared/settings.js",
    "../src/content/constants.js",
    "../src/content/logger.js",
    "../src/content/settingsStore.js",
    "../src/content/domUtils.js",
    "../src/content/sessionDetector.js",
    "../src/content/dwServiceApiClient.js",
    "../src/content/clipboardBridge.js",
    "../src/content/contentScript.js"
  ].forEach((modulePath) => require(modulePath));
}

function clearContentScriptModules() {
  [
    "../src/shared/settings.js",
    "../src/content/constants.js",
    "../src/content/logger.js",
    "../src/content/settingsStore.js",
    "../src/content/domUtils.js",
    "../src/content/sessionDetector.js",
    "../src/content/dwServiceApiClient.js",
    "../src/content/clipboardBridge.js",
    "../src/content/contentScript.js"
  ].forEach((modulePath) => {
    delete require.cache[require.resolve(modulePath)];
  });
}

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

function waitForAsyncWork() {
  return new Promise((resolve) => setTimeout(resolve, 10));
}
