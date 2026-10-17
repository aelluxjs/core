/*! aellux.js | SPDX-License-Identifier: Apache-2.0 | See LICENSE for terms. */

// Required compatibility: ES5. This helper is bundled into the aellux.js boot script and must not
// introduce runtime syntax or APIs that prevent the Legacy fallback path from being reached.

export function buildPreferenceMediaQueries(root) {
  function mediaQuery(query) {
    return typeof root.matchMedia === "function" ? root.matchMedia(query) : null;
  }

  var NO_PREFERENCE = "no-preference";
  var PREFERS = "prefers-";
  var REDUCED = "reduced";
  var COLOR_SCHEME = PREFERS + "color-scheme";
  var REDUCED_MOTION = PREFERS + "reduced-motion";
  var REDUCED_TRANSPARENCY = PREFERS + "reduced-transparency";
  var FORCED_COLORS = "forced-colors";
  var CONTRAST = PREFERS + "contrast";

  function preferenceQuery(feature, value) {
    return mediaQuery("(" + feature + ": " + value + ")");
  }

  return {
    colorScheme: {
      light: preferenceQuery(COLOR_SCHEME, "light"),
      dark: preferenceQuery(COLOR_SCHEME, "dark")
    },
    reducedMotion: {
      reduced: preferenceQuery(REDUCED_MOTION, "reduce"),
      "no-preference": preferenceQuery(REDUCED_MOTION, NO_PREFERENCE)
    },
    reducedTransparency: {
      reduced: preferenceQuery(REDUCED_TRANSPARENCY, REDUCED),
      "no-preference": preferenceQuery(REDUCED_TRANSPARENCY, NO_PREFERENCE)
    },
    forcedColors: {
      active: preferenceQuery(FORCED_COLORS, "active"),
      "no-preference": preferenceQuery(FORCED_COLORS, NO_PREFERENCE)
    },
    contrast: {
      more: preferenceQuery(CONTRAST, "more"),
      less: preferenceQuery(CONTRAST, "less"),
      "no-preference": preferenceQuery(CONTRAST, NO_PREFERENCE)
    }
  };
}
