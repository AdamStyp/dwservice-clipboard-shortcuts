(function attachDomUtils(root) {
  "use strict";

  const namespace = root.DWClipboard || (root.DWClipboard = {});

  class DomUtils {
    constructor(logger) {
      this.logger = logger;
    }

    safeQueryAll(container, selector) {
      try {
        return Array.from(container.querySelectorAll(selector));
      } catch (error) {
        this.logger?.debug("Ignoring invalid selector.", { selector, message: error?.message });
        return [];
      }
    }

    isElement(value) {
      return typeof Element !== "undefined" && value instanceof Element;
    }

    isVisible(element) {
      if (!this.isElement(element)) {
        return false;
      }

      const view = element.ownerDocument?.defaultView || root;
      const style = view.getComputedStyle?.(element) || {};
      if (style.display === "none" || style.visibility === "hidden" || Number(style.opacity) === 0) {
        return false;
      }

      const rect = element.getBoundingClientRect();
      return rect.width > 0 && rect.height > 0;
    }

    findFirstVisible(selectors) {
      for (const selector of selectors) {
        const match = this.safeQueryAll(document, selector).find((element) => this.isVisible(element));
        if (match) {
          return match;
        }
      }

      return null;
    }

    isEditableTarget(target) {
      if (!this.isElement(target)) {
        return false;
      }

      return Boolean(target.closest([
        "input",
        "textarea",
        "select",
        "[contenteditable='true']",
        "[contenteditable='plaintext-only']",
        "[role='textbox']",
        "[role='searchbox']",
        "[role='combobox']",
        ".cm-editor",
        ".monaco-editor"
      ].join(",")));
    }

    hasLocalTextSelection() {
      const selection = root.getSelection?.();
      return Boolean(selection && selection.toString().length > 0);
    }
  }

  namespace.DomUtils = DomUtils;
})(globalThis);
