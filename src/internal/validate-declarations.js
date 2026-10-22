/*! aellux.js | SPDX-License-Identifier: Apache-2.0 | See LICENSE for terms. */

import { reportConfiguration, diagnosePresentTarget } from "./report-configuration.js";
import utilsNameCase from "./utils-name-case.js";
import { transformOwners, diagnoseResource } from "./diagnose-resources.js";

// Only declarative, development-time checks belong here. Runtime failures remain
// the responsibility of each Extension. No observers or production DOM scans.
const attributesByExtension = {
  present: "present present-group present-active present-when present-motion trigger trigger-on dismiss target auto-unpop unpop-on-outside",
  anchor: "anchor anchor-target anchor-match",
  "overflow-marquee": "overflow-marquee overflow-marquee-fade overflow-marquee-viewport overflow-marquee-content overflow-marquee-active overflow-marquee-ready",
  scrollbox: "scrollbox scrollbox-fade scrollbox-fade-state scrollbox-wheel-horizontal scrollbox-momentum scrollbox-elastic scrollbar scrollbar-vertical scrollbar-horizontal",
  "scrollbox-snap": "scrollbox-snap snap-item",
  focus: "focus", point: "point", adaptive: "adaptive", "ajax-href": "ajax-href",
  preference: "preference option label next prev ready",
  feedback: "feedback target-message target-transform"
};
const coreAttributes = "maxfps wait-mounted ext ext-style dep load-when builds load-style weak-style full-style legacy esm theme-color";
const activation = {
  present: "present present-group trigger dismiss", anchor: "anchor", "overflow-marquee": "overflow-marquee",
  scrollbox: "scrollbox", "scrollbox-snap": "scrollbox-snap",
  focus: "focus", point: "point", adaptive: "adaptive", "ajax-href": "ajax-href",
  preference: "preference", feedback: "feedback"
};

