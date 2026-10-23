/*! aellux.js | SPDX-License-Identifier: Apache-2.0 | See LICENSE for terms. */

// Build-time authoring contracts. These descriptions never enter runtime bundles.
// Values on open grammars are suggestions, not a closed enum.
const attribute = (name, extension, description, options = {}) => ({ name, extension, description, ...options });
export const semanticAttributes = [
  attribute("present", "present", "Present container. Empty disables motion; all expands to opacity transform height width. Property tokens are whitespace-separated.", { syntax: "token-list", values: ["", "all", "opacity", "transform", "height", "width", "opacity transform", "opacity transform height width"], default: "" }),
  attribute("present-group", "present", "Coordinates nested Present members by their native IDs. Nested groups own their own members.", { syntax: "presence" }),
  attribute("present-active", "present", "Selected member's native ID, without #. An empty value selects no member. Invalid or ambiguous selection preserves the previous selection.", { syntax: "id", default: "", examples: ["details"] }),
  attribute("present-when", "present", "One class token on the Present Group that selects this member when no explicit active attribute is present.", { syntax: "class-token", examples: ["show-details"] }),
  attribute("present-motion", "present", "Direct content child of a Present container; enables grid-based size transitions. Put hidden on the container.", { syntax: "presence" }),
  attribute("trigger", "present", "Present action. Target is one native ID, or the closest Present ancestor when omitted. Prefer a native button for keyboard activation.", { syntax: "enum", values: ["", "toggle", "pop", "unpop"], default: "toggle" }),
  attribute("trigger-on", "present", "Use hover for delegated pointer hover opening/closing. Touch and keyboard activation keep click behavior.", { syntax: "enum", values: ["", "click", "hover"], default: "click" }),
  attribute("target", "present", "One Present target ID, optionally prefixed with #; CSS selector lists are not accepted.", { syntax: "id", examples: ["details", "#details"] }),
  attribute("dismiss", "present", "Closes one Present ID, optionally prefixed with #. Empty uses data-ae-target or the closest Present ancestor.", { syntax: "id", default: "", examples: ["details"] }),
  attribute("auto-unpop", "present", "Automatically closes after the specified nonnegative duration. Values use milliseconds by default, or ms/s units.", { syntax: "duration", examples: ["250ms", "2s"] }),
  attribute("unpop-on-outside", "present", "Set false to keep a Present region open when clicking outside it.", { syntax: "enum", values: ["true", "false"], default: "true" }),
  attribute("anchor", "anchor", "Comma-separated target-pivot:self-pivot candidates. Pivots: top-left, top-center, top-right, center-left, center, center-right, bottom-left, bottom-center, bottom-right.", { syntax: "pivot-list", values: ["bottom-left:top-left", "bottom-center:top-center", "bottom-right:top-right", "top-left:bottom-left", "center:center"], examples: ["bottom-left:top-left, top-left:bottom-left"] }),
  attribute("anchor-target", "anchor", "Target ID or CSS selector. A Present Group target resolves to its accepted selected member, allowing multiple Anchors per group. Empty uses offsetParent. Effective target and Anchor must share a positioning reference.", { syntax: "selector", default: "", examples: ["menu-trigger", "#menu-trigger", "#views"] }),
  attribute("anchor-match", "anchor", "Match the target's width and/or height through weak CSS. Empty and unknown tokens are invalid; application sizing can override the match.", { syntax: "token-list", values: ["width", "height", "width height"] }),
  attribute("overflow-marquee", "overflow-marquee", "Single-line overflow marquee with equal holds at both ends. Optional nonnegative pixel limit, with or without px: considered only when the intrinsic content width or height strictly exceeds it, without setting the layout width. Empty preserves normal overflow detection. Below the limit, keeps nowrap but otherwise preserves author presentation and skips marquee checks; only content/size monitoring remains. Loads Anchor for placement. Starts only when visible; hover and focus pause in place. Root reduced motion keeps ellipsis; desktop overflow receives a native title unless authored.", { syntax: "pixel-limit", examples: ["", "250", "250px", "250.5px"], default: "" }),
  attribute("overflow-marquee-fade", "overflow-marquee", "Progressive overflow fade. Enabled by default; false disables it. Attribute changes reconfigure the mounted label.", { syntax: "enum", values: ["", "true", "false"], default: "true" }),
  ...["overflow-marquee-content", "overflow-marquee-active", "overflow-marquee-viewport", "overflow-marquee-ready"].map(name =>
    attribute(name, "overflow-marquee", "Internal Overflow Marquee wrapper or active-state marker.", { syntax: "presence", role: "internal" })),
  attribute("scrollbox", "scrollbox", "Native scrolling with progress state. Pointer mode adds desktop mouse/pen drag scrolling; it requires usable overflow.", { syntax: "enum", values: ["", "native", "pointer"], default: "native" }),
  attribute("scrollbox-fade", "scrollbox", "Progressive overflow fade on all scrollable edges. Enabled by default; false disables it. Existing application masks are preserved.", { syntax: "enum", values: ["", "true", "false"], default: "true" }),
  attribute("scrollbox-fade-state", "scrollbox", "Internal Scrollbox mask composition or primary-axis marker.", { syntax: "enum", values: ["both", "x", "y"], role: "internal" }),
  attribute("scrollbox-wheel-horizontal", "scrollbox", "Set false to disable vertical-wheel conversion to horizontal scrolling.", { syntax: "enum", values: ["true", "false"], default: "true" }),
  attribute("scrollbox-momentum", "scrollbox", "Set false to disable desktop pointer momentum. Snap disables momentum on every axis.", { syntax: "enum", values: ["true", "false"], default: "true" }),
  attribute("scrollbox-elastic", "scrollbox", "Mark exactly one direct content child. Empty uses 1/4; one or two nonnegative fractions or px values set vertical/horizontal limits. False disables elastic behavior.", { syntax: "elastic-limits", values: ["", "false", "1/4", "80px", "80px 40px"], default: "1/4" }),
  attribute("scrollbar", "scrollbox", "Custom scrollbars. Empty enables both; none hides native bars without creating custom bars. Axis tokens and aliases can be combined.", { syntax: "token-list", values: ["", "vertical", "horizontal", "vertical horizontal", "v h", "y x", "none"] }),
  attribute("scrollbar-vertical", "scrollbox", "Vertical custom bar, created automatically or reused when supplied as a direct child of Scrollbox.", { syntax: "presence" }),
  attribute("scrollbar-horizontal", "scrollbox", "Horizontal custom bar, created automatically or reused when supplied as a direct child of Scrollbox.", { syntax: "presence" }),
  attribute("scrollbox-snap", "scrollbox-snap", "Snap axis on an element that also declares Scrollbox. Empty is horizontal; false disables Snap. Snap loads the Scrollbox dependency itself.", { syntax: "enum", values: ["", "horizontal", "vertical", "false"], default: "horizontal" }),
  attribute("snap-item", "scrollbox-snap", "Snap alignment for an item belonging to the nearest Scrollbox. Left/top alias start; right/bottom alias end; empty is center.", { syntax: "enum", values: ["", "start", "center", "end", "left", "right", "top", "bottom"], default: "center" }),
  attribute("adaptive", "adaptive", "Publishes size and shape classes, dimensions and orientation using the Extension's adaptiveParams thresholds.", { syntax: "presence" }),
  attribute("focus", "focus", "Enter navigation on a text-entry control. Next supplies enterkeyhint when absent and focuses the next available control.", { syntax: "enum", values: ["next"] }),
  attribute("point", "point", "Maximum simultaneously associated pointers. Empty defaults to 1; a nonnegative integer is expected, and 0 disables association.", { syntax: "integer", default: "1", examples: ["0", "1", "2"] }),
  attribute("ajax-href", "ajax-href", "CSS selectors for regions replaced from a same-origin HTML response. Each selector uses its first match; current and response documents must contain the region.", { syntax: "selector-list", tags: ["a"], examples: ["title,#content"] }),
  attribute("preference", "preference", "Preference controlled by descendant option/label/next/previous controls. CamelCase and kebab-case preference names are accepted.", { syntax: "string", values: ["colorScheme", "contrast", "reducedMotion", "reducedTransparency", "forcedColors", "textScale", "interfaceScale", "extendedTiming", "largeTargets", "haptics", "sound", "color-scheme", "reduced-motion", "reduced-transparency", "forced-colors", "text-scale", "interface-scale", "extended-timing", "large-targets"] }),
  attribute("option", "preference", "Sets a value of the enclosing preference. Values depend on that preference; application-defined values remain possible.", { syntax: "string", values: ["auto", "light", "dark", "no-preference", "more", "less", "reduced", "active", "on", "off", "low", "1", "1.5", "0.8"] }),
  attribute("label", "preference", "Shown when this value matches the enclosing preference; otherwise hidden. It does not copy text into another element.", { syntax: "string", examples: ["auto", "light", "dark"] }),
  attribute("next", "preference", "Cycles forward through the enclosing preference's built-in values; use a keyboard-operable control.", { syntax: "presence" }),
  attribute("prev", "preference", "Cycles backward through the enclosing preference's built-in values; use a keyboard-operable control.", { syntax: "presence" }),
  attribute("feedback", "feedback", "Feedback boundary. Empty accepts all types; whitespace-separated types filter handled feedback and stop matching events from bubbling further.", { syntax: "token-list", values: ["", "warning", "error", "success", "announce", "busy", "progress", "validate", "warning error success"] }),
  attribute("target-message", "feedback", "One element ID, optionally prefixed with #, receiving message text. Empty uses the boundary itself.", { syntax: "id", default: "", examples: ["status-message"] }),
  attribute("target-transform", "feedback", "One element ID, optionally prefixed with #, receiving feedback classes and motion. Empty uses the boundary itself.", { syntax: "id", default: "", examples: ["status-icon"] }),
  attribute("maxfps", "core", "Optional layout update ceiling on this element. Must be a finite number greater than zero; no attribute means the shared scheduler cadence.", { syntax: "number", examples: ["20", "40", "60"], doc: "runtime/wait-layout" }),
  attribute("wait-mounted", "core", "Keeps the element hidden until mounting completes and exposes aria-busy during the attempt.", { syntax: "presence", doc: "runtime/visual-mounting" }),
  attribute("builds", "core", "Available Extension builds on a declarative link; space/comma-separated modern and legacy tokens. Omitted promises both.", { syntax: "token-list", values: ["modern", "legacy", "modern legacy"], tags: ["link"], doc: "extensions/declarative-loading" }),
  attribute("load-when", "core", "Nonempty CSS selector activating lazy Extension loading on a declarative link.", { syntax: "selector", tags: ["link"], examples: ["[data-ae-present]"], doc: "extensions/declarative-loading" }),
  attribute("load-style", "core", "On a declarative link, presence/true requests the associated stylesheet, a URL selects a stylesheet, and false disables it. Omission does not request CSS.", { syntax: "string", values: ["", "true", "false"], tags: ["link"], doc: "extensions/declarative-loading" }),
  attribute("theme-color", "core", "Marker on the runtime-managed theme-color meta tag.", { syntax: "presence", tags: ["meta"], role: "output", doc: "runtime/api" }),
  ...[
    ["color-scheme", ["light", "dark"]], ["contrast", ["no-preference", "more", "less"]],
    ["reduced-motion", ["no-preference", "reduced"]], ["reduced-transparency", ["no-preference", "reduced"]],
    ["forced-colors", ["no-preference", "active"]]
  ].map(([name, values]) => attribute(name, "preference", "Resolved root preference published by the runtime. Use in CSS selectors; configure choices through Preference.", { syntax: "enum", values, tags: ["html"], role: "output" })),
  ...["ext", "ext-style", "dep", "weak-style", "full-style", "legacy", "esm", "ready"].map(name =>
    attribute(name, "core", "Internal runtime marker; applications should not configure this attribute.", { syntax: "string", role: "internal", doc: "runtime/api" }))
];

