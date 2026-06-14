// SPDX-License-Identifier: MPL-2.0
// Copyright (c) 2026 Adam Stypulkowski
(function attachPopup(root) {
  "use strict";

  const namespace = root.DWClipboard;
  const fieldIds = Object.keys(namespace.DEFAULT_SETTINGS);
  const fields = {};
  let statusTimer = null;

  document.addEventListener("DOMContentLoaded", init);

  function init() {
    for (const fieldId of fieldIds) {
      fields[fieldId] = document.getElementById(fieldId);
    }

    chrome.storage.sync.get(namespace.DEFAULT_SETTINGS, (settings) => {
      render(namespace.sanitizeSettings(settings));
      attachListeners();
      setStatus("Ready");
    });

    chrome.storage.onChanged.addListener((changes, areaName) => {
      if (areaName !== "sync") {
        return;
      }

      const next = {};
      for (const fieldId of fieldIds) {
        next[fieldId] = changes[fieldId] ? changes[fieldId].newValue : getFieldValue(fieldId);
      }
      render(namespace.sanitizeSettings(next));
    });
  }

  function attachListeners() {
    for (const fieldId of fieldIds) {
      fields[fieldId].addEventListener("change", () => {
        chrome.storage.sync.set({ [fieldId]: getFieldValue(fieldId) }, () => {
          setStatus("Saved");
        });
      });
    }
  }

  function render(settings) {
    for (const fieldId of fieldIds) {
      const field = fields[fieldId];
      if (field.type === "checkbox") {
        field.checked = Boolean(settings[fieldId]);
      } else {
        field.value = String(settings[fieldId]);
      }
    }
  }

  function getFieldValue(fieldId) {
    const field = fields[fieldId];
    if (field.type === "checkbox") {
      return field.checked;
    }

    return namespace.clamp(Math.round(Number(field.value) || namespace.DEFAULT_SETTINGS[fieldId]), 50, 5000);
  }

  function setStatus(message) {
    const status = document.getElementById("status");
    status.textContent = message;

    if (statusTimer) {
      root.clearTimeout(statusTimer);
    }

    statusTimer = root.setTimeout(() => {
      status.textContent = "";
    }, 1800);
  }
})(globalThis);
