export const bundleBudget = Object.freeze([
  // Actionable diagnostic catalog/context plus the development-only semantic
  // mount validator. Measured costs and previous limits: runtime/diagnostics.md.
  // Includes the official entry for the dedicated Overflow Marquee Extension.
  { file: "aellux.min.js", maxRawBytes: 47.5 * 1024, maxGzipBytes: 15.5 * 1024 },
  { file: "aellux.esm.min.js", maxRawBytes: 25 * 1024, maxGzipBytes: 8.5 * 1024 },
  // Development source inspection and CSS resource conflict diagnostics.
  // Also covers CSS Motion subtree capture; fade costs: core-extensions/overflow-marquee.md.
  // Measured deltas and the superseded limits: runtime/diagnostics.md.
  { file: "aellux.orchestrator.min.js", maxRawBytes: 62 * 1024, maxGzipBytes: 20.75 * 1024 },
  // Includes dialog-polyfill behavior and inline CSS; costs: runtime/performance.md.
  { file: "aellux.orchestrator.legacy.min.js", maxRawBytes: 342 * 1024, maxGzipBytes: 108 * 1024 },
  // Full uses one external stylesheet shared by all Core Extensions.
  // Includes Point tap recognition and Present click-priority routing;
  // measured deltas: core-extensions/point.md and core-extensions/present.md.
  { file: "aellux.full.min.js", maxRawBytes: 135.5 * 1024, maxGzipBytes: 44 * 1024 },
  { file: "aellux.full.legacy.min.js", maxRawBytes: 454.5 * 1024, maxGzipBytes: 138 * 1024 },
  { file: "aellux.full.min.css", maxRawBytes: 122 * 1024, maxGzipBytes: 12 * 1024 },
  { file: "aellux.ext.adaptive.min.css", maxRawBytes: 121 * 1024, maxGzipBytes: 11 * 1024 },
  { file: "aellux.ext.adaptive.min.js", maxRawBytes: 5 * 1024, maxGzipBytes: 3 * 1024 },
  { file: "aellux.ext.adaptive.legacy.min.js", maxRawBytes: 8.5 * 1024, maxGzipBytes: 3.5 * 1024 },
  { file: "aellux.ext.anchor.min.js", maxRawBytes: 15 * 1024, maxGzipBytes: 6 * 1024 },
  { file: "aellux.ext.anchor.min.css", maxRawBytes: 2 * 1024, maxGzipBytes: 1024 },
  { file: "aellux.ext.anchor.legacy.min.js", maxRawBytes: 23 * 1024, maxGzipBytes: 8 * 1024 },
  // Dedicated lazy Extension, including dormant pixel-limit lifecycle;
  // measured costs and previous limits: core-extensions/overflow-marquee.md.
  { file: "aellux.ext.overflow-marquee.min.js", maxRawBytes: 13.5 * 1024, maxGzipBytes: 5 * 1024 },
  { file: "aellux.ext.overflow-marquee.min.css", maxRawBytes: 2.75 * 1024, maxGzipBytes: 1024 },
  { file: "aellux.ext.overflow-marquee.legacy.min.js", maxRawBytes: 25.5 * 1024, maxGzipBytes: 8 * 1024 },
  { file: "aellux.ext.ajax-href.min.js", maxRawBytes: 7 * 1024, maxGzipBytes: 3 * 1024 },
  { file: "aellux.ext.ajax-href.legacy.min.js", maxRawBytes: 14.5 * 1024, maxGzipBytes: 5.5 * 1024 },
  { file: "aellux.ext.feedback.min.css", maxRawBytes: 3 * 1024, maxGzipBytes: 2 * 1024 },
  { file: "aellux.ext.feedback.min.js", maxRawBytes: 4 * 1024, maxGzipBytes: 2 * 1024 },
  { file: "aellux.ext.feedback.legacy.min.js", maxRawBytes: 9 * 1024, maxGzipBytes: 4 * 1024 },
  { file: "aellux.ext.focus.min.js", maxRawBytes: 5 * 1024, maxGzipBytes: 3 * 1024 },
  { file: "aellux.ext.focus.legacy.min.js", maxRawBytes: 5 * 1024, maxGzipBytes: 3 * 1024 },
  { file: "aellux.ext.point.min.js", maxRawBytes: 6 * 1024, maxGzipBytes: 3 * 1024 },
  { file: "aellux.ext.point.legacy.min.js", maxRawBytes: 9.5 * 1024, maxGzipBytes: 3.5 * 1024 },
  { file: "aellux.ext.preference.min.js", maxRawBytes: 5 * 1024, maxGzipBytes: 3 * 1024 },
  { file: "aellux.ext.preference.legacy.min.js", maxRawBytes: 7 * 1024, maxGzipBytes: 3 * 1024 },
  { file: "aellux.ext.present.min.css", maxRawBytes: 4 * 1024, maxGzipBytes: 2 * 1024 },
  // Present now reports invalid actions, missing/incompatible targets and
  // corrective context for group selections, plus consumer-local tap/click
  // arbitration and pending activation cleanup. Costs: core-extensions/present.md.
  { file: "aellux.ext.present.min.js", maxRawBytes: 20 * 1024, maxGzipBytes: 7.25 * 1024 },
  { file: "aellux.ext.present.legacy.min.js", maxRawBytes: 28 * 1024, maxGzipBytes: 9.75 * 1024 },
  { file: "aellux.ext.scrollbox.min.js", maxRawBytes: 46 * 1024, maxGzipBytes: 14 * 1024 },
  // Progressive 2D overflow fade; measured deltas: core-extensions/scrollbox.md.
  { file: "aellux.ext.scrollbox.min.css", maxRawBytes: 6.5 * 1024, maxGzipBytes: 1.5 * 1024 },
  { file: "aellux.ext.scrollbox.legacy.min.js", maxRawBytes: 46 * 1024, maxGzipBytes: 14.5 * 1024 },
  { file: "aellux.ext.scrollbox-snap.min.js", maxRawBytes: 10.5 * 1024, maxGzipBytes: 4 * 1024 },
  { file: "aellux.ext.scrollbox-snap.legacy.min.js", maxRawBytes: 15 * 1024, maxGzipBytes: 6 * 1024 },
  { file: "aellux.ext.state-navigation.min.js", maxRawBytes: 5 * 1024, maxGzipBytes: 3 * 1024 },
  { file: "aellux.ext.state-navigation.legacy.min.js", maxRawBytes: 8 * 1024, maxGzipBytes: 3 * 1024 }
]);