const property = (name, extension, syntax, description, options = {}) => ({ name, extension, syntax, description, ...options });
export const semanticCSSProperties = [
  ...["pop", "unpop"].flatMap(phase => [
    property(`${phase}-duration`, "present", "<time>", `${phase} transition duration.`, { default: "250ms", values: ["0s", "150ms", "250ms", "500ms"] }),
    property(`${phase}-ease`, "present", "<easing-function>", `${phase} easing; CSS easing strings, including cubic-bezier, are supported.`, { default: phase === "pop" ? "ease-out" : "ease-in", values: ["linear", "ease", "ease-in", "ease-out", "ease-in-out"] }),
    property(`${phase}-progress`, "present", "<number>", `Bounded ${phase} progress from 0 to 1. Safe for application CSS.`, { role: "output" })
  ]),
  ...["from", "pop", "unpop"].flatMap(phase => [
    property(`${phase}-opacity`, "present", "<number> | <percentage>", `${phase} opacity endpoint.`, { default: phase === "pop" ? "1" : "0" }),
    property(`${phase}-transform`, "present", "<transform-list> | none", `${phase} transform endpoint.`, { default: phase === "from" ? "scale(0.5)" : phase === "pop" ? "scale(1)" : "scale(1.2)" }),
    ...["height", "width"].map(axis => property(`${phase}-${axis}`, "present", "<flex>", `${phase} grid ${axis} endpoint.`, { default: phase === "pop" ? "1fr" : "0fr" }))
  ]),
  property("anchor-switch-duration", "anchor", "<time>", "Native target-switch transition duration; reduced motion disables the transition.", { default: "0ms", values: ["0ms", "150ms", "250ms"] }),
  property("anchor-switch-ease", "anchor", "<easing-function>", "Easing for native Anchor target switches.", { default: "ease-in-out", values: ["linear", "ease", "ease-in-out"] }),
  property("overflow-marquee-speed", "overflow-marquee", "<number>", "Overflow Marquee speed in CSS pixels per second. Positive numbers only; invalid values use 30.", { default: "30" }),
  property("overflow-marquee-delay", "overflow-marquee", "<time>", "Overflow Marquee pause at both ends of each pass; nonnegative ms/s values. Invalid values use 1200ms.", { default: "1200ms" }),
  property("overflow-marquee-fade-size", "overflow-marquee", "<length>", "Maximum width of each progressive overflow fade. Zero disables the visual effect.", { default: "16px", values: ["0px", "16px", "24px"] }),
  ...["offset", "distance", "size", "left", "right", "mask"].map(name => property(`overflow-marquee-${name}`, "overflow-marquee", "*", "Private Overflow Marquee mask geometry.", { role: "internal" })),
  ...["x", "y"].map(axis => property(`anchor-${axis}`, "anchor", "<length>", `Calculated ${axis} placement in the positioning reference.`, { role: "output" })),
  ...["x", "y"].map(axis => property(`anchor-origin-${axis}`, "anchor", "<percentage>", `Self pivot on the ${axis} axis.`, { role: "output" })),
  ...["width", "height"].map(axis => property(`anchor-target-${axis}`, "anchor", "<length>", `Measured target ${axis}, compensated for reference scale.`, { role: "output" })),
  ...["width", "height"].map(axis => property(axis, "adaptive", "<number>", `Measured Adaptive ${axis}, in unitless pixels.`, { role: "output" })),
  ...["x", "y"].map(axis => property(`scroll-${axis}-progress`, "scrollbox", "<number>", `Scroll progress on ${axis}, from 0 to 1.`, { role: "output" })),
  property("scrollbox-fade-size", "scrollbox", "<length>", "Maximum extent of each progressive overflow fade. Zero removes the visual effect.", { default: "16px", values: ["0px", "16px", "24px"] }),
  ...["hidden-top", "hidden-right", "hidden-bottom", "hidden-left", "fade-length", "fade-top", "fade-right", "fade-bottom", "fade-left", "mask-x", "mask-y"].map(name => property(`scrollbox-${name}`, "scrollbox", "*", "Private Scrollbox overflow mask geometry.", { role: "internal" })),
  property("snap-viewport", "scrollbox-snap", "<number>", "Per-item normalized center offset from the viewport center, clamped to -2..2.", { role: "output" }),
  property("snap-focus", "scrollbox-snap", "<number>", "Per-item alignment proximity from 0 to 1; 1 means aligned with the requested snap position.", { role: "output" }),
  property("scrollbar-size", "scrollbox", "<length>", "Custom scrollbar thickness; inherited by generated bars.", { default: "8px" }),
  property("scrollbar-thumb-radius", "scrollbox", "<length-percentage>", "Custom scrollbar thumb corner radius.", { default: "10px" }),
  property("scrollbar-thumb-color", "scrollbox", "<color>", "Custom scrollbar thumb color. Unset uses the weak stylesheet's system CanvasText color."),
  property("scrollbar-thumb-hover-color", "scrollbox", "<color>", "Custom scrollbar hovered thumb color. Unset uses the weak stylesheet's system color."),
  property("scrollbar-track-color", "scrollbox", "<color>", "Custom scrollbar track color. Unset uses a transparent track."),
  property("scrollbar-opacity-fade", "scrollbox", "<number>", "Opacity after both mouse and pointer hover end.", { default: "0", values: ["0", "1"] }),
  property("scrollbar-opacity-visible", "scrollbox", "<number>", "Opacity while hover, drag or post-drag visibility is active.", { default: "1", values: ["0", "1"] }),
  ...["present-pop-phase", "present-unpop-phase", "present-properties", "anchor-pivot-x", "anchor-pivot-y", "scrollbar-display", "scrollbar-length", "scrollbar-thumb-position", "scrollbar-thumb-size", "scrollbar-x", "scrollbar-y", "feedback-aellux-ease"].map(name => property(name, "core", "*", "Private implementation property; not an application configuration contract.", { role: "internal" })),
  property("--anchor-opacity", "anchor", "<number>", "Opacity copied from the target's nearest Present region, or 1. This property intentionally has no ae prefix.", { role: "output", literal: true })
];

