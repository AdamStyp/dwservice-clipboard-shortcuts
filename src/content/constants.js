(function attachContentConstants(root) {
  "use strict";

  const namespace = root.DWClipboard || (root.DWClipboard = {});

  const SELECTORS = Object.freeze({
    remoteSurfaceHints: [
      "canvas",
      "[id*='desktop' i]",
      "[id*='screen' i]",
      "[class*='desktop' i]",
      "[class*='screen' i]"
    ],
    toolbarHints: [
      "[role='toolbar']",
      "[id*='toolbar' i]",
      "[class*='toolbar' i]",
      "[class*='tool-bar' i]"
    ]
  });

  namespace.SELECTORS = SELECTORS;
})(globalThis);
