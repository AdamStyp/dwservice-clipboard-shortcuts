// SPDX-License-Identifier: MPL-2.0
// Copyright (c) 2026 Adam Stypulkowski
(function installDwServiceApiBridge(root) {
  "use strict";

  const REQUEST_EVENT = "DWClipboardShortcuts:dwserviceApiRequest";
  const RESPONSE_EVENT = "DWClipboardShortcuts:dwserviceApiResponse";
  const DEFAULT_TIMEOUT_MS = 12000;

  class DwServiceApiBridge {
    constructor(pageRoot) {
      this.root = pageRoot;
      this.cachedCommon = null;
    }

    install() {
      if (this.root.__dwClipboardShortcutsDwServiceApiBridge) {
        return;
      }

      this.root.__dwClipboardShortcutsDwServiceApiBridge = true;
      this.root.addEventListener(REQUEST_EVENT, (event) => {
        void this.handleRequest(event);
      });
    }

    async handleRequest(event) {
      const request = this.parseDetail(event.detail);
      if (!request?.id || typeof request.action !== "string") {
        return;
      }

      try {
        const result = await this.dispatch(request);
        this.respond(request.id, true, result);
      } catch (error) {
        this.respond(request.id, false, null, this.normalizeError(error));
      }
    }

    async dispatch(request) {
      if (request.action === "ping") {
        return { available: Boolean(this.findCommon()) };
      }

      if (request.action === "resetCache") {
        this.cachedCommon = null;
        return { reset: true };
      }

      const common = this.requireCommon();
      if (request.action === "pasteText") {
        const text = String(request.payload?.text ?? "");
        await this.waitDwPromise(common.sendSetClipboardData("text", text), DEFAULT_TIMEOUT_MS);
        common.sendKeyboard("KEY", "V", true, false, false, false);
        return { length: text.length };
      }

      if (request.action === "readRemoteClipboard") {
        const value = await this.waitDwPromise(common.sendGetClipboardData(), DEFAULT_TIMEOUT_MS);
        return { text: String(value?.text ?? "") };
      }

      if (request.action === "sendRemoteCopy") {
        common.sendKeyboard("KEY", "C", true, false, false, false);
        return { sent: true };
      }

      if (request.action === "sendRemotePaste") {
        common.sendKeyboard("KEY", "V", true, false, false, false);
        return { sent: true };
      }

      throw new Error(`Unsupported DWService API action: ${request.action}`);
    }

    requireCommon() {
      const common = this.findCommon();
      if (!common) {
        throw new Error("DWService desktop API was not found in this frame.");
      }

      if (typeof common.isConnect === "function" && !common.isConnect()) {
        throw new Error("DWService desktop API is present, but the remote session is not connected.");
      }

      return common;
    }

    findCommon() {
      if (this.isCommonReady(this.cachedCommon)) {
        return this.cachedCommon;
      }

      const roots = this.getSearchRoots();
      for (const candidateRoot of roots) {
        const common = this.searchObjectGraph(candidateRoot);
        if (common) {
          this.cachedCommon = common;
          return common;
        }
      }

      this.cachedCommon = null;
      return null;
    }

    getSearchRoots() {
      const dws = this.root.dws;
      const roots = [];
      const components = this.getComponentList(dws);
      for (const component of this.prioritizeComponents(components)) {
        this.pushValue(roots, component);
      }

      this.pushValue(roots, dws?.getGlobalObject?.("main"));
      this.pushValue(roots, dws?._globalObjects);
      this.pushValue(roots, dws?.ui?.Component?.list);
      this.pushValue(roots, dws?.getGlobalObject?.("desktop"));
      this.pushValue(roots, dws?.getGlobalObject?.("session"));
      this.pushValue(roots, dws?.ui?.Component?._list);
      this.pushValue(roots, dws);
      return roots;
    }

    getComponentList(dws) {
      const list = dws?.ui?.Component?._list;
      if (!this.isObjectLike(list)) {
        return [];
      }

      try {
        return Object.keys(list).map((key) => list[key]).filter(Boolean);
      } catch (_error) {
        return [];
      }
    }

    prioritizeComponents(components) {
      return [...components].sort((left, right) =>
        this.componentPriority(right) - this.componentPriority(left)
      );
    }

    componentPriority(component) {
      let score = 0;
      const className = String(component?.declaredClass || "");
      if (className === "dws.agent.desktop.Desktop") {
        score += 100;
      } else if (className.includes("desktop")) {
        score += 40;
      }

      if (this.isCommonUsable(component?.common)) {
        score += 80;
      }

      for (const field of ["copyPasteInProgress", "cmpDraw", "popupClipboard", "cmpDesktop"]) {
        if (Object.prototype.hasOwnProperty.call(component || {}, field)) {
          score += 20;
        }
      }

      return score;
    }

    searchObjectGraph(start) {
      const queue = [{ value: start, depth: 0 }];
      const seen = new WeakSet();
      let disconnectedCandidate = null;
      let visited = 0;

      while (queue.length > 0 && visited < 8000) {
        const current = queue.shift();
        const value = current.value;
        if (!this.isObjectLike(value) || seen.has(value)) {
          continue;
        }

        seen.add(value);
        visited += 1;

        const common = this.extractCommon(value);
        if (common) {
          if (this.isCommonReady(common)) {
            return common;
          }

          disconnectedCandidate = disconnectedCandidate || common;
        }

        if (current.depth >= 8) {
          continue;
        }

        for (const child of this.safeValues(value)) {
          if (this.isObjectLike(child) && !seen.has(child)) {
            queue.push({ value: child, depth: current.depth + 1 });
          }
        }
      }

      return disconnectedCandidate;
    }

    extractCommon(value) {
      if (this.isCommonUsable(value)) {
        return value;
      }

      if (this.isCommonUsable(value?.common)) {
        return value.common;
      }

      if (this.isCommonUsable(value?.desktop?.common)) {
        return value.desktop.common;
      }

      if (this.isCommonUsable(value?.parent?.common)) {
        return value.parent.common;
      }

      return null;
    }

    isCommonUsable(value) {
      return this.isObjectLike(value) &&
        typeof value.sendSetClipboardData === "function" &&
        typeof value.sendGetClipboardData === "function" &&
        typeof value.sendKeyboard === "function" &&
        this.hasCommonRuntimeSignal(value);
    }

    isCommonReady(value) {
      return this.isCommonUsable(value) &&
        (typeof value.isConnect !== "function" || value.isConnect());
    }

    hasRuntimeFields(value) {
      return ["socketAgent", "idConnection", "parent", "drawComponent", "clipboardDeferred"]
        .some((field) => Object.prototype.hasOwnProperty.call(value, field));
    }

    hasCommonRuntimeSignal(value) {
      return this.hasRuntimeFields(value) ||
        typeof value.isConnect === "function" ||
        ["sendSetClipboardData", "sendGetClipboardData", "sendKeyboard"]
          .some((method) => Object.prototype.hasOwnProperty.call(value, method));
    }

    waitDwPromise(dwPromise, timeoutMs) {
      return new Promise((resolve, reject) => {
        let settled = false;
        const timer = this.root.setTimeout(() => {
          finish(() => reject(new Error("DWService clipboard request timed out.")));
        }, timeoutMs);

        const finish = (callback) => {
          if (settled) {
            return;
          }
          settled = true;
          this.root.clearTimeout(timer);
          callback();
        };

        try {
          dwPromise.then((event) => {
            if (event?.isResolved?.()) {
              finish(() => resolve(event.getResolvedValue?.()));
            } else if (event?.isRejected?.()) {
              finish(() => reject(this.toError(event.getRejectedError?.())));
            } else if (!event?.isResolved && !event?.isRejected) {
              finish(() => resolve(event));
            }
          });
        } catch (error) {
          finish(() => reject(error));
        }
      });
    }

    respond(id, ok, result, error = null) {
      const detail = JSON.stringify({ id, ok, result, error });
      this.root.dispatchEvent(new CustomEvent(RESPONSE_EVENT, { detail }));
    }

    parseDetail(detail) {
      try {
        return typeof detail === "string" ? JSON.parse(detail) : null;
      } catch (_error) {
        return null;
      }
    }

    normalizeError(error) {
      const normalized = this.toError(error);
      return {
        name: normalized.name,
        message: normalized.message
      };
    }

    toError(value) {
      if (value instanceof Error) {
        return value;
      }

      return new Error(String(value?.message || value || "Unknown DWService clipboard error."));
    }

    safeValues(value) {
      try {
        if (Array.isArray(value)) {
          return value;
        }

        return Object.keys(value).map((key) => value[key]);
      } catch (_error) {
        return [];
      }
    }

    pushValue(list, value) {
      if (value !== null && value !== undefined) {
        list.push(value);
      }
    }

    isObjectLike(value) {
      return (typeof value === "object" && value !== null) || typeof value === "function";
    }
  }

  root.DWClipboardMain = root.DWClipboardMain || {};
  root.DWClipboardMain.DwServiceApiBridge = DwServiceApiBridge;

  if (typeof root.addEventListener === "function") {
    new DwServiceApiBridge(root).install();
  }
})(globalThis);
