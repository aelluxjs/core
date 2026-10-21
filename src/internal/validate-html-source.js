/*! aellux.js | SPDX-License-Identifier: Apache-2.0 | See LICENSE for terms. */

import { findDuplicateAttributes } from "./find-duplicate-attributes.js";
import { reportConfiguration } from "./report-configuration.js";

export function validateHTMLSource(api, html, source) {
  if (api.options.environment !== "development") return;
  for (const duplicate of findDuplicateAttributes(html)) {
    const { attribute } = duplicate;
    reportConfiguration(api, "WARN_ATTRIBUTE_DUPLICATE", {
      extension: "core", source, ...duplicate,
      reason: `The ${attribute} attribute occurs more than once on the same start tag; the HTML parser keeps the first value and discards the others.`,
      suggestion: attribute === "class"
        ? "Combine all class names in one class attribute, separated by spaces."
        : attribute === "style"
          ? "Combine the intended CSS declarations in one style attribute, separated by semicolons."
          : `Keep one ${attribute} attribute with the intended value.`
    });
  }
}
