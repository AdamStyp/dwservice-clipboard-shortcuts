// SPDX-License-Identifier: MPL-2.0
// Copyright (c) 2026 Adam Stypulkowski
(function bootstrapBackground(root) {
  "use strict";

  const DW_HOST_PATTERNS = Object.freeze([
    "https://dwservice.net/*",
    "https://access.dwservice.net/*",
    "https://www.dwservice.net/*",
    "https://*.dwservice.net/*"
  ]);

  const MAIN_WORLD_FILES = Object.freeze([
    "src/content/dwServiceApiBridge.js"
  ]);

  const ISOLATED_WORLD_FILES = Object.freeze([
    "src/shared/settings.js",
    "src/content/constants.js",
    "src/content/logger.js",
    "src/content/settingsStore.js",
    "src/content/domUtils.js",
    "src/content/sessionDetector.js",
    "src/content/dwServiceApiClient.js",
    "src/content/clipboardBridge.js",
    "src/content/contentScript.js"
  ]);

  class BackgroundController {
    constructor(browserApi) {
      this.chrome = browserApi;
    }

    install() {
      if (!this.chrome?.runtime || !this.chrome?.tabs || !this.chrome?.scripting) {
        return;
      }

      this.chrome.runtime.onInstalled?.addListener(() => {
        void this.injectIntoDwServiceTabs();
      });
      this.chrome.runtime.onStartup?.addListener(() => {
        void this.injectIntoDwServiceTabs();
      });
      this.chrome.tabs.onUpdated?.addListener((tabId, changeInfo, tab) => {
        if (changeInfo.status === "complete" && this.isDwServiceUrl(tab?.url)) {
          void this.injectIntoTab(tabId);
        }
      });
      this.chrome.runtime.onMessage?.addListener((message, sender, sendResponse) => {
        if (message?.type !== "DWClipboardShortcuts:ensureContentScripts") {
          return false;
        }

        const tabId = sender?.tab?.id;
        if (!Number.isInteger(tabId)) {
          sendResponse({ ok: false, error: "No sender tab." });
          return false;
        }

        this.injectIntoTab(tabId)
          .then(() => sendResponse({ ok: true }))
          .catch((error) => sendResponse({
            ok: false,
            error: String(error?.message || error)
          }));
        return true;
      });
    }

    async injectIntoDwServiceTabs() {
      const tabs = await this.chrome.tabs.query({ url: [...DW_HOST_PATTERNS] });
      await Promise.allSettled(
        tabs
          .filter((tab) => Number.isInteger(tab.id))
          .map((tab) => this.injectIntoTab(tab.id))
      );
    }

    async injectIntoTab(tabId) {
      await this.chrome.scripting.executeScript({
        target: { tabId, allFrames: true },
        files: [...MAIN_WORLD_FILES],
        world: "MAIN"
      });
      await this.chrome.scripting.executeScript({
        target: { tabId, allFrames: true },
        files: [...ISOLATED_WORLD_FILES]
      });
    }

    isDwServiceUrl(url) {
      if (!url) {
        return false;
      }

      try {
        const parsed = new URL(url);
        return parsed.protocol === "https:" &&
          (parsed.hostname === "dwservice.net" ||
            parsed.hostname === "www.dwservice.net" ||
            parsed.hostname === "access.dwservice.net" ||
            parsed.hostname.endsWith(".dwservice.net"));
      } catch (_error) {
        return false;
      }
    }
  }

  root.DWClipboardBackground = {
    BackgroundController,
    DW_HOST_PATTERNS,
    MAIN_WORLD_FILES,
    ISOLATED_WORLD_FILES
  };

  new BackgroundController(root.chrome).install();
})(globalThis);