export const semanticEvents = [
  ...["Awake", "Legacy", "Ready"].map(name => ({ name, extension: "core", description: `${name} runtime startup notification on document.` })),
  ...["BeforeMount", "BeforeUnmount"].map(name => ({ name, extension: "core", cancelable: true, description: `${name} pass preflight on document. Cancel to prevent the pass and its completion event. detail: { root, extensions }${name === "BeforeUnmount" ? "; detachedOnly identifies automatic detached cleanup" : ""}.` })),
  ...["Mount", "Unmount", "Update"].map(name => ({ name, extension: "core", description: `${name} pass completed on document. detail: { root, extensions, elements }.` })),
  { name: "AdaptiveUpdate", extension: "adaptive", description: "Element dimensions changed. detail: { width, height, ratio }." },
  { name: "Feedback", extension: "feedback", description: "Cancelable feedback event. detail: { type, message, value, target, motion }; handled boundaries stop propagation.", cancelable: true },
  ...["Down", "Move", "Up", "Cancel", "Hover"].map(name => ({ name: `Pointer${name}`, extension: "point", bubbles: false, description: "Selected element's pointer notification. Does not bubble; detail includes pointer, target, pressStart, originalEvent and hover." })),
  { name: "Tap", extension: "point", composed: true, description: "Short primary pointer activation of an eligible mounted Point control. Bubbles across shadow boundaries; detail: { pointerType, pointerId, duration, distance, originalEvent }. Independent of native click and scroll." },
  { name: "PreferencesChange", extension: "preference", description: "Preference update on document. detail: { changed, preferences }; changed may be empty." },
  ...["BeforePop", "BeforeUnpop", "Popping", "Unpopping", "Pop", "Unpop"].map(name => ({ name, extension: "present", cancelable: name.startsWith("Before"), description: `${name} notification on the Present element.${name.startsWith("Before") ? " Cancel to veto the transition." : ""}` })),
  { name: "Layout", extension: "present", description: "Bubbling layout change announcement; detail: { origin, durationMs }. Anchor tracks the announced finite duration." },
  { name: "UnpopFocusLost", extension: "present", description: "Closed Present region lost focus. document event; detail: { element, focused }." },
  { name: "ScrollboxSnapChange", extension: "scrollbox-snap", description: "New snap item selected after scrolling settles. detail: { item, index, previousIndex, axis }." },
  { name: "ScrollboxInteraction", extension: "scrollbox", description: "Snap suspension integration. detail: { reason, active }; reasons are scrollbar, pointer and elastic." },
  { name: "ScrollboxSnapGesture", extension: "scrollbox", description: "PDS integration with Snap. detail includes phase, axis, moved, coordinates and timestamps; probe/end phases are cancelable." },
  { name: "ScrollboxWheel", extension: "scrollbox", cancelable: true, description: "Cancelable before Scrollbox handles wheel input; detail.event is the native wheel event." },
  ...["PointerScrollStart", "PointerScrollEnd"].map(name => ({ name, extension: "scrollbox", description: "Activated PDS gesture notification. detail: { axis, pointerId, pointerType, elements }." })),
  ...["SnapshotChange", "SnapshotRestore"].map(name => ({ name, extension: "state-navigation", description: `${name} on document. detail includes snapshot, removeSnapshot and popState copies.` })),
  { name: "PushState", extension: "state-navigation", description: "State Navigation command on document. Required detail: { key, value, title? }." },
  { name: "PushAjaxReplace", extension: "state-navigation", description: "State Navigation command on document. Required detail: { url, selectors }." },
  { name: "UpdateBaseTitle", extension: "state-navigation", description: "State Navigation command on document. Required detail: { title }." },
  ...["AjaxHrefStart", "AjaxHrefLoaded", "AjaxHrefError", "AjaxHrefComplete", "AjaxHrefDropOrigin"].map(name => ({ name, extension: "ajax-href", description: `${name} AJAX navigation notification on document.` }))
];
