/*! aellux.js | SPDX-License-Identifier: Apache-2.0 | See LICENSE for terms. */

import createWeakCss from "./internal/create-weak-css.js";
import { generateAdaptiveCSS } from "./aellux.ext.adaptive.css.js";
import { generatePresentCSS } from "./aellux.ext.present.css.js";
import { generateFeedbackCSS } from "./aellux.ext.feedback.css.js";
import { generateScrollboxCSS } from "./aellux.ext.scrollbox.css.js";
import { generateAnchorCSS } from "./aellux.ext.anchor.css.js";
import { generateOverflowMarqueeCSS } from "./aellux.ext.overflow-marquee.css.js";

export function generateFullCSS(AelluxJs) {
  const core = createWeakCss()
    .replace(/\?([a-z][0-9a-z-]*)/gi, (_, name) => AelluxJs.attr(name))
    .replace(/%([a-z][0-9a-z-]*)/gi, (_, name) => AelluxJs.className(name));
  return [
    "/*! aellux.js Full Styles | SPDX-License-Identifier: Apache-2.0 */",
    core,
    generateAdaptiveCSS(AelluxJs),
    generatePresentCSS(AelluxJs),
    generateFeedbackCSS(AelluxJs),
    generateScrollboxCSS(AelluxJs),
    generateAnchorCSS(AelluxJs),
    generateOverflowMarqueeCSS(AelluxJs)
  ].join("\n\n");
}
