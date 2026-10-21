export const bundleBudget = Object.freeze([
  // Actionable diagnostic catalog/context plus the development-only semantic
  // mount validator. Measured costs and previous limits: runtime/diagnostics.md.
  { file: "aellux.min.js", maxRawBytes: 46 * 1024, maxGzipBytes: 15 * 1024 },
  { file: "aellux.esm.min.js", maxRawBytes: 25 * 1024, maxGzipBytes: 8.5 * 1024 },
  // Cancelable mount/unmount passes and teardown cancellation propagation.
  { file: "aellux.orchestrator.min.js", maxRawBytes: 56.5 * 1024, maxGzipBytes: 19 * 1024 },
  { file: "aellux.orchestrator.legacy.min.js", maxRawBytes: 318 * 1024, maxGzipBytes: 102 * 1024 },
  { file: "aellux.full.min.js", maxRawBytes: 130 * 1024, maxGzipBytes: 40.5 * 1024 },
  { file: "aellux.full.legacy.min.js", maxRawBytes: 426 * 1024, maxGzipBytes: 138 * 1024 },
  { file: "aellux.ext.adaptive.min.css", maxRawBytes: 121 * 1024, maxGzipBytes: 11 * 1024 },
  { file: "aellux.ext.adaptive.min.js", maxRawBytes: 5 * 1024, maxGzipBytes: 3 * 1024 },
  { file: "aellux.ext.adaptive.legacy.min.js", maxRawBytes: 8.5 * 1024, maxGzipBytes: 3.5 * 1024 },
  { file: "aellux.ext.anchor.min.js", maxRawBytes: 15 * 1024, maxGzipBytes: 6 * 1024 },
  { file: "aellux.ext.anchor.legacy.min.js", maxRawBytes: 23 * 1024, maxGzipBytes: 8 * 1024 },
  { file: "aellux.ext.ajax-href.min.js", maxRawBytes: 5 * 1024, maxGzipBytes: 3 * 1024 },
  { file: "aellux.ext.ajax-href.legacy.min.js", maxRawBytes: 12 * 1024, maxGzipBytes: 5 * 1024 },
  { file: "aellux.ext.feedback.min.css", maxRawBytes: 3 * 1024, maxGzipBytes: 2 * 1024 },
  { file: "aellux.ext.feedback.min.js", maxRawBytes: 4 * 1024, maxGzipBytes: 2 * 1024 },
  { file: "aellux.ext.feedback.legacy.min.js", maxRawBytes: 9 * 1024, maxGzipBytes: 4 * 1024 },
  { file: "aellux.ext.focus.min.js", maxRawBytes: 5 * 1024, maxGzipBytes: 3 * 1024 },
  { file: "aellux.ext.focus.legacy.min.js", maxRawBytes: 5 * 1024, maxGzipBytes: 3 * 1024 },
  { file: "aellux.ext.point.min.js", maxRawBytes: 6 * 1024, maxGzipBytes: 3 * 1024 },
  { file: "aellux.ext.point.legacy.min.js", maxRawBytes: 8 * 1024, maxGzipBytes: 3 * 1024 },
  { file: "aellux.ext.preference.min.js", maxRawBytes: 5 * 1024, maxGzipBytes: 3 * 1024 },
  { file: "aellux.ext.preference.legacy.min.js", maxRawBytes: 7 * 1024, maxGzipBytes: 3 * 1024 },
  { file: "aellux.ext.present.min.css", maxRawBytes: 4 * 1024, maxGzipBytes: 2 * 1024 },
  // Present now reports invalid actions, missing/incompatible targets and
  // corrective context for group selections, retaining its fallback behavior.
  { file: "aellux.ext.present.min.js", maxRawBytes: 18.5 * 1024, maxGzipBytes: 6.5 * 1024 },
  { file: "aellux.ext.present.legacy.min.js", maxRawBytes: 26 * 1024, maxGzipBytes: 9 * 1024 },
  { file: "aellux.ext.scrollbox.min.js", maxRawBytes: 46 * 1024, maxGzipBytes: 14 * 1024 },
  { file: "aellux.ext.scrollbox.legacy.min.js", maxRawBytes: 44 * 1024, maxGzipBytes: 14 * 1024 },
  { file: "aellux.ext.scrollbox-snap.min.js", maxRawBytes: 10.5 * 1024, maxGzipBytes: 4 * 1024 },
  { file: "aellux.ext.scrollbox-snap.legacy.min.js", maxRawBytes: 15 * 1024, maxGzipBytes: 6 * 1024 },
  { file: "aellux.ext.state-navigation.min.js", maxRawBytes: 5 * 1024, maxGzipBytes: 3 * 1024 },
  { file: "aellux.ext.state-navigation.legacy.min.js", maxRawBytes: 8 * 1024, maxGzipBytes: 3 * 1024 }
]);
