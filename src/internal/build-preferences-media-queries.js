/*! Aellux | SPDX-License-Identifier: Apache-2.0 | See LICENSE for terms. */

// Required compatibility: ES5. This helper is bundled into the Aellux boot script and must not
// introduce runtime syntax or APIs that prevent the Legacy fallback path from being reached.

export function buildPreferencesMediaQueries(root) {
  function mediaQuery(query) {
    return typeof root.matchMedia === "function" ? root.matchMedia(query) : null;
  }

  return {
    colorScheme: {
      light: mediaQuery("(prefers-color-scheme: light)"),
      dark: mediaQuery("(prefers-color-scheme: dark)")
    },
    reducedMotion: {
      reduced: mediaQuery("(prefers-reduced-motion: reduced)"),
      "no-preference": mediaQuery("(prefers-reduced-motion: no-preference)")
    },
    reducedTransparency: {
      reduced: mediaQuery("(prefers-reduced-transparency: reduced)"),
      "no-preference": mediaQuery("(prefers-reduced-transparency: no-preference)")
    },
    forcedColors: {
      active: mediaQuery("(forced-colors: active)"),
      "no-preference": mediaQuery("(forced-colors: no-preference)")
    },
    contrast: {
      more: mediaQuery("(prefers-contrast: more)"),
      less: mediaQuery("(prefers-contrast: less)"),
      "no-preference": mediaQuery("(prefers-contrast: no-preference)")
    }
  };
}
