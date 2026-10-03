/*! aellux.js | SPDX-License-Identifier: Apache-2.0 | See LICENSE for terms. */

import utilsNameCase from "./utils-name-case.js";

// Build-time imports aside, this helper must remain ES5-compatible for the boot bundle.
// getApi lets the boot publish AelluxJs after creating this helper.
export function createPreferenceHtmlHelper(root, getApi) {
  var document = root.document;
  var fromCamelCase = utilsNameCase.fromCamelCase;

  return {
    updatePreferenceAttributesHTML: updatePreferenceAttributesHTML
  };

  function updatePreferenceAttributesHTML(preferences) {
    var api = getApi();
    var allQueries = api.registry.preferenceMediaQueries;
    preferences = preferences ? preferences : api.persist.preferences.getObject();
    for (var param in allQueries) {
      if (!Object.prototype.hasOwnProperty.call(allQueries, param)) continue;
      var queries = allQueries[param];
      for (var value in queries) {
        if (!Object.prototype.hasOwnProperty.call(queries, value)) continue;
        var query = queries[value];
        if (!preferences || !preferences[param] || preferences[param] === "auto") {
          if (!query || !query.matches) continue;
        } else if (preferences[param] !== value) {
          continue;
        }
        document.documentElement.setAttribute(api.attr(fromCamelCase(param)), value);
      }
    }
    if (preferences && "colorScheme" in preferences) {
      updateColorSchemeMeta(preferences.colorScheme);
    }
  }

  function updateColorSchemeMeta(preferenceColorScheme) {
    var api = getApi();
    var attr = api.attr("theme-color");
    var aeMetaTag = document.head.querySelector("meta[" + attr + "]") ||
      document.createElement("meta");
    if (preferenceColorScheme === "auto") {
      if (aeMetaTag.parentNode) aeMetaTag.parentNode.removeChild(aeMetaTag);
      return;
    }

    var themeColorTags = document.head.querySelectorAll("meta[name='theme-color']");
    if (themeColorTags.length < 2) return;

    var color = null;
    for (var i = 0; i < themeColorTags.length; i++) {
      var meta = themeColorTags[i];
      var media = meta.getAttribute("media") || "";
      if (preferenceColorScheme === "dark") {
        if (media.indexOf("dark") === -1) continue;
        color = meta.getAttribute("content");
        break;
      }
      if (media.indexOf("dark") > -1) continue;
      color = meta.getAttribute("content");
    }

    if (color === null) {
      if (aeMetaTag.parentNode) aeMetaTag.parentNode.removeChild(aeMetaTag);
      return;
    }
    aeMetaTag.name = "theme-color";
    aeMetaTag.content = color;
    aeMetaTag.setAttribute(attr, "");
    document.head.insertBefore(aeMetaTag, document.head.firstChild);
  }
}
