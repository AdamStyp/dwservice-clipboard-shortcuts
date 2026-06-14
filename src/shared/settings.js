(function attachSettings(root) {
  "use strict";

  const namespace = root.DWClipboard || (root.DWClipboard = {});

  const DEFAULT_SETTINGS = Object.freeze({
    enabled: true,
    ctrlCEnabled: true,
    ctrlVEnabled: true,
    debug: false,
    copyDelayMs: 500
  });

  function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
  }

  function sanitizeSettings(input = {}) {
    const delay = Number(input.copyDelayMs);

    return {
      enabled: input.enabled === undefined ? DEFAULT_SETTINGS.enabled : Boolean(input.enabled),
      ctrlCEnabled: input.ctrlCEnabled === undefined ? DEFAULT_SETTINGS.ctrlCEnabled : Boolean(input.ctrlCEnabled),
      ctrlVEnabled: input.ctrlVEnabled === undefined ? DEFAULT_SETTINGS.ctrlVEnabled : Boolean(input.ctrlVEnabled),
      debug: input.debug === undefined ? DEFAULT_SETTINGS.debug : Boolean(input.debug),
      copyDelayMs: Number.isFinite(delay)
        ? clamp(Math.round(delay), 50, 5000)
        : DEFAULT_SETTINGS.copyDelayMs
    };
  }

  namespace.DEFAULT_SETTINGS = DEFAULT_SETTINGS;
  namespace.clamp = clamp;
  namespace.sanitizeSettings = sanitizeSettings;
})(globalThis);
