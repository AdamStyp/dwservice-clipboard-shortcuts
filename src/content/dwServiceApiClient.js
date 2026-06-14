(function attachDwServiceApiClient(root) {
  "use strict";

  const namespace = root.DWClipboard || (root.DWClipboard = {});
  const REQUEST_EVENT = "DWClipboardShortcuts:dwserviceApiRequest";
  const RESPONSE_EVENT = "DWClipboardShortcuts:dwserviceApiResponse";

  class DwServiceApiClient {
    constructor(logger, eventRoot = root) {
      this.logger = logger;
      this.root = eventRoot;
      this.nextId = 1;
      this.timeoutMs = 15000;
    }

    async isAvailable() {
      const result = await this.request("ping", null, { timeoutMs: 1500 });
      return Boolean(result?.available);
    }

    pasteText(text) {
      return this.request("pasteText", { text });
    }

    readRemoteClipboard() {
      return this.request("readRemoteClipboard");
    }

    sendRemoteCopy() {
      return this.request("sendRemoteCopy", null, { timeoutMs: 2500 });
    }

    sendRemotePaste() {
      return this.request("sendRemotePaste", null, { timeoutMs: 2500 });
    }

    request(action, payload = null, options = {}) {
      const id = this.createRequestId();
      const timeoutMs = options.timeoutMs ?? this.timeoutMs;

      return new Promise((resolve, reject) => {
        const timer = this.root.setTimeout(() => {
          cleanup();
          reject(new Error(`DWService API request timed out: ${action}`));
        }, timeoutMs);

        const onResponse = (event) => {
          const response = this.parseDetail(event.detail);
          if (!response || response.id !== id) {
            return;
          }

          cleanup();
          if (response.ok) {
            resolve(response.result);
          } else {
            reject(this.toError(response.error));
          }
        };

        const cleanup = () => {
          this.root.clearTimeout(timer);
          this.root.removeEventListener(RESPONSE_EVENT, onResponse);
        };

        this.root.addEventListener(RESPONSE_EVENT, onResponse);
        this.dispatchRequest({ id, action, payload });
      });
    }

    dispatchRequest(request) {
      const detail = JSON.stringify(request);
      this.root.dispatchEvent(new CustomEvent(REQUEST_EVENT, { detail }));
    }

    createRequestId() {
      const suffix = this.nextId;
      this.nextId += 1;
      return `dwclip-${Date.now()}-${suffix}`;
    }

    parseDetail(detail) {
      try {
        return typeof detail === "string" ? JSON.parse(detail) : null;
      } catch (error) {
        this.logger?.debug("Could not parse DWService API response.", {
          name: error?.name,
          message: error?.message
        });
        return null;
      }
    }

    toError(value) {
      const message = value?.message || value || "Unknown DWService API error.";
      const error = new Error(String(message));
      if (value?.name) {
        error.name = value.name;
      }
      return error;
    }
  }

  namespace.DwServiceApiClient = DwServiceApiClient;
})(globalThis);
