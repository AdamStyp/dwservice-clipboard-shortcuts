// SPDX-License-Identifier: MPL-2.0
// Copyright (c) 2026 Adam Stypulkowski
(function attachSettingsStore(root) {
  "use strict";

  const namespace = root.DWClipboard || (root.DWClipboard = {});

  class SettingsStore {
    constructor(storageArea, logger) {
      this.storageArea = storageArea;
      this.logger = logger;
      this.settings = namespace.sanitizeSettings(namespace.DEFAULT_SETTINGS);
    }

    get() {
      return this.settings;
    }

    load() {
      if (!this.storageArea) {
        return Promise.resolve(this.settings);
      }

      return new Promise((resolve) => {
        this.storageArea.get(namespace.DEFAULT_SETTINGS, (stored) => {
          this.settings = namespace.sanitizeSettings(stored);
          this.logger?.debug("Settings loaded.");
          resolve(this.settings);
        });
      });
    }

    subscribe() {
      if (!root.chrome?.storage?.onChanged) {
        return;
      }

      root.chrome.storage.onChanged.addListener((changes, areaName) => {
        if (areaName !== "sync") {
          return;
        }

        const next = { ...this.settings };
        for (const key of Object.keys(namespace.DEFAULT_SETTINGS)) {
          if (changes[key]) {
            next[key] = changes[key].newValue;
          }
        }

        this.settings = namespace.sanitizeSettings(next);
        this.logger?.debug("Settings updated.");
      });
    }
  }

  namespace.SettingsStore = SettingsStore;
})(globalThis);
