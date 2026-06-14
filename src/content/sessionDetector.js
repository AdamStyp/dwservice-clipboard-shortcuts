(function attachSessionDetector(root) {
  "use strict";

  const namespace = root.DWClipboard || (root.DWClipboard = {});

  class SessionDetector {
    constructor(dom) {
      this.dom = dom;
      this.cache = { checkedAt: 0, value: false };
    }

    isRemoteSession() {
      const now = Date.now();
      if (now - this.cache.checkedAt < 1000) {
        return this.cache.value;
      }

      const value = this.isDwServiceAccessHost() && this.pageLooksLikeRemoteDesktop();
      this.cache = { checkedAt: now, value };
      return value;
    }

    isDwServiceAccessHost() {
      return /^access\.dwservice\.net$/i.test(root.location.hostname);
    }

    pageLooksLikeRemoteDesktop() {
      return Boolean(
        this.dom.findFirstVisible(namespace.SELECTORS.remoteSurfaceHints) ||
        this.dom.findFirstVisible(namespace.SELECTORS.toolbarHints)
      );
    }
  }

  namespace.SessionDetector = SessionDetector;
})(globalThis);
