// SPDX-License-Identifier: MPL-2.0
// Copyright (c) 2026 Adam Stypulkowski
(function attachLogger(root) {
  "use strict";

  const namespace = root.DWClipboard || (root.DWClipboard = {});

  class DebugLogger {
    constructor(getSettings) {
      this.getSettings = getSettings;
      this.prefix = "[DWService Clipboard]";
    }

    debug(message, details) {
      if (!this.getSettings()?.debug) {
        return;
      }

      if (details === undefined) {
        console.debug(`${this.prefix} ${message}`);
        return;
      }

      console.debug(`${this.prefix} ${message}`, details);
    }
  }

  namespace.DebugLogger = DebugLogger;
})(globalThis);
