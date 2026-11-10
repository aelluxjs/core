/*! aellux.js | SPDX-License-Identifier: Apache-2.0 | See LICENSE for terms. */

import createWeakCss from "./internal/create-weak-css.js";
import { generateAdaptiveCSS } from "./aellux.ext.adaptive.css.js";
import { generatePresentCSS } from "./aellux.ext.present.css.js";
import { generateFeedbackCSS } from "./aellux.ext.feedback.css.js";
import { generateScrollboxCSS } from "./aellux.ext.scrollbox.css.js";
import { generateAnchorCSS } from "./aellux.ext.anchor.css.js";
import { generateInputCSS } from "./aellux.ext.input.css.js";

export function generateFullCSS(aelluxJs) {
  const core = createWeakCss()
    .replace(/\?([a-z][0-9a-z-]*)/gi, (_, name) => aelluxJs.attr(name))
    .replace(/%([a-z][0-9a-z-]*)/gi, (_, name) => aelluxJs.className(name));
  return [
    "/*! aellux.js Full Styles | SPDX-License-Identifier: Apache-2.0 */",
    core,
    generateAdaptiveCSS(aelluxJs),
    generatePresentCSS(aelluxJs),
    generateFeedbackCSS(aelluxJs),
    generateScrollboxCSS(aelluxJs),
    generateAnchorCSS(aelluxJs),
    generateInputCSS(aelluxJs)
  ].join("\n\n");
}
