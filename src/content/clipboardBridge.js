(function attachClipboardBridge(root) {
  "use strict";

  const namespace = root.DWClipboard || (root.DWClipboard = {});

  class ClipboardBridge {
    constructor(logger) {
      this.logger = logger;
    }

    async readLocalText() {
      if (!navigator.clipboard?.readText) {
        this.logger.debug("Clipboard read is unavailable. The browser may require focus, HTTPS, or permission.");
        return null;
      }

      try {
        return await navigator.clipboard.readText();
      } catch (error) {
        this.logger.debug("Clipboard read failed. The browser may require explicit permission or a user gesture.", {
          name: error?.name,
          message: error?.message
        });
        return null;
      }
    }

    async writeLocalText(text) {
      if (!navigator.clipboard?.writeText) {
        this.logger.debug("Clipboard write is unavailable. The browser may require focus, HTTPS, or permission.");
        return false;
      }

      try {
        await navigator.clipboard.writeText(text);
        this.logger.debug(`Copied remote text to the local clipboard. Length: ${text.length}.`);
        return true;
      } catch (error) {
        this.logger.debug("Clipboard write failed. The browser may require explicit permission or a user gesture.", {
          name: error?.name,
          message: error?.message
        });
        return false;
      }
    }
  }

  namespace.ClipboardBridge = ClipboardBridge;
})(globalThis);
