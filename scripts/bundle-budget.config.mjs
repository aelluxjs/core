export const bundleBudget = Object.freeze([
  // Ajax Href adds official artifact hashes to the boot's integrity map.
  { file: "aellux.min.js", maxRawBytes: 45 * 1024, maxGzipBytes: 15 * 1024 },
  { file: "aellux.esm.min.js", maxRawBytes: 24 * 1024, maxGzipBytes: 8 * 1024 },
  // Cubic bezier easing and CSS Motion lifecycle fixes raise gzip to 14.2 KiB.
  { file: "aellux.orchestrator.min.js", maxRawBytes: 43 * 1024, maxGzipBytes: 15 * 1024 },
  { file: "aellux.orchestrator.legacy.min.js", maxRawBytes: 300 * 1024, maxGzipBytes: 97 * 1024 },
  { file: "aellux.full.min.js", maxRawBytes: 130 * 1024, maxGzipBytes: 40 * 1024 },
  { file: "aellux.full.legacy.min.js", maxRawBytes: 425 * 1024, maxGzipBytes: 138 * 1024 },
  { file: "aellux.ext.adaptive.min.css", maxRawBytes: 121 * 1024, maxGzipBytes: 11 * 1024 },
  { file: "aellux.ext.adaptive.min.js", maxRawBytes: 4 * 1024, maxGzipBytes: 3 * 1024 },
  { file: "aellux.ext.adaptive.legacy.min.js", maxRawBytes: 6 * 1024, maxGzipBytes: 3 * 1024 },
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
  // Present adds group reconciliation, delegated hover and bounded CSS progress.
  // Delivery C's preflight validation and safe registration fallback measure
  // 17,717/6,262 bytes Modern and 25,112/8,822 Legacy (raw/gzip level 9).
  { file: "aellux.ext.present.min.js", maxRawBytes: 18 * 1024, maxGzipBytes: 6.25 * 1024 },
  { file: "aellux.ext.present.legacy.min.js", maxRawBytes: 25 * 1024, maxGzipBytes: 9 * 1024 },
  { file: "aellux.ext.scrollbox.min.js", maxRawBytes: 46 * 1024, maxGzipBytes: 14 * 1024 },
  { file: "aellux.ext.scrollbox.legacy.min.js", maxRawBytes: 44 * 1024, maxGzipBytes: 14 * 1024 },
  { file: "aellux.ext.scrollbox-snap.min.js", maxRawBytes: 10 * 1024, maxGzipBytes: 4 * 1024 },
  { file: "aellux.ext.scrollbox-snap.legacy.min.js", maxRawBytes: 15 * 1024, maxGzipBytes: 6 * 1024 },
  { file: "aellux.ext.state-navigation.min.js", maxRawBytes: 5 * 1024, maxGzipBytes: 3 * 1024 },
  { file: "aellux.ext.state-navigation.legacy.min.js", maxRawBytes: 8 * 1024, maxGzipBytes: 3 * 1024 }
]);
