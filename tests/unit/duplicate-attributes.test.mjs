import { test } from "node:test";
import assert from "node:assert/strict";
import { findDuplicateAttributes } from "../../src/internal/find-duplicate-attributes.js";
import { validateHTMLSource } from "../../src/internal/validate-html-source.js";
import { buildDiagnostics } from "../../src/internal/build-diagnostics.js";
import { createAelluxConstants } from "../../src/internal/create-aellux-constants.js";

test("duplicate attributes retain first and discarded values, including mixed case and booleans", () => {
  const found = findDuplicateAttributes(`<div CLASS="first" class='second' Class=third style="color:red" STYLE='display:none' hidden HIDDEN data-ae-present data-ae-present="opacity"></div>`);
  assert.deepEqual(found.map(({ attribute, value, values }) => ({ attribute, value, values })), [
    { attribute: "class", value: "first", values: ["first", "second", "third"] },
    { attribute: "style", value: "color:red", values: ["color:red", "display:none"] },
    { attribute: "hidden", value: "", values: ["", ""] },
    { attribute: "data-ae-present", value: "", values: ["", "opacity"] }
  ]);
});

test("positions identify the first repeated attribute in LF, CRLF and CR source", () => {
  for (const newline of ["\n", "\r\n", "\r"]) {
    const html = `<div${newline}  class="first"${newline}  class="second"></div>`;
    assert.deepEqual(findDuplicateAttributes(html).map(({ line, column, offset, tagName }) => ({ line, column, offset, tagName })), [
      { line: 3, column: 3, offset: html.lastIndexOf("class"), tagName: "div" }
    ]);
  }
});

test("source scanner ignores comments, text elements, quoted markup and ordinary repeated tokens", () => {
  const html = `<!doctype html><!-- <div class=a class=b> --!>
    <script>const html = '<div class=a class=b>';</script >
    <style>/* <div class=a class=b> */</style>
    <textarea><div style=a style=b></textarea>
    <title><div class=a class=b></title>
    <xmp><div class=a class=b></xmp>
    <iframe><div class=a class=b></iframe>
    <noembed><div class=a class=b></noembed>
    <noframes><div class=a class=b></noframes>
    <noscript><div class=a class=b></noscript>
    <div title="<i class=a class=b>" data-text='>' class="one one" style="color:red;color:blue"></div>
    <div class=a></div><div class=b></div>
    <plaintext><div class=a class=b>`;
  assert.deepEqual(findDuplicateAttributes(html), []);
  assert.deepEqual(findDuplicateAttributes('<div class=a class="b'), []);
  assert.deepEqual(findDuplicateAttributes('<!-- <div class=a class=b>'), []);
});

test("template contents and text element start tags still report real duplicates", () => {
  const found = findDuplicateAttributes(`<template><div class=a class=b></div></template><script type="text/plain" TYPE="text/html"><i class=a class=b></script><p title='a > b' title='c'>`);
  assert.deepEqual(found.map(({ tagName, attribute }) => [tagName, attribute]), [
    ["div", "class"], ["script", "type"], ["p", "title"]
  ]);
});

test("HTML source warnings use the shared history, actionable context and development guard", () => {
  const api = { options: { environment: "development" }, diagnostics: buildDiagnostics(createAelluxConstants().AELLUXJS_DIAGNOSTICS) };
  const html = '<div class="a" class="b" style="color:red" style="display:none"></div><input disabled disabled>';
  validateHTMLSource(api, html, "/page");
  validateHTMLSource(api, html, "/page");
  const entries = api.diagnostics.showHistory(3);
  assert.equal(entries.length, 3);
  for (const entry of entries) {
    assert.equal(entry.code, 2032);
    assert.equal(entry.level, api.diagnostics.levels.warn);
    assert.equal(entry.context.source, "/page");
    assert.match(entry.context.reason, /keeps the first value/);
    assert.ok(entry.context.suggestion);
  }
  api.options.environment = "production";
  validateHTMLSource(api, html, "/another-page");
  assert.equal(api.diagnostics.showHistory().length, 3);
});
