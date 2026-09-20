/*! Aellux | SPDX-License-Identifier: Apache-2.0 | See LICENSE for terms. */

export const spacing = [0, 1, 2, 3, 4, 5];
export const marginValues = [...spacing, "auto"];
export const columnCounts = Array.from({ length: 12 }, (_, index) => index + 1);
export const stateAliases = {
  compact: "cp",
  small: "sm",
  medium: "md",
  large: "lg",
  wide: "wd",
  ultrawide: "uw",
  "shape-vertical": "sv",
  "shape-horizontal": "sh",
  "shape-square": "ss"
};
export const spacingValues = {
  0: "0",
  1: "0.25rem",
  2: "0.5rem",
  3: "1rem",
  4: "1.5rem",
  5: "3rem"
};

export const utilities = {
  p: { properties: ["padding"], values: spacing },
  px: { properties: ["padding-left", "padding-right"], values: spacing },
  py: { properties: ["padding-top", "padding-bottom"], values: spacing },
  pb: { properties: ["padding-bottom"], values: spacing },
  pt: { properties: ["padding-top"], values: spacing },
  ps: { properties: ["padding-inline-start"], values: spacing },
  pe: { properties: ["padding-inline-end"], values: spacing },
  m: { properties: ["margin"], values: marginValues },
  mx: { properties: ["margin-left", "margin-right"], values: marginValues },
  my: { properties: ["margin-top", "margin-bottom"], values: marginValues },
  mb: { properties: ["margin-bottom"], values: marginValues },
  mt: { properties: ["margin-top"], values: marginValues },
  ms: { properties: ["margin-inline-start"], values: marginValues },
  me: { properties: ["margin-inline-end"], values: marginValues },
  gap: { properties: ["gap"], values: spacing },
  d: { properties: ["display"], values: ["none", "block", "inline", "inline-block", "flex", "inline-flex", "grid", "inline-grid"] },
  "flex": { properties: ["flex-direction"], values: ["row", "row-reverse", "column", "column-reverse"] },
  "justify-content": { properties: ["justify-content"], values: ["flex-start", "flex-end", "center", "space-between", "space-around", "space-evenly"] },
  "align-items": { properties: ["align-items"], values: ["stretch", "flex-start", "flex-end", "center", "baseline"] },
  "align-content": { properties: ["align-content"], values: ["stretch", "flex-start", "flex-end", "center", "baseline", "space-between", "space-around", "space-evenly"] },
  position: { properties: ["position"], values: ["static", "relative", "absolute", "fixed", "sticky"] },
  "row-cols": {
    values: ["auto", ...columnCounts.slice(0, 6)],
    selectorSuffix: " > *",
    declarations: Object.fromEntries(["auto", ...columnCounts.slice(0, 6)].map(value => [value, {
      flex: "0 0 auto",
      width: value === "auto" ? "auto" : `${100 / value}%`
    }]))
  },
  col: {
    values: ["auto", ...columnCounts],
    declarations: Object.fromEntries(["auto", ...columnCounts].map(value => [value, {
      flex: "0 0 auto",
      width: value === "auto" ? "auto" : `${value / 12 * 100}%`
    }]))
  },
  ar: {
    values: ["auto", "1x1", "4x3", "3x4", "16x9", "9x16", "18x9", "9x18", "21x9", "9x21"],
    declarations: {
      auto: { "aspect-ratio": "auto" },
      "1x1": { "aspect-ratio": "1 / 1" },
      "4x3": { "aspect-ratio": "4 / 3" },
      "3x4": { "aspect-ratio": "3 / 4" },
      "16x9": { "aspect-ratio": "16 / 9" },
      "9x16": { "aspect-ratio": "9 / 16" },
      "18x9": { "aspect-ratio": "18 / 9" },
      "9x18": { "aspect-ratio": "9 / 18" },
      "21x9": { "aspect-ratio": "21 / 9" },
      "9x21": { "aspect-ratio": "9 / 21" }
    }
  },
  text: {
    values: ["start", "center", "end", "wrap", "nowrap", "break"],
    declarations: {
      start: { "text-align": "start" },
      center: { "text-align": "center" },
      end: { "text-align": "end" },
      wrap: { "white-space": "normal" },
      nowrap: { "white-space": "nowrap" },
      break: { "overflow-wrap": "break-word", "word-break": "break-word" }
    }
  }
};

export function generateAdaptiveCSS(aellux) {
  const states = Object.entries(aellux.options.adaptiveParams.minSizes)
    .sort((first, second) => first[1] - second[1])
    .map(([state]) => ({ state, className: "fits-" + state }));
  for (const state of ["shape-vertical", "shape-horizontal", "shape-square"]) {
    states.push({ state, className: state });
  }
  const rules = [];

  for (const value of utilities.ar.values) {
    const declarations = Object.entries(utilities.ar.declarations[value])
      .map(([property, propertyValue]) => `  ${property}: ${propertyValue} !important;`)
      .join("\n");
    rules.push(`.ar-${value} {\n${declarations}\n}`);
  }

  for (const { state, className } of states) {
    const stateAlias = stateAliases[state] || state;
    const container = `.${aellux.className(className)}`;
    for (const [utility, definition] of Object.entries(utilities)) {
      for (const value of definition.values) {
        const cssValue = typeof value === "number" ? spacingValues[value] : value;
        const propertyValues = definition.declarations
          ? Object.entries(definition.declarations[value])
          : definition.properties.map(property => [property, cssValue]);
        const declarations = propertyValues
          .map(([property, propertyValue]) => `  ${property}: ${propertyValue} !important;`)
          .join("\n");
        rules.push(`${container} .${utility}-ux-${stateAlias}-${value}${definition.selectorSuffix || ""} {\n${declarations}\n}`);
      }
    }
  }

  return "/*! Aellux | SPDX-License-Identifier: Apache-2.0 | See LICENSE for terms. */\n\n" + rules.join("\n\n") + "\n";
}
