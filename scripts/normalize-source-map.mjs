export function normalizeSourceMapText(text, filename = "source map") {
  const map = JSON.parse(text);
  if (!Array.isArray(map.sourcesContent)) throw new Error(`Unexpected source map format: ${filename}`);
  const sourcesContent = map.sourcesContent.map(source => source.replace(/\r\n?/g, "\n"));
  return /^  "sourcesContent": .*,$/m.test(text)
    // Source text can contain $&, $' or $`: a replacement string would expand
    // those tokens and corrupt the surrounding JSON. Return literal content.
    ? text.replace(/^  "sourcesContent": .*,$/m,
      () => `  "sourcesContent": ${JSON.stringify(sourcesContent)},`)
    : JSON.stringify({ ...map, sourcesContent });
}
