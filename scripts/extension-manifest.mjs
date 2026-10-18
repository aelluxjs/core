/*! aellux.js | SPDX-License-Identifier: Apache-2.0 | See LICENSE for terms. */

export function createOfficialExtensionManifest({ version, definitions, integrity, cdnBase = "" }) {
  if (typeof version !== "string" || !version) throw new Error("Manifest coreVersion is required.");
  const base = cdnBase.trim().replace(/\/$/, "");
  if (base && !/^https:\/\//i.test(base))
    throw new Error("AELLUX_OFFICIAL_CDN_BASE must use HTTPS.");

  const extensions = {};
  const report = [];
  for (const definition of definitions) {
    validateDefinition(definition);
    const modern = `aellux.ext.${definition.name}.min.js`;
    const legacy = `aellux.ext.${definition.name}.legacy.min.js`;
    const entry = {
      coreCompatibility: version,
      builds: {
        modern: artifact(modern, modern.replace(".min.js", ".js")),
        legacy: artifact(legacy, legacy.replace(".min.js", ".js"))
      },
      dependencies: Array.from(definition.dependencies || [])
    };
    if (definition.style) {
      const style = `aellux.ext.${definition.name}.min.css`;
      entry.style = artifact(style, style.replace(".min.css", ".css"));
    }
    extensions[definition.name] = entry;
    report.push({ name: definition.name, status: "valid", artifacts: definition.style ? 3 : 2 });
  }

  const manifest = { schemaVersion: 1, coreVersion: version, extensions };
  validateOfficialExtensionManifest(manifest);
  return { manifest, report };

  function artifact(filename, regularFilename) {
    const minifiedIntegrity = integrity.minified || integrity;
    const regularIntegrity = integrity.regular || integrity;
    const hash = minifiedIntegrity[filename];
    const regularHash = regularIntegrity[regularFilename];
    if (!hash) throw new Error(`Official extension artifact is missing: ${filename}`);
    if (!regularHash) throw new Error(`Official extension artifact is missing: ${regularFilename}`);
    return {
      url: base ? `${base}/${encodeURIComponent(version)}/${filename}` : `./${filename}`,
      integrity: hash,
      regular: {
        url: base ? `${base}/${encodeURIComponent(version)}/${regularFilename}` : `./${regularFilename}`,
        integrity: regularHash
      }
    };
  }
}

export function validateOfficialExtensionManifest(manifest) {
  if (!manifest || manifest.schemaVersion !== 1 || typeof manifest.coreVersion !== "string" ||
    !manifest.extensions || typeof manifest.extensions !== "object" || Array.isArray(manifest.extensions))
    throw new Error("Invalid official extension manifest root.");
  for (const [name, entry] of Object.entries(manifest.extensions)) {
    if (!/^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/.test(name) || !entry ||
      entry.coreCompatibility !== manifest.coreVersion || !entry.builds)
      throw new Error(`Invalid official extension metadata: ${name}`);
    for (const variant of ["modern", "legacy"]) validateArtifact(entry.builds[variant], `${name}/${variant}`);
    if (entry.style) validateArtifact(entry.style, `${name}/style`);
    if (!Array.isArray(entry.dependencies)) throw new Error(`Invalid dependencies: ${name}`);
    for (const dependency of entry.dependencies) validateDependency(dependency, name);
  }
  return true;
}

function validateDefinition(definition) {
  if (!definition || !/^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/.test(definition.name) ||
    !Array.isArray(definition.dependencies))
    throw new Error("Invalid explicit official extension definition.");
  for (const dependency of definition.dependencies) validateDependency(dependency, definition.name);
}

function validateArtifact(artifact, label) {
  if (!artifact || typeof artifact.url !== "string" ||
    !(/^(?:\.\/|https:\/\/)/i.test(artifact.url)) ||
    typeof artifact.integrity !== "string" ||
    !/^sha384-[A-Za-z0-9+/]+={0,2}$/.test(artifact.integrity))
    throw new Error(`Invalid official artifact metadata: ${label}`);
  if (artifact.regular) {
    const regular = artifact.regular;
    if (typeof regular.url !== "string" || !(/^(?:\.\/|https:\/\/)/i.test(regular.url)) ||
      typeof regular.integrity !== "string" ||
      !/^sha384-[A-Za-z0-9+/]+={0,2}$/.test(regular.integrity))
      throw new Error(`Invalid official regular artifact metadata: ${label}`);
  }
}

function validateDependency(dependency, extensionName) {
  if (typeof dependency === "string" && dependency.trim()) return;
  if (!dependency || typeof dependency.label !== "string" || !dependency.label.trim() ||
    typeof dependency.url !== "string" ||
    !(/^(?:\.\/|https:\/\/)/i.test(dependency.url)) ||
    typeof dependency.integrity !== "string" ||
    !/^sha384-[A-Za-z0-9+/]+={0,2}$/.test(dependency.integrity)) {
    throw new Error(`Invalid dependency metadata: ${extensionName}`);
  }
}
