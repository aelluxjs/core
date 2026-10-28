/*! aellux.js | SPDX-License-Identifier: Apache-2.0 | See LICENSE for terms. */

// Inspect source text: the DOM has already discarded duplicate attributes.
// This is a start-tag scanner, not an HTML conformance validator.
export function findDuplicateAttributes(html) {
  const duplicates = [];
  const space = /[\t\n\f\r ]/;
  const lower = text => text.replace(/[A-Z]/g, char => char.toLowerCase());
  let index = 0, lineIndex = 0, line = 1, column = 1;
  while ((index = html.indexOf("<", index)) !== -1) {
    if (html.startsWith("<!--", index)) {
      const end = /--!?>/.exec(html.slice(index + 4));
      index = end ? index + 4 + end.index + end[0].length : html.length;
      continue;
    }
    if (html.startsWith("<![CDATA[", index)) {
      const end = html.indexOf("]]>", index + 9);
      index = end < 0 ? html.length : end + 3;
      continue;
    }
    if (/[!?/]/.test(html[index + 1] || "")) {
      const end = html.indexOf(">", index + 2);
      index = end < 0 ? html.length : end + 1;
      continue;
    }
    if (!/[a-z]/i.test(html[index + 1] || "")) { index++; continue; }
    const tagStart = ++index;
    while (index < html.length && !space.test(html[index]) && !/[/>]/.test(html[index])) index++;
    const tagName = lower(html.slice(tagStart, index));
    const attributes = new Map();
    while (index < html.length && html[index] !== ">") {
      if (space.test(html[index]) || html[index] === "/") { index++; continue; }
      const offset = index++;
      while (index < html.length && !space.test(html[index]) && !/[=/>]/.test(html[index])) index++;
      const attribute = lower(html.slice(offset, index).replace(/\0/g, "\uFFFD"));
      while (space.test(html[index] || "")) index++;
      let value = "";
      if (html[index] === "=") {
        index++;
        while (space.test(html[index] || "")) index++;
        const quote = html[index];
        if (quote === '"' || quote === "'") {
          const start = ++index;
          while (index < html.length && html[index] !== quote) index++;
          value = html.slice(start, index);
          if (index < html.length) index++;
        } else {
          const start = index;
          while (index < html.length && !space.test(html[index]) && html[index] !== ">") index++;
          value = html.slice(start, index);
        }
      }
      const previous = attributes.get(attribute);
      if (previous) {
        previous.values.push(value);
        if (!previous.duplicate) {
          while (lineIndex < offset) {
            const char = html[lineIndex++];
            if (char === "\r" || char === "\n" && html[lineIndex - 2] !== "\r") { line++; column = 1; }
            else if (char !== "\n") column++;
          }
          previous.duplicate = { tagName, attribute, value: previous.values[0], values: previous.values, offset, line, column };
        }
      } else attributes.set(attribute, { values: [value] });
    }
    // An incomplete tag is never emitted by the HTML parser.
    if (index >= html.length) break;
    for (const attribute of attributes.values())
      if (attribute.duplicate) duplicates.push(attribute.duplicate);
    index++;
    if (tagName === "plaintext") break;
    // Markup-like text inside these HTML elements is not a start tag.
    if (/^(script|style|textarea|title|xmp|iframe|noembed|noframes|noscript)$/.test(tagName)) {
      const closing = new RegExp(`</${tagName}(?=[\\t\\n\\f\\r />])`, "ig");
      closing.lastIndex = index;
      const end = closing.exec(html);
      index = end ? end.index : html.length;
    }
  }
  return duplicates;
}