export function validateDeclarations(root, scope, extensionNames = null, method = "mount") {
  const api = root.AelluxJs;
  if (api.options.environment !== "development") return;
  const selected = extensionNames === null ? null : new Set(
    (Array.isArray(extensionNames) ? extensionNames : [extensionNames]).map(utilsNameCase.fromCamelCase));
  const attr = name => api.attr(name);
  const prefix = attr("");
  const owners = new Map();
  for (const [extension, names] of Object.entries(attributesByExtension))
    for (const name of names.split(" ")) owners.set(attr(name), extension);
  const known = new Set([...owners.keys(), ...coreAttributes.split(" ").map(attr),
    ...Object.keys(api.registry.preferenceMediaQueries).map(name => attr(utilsNameCase.fromCamelCase(name)))]);
  // A custom Extension's declared selectors also define legitimate attributes.
  for (const selector of [...Object.values(api.registry.extMounters), ...Object.values(api.registry.lazyExtSelectors)])
    for (const match of selector.match(/\[[^\s\]~|^$*!=]+/g) || []) known.add(match.slice(1));
  const elements = [...(scope.nodeType === 1 ? [scope] : []), ...scope.querySelectorAll("*")];
  for (const element of elements) {
    const has = name => element.hasAttribute(attr(name));
    const value = name => element.getAttribute(attr(name));
    const report = (name, extension, attribute, reason, suggestion, extra = {}) =>
      reportConfiguration(api, name, { extension, element, attribute: attr(attribute), reason, suggestion, ...extra });
    const invalid = (extension, name, reason, suggestion, code = "WARN_CONFIGURATION_VALUE") =>
      report(code, extension, name, reason, suggestion);
    for (const attribute of element.attributes) {
      const owner = owners.get(attribute.name);
      if (selected && (!owner || !selected.has(owner))) continue;
      if (!selected && attribute.name.startsWith(prefix) && !known.has(attribute.name)) {
        // Only suggest a close spelling; arbitrary custom data is not assumed
        // to be an Aellux typo merely because it shares the prefix.
        const candidate = [...known].find(name => oneEditApart(attribute.name, name));
        if (candidate) reportConfiguration(api, "WARN_ATTRIBUTE_UNKNOWN", {
          extension: owners.get(candidate) || "core", element, attribute: attribute.name,
          value: attribute.value, reason: "Unknown Aellux attribute.",
          suggestion: `Check the spelling; did you mean ${candidate}?`
        });
      }
    }
    for (const [extension, declarations] of Object.entries(activation)) {
      if (selected && !selected.has(extension)) continue;
      const declaration = declarations.split(" ").find(name => has(name) && (name !== "scrollbox-snap" || value(name) !== "false"));
      if (!declaration) continue;
      if (extension === "scrollbox-snap" && !has("scrollbox"))
        invalid(extension, "scrollbox-snap", "Snap requires Scrollbox on the same element.", "Add data-ae-scrollbox to the Snap container.", "WARN_CONFIGURATION_STRUCTURE");
      const key = utilsNameCase.toCamelCase(extension);
      if (!api.ext[key]?.initialized) {
        report("WARN_EXTENSION_REQUIRED", extension, declaration,
          "The declared behavior's Extension is not initialized.",
          `Register ${extension} before mounting, await $ae.wait("${extension}"), and check earlier load diagnostics.`);
        continue;
      }
      if (extension === "present") validatePresent();
      if (extension === "anchor") validateAnchor();
      if (extension === "overflow-marquee" && has("overflow-marquee-fade") &&
        !["", "true", "false"].includes(value("overflow-marquee-fade")))
        invalid(extension, "overflow-marquee-fade", "Overflow Marquee fade expects a boolean value.",
          "Use true or false, or omit the attribute to enable the fade.");
      if (extension === "scrollbox") validateScrollbox();
      if (extension === "scrollbox" && has("scrollbox-fade") && !["", "true", "false"].includes(value("scrollbox-fade")))
        invalid(extension, "scrollbox-fade", "Scrollbox fade expects a boolean value.",
          "Use true or false, or omit the attribute to enable the fade.");
      if (extension === "scrollbox-snap") validateSnap();
      if (extension === "focus") {
        if (value("focus") && value("focus") !== "next")
          invalid(extension, "focus", "Unknown Focus mode.", "Use next for Enter navigation, or remove the attribute.");
        if (value("focus") === "next" && !element.matches('input:not([type]),input[type=text],input[type=search],input[type=email],input[type=url],input[type=tel],input[type=password],input[type=number],textarea,[contenteditable]:not([contenteditable=false])'))
          invalid(extension, "focus", "Enter navigation is declared on a non-text-entry element.", "Apply data-ae-focus=next to a text input, textarea or editable element.");
      }
      if (extension === "point" && value("point") !== "" &&
          (!/^\d+$/.test(value("point")) || !Number.isSafeInteger(Number(value("point")))))
        invalid(extension, "point", "Pointer count must be a nonnegative integer.", "Use an integer such as 1; 0 disables pointer association.");
      if (extension === "ajax-href") {
        try {
          if (!value("ajax-href").trim() || !root.document.querySelector(value("ajax-href")))
            invalid(extension, "ajax-href", "No current content matches the AJAX selector.", "Provide a CSS selector present in both the current page and the response.");
        } catch (_) {
          invalid(extension, "ajax-href", "The AJAX selector is invalid.", "Provide a valid CSS selector such as #content.");
        }
      }
    }
    if ((!selected || selected.has("scrollbox")) && has("scrollbox-elastic") && value("scrollbox-elastic") !== "false" && !element.parentElement?.hasAttribute(attr("scrollbox")))
      invalid("scrollbox", "scrollbox-elastic", "Elastic wrapper must be a direct child of Scrollbox.", "Place exactly one marked wrapper directly inside data-ae-scrollbox.", "WARN_CONFIGURATION_STRUCTURE");
    if ((!selected || selected.has("scrollbox-snap")) && has("snap-item") && !element.closest(`[${attr("scrollbox")}]`))
      invalid("scrollbox-snap", "snap-item", "Snap item has no Scrollbox ancestor.", "Place snap items inside a Scrollbox with Snap enabled.", "WARN_CONFIGURATION_STRUCTURE");
    if (!selected && has("maxfps") && (!value("maxfps").trim() || !Number.isFinite(Number(value("maxfps"))) || Number(value("maxfps")) <= 0))
      invalid("core", "maxfps", "Frame rate must be finite and greater than zero.", "Use a positive number or remove the attribute.", "WARN_LAYOUT_MAX_FPS_INVALID");
    if (!selected || selected.has("present") || selected.has("anchor")) validateCSS();
    if ((!selected || selected.has("present") || selected.has("scrollbox")) && has("scrollbox-elastic")) {
      const writers = transformOwners(api, element);
      if (writers.includes("scrollbox-elastic") && writers.includes("present"))
        diagnoseResource(api, element, "transform", ["scrollbox-elastic", "present"]);
    }

    function validatePresent() {
      if (has("present") && value("present").trim().split(/\s+/).some(token => token && !["opacity", "transform", "height", "width"].includes(token)))
        invalid("present", "present", "Unknown animated Present property.", "Use opacity, transform, height, width, all, or an empty value to disable motion.");
      if (has("present-when") && /\s/.test(value("present-when")))
        invalid("present", "present-when", "A group condition must be one class token.", "Use one class name without spaces or a leading dot.", "WARN_PRESENT_GROUP_SELECTION");
      for (const [name, allowed] of [["trigger", ["", "toggle", "pop", "unpop"]], ["trigger-on", ["", "click", "hover"]]])
        if (has(name) && !allowed.includes(name === "trigger" ? value(name).toLowerCase() : value(name)))
          invalid("present", name, "Unknown Present control value.", `Use ${allowed.filter(Boolean).join(", ")}.`);
      if (has("trigger") || has("dismiss")) {
        const name = value("dismiss") ? "dismiss" : "target";
        const reference = value(name);
        if (reference) diagnosePresentTarget(api, element, root.document.getElementById(reference.replace(/^#/, "")), attr(name), reference);
        else if (!element.closest(`[${attr("present")}]`))
          invalid("present", has("trigger") ? "trigger" : "dismiss", "Control has no target or enclosing Present container.",
            "Set data-ae-target to an existing Present ID or place the control inside its Present container.", "WARN_CONFIGURATION_TARGET");
        if (element.tabIndex < 0 && !element.matches(":disabled,[inert]"))
          invalid("present", has("trigger") ? "trigger" : "dismiss", "Control is not reachable with the keyboard.",
            "Prefer a native button; custom controls need focusability and appropriate keyboard activation.", "WARN_CONTROL_ACCESSIBILITY");
      }
      if (has("auto-unpop") && value("auto-unpop") && !/^(?:\d+(?:\.\d+)?|\.\d+)(?:ms|s)?$/.test(value("auto-unpop").trim()))
        invalid("present", "auto-unpop", "Auto-unpop duration is invalid.", "Use a nonnegative duration such as 250ms or 2s.");
      if (has("present-group")) {
        const members = [...element.querySelectorAll(`[${attr("present")}]`)].filter(member => member.closest(`[${attr("present-group")}]`) === element);
        if (!members.some(member => member.id))
          invalid("present", "present-group", "Group has no identifiable Present members.", "Add Present descendants with unique native IDs.", "WARN_PRESENT_GROUP_SELECTION");
        for (const member of members) if (!member.id) reportConfiguration(api, "WARN_PRESENT_GROUP_SELECTION", {
          extension: "present", element: member, attribute: "id", value: member.id,
          reason: "Present Group member has no ID.", suggestion: "Assign a unique native ID so the group can select this member."
        });
      }
    }

    function validateAnchor() {
      const pivots = new Set("top-left top-center top-right center-left center center-right bottom-left bottom-center bottom-right".split(" "));
      const pairs = has("anchor") ? value("anchor").split(",") : [];
      if (has("anchor") && !pairs.every(token => { const pair = token.trim().toLowerCase().split(":"); return pair.length === 2 && pair.every(pivot => pivots.has(pivot.trim())); }))
        invalid("anchor", "anchor", "Anchor pivot pair is invalid.", "Use target:self pairs such as bottom-center:top-center, separated by commas.");
      if (has("anchor-match") && value("anchor-match").trim().split(/\s+/).some(token => !["width", "height"].includes(token)))
        invalid("anchor", "anchor-match", "Unknown matching dimension.", "Use width, height, or width height.", "WARN_ANCHOR_MATCH");
      const reference = value("anchor-target");
      if (!reference) return;
      let target;
      try { target = root.document.getElementById(reference.replace(/^#/, "")) || root.document.querySelector(reference); }
      catch (_) { /* report the declaration below */ }
      if (target?.hasAttribute(attr("present-group"))) {
        if (!api.ext.present?.initialized)
          report("WARN_EXTENSION_REQUIRED", "present", "anchor-target", "A Present Group target requires Present.", "Register and initialize Present before mounting the group and its Anchors.");
        // A mounted group with no accepted selection is a normal inactive state.
        target = api.ext.present?.selected?.(target);
        if (!target) return;
      }
      if (!target) invalid("anchor", "anchor-target", "Anchor target does not exist or the selector is invalid.", "Use an existing target ID or a valid CSS selector.", "WARN_CONFIGURATION_TARGET");
      else if (method === "update" && element.getClientRects().length && !target.getClientRects().length && !target.closest(`[${attr("present")}],[hidden]`))
        invalid("anchor", "anchor-target", "The explicitly updated Anchor target cannot currently be measured.", "Reveal the target before requesting placement, or update again after it becomes measurable.", "WARN_CONFIGURATION_TARGET");
    }

    function validateScrollbox() {
      if (value("scrollbox").trim().toLowerCase() !== "pointer" || !element.getClientRects().length) return;
      const style = root.getComputedStyle(element);
      const blockedX = element.scrollWidth > element.clientWidth + 1 && !["auto", "scroll"].includes(style.overflowX);
      const blockedY = element.scrollHeight > element.clientHeight + 1 && !["auto", "scroll"].includes(style.overflowY);
      const usableX = element.scrollWidth > element.clientWidth + 1 && ["auto", "scroll"].includes(style.overflowX);
      const usableY = element.scrollHeight > element.clientHeight + 1 && ["auto", "scroll"].includes(style.overflowY);
      if ((blockedX || blockedY) && !usableX && !usableY)
        invalid("scrollbox", "scrollbox", "Content overflows but CSS disables the pointer scrolling axes.", "Set overflow:auto or overflow:scroll on the intended axis.", "WARN_CONFIGURATION_STYLE");
    }

    function validateSnap() {
      if (!["", "horizontal", "vertical", "false"].includes(value("scrollbox-snap")))
        invalid("scrollbox-snap", "scrollbox-snap", "Unknown snap axis.", "Use horizontal, vertical, or false.");
      for (const item of element.querySelectorAll(`[${attr("snap-item")}]`)) {
        if (item.closest(`[${attr("scrollbox")}]`) !== element) continue;
        const alignment = item.getAttribute(attr("snap-item"));
        const style = root.getComputedStyle(item);
        if (item.getClientRects().length && [style.transform, style.translate, style.rotate, style.scale].some(value => value && value !== "none"))
          reportConfiguration(api, "WARN_SCROLLBOX_SNAP_TRANSFORM", {
            extension: "scrollbox-snap", element: item, attribute: attr("snap-item"),
            reason: "Snap geometry includes a transform applied to the item itself.",
            suggestion: "Apply the visual transform to a child of the snap item."
          });
        if (!["", "start", "end", "center", "left", "right", "top", "bottom"].includes(alignment))
          reportConfiguration(api, "WARN_CONFIGURATION_VALUE", {
            extension: "scrollbox-snap", element: item, attribute: attr("snap-item"), value: alignment,
            reason: "Unknown snap item alignment.", suggestion: "Use start, center, or end (left/right/top/bottom are aliases)."
          });
      }
    }

    function validateCSS() {
      const checkAnchor = has("anchor") && (!selected || selected.has("anchor"));
      const checkPresent = (has("present") || has("present-motion")) && (!selected || selected.has("present"));
      if (!checkAnchor && !checkPresent) return;
      if (has("anchor") && has("present") && value("present").trim().split(/\s+/).some(token => token === "transform" || token === "all"))
        invalid("present", "present", "Anchor and Present both declare transform; Anchor takes priority.",
          "Remove transform from Present, or animate a child element instead.", "WARN_PRESENT_ANCHOR_TRANSFORM");
      const extension = checkAnchor ? "anchor" : "present";
      const style = root.getComputedStyle(element);
      const durations = [
        ...(checkPresent ? ["--ae-pop-duration", "--ae-unpop-duration"] : []),
        ...(checkAnchor ? ["--ae-anchor-switch-duration"] : [])
      ];
      for (const name of durations) {
        const value = (element.style.getPropertyValue(name) || style.getPropertyValue(name)).trim();
        if (value && root.CSS?.supports && !root.CSS.supports("transition-duration", value))
          reportConfiguration(api, "WARN_CONFIGURATION_STYLE", { extension, element, attribute: "style", value,
            reason: `Invalid duration in ${name}.`, suggestion: "Use a nonnegative CSS time such as 250ms or 0s." });
      }
      if (!element.getClientRects().length) return;
      if (checkPresent && has("present") && element.classList.contains(api.className("present-grid")) && /(?:^|\s)(height|width)(?:\s|$)/.test(value("present")) && !["grid", "inline-grid"].includes(style.display))
        invalid(extension, "present", "Present's size motion requires its grid layout stylesheet.", "Load the Present stylesheet, check CSP, and preserve the container's grid display.", "WARN_CONFIGURATION_STYLE");
      if (checkAnchor && element.classList.contains(api.className("anchored")) && !["absolute", "fixed"].includes(style.position))
        invalid(extension, "anchor", "Effective CSS prevents Anchor's absolute positioning.", "Check the weak stylesheet, CSP and overriding position rules.", "WARN_CONFIGURATION_STYLE");
      if (checkPresent && has("present") && element.hidden && style.display !== "none" && !invisible(element))
        invalid(extension, "present", "CSS makes a hidden Present container render.", "Preserve display:none for hidden Present containers; check overriding display rules.", "WARN_CONFIGURATION_STYLE");
    }
  }

  function invisible(element) {
    for (let node = element; node; node = node.parentElement) {
      const style = root.getComputedStyle(node);
      if (style.visibility !== "visible" || Number(style.opacity) === 0) return true;
    }
    return false;
  }
}

function oneEditApart(left, right) {
  if (Math.abs(left.length - right.length) > 1) return false;
  let i = 0, j = 0, edits = 0;
  while (i < left.length && j < right.length) {
    if (left[i] === right[j]) { i++; j++; continue; }
    if (++edits > 1) return false;
    if (left[i] === right[j + 1] && left[i + 1] === right[j] && left.length === right.length) { i += 2; j += 2; }
    else if (left.length > right.length) i++;
    else if (right.length > left.length) j++;
    else { i++; j++; }
  }
  return edits + Number(i < left.length || j < right.length) === 1;
}
