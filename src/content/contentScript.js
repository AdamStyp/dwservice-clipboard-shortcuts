// SPDX-License-Identifier: MPL-2.0
// Copyright (c) 2026 Adam Stypulkowski
(function bootstrapContentScript(root) {
  "use strict";

  const namespace = root.DWClipboard;
  const storageArea = root.chrome?.storage?.sync || null;
  const settingsStore = new namespace.SettingsStore(storageArea, null);
  const logger = new namespace.DebugLogger(() => settingsStore.get());
  settingsStore.logger = logger;

  const dom = new namespace.DomUtils(logger);
  const sessionDetector = new namespace.SessionDetector(dom);
  const dwServiceApi = new namespace.DwServiceApiClient(logger);
  const clipboard = new namespace.ClipboardBridge(logger);

  let pasteInProgress = false;
  let copyTimer = null;
  let copyInProgress = false;

  settingsStore.load();
  settingsStore.subscribe();
  root.addEventListener("keydown", onKeyDown, true);

  function onKeyDown(event) {
    if (event.defaultPrevented || event.repeat || event.isTrusted === false) {
      return;
    }

    const shortcut = getShortcut(event);
    if (!shortcut) {
      return;
    }

    const settings = settingsStore.get();
    if (!settings.enabled || dom.isEditableTarget(event.target)) {
      return;
    }

    if (!sessionDetector.isRemoteSession()) {
      logger.debug(`Ignoring Ctrl+${shortcut.toUpperCase()} outside a detected DWService remote session.`);
      return;
    }

    if (shortcut === "v" && settings.ctrlVEnabled) {
      event.preventDefault();
      event.stopImmediatePropagation();
      void handlePasteShortcut();
      return;
    }

    if (shortcut === "c" && settings.ctrlCEnabled && !dom.hasLocalTextSelection()) {
      scheduleCopySync();
    }
  }

  async function handlePasteShortcut() {
    if (pasteInProgress) {
      logger.debug("Ctrl+V skipped because another paste operation is still running.");
      return;
    }

    pasteInProgress = true;
    try {
      const clipboardText = await clipboard.readLocalText();
      if (!clipboardText) {
        logger.debug("Ctrl+V stopped because the local clipboard did not contain text.");
        return;
      }

      await dwServiceApi.pasteText(clipboardText);
      logger.debug(`Sent local clipboard text through the DWService desktop API. Length: ${clipboardText.length}.`);
    } catch (error) {
      logger.debug("DWService desktop API paste failed. Operation stopped safely.", {
        name: error?.name,
        message: error?.message
      });
    } finally {
      pasteInProgress = false;
    }
  }

  function scheduleCopySync() {
    if (copyTimer) {
      root.clearTimeout(copyTimer);
    }

    const delayMs = settingsStore.get().copyDelayMs;
    copyTimer = root.setTimeout(() => {
      copyTimer = null;
      void handleCopySync();
    }, delayMs);

    logger.debug(`Ctrl+C detected. DWService copy synchronization scheduled in ${delayMs} ms.`);
  }

  async function handleCopySync() {
    if (copyInProgress) {
      logger.debug("Ctrl+C sync skipped because another copy operation is still running.");
      return;
    }

    copyInProgress = true;
    try {
      const result = await dwServiceApi.readRemoteClipboard();
      const text = String(result?.text ?? "");
      if (!text) {
        logger.debug("DWService desktop API returned an empty remote clipboard.");
        return;
      }

      await clipboard.writeLocalText(text);
      logger.debug(`Received remote clipboard text through the DWService desktop API. Length: ${text.length}.`);
    } catch (error) {
      logger.debug("DWService desktop API copy failed. Operation stopped safely.", {
        name: error?.name,
        message: error?.message
      });
    } finally {
      copyInProgress = false;
    }
  }

  function getShortcut(event) {
    if (!event.ctrlKey || event.altKey || event.metaKey || event.shiftKey) {
      return null;
    }

    const key = String(event.key || "").toLowerCase();
    if (key === "c" || event.code === "KeyC") {
      return "c";
    }

    if (key === "v" || event.code === "KeyV") {
      return "v";
    }

    return null;
  }
})(globalThis);
