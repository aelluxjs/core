export const bundleBudget = Object.freeze([
  { file: "aellux.ext.pwa.min.js", maxRawBytes: 11 * 1024, maxGzipBytes: 4.5 * 1024 },
  { file: "aellux.ext.pwa.legacy.min.js", maxRawBytes: 18 * 1024, maxGzipBytes: 7 * 1024 },
  { file: "aellux.pwa.sw.min.js", maxRawBytes: 5 * 1024, maxGzipBytes: 2.5 * 1024 },
  // Actionable diagnostic catalog/context plus the development-only semantic
  // mount validator. Measured costs and previous limits: runtime/diagnostics.md.
  // Includes the official entry for the dedicated Overflow Marquee Extension.
  // Viewport's signed Modern/Legacy registry entries: +803 raw / +274 gzip bytes.
  { file: "aellux.min.js", maxRawBytes: 48 * 1024, maxGzipBytes: 16 * 1024 },
  // Viewport semantic events; measured costs: core-extensions/viewport.md.
  { file: "aellux.ext.viewport.js", maxRawBytes: 18.5 * 1024, maxGzipBytes: 5 * 1024 },
  { file: "aellux.ext.viewport.min.js", maxRawBytes: 9 * 1024, maxGzipBytes: 3.75 * 1024 },
  { file: "aellux.ext.viewport.legacy.js", maxRawBytes: 32 * 1024, maxGzipBytes: 8.25 * 1024 },
  { file: "aellux.ext.viewport.legacy.min.js", maxRawBytes: 15 * 1024, maxGzipBytes: 6 * 1024 },
  { file: "aellux.esm.min.js", maxRawBytes: 25 * 1024, maxGzipBytes: 8.5 * 1024 },
  // Development source inspection and CSS resource conflict diagnostics.
  // Also covers CSS Motion subtree capture; fade costs: core-extensions/overflow-marquee.md.
  // Measured deltas and the superseded limits: runtime/diagnostics.md.
  { file: "aellux.orchestrator.min.js", maxRawBytes: 64.5 * 1024, maxGzipBytes: 21.5 * 1024 },
  // Dialog-specific compatibility now ships separately; costs: runtime/performance.md.
  { file: "aellux.orchestrator.legacy.min.js", maxRawBytes: 331 * 1024, maxGzipBytes: 105 * 1024 },
  // Full uses one external stylesheet shared by all Core Extensions.
  // Includes Point tap recognition and Present click-priority routing;
  // measured deltas: core-extensions/point.md and core-extensions/present.md.
  // Stable Core implementations are bundled; Experimental stays external.
  // Delivery changes and measured sizes: runtime/performance.md.
  { file: "aellux.full.min.js", maxRawBytes: 188 * 1024, maxGzipBytes: 58 * 1024 },
  { file: "aellux.full.legacy.min.js", maxRawBytes: 508 * 1024, maxGzipBytes: 150 * 1024 },
  { file: "aellux.full.min.css", maxRawBytes: 122 * 1024, maxGzipBytes: 12 * 1024 },
  { file: "aellux.ext.adaptive.min.css", maxRawBytes: 121 * 1024, maxGzipBytes: 11 * 1024 },
  { file: "aellux.ext.adaptive.min.js", maxRawBytes: 5 * 1024, maxGzipBytes: 3 * 1024 },
  { file: "aellux.ext.adaptive.legacy.min.js", maxRawBytes: 8.5 * 1024, maxGzipBytes: 3.5 * 1024 },
  { file: "aellux.ext.dialog.min.js", maxRawBytes: 1024, maxGzipBytes: 0.5 * 1024 },
  { file: "aellux.ext.dialog.legacy.min.js", maxRawBytes: 14.5 * 1024, maxGzipBytes: 5 * 1024 },
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
  // Child-target fade geometry/restoration; measured costs: core-extensions/scrollbox.md.
  // Layout transition tracking: +477 raw / +176 gzip bytes; costs: core-extensions/scrollbox.md.
  { file: "aellux.ext.scrollbox.legacy.min.js", maxRawBytes: 47.5 * 1024, maxGzipBytes: 15 * 1024 },
  { file: "aellux.ext.scrollbox-snap.min.js", maxRawBytes: 10.5 * 1024, maxGzipBytes: 4 * 1024 },
  { file: "aellux.ext.scrollbox-snap.legacy.min.js", maxRawBytes: 15 * 1024, maxGzipBytes: 6 * 1024 },
  { file: "aellux.ext.state-navigation.min.js", maxRawBytes: 5 * 1024, maxGzipBytes: 3 * 1024 },
  { file: "aellux.ext.state-navigation.legacy.min.js", maxRawBytes: 8 * 1024, maxGzipBytes: 3 * 1024 }
]);
