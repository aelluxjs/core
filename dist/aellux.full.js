(() => {
  var __defProp = Object.defineProperty;
  var __defProps = Object.defineProperties;
  var __getOwnPropDescs = Object.getOwnPropertyDescriptors;
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __getOwnPropSymbols = Object.getOwnPropertySymbols;
  var __hasOwnProp = Object.prototype.hasOwnProperty;
  var __propIsEnum = Object.prototype.propertyIsEnumerable;
  var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
  var __spreadValues = (a, b) => {
    for (var prop in b || (b = {}))
      if (__hasOwnProp.call(b, prop))
        __defNormalProp(a, prop, b[prop]);
    if (__getOwnPropSymbols)
      for (var prop of __getOwnPropSymbols(b)) {
        if (__propIsEnum.call(b, prop))
          __defNormalProp(a, prop, b[prop]);
      }
    return a;
  };
  var __spreadProps = (a, b) => __defProps(a, __getOwnPropDescs(b));
  var __esm = (fn, res) => function __init() {
    return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
  };

  // <define:__AELLUX_OFFICIAL_EXTENSION_MANIFEST__>
  var define_AELLUX_OFFICIAL_EXTENSION_MANIFEST_default;
  var init_define_AELLUX_OFFICIAL_EXTENSION_MANIFEST = __esm({
    "<define:__AELLUX_OFFICIAL_EXTENSION_MANIFEST__>"() {
      define_AELLUX_OFFICIAL_EXTENSION_MANIFEST_default = { schemaVersion: 1, coreVersion: "0.1.0-beta.10", extensions: { preference: { coreCompatibility: "0.1.0-beta.10", builds: { modern: { url: "./aellux.ext.preference.min.js", integrity: "sha384-mSOgb0DekFTRXXZAgyNrPjamdlSqzL4SSGZYVWgVg+WlG+pBj11xT81v/6Xk43yO", regular: { url: "./aellux.ext.preference.js", integrity: "sha384-MlikpdHSzHzF6kz5+oJGtq3eoFsKTsx/g+FTrf+dFOU8iQGHsCpn4fP1jLlbNrj7" } }, legacy: { url: "./aellux.ext.preference.legacy.min.js", integrity: "sha384-1LMsK0W9J/PoM4tXhFgkYLRY4yWdzVoYmFy4OMDGd8lRdtptKoEb1sI9L1kzNaBu", regular: { url: "./aellux.ext.preference.legacy.js", integrity: "sha384-pozuz43OyfXrnkmuBu6KTM2lqRSqcI5LMgwAtqnzXq8xZGdVqpnmOtrBcYcMskWk" } } }, dependencies: [] }, "state-navigation": { coreCompatibility: "0.1.0-beta.10", builds: { modern: { url: "./aellux.ext.state-navigation.min.js", integrity: "sha384-wAbgAqjAA6wauuG+iuUtfRwxChd6fTJ0fS22fqnu2r00kouoXJWZ0f7AoTYlqBC6", regular: { url: "./aellux.ext.state-navigation.js", integrity: "sha384-PKJ8HTD7eIYDEg2hOaAJjpMYzLr2fBjBRGmIGG7XzGTzVK0yTjt5HYPO55VbWfdS" } }, legacy: { url: "./aellux.ext.state-navigation.legacy.min.js", integrity: "sha384-YkhfU15Mpk8KiO6TyoVU6z1yCiYWwnsOGE0xVaQ8NrE7IGrxOSUL005g5JeUDdJu", regular: { url: "./aellux.ext.state-navigation.legacy.js", integrity: "sha384-kaEUY0Zpw8K6pcwjm+INA5feXftLK2/N1aFpPr2LCTcetX2uoe2GGd1MJyy7u8rZ" } } }, dependencies: [] }, feedback: { coreCompatibility: "0.1.0-beta.10", builds: { modern: { url: "./aellux.ext.feedback.min.js", integrity: "sha384-oHAcvQwCs/v3ktzXoNdJEDEkaV6NI29MjzjF068Lw0oL9NwVP5THnxzb12f0ySkY", regular: { url: "./aellux.ext.feedback.js", integrity: "sha384-dGcxHfGyV544C6livNJKKrlNWky/fBFkMONowmtlhHZ5exWL8AJOoV40jJhZW6Iq" } }, legacy: { url: "./aellux.ext.feedback.legacy.min.js", integrity: "sha384-S31Sa8B4kbKL/xsEJ3QTTikO+AjuXSc9GXBzNw8kl/b2amk5tzqgQNNKQPfGnYdF", regular: { url: "./aellux.ext.feedback.legacy.js", integrity: "sha384-sy2QmY3L1TlvGPgdebeu5q9ZJl/bOeUstWE0Cu+QJUIYWSF9y1YH6mCpe09/eKrd" } } }, dependencies: [], style: { url: "./aellux.ext.feedback.min.css", integrity: "sha384-OBguCYqF+dMD0Pl84C3FlY/+ohUGfW0OyynmXb/PSDEGOyuI/TQJ3EZAoCeJx+Jk", regular: { url: "./aellux.ext.feedback.css", integrity: "sha384-yk4cW+r/Mc1FRS1ZauBHC6KsKb7sxuJ0E9mmt/+AYASAdZXXMK6iuFBR+TOEh/r4" } } }, focus: { coreCompatibility: "0.1.0-beta.10", builds: { modern: { url: "./aellux.ext.focus.min.js", integrity: "sha384-AXpUv/Ur2Z4cKvO9EqIFqfxxdSQR5j75q0okOAWPvHhSneQ5LPjrOzk6Sl9MOo4a", regular: { url: "./aellux.ext.focus.js", integrity: "sha384-VjQzcnhLRrvRlbVQ0X4/tO0+8gqJXAmIFoeIVimjOud1wRNuBXNnSQHHW9XQPzTe" } }, legacy: { url: "./aellux.ext.focus.legacy.min.js", integrity: "sha384-I5QpUmKsA1T8NiKfKXQgbdG19Ld1ZGCWSmosygO3yGj43tdxp5zCfLyfBuFoHlKu", regular: { url: "./aellux.ext.focus.legacy.js", integrity: "sha384-5/y3J1NC/qMyV9myEj29+wGbqCVI8ICPafSebtJVfl15Qmup6vMiJzveShd3CLnw" } } }, dependencies: [] }, point: { coreCompatibility: "0.1.0-beta.10", builds: { modern: { url: "./aellux.ext.point.min.js", integrity: "sha384-n540II5oWbHJRt/a8i+Rgb9A3b9dm7hamg1kd3Nz7KdPQDcaa8S823t9fCrgxBWF", regular: { url: "./aellux.ext.point.js", integrity: "sha384-aDj7I5QEH/0+52E3e6yPZ/D0MEsNBdxeET3G5ToVvgczHtksMh3p8S/KOoAapRRN" } }, legacy: { url: "./aellux.ext.point.legacy.min.js", integrity: "sha384-5UmWvQHfmvttz9yeXbilawGCZH20UdR8yNBOE9kRV34wpfWASl8plzgKtLVQGO9M", regular: { url: "./aellux.ext.point.legacy.js", integrity: "sha384-gG/XONYEC1tchBcJ6bUtKYmWFHz0E+50LmMaXDAiqWBKPuwdHZeYm1uXA22lMZuN" } } }, dependencies: [] }, anchor: { coreCompatibility: "0.1.0-beta.10", builds: { modern: { url: "./aellux.ext.anchor.min.js", integrity: "sha384-vpHUGJwyY3qnW78C6Yo8CLc2vgbn1KJ8FcOtQawBtCKarQ0CoihuNQ7ZCKnMbOjx", regular: { url: "./aellux.ext.anchor.js", integrity: "sha384-LaYGJ6p9H5QBGJf5j19wHgT+CFcMim2h0Ro+itxYnLkIE29RFtPdj8P8L9EYWAWr" } }, legacy: { url: "./aellux.ext.anchor.legacy.min.js", integrity: "sha384-Ym0BnY5sDflVI4JyPVWymZKurBcJTAbPNe2gy+6qHcD7x6RyIKwvff6o+6BfeZDy", regular: { url: "./aellux.ext.anchor.legacy.js", integrity: "sha384-bN9t1anpKLUDUvnbE845H1+9UvP+XDfrsN5AhrKLUQJ5fm3YcFqiylDNFuE02RlJ" } } }, dependencies: [], style: { url: "./aellux.ext.anchor.min.css", integrity: "sha384-DwxfMH5mNSvmF0U4/dgL6dbe+5U1x97y2H4skxW7nUUzjr99IXNl9aVDwRjfvNGz", regular: { url: "./aellux.ext.anchor.css", integrity: "sha384-tHVCjTT3bvlmkAIDfMyevvrkAB7crjBXQAfY1l8XcaWhBFSersWJk+JndC6Bd9mO" } } }, "overflow-marquee": { coreCompatibility: "0.1.0-beta.10", builds: { modern: { url: "./aellux.ext.overflow-marquee.min.js", integrity: "sha384-EUZO28afWnFc6O49cABa3rPbKZdDpt1qf7STLiI6pNi3lIY+2bwRQRzU3cZ6AK+u", regular: { url: "./aellux.ext.overflow-marquee.js", integrity: "sha384-qBC4/o78des4U3qldDyUAerX5x6jT7cudmsuArw0caNMu7tF+kjhg/WdD44qbh6p" } }, legacy: { url: "./aellux.ext.overflow-marquee.legacy.min.js", integrity: "sha384-ceZW+Z6XzECKkRUbAPt6pJ50JmbCwaAN1l5JN65Yj+2WOEov43bKUQ6pB5XpAz3k", regular: { url: "./aellux.ext.overflow-marquee.legacy.js", integrity: "sha384-HyHNSpTOh9IvFhnjPqNoVfnZ7suRqWq5Cby+Oem4gRUiSY+/tXhSc4nO7JP94QfM" } } }, dependencies: [], style: { url: "./aellux.ext.overflow-marquee.min.css", integrity: "sha384-227/o3V6WqWkOwwlcZPWi9LjjLnbP102GcrmuRFMcA5LRvDjuuW0GgFmOr9a6CLq", regular: { url: "./aellux.ext.overflow-marquee.css", integrity: "sha384-n7NbmKXeKb6tdUwdw/4hJUFbZfKKpgbuLed9qONT1wpVK/em6yYoj+CfSbl+Z5XS" } } }, "ajax-href": { coreCompatibility: "0.1.0-beta.10", builds: { modern: { url: "./aellux.ext.ajax-href.min.js", integrity: "sha384-VAezjOwd/kbJRxi9U2PK45VO+fXzYBb6klpq+eO5OJCVm2TqN+i83/7IM5gSz2Ac", regular: { url: "./aellux.ext.ajax-href.js", integrity: "sha384-Nf2FQPKoXOqWfQRJlmq+d21P6ZhzZaS8gZbKeh2vZlX2yIS9X2WETl9zoqpxbEQh" } }, legacy: { url: "./aellux.ext.ajax-href.legacy.min.js", integrity: "sha384-eMHtCmIpETa1JM61ca/zpMThxGYPXIfsJnUMSEDQ5Nnh+weoS51/fXWffVspNir2", regular: { url: "./aellux.ext.ajax-href.legacy.js", integrity: "sha384-dJ1SAifysLIItPBwtq59Uz685vQ1YsYplglGjLa9zF4/+XolTvuRJbWZp4fEisnv" } } }, dependencies: [] }, scrollbox: { coreCompatibility: "0.1.0-beta.10", builds: { modern: { url: "./aellux.ext.scrollbox.min.js", integrity: "sha384-1TqqZT+ulF8e4U8Uttxk+ZXd3gXG6FB5mMXiOiDzJfJulzbWHlcX77dj9jidNUmA", regular: { url: "./aellux.ext.scrollbox.js", integrity: "sha384-S5Z3YWg+j/ZNEX3RqxHFSWEi3uPFKa/erx6XPOJRv6lJNcPGV9wtQaxAuF6fr0Qw" } }, legacy: { url: "./aellux.ext.scrollbox.legacy.min.js", integrity: "sha384-/sQKFIT8u/TAUe+WV4tpu3GOqH+EbUvzOeuko37R9FcL/QFEjYiGT4rzYtJ9fF5g", regular: { url: "./aellux.ext.scrollbox.legacy.js", integrity: "sha384-wIM7v+QbvDB0bXfgUVwT9VS9HqZCEukunJKaDCAUy4wy5P3+i1u8NpEMVXfbkhFy" } } }, dependencies: [], style: { url: "./aellux.ext.scrollbox.min.css", integrity: "sha384-JHqaS1bOe84ly3LSDcK68GJr8/CabByFgMeEPYHeawHtw4bMikkrsC+FCFKdrdJ6", regular: { url: "./aellux.ext.scrollbox.css", integrity: "sha384-tB8nUfKwRJ+GsVpAukiNgHcr7rEeXqxdnrQdZLpy4RnqPTXhArJ5AlLJu/1yel8K" } } }, "scrollbox-snap": { coreCompatibility: "0.1.0-beta.10", builds: { modern: { url: "./aellux.ext.scrollbox-snap.min.js", integrity: "sha384-NNIBI4kj4sdGSI+XDs2LeBrjdo7AAN4eVtQeyAGScLBvxkZEFx3OaT9xpaW4b4Wq", regular: { url: "./aellux.ext.scrollbox-snap.js", integrity: "sha384-gmMGaW0wvR61QynjfBKga6/+7NMAWzk6ALIYmMC0hy9gkSvCrvKXueA+ETEgM9wB" } }, legacy: { url: "./aellux.ext.scrollbox-snap.legacy.min.js", integrity: "sha384-a35oytvnpf0myg+Brd+mFDgQBcbNaihANZl5J+GmrEqlyDl8CDQy0OZyu5Ld3l64", regular: { url: "./aellux.ext.scrollbox-snap.legacy.js", integrity: "sha384-9hE1HNRl9mFvr5aLiaRNZSQsTBb1XoicM6xGqeuISTS6OqL1sZm6DlmY6qxcQJk+" } } }, dependencies: [] }, adaptive: { coreCompatibility: "0.1.0-beta.10", builds: { modern: { url: "./aellux.ext.adaptive.min.js", integrity: "sha384-bkeOnTW/3uzbuhLc8fujaWnWGC+pwNAkZwci9M09paKqudp0v/flMrJ49JXw16vv", regular: { url: "./aellux.ext.adaptive.js", integrity: "sha384-Qzf9wU6DSSaaE+8lr96vnYqjKQqYxep8dhCZmjgNdqreuk9fL3qKMn3NW7DGAEaT" } }, legacy: { url: "./aellux.ext.adaptive.legacy.min.js", integrity: "sha384-YVHHWZOvf+65r/CU89nBPZXhj3j5sn4r2ho+CNUCUaYs1WE6pWIeypcq7n5OCBor", regular: { url: "./aellux.ext.adaptive.legacy.js", integrity: "sha384-gBkxqbBpIqdj5ozJm/NsenI/yKOvEGarZBl2SrPjYiiYx6cez2/FGTMf5XyzHrTj" } } }, dependencies: [], style: { url: "./aellux.ext.adaptive.min.css", integrity: "sha384-8yUP1PStfDqBCyCskP3k9WLIKgv/yl1nyDhmPz7hsX5NZ4z3ZT3ajolA+RhYlUiG", regular: { url: "./aellux.ext.adaptive.css", integrity: "sha384-HfIjX9Zk0VFRimzPvUaTS5AtwuHJHjXKoM/xbNJXj5vE7bSdBGEzbrBHfbNmYah0" } } }, present: { coreCompatibility: "0.1.0-beta.10", builds: { modern: { url: "./aellux.ext.present.min.js", integrity: "sha384-EIaNqaLi7JHQ2RXOI6kX70LbsXAxcf2EgFoCkbs6m6SmIkvSyueWneyt0al0eymR", regular: { url: "./aellux.ext.present.js", integrity: "sha384-fAf7M1Hv8zdfUOFwdiii5rZC8pkEuOJDbskWXzVWe7Y0Tj0hEGctYMmzEZpKsfny" } }, legacy: { url: "./aellux.ext.present.legacy.min.js", integrity: "sha384-C4SfaexHaP88DdRQ2Nliq+HFljay9nkOxjMMQwh6mXRQsPwMb4Pm9TIwe1IpVUPm", regular: { url: "./aellux.ext.present.legacy.js", integrity: "sha384-NWJMHfgYAytfDxWS6e4l6NkrLKrLcJcvtuvzO8pCi5GrOFB5RsY+wspG8seVp0Mf" } } }, dependencies: [], style: { url: "./aellux.ext.present.min.css", integrity: "sha384-2QoNgFTu/KOOrgaTKZV4VXCoIaU2h5PMPILW5LHseXK2ygNpF6miOfxZUwkTBgPY", regular: { url: "./aellux.ext.present.css", integrity: "sha384-uZ/OPZK9sRFcaejKJHrc0wPaPXFKeGS+pBWWbkMEe3+3M6zLEa7nBc/cD0Tejsmr" } } } } };
    }
  });

  // src/internal/utils-name-case.js
  function toCapitalized(name) {
    return name.replace(/^([a-z])|-([a-z])/g, function(_, first, afterHyphen) {
      return (first || afterHyphen).toUpperCase();
    });
  }
  function toCamelCase(name) {
    return name.replace(/-([a-z])/g, function(_, character) {
      return character.toUpperCase();
    });
  }
  function fromCamelCase(name) {
    return name.replace(/([A-Z])/g, "-$1").toLowerCase();
  }
  var utils_name_case_default;
  var init_utils_name_case = __esm({
    "src/internal/utils-name-case.js"() {
      init_define_AELLUX_OFFICIAL_EXTENSION_MANIFEST();
      /*! aellux.js | SPDX-License-Identifier: Apache-2.0 | See LICENSE for terms. */
      utils_name_case_default = {
        toCapitalized,
        toCamelCase,
        fromCamelCase
      };
    }
  });

  // src/internal/report-configuration.js
  function reportConfiguration(api, name, context) {
    if (context.element && context.attribute && !("value" in context))
      context.value = context.element.getAttribute(context.attribute);
    return api.diagnostics.warn(api.diagnostics[name], context);
  }
  function diagnosePresentTarget(api, element, target, attribute, value) {
    if (!value || /[\s#]/.test(value.replace(/^#/, ""))) return false;
    if (target && target.hasAttribute(api.attr("present"))) return true;
    reportConfiguration(api, "WARN_CONFIGURATION_TARGET", {
      extension: "present",
      element,
      attribute,
      value,
      reason: target ? "Target is not a Present container." : "Target element was not found.",
      suggestion: "Use one existing Present element ID, optionally prefixed with #, and mount it before interacting."
    });
    return false;
  }
  var init_report_configuration = __esm({
    "src/internal/report-configuration.js"() {
      init_define_AELLUX_OFFICIAL_EXTENSION_MANIFEST();
      /*! aellux.js | SPDX-License-Identifier: Apache-2.0 | See LICENSE for terms. */
    }
  });

  // src/internal/find-duplicate-attributes.js
  function findDuplicateAttributes(html) {
    const duplicates = [];
    const space = /[\t\n\f\r ]/;
    const lower = (text) => text.replace(/[A-Z]/g, (char) => char.toLowerCase());
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
      if (!/[a-z]/i.test(html[index + 1] || "")) {
        index++;
        continue;
      }
      const tagStart = ++index;
      while (index < html.length && !space.test(html[index]) && !/[/>]/.test(html[index])) index++;
      const tagName = lower(html.slice(tagStart, index));
      const attributes = /* @__PURE__ */ new Map();
      while (index < html.length && html[index] !== ">") {
        if (space.test(html[index]) || html[index] === "/") {
          index++;
          continue;
        }
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
              if (char === "\r" || char === "\n" && html[lineIndex - 2] !== "\r") {
                line++;
                column = 1;
              } else if (char !== "\n") column++;
            }
            previous.duplicate = { tagName, attribute, value: previous.values[0], values: previous.values, offset, line, column };
          }
        } else attributes.set(attribute, { values: [value] });
      }
      if (index >= html.length) break;
      for (const attribute of attributes.values())
        if (attribute.duplicate) duplicates.push(attribute.duplicate);
      index++;
      if (tagName === "plaintext") break;
      if (/^(script|style|textarea|title|xmp|iframe|noembed|noframes|noscript)$/.test(tagName)) {
        const closing = new RegExp(`</${tagName}(?=[\\t\\n\\f\\r />])`, "ig");
        closing.lastIndex = index;
        const end = closing.exec(html);
        index = end ? end.index : html.length;
      }
    }
    return duplicates;
  }
  var init_find_duplicate_attributes = __esm({
    "src/internal/find-duplicate-attributes.js"() {
      init_define_AELLUX_OFFICIAL_EXTENSION_MANIFEST();
      /*! aellux.js | SPDX-License-Identifier: Apache-2.0 | See LICENSE for terms. */
    }
  });

  // src/internal/validate-html-source.js
  function validateHTMLSource(api, html, source) {
    if (api.options.environment !== "development") return;
    for (const duplicate of findDuplicateAttributes(html)) {
      const { attribute } = duplicate;
      reportConfiguration(api, "WARN_ATTRIBUTE_DUPLICATE", __spreadProps(__spreadValues({
        extension: "core",
        source
      }, duplicate), {
        reason: `The ${attribute} attribute occurs more than once on the same start tag; the HTML parser keeps the first value and discards the others.`,
        suggestion: attribute === "class" ? "Combine all class names in one class attribute, separated by spaces." : attribute === "style" ? "Combine the intended CSS declarations in one style attribute, separated by semicolons." : `Keep one ${attribute} attribute with the intended value.`
      }));
    }
  }
  var init_validate_html_source = __esm({
    "src/internal/validate-html-source.js"() {
      init_define_AELLUX_OFFICIAL_EXTENSION_MANIFEST();
      init_find_duplicate_attributes();
      init_report_configuration();
      /*! aellux.js | SPDX-License-Identifier: Apache-2.0 | See LICENSE for terms. */
    }
  });

  // src/aellux.ext.preference.js
  var aellux_ext_preference_exports = {};
  var init_aellux_ext_preference = __esm({
    "src/aellux.ext.preference.js"() {
      init_define_AELLUX_OFFICIAL_EXTENSION_MANIFEST();
      init_utils_name_case();
      /*! aellux.js | SPDX-License-Identifier: Apache-2.0 | See LICENSE for terms. */
      (function(root2) {
        "use strict";
        const AelluxJs2 = root2.AelluxJs;
        const { toCamelCase: toCamelCase2 } = utils_name_case_default;
        const extensionName = "preference";
        if (!AelluxJs2) {
          throw new Error(`[aellux.js] Cannot attach the "${extensionName}" extension: root.AelluxJs is not defined. Load the aellux.js boot script before this extension.`);
        }
        const NO_PREFERENCE = "no-preference";
        const userPreferences = /* @__PURE__ */ Object.create(null);
        const defaultPreferences = /* @__PURE__ */ Object.create(null);
        const computedPreferences = /* @__PURE__ */ Object.create(null);
        const containersByPreference = /* @__PURE__ */ new Map();
        const containerPreferences = /* @__PURE__ */ new Map();
        const containerLabels = /* @__PURE__ */ new Map();
        const labelMemories = /* @__PURE__ */ new WeakMap();
        AelluxJs2.extAttach(extensionName, { init, destroy, update, get, set });
        const attr = {
          preference: AelluxJs2.attr("preference"),
          option: AelluxJs2.attr("option"),
          label: AelluxJs2.attr("label"),
          next: AelluxJs2.attr("next"),
          prev: AelluxJs2.attr("prev"),
          ready: AelluxJs2.attr("ready")
        };
        const className = {
          active: AelluxJs2.className("active")
        };
        const prefOptions = {
          colorScheme: ["auto", "light", "dark"],
          contrast: ["auto", NO_PREFERENCE, "more", "less"],
          reducedMotion: ["auto", NO_PREFERENCE, "reduced"],
          reducedTransparency: ["auto", NO_PREFERENCE, "reduced"],
          forcedColors: ["auto", NO_PREFERENCE, "active"],
          textScale: [1, 1.5, 0.8],
          interfaceScale: [1, 1.5, 0.8],
          extendedTiming: ["off", "on"],
          largeTargets: ["off", "on"],
          haptics: ["on", "off"],
          sound: ["off", "on", "low"]
        };
        function init(options) {
          AelluxJs2.mountManager.add({
            extensionName,
            selector: `[${attr.preference}]`,
            priority: 0,
            mount: mountPreferenceContainer,
            unmount: unmountPreferenceContainer
          });
          AelluxJs2.onEvent(window, "$storage", storageEvent);
          const allQueries = AelluxJs2.registry.preferenceMediaQueries;
          Object.values(allQueries).forEach(
            (queries) => Object.values(queries).forEach(
              (query) => {
                if (!query) return;
                if (query.addEventListener) {
                  AelluxJs2.onEvent(query, "$change", update);
                } else if (query.addListener) {
                  query.addListener(update);
                }
              }
            )
          );
          Object.entries(prefOptions).forEach(([param, options2]) => {
            defaultPreferences[param] = options2[0];
          });
          loadUserPreferences();
          update();
        }
        function destroy() {
          for (const container of containerPreferences.keys()) unmountPreferenceContainer(container);
          AelluxJs2.mountManager.remove({ extensionName });
          containersByPreference.clear();
          containerPreferences.clear();
          AelluxJs2.offEvent(window, "$storage", storageEvent);
          AelluxJs2.off("$DOMContentLoaded", update);
          const allQueries = AelluxJs2.registry.preferenceMediaQueries;
          Object.values(allQueries).forEach(
            (queries) => Object.values(queries).forEach(
              (query) => {
                if (!query) return;
                if (query.removeEventListener) {
                  AelluxJs2.offEvent(query, "$change", update);
                } else if (query.removeListener) {
                  query.removeListener(update);
                }
              }
            )
          );
        }
        function get(preference) {
          const key = toCamelCase2(preference);
          return computedPreferences[key];
        }
        function set(preference, value) {
          const key = toCamelCase2(preference);
          if (userPreferences[key] === value) return;
          userPreferences[key] = value;
          saveUserPreferences();
        }
        function storageEvent(event) {
          if (event.key !== "AelluxJsPreferences") return;
          const newPreferences = new URLSearchParams(event.newValue || "");
          Object.keys(userPreferences).forEach((key) => delete userPreferences[key]);
          newPreferences.forEach((value, key) => {
            userPreferences[key] = value;
          });
          update();
        }
        function update() {
          const nextPreferences = Object.assign(/* @__PURE__ */ Object.create(null), defaultPreferences, userPreferences);
          const changed = /* @__PURE__ */ new Set();
          for (const key in computedPreferences) {
            if (!(key in nextPreferences)) {
              delete computedPreferences[key];
              changed.add(key);
            }
          }
          for (const key in nextPreferences) {
            if (computedPreferences[key] !== nextPreferences[key]) changed.add(key);
            computedPreferences[key] = nextPreferences[key];
          }
          AelluxJs2.updatePreferenceAttributesHTML(computedPreferences);
          for (const container of containerPreferences.keys()) {
            if (indexContainer(container)) updateContainer(container);
          }
          for (const key of changed) {
            const containers = containersByPreference.get(key);
            if (containers) for (const container of containers) updateContainer(container);
          }
          AelluxJs2.dispatch("PreferencesChange", {
            detail: {
              changed: Array.from(changed),
              preferences: Object.assign({}, computedPreferences)
            }
          });
        }
        function indexContainer(container) {
          const key = toCamelCase2(container.getAttribute(attr.preference) || "");
          const previous = containerPreferences.get(container);
          if (previous === key) return false;
          if (previous !== void 0) {
            const containers2 = containersByPreference.get(previous);
            containers2.delete(container);
            if (!containers2.size) containersByPreference.delete(previous);
          }
          let containers = containersByPreference.get(key);
          if (!containers) {
            containers = /* @__PURE__ */ new Set();
            containersByPreference.set(key, containers);
          }
          containers.add(container);
          containerPreferences.set(container, key);
          return true;
        }
        function updateContainer(container) {
          const preference = container.getAttribute(attr.preference);
          const elements = container.querySelectorAll(`[${attr.option}]`);
          const labels = container.querySelectorAll(`[${attr.label}]`);
          const currentValue = get(preference || "");
          labels.forEach((label) => {
            let ownedLabels = containerLabels.get(container);
            if (!ownedLabels) {
              ownedLabels = /* @__PURE__ */ new Set();
              containerLabels.set(container, ownedLabels);
            }
            if (!ownedLabels.has(label)) {
              labelMemories.set(label, AelluxJs2.persist.element.save(label, ["hidden"], []));
              ownedLabels.add(label);
            }
            const value = label.getAttribute(attr.label);
            const selected = String(value) === String(currentValue);
            label.hidden = !selected;
          });
          elements.forEach((element) => {
            const value = element.getAttribute(attr.option);
            const selected = value === currentValue;
            element.classList.toggle(className.active, selected);
            const labelFor = element.getAttribute("for");
            if (labelFor) {
              const forTarget = document.getElementById(labelFor);
              if (forTarget) {
                if ("value" in forTarget) forTarget.value = value;
                if ("checked" in forTarget) forTarget.checked = selected;
              }
            }
          });
        }
        function saveUserPreferences() {
          AelluxJs2.persist.preferences.setObject(userPreferences);
        }
        function loadUserPreferences() {
          Object.assign(userPreferences, AelluxJs2.persist.preferences.getObject());
        }
        function mountPreferenceContainer(container) {
          indexContainer(container);
          updateContainer(container);
          AelluxJs2.onEvent(container, "$click", onContainerClick);
        }
        function unmountPreferenceContainer(container) {
          var _a;
          AelluxJs2.offEvent(container, "$click", onContainerClick);
          const labels = containerLabels.get(container);
          if (labels) for (const label of labels) {
            (_a = labelMemories.get(label)) == null ? void 0 : _a.restore();
            labelMemories.delete(label);
          }
          containerLabels.delete(container);
          const key = containerPreferences.get(container);
          if (key === void 0) return;
          const containers = containersByPreference.get(key);
          containers.delete(container);
          if (!containers.size) containersByPreference.delete(key);
          containerPreferences.delete(container);
        }
        function onContainerClick(event) {
          const container = event.currentTarget;
          if (!event.target) return;
          const optionButton = event.target.closest(`[${attr.option}]`);
          const buttonNext = event.target.closest(`[${attr.next}]`);
          const buttonPrev = event.target.closest(`[${attr.prev}]`);
          if (optionButton) {
            const preference = container.getAttribute(attr.preference);
            const value = optionButton.getAttribute(attr.option);
            set(preference, value);
            update();
          } else if (buttonNext || buttonPrev) {
            const preference = container.getAttribute(attr.preference);
            const key = toCamelCase2(preference);
            const options = prefOptions[key];
            if (!options || options.length === 0) return;
            const change = buttonNext ? 1 : -1;
            const currentValue = get(key);
            const currentIndex = options.findIndex(
              (option) => String(option) === String(currentValue)
            );
            const nextIndex = currentIndex < 0 ? buttonNext ? 0 : options.length - 1 : (currentIndex + change + options.length) % options.length;
            set(preference, options[nextIndex]);
            update();
          }
        }
      })(typeof globalThis !== "undefined" ? globalThis : window);
    }
  });

  // src/aellux.ext.state-navigation.js
  var aellux_ext_state_navigation_exports = {};
  var init_aellux_ext_state_navigation = __esm({
    "src/aellux.ext.state-navigation.js"() {
      init_define_AELLUX_OFFICIAL_EXTENSION_MANIFEST();
      /*! aellux.js | SPDX-License-Identifier: Apache-2.0 | See LICENSE for terms. */
      (function(root2) {
        "use strict";
        const AelluxJs2 = root2.AelluxJs;
        const extensionName = "state-navigation";
        if (!AelluxJs2) {
          throw new Error(`[aellux.js] Cannot attach the "${extensionName}" extension: root.AelluxJs is not defined. Load the aellux.js boot script before this extension.`);
        }
        const PUSH_AJAX_REPLACE = "PushAjaxReplace", UPDATE_BASE_TITLE = "UpdateBaseTitle";
        const globalSnapshot = {};
        AelluxJs2.extAttach(extensionName, {
          init,
          destroy,
          updateBaseTitle,
          setState,
          globalSnapshot
        });
        const globalRemoveSnapshot = {};
        let globalSnapshotString = "";
        let skipHashChange = null;
        let baseTitle = "";
        let useHash = true;
        function init(options) {
          AelluxJs2.onEvent(window, "$popstate", onPopState);
          AelluxJs2.onEvent(window, "$hashchange", onHashChange);
          AelluxJs2.on("PushState", OnPushState);
          AelluxJs2.on(PUSH_AJAX_REPLACE, OnPushAjaxReplace);
          AelluxJs2.on(UPDATE_BASE_TITLE, OnUpdateBaseTitle);
          if ("useHash" in AelluxJs2.options)
            useHash = AelluxJs2.options.useHash;
          baseTitle = document.title;
          onHashChange();
          history.replaceState(mergeHistoryState({
            aelluxJsState: true,
            snapshot: Object.assign({}, globalSnapshot)
          }), "");
        }
        async function destroy() {
          AelluxJs2.offEvent(window, "$popstate", onPopState);
          AelluxJs2.offEvent(window, "$hashchange", onHashChange);
          AelluxJs2.off("PushState", OnPushState);
          AelluxJs2.off(PUSH_AJAX_REPLACE, OnPushAjaxReplace);
          AelluxJs2.off(UPDATE_BASE_TITLE, OnUpdateBaseTitle);
        }
        function updateBaseTitle(title = null) {
          baseTitle = title != null ? title : baseTitle;
          document.title = globalSnapshot.title || false ? `${globalSnapshot.title} - ${baseTitle}` : baseTitle;
        }
        function setState(key, value, title = void 0, silent = false) {
          return change(key, value, title, silent);
        }
        async function change(key, value, title = void 0, silent = false) {
          if (globalSnapshot.title === title && globalSnapshot[key] === value) return;
          if (title) globalSnapshot.title = title.replace(/\s+/g, " ");
          else delete globalSnapshot.title;
          globalSnapshot[key] = value;
          updateSnapshotData(snapshotToString(globalSnapshot));
          const state = { aelluxJsState: true, snapshot: Object.assign({}, globalSnapshot) };
          const url = useHash ? `#${globalSnapshotString}` : void 0;
          if (silent) history.replaceState(mergeHistoryState(state), "", url);
          else history.pushState(state, "", url);
          dispatchSnapshotEvent("SnapshotChange");
        }
        function updateSnapshotData(string = "") {
          globalSnapshotString = string;
          for (const key in globalRemoveSnapshot) {
            delete globalRemoveSnapshot[key];
          }
          Object.assign(globalRemoveSnapshot, globalSnapshot);
          for (const key in globalSnapshot) {
            delete globalSnapshot[key];
          }
          new URLSearchParams(string).forEach((value, key) => globalSnapshot[key] = value);
          for (const key in globalRemoveSnapshot) {
            if (key in globalSnapshot) {
              delete globalRemoveSnapshot[key];
            }
          }
        }
        function snapshotToString(snapshot) {
          return new URLSearchParams(snapshot || {}).toString();
        }
        function dispatchSnapshotEvent(name, popState = void 0) {
          updateBaseTitle();
          const options = {
            detail: {
              snapshot: Object.assign({}, globalSnapshot),
              removeSnapshot: Object.assign({}, globalRemoveSnapshot),
              popState: copyHistoryState(popState)
            },
            bubbles: true
          };
          AelluxJs2.dispatch(name, options);
        }
        function copyHistoryState(state) {
          if (!state || typeof state !== "object") return state;
          if (typeof root2.structuredClone === "function") return root2.structuredClone(state);
          const copy = Array.isArray(state) ? state.slice() : Object.assign({}, state);
          if (state.snapshot && typeof state.snapshot === "object")
            copy.snapshot = Object.assign({}, state.snapshot);
          if (state.ajaxReplace && typeof state.ajaxReplace === "object") {
            copy.ajaxReplace = Object.assign({}, state.ajaxReplace);
            if (Array.isArray(state.ajaxReplace.selectors))
              copy.ajaxReplace.selectors = state.ajaxReplace.selectors.slice();
          }
          return copy;
        }
        function onHashChange() {
          if (!useHash) return;
          if (skipHashChange === window.location.hash) {
            skipHashChange = null;
            return;
          }
          updateSnapshotData(window.location.hash.substring(1));
          dispatchSnapshotEvent("SnapshotRestore");
        }
        function onPopState(event) {
          const popState = event.state;
          if (!popState || !popState.aelluxJsState) return;
          if (popState.snapshot)
            updateSnapshotData(snapshotToString(popState.snapshot));
          else if (useHash)
            updateSnapshotData(window.location.hash.substring(1));
          else
            updateSnapshotData();
          dispatchSnapshotEvent("SnapshotRestore", popState);
          if (!useHash) return;
          skipHashChange = window.location.hash;
          setTimeout(function() {
            if (skipHashChange === window.location.hash)
              skipHashChange = null;
          }, 0);
        }
        function ajaxReplace(url, selectors) {
          const currentState = {
            aelluxJsState: true,
            snapshot: globalSnapshot,
            ajaxReplace: { url: window.location.href, selectors }
          }, targetState = {
            aelluxJsState: true,
            snapshot: null,
            ajaxReplace: { url, selectors }
          };
          history.replaceState(mergeHistoryState(currentState), "", window.location.href);
          updateSnapshotData();
          history.pushState(targetState, "", url);
        }
        function mergeHistoryState(state) {
          const currentState = history.state;
          if (!currentState || typeof currentState !== "object" || Array.isArray(currentState))
            return state;
          return Object.assign({}, currentState, state);
        }
        function OnPushState(event) {
          try {
            const detail = event && event.detail;
            if (!detail || typeof detail !== "object" || typeof detail.key !== "string" || !detail.key.trim() || typeof detail.value !== "string" || !detail.value.trim() || detail.title !== void 0 && typeof detail.title !== "string") {
              AelluxJs2.diagnostics.warn(AelluxJs2.diagnostics.WARN_NAVIGATION_EVENT_INVALID, {
                extension: extensionName,
                event: "PushState",
                expected: "detail: { key: non-empty string, value: non-empty string, title?: string }"
              });
              return;
            }
            setState(detail.key, detail.value, detail.title);
          } catch (cause) {
            AelluxJs2.diagnostics.error(AelluxJs2.diagnostics.ERROR_CALLBACK, {
              extension: extensionName,
              event: "PushState",
              cause
            });
          }
        }
        function OnPushAjaxReplace(event) {
          try {
            const detail = event && event.detail;
            if (!detail || typeof detail !== "object" || typeof detail.url !== "string" || !detail.url.trim() || !Object.prototype.hasOwnProperty.call(detail, "selectors") || detail.selectors == null) {
              AelluxJs2.diagnostics.warn(AelluxJs2.diagnostics.WARN_NAVIGATION_EVENT_INVALID, {
                extension: extensionName,
                event: PUSH_AJAX_REPLACE,
                expected: "detail: { url: non-empty string, selectors: value }"
              });
              return;
            }
            ajaxReplace(detail.url, detail.selectors);
          } catch (cause) {
            AelluxJs2.diagnostics.error(AelluxJs2.diagnostics.ERROR_CALLBACK, {
              extension: extensionName,
              event: PUSH_AJAX_REPLACE,
              cause
            });
          }
        }
        function OnUpdateBaseTitle(event) {
          try {
            const detail = event && event.detail;
            if (!detail || typeof detail !== "object" || !Object.prototype.hasOwnProperty.call(detail, "title") || typeof detail.title !== "string") {
              AelluxJs2.diagnostics.warn(AelluxJs2.diagnostics.WARN_NAVIGATION_EVENT_INVALID, {
                extension: extensionName,
                event: UPDATE_BASE_TITLE,
                expected: "detail: { title: string }"
              });
              return;
            }
            updateBaseTitle(detail.title);
          } catch (cause) {
            AelluxJs2.diagnostics.error(AelluxJs2.diagnostics.ERROR_CALLBACK, {
              extension: extensionName,
              event: UPDATE_BASE_TITLE,
              cause
            });
          }
        }
      })(typeof globalThis !== "undefined" ? globalThis : window);
    }
  });

  // src/aellux.ext.feedback.js
  var aellux_ext_feedback_exports = {};
  var init_aellux_ext_feedback = __esm({
    "src/aellux.ext.feedback.js"() {
      init_define_AELLUX_OFFICIAL_EXTENSION_MANIFEST();
      /*! aellux.js | SPDX-License-Identifier: Apache-2.0 | See LICENSE for terms. */
      (function(root2) {
        "use strict";
        const AelluxJs2 = root2.AelluxJs;
        const extensionName = "feedback";
        if (!AelluxJs2) {
          throw new Error(`[aellux.js] Cannot attach the "${extensionName}" extension: root.AelluxJs is not defined. Load the aellux.js boot script before this extension.`);
        }
        AelluxJs2.extAttach(extensionName, {
          init,
          destroy,
          warning,
          error,
          success,
          announce,
          busy,
          validate,
          progress,
          on,
          off,
          send
        });
        const motionOptions = ["shake", "yes", "no", "breathe", "tremble", "pulse", "alert"];
        const feedbackTypes = ["warning", "error", "success", "announce", "busy", "progress", "validate"];
        const handlers = /* @__PURE__ */ new Map();
        const motionOperations = /* @__PURE__ */ new Map();
        const motionIds = /* @__PURE__ */ new WeakMap();
        const feedbackAttribute = AelluxJs2.attr(extensionName);
        const targetMessageAttribute = AelluxJs2.attr("targetMessage");
        const targetTransformAttribute = AelluxJs2.attr("targetTransform");
        function init() {
          AelluxJs2.mountManager.add({
            extensionName,
            selector: `[${feedbackAttribute}]`,
            priority: 0,
            mount: mountFeedback,
            unmount: unmountFeedback
          });
        }
        async function destroy() {
          AelluxJs2.mountManager.remove({ extensionName });
          for (const operation of motionOperations.values()) AelluxJs2.motion.cancel(operation.id);
          motionOperations.clear();
          handlers.clear();
        }
        function mountFeedback(element) {
          AelluxJs2.onEvent(element, "Feedback", onFeedback);
        }
        function unmountFeedback(element) {
          AelluxJs2.offEvent(element, "Feedback", onFeedback);
        }
        function onFeedback(event) {
          const element = event.currentTarget;
          const value = element.getAttribute(feedbackAttribute);
          if (value === null) return;
          const list = value.trim();
          if (list) {
            const type2 = event.detail && event.detail.type;
            const names = list.split(/\s+/);
            if (!names.includes(type2)) {
              return;
            }
          }
          event.stopPropagation();
          if (!event.detail) return;
          const { message, type, motion } = event.detail;
          const messageTarget = element.getAttribute(targetMessageAttribute);
          const transformTarget = element.getAttribute(targetTransformAttribute);
          const messageElement = AelluxJs2.elementOrId(messageTarget, { defaultElement: element });
          const transformElement = AelluxJs2.elementOrId(transformTarget, { defaultElement: element });
          if (messageElement && typeof message === "string") {
            let textNode = null;
            for (const child of messageElement.childNodes) {
              if (child.nodeType === 3) {
                textNode = child;
                break;
              }
            }
            if (textNode) textNode.nodeValue = message;
            else messageElement.appendChild(messageElement.ownerDocument.createTextNode(message));
          }
          if (feedbackTypes.includes(type)) {
            const typeClass = AelluxJs2.className(`feedback-${type}`);
            for (const target of [element, messageElement, transformElement]) {
              if (target) target.classList.add(typeClass);
            }
          }
          if (transformElement) {
            const motionPrefix = AelluxJs2.className("feedback-motion-");
            for (const className of Array.from(transformElement.classList)) {
              if (className.startsWith(motionPrefix)) transformElement.classList.remove(className);
            }
            const previous = motionOperations.get(transformElement);
            if (previous) AelluxJs2.motion.cancel(previous.id);
            motionOperations.delete(transformElement);
            if (typeof motion === "string") {
              const motionClass = AelluxJs2.className(`feedback-motion-${motion}`);
              let id = motionIds.get(transformElement);
              if (id === void 0) {
                id = AelluxJs2.motion.id();
                motionIds.set(transformElement, id);
              }
              const operation = { id, className: motionClass };
              motionOperations.set(transformElement, operation);
              const advancedEase = root2.getComputedStyle(transformElement).getPropertyValue("--ae-feedback-aellux-ease").trim() || void 0;
              AelluxJs2.motion.run(transformElement, {
                extension: extensionName,
                id,
                apply: () => transformElement.classList.add(motionClass),
                easing: advancedEase,
                abort: () => !transformElement.isConnected
              }).catch((cause) => {
                AelluxJs2.diagnostics.error(
                  AelluxJs2.diagnostics.ERROR_EXTENSION_TRANSITION,
                  { cause, extension: extensionName, element: transformElement }
                );
              }).finally(() => {
                if (motionOperations.get(transformElement) !== operation) return;
                transformElement.classList.remove(motionClass);
                motionOperations.delete(transformElement);
              });
            }
          }
        }
        function on(type, handler) {
          if (!handlers.has(type)) {
            handlers.set(type, /* @__PURE__ */ new Set());
          }
          handlers.get(type).add(handler);
          return { off() {
            removeHandler(type, handler);
          } };
        }
        function off(type, handler) {
          return removeHandler(type, handler);
        }
        function warning(message, target, value, motion) {
          send({ type: "warning", message, value, target, motion });
        }
        function error(message, target, value, motion) {
          send({ type: "error", message, value, target, motion });
        }
        function success(message, target, value, motion) {
          send({ type: "success", message, value, target, motion });
        }
        function announce(message, target, value, motion) {
          send({ type: "announce", message, value, target, motion });
        }
        function busy(message, target, value, motion) {
          send({ type: "busy", message, value, target, motion });
        }
        function validate(message, target, value, motion) {
          send({ type: "validate", message, value, target, motion });
        }
        function progress(message, target, value, motion) {
          send({ type: "progress", message, value, target, motion });
        }
        function send({ type, message, value, target, motion }) {
          if (typeof message !== "string") {
            reportInvalidArgument("message", message);
            return;
          }
          if (!feedbackTypes.includes(type)) {
            reportInvalidArgument("type", type);
            return;
          }
          if (typeof motion !== "undefined" && typeof motion !== "string") {
            reportInvalidArgument("motion", motion);
            return;
          }
          if (typeof target === "undefined") target = root2.document;
          else if (!target || target.nodeType !== 1 || typeof target.dispatchEvent !== "function") {
            reportInvalidArgument("target", target);
            return;
          }
          if (typeof motion === "string" && !motionOptions.includes(motion)) {
            AelluxJs2.diagnostics.info(AelluxJs2.diagnostics.INFO_FEEDBACK_MOTION_CUSTOM, {
              extension: extensionName,
              motion,
              standardMotions: motionOptions.slice()
            });
          }
          const feedback = { type, message, value, target, motion };
          const options = {
            detail: feedback,
            bubbles: true,
            cancelable: true
          };
          AelluxJs2.dispatchFrom(target, "Feedback", options);
          notifyHandlers(type, feedback);
          notifyHandlers("*", feedback);
        }
        function reportInvalidArgument(argument, value) {
          AelluxJs2.diagnostics.error(AelluxJs2.diagnostics.ERROR_FEEDBACK_ARGUMENT, {
            extension: extensionName,
            argument,
            value
          });
        }
        function notifyHandlers(type, feedback) {
          if (!handlers.has(type)) return;
          handlers.get(type).forEach((call) => {
            try {
              const result = call(feedback);
              if (result && typeof result.then === "function") {
                Promise.resolve(result).catch((error2) => reportCallbackError(error2, type));
              }
            } catch (error2) {
              reportCallbackError(error2, type);
            }
          });
        }
        function reportCallbackError(error2, type) {
          AelluxJs2.diagnostics.error(AelluxJs2.diagnostics.ERROR_CALLBACK, {
            cause: error2,
            extension: extensionName,
            type
          });
        }
        function removeHandler(type, handler) {
          const typeHandlers = handlers.get(type);
          if (!typeHandlers) return false;
          const removed = typeHandlers.delete(handler);
          if (typeHandlers.size === 0) handlers.delete(type);
          return removed;
        }
      })(typeof globalThis !== "undefined" ? globalThis : window);
    }
  });

  // src/aellux.ext.focus.js
  var aellux_ext_focus_exports = {};
  var init_aellux_ext_focus = __esm({
    "src/aellux.ext.focus.js"() {
      init_define_AELLUX_OFFICIAL_EXTENSION_MANIFEST();
      /*! aellux.js | SPDX-License-Identifier: Apache-2.0 | See LICENSE for terms. */
      (function(root2) {
        "use strict";
        const AelluxJs2 = root2.AelluxJs;
        const extensionName = "focus";
        if (!AelluxJs2) {
          throw new Error(`[aellux.js] Cannot attach the "${extensionName}" extension: root.AelluxJs is not defined. Load the aellux.js boot script before this extension.`);
        }
        AelluxJs2.extAttach(extensionName, {
          init,
          destroy,
          restoreLastFocus
        });
        const attribute = AelluxJs2.attr(extensionName);
        const snapshotKey = "ae-focus";
        const entries = [];
        const hintMemories = /* @__PURE__ */ new WeakMap();
        const nextElements = /* @__PURE__ */ new WeakSet();
        const textEntrySelector = "input:not([type]), input[type=text], input[type=search], input[type=email], input[type=url], input[type=tel], input[type=password], input[type=number], textarea, [contenteditable]:not([contenteditable=false])";
        const focusableSelector = "a[href], area[href], button, input, select, textarea, [tabindex], [contenteditable]:not([contenteditable=false])";
        let current = null, restoring = false;
        function init() {
          AelluxJs2.mountManager.add({
            extensionName,
            selector: `[${attribute}]`,
            priority: 0,
            mount: mountFocusElement,
            unmount: unmountFocusElement
          });
          AelluxJs2.on("$focusin", onFocusIn, true);
          AelluxJs2.on("$focus", onFocusChange, true);
          AelluxJs2.on("$blur", onBlur, true);
          AelluxJs2.onEvent(root2, "$focus", onWindowFocus);
          AelluxJs2.onEvent(root2, "$blur", onWindowBlur);
          AelluxJs2.on("SnapshotRestore", onSnapshotRestore);
          AelluxJs2.on("UnpopFocusLost", onUnpopFocusLost);
          remember(document.activeElement, false);
        }
        function destroy() {
          AelluxJs2.off("$focusin", onFocusIn, true);
          AelluxJs2.off("$focus", onFocusChange, true);
          AelluxJs2.off("$blur", onBlur, true);
          AelluxJs2.offEvent(root2, "$focus", onWindowFocus);
          AelluxJs2.offEvent(root2, "$blur", onWindowBlur);
          AelluxJs2.off("SnapshotRestore", onSnapshotRestore);
          AelluxJs2.off("UnpopFocusLost", onUnpopFocusLost);
          AelluxJs2.mountManager.remove({ extensionName });
          entries.length = 0;
          current = null;
        }
        function mountFocusElement(element) {
          const type = element.getAttribute(attribute);
          switch (type) {
            case "next":
              AelluxJs2.onEvent(element, "$keydown", onNextKeyDown);
              nextElements.add(element);
              if (!element.hasAttribute("enterkeyhint") && element.matches(textEntrySelector)) {
                hintMemories.set(element, AelluxJs2.persist.element.save(element, ["enterkeyhint"], []));
                element.setAttribute("enterkeyhint", "next");
              }
              break;
          }
        }
        function unmountFocusElement(element) {
          var _a;
          if (nextElements.delete(element)) AelluxJs2.offEvent(element, "$keydown", onNextKeyDown);
          (_a = hintMemories.get(element)) == null ? void 0 : _a.restore();
          hintMemories.delete(element);
        }
        function onNextKeyDown(event) {
          if (event.key !== "Enter" || event.isComposing || event.repeat || event.defaultPrevented || event.target !== event.currentTarget && event.target.closest(focusableSelector) !== event.currentTarget) return;
          const elements = document.querySelectorAll(focusableSelector);
          let foundCurrent = false;
          for (const element of elements) {
            if (element === event.currentTarget) {
              foundCurrent = true;
            } else if (foundCurrent && element.tabIndex >= 0 && isValid(element)) {
              event.preventDefault();
              element.focus();
              return;
            }
          }
        }
        function isValid(element) {
          if (!element || element === document.body || element === document.documentElement || !element.isConnected || typeof element.focus !== "function" || element.matches(":disabled, [hidden], [inert]")) return false;
          for (let node = element; node && node.nodeType === 1; node = node.parentElement) {
            if (node.hidden || node.hasAttribute("inert")) return false;
            const style = root2.getComputedStyle(node);
            if (style.display === "none" || style.visibility === "hidden" || style.visibility === "collapse") return false;
          }
          return element.getClientRects().length > 0;
        }
        function remember(element, push) {
          if (!isValid(element) || current && current.element === element) return;
          const entry = { element };
          entries.push(entry);
          if (entries.length > 100) entries.shift();
          current = entry;
          if (!push || !stateNavigationEligible(element) || !element.id || !element.id.trim()) return;
          AelluxJs2.dispatch("PushState", {
            detail: { key: snapshotKey, value: element.id }
          });
        }
        function stateNavigationEligible(element) {
          if (element.hasAttribute(attribute)) return true;
          const name = element.tagName && element.tagName.toLowerCase();
          if (name === "textarea" || name === "select") return true;
          if (name === "input") return String(element.type || "text").toLowerCase() !== "hidden";
          return element.isContentEditable || element.hasAttribute("contenteditable") && element.getAttribute("contenteditable") !== "false";
        }
        function onFocusIn(event) {
          if (!restoring) remember(event.target, true);
        }
        function onFocusChange(event) {
          if (!restoring) remember(event.target, true);
        }
        function onBlur(event) {
          if (!restoring) remember(event.target, false);
        }
        function onWindowFocus() {
          if (!restoring) remember(document.activeElement, true);
        }
        function onWindowBlur() {
          if (!restoring) remember(document.activeElement, false);
        }
        function restore(entry) {
          if (!entry || !isValid(entry.element)) return false;
          restoring = true;
          try {
            entry.element.focus();
          } finally {
            restoring = false;
          }
          if (document.activeElement !== entry.element) return false;
          current = entry;
          return true;
        }
        function restoreLastFocus() {
          const index = entries.indexOf(current);
          const start = (index < 0 ? entries.length : index) - 1;
          for (let i = start; i >= 0; i--) {
            if (restore(entries[i])) return true;
          }
          return false;
        }
        function onUnpopFocusLost() {
          restoreLastFocus();
        }
        function onSnapshotRestore(event) {
          const snapshot = event.detail && event.detail.snapshot;
          if (!snapshot || !Object.prototype.hasOwnProperty.call(snapshot, snapshotKey)) return;
          const target = document.getElementById(snapshot[snapshotKey]);
          if (target && stateNavigationEligible(target)) {
            for (let i = entries.length - 1; i >= 0; i--) {
              if (entries[i].element === target) {
                if (!restore(entries[i])) restoreLastFocus();
                return;
              }
            }
            if (restore({ element: target })) return;
          }
          restoreLastFocus();
        }
      })(typeof globalThis !== "undefined" ? globalThis : window);
    }
  });

  // src/aellux.ext.point.js
  var aellux_ext_point_exports = {};
  var init_aellux_ext_point = __esm({
    "src/aellux.ext.point.js"() {
      init_define_AELLUX_OFFICIAL_EXTENSION_MANIFEST();
      /*! aellux.js | SPDX-License-Identifier: Apache-2.0 | See LICENSE for terms. */
      (function(root2) {
        "use strict";
        const AelluxJs2 = root2.AelluxJs;
        const extensionName = "point";
        if (!AelluxJs2) {
          throw new Error(`[aellux.js] Cannot attach the "${extensionName}" extension: root.AelluxJs is not defined. Load the aellux.js boot script before this extension.`);
        }
        const POINTER = "pointer";
        const trackedPointers = /* @__PURE__ */ new Map();
        const pointableElements = /* @__PURE__ */ new Set();
        const pointableAttribute = AelluxJs2.attr("point");
        const pointableSelector = `[${pointableAttribute}]`;
        const pointerEvents = [
          ["down", onPointerDown],
          ["move", onPointerMove],
          ["up", onPointerUp],
          ["cancel", onPointerCancel],
          ["over", onPointerOver],
          ["out", onPointerOut]
        ];
        AelluxJs2.extAttach(extensionName, {
          init,
          destroy,
          pointers
        });
        function init() {
          AelluxJs2.mountManager.add({
            extensionName,
            selector: pointableSelector,
            priority: 0,
            mount: mountPointable,
            unmount: unmountPointable,
            controllers: ["pointers"]
          });
          for (const [suffix, handler] of pointerEvents)
            AelluxJs2.on(`$${POINTER}${suffix}`, handler, true);
        }
        function destroy() {
          AelluxJs2.mountManager.remove({ extensionName });
          for (const [suffix, handler] of pointerEvents)
            AelluxJs2.off(`$${POINTER}${suffix}`, handler, true);
          trackedPointers.clear();
          pointableElements.clear();
        }
        function mountPointable(element) {
          pointableElements.add(element);
        }
        function unmountPointable(element) {
          pointableElements.delete(element);
          for (const pointer of trackedPointers.values()) {
            if (pointer.target === element) pointer.target = null;
            if (pointer.pressStart === element) pointer.pressStart = null;
          }
        }
        function pointers(element) {
          const result = [];
          for (const pointer of trackedPointers.values()) {
            if (pointer.target === element) result.push(pointer);
          }
          return result;
        }
        function limitFor(element) {
          const value = element.getAttribute(pointableAttribute);
          if (value === null || !value.trim()) return 1;
          const trimmed = value.trim();
          const limit = Number(trimmed);
          return /^\d+$/.test(trimmed) && Number.isSafeInteger(limit) ? limit : 1;
        }
        function targetFor(target, pointer) {
          let element = target && target.nodeType === 1 ? target : target && target.parentElement;
          while (element) {
            if (pointableElements.has(element) && element.hasAttribute(pointableAttribute)) {
              let occupied = 0;
              for (const other of trackedPointers.values()) {
                if (other !== pointer && other.target === element) occupied++;
              }
              if (occupied < limitFor(element)) return element;
            }
            element = element.parentElement;
          }
          return null;
        }
        function dispatchPointer(name, pointer, originalEvent, recipient, hover, target = pointer.target, pressStart = pointer.pressStart) {
          if (!recipient) return;
          AelluxJs2.dispatchFrom(recipient, name, {
            bubbles: false,
            detail: {
              pointer,
              target,
              pressStart,
              originalEvent,
              hover
            }
          });
        }
        function dispatchToTarget(name, pointer, originalEvent) {
          if (!pointer.target) return;
          pointer.beforeDispatch();
          dispatchPointer(name, pointer, originalEvent, pointer.target);
        }
        function dispatchRelease(name, pointer, originalEvent) {
          const target = pointer.target;
          const pressStart = pointer.pressStart;
          if (!target && !pressStart) return;
          pointer.beforeDispatch();
          dispatchPointer(name, pointer, originalEvent, target, void 0, target, pressStart);
          if (pressStart !== target)
            dispatchPointer(name, pointer, originalEvent, pressStart, void 0, target, pressStart);
        }
        function updateHoverTarget(pointer, event, nextTarget) {
          const previousTarget = pointer.target;
          if (previousTarget === nextTarget) return;
          if (previousTarget || nextTarget) pointer.beforeDispatch();
          dispatchPointer("PointerHover", pointer, event, previousTarget, false);
          pointer.target = nextTarget;
          dispatchPointer("PointerHover", pointer, event, nextTarget, true);
        }
        function canHover(event) {
          return event.pointerType === "mouse" || event.pointerType === "pen";
        }
        function addPointer(event, pressed, hover) {
          const pointer = new AePointer(event, pressed, hover);
          trackedPointers.set(event.pointerId, pointer);
          return pointer;
        }
        function onPointerDown(event) {
          const pointer = trackedPointers.get(event.pointerId) || addPointer(event, true, canHover(event));
          pointer.initial.x = event.clientX;
          pointer.initial.y = event.clientY;
          pointer.pointerType = event.pointerType;
          pointer.pressed = true;
          pointer.startPress();
          pointer.hover = canHover(event);
          pointer.update(event);
          pointer.target = targetFor(event.target, pointer);
          pointer.pressStart = pointer.target;
          dispatchToTarget("PointerDown", pointer, event);
        }
        function onPointerMove(event) {
          let pointer = trackedPointers.get(event.pointerId);
          if (!pointer) {
            if (!canHover(event)) return;
            pointer = addPointer(event, false, true);
          }
          pointer.update(event);
          pointer.target = targetFor(event.target, pointer);
          dispatchToTarget("PointerMove", pointer, event);
        }
        function onPointerUp(event) {
          const pointer = trackedPointers.get(event.pointerId);
          if (!pointer) return;
          pointer.update(event);
          pointer.pressed = false;
          pointer.endPress();
          pointer.target = targetFor(event.target, pointer);
          dispatchRelease("PointerUp", pointer, event);
          if (!pointer.hover) trackedPointers.delete(event.pointerId);
        }
        function onPointerCancel(event) {
          const pointer = trackedPointers.get(event.pointerId);
          if (pointer) {
            pointer.update(event);
            pointer.pressed = false;
            pointer.endPress();
            pointer.target = targetFor(event.target, pointer);
            dispatchRelease("PointerCancel", pointer, event);
          }
          trackedPointers.delete(event.pointerId);
        }
        function onPointerOver(event) {
          if (!canHover(event)) return;
          const pointer = trackedPointers.get(event.pointerId) || addPointer(event, false, true);
          pointer.update(event);
          pointer.hover = true;
          updateHoverTarget(pointer, event, targetFor(event.target, pointer));
        }
        function onPointerOut(event) {
          const pointer = trackedPointers.get(event.pointerId);
          if (!pointer) return;
          const relatedTarget = event.relatedTarget;
          pointer.update(event);
          updateHoverTarget(pointer, event, targetFor(relatedTarget, pointer));
          if (!relatedTarget || !relatedTarget.nodeType || !document.contains(relatedTarget)) {
            pointer.hover = false;
            pointer.target = null;
          }
          if (!pointer.pressed && !pointer.hover) trackedPointers.delete(event.pointerId);
        }
        class AePointer {
          constructor(event, pressed, hover) {
            const x = event.clientX;
            const y = event.clientY;
            this.pointerId = event.pointerId;
            this.pointerType = event.pointerType;
            this.initial = { x, y };
            this.current = { x, y };
            this.delta = { x: 0, y: 0 };
            this.movement = { x: 0, y: 0 };
            this.lastDispatched = { x, y };
            this.time = { pressStart: null, pressEnd: null };
            this.buttons = event.buttons;
            this.pressed = pressed;
            this.hover = hover;
            this.target = null;
            this.pressStart = null;
          }
          get deltaTime() {
            var _a;
            if (this.time.pressStart === null) return 0;
            return ((_a = this.time.pressEnd) != null ? _a : root2.performance.now()) - this.time.pressStart;
          }
          startPress() {
            this.time.pressStart = root2.performance.now();
            this.time.pressEnd = null;
          }
          endPress() {
            if (this.time.pressStart !== null && this.time.pressEnd === null)
              this.time.pressEnd = root2.performance.now();
          }
          update(event) {
            this.current.x = event.clientX;
            this.current.y = event.clientY;
            this.delta.x = this.current.x - this.initial.x;
            this.delta.y = this.current.y - this.initial.y;
            this.buttons = event.buttons;
          }
          beforeDispatch() {
            this.movement.x = this.current.x - this.lastDispatched.x;
            this.movement.y = this.current.y - this.lastDispatched.y;
            this.lastDispatched.x = this.current.x;
            this.lastDispatched.y = this.current.y;
          }
        }
      })(typeof globalThis !== "undefined" ? globalThis : window);
    }
  });

  // src/aellux.ext.anchor.js
  var aellux_ext_anchor_exports = {};
  var init_aellux_ext_anchor = __esm({
    "src/aellux.ext.anchor.js"() {
      init_define_AELLUX_OFFICIAL_EXTENSION_MANIFEST();
      /*! aellux.js | SPDX-License-Identifier: Apache-2.0 | See LICENSE for terms. */
      (function(root2) {
        "use strict";
        const AelluxJs2 = root2.AelluxJs;
        const extensionName = "anchor";
        if (!AelluxJs2) {
          throw new Error(`[aellux.js] Cannot attach the "${extensionName}" extension: root.AelluxJs is not defined. Load the aellux.js boot script before this extension.`);
        }
        const ORIGIN_X = "--ae-anchor-origin-x", ORIGIN_Y = "--ae-anchor-origin-y", ANCHOR_OPACITY = "--anchor-opacity";
        const attribute = AelluxJs2.attr(extensionName);
        const presentAttribute = AelluxJs2.attr("present");
        const targetAttribute = AelluxJs2.attr("anchor-target");
        const matchAttribute = AelluxJs2.attr("anchor-match");
        const groupAttribute = AelluxJs2.attr("present-group");
        const layoutEvent = AelluxJs2.eventName("Layout");
        const anchoredClass = AelluxJs2.className("anchored");
        const switchingClass = AelluxJs2.className("anchor-switching");
        const baseProperties = ["position", "left", "top", "transform", "transform-origin"];
        const ownedProperties = [
          ...baseProperties,
          "--ae-anchor-x",
          "--ae-anchor-y",
          ORIGIN_X,
          ORIGIN_Y,
          ANCHOR_OPACITY,
          "--ae-anchor-target-width",
          "--ae-anchor-target-height",
          "--ae-anchor-pivot-x",
          "--ae-anchor-pivot-y"
        ];
        const pivots = {
          "top-left": [0, 0],
          "top-center": [0.5, 0],
          "top-right": [1, 0],
          "center-left": [0, 0.5],
          center: [0.5, 0.5],
          "center-right": [1, 0.5],
          "bottom-left": [0, 1],
          "bottom-center": [0.5, 1],
          "bottom-right": [1, 1]
        };
        const anchors = /* @__PURE__ */ new Map();
        const elementMemories = /* @__PURE__ */ new WeakMap();
        const placementMaps = /* @__PURE__ */ new Set();
        let nextLayoutId = 2e6;
        let mutations = null;
        AelluxJs2.extAttach(extensionName, { init, destroy, createPlacementMap });
        function init() {
          AelluxJs2.registerCssProperty(
            { name: "--ae-anchor-x", syntax: "<length>", initialValue: "0px" },
            { name: "--ae-anchor-y", syntax: "<length>", initialValue: "0px" },
            { name: "--ae-anchor-target-width", syntax: "<length>", initialValue: "0px" },
            { name: "--ae-anchor-target-height", syntax: "<length>", initialValue: "0px" },
            { name: "--ae-anchor-switch-duration", syntax: "<time>", initialValue: "0ms" },
            { name: ORIGIN_X, syntax: "<percentage>", initialValue: "50%" },
            { name: ORIGIN_Y, syntax: "<percentage>", initialValue: "0%" },
            { name: ANCHOR_OPACITY, syntax: "<number>", initialValue: "1" }
          );
          AelluxJs2.mountManager.add({
            extensionName,
            selector: `[${attribute}]`,
            priority: 0,
            mount: mountAnchor,
            unmount: unmountAnchor,
            update: (element) => updateAnchor(element, true)
          });
        }
        async function destroy() {
          for (const map of placementMaps) map.destroy();
          await Promise.all(Array.from(anchors.keys(), unmountAnchor));
          AelluxJs2.mountManager.remove({ extensionName });
        }
        function createPlacementMap() {
          const memories = /* @__PURE__ */ new Map();
          let disposed = false;
          const map = {
            mount(element) {
              if (!disposed && !memories.has(element))
                memories.set(element, AelluxJs2.persist.element.save(element, ["class"], ownedProperties));
            },
            unmount(element) {
              var _a;
              (_a = memories.get(element)) == null ? void 0 : _a.restore();
              memories.delete(element);
            },
            measure(element, pairs, target = element.parentElement) {
              const candidates = parseCandidates(pairs);
              if (memories.has(element) && candidates.length) return readPlacement(element, target, candidates, true);
              return null;
            },
            place(element, placement) {
              if (memories.has(element) && (placement == null ? void 0 : placement.valid)) writePlacement(element, placement);
            },
            invisible: isInvisible,
            destroy() {
              disposed = true;
              for (const element of memories.keys()) map.unmount(element);
              placementMaps.delete(map);
            }
          };
          placementMaps.add(map);
          return map;
        }
        function mountAnchor(element) {
          if (anchors.has(element)) return;
          elementMemories.set(element, AelluxJs2.persist.element.save(element, [], ownedProperties));
          const state = {
            invalidContext: false,
            active: false,
            revision: 0,
            target: null,
            resolvedTarget: null,
            reference: null,
            group: null,
            lastPlacement: null,
            switchTimer: null,
            interruptSwitch: false,
            layoutId: nextLayoutId++,
            styleLayoutId: nextLayoutId++,
            layoutUntil: 0,
            layoutSingle: false,
            layoutFinalPending: false,
            layoutPolling: false,
            updatePending: false,
            updateDirty: false,
            repeatPending: false,
            lastUpdateAt: -Infinity,
            updateTimer: null,
            updateTimerDue: false,
            layoutListener: (event) => scheduleLayoutUpdate(event),
            observer: null,
            intersectionObserver: null
          };
          anchors.set(element, state);
          if (element.offsetParent) listenForLayout(state, element.offsetParent);
          if (anchors.size === 1) {
            AelluxJs2.onEvent(root2, "$scroll", scheduleUpdate, { capture: true, passive: true });
            AelluxJs2.onEvent(root2, "$resize", scheduleUpdate);
            AelluxJs2.on("PresentGroupChange", onGroupChange);
            if (typeof root2.MutationObserver === "function") {
              mutations = new root2.MutationObserver(onMutations);
              mutations.observe(document, {
                subtree: true,
                childList: true,
                attributes: true,
                attributeFilter: [
                  attribute,
                  targetAttribute,
                  matchAttribute,
                  groupAttribute,
                  AelluxJs2.attr("reduced-motion"),
                  "id",
                  "hidden",
                  "class",
                  "style"
                ]
              });
            }
          }
          if (typeof root2.ResizeObserver === "function") {
            state.observer = new root2.ResizeObserver((entries) => {
              if (state.switchTimer !== null && entries.every((entry) => entry.target === element)) return;
              scheduleAnchor(element);
            });
          }
          if (typeof root2.IntersectionObserver === "function") {
            state.intersectionObserver = new root2.IntersectionObserver(() => scheduleAnchor(element));
          }
          return updateAnchor(element);
        }
        async function unmountAnchor(element) {
          const state = anchors.get(element);
          if (!state) return;
          const memory = elementMemories.get(element);
          elementMemories.delete(element);
          state.revision++;
          stopSwitch(element, state);
          if (state.reference) AelluxJs2.offEvent(state.reference, layoutEvent, state.layoutListener);
          if (state.observer) state.observer.disconnect();
          if (state.intersectionObserver) state.intersectionObserver.disconnect();
          if (state.updateTimer !== null) root2.clearTimeout(state.updateTimer);
          anchors.delete(element);
          if (!anchors.size) {
            AelluxJs2.offEvent(root2, "$scroll", scheduleUpdate, true);
            AelluxJs2.offEvent(root2, "$resize", scheduleUpdate);
            AelluxJs2.off("PresentGroupChange", onGroupChange);
            if (mutations) mutations.disconnect();
            mutations = null;
          }
          AelluxJs2.waitLayout.cancel(state.layoutId);
          AelluxJs2.waitLayout.cancel(state.styleLayoutId);
          await AelluxJs2.waitLayout.update(state.styleLayoutId, deactivate, [element, state, memory]);
        }
        function scheduleUpdate() {
          if (!anchors.size) return;
          for (const [element, state] of anchors) {
            state.interruptSwitch = true;
            scheduleAnchor(element);
          }
        }
        function onGroupChange(event) {
          var _a;
          for (const [element, state] of anchors)
            if (state.group === ((_a = event.detail) == null ? void 0 : _a.group)) scheduleAnchor(element);
        }
        function onMutations(records) {
          var _a;
          const affected = /* @__PURE__ */ new Set();
          for (const record of records) {
            const node = record.target;
            const structural = record.type === "childList";
            const visual = record.attributeName === "class" || record.attributeName === "style";
            for (const [element, state] of anchors) {
              if (visual) {
                if (node !== element && (state.resolvedTarget && node.contains(state.resolvedTarget) || state.group && node.contains(state.group) || targetChanged(element, state))) affected.add(element);
                continue;
              }
              if (node === element || node === document.documentElement || node.contains(element) || state.resolvedTarget && node.contains(state.resolvedTarget) || state.group && node.contains(state.group) || structural && ((_a = state.reference) == null ? void 0 : _a.contains(node)) || targetChanged(element, state)) affected.add(element);
            }
          }
          for (const element of affected) scheduleAnchor(element);
        }
        function targetChanged(element, state) {
          const value = element.getAttribute(targetAttribute);
          return value && value.trim() && resolveElement(value) !== (state.group || state.resolvedTarget);
        }
        function associationDiagnostic(element, reason) {
          AelluxJs2.diagnostics.warn(
            AelluxJs2.diagnostics.WARN_ANCHOR_GROUP,
            {
              extension: extensionName,
              element,
              reason,
              attribute: targetAttribute,
              value: element.getAttribute(targetAttribute),
              suggestion: "Reference an element or Present Group without circular targets, share a positioning reference, and keep dimension-matched Anchors out of normal flow."
            }
          );
        }
        function effectiveTarget(element, state) {
          var _a, _b;
          const value = element.getAttribute(targetAttribute);
          const target = value && value.trim() ? resolveElement(value) : element.offsetParent;
          state.group = value && value.trim() && (target == null ? void 0 : target.hasAttribute(groupAttribute)) ? target : null;
          return state.group ? ((_b = (_a = AelluxJs2.ext.present) == null ? void 0 : _a.selected) == null ? void 0 : _b.call(_a, state.group)) || null : target;
        }
        function circularTarget(element, target) {
          const visited = /* @__PURE__ */ new Set([element]);
          while (target) {
            if (visited.has(target)) return true;
            visited.add(target);
            const state = anchors.get(target);
            if (!state) return false;
            target = effectiveTarget(target, state);
          }
          return false;
        }
        function scheduleLayoutUpdate(event) {
          const durationMs = Number(event && event.detail ? event.detail.durationMs : NaN);
          if (!Number.isFinite(durationMs) || durationMs < 0) {
            scheduleUpdate();
            return;
          }
          if (durationMs === 0) {
            for (const [element, state] of anchors) {
              const maxFPS = AelluxJs2.layoutMaxFPS(element);
              state.layoutUntil = now() + 1e3 / (maxFPS || 60);
              state.layoutSingle = true;
              state.layoutFinalPending = true;
              scheduleAnchor(element, true);
            }
            return;
          }
          for (const [element, state] of anchors) {
            state.layoutUntil = Math.max(state.layoutUntil, now() + durationMs);
            state.layoutSingle = false;
            state.layoutFinalPending = true;
            scheduleAnchor(element, durationMs > 0);
          }
        }
        function scheduleAnchor(element, repeat = false) {
          const state = anchors.get(element);
          if (!state) return;
          if (state.updatePending) {
            state.updateDirty = true;
            state.repeatPending = state.repeatPending || repeat;
            return;
          }
          const maxFPS = AelluxJs2.layoutMaxFPS(element);
          if (maxFPS && !repeat && !state.updateTimerDue) {
            if (state.updateTimer === null) {
              state.updateTimer = root2.setTimeout(() => {
                state.updateTimer = null;
                state.updateTimerDue = true;
                scheduleAnchor(element);
              }, 1e3 / maxFPS);
            }
            return;
          }
          state.updateTimerDue = false;
          const due = maxFPS ? state.lastUpdateAt + 1e3 / maxFPS : -Infinity;
          if (due > now()) {
            if (state.updateTimer === null) {
              state.updateTimer = root2.setTimeout(() => {
                state.updateTimer = null;
                scheduleAnchor(element, repeat);
              }, Math.max(0, due - now()));
            }
            return;
          }
          if (state.layoutPolling) {
            state.updateDirty = true;
            return;
          }
          const run = () => {
            if (state.layoutSingle && now() < state.layoutUntil) return;
            state.layoutSingle = false;
            if (repeat && now() >= state.layoutUntil) state.layoutFinalPending = false;
            requestAnchorUpdate(element, state);
          };
          if (repeat) state.layoutPolling = true;
          const sequence = AelluxJs2.waitLayout.sequence(state.layoutId, {
            update: run,
            repeat: repeat ? { ms: 0 } : void 0,
            maxFPS,
            abort: () => !anchors.has(element) || repeat && now() >= state.layoutUntil && !state.layoutSingle && !state.layoutFinalPending
          });
          if (repeat) sequence.finally(() => {
            if (anchors.get(element) !== state) return;
            state.layoutPolling = false;
            if (state.updateDirty) scheduleAnchor(element);
          });
        }
        function requestAnchorUpdate(element, state) {
          if (state.updatePending) {
            state.updateDirty = true;
            return;
          }
          state.updatePending = true;
          state.updateDirty = false;
          updateAnchor(element).catch((cause) => {
            AelluxJs2.diagnostics.error(
              AelluxJs2.diagnostics.ERROR_EXTENSION_MOUNT,
              { cause, extension: extensionName, element, method: "update" }
            );
          }).finally(() => {
            if (anchors.get(element) !== state) return;
            state.updatePending = false;
            if (state.updateDirty && !state.layoutPolling) {
              const repeat = state.repeatPending;
              state.repeatPending = false;
              scheduleAnchor(element, repeat);
            }
          });
        }
        function now() {
          return root2.performance && typeof root2.performance.now === "function" ? root2.performance.now() : Date.now();
        }
        async function updateAnchor(element, ensureLatest = false) {
          const state = anchors.get(element);
          if (!state) return;
          const revision = ++state.revision;
          const current = () => anchors.get(element) === state && state.revision === revision;
          const retry = () => ensureLatest && anchors.get(element) === state ? updateAnchor(element, true) : void 0;
          const target = effectiveTarget(element, state);
          state.resolvedTarget = target;
          const candidates = parseCandidates(element.getAttribute(attribute));
          if (!target || !target.isConnected || !candidates.length || circularTarget(element, target)) {
            if (target && circularTarget(element, target))
              associationDiagnostic(element, "Circular target reference.");
            await AelluxJs2.waitLayout.update(state.styleLayoutId, () => {
              if (current()) deactivate(element, state);
            });
            if (!current()) return retry();
            return;
          }
          let placement = await AelluxJs2.waitLayout.read(
            state.styleLayoutId,
            () => current() ? readPlacement(element, target, candidates, state.active) : null
          );
          if (!current()) return retry();
          if (!placement) return;
          if (placement.hidden) {
            await AelluxJs2.waitLayout.update(state.styleLayoutId, () => {
              if (current()) hideForTarget(element, state, placement);
            });
            if (!current()) return retry();
            return;
          }
          if (!placement.valid) {
            await AelluxJs2.waitLayout.update(state.styleLayoutId, () => {
              if (current()) invalidContext(element, state, placement);
            });
            if (!current()) return retry();
            return;
          }
          if (!state.active) {
            await AelluxJs2.waitLayout.update(state.styleLayoutId, () => {
              if (!current()) return;
              state.active = true;
              if (state.lastPlacement) writePlacement(element, state.lastPlacement);
            });
            if (!current()) return retry();
            placement = await AelluxJs2.waitLayout.read(
              state.styleLayoutId,
              () => current() ? readPlacement(element, target, candidates, true) : null
            );
            if (!current()) return retry();
            if (!placement) return;
            if (placement.hidden) {
              await AelluxJs2.waitLayout.update(state.styleLayoutId, () => {
                if (current()) hideForTarget(element, state, placement);
              });
              if (!current()) return retry();
              return;
            }
            if (!placement.valid) {
              await AelluxJs2.waitLayout.update(state.styleLayoutId, () => {
                if (current()) invalidContext(element, state, placement);
              });
              if (!current()) return retry();
              return;
            }
          }
          let applied = false;
          await AelluxJs2.waitLayout.update(state.styleLayoutId, () => {
            if (!current()) return;
            state.invalidContext = false;
            observe(state, element, placement.target, placement.reference);
            const previous = state.lastPlacement;
            const switching = previous && previous.target !== placement.target;
            const moved = !previous || previous.signature !== placement.signature;
            if (switching && placement.duration > 0 && !state.interruptSwitch) {
              startSwitch(element, state, placement.duration);
            } else if (moved || state.interruptSwitch || !placement.duration) stopSwitch(element, state);
            state.interruptSwitch = false;
            writePlacement(element, placement);
            state.lastUpdateAt = now();
            state.lastPlacement = placement;
            applied = true;
          });
          if (!applied && anchors.get(element) === state) return updateAnchor(element, ensureLatest);
        }
        function readPlacement(element, target, candidates, measure) {
          const reference = element.offsetParent;
          target = target || reference;
          if (target && isInvisible(target)) return { hidden: true, target, reference };
          if (!reference || target !== reference && target.offsetParent !== reference) {
            return { valid: false, target, reference };
          }
          const style = root2.getComputedStyle(element);
          const tokens = (element.getAttribute(matchAttribute) || "").trim().split(/\s+/).filter(Boolean);
          if (element.hasAttribute(matchAttribute) && (!tokens.length || tokens.some((token) => token !== "width" && token !== "height")))
            AelluxJs2.diagnostics.warn(
              AelluxJs2.diagnostics.WARN_ANCHOR_MATCH,
              { extension: extensionName, element, value: element.getAttribute(matchAttribute) }
            );
          if ((tokens.includes("width") || tokens.includes("height")) && style.position !== "absolute" && style.position !== "fixed") {
            associationDiagnostic(element, "Dimension matching requires an out-of-flow Anchor.");
            return { hidden: true, target, reference };
          }
          if (!measure) return { valid: true, target };
          const referenceRect = reference.getBoundingClientRect();
          const scaleX = reference.offsetWidth ? referenceRect.width / reference.offsetWidth : 1;
          const scaleY = reference.offsetHeight ? referenceRect.height / reference.offsetHeight : 1;
          const targetRect = toReference(target.getBoundingClientRect(), reference, referenceRect, scaleX, scaleY);
          const selfRect = element.getBoundingClientRect();
          const projectSize = (axis, actual, desired) => {
            var _a;
            if (!tokens.includes(axis) || element.style[axis]) return actual;
            const previous = parseFloat(element.style.getPropertyValue(`--ae-anchor-target-${axis}`)) || 0;
            const sides = axis === "width" ? ["Left", "Right"] : ["Top", "Bottom"];
            const extra = sides.reduce((sum, side) => sum + (parseFloat(style[`padding${side}`]) || 0) + (parseFloat(style[`border${side}Width`]) || 0), 0);
            const borderBox = style.boxSizing === "border-box";
            const minimum = Math.max(borderBox ? extra : 0, parseFloat(style.getPropertyValue(`min-${axis}`)) || 0);
            const maximum = parseFloat(style.getPropertyValue(`max-${axis}`));
            const constrain = (value) => Math.max(minimum, Math.min(Number.isFinite(maximum) ? maximum : Infinity, value));
            return !((_a = anchors.get(element)) == null ? void 0 : _a.switchTimer) && Math.abs(parseFloat(style[axis]) - constrain(previous)) > 0.5 ? actual : constrain(desired) + (borderBox ? 0 : extra);
          };
          const selfWidth = projectSize("width", selfRect.width / scaleX, targetRect.width);
          const selfHeight = projectSize("height", selfRect.height / scaleY, targetRect.height);
          const boundaryRect = toReference(
            { left: 0, top: 0, width: root2.innerWidth, height: root2.innerHeight },
            reference,
            referenceRect,
            scaleX,
            scaleY
          );
          let selected = null;
          for (const candidate of candidates) {
            const x = targetRect.left + targetRect.width * candidate.target[0] - selfWidth * candidate.self[0];
            const y = targetRect.top + targetRect.height * candidate.target[1] - selfHeight * candidate.self[1];
            const result = {
              x,
              y,
              self: candidate.self,
              pivotX: targetRect.left + targetRect.width * candidate.target[0],
              pivotY: targetRect.top + targetRect.height * candidate.target[1]
            };
            if (!selected) selected = result;
            if (x >= boundaryRect.left && y >= boundaryRect.top && x + selfWidth <= boundaryRect.left + boundaryRect.width && y + selfHeight <= boundaryRect.top + boundaryRect.height) {
              selected = result;
              break;
            }
          }
          const present = target.closest(`[${presentAttribute}]`);
          const opacity = present ? root2.getComputedStyle(present).opacity : "1";
          const rawDuration = style.getPropertyValue("--ae-anchor-switch-duration").trim();
          const duration = AelluxJs2.currentPreference("reduced-motion") === "reduced" ? 0 : Math.max(0, (parseFloat(rawDuration) || 0) * (rawDuration.endsWith("ms") ? 1 : 1e3));
          return {
            valid: true,
            target,
            reference,
            selected,
            opacity,
            duration,
            width: targetRect.width,
            height: targetRect.height,
            signature: [selected.x, selected.y, targetRect.width, targetRect.height, ...selected.self].join("/")
          };
        }
        function writePlacement(element, placement) {
          const selected = placement.selected;
          const style = element.style;
          setValue(style, "--ae-anchor-x", `${selected.x}px`);
          setValue(style, "--ae-anchor-y", `${selected.y}px`);
          setValue(style, ORIGIN_X, `${selected.self[0] * 100}%`);
          setValue(style, ORIGIN_Y, `${selected.self[1] * 100}%`);
          setValue(style, ANCHOR_OPACITY, placement.opacity);
          setValue(style, "--ae-anchor-target-width", `${placement.width}px`);
          setValue(style, "--ae-anchor-target-height", `${placement.height}px`);
          setValue(style, "--ae-anchor-pivot-x", `${selected.pivotX}px`);
          setValue(style, "--ae-anchor-pivot-y", `${selected.pivotY}px`);
          element.classList.add(anchoredClass);
        }
        function isInvisible(element) {
          const visibility = root2.getComputedStyle(element).visibility;
          if (visibility === "hidden" || visibility === "collapse") return true;
          for (let current = element; current && current.nodeType === 1; current = current.parentElement) {
            const style = root2.getComputedStyle(current);
            if (style.display === "none" || style.contentVisibility === "hidden" || Number(style.opacity) === 0) return true;
          }
          return false;
        }
        function hideForTarget(element, state, placement) {
          var _a;
          const previous = state.group && ((_a = state.lastPlacement) == null ? void 0 : _a.target) !== placement.target ? state.lastPlacement : null;
          deactivate(element, state);
          state.lastPlacement = previous;
          state.invalidContext = false;
          if (placement.reference) listenForLayout(state, placement.reference);
        }
        function invalidContext(element, state, placement) {
          deactivate(element, state);
          if (placement.reference)
            listenForLayout(state, placement.reference);
          if (state.invalidContext) return;
          AelluxJs2.diagnostics.error(
            AelluxJs2.diagnostics.ERROR_ANCHOR_REFERENCE_CONTEXT,
            {
              extension: extensionName,
              element,
              target: placement.target,
              attribute: targetAttribute,
              value: element.getAttribute(targetAttribute),
              reason: "Anchor and target use incompatible positioning references.",
              suggestion: "Place both elements in the same containing block, or use that block as the target."
            }
          );
          state.invalidContext = true;
        }
        function observe(state, element, target, reference) {
          if (state.target === target && state.reference === reference) return;
          listenForLayout(state, reference);
          state.target = target;
          if (state.observer) state.observer.disconnect();
          if (state.intersectionObserver) state.intersectionObserver.disconnect();
          for (const observed of /* @__PURE__ */ new Set([element, target, reference])) {
            if (!observed) continue;
            if (state.observer) state.observer.observe(observed);
            if (state.intersectionObserver) state.intersectionObserver.observe(observed);
          }
        }
        function listenForLayout(state, reference) {
          if (state.reference === reference) return;
          if (state.reference) AelluxJs2.offEvent(state.reference, layoutEvent, state.layoutListener);
          state.reference = reference;
          if (reference) AelluxJs2.onEvent(reference, layoutEvent, state.layoutListener);
        }
        function deactivate(element, state, memory = elementMemories.get(element)) {
          stopSwitch(element, state);
          if (state.reference) AelluxJs2.offEvent(state.reference, layoutEvent, state.layoutListener);
          if (state.observer) state.observer.disconnect();
          if (state.intersectionObserver) state.intersectionObserver.disconnect();
          state.target = state.reference = null;
          element.classList.remove(anchoredClass);
          if (state.active && memory) memory.restore();
          state.active = false;
          state.lastPlacement = null;
        }
        function stopSwitch(element, state) {
          if (state.switchTimer !== null) root2.clearTimeout(state.switchTimer);
          state.switchTimer = null;
          element.classList.remove(switchingClass);
        }
        function setValue(style, name, value) {
          if (style.getPropertyValue(name) === value && !style.getPropertyPriority(name)) return;
          if (style.getPropertyPriority(name)) style.removeProperty(name);
          style.setProperty(name, value);
        }
        function startSwitch(element, state, duration) {
          if (state.switchTimer !== null) root2.clearTimeout(state.switchTimer);
          element.classList.add(switchingClass);
          state.switchTimer = root2.setTimeout(() => {
            if (anchors.get(element) !== state) return;
            stopSwitch(element, state);
            scheduleAnchor(element);
          }, duration + 100);
        }
        function resolveElement(value) {
          if (!value || !value.trim()) return null;
          const selector = value.trim();
          const id = selector[0] === "#" ? selector.slice(1) : selector;
          const byId = document.getElementById(id);
          if (byId) return byId;
          try {
            return document.querySelector(selector);
          } catch (_) {
            return null;
          }
        }
        function parseCandidates(value) {
          const result = [];
          for (const token of (value || "").split(",")) {
            const pair = token.trim().toLowerCase().split(":");
            if (pair.length !== 2 || !pivots[pair[0].trim()] || !pivots[pair[1].trim()]) continue;
            result.push({ target: pivots[pair[0].trim()], self: pivots[pair[1].trim()] });
          }
          return result;
        }
        function toReference(rect, reference, referenceRect, scaleX, scaleY) {
          return {
            left: (rect.left - referenceRect.left) / scaleX - reference.clientLeft + reference.scrollLeft,
            top: (rect.top - referenceRect.top) / scaleY - reference.clientTop + reference.scrollTop,
            width: rect.width / scaleX,
            height: rect.height / scaleY
          };
        }
      })(typeof globalThis !== "undefined" ? globalThis : window);
    }
  });

  // src/aellux.ext.ajax-href.js
  var aellux_ext_ajax_href_exports = {};
  var init_aellux_ext_ajax_href = __esm({
    "src/aellux.ext.ajax-href.js"() {
      init_define_AELLUX_OFFICIAL_EXTENSION_MANIFEST();
      init_validate_html_source();
      /*! aellux.js | SPDX-License-Identifier: Apache-2.0 | See LICENSE for terms. */
      (function(root2) {
        "use strict";
        const AelluxJs2 = root2.AelluxJs;
        const extensionName = "ajax-href";
        if (!AelluxJs2) {
          throw new Error(`[aellux.js] Cannot attach the "${extensionName}" extension: root.AelluxJs is not defined. Load the aellux.js boot script before this extension.`);
        }
        AelluxJs2.extAttach(extensionName, { init, destroy, load });
        const attr = {
          ajaxHref: AelluxJs2.attr(extensionName)
        };
        function init() {
          document.addEventListener("click", onClick);
          AelluxJs2.on("SnapshotRestore", OnSnapshotRestoreAjax);
        }
        function destroy() {
          document.removeEventListener("click", onClick);
          AelluxJs2.off("SnapshotRestore", OnSnapshotRestoreAjax);
          if (previousController) {
            previousController.abort();
          }
          previousController = null;
        }
        let previousController = null;
        async function load(url, selectors, options = {}) {
          options = options || {};
          const selectorList = parseSelectors(selectors);
          if (!selectorList) return null;
          const elements = /* @__PURE__ */ new Map();
          for (const selector of selectorList) {
            const currentElement = document.querySelector(selector);
            if (currentElement) elements.set(selector, currentElement);
            else selectorDiagnostic(selector, "No current element matches the selector.");
          }
          if (!elements.size) return null;
          if (previousController) {
            previousController.abort();
          }
          const controller = "AbortController" in window ? new AbortController() : { signal: null, abort: () => null };
          previousController = controller;
          elements.forEach(function(currentElement) {
            if (AelluxJs2.ext.feedback) {
              AelluxJs2.ext.feedback.busy("Ajax loading", currentElement, true);
              AelluxJs2.ext.feedback.progress("Ajax loading", currentElement, 0);
            }
          });
          AelluxJs2.dispatch("AjaxHrefStart", { detail: { url, selectors } });
          try {
            const response = await AelluxJs2.request(url, { signal: controller.signal });
            const html = await response.text();
            if (previousController !== controller) return null;
            validateHTMLSource(AelluxJs2, html, response.url || String(url));
            const loadedDocument = new DOMParser().parseFromString(html, "text/html");
            let historyRequested = false;
            for (const selector of selectorList) {
              if (previousController !== controller) return null;
              const currentElement = elements.get(selector);
              if (!currentElement) continue;
              const loadedElement = loadedDocument.querySelector(selector);
              if (!loadedElement || await AelluxJs2.unmount(currentElement) === false) {
                if (!loadedElement)
                  selectorDiagnostic(selector, "No response element matches the selector.", currentElement);
                if (AelluxJs2.ext.feedback) {
                  AelluxJs2.ext.feedback.busy("Ajax loading", currentElement, false);
                  AelluxJs2.ext.feedback.progress("Ajax loading", currentElement, 1);
                }
                continue;
              }
              const replacement = document.importNode(loadedElement, true);
              if (previousController !== controller) return null;
              if (!historyRequested && !options.ignoreHistory) {
                AelluxJs2.dispatch("PushAjaxReplace", { detail: { url, selectors } });
                historyRequested = true;
              }
              currentElement.parentNode.replaceChild(replacement, currentElement);
              if (selector === "title") {
                AelluxJs2.dispatch("UpdateBaseTitle", {
                  detail: { title: replacement.textContent }
                });
              }
              await AelluxJs2.mount(replacement);
              if (AelluxJs2.ext.feedback) {
                AelluxJs2.ext.feedback.busy("Ajax loaded", replacement, false);
                AelluxJs2.ext.feedback.progress("Ajax loaded", replacement, 1);
              }
            }
            AelluxJs2.dispatch("AjaxHrefLoaded");
          } catch (error) {
            selectorList.forEach(function(selector) {
              const currentElement = elements.get(selector);
              if (!currentElement) return;
              if (AelluxJs2.ext.feedback) {
                AelluxJs2.ext.feedback.busy("Ajax loading", currentElement, false);
                AelluxJs2.ext.feedback.progress("Ajax loading", currentElement, 1);
              }
            });
            AelluxJs2.dispatch("AjaxHrefError");
            if (error.name === "AbortError") return null;
            throw error;
          } finally {
            if (previousController === controller)
              previousController = null;
            AelluxJs2.dispatch("AjaxHrefComplete");
          }
        }
        function selectorDiagnostic(value, reason, element = null) {
          AelluxJs2.diagnostics.warn(AelluxJs2.diagnostics.WARN_CONFIGURATION_TARGET, {
            extension: extensionName,
            element,
            attribute: attr.ajaxHref,
            value,
            reason,
            suggestion: "Use valid CSS selectors identifying content in both the current document and the AJAX response."
          });
        }
        function parseSelectors(selectors) {
          const list = [];
          for (const input of Array.isArray(selectors) ? selectors : [selectors]) {
            if (typeof input !== "string" || !input.trim()) {
              selectorDiagnostic(input, "Expected a nonempty selector string or array of strings.");
              return null;
            }
            let start = 0, depth = 0, quote = null;
            for (let index = 0; index <= input.length; index++) {
              const char = input[index];
              if (char === "\\") {
                index++;
                continue;
              }
              if (quote) {
                if (char === quote) quote = null;
                continue;
              }
              if (char === '"' || char === "'") {
                quote = char;
                continue;
              }
              if (char === "(" || char === "[") depth++;
              if (char === ")" || char === "]") depth--;
              if (index === input.length || char === "," && depth === 0) {
                const selector = input.slice(start, index).trim();
                try {
                  if (!selector) throw new SyntaxError("Empty selector");
                  document.querySelector(selector);
                } catch (_) {
                  selectorDiagnostic(input, "Invalid CSS selector.");
                  return null;
                }
                if (!list.includes(selector)) list.push(selector);
                start = index + 1;
              }
            }
            if (quote || depth !== 0) {
              selectorDiagnostic(input, "Unbalanced CSS selector.");
              return null;
            }
          }
          if (!list.length) {
            selectorDiagnostic(selectors, "Expected at least one CSS selector.");
            return null;
          }
          return list;
        }
        function onClick(event) {
          if (event.defaultPrevented) return;
          if (event.button !== 0) return;
          if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
          const target = event.target && event.target.nodeType === 1 ? event.target : event.target && event.target.parentElement;
          const link = target && target.closest(`a[${attr.ajaxHref}]`);
          if (!link || !link.href || link.tagName !== "A") return;
          const rawHref = link.getAttribute("href");
          if (link.target && link.target !== "_self") return;
          if (rawHref && rawHref.startsWith("#")) return;
          if (link.hasAttribute("download") || link.hasAttribute("data-no-ajax")) return;
          const selectors = link.getAttribute(attr.ajaxHref);
          if (!selectors) return;
          const destinyUrl = comparableUrl(link.href);
          const currentUrl = comparableUrl(window.location.href);
          if (destinyUrl.origin !== currentUrl.origin) {
            AelluxJs2.dispatch("AjaxHrefDropOrigin");
            return;
          }
          if (destinyUrl.href === currentUrl.href) {
            if (destinyUrl.hash && destinyUrl.hash !== currentUrl.hash) return;
            event.preventDefault();
            AelluxJs2.dispatch("AjaxHrefStart");
            AelluxJs2.dispatch("AjaxHrefLoaded");
            AelluxJs2.dispatch("AjaxHrefComplete");
            return;
          }
          event.preventDefault();
          load(link.href, selectors);
        }
        function OnSnapshotRestoreAjax(event) {
          if (!event.detail || !event.detail.popState) return;
          const state = event.detail.popState;
          if (state.ajaxReplace) {
            const url = state.ajaxReplace.url;
            const selectors = state.ajaxReplace.selectors;
            load(url, selectors, { ignoreHistory: true });
          }
        }
        function comparableUrl(value) {
          const url = new URL(value, window.location.href);
          return {
            origin: url.origin,
            href: `${url.origin}${url.pathname}${url.search}`,
            hash: url.hash
          };
        }
      })(typeof globalThis !== "undefined" ? globalThis : window);
    }
  });

  // src/aellux.ext.adaptive.js
  var aellux_ext_adaptive_exports = {};
  var init_aellux_ext_adaptive = __esm({
    "src/aellux.ext.adaptive.js"() {
      init_define_AELLUX_OFFICIAL_EXTENSION_MANIFEST();
      /*! aellux.js | SPDX-License-Identifier: Apache-2.0 | See LICENSE for terms. */
      (function(root2) {
        "use strict";
        const AelluxJs2 = root2.AelluxJs;
        const extensionName = "adaptive";
        if (!AelluxJs2) {
          throw new Error(`[aellux.js] Cannot attach the "${extensionName}" extension: root.AelluxJs is not defined. Load the aellux.js boot script before this extension.`);
        }
        const attr = {
          adaptive: AelluxJs2.attr(extensionName)
        };
        const modifier = {
          shapeHorizontal: AelluxJs2.className("shape-horizontal"),
          shapeVertical: AelluxJs2.className("shape-vertical"),
          shapeSquare: AelluxJs2.className("shape-square")
        };
        const adaptiveElements = /* @__PURE__ */ new Set();
        const elementMemories = /* @__PURE__ */ new WeakMap();
        const dimensionProperties = ["--ae-width", "--ae-height"];
        const pendingResizeEntries = /* @__PURE__ */ new Map();
        const pendingResizeElements = /* @__PURE__ */ new Set();
        const layoutIds = /* @__PURE__ */ new WeakMap();
        const orientationLayoutIds = /* @__PURE__ */ new WeakMap();
        let nextLayoutId = 1e6;
        const adaptiveParams = {
          experienceScale: { near: 1, far: 1.5 },
          ratioShapes: { vertical: 0.8, horizontal: 1.25 },
          minSizes: {
            compact: 0,
            small: 480,
            medium: 768,
            large: 1024,
            xl: 1280,
            xxl: 1600
          }
        };
        const ariaHandlers = /* @__PURE__ */ new WeakMap();
        let managedClasses;
        let sizeThresholds = [];
        const resizeObserver = typeof root2.ResizeObserver === "function" ? new root2.ResizeObserver(onResize) : null;
        AelluxJs2.extAttach(extensionName, { init, destroy, adaptiveParams });
        function init(options = {}) {
          AelluxJs2.registerCssProperty(
            { name: "--ae-width", syntax: "<number>", initialValue: "0" },
            { name: "--ae-height", syntax: "<number>", initialValue: "0" }
          );
          let overrides = options.adaptiveParams === void 0 ? {} : options.adaptiveParams;
          if (!overrides || typeof overrides !== "object" || Array.isArray(overrides)) {
            parameterDiagnostic("", overrides, "Expected an object of Adaptive parameter groups; using defaults.");
            overrides = {};
          }
          for (const group of Object.keys(adaptiveParams)) {
            if (group in overrides && (!overrides[group] || typeof overrides[group] !== "object" || Array.isArray(overrides[group]))) {
              parameterDiagnostic(group, overrides[group], "Expected a parameter group object; using defaults.");
              continue;
            }
            if (overrides[group] && typeof overrides[group] === "object") {
              for (const [key, value] of Object.entries(overrides[group])) {
                if (typeof value !== "number" || !Number.isFinite(value) || (group === "minSizes" ? value < 0 : value <= 0)) {
                  parameterDiagnostic(`${group}.${key}`, value, "Expected a finite positive number (zero is allowed for minimum sizes).");
                  continue;
                }
                adaptiveParams[group][key] = value;
              }
            }
          }
          for (const [group, lower, upper, fallback] of [
            ["ratioShapes", "vertical", "horizontal", [0.8, 1.25]],
            ["experienceScale", "near", "far", [1, 1.5]]
          ]) if (adaptiveParams[group][lower] >= adaptiveParams[group][upper]) {
            parameterDiagnostic(group, __spreadValues({}, adaptiveParams[group]), "The lower boundary must be less than the upper boundary; using defaults.");
            adaptiveParams[group][lower] = fallback[0];
            adaptiveParams[group][upper] = fallback[1];
          }
          const orderedSizes = ["compact", "small", "medium", "large", "xl", "xxl"];
          if (orderedSizes.some((name, index) => index > 0 && adaptiveParams.minSizes[name] < adaptiveParams.minSizes[orderedSizes[index - 1]]))
            parameterDiagnostic("minSizes", __spreadValues({}, adaptiveParams.minSizes), "Named minimum sizes are out of order; the configured thresholds are preserved.");
          managedClasses = getManagedClasses();
          for (const group of Object.keys(adaptiveParams)) Object.freeze(adaptiveParams[group]);
          Object.freeze(adaptiveParams);
          AelluxJs2.mountManager.add({
            extensionName,
            selector: `[${attr.adaptive}]`,
            priority: 0,
            mount: mountAdaptive,
            unmount: unmountAdaptive
          });
        }
        function getManagedClasses() {
          const classes = [
            modifier.shapeHorizontal,
            modifier.shapeVertical,
            modifier.shapeSquare
          ];
          sizeThresholds = [];
          for (const [size, minimum] of Object.entries(adaptiveParams.minSizes)) {
            const className = AelluxJs2.className("fits-" + size);
            sizeThresholds.push({ className, minimum });
            classes.push(className);
          }
          return classes;
        }
        function parameterDiagnostic(attribute, value, reason) {
          AelluxJs2.diagnostics.warn(AelluxJs2.diagnostics.WARN_CONFIGURATION_VALUE, {
            extension: extensionName,
            attribute: `adaptiveParams${attribute ? "." + attribute : ""}`,
            value,
            reason,
            suggestion: "Use finite nonnegative minimum sizes and positive, ordered ratio/experience boundaries."
          });
        }
        function destroy() {
          pendingResizeEntries.clear();
          pendingResizeElements.clear();
          for (const element of adaptiveElements) unmountAdaptive(element);
          if (resizeObserver) resizeObserver.disconnect();
          AelluxJs2.mountManager.remove({ extensionName });
        }
        function mountAdaptive(element) {
          if (adaptiveElements.has(element)) return;
          elementMemories.set(element, AelluxJs2.persist.element.save(
            element,
            [],
            dimensionProperties
          ));
          ariaHandlers.set(element, AelluxJs2.aria.register(element));
          adaptiveElements.add(element);
          layoutIds.set(element, nextLayoutId++);
          if (resizeObserver) resizeObserver.observe(element);
          else {
            scheduleElement(element, null);
            if (adaptiveElements.size === 1) AelluxJs2.onEvent(root2, "$resize", onWindowResize);
          }
        }
        function unmountAdaptive(element) {
          var _a, _b;
          if (!adaptiveElements.delete(element)) return;
          pendingResizeEntries.delete(element);
          pendingResizeElements.delete(element);
          const id = layoutIds.get(element);
          if (id !== void 0) AelluxJs2.waitLayout.cancel(id);
          layoutIds.delete(element);
          if (resizeObserver) resizeObserver.unobserve(element);
          else if (adaptiveElements.size === 0) AelluxJs2.offEvent(root2, "$resize", onWindowResize);
          for (const name of managedClasses) {
            element.classList.remove(name);
          }
          (_a = ariaHandlers.get(element)) == null ? void 0 : _a.release();
          ariaHandlers.delete(element);
          (_b = elementMemories.get(element)) == null ? void 0 : _b.restore();
          elementMemories.delete(element);
        }
        function onResize(entries) {
          for (const entry of entries) {
            if (adaptiveElements.has(entry.target)) {
              pendingResizeEntries.set(entry.target, entry);
            }
          }
          scheduleUpdate();
        }
        function onWindowResize() {
          for (const element of adaptiveElements) {
            pendingResizeElements.add(element);
          }
          scheduleUpdate();
        }
        function scheduleUpdate() {
          flushPendingUpdate();
        }
        function flushPendingUpdate() {
          if (!pendingResizeEntries.size && !pendingResizeElements.size) return;
          const entries = Array.from(pendingResizeEntries.entries());
          pendingResizeEntries.clear();
          for (const [element, entry] of entries) scheduleElement(element, entry.contentRect);
          const elements = Array.from(pendingResizeElements);
          pendingResizeElements.clear();
          for (const element of elements) scheduleElement(element, null);
        }
        function scheduleElement(element, contentRect) {
          const id = layoutIds.get(element);
          if (id === void 0) return;
          const maxFPS = AelluxJs2.layoutMaxFPS(element);
          const abort = () => !adaptiveElements.has(element);
          if (contentRect) {
            AelluxJs2.waitLayout.sequence(id, {
              update: () => updateAdaptive(element, contentRect.width, contentRect.height),
              maxFPS,
              abort
            });
            return;
          }
          AelluxJs2.waitLayout.sequence(id, {
            read: () => element.getBoundingClientRect(),
            update: (rect) => updateAdaptive(element, rect.width, rect.height),
            maxFPS,
            abort
          });
        }
        function updateAdaptive(element, width, height) {
          var _a;
          if (!adaptiveElements.has(element)) return;
          const ratio = height > 0 ? width / height : 0;
          (_a = ariaHandlers.get(element)) == null ? void 0 : _a.set({
            orientation: height > width ? "vertical" : "horizontal"
          });
          element.classList.toggle(
            modifier.shapeVertical,
            ratio < adaptiveParams.ratioShapes.vertical
          );
          element.classList.toggle(
            modifier.shapeHorizontal,
            ratio > adaptiveParams.ratioShapes.horizontal
          );
          element.classList.toggle(
            modifier.shapeSquare,
            ratio >= adaptiveParams.ratioShapes.vertical && ratio <= adaptiveParams.ratioShapes.horizontal
          );
          const space = Math.sqrt(width * height);
          for (let i = 0; i < sizeThresholds.length; i++) {
            const threshold = sizeThresholds[i];
            element.classList.toggle(
              threshold.className,
              space >= threshold.minimum
            );
          }
          for (const name of dimensionProperties) {
            if (element.style.getPropertyPriority(name)) element.style.removeProperty(name);
          }
          element.style.setProperty("--ae-width", width);
          element.style.setProperty("--ae-height", height);
          AelluxJs2.dispatchFrom(element, "AdaptiveUpdate", {
            detail: { width, height, ratio }
          });
        }
        function inferOrientation(flexBox, selector = "*") {
          let id = orientationLayoutIds.get(flexBox);
          if (id === void 0) {
            id = nextLayoutId++;
            orientationLayoutIds.set(flexBox, id);
          }
          return AelluxJs2.waitLayout.read(id, () => {
            const fallback = "horizontal";
            var style = getComputedStyle(flexBox);
            if (style.display === "flex" || style.display === "inline-flex") {
              return style.flexDirection.indexOf("column") === 0 ? "vertical" : "horizontal";
            }
            if (!selector || selector.length === 0) return fallback;
            var children = flexBox.querySelectorAll(selector);
            if (children.length < 2) return fallback;
            var first = children[0].getBoundingClientRect();
            var second = children[1].getBoundingClientRect();
            var deltaX = Math.abs(
              second.left + second.width / 2 - (first.left + first.width / 2)
            );
            var deltaY = Math.abs(
              second.top + second.height / 2 - (first.top + first.height / 2)
            );
            return deltaY > deltaX ? "vertical" : "horizontal";
          });
        }
      })(typeof globalThis !== "undefined" ? globalThis : window);
    }
  });

  // src/aellux.ext.present.js
  var aellux_ext_present_exports = {};
  var init_aellux_ext_present = __esm({
    "src/aellux.ext.present.js"() {
      init_define_AELLUX_OFFICIAL_EXTENSION_MANIFEST();
      /*! aellux.js | SPDX-License-Identifier: Apache-2.0 | See LICENSE for terms. */
      (function(root2) {
        "use strict";
        const AelluxJs2 = root2.AelluxJs;
        const extensionName = "present";
        if (!AelluxJs2) {
          throw new Error(`[aellux.js] Cannot attach the "${extensionName}" extension: root.AelluxJs is not defined. Load the aellux.js boot script before this extension.`);
        }
        const attr = {
          present: AelluxJs2.attr(extensionName),
          group: AelluxJs2.attr("present-group"),
          active: AelluxJs2.attr("present-active"),
          when: AelluxJs2.attr("present-when"),
          triggerOn: AelluxJs2.attr("trigger-on"),
          autoUnpop: AelluxJs2.attr("auto-unpop"),
          presentMotion: AelluxJs2.attr("present-motion"),
          unpopOnOutside: AelluxJs2.attr("unpop-on-outside"),
          trigger: AelluxJs2.attr("trigger"),
          //toggle,pop,unpop
          dismiss: AelluxJs2.attr("dismiss"),
          //target ID
          target: AelluxJs2.attr("target")
          //target ID
        };
        const className = {
          pop: AelluxJs2.className("pop"),
          popping: AelluxJs2.className("popping"),
          unpopping: AelluxJs2.className("unpopping"),
          willChange: AelluxJs2.className("will-change"),
          grid: AelluxJs2.className("present-grid")
        };
        const presentSelector = `[${attr.present}]`;
        const groupSelector = `[${attr.group}]`;
        AelluxJs2.extAttach(extensionName, {
          init,
          destroy,
          pop,
          unpop,
          toggle,
          trigger,
          show,
          selected
        });
        const POP = "Pop", UNPOP = "Unpop", BEFORE = "Before", PING = "ping", MILLISECOND = "ms", SECOND = "s", DEFAULT_PRESENT = "opacity transform height width", OPACITY_SYNTAX = "<number> | <percentage>", TRANSFORM_SYNTAX = "<transform-list> | none";
        const TRANSITION_PREPARE_TIME = 100;
        const presentElements = /* @__PURE__ */ new Map();
        const openPresentElements = /* @__PURE__ */ new Set();
        let fallbackMotionId = 5e6;
        const triggerElementsSet = /* @__PURE__ */ new Set();
        const triggerTargets = /* @__PURE__ */ new Map();
        const triggersByTargetId = /* @__PURE__ */ new Map();
        const indexedTriggerValues = /* @__PURE__ */ new Map();
        const elementMemories = /* @__PURE__ */ new WeakMap();
        const containerAriaHandlers = /* @__PURE__ */ new WeakMap();
        const triggerAriaHandlers = /* @__PURE__ */ new WeakMap();
        const measuredMemories = /* @__PURE__ */ new WeakMap();
        const groups = /* @__PURE__ */ new Map();
        const hoverTimers = /* @__PURE__ */ new Map();
        const hoveredTriggers = /* @__PURE__ */ new Set();
        let groupObserver = null;
        let groupsQueued = false;
        let interpolatedProgress = false;
        const cssProperties = [
          ["pop-progress", "<number>", "0"],
          ["unpop-progress", "<number>", "1"],
          ["present-pop-phase", "<number>", "0"],
          ["present-unpop-phase", "<number>", "1"],
          ["from-opacity", OPACITY_SYNTAX, "0"],
          ["pop-opacity", OPACITY_SYNTAX, "1"],
          ["unpop-opacity", OPACITY_SYNTAX, "0"],
          ["from-transform", TRANSFORM_SYNTAX, "scale(0.5)"],
          ["pop-transform", TRANSFORM_SYNTAX, "scale(1)"],
          ["unpop-transform", TRANSFORM_SYNTAX, "scale(1.2)"],
          ["from-height", "*", "0fr"],
          ["pop-height", "*", "1fr"],
          ["unpop-height", "*", "0fr"],
          ["from-width", "*", "0fr"],
          ["pop-width", "*", "1fr"],
          ["unpop-width", "*", "0fr"],
          ["pop-ease", "*", "ease-out"],
          ["unpop-ease", "*", "ease-in"],
          ["pop-duration", "<time>", "250ms"],
          ["unpop-duration", "<time>", "250ms"]
        ];
        function init(options) {
          const descriptors = cssProperties.map(([name, syntax, initialValue]) => ({ name: `--ae-${name}`, syntax, initialValue }));
          const progressRegistered = AelluxJs2.registerCssProperty(...descriptors.slice(0, 4));
          interpolatedProgress = !!(progressRegistered && root2.CSS.supports && root2.CSS.supports("opacity", "clamp(0, 0.5, 1)"));
          AelluxJs2.registerCssProperty(...descriptors.slice(4));
          AelluxJs2.mountManager.add({
            extensionName,
            selector: presentSelector,
            priority: 0,
            mount: mountPresentContainer,
            unmount: unmountPresentContainer,
            controllers: ["pop", "unpop", "trigger", "toggle"]
          });
          AelluxJs2.mountManager.add({
            extensionName,
            priority: 0,
            selector: `[${[
              attr.trigger,
              attr.dismiss,
              attr.target
            ].join("],[")}]`,
            mount: mountTriggerElement,
            unmount: unmountTriggerElement
          });
          AelluxJs2.mountManager.add({
            extensionName,
            selector: groupSelector,
            priority: 1,
            mount: mountGroup,
            unmount: unmountGroup,
            controllers: ["show", "selected"]
          });
          document.addEventListener("pointerover", onHover);
          document.addEventListener("pointerout", onHover);
          AelluxJs2.on("$click", OnClick);
        }
        function destroy() {
          AelluxJs2.mountManager.remove({ extensionName });
          AelluxJs2.off("$click", OnClick);
          document.removeEventListener("pointerover", onHover);
          document.removeEventListener("pointerout", onHover);
          for (const group of groups.keys()) unmountGroup(group);
          for (const target of hoverTimers.keys()) cancelHoverClose(target);
          hoveredTriggers.clear();
          for (const triggerElement of triggerElementsSet) {
            unmountTriggerElement(triggerElement);
          }
          for (const element of presentElements.keys()) {
            unmountPresentContainer(element);
          }
          openPresentElements.clear();
        }
        function mountPresentContainer(element) {
          if (presentElements.has(element)) return;
          elementMemories.set(element, AelluxJs2.persist.element.save(
            element,
            [attr.present, attr.presentMotion, "hidden"],
            [
              "--ae-pop-progress",
              "--ae-unpop-progress",
              "--ae-present-pop-phase",
              "--ae-present-unpop-phase"
            ]
          ));
          containerAriaHandlers.set(element, AelluxJs2.aria.register(element));
          if ((element.getAttribute(attr.present) || "").trim().toLowerCase() === "all") {
            element.setAttribute(attr.present, DEFAULT_PRESENT);
          }
          if (element.hasAttribute(attr.presentMotion)) {
            element.removeAttribute(attr.presentMotion);
          }
          const presentMotion = element.querySelector(`:scope>[${attr.presentMotion}]`);
          const tokens = (element.getAttribute(attr.present) || "").split(/\s+/);
          const measuredHeight = !presentMotion && tokens.includes("height");
          const measuredWidth = !presentMotion && tokens.includes("width");
          if (presentMotion) element.classList.add(className.grid);
          else if (measuredHeight || measuredWidth) {
            AelluxJs2.diagnostics.info(
              AelluxJs2.diagnostics.INFO_PRESENT_MEASURED_LAYOUT,
              { extension: extensionName, element }
            );
          }
          const presentController = {
            presentMotion,
            measuredHeight,
            measuredWidth,
            motionEnabled: (element.getAttribute(attr.present) || "").trim() !== "",
            motionId: AelluxJs2.motion ? AelluxJs2.motion.id() : fallbackMotionId++,
            transition: null,
            autoUnpopTimeout: null,
            direction: null,
            classList: element.classList,
            triggers: /* @__PURE__ */ new Set(),
            setAriaExpanded: function(value) {
              this.expanded = value === "true";
              containerAriaHandlers.get(element).set({ expanded: this.expanded });
              this.triggers.forEach(updateTriggerAriaExpanded);
            },
            stop: function(options = {}) {
              const replacement = options.replacement === true;
              const transitionStart = options.transitionStart === true;
              const transition = this.transition;
              if (transition) {
                transition.cancelled = true;
                transition.replacement = replacement;
                if (AelluxJs2.motion) AelluxJs2.motion.cancel(this.motionId);
                if (transition.timeout !== null) {
                  clearTimeout(transition.timeout);
                  transition.timeout = null;
                }
                if (!transitionStart && transition.className) {
                  this.classList.remove(transition.className);
                }
                this.transition = null;
                transition.interrupt(
                  AelluxJs2.diagnostics.create(
                    AelluxJs2.diagnostics.WARN_INTERRUPTION,
                    { extensionName, replacement }
                  )
                );
              }
              if (this.autoUnpopTimeout !== null) {
                clearTimeout(this.autoUnpopTimeout);
                this.autoUnpopTimeout = null;
              }
              if (transitionStart) {
                this.classList.remove(className.unpopping);
              } else {
                this.classList.remove(
                  className.pop,
                  className.popping,
                  className.unpopping,
                  className.willChange
                );
              }
              if (!replacement) restoreMeasuredStyles(element, this);
            }
          };
          presentController.setAriaExpanded(
            element.hidden ? "false" : "true"
          );
          if (!element.hidden) {
            presentController.classList.add(className.pop);
            openPresentElements.add(element);
          }
          presentElements.set(element, presentController);
          for (const triggerElement of element.querySelectorAll(
            `[${attr.trigger}],[${attr.dismiss}],[${attr.target}]`
          )) {
            if (triggerTargets.get(triggerElement) === element) {
              presentController.triggers.add(triggerElement);
              updateTriggerAriaExpanded(triggerElement);
            }
          }
          const idTriggers = triggersByTargetId.get(element.id);
          if (idTriggers) {
            for (const triggerElement of idTriggers) {
              refreshTriggerTargets(triggerElement);
            }
          }
          setProgress(element, !element.hidden);
          queueGroups();
          autoUnpopSchedule(element, presentController);
        }
        function unmountPresentContainer(element) {
          var _a, _b, _c;
          if (!presentElements.has(element)) return;
          const controller = presentElements.get(element);
          cancelHoverClose(element);
          for (const button of controller.triggers) hoveredTriggers.delete(button);
          controller.stop();
          (_a = AelluxJs2.waitLayout) == null ? void 0 : _a.cancel(controller.motionId);
          element.classList.remove(className.grid);
          presentElements.delete(element);
          openPresentElements.delete(element);
          (_b = containerAriaHandlers.get(element)) == null ? void 0 : _b.release();
          containerAriaHandlers.delete(element);
          (_c = elementMemories.get(element)) == null ? void 0 : _c.restore();
          elementMemories.delete(element);
          controller.triggers.forEach(updateTriggerAriaExpanded);
          queueGroups();
        }
        function mountTriggerElement(triggerElement) {
          if (triggerElementsSet.has(triggerElement)) return;
          triggerAriaHandlers.set(triggerElement, AelluxJs2.aria.register(triggerElement));
          triggerElementsSet.add(triggerElement);
          refreshTriggerTargets(triggerElement);
        }
        function unmountTriggerElement(triggerElement) {
          var _a, _b;
          if (!triggerElementsSet.has(triggerElement)) return;
          hoveredTriggers.delete(triggerElement);
          const target = triggerTargets.get(triggerElement);
          if (target) {
            cancelHoverClose(target);
            (_a = presentElements.get(target)) == null ? void 0 : _a.triggers.delete(triggerElement);
            triggerTargets.delete(triggerElement);
          }
          unindexTriggerTarget(triggerElement);
          triggerElementsSet.delete(triggerElement);
          (_b = triggerAriaHandlers.get(triggerElement)) == null ? void 0 : _b.release();
          triggerAriaHandlers.delete(triggerElement);
        }
        function targetIdFor(value) {
          if (!value) return null;
          const id = value.charAt(0) === "#" ? value.slice(1) : value;
          return id && !/[\s#]/.test(id) ? id : null;
        }
        function targetById(value) {
          const id = targetIdFor(value);
          if (!id) {
            AelluxJs2.diagnostics.error(AelluxJs2.diagnostics.ERROR_EXTENSION_SELECTOR, {
              cause: new SyntaxError(),
              extension: extensionName,
              selector: value,
              reason: "Present targets accept one element ID, not a CSS selector list.",
              suggestion: "Use one existing Present ID, optionally prefixed with #."
            });
            return null;
          }
          return document.getElementById(id);
        }
        function unindexTriggerTarget(triggerElement) {
          const previous = indexedTriggerValues.get(triggerElement);
          const id = targetIdFor(previous);
          if (id) {
            const triggers = triggersByTargetId.get(id);
            triggers.delete(triggerElement);
            if (!triggers.size) triggersByTargetId.delete(id);
          }
          indexedTriggerValues.delete(triggerElement);
        }
        function indexTriggerTarget(triggerElement, value) {
          if (indexedTriggerValues.get(triggerElement) === value) return;
          unindexTriggerTarget(triggerElement);
          indexedTriggerValues.set(triggerElement, value);
          const id = targetIdFor(value);
          if (id) {
            let triggers = triggersByTargetId.get(id);
            if (!triggers) {
              triggers = /* @__PURE__ */ new Set();
              triggersByTargetId.set(id, triggers);
            }
            triggers.add(triggerElement);
          }
        }
        function refreshTriggerTargets(triggerElement) {
          var _a, _b, _c, _d, _e;
          const previousTarget = triggerTargets.get(triggerElement);
          const targetSelector = triggerElement.getAttribute(attr.target);
          const dismiss = triggerElement.getAttribute(attr.dismiss);
          indexTriggerTarget(triggerElement, dismiss || targetSelector);
          const container = triggerElement.closest(presentSelector);
          if (previousTarget) {
            (_a = presentElements.get(previousTarget)) == null ? void 0 : _a.triggers.delete(triggerElement);
          }
          let target = null;
          if (dismiss || targetSelector) {
            target = targetById(dismiss || targetSelector);
          } else if (container && container.id) {
            target = container;
          }
          if (previousTarget !== target) hoveredTriggers.delete(triggerElement);
          if (!target || !target.id) {
            triggerTargets.delete(triggerElement);
            (_b = triggerAriaHandlers.get(triggerElement)) == null ? void 0 : _b.unset("expanded");
            (_c = triggerAriaHandlers.get(triggerElement)) == null ? void 0 : _c.unset("controls");
            return;
          }
          triggerTargets.set(triggerElement, target);
          (_d = presentElements.get(target)) == null ? void 0 : _d.triggers.add(triggerElement);
          const targetIds = /* @__PURE__ */ new Set([target.id]);
          const initial = (_e = triggerAriaHandlers.get(triggerElement)) == null ? void 0 : _e.initial("controls");
          if (initial) {
            initial.trim().split(/\s+/).forEach((x) => targetIds.add(x));
          }
          updateTriggerAriaExpanded(triggerElement);
          triggerAriaHandlers.get(triggerElement).set({ controls: [...targetIds] });
        }
        function updateTriggerAriaExpanded(triggerElement) {
          var _a, _b;
          const target = triggerTargets.get(triggerElement);
          if (!target) return;
          const expanded = ((_a = presentElements.get(target)) == null ? void 0 : _a.expanded) === true;
          (_b = triggerAriaHandlers.get(triggerElement)) == null ? void 0 : _b.set({ expanded });
        }
        function pop(element) {
          return presentTransition(element, true, true);
        }
        function unpop(element) {
          return presentTransition(element, false);
        }
        function toggle(element, goto) {
          return presentTransition(element, goto);
        }
        function trigger(element, trigger2) {
          trigger2 = typeof trigger2 === "string" ? (trigger2 || "toggle").toLowerCase() : "toggle";
          if (!["pop", "unpop", "toggle"].includes(trigger2)) AelluxJs2.diagnostics.warn(
            AelluxJs2.diagnostics.WARN_CONFIGURATION_VALUE,
            {
              extension: extensionName,
              element,
              attribute: attr.trigger,
              value: trigger2,
              reason: "Unknown Present action; using toggle.",
              suggestion: "Use pop, unpop, or toggle."
            }
          );
          const method = trigger2 === "pop" ? pop : trigger2 === "unpop" ? unpop : toggle;
          return method(element);
        }
        function restoreMeasuredStyles(element, controller) {
          const memory = measuredMemories.get(element);
          if (!memory) return;
          memory.restore();
          measuredMemories.delete(element);
        }
        async function prepareMeasuredSize(element, controller, gotoVisible, previousSize, waitForPreparation) {
          if (!controller.measuredHeight && !controller.measuredWidth) return null;
          if (!measuredMemories.has(element)) {
            measuredMemories.set(element, AelluxJs2.persist.element.save(
              element,
              [],
              ["max-height", "max-width"]
            ));
          }
          measuredMemories.get(element).restore();
          let size = previousSize;
          if (gotoVisible || !size) {
            const computed = root2.getComputedStyle(element);
            const height = parseFloat(computed.height);
            const width = parseFloat(computed.width);
            size = {
              height: Number.isFinite(height) ? height : element.scrollHeight,
              width: Number.isFinite(width) ? width : element.scrollWidth
            };
          }
          const start = previousSize || (gotoVisible ? { height: 0, width: 0 } : size);
          if (controller.measuredHeight) {
            element.style.setProperty("max-height", `${Math.max(0, start.height)}px`, "important");
          }
          if (controller.measuredWidth) {
            element.style.setProperty("max-width", `${Math.max(0, start.width)}px`, "important");
          }
          if (!waitForPreparation)
            await AelluxJs2.waitLayout.read(
              controller.motionId,
              () => element.getBoundingClientRect()
            );
          return size;
        }
        async function presentTransition(element, gotoVisible, forceRepop = false, groupOperation = false) {
          const controller = presentElements.get(element);
          if (!controller) return;
          if (controller.direction === null)
            controller.direction = element.hidden ? UNPOP : POP;
          if (typeof gotoVisible === "undefined" || gotoVisible === null)
            gotoVisible = controller.direction === POP ? false : true;
          const group = element.closest(groupSelector);
          if (!groupOperation && groups.has(group) && element !== group) {
            if (!element.id) {
              groupDiagnostic(group, "Present Group members must have an ID.");
              return false;
            }
            if (gotoVisible) return show(group, element.id);
            if (groups.get(group).selected === element) return show(group, "");
          }
          const newDirection = gotoVisible ? POP : UNPOP;
          if (element.hidden && !gotoVisible || newDirection === controller.direction && !forceRepop) {
            return;
          }
          let transition = null;
          try {
            const allowEvent = groupOperation || AelluxJs2.dispatchFrom(
              element,
              `${BEFORE}${newDirection}`,
              { bubbles: true, cancelable: true }
            );
            if (!allowEvent) {
              return;
            }
            if (forceRepop && (!element.hidden || controller.transition)) {
              controller.stop();
              element.hidden = true;
              openPresentElements.delete(element);
              controller.setAriaExpanded("false");
              element.getBoundingClientRect();
            }
            const reusePreparation = !forceRepop && controller.motionEnabled && controller.transition !== null && controller.classList.contains(className.willChange);
            const waitForPreparation = controller.motionEnabled && !reusePreparation;
            let previousSize = null;
            if (reusePreparation && (controller.measuredHeight || controller.measuredWidth)) {
              const computed = root2.getComputedStyle(element);
              previousSize = {
                height: parseFloat(computed.maxHeight),
                width: parseFloat(computed.maxWidth)
              };
            }
            if (!forceRepop) {
              controller.stop({ replacement: reusePreparation, transitionStart: true });
            }
            controller.direction = newDirection;
            setPhase(element, "pop", "0");
            setPhase(element, "unpop", "0");
            element.style.setProperty("--ae-pop-progress", "0");
            element.style.setProperty("--ae-unpop-progress", "0");
            root2.getComputedStyle(element).getPropertyValue("--ae-pop-progress");
            const interrupted = new Promise((_, interruptTransition) => {
              transition = {
                className: null,
                timeout: null,
                interrupt: interruptTransition,
                replacement: false
              };
              controller.transition = transition;
            });
            interrupted.catch(() => {
            });
            element.hidden = false;
            openPresentElements.add(element);
            let size = null;
            if (controller.measuredHeight || controller.measuredWidth)
              size = await prepareMeasuredSize(
                element,
                controller,
                gotoVisible,
                previousSize,
                waitForPreparation
              );
            if (controller.transition !== transition) return;
            if (controller.motionEnabled) {
              controller.classList.add(className.willChange);
            }
            if (waitForPreparation) {
              const prepared = new Promise((resolve) => {
                transition.timeout = setTimeout(() => {
                  transition.timeout = null;
                  resolve();
                }, TRANSITION_PREPARE_TIME);
              });
              await Promise.race([prepared, interrupted]);
            }
            transition.className = className[`${newDirection}${PING}`.toLowerCase()];
            const duration = root2.getComputedStyle(element).getPropertyValue(`--ae-${newDirection}-duration`.toLowerCase()).trim();
            const timeMs = getString2Time(duration);
            const activateTransition = () => {
              if (controller.transition !== transition) return;
              controller.classList.remove(
                className.pop,
                className.popping,
                className.unpopping
              );
              controller.classList.add(transition.className);
              controller.setAriaExpanded(gotoVisible ? "true" : "false");
              if (interpolatedProgress) {
                element.style.setProperty("--ae-pop-progress", "clamp(0, var(--ae-present-pop-phase), 1)");
                element.style.setProperty("--ae-unpop-progress", "clamp(0, var(--ae-present-unpop-phase), 1)");
              }
              setPhase(element, gotoVisible ? "pop" : "unpop", "1");
              if (size) {
                if (controller.measuredHeight) {
                  element.style.setProperty("max-height", `${gotoVisible ? size.height : 0}px`, "important");
                }
                if (controller.measuredWidth) {
                  element.style.setProperty("max-width", `${gotoVisible ? size.width : 0}px`, "important");
                }
              }
            };
            const advancedEase = root2.getComputedStyle(element).getPropertyValue(`--ae-${newDirection}-aellux-ease`.toLowerCase()).trim() || void 0;
            const motionOptions = {
              extension: extensionName,
              id: controller.motionId,
              apply: activateTransition,
              easing: advancedEase,
              nativeDuration: timeMs,
              maxFPS: AelluxJs2.layoutMaxFPS ? AelluxJs2.layoutMaxFPS(element) : void 0,
              abort: () => controller.transition !== transition || !element.isConnected
            };
            const completed = AelluxJs2.motion ? AelluxJs2.motion.run(element, motionOptions) : legacyMotionRun(motionOptions, transition);
            AelluxJs2.dispatchFrom(element, "Layout", {
              detail: {
                origin: `present.${newDirection}`.toLowerCase(),
                durationMs: Number.isFinite(timeMs) ? Math.max(0, timeMs) : 0
              },
              bubbles: true
            });
            AelluxJs2.dispatchFrom(element, `${newDirection}${PING}`, { bubbles: true });
            const motionResult = await Promise.race([completed, interrupted]);
            if (controller.transition !== transition || motionResult && motionResult.status !== "completed") return;
            finishTransition(element, controller, transition, gotoVisible);
            if (gotoVisible && !element.hidden) {
              autoUnpopSchedule(element, controller);
              controller.classList.add(className.pop);
              AelluxJs2.dispatchFrom(element, POP, { bubbles: true });
            }
            if (!gotoVisible && element.hidden) {
              AelluxJs2.dispatchFrom(element, UNPOP, { bubbles: true });
            }
          } catch (error) {
            const ownsTransition = transition && controller.transition === transition;
            if (ownsTransition && transition.timeout !== null) {
              clearTimeout(transition.timeout);
              transition.timeout = null;
            }
            if (ownsTransition && transition.className) {
              controller.classList.remove(transition.className);
            }
            if (ownsTransition) restoreMeasuredStyles(element, controller);
            switch (error && error.code) {
              case AelluxJs2.diagnostics.WARN_INTERRUPTION.code:
                if (transition && transition.cancelled) break;
                AelluxJs2.diagnostics.warn(
                  AelluxJs2.diagnostics.WARN_INTERRUPTION,
                  {
                    cause: error,
                    extension: extensionName,
                    element,
                    replacement: transition && transition.replacement === true
                  }
                );
                break;
              default:
                AelluxJs2.diagnostics.error(
                  AelluxJs2.diagnostics.ERROR_EXTENSION_TRANSITION,
                  { cause: error, extension: extensionName, element }
                );
                break;
            }
          } finally {
            if (transition && controller.transition === transition) {
              controller.transition = null;
              controller.classList.remove(className.willChange);
            }
          }
        }
        function legacyMotionRun(options, transition) {
          options.apply();
          return new Promise((resolve) => {
            transition.timeout = setTimeout(() => {
              transition.timeout = null;
              resolve({ id: options.id, status: "completed", mode: "native" });
            }, Math.max(0, Number(options.nativeDuration) || 0));
          });
        }
        function finishTransition(element, controller, transition, gotoVisible) {
          controller.classList.remove(transition.className);
          restoreMeasuredStyles(element, controller);
          const focused = !gotoVisible && element.contains(document.activeElement) ? document.activeElement : null;
          element.hidden = gotoVisible ? false : true;
          setProgress(element, gotoVisible);
          if (element.hidden) openPresentElements.delete(element);
          else openPresentElements.add(element);
          if (focused) {
            if (document.activeElement === focused) focused.blur();
            if (document.activeElement !== focused) AelluxJs2.dispatch("UnpopFocusLost", {
              detail: { element, focused }
            });
          }
          transition.timeout = null;
        }
        function autoUnpopSchedule(element, controller) {
          const autoUnpopValue = element.getAttribute(attr.autoUnpop);
          if (!element.hidden && autoUnpopValue) {
            const autoTime = getString2Time(autoUnpopValue);
            controller.autoUnpopTimeout = setTimeout(
              autoUnpop,
              autoTime,
              element,
              controller
            );
          }
        }
        function autoUnpop(element, controller) {
          controller.autoUnpopTimeout = null;
          unpop(element);
        }
        function outsideClickAutoUnpop(currentExceptions) {
          for (const pContainer of openPresentElements) {
            if (pContainer.hidden === true || pContainer.getAttribute(attr.unpopOnOutside) === "false" || currentExceptions.some((e) => pContainer.contains(e))) {
              continue;
            }
            unpop(pContainer);
          }
        }
        function refreshChangedTrigger(button) {
          if (!triggerElementsSet.has(button)) return;
          const value = button.getAttribute(attr.dismiss) || button.getAttribute(attr.target);
          if (value !== indexedTriggerValues.get(button)) refreshTriggerTargets(button);
        }
        function OnClick(event) {
          if (!event.target) return;
          const container = event.target.closest(presentSelector);
          const exceptions = [event.target];
          var button;
          button = event.target.closest(`[${attr.trigger}]`);
          if (button) {
            refreshChangedTrigger(button);
            const triggerAttr = button.getAttribute(attr.trigger);
            const targetSelector = button.getAttribute(attr.target);
            if (targetSelector) {
              const target = targetById(targetSelector);
              diagnoseTarget(button, target, attr.target, targetSelector);
              if (target) {
                exceptions.push(target);
                if (!suppressHoverClick(button, event)) trigger(target, triggerAttr);
              }
            } else if (container) {
              exceptions.push(container);
              if (!suppressHoverClick(button, event)) trigger(container, triggerAttr);
            } else {
              AelluxJs2.diagnostics.error(
                AelluxJs2.diagnostics.ERROR_PRESENT_CONTROL_TARGET_MISSING,
                { extension: extensionName, element: button, action: "trigger" }
              );
            }
          }
          button = event.target.closest(`[${attr.dismiss}]`);
          if (button) {
            refreshChangedTrigger(button);
            const dismiss = button.getAttribute(attr.dismiss);
            const targetSelector = button.getAttribute(attr.target);
            if (dismiss || targetSelector) {
              const target = targetById(dismiss || targetSelector);
              diagnoseTarget(button, target, dismiss ? attr.dismiss : attr.target, dismiss || targetSelector);
              if (target) {
                exceptions.push(target);
                unpop(target);
              }
            } else if (container) {
              exceptions.push(container);
              unpop(container);
            } else {
              AelluxJs2.diagnostics.error(
                AelluxJs2.diagnostics.ERROR_PRESENT_CONTROL_TARGET_MISSING,
                { extension: extensionName, element: button, action: "dismiss" }
              );
            }
          }
          outsideClickAutoUnpop(exceptions);
        }
        function diagnoseTarget(element, target, attribute, value) {
          if (!targetIdFor(value)) return;
          if (target && target.hasAttribute(attr.present)) return;
          AelluxJs2.diagnostics.warn(AelluxJs2.diagnostics.WARN_CONFIGURATION_TARGET, {
            extension: extensionName,
            element,
            attribute,
            value,
            reason: target ? "Target is not a Present container." : "Target element was not found.",
            suggestion: "Use one existing Present element ID, optionally prefixed with #, and mount it before interacting."
          });
        }
        function setProgress(element, visible) {
          setPhase(element, "pop", visible ? "1" : "0");
          setPhase(element, "unpop", visible ? "0" : "1");
          element.style.setProperty("--ae-pop-progress", visible ? "1" : "0");
          element.style.setProperty("--ae-unpop-progress", visible ? "0" : "1");
        }
        function setPhase(element, direction, value) {
          element.style.setProperty(`--ae-present-${direction}-phase`, value);
          if (!interpolatedProgress) element.style.setProperty(`--ae-${direction}-progress`, value);
        }
        function groupMembers(group) {
          return [...presentElements.keys()].filter((element) => element.isConnected && element !== group && element.id && element.closest(groupSelector) === group);
        }
        function mountGroup(group) {
          if (groups.has(group)) return;
          const visible = groupMembers(group).filter((member) => !member.hidden);
          groups.set(group, {
            selected: visible.length === 1 ? visible[0] : null,
            revision: 0,
            pending: Promise.resolve(true),
            jobs: /* @__PURE__ */ new Map(),
            memory: AelluxJs2.persist.element.save(group, [attr.active])
          });
          if (!groupObserver && typeof root2.MutationObserver === "function") {
            groupObserver = new root2.MutationObserver((records) => {
              if (records.some((record) => record.type === "childList" || record.attributeName !== "class" || groups.has(record.target))) queueGroups();
            });
            groupObserver.observe(document, {
              subtree: true,
              childList: true,
              attributes: true,
              attributeFilter: ["class", "id", attr.active, attr.when, attr.group]
            });
          }
          queueGroups();
        }
        function unmountGroup(group) {
          const state = groups.get(group);
          if (!state) return;
          state.revision++;
          groups.delete(group);
          state.jobs.clear();
          publishGroup(group, state, null);
          for (const member of groupMembers(group)) {
            const controller = presentElements.get(member);
            if (controller.transition) {
              const visible = controller.direction === POP;
              controller.stop();
              member.hidden = !visible;
              controller.classList.toggle(className.pop, visible);
              controller.setAriaExpanded(String(visible));
              setProgress(member, visible);
              if (!visible) openPresentElements.delete(member);
            }
          }
          state.memory.restore();
          if (!groups.size && groupObserver) {
            groupObserver.disconnect();
            groupObserver = null;
          }
        }
        function queueGroups() {
          if (groupsQueued || !groups.size) return;
          groupsQueued = true;
          Promise.resolve().then(() => {
            groupsQueued = false;
            groups.forEach((state, group) => {
              reconcileGroup(group);
              if (groups.get(group) === state) publishGroup(group, state, state.selected);
            });
          });
        }
        function groupDiagnostic(group, reason) {
          AelluxJs2.diagnostics.warn(
            AelluxJs2.diagnostics.WARN_PRESENT_GROUP_SELECTION,
            {
              extension: extensionName,
              element: group,
              attribute: attr.active,
              value: group.getAttribute(attr.active),
              reason,
              suggestion: "Use unique native IDs on Present members of this group; select one ID or one matching condition."
            }
          );
        }
        function reconcileGroup(group) {
          if (!group.isConnected || !group.hasAttribute(attr.group)) return;
          const members = groupMembers(group);
          const state = groups.get(group);
          if (!members.includes(state.selected)) state.selected = null;
          let matches;
          if (group.hasAttribute(attr.active)) {
            const id = group.getAttribute(attr.active);
            matches = id === "" ? [] : members.filter((member) => member.id === id);
            if (id && matches.length !== 1) {
              groupDiagnostic(group, "Active ID must match one mounted Present descendant in this group.");
              return;
            }
          } else {
            matches = members.filter((member) => {
              const token = member.getAttribute(attr.when);
              return token && !/\s/.test(token) && group.classList.contains(token);
            });
            if (!matches.length) {
              const visible = members.filter((member) => !member.hidden && presentElements.get(member).direction !== UNPOP);
              if (visible.length > 1) groupDiagnostic(group, "Multiple initially visible members.");
              else if (!state.selected) state.selected = visible[0] || null;
              return;
            }
          }
          if (matches.length > 1) {
            groupDiagnostic(group, "Multiple members match the container classes.");
            return;
          }
          return selectGroup(group, matches[0] || null, members);
        }
        function show(group, id) {
          const state = groups.get(group);
          if (!state || typeof id !== "string") return Promise.resolve(false);
          const matches = groupMembers(group).filter((member) => member.id === id);
          if (id && matches.length !== 1) {
            groupDiagnostic(group, "Active ID must match one mounted Present descendant in this group.");
            return Promise.resolve(false);
          }
          if (group.getAttribute(attr.active) !== id) group.setAttribute(attr.active, id);
          const result = reconcileGroup(group);
          return Promise.resolve(result === void 0 ? state.pending : result);
        }
        function selected(group) {
          const state = groups.get(group);
          const member = state && state.selected;
          return member && member !== group && presentElements.has(member) && member.isConnected && member.id && member.closest(groupSelector) === group ? member : null;
        }
        function publishGroup(group, state, current) {
          if (state.announced === current) return;
          const previous = state.announced || null;
          state.announced = current;
          AelluxJs2.dispatchFrom(group, "PresentGroupChange", {
            bubbles: true,
            detail: { group, previous, current, key: current && current.id }
          });
        }
        function selectGroup(group, selected2, members) {
          var _a;
          const state = groups.get(group);
          const changes = members.filter((member) => {
            const controller = presentElements.get(member);
            return member === selected2 ? member.hidden || controller.direction === UNPOP : !member.hidden && controller.direction !== UNPOP;
          });
          if (state.selected === selected2 && !changes.length) return state.pending;
          const revision = ++state.revision;
          const active = group.getAttribute(attr.active);
          const classes = group.getAttribute("class");
          const ids = members.map((member) => member.id);
          const conditions = members.map((member) => member.getAttribute(attr.when));
          const valid = () => groups.get(group) === state && state.revision === revision && group.isConnected && group.hasAttribute(attr.group) && group.getAttribute(attr.active) === active && group.getAttribute("class") === classes && groupMembers(group).length === members.length && members.every((member, index) => presentElements.has(member) && member.isConnected && member.closest(groupSelector) === group && member.id === ids[index] && member.getAttribute(attr.when) === conditions[index]);
          for (const member of changes) {
            const allowed = AelluxJs2.dispatchFrom(
              member,
              member === selected2 ? "BeforePop" : "BeforeUnpop",
              { bubbles: true, cancelable: true }
            );
            if (!valid()) {
              queueGroups();
              return false;
            }
            if (!allowed) {
              if (state.revision === revision) {
                const id = ((_a = state.selected) == null ? void 0 : _a.id) || "";
                if (group.getAttribute(attr.active) !== id) group.setAttribute(attr.active, id);
              }
              return false;
            }
          }
          state.selected = selected2;
          let complete;
          const pending = new Promise((resolve) => {
            complete = resolve;
          });
          state.pending = pending;
          for (const member of changes) {
            const job = presentTransition(member, member === selected2, false, true);
            if (groups.get(group) !== state || state.revision !== revision) {
              complete(false);
              return pending;
            }
            state.jobs.set(member, job);
            job.then(() => {
              if (state.jobs.get(member) === job) state.jobs.delete(member);
            });
          }
          publishGroup(group, state, selected2);
          Promise.all(members.map((member) => state.jobs.get(member))).then(() => {
            const current = groupMembers(group);
            complete(groups.get(group) === state && state.revision === revision && (!selected2 || current.includes(selected2)) && current.every((member) => member === selected2 ? !member.hidden : member.hidden));
          });
          return pending;
        }
        function cancelHoverClose(target) {
          clearTimeout(hoverTimers.get(target));
          hoverTimers.delete(target);
        }
        function inHoverRegion(target, node) {
          if (!node || !node.nodeType) return false;
          if (target.contains(node)) return true;
          for (const button of triggerElementsSet) {
            if (button.getAttribute(attr.triggerOn) === "hover" && triggerTargets.get(button) === target && button.contains(node)) return true;
          }
          return false;
        }
        function suppressHoverClick(button, event) {
          return button.getAttribute(attr.triggerOn) === "hover" && event.detail > 0 && event.pointerType !== "touch" && hoveredTriggers.has(button);
        }
        function onHover(event) {
          var _a;
          if (event.pointerType === "touch" || !((_a = event.target) == null ? void 0 : _a.closest)) return;
          const entering = event.type === "pointerover";
          const button = event.target.closest(`[${attr.trigger}][${attr.triggerOn}="hover"]`);
          if (button && triggerElementsSet.has(button) && !button.contains(event.relatedTarget)) {
            refreshChangedTrigger(button);
            const target = triggerTargets.get(button);
            if (target && presentElements.has(target)) {
              if (entering) {
                cancelHoverClose(target);
                hoveredTriggers.add(button);
                const action = button.getAttribute(attr.trigger);
                if (action === "pop") toggle(target, true);
                else trigger(target, action);
              } else hoveredTriggers.delete(button);
            }
          }
          for (const target of openPresentElements) {
            if (!inHoverRegion(target, event.target)) continue;
            if (entering || inHoverRegion(target, event.relatedTarget)) cancelHoverClose(target);
            else if ([...triggerElementsSet].some((control) => triggerTargets.get(control) === target && control.getAttribute(attr.triggerOn) === "hover" && control.getAttribute(attr.trigger) !== "unpop")) {
              cancelHoverClose(target);
              hoverTimers.set(target, setTimeout(() => {
                hoverTimers.delete(target);
                if (presentElements.has(target) && target.isConnected && !inHoverRegion(target, document.activeElement)) unpop(target);
              }, 120));
            }
          }
        }
        function getString2Time(string) {
          return string ? parseFloat(string) * getMillisecondsMulti(string) : 0;
        }
        function getMillisecondsMulti(value) {
          return !value.endsWith(MILLISECOND) && value.endsWith(SECOND) ? 1e3 : 1;
        }
      })(typeof globalThis !== "undefined" ? globalThis : window);
    }
  });

  // src/aellux.full.js
  init_define_AELLUX_OFFICIAL_EXTENSION_MANIFEST();

  // src/aellux.orchestrator.js
  init_define_AELLUX_OFFICIAL_EXTENSION_MANIFEST();

  // src/internal/asset-load-helper.js
  init_define_AELLUX_OFFICIAL_EXTENSION_MANIFEST();
  /*! aellux.js | SPDX-License-Identifier: Apache-2.0 | See LICENSE for terms. */
  function assetLoadHelper(asset, options) {
    var loadCallback = options.loadCallback;
    var errorCallback = options.errorCallback;
    function clear() {
      asset.onload = null;
      asset.onerror = null;
    }
    asset.onload = function(event) {
      clear();
      if (typeof loadCallback === "function") {
        return loadCallback(event);
      }
    };
    asset.onerror = function(event) {
      clear();
      if (typeof errorCallback === "function") {
        return errorCallback(event);
      }
    };
    document.head.appendChild(asset);
    return { clear };
  }

  // src/internal/build-layout-scheduler.js
  init_define_AELLUX_OFFICIAL_EXTENSION_MANIFEST();
  /*! aellux.js | SPDX-License-Identifier: Apache-2.0 | See LICENSE for terms. */
  function buildLayoutScheduler() {
    const MIN_FPS = 5;
    const FPS_STEP = 15;
    const BASE_RECOVERY_DELAY = 1e3;
    const MAX_RECOVERY_DELAY = 8e3;
    const queues = { read: [], update: [] };
    const groups = /* @__PURE__ */ new Map();
    const tasks = /* @__PURE__ */ new Set();
    const visualFPSLimits = /* @__PURE__ */ new Map();
    const sequenceStarts = /* @__PURE__ */ new Map();
    let frameRequest = null;
    let phase = "idle";
    let waitingForVisibility = false;
    let idleSince = null;
    let nativeFPS = null;
    let limitFPS = null;
    let initialDeltas = [];
    let lastFrameTime = null;
    let frameCredit = 0;
    let samples = [];
    let slowStreak = 0;
    let lastAdjustment = -Infinity;
    let stableSince = null;
    let recoveryDelay = BASE_RECOVERY_DELAY;
    let trialLimit = null;
    const now = () => performance.now();
    const hidden = () => typeof document !== "undefined" && document.hidden;
    const hasWork = () => queues.read.length > 0 || queues.update.length > 0;
    function visualFPSLimit() {
      let result = Infinity;
      for (const value of visualFPSLimits.values()) result = Math.min(result, value);
      return result;
    }
    function setVisualFPSLimit(owner, value) {
      validId(owner);
      if (value === void 0 || value === null) visualFPSLimits.delete(owner);
      else {
        if (!Number.isFinite(value) || value <= 0) throw new RangeError("visual FPS must be positive");
        visualFPSLimits.set(owner, value);
      }
      if (hasWork()) scheduleFrame();
    }
    function publishLimit() {
      if (typeof document === "undefined" || !document.documentElement) return;
      const value = nativeFPS !== null && limitFPS !== null && limitFPS < nativeFPS ? String(limitFPS) : null;
      if (value === null) {
        if (document.documentElement.hasAttribute("data-ae-fps"))
          document.documentElement.removeAttribute("data-ae-fps");
      } else if (document.documentElement.getAttribute("data-ae-fps") !== value) {
        document.documentElement.setAttribute("data-ae-fps", value);
      }
    }
    function resetMeasurements(resetLimit) {
      lastFrameTime = null;
      frameCredit = 0;
      samples = [];
      slowStreak = 0;
      stableSince = null;
      initialDeltas = [];
      if (resetLimit) {
        nativeFPS = null;
        limitFPS = null;
        lastAdjustment = -Infinity;
      }
      publishLimit();
      trialLimit = null;
      recoveryDelay = BASE_RECOVERY_DELAY;
    }
    function onVisible() {
      if (hidden()) return;
      document.removeEventListener("visibilitychange", onVisible);
      waitingForVisibility = false;
      resetMeasurements(true);
      scheduleFrame();
    }
    function scheduleFrame() {
      if (frameRequest !== null || phase !== "idle" || !hasWork()) return;
      if (hidden()) {
        if (!waitingForVisibility) {
          document.addEventListener("visibilitychange", onVisible);
          waitingForVisibility = true;
        }
        return;
      }
      if (idleSince !== null && now() - idleSince > 250) resumeAfterIdle(now());
      idleSince = null;
      frameRequest = requestAnimationFrame(flushFrame);
    }
    function stopFrameIfIdle() {
      if (hasWork()) return;
      if (frameRequest !== null) cancelAnimationFrame(frameRequest);
      frameRequest = null;
      if (waitingForVisibility) document.removeEventListener("visibilitychange", onVisible);
      waitingForVisibility = false;
      if (phase === "idle") idleSince = now();
    }
    function observeFrame(time) {
      const previous = lastFrameTime;
      lastFrameTime = time;
      if (previous === null) return true;
      const delta = time - previous;
      if (delta <= 0 || delta > 250) {
        frameCredit = 0;
        samples = [];
        slowStreak = 0;
        stableSince = null;
        return true;
      }
      if (nativeFPS === null) {
        initialDeltas.push(delta);
        if (initialDeltas.length >= 8) {
          const ordered = initialDeltas.slice().sort((a, b) => a - b);
          nativeFPS = Math.max(MIN_FPS, Math.round(1e3 / ordered[4]));
          limitFPS = nativeFPS;
          initialDeltas = [];
        }
      } else {
        const expected = 1e3 / Math.max(MIN_FPS, limitFPS);
        const slow = delta > expected * 1.23;
        slowStreak = slow ? slowStreak + 1 : 0;
        samples.push({ time, slow, delay: delta, cost: 0 });
        while (samples.length && time - samples[0].time > 1e3) samples.shift();
        adjustLimit(time);
      }
      const effectiveFPS = Math.min(limitFPS === null ? Infinity : limitFPS, visualFPSLimit());
      if (effectiveFPS === Infinity || nativeFPS !== null && effectiveFPS >= nativeFPS) return true;
      const period = 1e3 / effectiveFPS;
      frameCredit += delta;
      if (frameCredit + 1e-3 < period) return false;
      frameCredit = Math.min(period, frameCredit - period);
      return true;
    }
    function adjustLimit(time) {
      if (samples.length < 8 || time - samples[0].time < 700) return;
      const slowCount = samples.reduce((n, item) => n + (item.slow ? 1 : 0), 0);
      if (slowStreak >= 4 || slowCount / samples.length >= 0.35) {
        stableSince = null;
        if (time - lastAdjustment >= 1e3 && limitFPS > MIN_FPS) {
          const previous = limitFPS;
          const delay = Math.max(...samples.filter((sample) => sample.slow).map((sample) => Math.max(sample.delay, sample.cost)));
          limitFPS = Math.min(limitFPS, adaptiveLimit(1e3 / delay));
          publishLimit();
          if (trialLimit === previous) recoveryDelay = Math.min(MAX_RECOVERY_DELAY, recoveryDelay * 2);
          trialLimit = null;
          lastAdjustment = time;
          samples = [];
          slowStreak = 0;
          frameCredit = 0;
        }
      } else {
        if (stableSince === null) stableSince = time;
        recoverLimitAfterStablePeriod(time);
      }
    }
    function resumeAfterIdle(time) {
      lastFrameTime = null;
      frameCredit = 0;
      samples = [];
      slowStreak = 0;
      initialDeltas = [];
      if (nativeFPS === null || limitFPS >= nativeFPS) return;
      if (stableSince === null) stableSince = idleSince;
      recoverLimitAfterStablePeriod(time);
    }
    function recoverLimitAfterStablePeriod(time) {
      if (stableSince === null || time - stableSince < recoveryDelay || time - lastAdjustment < recoveryDelay) return false;
      if (trialLimit === limitFPS) {
        trialLimit = null;
        recoveryDelay = BASE_RECOVERY_DELAY;
      }
      if (limitFPS >= nativeFPS) return false;
      limitFPS = recoveryLimit(limitFPS);
      publishLimit();
      trialLimit = limitFPS;
      lastAdjustment = time;
      stableSince = null;
      samples = [];
      frameCredit = 0;
      return true;
    }
    function adaptiveLimit(observedFPS) {
      let candidate = nativeFPS;
      while (candidate > MIN_FPS && candidate > observedFPS) {
        candidate = Math.max(MIN_FPS, candidate - FPS_STEP);
      }
      return candidate;
    }
    function recoveryLimit(current) {
      const levels = [nativeFPS];
      while (levels[levels.length - 1] > MIN_FPS) {
        levels.push(Math.max(MIN_FPS, levels[levels.length - 1] - FPS_STEP));
      }
      for (let index = levels.length - 1; index >= 0; index--) {
        if (levels[index] > current) return levels[index];
      }
      return nativeFPS;
    }
    function flushFrame(time) {
      frameRequest = null;
      if (hidden()) {
        resetMeasurements(true);
        scheduleFrame();
        return;
      }
      if (!observeFrame(time)) {
        scheduleFrame();
        return;
      }
      const start = now();
      phase = "read";
      const reads = queues.read.splice(0);
      for (const task of reads) runTask(task);
      Promise.resolve().then(() => {
        phase = "update";
        const updates = queues.update.splice(0);
        for (const task of updates) runTask(task);
        if (nativeFPS !== null && samples.length) {
          const cost = now() - start;
          const sample = samples[samples.length - 1];
          sample.cost = cost;
          if (cost > 1e3 / Math.max(MIN_FPS, limitFPS) * 0.8) sample.slow = true;
        }
        phase = "idle";
        if (hasWork()) scheduleFrame();
        else idleSince = now();
      });
    }
    function removeTask(task) {
      tasks.delete(task);
      if (!task.group) return;
      task.group.tasks.delete(task);
      if (task.group[task.phase] === task) task.group[task.phase] = null;
      if (!task.group.sequence && task.group.tasks.size === 0 && groups.get(task.group.id) === task.group) groups.delete(task.group.id);
    }
    function settleTask(task, error, value) {
      if (task.state === "settled") return;
      task.state = "settled";
      removeTask(task);
      if (error) task.reject(value);
      else task.resolve(value);
    }
    function cancelTask(task) {
      if (task.state === "settled") return;
      if (task.state === "pending") {
        const queue = queues[task.phase];
        const index = queue.indexOf(task);
        if (index !== -1) queue.splice(index, 1);
      }
      settleTask(task, false, void 0);
    }
    function runTask(task) {
      if (task.state !== "pending") return;
      task.state = "running";
      if (task.group && task.group[task.phase] === task) task.group[task.phase] = null;
      let result;
      try {
        result = task.parameters ? task.callback.apply(void 0, task.parameters) : task.callback();
      } catch (error) {
        settleTask(task, true, error);
        return;
      }
      let then;
      try {
        then = result && result.then;
      } catch (error) {
        settleTask(task, true, error);
        return;
      }
      if (typeof then === "function") {
        Promise.resolve(result).then(
          (value) => settleTask(task, false, value),
          (error) => settleTask(task, true, error)
        );
      } else {
        settleTask(task, false, result);
      }
    }
    function makeGroup(id) {
      const group = { id, read: null, update: null, tasks: /* @__PURE__ */ new Set(), sequence: null };
      groups.set(id, group);
      return group;
    }
    function cancelGroup(group, status) {
      if (groups.get(group.id) === group) groups.delete(group.id);
      const sequence2 = group.sequence;
      if (sequence2 && sequence2.active) {
        sequence2.active = false;
        if (sequence2.timer !== null) clearTimeout(sequence2.timer);
        sequence2.timer = null;
        detachAbortSignals(sequence2);
        group.sequence = null;
      }
      for (const task of Array.from(group.tasks)) cancelTask(task);
      if (sequence2) sequence2.resolve({ id: group.id, status });
      stopFrameIfIdle();
    }
    function queueTask(kind, callback, parameters, id, owner) {
      let group = null;
      if (id !== void 0) {
        group = owner ? owner.group : groups.get(id);
        if (!owner && group && (group.sequence || group[kind])) {
          cancelGroup(group, "superseded");
          group = null;
        }
        if (!group) group = makeGroup(id);
      }
      let task;
      const promise = new Promise((resolve, reject) => {
        task = { phase: kind, callback, parameters, group, resolve, reject, state: "pending" };
      });
      tasks.add(task);
      if (group) {
        group[kind] = task;
        group.tasks.add(task);
      }
      queues[kind].push(task);
      scheduleFrame();
      return promise;
    }
    function validId(id) {
      if (!Number.isSafeInteger(id)) throw new TypeError("waitLayout ID must be a safe integer");
    }
    function request(kind, first, second, third) {
      if (typeof first === "number") {
        validId(first);
        return queueTask(kind, second, third, first, null);
      }
      return queueTask(kind, first, second, void 0, null);
    }
    function validateStages(stages) {
      if (!stages.length) throw new TypeError("sequence() requires at least one stage");
      return stages.map((stage) => {
        if (!stage || typeof stage !== "object" || typeof stage.read !== "function" && typeof stage.update !== "function") {
          throw new TypeError("Each sequence stage needs a read or update callback");
        }
        if (stage.read !== void 0 && typeof stage.read !== "function" || stage.update !== void 0 && typeof stage.update !== "function") {
          throw new TypeError("Sequence callbacks must be functions");
        }
        let abort = null;
        let signal = null;
        if (typeof stage.abort === "function") abort = stage.abort;
        else if (stage.abort !== void 0) {
          const candidate = stage.abort && (stage.abort.signal || stage.abort);
          if (!candidate || typeof candidate.aborted !== "boolean" || typeof candidate.addEventListener !== "function" || typeof candidate.removeEventListener !== "function") {
            throw new TypeError("abort must be a function, AbortController, or AbortSignal");
          }
          signal = candidate;
        }
        let interval = 0;
        let times = 1;
        if (stage.repeat !== void 0) {
          const repeat = stage.repeat;
          if (!repeat || typeof repeat !== "object" || repeat.ms !== void 0 && repeat.s !== void 0) {
            throw new TypeError("repeat must use either ms or s");
          }
          interval = repeat.ms !== void 0 ? repeat.ms : repeat.s !== void 0 ? repeat.s * 1e3 : 0;
          if (!Number.isFinite(interval) || interval < 0) throw new RangeError("Invalid repeat interval");
          times = repeat.times === void 0 ? repeat.ms !== void 0 || repeat.s !== void 0 ? Infinity : 1 : repeat.times;
          if (repeat.times !== void 0 && (!Number.isSafeInteger(times) || times < 1)) {
            throw new RangeError("repeat.times must be a positive integer");
          }
        }
        if (stage.maxFPS !== void 0 && (!Number.isFinite(stage.maxFPS) || stage.maxFPS <= 0)) {
          throw new RangeError("maxFPS must be positive");
        }
        return {
          read: stage.read,
          update: stage.update,
          abort,
          signal,
          interval,
          times,
          maxFPS: stage.maxFPS
        };
      });
    }
    function detachAbortSignals(owner) {
      for (const signal of owner.abortSignals) {
        signal.removeEventListener("abort", owner.abortHandler);
      }
      owner.abortSignals.length = 0;
    }
    function sequence(id, ...stages) {
      validId(id);
      const configs = validateStages(stages);
      const previous = groups.get(id);
      if (previous) cancelGroup(previous, "superseded");
      const group = makeGroup(id);
      let resolve;
      let reject;
      const result = new Promise((res, rej) => {
        resolve = res;
        reject = rej;
      });
      const owner = {
        group,
        configs,
        index: 0,
        count: 0,
        lastStart: null,
        timer: null,
        active: true,
        resolve,
        reject,
        abortSignals: [],
        abortHandler: null
      };
      group.sequence = owner;
      owner.abortHandler = () => finishSequence(owner, "aborted");
      try {
        for (const config of configs) {
          if (config.signal && !owner.abortSignals.includes(config.signal)) {
            config.signal.addEventListener("abort", owner.abortHandler);
            owner.abortSignals.push(config.signal);
          }
        }
        if (owner.abortSignals.some((signal) => signal.aborted)) {
          finishSequence(owner, "aborted");
        } else {
          startIteration(owner);
        }
      } catch (error) {
        finishSequence(owner, null, error);
      }
      return result;
    }
    function finishSequence(owner, status, error) {
      if (!owner.active) return;
      const group = owner.group;
      owner.active = false;
      if (owner.timer !== null) clearTimeout(owner.timer);
      owner.timer = null;
      detachAbortSignals(owner);
      group.sequence = null;
      if (groups.get(group.id) === group) groups.delete(group.id);
      for (const task of Array.from(group.tasks)) cancelTask(task);
      stopFrameIfIdle();
      if (status === null) owner.reject(error);
      else owner.resolve({ id: group.id, status });
    }
    function checkAbort(owner, config) {
      if (!owner.active || !config.abort) return false;
      const result = config.abort();
      if (typeof result !== "boolean") throw new TypeError("abort must return a boolean");
      if (result) finishSequence(owner, "aborted");
      return result;
    }
    function startIteration(owner) {
      if (!owner.active) return;
      const config = owner.configs[owner.index];
      const previousStart = sequenceStarts.get(owner.group.id);
      const minimumStart = config.maxFPS === void 0 || !previousStart || previousStart.owner === owner ? 0 : previousStart.time + 1e3 / config.maxFPS;
      if (minimumStart > now()) {
        owner.timer = setTimeout(() => {
          owner.timer = null;
          startIteration(owner);
        }, Math.max(0, minimumStart - now() - 1));
        return;
      }
      try {
        if (checkAbort(owner, config)) return;
      } catch (error) {
        finishSequence(owner, null, error);
        return;
      }
      owner.lastStart = now();
      sequenceStarts.set(owner.group.id, { owner, time: owner.lastStart });
      const read = config.read ? queueTask("read", () => {
        if (checkAbort(owner, config)) return;
        return config.read();
      }, void 0, owner.group.id, owner) : Promise.resolve(void 0);
      read.then((value) => {
        if (!owner.active) return;
        try {
          if (checkAbort(owner, config)) return;
        } catch (error) {
          finishSequence(owner, null, error);
          return;
        }
        return config.update ? queueTask("update", (input) => {
          if (checkAbort(owner, config)) return;
          return config.update(input);
        }, [value], owner.group.id, owner) : void 0;
      }).then(() => {
        if (owner.active) completeIteration(owner, config);
      }, (error) => finishSequence(owner, null, error));
    }
    function completeIteration(owner, config) {
      owner.count++;
      if (owner.count >= config.times) {
        owner.index++;
        owner.count = 0;
        owner.lastStart = null;
        if (owner.index >= owner.configs.length) {
          finishSequence(owner, "completed");
          return;
        }
        startIteration(owner);
        return;
      }
      const completed = now();
      const fpsDue = config.maxFPS === void 0 ? completed : owner.lastStart + 1e3 / config.maxFPS;
      const due = Math.max(completed + config.interval, fpsDue);
      const delay = Math.max(0, due - now() - 1);
      if (delay > 1) {
        owner.timer = setTimeout(() => {
          owner.timer = null;
          startIteration(owner);
        }, delay);
      } else {
        startIteration(owner);
      }
    }
    function clear() {
      if (frameRequest !== null) cancelAnimationFrame(frameRequest);
      frameRequest = null;
      if (waitingForVisibility) document.removeEventListener("visibilitychange", onVisible);
      waitingForVisibility = false;
      for (const group of Array.from(groups.values())) cancelGroup(group, "cleared");
      for (const task of Array.from(tasks)) cancelTask(task);
      queues.read.length = 0;
      queues.update.length = 0;
      phase = "idle";
      idleSince = null;
      resetMeasurements(true);
      sequenceStarts.clear();
    }
    function cancel(id) {
      validId(id);
      const group = groups.get(id);
      if (!group) return false;
      cancelGroup(group, "aborted");
      return true;
    }
    return Object.freeze({
      read: (first, second, third) => request("read", first, second, third),
      update: (first, second, third) => request("update", first, second, third),
      sequence,
      cancel,
      clear,
      setVisualFPSLimit
    });
  }

  // src/internal/build-mount-map-manager.js
  init_define_AELLUX_OFFICIAL_EXTENSION_MANIFEST();

  // src/internal/create-mount-helper.js
  init_define_AELLUX_OFFICIAL_EXTENSION_MANIFEST();
  init_utils_name_case();

  // src/internal/create-controller-helper.js
  init_define_AELLUX_OFFICIAL_EXTENSION_MANIFEST();
  init_utils_name_case();
  /*! aellux.js | SPDX-License-Identifier: Apache-2.0 | See LICENSE for terms. */
  function createControllerHelper(root2, element) {
    const { toCamelCase: toCamelCase2, fromCamelCase: fromCamelCase2 } = utils_name_case_default;
    const mounts = /* @__PURE__ */ new Map();
    const controller = {
      spawn,
      despawn,
      hasMounts,
      on(event, handler, options) {
        root2.AelluxJs.onEvent(element, event, handler, options);
      },
      off(event, handler, options) {
        root2.AelluxJs.offEvent(element, event, handler, options);
      },
      dispatch(event, options) {
        return root2.AelluxJs.dispatchFrom(element, event, options);
      },
      mount(extensionNames = null) {
        return root2.AelluxJs.mountManager.mount(element, extensionNames);
      },
      unmount(extensionNames = null) {
        return root2.AelluxJs.mountManager.unmount(element, extensionNames);
      },
      update(extensionNames = null) {
        return root2.AelluxJs.mountManager.update(element, extensionNames);
      }
    };
    function spawn(extensionName, mountId, methodNames, updatable = false) {
      const key = toCamelCase2(fromCamelCase2(extensionName));
      const extension = root2.AelluxJs.ext[key];
      const methods = Array.isArray(methodNames) ? methodNames : [];
      for (const name of methods) {
        if (name === "update" && updatable) continue;
        if (typeof name === "string" && extension && typeof extension[name] === "function") continue;
        const diagnostics = root2.AelluxJs.diagnostics;
        diagnostics.warn(diagnostics.WARN_CONTROLLER_METHOD_MISSING, {
          extension: key,
          method: name,
          mountId,
          element
        });
      }
      mounts.set(mountId, {
        extension: key,
        methods,
        updatable
      });
      refresh(key);
      return controller[key] || null;
    }
    function despawn(mountId) {
      const registration = mounts.get(mountId);
      if (!registration) return false;
      mounts.delete(mountId);
      refresh(registration.extension);
      return true;
    }
    function hasMounts() {
      return mounts.size > 0;
    }
    function refresh(key) {
      const extension = root2.AelluxJs.ext[key];
      const registrations = Array.from(mounts.values()).filter((registration) => registration.extension === key);
      const names = /* @__PURE__ */ new Set();
      for (const registration of registrations) {
        for (const name of registration.methods) {
          if (name !== "update" && typeof name === "string" && extension && typeof extension[name] === "function") {
            names.add(name);
          }
        }
      }
      if (registrations.length === 0) {
        const namespace2 = controller[key];
        if (namespace2) {
          for (const name of Object.keys(namespace2)) delete namespace2[name];
        }
        delete controller[key];
        return;
      }
      const namespace = controller[key] || /* @__PURE__ */ Object.create(null);
      for (const name of Object.keys(namespace)) {
        if (name !== "update" && !names.has(name)) delete namespace[name];
      }
      for (const name of names) {
        namespace[name] = (...args) => {
          const current = root2.AelluxJs.ext[key];
          return current[name](element, ...args);
        };
      }
      namespace.update = registrations.some((registration) => registration.updatable) ? () => root2.AelluxJs.mountManager.update(element, key) : null;
      controller[key] = namespace;
    }
    return controller;
  }

  // src/internal/resolve-element-or-id.js
  init_define_AELLUX_OFFICIAL_EXTENSION_MANIFEST();
  /*! aellux.js | SPDX-License-Identifier: Apache-2.0 | See LICENSE for terms. */
  function resolveElementOrId(root2, elementOrId, options) {
    options = options || {};
    var fallback = options.defaultElement;
    if ((elementOrId === void 0 || elementOrId === null) && fallback) {
      return fallback;
    }
    var requested = elementOrId;
    if (typeof elementOrId === "string") {
      var id = elementOrId.trim().replace(/^#/, "");
      elementOrId = id ? root2.document.getElementById(id) : null;
    }
    var allowedNodeTypes = options.allowedNodeTypes || [root2.Node.ELEMENT_NODE];
    if (elementOrId && allowedNodeTypes.indexOf(elementOrId.nodeType) !== -1) {
      return elementOrId;
    }
    var diagnostics = root2.AelluxJs.diagnostics;
    diagnostics.warn(diagnostics.WARN_INVALID_ELEMENT_OR_ID, {
      elementOrId: requested,
      method: options.method
    });
    return null;
  }

  // src/internal/validate-declarations.js
  init_define_AELLUX_OFFICIAL_EXTENSION_MANIFEST();
  init_report_configuration();
  init_utils_name_case();

  // src/internal/diagnose-resources.js
  init_define_AELLUX_OFFICIAL_EXTENSION_MANIFEST();
  /*! aellux.js | SPDX-License-Identifier: Apache-2.0 | See LICENSE for terms. */
  function transformOwners(api, element) {
    var _a, _b, _c, _d;
    const owners = [];
    if (((_a = api.ext.anchor) == null ? void 0 : _a.initialized) && element.classList.contains(api.className("anchored"))) owners.push("anchor");
    const parent = element.parentElement;
    if (((_b = api.ext.scrollbox) == null ? void 0 : _b.initialized) && element.hasAttribute(api.attr("scrollbox-elastic")) && element.getAttribute(api.attr("scrollbox-elastic")) !== "false" && (parent == null ? void 0 : parent.hasAttribute(api.attr("scrollbox")))) {
      const children = [...parent.children].filter((child) => !child.hasAttribute(api.attr("scrollbar-vertical")) && !child.hasAttribute(api.attr("scrollbar-horizontal")));
      if (children.length === 1) owners.push("scrollbox-elastic");
    }
    if (((_c = api.ext.present) == null ? void 0 : _c.initialized) && !element.hasAttribute(api.attr("anchor")) && ((_d = element.getAttribute(api.attr("present"))) == null ? void 0 : _d.split(/\s+/).includes("transform"))) owners.push("present");
    return owners;
  }
  function diagnoseResource(api, element, property, writers) {
    api.diagnostics.warn(api.diagnostics.WARN_RESOURCE_CONFLICT, {
      extension: writers[writers.length - 1],
      element,
      attribute: "style",
      property,
      writers,
      reason: `${writers.join(" and ")} replace the same ${property} on this element.`,
      suggestion: "Keep positioning and elastic transforms on the outer element; animate a child element instead."
    });
  }
  function diagnoseMotionResources(api, element, animations, extension) {
    if (api.options.environment !== "development") return;
    for (const animation of animations) {
      try {
        const effect = animation.effect;
        if ((effect == null ? void 0 : effect.target) !== element || effect.pseudoElement) continue;
        const frames = effect.getKeyframes();
        if (!frames.some((frame) => "transform" in frame && (frame.composite === "replace" || (!frame.composite || frame.composite === "auto") && (!effect.composite || effect.composite === "replace")))) continue;
        const owners = transformOwners(api, element).filter((owner) => owner !== extension);
        for (const owner of owners) diagnoseResource(api, element, "transform", [owner, extension]);
      } catch (_) {
      }
    }
  }

  // src/internal/validate-declarations.js
  /*! aellux.js | SPDX-License-Identifier: Apache-2.0 | See LICENSE for terms. */
  var attributesByExtension = {
    present: "present present-group present-active present-when present-motion trigger trigger-on dismiss target auto-unpop unpop-on-outside",
    anchor: "anchor anchor-target anchor-match",
    "overflow-marquee": "overflow-marquee overflow-marquee-content overflow-marquee-active",
    scrollbox: "scrollbox scrollbox-wheel-horizontal scrollbox-momentum scrollbox-elastic scrollbar scrollbar-vertical scrollbar-horizontal",
    "scrollbox-snap": "scrollbox-snap snap-item",
    focus: "focus",
    point: "point",
    adaptive: "adaptive",
    "ajax-href": "ajax-href",
    preference: "preference option label next prev ready",
    feedback: "feedback target-message target-transform"
  };
  var coreAttributes = "maxfps wait-mounted ext ext-style dep load-when builds load-style weak-style full-style legacy esm theme-color";
  var activation = {
    present: "present present-group trigger dismiss",
    anchor: "anchor",
    "overflow-marquee": "overflow-marquee",
    scrollbox: "scrollbox",
    "scrollbox-snap": "scrollbox-snap",
    focus: "focus",
    point: "point",
    adaptive: "adaptive",
    "ajax-href": "ajax-href",
    preference: "preference",
    feedback: "feedback"
  };
  function validateDeclarations(root2, scope, extensionNames = null, method = "mount") {
    var _a, _b;
    const api = root2.AelluxJs;
    if (api.options.environment !== "development") return;
    const selected = extensionNames === null ? null : new Set(
      (Array.isArray(extensionNames) ? extensionNames : [extensionNames]).map(utils_name_case_default.fromCamelCase)
    );
    const attr = (name) => api.attr(name);
    const prefix = attr("");
    const owners = /* @__PURE__ */ new Map();
    for (const [extension, names] of Object.entries(attributesByExtension))
      for (const name of names.split(" ")) owners.set(attr(name), extension);
    const known = /* @__PURE__ */ new Set([
      ...owners.keys(),
      ...coreAttributes.split(" ").map(attr),
      ...Object.keys(api.registry.preferenceMediaQueries).map((name) => attr(utils_name_case_default.fromCamelCase(name)))
    ]);
    for (const selector of [...Object.values(api.registry.extMounters), ...Object.values(api.registry.lazyExtSelectors)])
      for (const match of selector.match(/\[[^\s\]~|^$*!=]+/g) || []) known.add(match.slice(1));
    const elements = [...scope.nodeType === 1 ? [scope] : [], ...scope.querySelectorAll("*")];
    for (const element of elements) {
      let validatePresent = function() {
        if (has("present") && value("present").trim().split(/\s+/).some((token) => token && !["opacity", "transform", "height", "width"].includes(token)))
          invalid("present", "present", "Unknown animated Present property.", "Use opacity, transform, height, width, all, or an empty value to disable motion.");
        if (has("present-when") && /\s/.test(value("present-when")))
          invalid("present", "present-when", "A group condition must be one class token.", "Use one class name without spaces or a leading dot.", "WARN_PRESENT_GROUP_SELECTION");
        for (const [name, allowed] of [["trigger", ["", "toggle", "pop", "unpop"]], ["trigger-on", ["", "click", "hover"]]])
          if (has(name) && !allowed.includes(name === "trigger" ? value(name).toLowerCase() : value(name)))
            invalid("present", name, "Unknown Present control value.", `Use ${allowed.filter(Boolean).join(", ")}.`);
        if (has("trigger") || has("dismiss")) {
          const name = value("dismiss") ? "dismiss" : "target";
          const reference = value(name);
          if (reference) diagnosePresentTarget(api, element, root2.document.getElementById(reference.replace(/^#/, "")), attr(name), reference);
          else if (!element.closest(`[${attr("present")}]`))
            invalid(
              "present",
              has("trigger") ? "trigger" : "dismiss",
              "Control has no target or enclosing Present container.",
              "Set data-ae-target to an existing Present ID or place the control inside its Present container.",
              "WARN_CONFIGURATION_TARGET"
            );
          if (element.tabIndex < 0 && !element.matches(":disabled,[inert]"))
            invalid(
              "present",
              has("trigger") ? "trigger" : "dismiss",
              "Control is not reachable with the keyboard.",
              "Prefer a native button; custom controls need focusability and appropriate keyboard activation.",
              "WARN_CONTROL_ACCESSIBILITY"
            );
        }
        if (has("auto-unpop") && value("auto-unpop") && !/^(?:\d+(?:\.\d+)?|\.\d+)(?:ms|s)?$/.test(value("auto-unpop").trim()))
          invalid("present", "auto-unpop", "Auto-unpop duration is invalid.", "Use a nonnegative duration such as 250ms or 2s.");
        if (has("present-group")) {
          const members = [...element.querySelectorAll(`[${attr("present")}]`)].filter((member) => member.closest(`[${attr("present-group")}]`) === element);
          if (!members.some((member) => member.id))
            invalid("present", "present-group", "Group has no identifiable Present members.", "Add Present descendants with unique native IDs.", "WARN_PRESENT_GROUP_SELECTION");
          for (const member of members) if (!member.id) reportConfiguration(api, "WARN_PRESENT_GROUP_SELECTION", {
            extension: "present",
            element: member,
            attribute: "id",
            value: member.id,
            reason: "Present Group member has no ID.",
            suggestion: "Assign a unique native ID so the group can select this member."
          });
        }
      }, validateAnchor = function() {
        var _a2, _b2, _c;
        const pivots = new Set("top-left top-center top-right center-left center center-right bottom-left bottom-center bottom-right".split(" "));
        const pairs = has("anchor") ? value("anchor").split(",") : [];
        if (has("anchor") && !pairs.every((token) => {
          const pair = token.trim().toLowerCase().split(":");
          return pair.length === 2 && pair.every((pivot) => pivots.has(pivot.trim()));
        }))
          invalid("anchor", "anchor", "Anchor pivot pair is invalid.", "Use target:self pairs such as bottom-center:top-center, separated by commas.");
        if (has("anchor-match") && value("anchor-match").trim().split(/\s+/).some((token) => !["width", "height"].includes(token)))
          invalid("anchor", "anchor-match", "Unknown matching dimension.", "Use width, height, or width height.", "WARN_ANCHOR_MATCH");
        const reference = value("anchor-target");
        if (!reference) return;
        let target;
        try {
          target = root2.document.getElementById(reference.replace(/^#/, "")) || root2.document.querySelector(reference);
        } catch (_) {
        }
        if (target == null ? void 0 : target.hasAttribute(attr("present-group"))) {
          if (!((_a2 = api.ext.present) == null ? void 0 : _a2.initialized))
            report("WARN_EXTENSION_REQUIRED", "present", "anchor-target", "A Present Group target requires Present.", "Register and initialize Present before mounting the group and its Anchors.");
          target = (_c = (_b2 = api.ext.present) == null ? void 0 : _b2.selected) == null ? void 0 : _c.call(_b2, target);
          if (!target) return;
        }
        if (!target) invalid("anchor", "anchor-target", "Anchor target does not exist or the selector is invalid.", "Use an existing target ID or a valid CSS selector.", "WARN_CONFIGURATION_TARGET");
        else if (method === "update" && element.getClientRects().length && !target.getClientRects().length && !target.closest(`[${attr("present")}],[hidden]`))
          invalid("anchor", "anchor-target", "The explicitly updated Anchor target cannot currently be measured.", "Reveal the target before requesting placement, or update again after it becomes measurable.", "WARN_CONFIGURATION_TARGET");
      }, validateScrollbox = function() {
        if (value("scrollbox").trim().toLowerCase() !== "pointer" || !element.getClientRects().length) return;
        const style = root2.getComputedStyle(element);
        const blockedX = element.scrollWidth > element.clientWidth + 1 && !["auto", "scroll"].includes(style.overflowX);
        const blockedY = element.scrollHeight > element.clientHeight + 1 && !["auto", "scroll"].includes(style.overflowY);
        const usableX = element.scrollWidth > element.clientWidth + 1 && ["auto", "scroll"].includes(style.overflowX);
        const usableY = element.scrollHeight > element.clientHeight + 1 && ["auto", "scroll"].includes(style.overflowY);
        if ((blockedX || blockedY) && !usableX && !usableY)
          invalid("scrollbox", "scrollbox", "Content overflows but CSS disables the pointer scrolling axes.", "Set overflow:auto or overflow:scroll on the intended axis.", "WARN_CONFIGURATION_STYLE");
      }, validateSnap = function() {
        if (!["", "horizontal", "vertical", "false"].includes(value("scrollbox-snap")))
          invalid("scrollbox-snap", "scrollbox-snap", "Unknown snap axis.", "Use horizontal, vertical, or false.");
        for (const item of element.querySelectorAll(`[${attr("snap-item")}]`)) {
          if (item.closest(`[${attr("scrollbox")}]`) !== element) continue;
          const alignment = item.getAttribute(attr("snap-item"));
          const style = root2.getComputedStyle(item);
          if (item.getClientRects().length && [style.transform, style.translate, style.rotate, style.scale].some((value2) => value2 && value2 !== "none"))
            reportConfiguration(api, "WARN_SCROLLBOX_SNAP_TRANSFORM", {
              extension: "scrollbox-snap",
              element: item,
              attribute: attr("snap-item"),
              reason: "Snap geometry includes a transform applied to the item itself.",
              suggestion: "Apply the visual transform to a child of the snap item."
            });
          if (!["", "start", "end", "center", "left", "right", "top", "bottom"].includes(alignment))
            reportConfiguration(api, "WARN_CONFIGURATION_VALUE", {
              extension: "scrollbox-snap",
              element: item,
              attribute: attr("snap-item"),
              value: alignment,
              reason: "Unknown snap item alignment.",
              suggestion: "Use start, center, or end (left/right/top/bottom are aliases)."
            });
        }
      }, validateCSS = function() {
        var _a2;
        const checkAnchor = has("anchor") && (!selected || selected.has("anchor"));
        const checkPresent = (has("present") || has("present-motion")) && (!selected || selected.has("present"));
        if (!checkAnchor && !checkPresent) return;
        if (has("anchor") && has("present") && value("present").trim().split(/\s+/).some((token) => token === "transform" || token === "all"))
          invalid(
            "present",
            "present",
            "Anchor and Present both declare transform; Anchor takes priority.",
            "Remove transform from Present, or animate a child element instead.",
            "WARN_PRESENT_ANCHOR_TRANSFORM"
          );
        const extension = checkAnchor ? "anchor" : "present";
        const style = root2.getComputedStyle(element);
        const durations = [
          ...checkPresent ? ["--ae-pop-duration", "--ae-unpop-duration"] : [],
          ...checkAnchor ? ["--ae-anchor-switch-duration"] : []
        ];
        for (const name of durations) {
          const value2 = (element.style.getPropertyValue(name) || style.getPropertyValue(name)).trim();
          if (value2 && ((_a2 = root2.CSS) == null ? void 0 : _a2.supports) && !root2.CSS.supports("transition-duration", value2))
            reportConfiguration(api, "WARN_CONFIGURATION_STYLE", {
              extension,
              element,
              attribute: "style",
              value: value2,
              reason: `Invalid duration in ${name}.`,
              suggestion: "Use a nonnegative CSS time such as 250ms or 0s."
            });
        }
        if (!element.getClientRects().length) return;
        if (checkPresent && has("present") && element.classList.contains(api.className("present-grid")) && /(?:^|\s)(height|width)(?:\s|$)/.test(value("present")) && !["grid", "inline-grid"].includes(style.display))
          invalid(extension, "present", "Present's size motion requires its grid layout stylesheet.", "Load the Present stylesheet, check CSP, and preserve the container's grid display.", "WARN_CONFIGURATION_STYLE");
        if (checkAnchor && element.classList.contains(api.className("anchored")) && !["absolute", "fixed"].includes(style.position))
          invalid(extension, "anchor", "Effective CSS prevents Anchor's absolute positioning.", "Check the weak stylesheet, CSP and overriding position rules.", "WARN_CONFIGURATION_STYLE");
        if (checkPresent && has("present") && element.hidden && style.display !== "none" && !invisible(element))
          invalid(extension, "present", "CSS makes a hidden Present container render.", "Preserve display:none for hidden Present containers; check overriding display rules.", "WARN_CONFIGURATION_STYLE");
      };
      const has = (name) => element.hasAttribute(attr(name));
      const value = (name) => element.getAttribute(attr(name));
      const report = (name, extension, attribute, reason, suggestion, extra = {}) => reportConfiguration(api, name, __spreadValues({ extension, element, attribute: attr(attribute), reason, suggestion }, extra));
      const invalid = (extension, name, reason, suggestion, code = "WARN_CONFIGURATION_VALUE") => report(code, extension, name, reason, suggestion);
      for (const attribute of element.attributes) {
        const owner = owners.get(attribute.name);
        if (selected && (!owner || !selected.has(owner))) continue;
        if (!selected && attribute.name.startsWith(prefix) && !known.has(attribute.name)) {
          const candidate = [...known].find((name) => oneEditApart(attribute.name, name));
          if (candidate) reportConfiguration(api, "WARN_ATTRIBUTE_UNKNOWN", {
            extension: owners.get(candidate) || "core",
            element,
            attribute: attribute.name,
            value: attribute.value,
            reason: "Unknown Aellux attribute.",
            suggestion: `Check the spelling; did you mean ${candidate}?`
          });
        }
      }
      for (const [extension, declarations] of Object.entries(activation)) {
        if (selected && !selected.has(extension)) continue;
        const declaration = declarations.split(" ").find((name) => has(name) && (name !== "scrollbox-snap" || value(name) !== "false"));
        if (!declaration) continue;
        if (extension === "scrollbox-snap" && !has("scrollbox"))
          invalid(extension, "scrollbox-snap", "Snap requires Scrollbox on the same element.", "Add data-ae-scrollbox to the Snap container.", "WARN_CONFIGURATION_STRUCTURE");
        const key = utils_name_case_default.toCamelCase(extension);
        if (!((_a = api.ext[key]) == null ? void 0 : _a.initialized)) {
          report(
            "WARN_EXTENSION_REQUIRED",
            extension,
            declaration,
            "The declared behavior's Extension is not initialized.",
            `Register ${extension} before mounting, await $ae.wait("${extension}"), and check earlier load diagnostics.`
          );
          continue;
        }
        if (extension === "present") validatePresent();
        if (extension === "anchor") validateAnchor();
        if (extension === "scrollbox") validateScrollbox();
        if (extension === "scrollbox-snap") validateSnap();
        if (extension === "focus") {
          if (value("focus") && value("focus") !== "next")
            invalid(extension, "focus", "Unknown Focus mode.", "Use next for Enter navigation, or remove the attribute.");
          if (value("focus") === "next" && !element.matches("input:not([type]),input[type=text],input[type=search],input[type=email],input[type=url],input[type=tel],input[type=password],input[type=number],textarea,[contenteditable]:not([contenteditable=false])"))
            invalid(extension, "focus", "Enter navigation is declared on a non-text-entry element.", "Apply data-ae-focus=next to a text input, textarea or editable element.");
        }
        if (extension === "point" && value("point") !== "" && (!/^\d+$/.test(value("point")) || !Number.isSafeInteger(Number(value("point")))))
          invalid(extension, "point", "Pointer count must be a nonnegative integer.", "Use an integer such as 1; 0 disables pointer association.");
        if (extension === "ajax-href") {
          try {
            if (!value("ajax-href").trim() || !root2.document.querySelector(value("ajax-href")))
              invalid(extension, "ajax-href", "No current content matches the AJAX selector.", "Provide a CSS selector present in both the current page and the response.");
          } catch (_) {
            invalid(extension, "ajax-href", "The AJAX selector is invalid.", "Provide a valid CSS selector such as #content.");
          }
        }
      }
      if ((!selected || selected.has("scrollbox")) && has("scrollbox-elastic") && value("scrollbox-elastic") !== "false" && !((_b = element.parentElement) == null ? void 0 : _b.hasAttribute(attr("scrollbox"))))
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
    }
    function invisible(element) {
      for (let node = element; node; node = node.parentElement) {
        const style = root2.getComputedStyle(node);
        if (style.visibility !== "visible" || Number(style.opacity) === 0) return true;
      }
      return false;
    }
  }
  function oneEditApart(left, right) {
    if (Math.abs(left.length - right.length) > 1) return false;
    let i = 0, j = 0, edits = 0;
    while (i < left.length && j < right.length) {
      if (left[i] === right[j]) {
        i++;
        j++;
        continue;
      }
      if (++edits > 1) return false;
      if (left[i] === right[j + 1] && left[i + 1] === right[j] && left.length === right.length) {
        i += 2;
        j += 2;
      } else if (left.length > right.length) i++;
      else if (right.length > left.length) j++;
      else {
        i++;
        j++;
      }
    }
    return edits + Number(i < left.length || j < right.length) === 1;
  }

  // src/internal/create-mount-helper.js
  init_validate_html_source();
  /*! aellux.js | SPDX-License-Identifier: Apache-2.0 | See LICENSE for terms. */
  function createMountHelper(root2, mountMaps, mountedElements, elementControllers) {
    const UNMOUNT = "unmount";
    const { toCapitalized: toCapitalized2, toCamelCase: toCamelCase2, fromCamelCase: fromCamelCase2 } = utils_name_case_default;
    const pendingMounts = /* @__PURE__ */ new WeakMap();
    const pendingUnmounts = /* @__PURE__ */ new WeakMap();
    const mountRecords = /* @__PURE__ */ new WeakMap();
    let mountOrder = 0;
    const classPrefix = root2.AelluxJs.className("");
    const sourceURL = root2.document.URL;
    let sourceChecked = false;
    return { mount, unmount, unmountDetached, update };
    async function update(elementOrId, extensionNames = null) {
      const rootElement = resolveMountElement(elementOrId, "update");
      if (!rootElement) return false;
      await AelluxJsMounted(rootElement, "update", extensionNames);
      validateDeclarations(root2, rootElement, extensionNames, "update");
      return true;
    }
    async function unmount(elementOrId, extensionNames = null) {
      const rootElement = resolveMountElement(elementOrId, UNMOUNT);
      if (!rootElement) return false;
      return AelluxJsMounted(rootElement, UNMOUNT, extensionNames);
    }
    async function unmountDetached() {
      let hasDetachedElement = false;
      for (const element of mountedElements.keys()) {
        if (!element.isConnected) {
          hasDetachedElement = true;
          break;
        }
      }
      if (!hasDetachedElement) return false;
      return AelluxJsMounted(root2.document, UNMOUNT, null, true);
    }
    async function mount(elementOrId, extensionNames = null) {
      const AelluxJs2 = root2.AelluxJs;
      const newlyMounted = /* @__PURE__ */ new Set();
      const rootElement = resolveMountElement(elementOrId, "mount");
      if (!rootElement) return [];
      if (!AelluxJs2.dispatch("BeforeMount", {
        cancelable: true,
        detail: {
          root: rootElement,
          extensions: extensionNames == null ? null : (typeof extensionNames === "string" ? [extensionNames] : extensionNames).map((name) => fromCamelCase2(name))
        }
      })) return [];
      const waitMountedAttr = AelluxJs2.attr("wait-mounted");
      const allWaiters = findElements(rootElement, `[${waitMountedAttr}]`);
      allWaiters.forEach((waiter) => waiter.setAttribute("aria-busy", "true"));
      try {
        const allLinks = findElements(rootElement, "link[rel='aelluxjs-ext']");
        for (const link of allLinks) {
          const href = link.getAttribute("href");
          const loadWhen = link.getAttribute(AelluxJs2.attr("load-when")) || void 0;
          const builds = link.getAttribute(AelluxJs2.attr("builds")) || void 0;
          const loadStyleValue = link.getAttribute(AelluxJs2.attr("load-style"));
          const loadStyle = loadStyleValue === null || loadStyleValue === "false" ? false : loadStyleValue || true;
          link.setAttribute("rel", "aelluxjs-ext-registered");
          AelluxJs2.ext(href, { builds, loadWhen, loadStyle });
        }
        const waitExtensions = [];
        for (const [key, options] of Object.entries(root2.AelluxJs.registry.ext)) {
          if (options.loadWhen) continue;
          waitExtensions.push(AelluxJs2.wait(key));
        }
        await Promise.all(waitExtensions);
        await AelluxJsMount(rootElement, extensionNames, newlyMounted);
        validateDeclarations(root2, rootElement, extensionNames);
        if (rootElement === root2.document && extensionNames == null) validateDocumentSource();
      } catch (error) {
        AelluxJs2.diagnostics.error(AelluxJs2.diagnostics.ERROR_MOUNT, {
          cause: error,
          root: rootElement,
          extensions: extensionNames
        });
      } finally {
        allWaiters.forEach((waiter) => waiter.setAttribute("aria-busy", "false"));
      }
      return Array.from(newlyMounted);
    }
    function validateDocumentSource() {
      const api = root2.AelluxJs;
      if (api.options.environment !== "development" || sourceChecked || root2.document.contentType !== "text/html" || !/^https?:/i.test(sourceURL)) return;
      sourceChecked = true;
      Promise.resolve().then(() => api.request(sourceURL, { cache: "force-cache" })).then((response) => response.text()).then((html) => validateHTMLSource(api, html, sourceURL)).catch(() => {
      });
    }
    async function AelluxJsMount(rootElement, extensionNames, newlyMounted) {
      const AelluxJs2 = root2.AelluxJs;
      if (typeof extensionNames === "string")
        extensionNames = [extensionNames];
      var filter;
      if (!extensionNames) {
        const mounterSelectors = Object.values(AelluxJs2.registry.extMounters);
        const lazySelectors = Object.values(AelluxJs2.registry.lazyExtSelectors);
        filter = [...mounterSelectors, ...lazySelectors];
      } else {
        filter = [];
        extensionNames = extensionNames.map((_) => fromCamelCase2(_));
        for (const [key, selectorString] of Object.entries(AelluxJs2.registry.extMounters))
          if (extensionNames.indexOf(fromCamelCase2(key)) !== -1)
            filter.push(selectorString);
        for (const [key, selectorString] of Object.entries(AelluxJs2.registry.lazyExtSelectors))
          if (extensionNames.indexOf(fromCamelCase2(key)) !== -1)
            filter.push(selectorString);
      }
      if (filter.length === 0) {
        AelluxJs2.dispatch("Mount", {
          detail: { root: rootElement, extensions: extensionNames, elements: [] }
        });
        return;
      }
      const candidatesByExtension = /* @__PURE__ */ new Map();
      const allElements = findElements(rootElement, filter.join(","));
      for (const element of allElements) {
        let localExtensionNames;
        if (extensionNames) {
          localExtensionNames = extensionNames;
        } else {
          localExtensionNames = /* @__PURE__ */ new Set();
          for (const [key, selector] of Object.entries(AelluxJs2.registry.lazyExtSelectors))
            if (element.matches(selector) && filter.indexOf(selector) !== -1)
              localExtensionNames.add(fromCamelCase2(key));
          for (const [key, selector] of Object.entries(AelluxJs2.registry.extMounters))
            if (element.matches(selector) && filter.indexOf(selector) !== -1)
              localExtensionNames.add(fromCamelCase2(key));
        }
        for (const extensionName of localExtensionNames) {
          let candidates = candidatesByExtension.get(extensionName);
          if (!candidates) {
            candidates = /* @__PURE__ */ new Set();
            candidatesByExtension.set(extensionName, candidates);
          }
          candidates.add(element);
        }
      }
      const extensions = Array.from(candidatesByExtension);
      const loaded = await Promise.all(
        extensions.map(([extensionName]) => AelluxJs2.wait(extensionName).then(
          (value) => ({ value }),
          (error) => ({ error })
        ))
      );
      for (const result of loaded) {
        if (Object.prototype.hasOwnProperty.call(result, "error")) throw result.error;
      }
      const registrations = [];
      for (let index = 0; index < extensions.length; index++) {
        if (!loaded[index].value) continue;
        const [extensionName] = extensions[index];
        const mounter = mountMaps.get(toCamelCase2(extensionName));
        if (!mounter) continue;
        for (const [selector, controller] of mounter) {
          registrations.push({
            extensionName,
            selector,
            controller,
            priority: controller.priority,
            order: registrations.length
          });
        }
      }
      registrations.sort((left, right) => left.priority - right.priority || left.order - right.order);
      const elementsAffected = /* @__PURE__ */ new Set();
      for (const { extensionName, selector, controller } of registrations) {
        try {
          if (!controller.mount) {
            continue;
          }
          const mountableElements = findElements(rootElement, selector);
          for (const mountable of mountableElements) {
            const mountId = `${extensionName}@${selector}`;
            if (isMounted(mountable, mountId)) {
              const pendingMount = getPendingMount(mountable, mountId);
              if (pendingMount) await pendingMount;
              continue;
            }
            if (!isMounted(mountable)) {
              for (const name of Array.from(mountable.classList)) {
                if (name.startsWith(classPrefix)) mountable.classList.remove(name);
              }
            }
            setMounted(mountable, mountId, true, controller.priority);
            const finishPendingMount = beginPendingMount(mountable, mountId);
            try {
              await controller.mount(mountable);
              let elementController = elementControllers.get(mountable);
              if (!elementController) {
                elementController = createControllerHelper(root2, mountable);
                elementControllers.set(mountable, elementController);
              }
              elementController.spawn(
                extensionName,
                mountId,
                controller.controllers,
                typeof controller.update === "function"
              );
              elementsAffected.add(mountable);
              newlyMounted.add(mountable);
            } catch (error) {
              setMounted(mountable, mountId, false);
              const elementController = elementControllers.get(mountable);
              if (elementController) {
                elementController.despawn(mountId);
                if (!elementController.hasMounts()) elementControllers.delete(mountable);
              }
              AelluxJs2.diagnostics.error(
                AelluxJs2.diagnostics.ERROR_EXTENSION_MOUNT,
                {
                  cause: error,
                  extension: extensionName,
                  method: "mount",
                  selector,
                  element: mountable
                }
              );
            } finally {
              finishPendingMount();
            }
          }
        } catch (error) {
          AelluxJs2.diagnostics.error(
            AelluxJs2.diagnostics.ERROR_EXTENSION_MOUNT,
            {
              cause: error,
              extension: extensionName,
              method: "mount",
              selector
            }
          );
        }
      }
      for (const affected of elementsAffected) {
        if (!affected.isConnected || !isMounted(affected)) {
          if (!affected.isConnected) await unmountElementRegistrations(affected);
          newlyMounted.delete(affected);
          continue;
        }
        affected.classList.toggle(AelluxJs2.className("mounted"), true);
      }
      AelluxJs2.dispatch("Mount", {
        detail: {
          root: rootElement,
          extensions: extensionNames,
          elements: Array.from(newlyMounted)
        }
      });
    }
    async function AelluxJsMounted(rootElement, method, extensionNames = null, detachedOnly = false) {
      const AelluxJs2 = root2.AelluxJs;
      const selectedNames = extensionNames === null ? null : new Set((typeof extensionNames === "string" ? [extensionNames] : extensionNames).map((name) => fromCamelCase2(name)));
      if (method === UNMOUNT && !AelluxJs2.dispatch("BeforeUnmount", {
        cancelable: true,
        detail: {
          root: rootElement,
          extensions: selectedNames ? Array.from(selectedNames) : null,
          detachedOnly
        }
      })) return false;
      const affected = /* @__PURE__ */ new Set();
      const registrations = [];
      for (const [element, mountIds] of Array.from(mountedElements)) {
        const inRoot = element === rootElement || rootElement.contains(element);
        const detachedInGlobalUnmount = method === UNMOUNT && rootElement === root2.document && !element.isConnected;
        if (detachedOnly ? element.isConnected || hasPendingMounts(element) : !inRoot && !detachedInGlobalUnmount) continue;
        for (const mountId of Array.from(mountIds)) {
          const separator = mountId.indexOf("@");
          const extensionName = mountId.slice(0, separator);
          const selector = mountId.slice(separator + 1);
          if (selectedNames && !selectedNames.has(extensionName)) continue;
          const extensionKey = toCamelCase2(extensionName);
          const mounter = mountMaps.get(extensionKey);
          const controller = mounter && mounter.get(selector);
          if (method === UNMOUNT) {
            registrations.push({ element, mountId, controller, extensionName, selector });
            continue;
          }
          try {
            if (controller && controller[method]) {
              affected.add(element);
              await controller[method](element);
            }
          } catch (error) {
            AelluxJs2.diagnostics.error(AelluxJs2.diagnostics.ERROR_EXTENSION_MOUNT, {
              cause: error,
              extension: extensionName,
              method,
              selector
            });
          }
        }
      }
      if (method === UNMOUNT) {
        registrations.sort(compareUnmountOrder);
        for (const { element, mountId, controller, extensionName, selector } of registrations) {
          if (await unmountRegistration(element, mountId, controller, extensionName, selector))
            affected.add(element);
        }
      }
      AelluxJs2.dispatch(toCapitalized2(method), {
        detail: {
          root: rootElement,
          extensions: selectedNames ? Array.from(selectedNames) : null,
          elements: Array.from(affected)
        }
      });
      return true;
    }
    async function unmountRegistration(element, mountId, controller, extensionName, selector) {
      const pendingMount = getPendingMount(element, mountId);
      if (pendingMount) await pendingMount;
      if (!isMounted(element, mountId)) return false;
      let tasks = pendingUnmounts.get(element);
      if (!tasks) {
        tasks = /* @__PURE__ */ new Map();
        pendingUnmounts.set(element, tasks);
      }
      if (tasks.has(mountId)) {
        await tasks.get(mountId);
        return false;
      }
      let finish;
      tasks.set(mountId, new Promise((resolve) => {
        finish = resolve;
      }));
      const AelluxJs2 = root2.AelluxJs;
      const diagnostics = AelluxJs2.diagnostics;
      try {
        try {
          if (controller && controller.unmount) await controller.unmount(element);
        } catch (cause) {
          diagnostics.error(diagnostics.ERROR_EXTENSION_MOUNT, {
            cause,
            extension: extensionName,
            method: UNMOUNT,
            selector
          });
        }
        try {
          setMounted(element, mountId, false);
          const elementController = elementControllers.get(element);
          if (elementController) {
            elementController.despawn(mountId);
            if (!elementController.hasMounts()) elementControllers.delete(element);
          }
          element.classList.toggle(AelluxJs2.className("mounted"), isMounted(element));
        } catch (cause) {
          diagnostics.error(diagnostics.ERROR_EXTENSION_MOUNT, {
            cause,
            extension: extensionName,
            method: UNMOUNT,
            selector
          });
        }
      } finally {
        tasks.delete(mountId);
        if (!tasks.size) pendingUnmounts.delete(element);
        finish();
      }
      return !isMounted(element, mountId);
    }
    async function unmountElementRegistrations(element) {
      const registrations = Array.from(mountedElements.get(element) || [], (mountId) => {
        const separator = mountId.indexOf("@");
        const extensionName = mountId.slice(0, separator);
        const selector = mountId.slice(separator + 1);
        const mounter = mountMaps.get(toCamelCase2(extensionName));
        const controller = mounter && mounter.get(selector);
        return { element, mountId, controller, extensionName, selector };
      });
      registrations.sort(compareUnmountOrder);
      for (const { mountId, controller, extensionName, selector } of registrations) {
        await unmountRegistration(element, mountId, controller, extensionName, selector);
      }
    }
    function compareUnmountOrder(left, right) {
      var _a, _b, _c, _d, _e, _f;
      const leftRecord = (_a = mountRecords.get(left.element)) == null ? void 0 : _a.get(left.mountId);
      const rightRecord = (_b = mountRecords.get(right.element)) == null ? void 0 : _b.get(right.mountId);
      return ((_c = rightRecord == null ? void 0 : rightRecord.priority) != null ? _c : 0) - ((_d = leftRecord == null ? void 0 : leftRecord.priority) != null ? _d : 0) || ((_e = rightRecord == null ? void 0 : rightRecord.order) != null ? _e : 0) - ((_f = leftRecord == null ? void 0 : leftRecord.order) != null ? _f : 0);
    }
    function beginPendingMount(element, mountId) {
      let mounts = pendingMounts.get(element);
      if (!mounts) {
        mounts = /* @__PURE__ */ new Map();
        pendingMounts.set(element, mounts);
      }
      let finish;
      mounts.set(mountId, new Promise((resolve) => {
        finish = resolve;
      }));
      return function() {
        mounts.delete(mountId);
        if (!mounts.size) pendingMounts.delete(element);
        finish();
      };
    }
    function getPendingMount(element, mountId) {
      var _a;
      return ((_a = pendingMounts.get(element)) == null ? void 0 : _a.get(mountId)) || null;
    }
    function hasPendingMounts(element) {
      var _a;
      return Boolean((_a = pendingMounts.get(element)) == null ? void 0 : _a.size);
    }
    function resolveMountElement(elementOrId, method) {
      return resolveElementOrId(root2, elementOrId, {
        defaultElement: root2.document,
        allowedNodeTypes: [
          root2.Node.ELEMENT_NODE,
          root2.Node.DOCUMENT_NODE,
          root2.Node.DOCUMENT_FRAGMENT_NODE
        ],
        method
      });
    }
    function findElements(root3, selector) {
      const elements = [];
      if (root3.nodeType === Node.ELEMENT_NODE && root3.matches(selector)) {
        elements.push(root3);
      }
      if (root3.querySelectorAll) {
        root3.querySelectorAll(selector).forEach(function(element) {
          elements.push(element);
        });
      }
      return elements;
    }
    function isMounted(element, mountId = null) {
      const mounts = mountedElements.get(element);
      if (!mounts) return false;
      return mountId ? mounts.has(mountId) : mounts.size > 0;
    }
    function setMounted(element, mountId, mounted = true, priority = 0) {
      if (!mountedElements.has(element)) {
        mountedElements.set(element, /* @__PURE__ */ new Set());
      }
      const mounts = mountedElements.get(element);
      mounts[mounted ? "add" : "delete"](mountId);
      let records = mountRecords.get(element);
      if (mounted) {
        if (!records) {
          records = /* @__PURE__ */ new Map();
          mountRecords.set(element, records);
        }
        records.set(mountId, { priority, order: mountOrder++ });
      } else if (records) {
        records.delete(mountId);
        if (!records.size) mountRecords.delete(element);
      }
      if (mounts.size === 0) mountedElements.delete(element);
    }
  }

  // src/internal/build-mount-map-manager.js
  init_utils_name_case();
  /*! aellux.js | SPDX-License-Identifier: Apache-2.0 | See LICENSE for terms. */
  function buildMountMapManager(root2) {
    const { toCamelCase: toCamelCase2, fromCamelCase: fromCamelCase2 } = utils_name_case_default;
    const mountedElements = /* @__PURE__ */ new Map();
    const elementControllers = /* @__PURE__ */ new WeakMap();
    const maps = /* @__PURE__ */ new Map();
    let unmountQueue = Promise.resolve();
    let unmountScheduled = false;
    let rescanAfterUnmount = false;
    const helper = createMountHelper(
      root2,
      maps,
      mountedElements,
      elementControllers
    );
    const manager = {
      add,
      remove,
      controller,
      mount: helper.mount,
      unmount: helper.unmount,
      update: helper.update,
      destroy
    };
    let observer = null;
    if (typeof root2.MutationObserver === "function") {
      observer = new root2.MutationObserver((records) => {
        if (!hasRemovedNodes(records) || !hasDetachedMountedElement()) return;
        scheduleDetachedUnmount();
      });
      observer.observe(root2.document, { childList: true, subtree: true });
    }
    function destroy() {
      if (!observer) return false;
      observer.disconnect();
      observer = null;
      return true;
    }
    return manager;
    function scheduleUnmount(operation) {
      const task = unmountQueue.then(operation);
      unmountQueue = task.catch(() => {
      });
      return task;
    }
    function hasRemovedNodes(records) {
      for (const record of records) {
        if (record.removedNodes.length) return true;
      }
      return false;
    }
    function hasDetachedMountedElement() {
      for (const element of mountedElements.keys()) {
        if (!element.isConnected) return true;
      }
      return false;
    }
    function scheduleDetachedUnmount() {
      if (unmountScheduled) {
        rescanAfterUnmount = true;
        return;
      }
      unmountScheduled = true;
      scheduleUnmount(() => helper.unmountDetached()).then(
        finishDetachedUnmount,
        (error) => {
          const diagnostics = root2.AelluxJs.diagnostics;
          diagnostics.error(diagnostics.ERROR_EXTENSION_UNMOUNT, { cause: error });
          finishDetachedUnmount();
        }
      );
    }
    function finishDetachedUnmount() {
      unmountScheduled = false;
      if (!rescanAfterUnmount || !observer) return;
      rescanAfterUnmount = false;
      if (hasDetachedMountedElement()) scheduleDetachedUnmount();
    }
    function controller(elementOrId) {
      const diagnostics = root2.AelluxJs.diagnostics;
      elementOrId = resolveElementOrId(root2, elementOrId, { method: "controller" });
      if (!elementOrId) return null;
      const found = elementControllers.get(elementOrId);
      if (found) return found;
      diagnostics.error(diagnostics.ERROR_CONTROLLER_NOT_FOUND, {
        element: elementOrId,
        method: "controller",
        reason: "No completed mount exposes a controller for this element.",
        suggestion: "Register the required Extension, await $ae.mount(element), and inspect earlier load or mount diagnostics."
      });
      return null;
    }
    function keyFor(extensionName) {
      return toCamelCase2(fromCamelCase2(extensionName));
    }
    function add(options) {
      const diagnostics = root2.AelluxJs.diagnostics;
      function reject(argument, cause) {
        diagnostics.error(diagnostics.ERROR_MOUNT_REGISTRATION, {
          extension: options && options.extensionName,
          selector: options && options.selector,
          argument,
          cause
        });
        return false;
      }
      if (!options || typeof options !== "object" || Array.isArray(options))
        return reject("options");
      const { extensionName, selector, mount, unmount, update, controllers } = options;
      const priority = options.priority === void 0 ? 0 : options.priority;
      if (typeof extensionName !== "string" || !/^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$|^[a-z][a-zA-Z0-9]*$/.test(extensionName))
        return reject("extensionName");
      const key = keyFor(extensionName);
      if (key in Object.prototype || key === "prototype")
        return reject("extensionName");
      if (!Object.prototype.hasOwnProperty.call(root2.AelluxJs.registry.ext, key))
        return reject("extensionName");
      if (typeof selector !== "string" || !selector.trim())
        return reject("selector");
      try {
        root2.document.querySelector(selector);
      } catch (cause) {
        return reject("selector", cause);
      }
      if (typeof mount !== "function") return reject("mount");
      if (typeof priority !== "number" || !isFinite(priority)) return reject("priority");
      if (unmount !== void 0 && typeof unmount !== "function") return reject("unmount");
      if (update !== void 0 && typeof update !== "function") return reject("update");
      if (controllers !== void 0 && (!Array.isArray(controllers) || controllers.some((name) => typeof name !== "string" || !name.trim())))
        return reject("controllers");
      const allowed = ["extensionName", "selector", "mount", "unmount", "update", "controllers", "priority"];
      const unknown = Object.keys(options).find((name) => !allowed.includes(name));
      if (unknown) return reject(unknown);
      let map = maps.get(key);
      if (!map) {
        map = /* @__PURE__ */ new Map();
        maps.set(key, map);
      }
      if (map.has(selector)) return reject("selector");
      map.set(selector, { mount, unmount, update, controllers, priority });
      root2.AelluxJs.registry.extMounters[key] = [...map.keys()].join(",");
      return manager;
    }
    function remove({ extensionName, selector } = {}) {
      if (typeof extensionName !== "string" || !extensionName) return false;
      const key = keyFor(extensionName);
      const map = maps.get(key);
      if (!map) return false;
      if (hasMountedRegistration(extensionName, selector)) {
        const diagnostics = root2.AelluxJs.diagnostics;
        diagnostics.error(diagnostics.ERROR_MOUNT_MAP_IN_USE, {
          extension: fromCamelCase2(extensionName),
          selector
        });
        return false;
      }
      const removed = selector === void 0 ? true : map.delete(selector);
      if (selector === void 0 || map.size === 0) {
        maps.delete(key);
        delete root2.AelluxJs.registry.extMounters[key];
      } else if (removed) {
        root2.AelluxJs.registry.extMounters[key] = [...map.keys()].join(",");
      }
      return removed;
    }
    function hasMountedRegistration(extensionName, selector) {
      const prefix = `${fromCamelCase2(extensionName)}@`;
      const mountId = selector === void 0 ? null : `${prefix}${selector}`;
      for (const registrations of mountedElements.values()) {
        if (mountId) {
          if (registrations.has(mountId)) return true;
          continue;
        }
        for (const id of registrations) {
          if (id.startsWith(prefix)) return true;
        }
      }
      return false;
    }
  }

  // src/internal/create-aria-helper.js
  init_define_AELLUX_OFFICIAL_EXTENSION_MANIFEST();
  /*! aellux.js | SPDX-License-Identifier: Apache-2.0 | See LICENSE for terms. */
  function createAriaHelper() {
    const elements = /* @__PURE__ */ new WeakMap();
    let nextOrder = 0;
    function attributeName(name) {
      if (typeof name !== "string" || !/^(?:aria-)?[a-z][a-z0-9-]*$/.test(name)) {
        throw new TypeError("Invalid ARIA name");
      }
      return name.startsWith("aria-") ? name : `aria-${name}`;
    }
    function attributeValue(name, value) {
      if (value === null || value === void 0) {
        throw new TypeError("Use unset() for null");
      }
      if (Array.isArray(value)) {
        return value.join(" ");
      }
      if (name === "aria-hidden" && typeof value !== "boolean") {
        throw new TypeError("Invalid aria-hidden value");
      }
      return String(value);
    }
    function write(element, name, value) {
      if (value === null) {
        if (element.hasAttribute(name)) element.removeAttribute(name);
      } else if (element.getAttribute(name) !== value) {
        element.setAttribute(name, value);
      }
    }
    function reconcile(element, record, name) {
      var _a;
      let winner = null;
      let hidden = false;
      record.handlers.forEach((handler) => {
        if (!handler.values.has(name)) return;
        if (name === "aria-hidden" && handler.values.get(name) === "true") hidden = true;
        if (!winner || handler.priority > winner.priority || handler.priority === winner.priority && handler.order > winner.order) {
          winner = handler;
        }
      });
      if (!winner) {
        write(element, name, (_a = record.baseline.get(name)) != null ? _a : null);
        record.baseline.delete(name);
        return;
      }
      write(element, name, name === "aria-hidden" && hidden ? "true" : winner.values.get(name));
    }
    function register(element, options = {}) {
      if (!element || element.nodeType !== 1) {
        throw new TypeError("Invalid ARIA element");
      }
      const priority = options.priority === void 0 ? 0 : options.priority;
      if (typeof priority !== "number" || !Number.isFinite(priority)) {
        throw new TypeError("Invalid ARIA priority");
      }
      let record = elements.get(element);
      if (!record) {
        record = { handlers: /* @__PURE__ */ new Set(), baseline: /* @__PURE__ */ new Map() };
        elements.set(element, record);
      }
      const handler = { priority, order: nextOrder++, values: /* @__PURE__ */ new Map() };
      record.handlers.add(handler);
      let released = false;
      return {
        set(values) {
          if (released) return false;
          if (!values || typeof values !== "object") {
            throw new TypeError("Invalid ARIA values");
          }
          const updates = Object.entries(values).map(([key, value]) => {
            const name = attributeName(key);
            return [name, attributeValue(name, value)];
          });
          updates.forEach(([name, value]) => {
            if (!record.baseline.has(name)) record.baseline.set(name, element.getAttribute(name));
            handler.values.set(name, value);
            reconcile(element, record, name);
          });
          return true;
        },
        unset(key) {
          if (released) return false;
          const name = attributeName(key);
          if (!handler.values.delete(name)) return false;
          reconcile(element, record, name);
          return true;
        },
        initial(key) {
          const name = attributeName(key);
          return record.baseline.has(name) ? record.baseline.get(name) : element.getAttribute(name);
        },
        release() {
          if (released) return false;
          released = true;
          record.handlers.delete(handler);
          handler.values.forEach((_, name) => reconcile(element, record, name));
          handler.values.clear();
          if (!record.handlers.size) elements.delete(element);
          return true;
        }
      };
    }
    return { register };
  }

  // src/internal/create-css-motion-controller.js
  init_define_AELLUX_OFFICIAL_EXTENSION_MANIFEST();
  /*! aellux.js | SPDX-License-Identifier: Apache-2.0 | See LICENSE for terms. */
  function createCssMotionController(root2, getAelluxJs) {
    const operations = /* @__PURE__ */ new Map();
    const lightweightProperties = /* @__PURE__ */ new Set([
      "transform",
      "opacity",
      "--ae-pop-progress",
      "--ae-unpop-progress",
      "--ae-present-pop-phase",
      "--ae-present-unpop-phase"
    ]);
    let nextId = 4e6;
    function id() {
      return nextId++;
    }
    function supported(element) {
      if (getAelluxJs().options.cssMotionController === false) return false;
      const Animation = root2.Animation;
      return !!(element && typeof element.getAnimations === "function" && Animation && Animation.prototype && typeof Animation.prototype.pause === "function" && "currentTime" in Animation.prototype);
    }
    function cancel(operationId) {
      const operation = operations.get(operationId);
      if (!operation) return false;
      operation.cancelled = true;
      getAelluxJs().waitLayout.cancel(operationId);
      const nativeResolve = operation.nativeResolve;
      release(operation, false);
      if (nativeResolve) nativeResolve({ id: operationId, status: "aborted", mode: "native" });
      return true;
    }
    function run(element, options = {}) {
      const AelluxJs2 = getAelluxJs();
      const operationId = options.id;
      if (!Number.isSafeInteger(operationId))
        return Promise.reject(new TypeError("motion.run() requires a safe integer ID"));
      if (!element || element.nodeType !== 1 || typeof options.apply !== "function")
        return Promise.reject(new TypeError("motion.run() requires an Element and apply callback"));
      cancel(operationId);
      const operation = {
        id: operationId,
        element,
        options,
        animations: [],
        before: /* @__PURE__ */ new Set(),
        start: 0,
        endTime: 0,
        done: false,
        cancelled: false,
        controlled: false,
        captureFailed: false,
        conservative: false,
        nativeTimer: null,
        nativeResolve: null
      };
      operations.set(operationId, operation);
      if (AelluxJs2.currentPreference("reduced-motion") === "reduced") {
        options.apply();
        operations.delete(operationId);
        return Promise.resolve({ id: operationId, status: "completed", mode: "reduced" });
      }
      if (!supported(element)) return nativeRun(operation);
      try {
        for (const animation of element.getAnimations()) operation.before.add(animation);
        options.apply();
      } catch (error) {
        operations.delete(operationId);
        return Promise.reject(error);
      }
      const requestedMaxFPS = options.maxFPS === void 0 ? AelluxJs2.layoutMaxFPS(element) : options.maxFPS;
      const externalAbort = typeof options.abort === "function" ? options.abort : null;
      const shouldAbort = () => operation.cancelled || !element.isConnected || (externalAbort ? externalAbort() : false);
      const captureResult = AelluxJs2.waitLayout.sequence(operationId, {
        read: () => capture(operation),
        update: (animations) => prepare(operation, animations),
        abort: shouldAbort
      });
      return captureResult.then((sequenceResult) => {
        if (operation.cancelled || operations.get(operationId) !== operation) {
          release(operation, false);
          return { id: operationId, status: "aborted", mode: "native" };
        }
        if (sequenceResult.status !== "completed") {
          release(operation, false);
          return { id: operationId, status: sequenceResult.status, mode: "native" };
        }
        if (operation.captureFailed && !operation.cancelled) {
          release(operation, false);
          operations.set(operationId, operation);
          return nativeWait(operation);
        }
        const policyFPS = operation.conservative ? propertyPolicyFPS(AelluxJs2.options.cssMotionPropertyMaxFPS, AelluxJs2) : void 0;
        const maxFPS = minimumFPS(requestedMaxFPS, policyFPS);
        operation.visualFPS = maxFPS;
        AelluxJs2.waitLayout.setVisualFPSLimit(operation.id, maxFPS);
        return AelluxJs2.waitLayout.sequence(operationId, {
          update: () => advance(operation),
          repeat: { ms: 0 },
          abort: () => operation.done || shouldAbort()
        }).then((progressResult) => {
          const completed = operation.done && !operation.cancelled;
          release(operation, completed);
          return {
            id: operationId,
            status: completed ? "completed" : progressResult.status,
            mode: "controlled"
          };
        });
      }, (error) => {
        release(operation, false, true);
        throw error;
      });
    }
    function capture(operation) {
      operation.element.getBoundingClientRect();
      const animations = operation.element.getAnimations().filter((animation) => !operation.before.has(animation) && controllable(animation));
      diagnoseMotionResources(getAelluxJs(), operation.element, animations, operation.options.extension || "css-motion");
      return animations;
    }
    function controllable(animation) {
      try {
        const effect = animation && animation.effect;
        return !!(effect && typeof effect.getComputedTiming === "function" && typeof animation.pause === "function");
      } catch (_) {
        return false;
      }
    }
    function prepare(operation, animations) {
      if (!animations.length) {
        operation.captureFailed = true;
        operation.done = true;
        return;
      }
      let endTime = 0;
      operation.animations = animations;
      for (const animation of animations) {
        animation.pause();
        animation.currentTime = 0;
        const timing = animation.effect.getComputedTiming();
        const end = Number(timing.endTime);
        if (Number.isFinite(end)) endTime = Math.max(endTime, end);
        applyAelluxEasing(operation, animation);
        if (!onlyLightweightProperties(animation)) operation.conservative = true;
      }
      operation.endTime = endTime;
      operation.start = now();
      operation.controlled = true;
      if (!(endTime > 0)) operation.done = true;
    }
    function onlyLightweightProperties(animation) {
      try {
        if (typeof root2.CSSTransition === "function" && animation instanceof root2.CSSTransition) {
          return lightweightProperties.has(animation.transitionProperty);
        }
        const frames = animation.effect.getKeyframes();
        if (!frames.length) return false;
        const metadata = /* @__PURE__ */ new Set(["offset", "computedOffset", "easing", "composite"]);
        let found = false;
        for (const frame of frames) {
          for (const property of Object.keys(frame)) {
            if (metadata.has(property)) continue;
            found = true;
            if (!lightweightProperties.has(property)) return false;
          }
        }
        return found;
      } catch (_) {
        return false;
      }
    }
    function positiveFPS(value, fallback) {
      const number = Number(value);
      return Number.isFinite(number) && number > 0 ? number : fallback;
    }
    function propertyPolicyFPS(value, AelluxJs2) {
      if (value === null || value === 0) return void 0;
      const number = Number(value);
      if (Number.isFinite(number) && number > 0) return number;
      if (value !== void 0) {
        AelluxJs2.diagnostics.warn(
          AelluxJs2.diagnostics.WARN_CSS_MOTION_PROPERTY_MAX_FPS_INVALID,
          {
            extension: "core",
            option: "cssMotionPropertyMaxFPS",
            attribute: "cssMotionPropertyMaxFPS",
            value,
            fallback: 55,
            reason: "CSS Motion frame rate must be finite and greater than zero; using 55 FPS.",
            suggestion: "Use a positive finite number or omit the option for the default."
          }
        );
      }
      return 55;
    }
    function minimumFPS(first, second) {
      const values = [first, second].filter((value) => Number.isFinite(value) && value > 0);
      return values.length ? Math.min(...values) : void 0;
    }
    function advance(operation) {
      if (!operation.controlled || operation.done) return;
      const elapsed = Math.max(0, now() - operation.start);
      const time = Math.min(elapsed, operation.endTime);
      for (const animation of operation.animations) animation.currentTime = time;
      if (elapsed >= operation.endTime) operation.done = true;
    }
    function applyAelluxEasing(operation, animation) {
      const name = operation.options.easing;
      if (!name || !root2.CSS || typeof root2.CSS.supports !== "function" || !animation.effect || typeof animation.effect.updateTiming !== "function") return;
      const easing = sampledLinear(name);
      if (!easing || !root2.CSS.supports("animation-timing-function", easing)) return;
      animation.effect.updateTiming({ easing });
    }
    function sampledLinear(name) {
      const AelluxJs2 = getAelluxJs();
      const points = [];
      try {
        for (let index = 0; index <= 60; index++) {
          const progress = index / 60;
          const value = AelluxJs2.ease(name, progress);
          if (!Number.isFinite(value)) return null;
          points.push(`${round(value)} ${round(progress * 100)}%`);
        }
      } catch (_) {
        return null;
      }
      return `linear(${points.join(", ")})`;
    }
    function nativeRun(operation) {
      let before = operation.before;
      if (getAelluxJs().options.environment === "development" && typeof operation.element.getAnimations === "function")
        before = new Set(operation.element.getAnimations());
      operation.options.apply();
      return nativeWait(operation, before);
    }
    function nativeWait(operation, before = operation.before) {
      const animations = typeof operation.element.getAnimations === "function" ? operation.element.getAnimations().filter((animation) => !operation.before.has(animation)) : [];
      diagnoseMotionResources(
        getAelluxJs(),
        operation.element,
        before === operation.before ? animations : animations.filter((animation) => !before.has(animation)),
        operation.options.extension || "css-motion"
      );
      return new Promise((resolve) => {
        operation.nativeResolve = resolve;
        const complete = () => {
          if (operations.get(operation.id) !== operation) return;
          operations.delete(operation.id);
          operation.nativeResolve = null;
          resolve({ id: operation.id, status: "completed", mode: "native" });
        };
        if (animations.length && animations.every((animation) => animation.finished && typeof animation.finished.then === "function")) {
          Promise.all(animations.map((animation) => animation.finished.catch(() => void 0))).then(complete);
          return;
        }
        const explicit = Number(operation.options.nativeDuration);
        const duration = Number.isFinite(explicit) ? explicit : cssMotionTime(operation.element);
        if (Number.isFinite(duration) && duration > 0) {
          operation.nativeTimer = root2.setTimeout(complete, duration);
        } else {
          Promise.resolve().then(complete);
        }
      });
    }
    function cssMotionTime(element) {
      try {
        const style = root2.getComputedStyle(element);
        return Math.max(
          listTime(style.animationDuration, style.animationDelay, style.animationIterationCount),
          listTime(style.transitionDuration, style.transitionDelay)
        );
      } catch (_) {
        return 0;
      }
    }
    function listTime(durations, delays, iterations) {
      const durationList = String(durations || "0s").split(",");
      const delayList = String(delays || "0s").split(",");
      const iterationList = String(iterations || "1").split(",");
      const count = Math.max(durationList.length, delayList.length, iterationList.length);
      let maximum = 0;
      for (let index = 0; index < count; index++) {
        const duration = cssTime(durationList[index % durationList.length]);
        const delay = cssTime(delayList[index % delayList.length]);
        const rawIterations = iterationList[index % iterationList.length].trim();
        const iterationCount = rawIterations === "infinite" ? 1 : Number(rawIterations);
        maximum = Math.max(maximum, Math.max(0, delay) + duration * (Number.isFinite(iterationCount) ? Math.max(0, iterationCount) : 1));
      }
      return maximum;
    }
    function cssTime(value) {
      const text = String(value || "0s").trim().toLowerCase();
      const number = parseFloat(text);
      if (!Number.isFinite(number)) return 0;
      return text.endsWith("ms") ? number : number * 1e3;
    }
    function release(operation, finish, resume = false) {
      if (operations.get(operation.id) === operation)
        getAelluxJs().waitLayout.setVisualFPSLimit(operation.id, null);
      if (operation.nativeTimer !== null) root2.clearTimeout(operation.nativeTimer);
      operation.nativeTimer = null;
      for (const animation of operation.animations) {
        try {
          if (finish) {
            animation.finish();
            if (typeof root2.CSSTransition === "function" && animation instanceof root2.CSSTransition)
              animation.cancel();
          } else if (resume) animation.play();
          else animation.cancel();
        } catch (_) {
        }
      }
      operation.animations.length = 0;
      if (operations.get(operation.id) === operation) operations.delete(operation.id);
    }
    function now() {
      return root2.performance && typeof root2.performance.now === "function" ? root2.performance.now() : Date.now();
    }
    function round(value) {
      return Math.round(value * 1e5) / 1e5;
    }
    return Object.freeze({ run, cancel, id, supported });
  }

  // src/internal/ease.js
  init_define_AELLUX_OFFICIAL_EXTENSION_MANIFEST();
  /*! aellux.js | SPDX-License-Identifier: Apache-2.0 | See LICENSE for terms. */
  var EASE_PREFIX = "ease";
  var IN = "in";
  var OUT = "out";
  var IN_OUT = "inout";
  var DIRECTIONS = [IN_OUT, OUT, IN];
  var QUAD = "quad";
  var CUBIC = "cubic";
  var QUART = "quart";
  var QUINT = "quint";
  var SINE = "sine";
  var EXPO = "expo";
  var CIRC = "circ";
  var BACK = "back";
  var ELASTIC = "elastic";
  var BOUNCE = "bounce";
  var FAMILIES = [QUAD, CUBIC, QUART, QUINT, SINE, EXPO, CIRC, BACK, ELASTIC, BOUNCE];
  var ALIASES = {
    quadratic: QUAD,
    quartic: QUART,
    quintic: QUINT,
    sinusoidal: SINE,
    exponential: EXPO,
    circular: CIRC
  };
  var CSS_NUMBER = /^[+-]?(?:\d*\.\d+|\d+)(?:e[+-]?\d+)?$/i;
  function bezierCoordinate(u, p1, p2) {
    const v = 1 - u;
    return 3 * v * v * u * p1 + 3 * v * u * u * p2 + u * u * u;
  }
  function cubicBezier(t, x1, y1, x2, y2) {
    if (![t, x1, y1, x2, y2].every((value) => typeof value === "number" && Number.isFinite(value))) {
      throw new TypeError("cubicBezier(t, x1, y1, x2, y2) requires finite numbers");
    }
    if (x1 < 0 || x1 > 1 || x2 < 0 || x2 > 1) {
      throw new RangeError("Cubic bezier x coordinates must be between 0 and 1");
    }
    t = Math.min(1, Math.max(0, t));
    if (t === 0 || t === 1) return t;
    if (x1 === y1 && x2 === y2) return t;
    let low = 0;
    let high = 1;
    let u = t;
    for (let i = 0; i < 40; i++) {
      const x = bezierCoordinate(u, x1, x2);
      if (x === t) break;
      if (x < t) low = u;
      else high = u;
      u = (low + high) / 2;
    }
    return bezierCoordinate(u, y1, y2);
  }
  function bounceOut(t) {
    const n = 7.5625;
    const d = 2.75;
    if (t < 1 / d) return n * t * t;
    if (t < 2 / d) {
      t -= 1.5 / d;
      return n * t * t + 0.75;
    }
    if (t < 2.5 / d) {
      t -= 2.25 / d;
      return n * t * t + 0.9375;
    }
    t -= 2.625 / d;
    return n * t * t + 0.984375;
  }
  function easeIn(family, t) {
    switch (family) {
      case QUAD:
        return t * t;
      case CUBIC:
        return t * t * t;
      case QUART:
        return t * t * t * t;
      case QUINT:
        return t * t * t * t * t;
      case SINE:
        return 1 - Math.cos(t * Math.PI / 2);
      case EXPO:
        return t === 0 ? 0 : Math.pow(2, 10 * t - 10);
      case CIRC:
        return 1 - Math.sqrt(1 - t * t);
      case BACK:
        return t * t * (2.70158 * t - 1.70158);
      case ELASTIC:
        return t === 0 || t === 1 ? t : -Math.pow(2, 10 * t - 10) * Math.sin((10 * t - 10.75) * 2 * Math.PI / 3);
      case BOUNCE:
        return 1 - bounceOut(1 - t);
      default:
        throw new RangeError(`Unknown easing family: ${family}`);
    }
  }
  function ease(name, t) {
    if (typeof name !== "string" || typeof t !== "number" || !Number.isFinite(t)) {
      throw new TypeError("ease(name, t) requires a name and a finite number");
    }
    t = Math.min(1, Math.max(0, t));
    const bezier = /^cubic-bezier\(([^()]*)\)$/i.exec(name.trim());
    if (bezier) {
      const points = bezier[1].split(",").map((value) => value.trim());
      if (points.length !== 4 || !points.every((value) => CSS_NUMBER.test(value))) {
        throw new RangeError(`Invalid cubic bezier: ${name}`);
      }
      return cubicBezier(t, ...points.map(Number));
    }
    let key = name.replace(/[\s_-]/g, "").toLowerCase();
    if (key.startsWith(EASE_PREFIX)) key = key.slice(EASE_PREFIX.length);
    if (key === "linear") return t;
    if (key === "smoothstep") return t * t * (3 - 2 * t);
    if (key === "smootherstep") return t * t * t * (t * (6 * t - 15) + 10);
    let family = "";
    let direction = "";
    for (const candidate of DIRECTIONS) {
      if (key.endsWith(candidate)) {
        family = key.slice(0, -candidate.length);
        direction = candidate;
        break;
      }
      if (key.startsWith(candidate)) {
        family = key.slice(candidate.length);
        direction = candidate;
        break;
      }
    }
    family = ALIASES[family] || family;
    if (!FAMILIES.includes(family)) throw new RangeError(`Unknown easing: ${name}`);
    if (direction === IN) return easeIn(family, t);
    if (direction === OUT) return 1 - easeIn(family, 1 - t);
    if (family === BACK) {
      const c = 1.70158 * 1.525;
      const x = t < 0.5 ? 2 * t : 2 * t - 2;
      return t < 0.5 ? x * x * ((c + 1) * x - c) / 2 : (x * x * ((c + 1) * x + c) + 2) / 2;
    }
    if (family === ELASTIC) {
      if (t === 0 || t === 1) return t;
      const wave = Math.sin((20 * t - 11.125) * 2 * Math.PI / 4.5);
      return t < 0.5 ? -Math.pow(2, 20 * t - 10) * wave / 2 : Math.pow(2, -20 * t + 10) * wave / 2 + 1;
    }
    return t < 0.5 ? easeIn(family, 2 * t) / 2 : 1 - easeIn(family, 2 - 2 * t) / 2;
  }

  // src/aellux.orchestrator.js
  init_utils_name_case();
  /*! aellux.js | SPDX-License-Identifier: Apache-2.0 | See LICENSE for terms. */
  (function(root2) {
    "use strict";
    const { toCamelCase: toCamelCase2, fromCamelCase: fromCamelCase2 } = utils_name_case_default;
    const officialPackage = "@aelluxjs/core";
    const orchestratorVersion = true ? "0.1.0-beta.10" : "0.1.0-beta.10";
    if (root2.AelluxJs.version !== orchestratorVersion) {
      const error = root2.AelluxJs.diagnostics.error(
        root2.AelluxJs.diagnostics.ERROR_RUNTIME_VERSION_MISMATCH,
        { expected: root2.AelluxJs.version, found: orchestratorVersion }
      );
      root2.AelluxJs.orchestratorVersion = orchestratorVersion;
      root2.AelluxJs.startAelluxJs = () => Promise.reject(error);
      return;
    }
    root2.AelluxJs.orchestratorVersion = orchestratorVersion;
    const extensionPromises = {};
    const aria = createAriaHelper();
    const mountManager = buildMountMapManager(root2);
    const layoutScheduler = buildLayoutScheduler();
    const motion = createCssMotionController(root2, () => root2.AelluxJs);
    root2.AelluxJs = Object.assign(
      root2.AelluxJs,
      {
        async startAelluxJs() {
          if (root2.AelluxJs.bundledExtensions) {
            Object.keys(root2.AelluxJs.bundledExtensions).forEach((key) => {
              if (!(key in AelluxJs.registry.ext)) AelluxJs.ext(key);
              const name = fromCamelCase2(key);
              const metadata = AelluxJs.extIndex.official && AelluxJs.extIndex.official.extensions[name];
              if (metadata && metadata.coreCompatibility) {
                AelluxJs.registry.ext[key].coreCompatibility = metadata.coreCompatibility;
                AelluxJs.registry.ext[key].official = true;
              }
            });
          }
          await new Promise((resolve) => {
            const startCallback = function() {
              if (AelluxJs.options.skipGlobalMount === true) {
                AelluxJs.off("$DOMContentLoaded", startCallback);
                resolve();
                return;
              }
              AelluxJs.mount().then(function() {
                AelluxJs.off("$DOMContentLoaded", startCallback);
                resolve();
              });
            };
            if (document.readyState === "loading")
              AelluxJs.on("$DOMContentLoaded", startCallback, { once: true });
            else
              startCallback();
          });
          AelluxJs.dispatch("Ready");
          return true;
        },
        async mount(elementOrId, extensionNames = null) {
          return mountManager.mount(elementOrId, extensionNames);
        },
        async unmount(elementOrId, extensionNames = null) {
          return mountManager.unmount(elementOrId, extensionNames);
        },
        async destroy() {
          if (await destroyExtensions(null, () => AelluxJs.waitLayout.clear()) === false)
            return false;
          mountManager.destroy();
        },
        async destroyExtensions(extensionNames) {
          return destroyExtensions(extensionNames);
        },
        dispatchFrom(from, event, options) {
          options = options || {};
          if (!("bubbles" in options)) {
            options.bubbles = true;
          }
          if (!("cancelable" in options)) {
            options.cancelable = false;
          }
          return from.dispatchEvent(
            new CustomEvent(
              AelluxJs.eventName(event),
              options
            )
          );
        },
        wait(extensionName) {
          return getExtension(extensionName);
        },
        request: defaultRequest,
        ease,
        aria,
        motion,
        waitLayout: layoutScheduler,
        mountManager
      }
    );
    root2[root2.AelluxJs.shortJSName] = root2.AelluxJs;
    async function destroyExtensions(extensionNames, onUnmounted) {
      if (typeof extensionNames === "string") extensionNames = [extensionNames];
      if (!extensionNames) extensionNames = Object.keys(AelluxJs.registry.ext);
      extensionNames = extensionNames.map((_) => fromCamelCase2(_));
      try {
        if (await AelluxJs.unmount(document, extensionNames) === false) return false;
      } catch (error) {
        AelluxJs.diagnostics.error(
          AelluxJs.diagnostics.ERROR_EXTENSION_UNMOUNT,
          { cause: error, extensions: extensionNames }
        );
      }
      if (onUnmounted) onUnmounted();
      for (const extensionName of extensionNames) {
        const key = toCamelCase2(extensionName);
        let extension;
        try {
          if (!extensionPromises[key]) continue;
          extension = await extensionPromises[key];
          if (extension && extension.destroy) await extension.destroy();
        } catch (error) {
          AelluxJs.diagnostics.error(
            AelluxJs.diagnostics.ERROR_EXTENSION_DESTROY,
            { cause: error, extension: extensionName }
          );
        } finally {
          delete AelluxJs.ext[key];
          delete extensionPromises[key];
          delete AelluxJs.registry.ext[key];
          mountManager.remove({ extensionName });
          delete AelluxJs.registry.lazyExtSelectors[key];
          removeExtensionAssets(extensionName);
          if (extension) extension.initialized = false;
        }
      }
    }
    function getExtension(extensionName) {
      const request = parseExtensionRequest(extensionName);
      extensionName = request.name;
      const key = toCamelCase2(extensionName);
      if (extensionPromises[key])
        return extensionPromises[key];
      if (!(key in AelluxJs.registry.ext)) {
        return Promise.reject(AelluxJs.diagnostics.error(
          AelluxJs.diagnostics.ERROR_EXTENSION_NOT_REGISTERED,
          { extension: extensionName }
        ));
      }
      if (AelluxJs.ext[key]) {
        if (AelluxJs.ext[key].initialized) {
          extensionPromises[key] = Promise.resolve(AelluxJs.ext[key]);
        } else {
          const registration = AelluxJs.registry.ext[key];
          extensionPromises[key] = (registration.loadStyle && registration.loadStyle !== "false" ? appendExtensionAssets(extensionName) : Promise.resolve()).then(() => extensionInitialize(extensionName)).catch((error) => {
            if (!error || !error.aelluxCompatibility) {
              AelluxJs.diagnostics.error(
                AelluxJs.diagnostics.ERROR_EXTENSION_INITIALIZE,
                { cause: error, extension: extensionName }
              );
            }
            delete extensionPromises[key];
            return null;
          });
        }
        return extensionPromises[key];
      }
      const bundledLoader = AelluxJs.bundledExtensions ? AelluxJs.bundledExtensions[key] : null;
      extensionPromises[key] = Promise.resolve().then(() => {
        const registration = AelluxJs.registry.ext[key];
        return (registration.implicit || request.version) && !bundledLoader && !AelluxJs.ext[key] ? resolveImplicitRegistration(extensionName, registration, request.version) : registration;
      }).then(async (data) => {
        if (!hasCompatibleBuild(data)) {
          AelluxJs.diagnostics.error(
            AelluxJs.diagnostics.ERROR_EXTENSION_INCOMPATIBLE,
            {
              extension: extensionName,
              runtime: AelluxJs.diagnostics.legacy ? "legacy" : "modern",
              builds: data && data.builds
            }
          );
          delete AelluxJs.registry.lazyExtSelectors[key];
          return null;
        }
        if (!AelluxJs.ext[key]) await appendExtensionAssets(extensionName, bundledLoader);
        if (!AelluxJs.ext[key].initialized) return extensionInitialize(extensionName);
        return AelluxJs.ext[key];
      }).catch((error) => {
        if (!error || !error.aelluxCompatibility) {
          const registration = AelluxJs.registry.ext[key];
          if (registration && registration.implicit && !registration.manifestResolved) {
            AelluxJs.diagnostics.error(
              AelluxJs.diagnostics.ERROR_EXTENSION_INDEX_NOT_FOUND,
              { extension: extensionName }
            );
          }
          AelluxJs.diagnostics.error(
            AelluxJs.diagnostics.ERROR_EXTENSION_INITIALIZE,
            { cause: error, extension: extensionName }
          );
        }
        delete extensionPromises[key];
        return null;
      });
      return extensionPromises[key];
    }
    function parseExtensionRequest(value) {
      const text = String(value || "").trim();
      const match = /^([a-z][a-z0-9-]*)(?:@([0-9]+(?:\.[0-9]+){0,2}(?:-[0-9A-Za-z.-]+)?))?$/i.exec(text);
      return { name: fromCamelCase2(match ? match[1] : text), version: match && match[2] || null };
    }
    async function extensionInitialize(extensionName) {
      extensionName = fromCamelCase2(extensionName);
      const key = toCamelCase2(extensionName);
      const registration = AelluxJs.registry.ext[key];
      if (registration.coreCompatibility && !versionSatisfies(AelluxJs.version, registration.coreCompatibility)) {
        const context = {
          extension: extensionName,
          coreVersion: AelluxJs.version,
          coreCompatibility: registration.coreCompatibility
        };
        if (registration.skipCompatibilityCheck === true) {
          AelluxJs.diagnostics.warn(
            AelluxJs.diagnostics.WARN_EXTENSION_COMPATIBILITY_SKIPPED,
            __spreadProps(__spreadValues({}, context), { explicitlySkipped: true })
          );
        } else {
          const error = AelluxJs.diagnostics.error(
            AelluxJs.diagnostics.ERROR_EXTENSION_VERSION_INCOMPATIBLE,
            context
          );
          error.aelluxCompatibility = true;
          throw error;
        }
      }
      const options = AelluxJs.options.extensions[key] || {};
      await AelluxJs.ext[key].init(options);
      AelluxJs.ext[key].initialized = true;
      delete AelluxJs.registry.lazyExtSelectors[key];
      return AelluxJs.ext[key];
    }
    async function appendExtensionAssets(extensionName, bundledLoader = null) {
      extensionName = fromCamelCase2(extensionName);
      const key = toCamelCase2(extensionName);
      const data = AelluxJs.registry.ext[key];
      const useLegacyBuild = AelluxJs.diagnostics.legacy || data.builds.indexOf("modern") === -1;
      const artifact = data.artifacts && data.artifacts[useLegacyBuild ? "legacy" : "modern"];
      const url = data.url.replace(/^\.\//, AelluxJs.aelluxBasePath);
      const scriptURL = artifact ? artifact.url : useLegacyBuild ? toLegacyScriptURL(url) : url;
      const minifiedScript = /\.min\.js(?=[?#]|$)/.test(scriptURL);
      const scriptVariant = useLegacyBuild ? minifiedScript ? "legacyMin" : "legacy" : minifiedScript ? "modernMin" : "modern";
      const loadPromises = [];
      for (const dependency of data.dependencies || []) {
        if (typeof dependency === "string") continue;
        loadPromises.push(AelluxJs.dep(
          dependency.label,
          dependency.url,
          { integrity: dependency.integrity, crossOrigin: dependency.crossOrigin }
        ));
      }
      if (bundledLoader) {
        loadPromises.push(Promise.resolve().then(() => bundledLoader()));
      } else if (!AelluxJs.ext[key]) {
        loadPromises.push(new Promise(
          (resolve, reject) => {
            const attr = AelluxJs.attr("ext");
            const script = document.createElement("script");
            script.src = scriptURL;
            script.setAttribute(attr, extensionName);
            applyAssetIntegrity(script, artifact && artifact.integrity || getExtensionIntegrity(data, scriptVariant, scriptURL), data.crossOrigin);
            assetLoadHelper(script, {
              loadCallback: resolve,
              errorCallback: reject
            });
          }
        ));
      }
      const defaultStyle = data.loadStyle === true || data.loadStyle === "true";
      const fullStyle = AelluxJs.bundledExtensions && (bundledLoader || data.official) && document.querySelector(`link[${AelluxJs.attr("full-style")}]`);
      if (data.loadStyle && data.loadStyle !== "false" && !(defaultStyle && fullStyle)) {
        loadPromises.push(new Promise(
          (resolve) => {
            const styleDefaultURL = data.loadStyle === true || data.loadStyle === "true" || data.loadStyle === "";
            const href = data.styleArtifact ? data.styleArtifact.url : styleDefaultURL ? url.replace(/\.js(?=[?#]|$)/, ".css") : data.loadStyle;
            const attrStyle = AelluxJs.attr("ext-style");
            const link = document.createElement("link");
            link.href = href;
            link.rel = "stylesheet";
            link.setAttribute(attrStyle, extensionName);
            applyAssetIntegrity(link, data.styleArtifact && data.styleArtifact.integrity || getExtensionIntegrity(data, "style", href), data.crossOrigin);
            assetLoadHelper(link, {
              loadCallback: resolve,
              errorCallback: () => {
                AelluxJs.diagnostics.warn(
                  AelluxJs.diagnostics.WARN_EXTENSION_STYLE_LOAD,
                  {
                    extension: extensionName,
                    element: link,
                    attribute: "href",
                    value: link.href,
                    url: link.href,
                    reason: "The Extension stylesheet could not be loaded.",
                    suggestion: "Check the stylesheet URL, network response, integrity metadata and CSP style-src policy."
                  }
                );
                resolve();
              }
            });
          }
        ));
      }
      return Promise.all(loadPromises);
    }
    function getExtensionIntegrity(data, variant, url) {
      const declared = data.integrity;
      const explicit = typeof declared === "string" ? variant === "style" ? null : declared : declared && declared[variant];
      if (explicit) return explicit;
      const basePath = AelluxJs.aelluxBasePath;
      if (!url.startsWith(basePath)) return null;
      const filename = url.slice(basePath.length);
      const builtin = AelluxJs.coreAssetIntegrity;
      return builtin && Object.prototype.hasOwnProperty.call(builtin, filename) ? builtin[filename] : null;
    }
    function applyAssetIntegrity(asset, integrity, crossOrigin) {
      if (integrity) asset.setAttribute("integrity", integrity);
      if (integrity || crossOrigin || AelluxJs.options.crossOrigin) {
        asset.setAttribute("crossorigin", crossOrigin || AelluxJs.options.crossOrigin || "anonymous");
      }
    }
    function toLegacyScriptURL(url) {
      return url.replace(
        /(?:\.legacy)?(?:\.min)?\.js(?=[?#]|$)/,
        ".legacy" + (AelluxJs.minified ? ".min" : "") + ".js"
      );
    }
    function removeExtensionAssets(extensionName) {
      const scriptAttribute = AelluxJs.attr("ext");
      const styleAttribute = AelluxJs.attr("ext-style");
      document.querySelectorAll(`script[${scriptAttribute}], link[${styleAttribute}]`).forEach((asset) => {
        if (asset.getAttribute(scriptAttribute) === extensionName || asset.getAttribute(styleAttribute) === extensionName) {
          asset.remove();
        }
      });
    }
    async function resolveImplicitRegistration(extensionName, registration, requestedVersion = null) {
      const officialURL = AelluxJs.extIndex.officialURL || AelluxJs.aelluxBasePath + "aellux.extensions.min.json";
      const requestedURL = requestedVersion && requestedVersion !== AelluxJs.version ? `https://cdn.jsdelivr.net/npm/${officialPackage}@${encodeURIComponent(requestedVersion)}/dist/aellux.extensions.min.json` : officialURL;
      let entry = null;
      let sourceURL = requestedURL;
      try {
        const embeddedOfficial = requestedVersion ? null : AelluxJs.extIndex.official;
        const embeddedEntry = embeddedOfficial && embeddedOfficial.extensions[extensionName];
        const official = embeddedEntry && embeddedEntry.builds ? embeddedOfficial : await loadExtensionIndex(requestedVersion ? `official@${requestedVersion}` : "official", requestedURL);
        entry = official.extensions[extensionName] || null;
      } catch (error) {
        reportIndexFailure(error, "official", requestedURL);
      }
      if (!entry && AelluxJs.extIndex.fallbackURL) {
        sourceURL = AelluxJs.extIndex.fallbackURL;
        try {
          const fallback = AelluxJs.extIndex.fallback || await loadExtensionIndex("fallback", sourceURL);
          entry = fallback.extensions[extensionName] || null;
        } catch (error) {
          reportIndexFailure(error, "custom", sourceURL);
        }
      }
      if (!entry) return registration;
      applyManifestEntry(registration, entry, sourceURL, extensionName);
      return registration;
    }
    function loadExtensionIndex(kind, url) {
      const promiseKey = kind + "Promise";
      if (AelluxJs.extIndex[promiseKey]) return AelluxJs.extIndex[promiseKey];
      validateManifestURL(url, kind);
      AelluxJs.extIndex[promiseKey] = AelluxJs.request(url).then((response) => response.json()).then((index) => {
        validateExtensionIndex(index, kind, url);
        AelluxJs.extIndex[kind] = index;
        AelluxJs.diagnostics.info(
          AelluxJs.diagnostics.INFO_EXTENSION_INDEX_LOADED,
          { source: kind, url, extensions: Object.keys(index.extensions).length }
        );
        return index;
      }).catch((error) => {
        AelluxJs.extIndex[promiseKey] = null;
        throw error;
      });
      return AelluxJs.extIndex[promiseKey];
    }
    function validateManifestURL(url, kind) {
      let parsed;
      try {
        parsed = new URL(url, document.baseURI);
      } catch (_) {
        throw manifestError(kind, url, "valid URL");
      }
      const development = AelluxJs.options.environment === "development";
      if (parsed.protocol !== "https:" && parsed.origin !== location.origin && !development) {
        throw manifestError(kind, url, "HTTPS for external manifests");
      }
    }
    function validateExtensionIndex(index, kind, url) {
      if (!index || index.schemaVersion !== 1 || typeof index.coreVersion !== "string" || !index.extensions || typeof index.extensions !== "object" || Array.isArray(index.extensions)) {
        throw manifestError(kind, url, "schemaVersion 1, coreVersion, and extensions object");
      }
      if (index.coreVersion !== AelluxJs.version) {
        throw manifestError(
          kind,
          url,
          `coreVersion ${AelluxJs.version} (received ${index.coreVersion})`
        );
      }
      for (const [name, entry] of Object.entries(index.extensions)) {
        if (!/^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/.test(name) || !entry || typeof entry.coreCompatibility !== "string" || !entry.builds || typeof entry.builds !== "object") {
          throw manifestError(kind, url, `valid metadata for ${name}`);
        }
        for (const variant of ["modern", "legacy"]) {
          const artifact = entry.builds[variant];
          if (!artifact) continue;
          if (typeof artifact.url !== "string" || typeof artifact.integrity !== "string" || !/^sha384-[A-Za-z0-9+/]+={0,2}$/.test(artifact.integrity)) {
            throw manifestError(kind, url, `URL and SHA-384 integrity for ${name}/${variant}`);
          }
          validateArtifactURL(artifact.url, url, kind);
          if (artifact.regular) {
            if (typeof artifact.regular.url !== "string" || !/^sha384-[A-Za-z0-9+/]+={0,2}$/.test(artifact.regular.integrity || "")) {
              throw manifestError(kind, url, `regular URL and SHA-384 integrity for ${name}/${variant}`);
            }
            validateArtifactURL(artifact.regular.url, url, kind);
          }
        }
        if (!entry.builds.modern && !entry.builds.legacy)
          throw manifestError(kind, url, `a runtime build for ${name}`);
        if (entry.style) {
          if (typeof entry.style.url !== "string" || !/^sha384-[A-Za-z0-9+/]+={0,2}$/.test(entry.style.integrity || "")) {
            throw manifestError(kind, url, `URL and SHA-384 integrity for ${name}/style`);
          }
          validateArtifactURL(entry.style.url, url, kind);
          if (entry.style.regular) {
            if (typeof entry.style.regular.url !== "string" || !/^sha384-[A-Za-z0-9+/]+={0,2}$/.test(entry.style.regular.integrity || "")) {
              throw manifestError(kind, url, `regular URL and SHA-384 integrity for ${name}/style`);
            }
            validateArtifactURL(entry.style.regular.url, url, kind);
          }
        }
        if (!Array.isArray(entry.dependencies)) {
          throw manifestError(kind, url, `dependencies array for ${name}`);
        }
        for (const dependency of entry.dependencies) {
          if (typeof dependency === "string") continue;
          if (!dependency || typeof dependency.label !== "string" || !dependency.label.trim() || typeof dependency.url !== "string" || typeof dependency.integrity !== "string" || !/^sha384-[A-Za-z0-9+/]+={0,2}$/.test(dependency.integrity)) {
            throw manifestError(kind, url, `dependency URL and SHA-384 integrity for ${name}`);
          }
          validateArtifactURL(dependency.url, url, kind);
        }
      }
    }
    function validateArtifactURL(url, manifestURL, kind) {
      let parsed;
      try {
        parsed = new URL(url, new URL(manifestURL, document.baseURI));
      } catch (_) {
        throw manifestError(kind, manifestURL, `valid artifact URL: ${url}`);
      }
      const development = AelluxJs.options.environment === "development";
      if (parsed.protocol !== "https:" && parsed.origin !== location.origin && !development)
        throw manifestError(kind, manifestURL, `HTTPS artifact URL: ${url}`);
    }
    function manifestError(kind, url, expected) {
      return AelluxJs.diagnostics.create(
        AelluxJs.diagnostics.ERROR_EXTENSION_INDEX_INVALID,
        { source: kind, url, expected }
      );
    }
    function reportIndexFailure(error, source, url) {
      if (error && error.code === AelluxJs.diagnostics.ERROR_EXTENSION_INDEX_INVALID.code) {
        AelluxJs.diagnostics.error(
          AelluxJs.diagnostics.ERROR_EXTENSION_INDEX_INVALID,
          { source, url, expected: error.context && error.context.expected, cause: error }
        );
      } else {
        AelluxJs.diagnostics.error(
          AelluxJs.diagnostics.ERROR_EXTENSION_INDEX_LOAD,
          { source, url, cause: error }
        );
      }
    }
    function applyManifestEntry(registration, entry, manifestURL, extensionName) {
      const base = new URL(manifestURL, document.baseURI);
      const artifacts = {};
      for (const variant of ["modern", "legacy"]) {
        if (entry.builds[variant] && (!registration.explicitBuilds || registration.builds.includes(variant))) {
          const declared = !AelluxJs.minified && entry.builds[variant].regular ? entry.builds[variant].regular : entry.builds[variant];
          artifacts[variant] = {
            url: new URL(declared.url, base).href,
            integrity: declared.integrity
          };
        }
      }
      const selected = artifacts[AelluxJs.diagnostics.legacy ? "legacy" : "modern"] || !AelluxJs.diagnostics.legacy && artifacts.legacy;
      registration.artifacts = artifacts;
      registration.manifestResolved = true;
      registration.builds = Object.keys(artifacts);
      if (selected) registration.url = selected.url;
      registration.coreCompatibility = entry.coreCompatibility;
      registration.dependencies = (entry.dependencies || []).map((dependency) => typeof dependency === "string" ? dependency : __spreadProps(__spreadValues({}, dependency), {
        url: new URL(dependency.url, base).href
      }));
      registration.official = AelluxJs.extIndex.official && AelluxJs.extIndex.official.extensions[extensionName] === entry;
      if (entry.style && registration.loadStyle && registration.loadStyle !== "false") {
        const declaredStyle = !AelluxJs.minified && entry.style.regular ? entry.style.regular : entry.style;
        registration.styleArtifact = {
          url: new URL(declaredStyle.url, base).href,
          integrity: declaredStyle.integrity
        };
      }
    }
    function versionSatisfies(version, range) {
      if (typeof range !== "string" || !range.trim()) return true;
      return range.split("||").some((group) => group.trim().split(/\s+/).every((token) => {
        if (token === "*" || token.toLowerCase() === "latest") return true;
        const match = token.match(/^(\^|~|>=|<=|>|<|=)?(.+)$/);
        if (!match) return false;
        const operator = match[1] || "=";
        const comparison = compareVersions(version, match[2]);
        if (operator === "=") return comparison === 0;
        if (operator === ">") return comparison > 0;
        if (operator === ">=") return comparison >= 0;
        if (operator === "<") return comparison < 0;
        if (operator === "<=") return comparison <= 0;
        const current = parseVersion(version);
        const expected = parseVersion(match[2]);
        if (!current || !expected || comparison < 0) return false;
        if (operator === "~") return current[0] === expected[0] && current[1] === expected[1];
        return expected[0] > 0 ? current[0] === expected[0] : expected[1] > 0 ? current[0] === 0 && current[1] === expected[1] : current[0] === 0 && current[1] === 0 && current[2] === expected[2];
      }));
    }
    function compareVersions(first, second) {
      const a = parseVersion(first);
      const b = parseVersion(second);
      if (!a || !b) return first === second ? 0 : -1;
      for (let index = 0; index < 3; index++) if (a[index] !== b[index]) return a[index] > b[index] ? 1 : -1;
      if (a[3] === b[3]) return 0;
      if (!a[3]) return 1;
      if (!b[3]) return -1;
      return a[3] > b[3] ? 1 : -1;
    }
    function parseVersion(version) {
      const match = String(version).match(/^(\d+)\.(\d+)\.(\d+)(?:-([0-9A-Za-z.-]+))?/);
      return match ? [Number(match[1]), Number(match[2]), Number(match[3]), match[4] || ""] : null;
    }
    function hasCompatibleBuild(data) {
      if (!data || !Array.isArray(data.builds) || data.builds.length === 0) return false;
      if (AelluxJs.diagnostics.legacy) return data.builds.indexOf("legacy") !== -1;
      return data.builds.indexOf("modern") !== -1 || data.builds.indexOf("legacy") !== -1;
    }
    function defaultRequest(url, options) {
      var requestOptions = Object.assign(
        { method: "GET", credentials: "same-origin" },
        options
      );
      return fetch(url, requestOptions).then(function(response) {
        if (!response.ok) {
          var error = new Error("HTTP " + response.status + " " + response.statusText);
          error.name = "AelluxJsRequestError";
          error.status = response.status;
          error.statusText = response.statusText;
          error.response = response;
          throw error;
        }
        return response;
      }).catch(function(error) {
        throw error;
      });
    }
    ;
  })(typeof globalThis !== "undefined" ? globalThis : window);

  // src/aellux.full.js
  /*! aellux.js | SPDX-License-Identifier: Apache-2.0 | See LICENSE for terms. */
  var root = typeof globalThis !== "undefined" ? globalThis : window;
  root.AelluxJs.bundledExtensions = Object.freeze({
    "preference": () => Promise.resolve().then(() => (init_aellux_ext_preference(), aellux_ext_preference_exports)),
    "stateNavigation": () => Promise.resolve().then(() => (init_aellux_ext_state_navigation(), aellux_ext_state_navigation_exports)),
    "feedback": () => Promise.resolve().then(() => (init_aellux_ext_feedback(), aellux_ext_feedback_exports)),
    "focus": () => Promise.resolve().then(() => (init_aellux_ext_focus(), aellux_ext_focus_exports)),
    "point": () => Promise.resolve().then(() => (init_aellux_ext_point(), aellux_ext_point_exports)),
    "anchor": () => Promise.resolve().then(() => (init_aellux_ext_anchor(), aellux_ext_anchor_exports)),
    "ajaxHref": () => Promise.resolve().then(() => (init_aellux_ext_ajax_href(), aellux_ext_ajax_href_exports)),
    "adaptive": () => Promise.resolve().then(() => (init_aellux_ext_adaptive(), aellux_ext_adaptive_exports)),
    "present": () => Promise.resolve().then(() => (init_aellux_ext_present(), aellux_ext_present_exports))
  });
  root.AelluxJs.extIndex.official = typeof define_AELLUX_OFFICIAL_EXTENSION_MANIFEST_default !== "undefined" ? define_AELLUX_OFFICIAL_EXTENSION_MANIFEST_default : null;
  root.AelluxJs.ext("adaptive", { loadWhen: "[data-ae-adaptive]" });
  root.AelluxJs.ext("anchor", { loadWhen: "[data-ae-anchor]" });
  root.AelluxJs.ext("overflow-marquee", { loadWhen: "[data-ae-overflow-marquee]" });
  root.AelluxJs.ext("ajax-href", { loadWhen: "a[data-ae-ajax-href]" });
  root.AelluxJs.ext("feedback", { loadWhen: "[data-ae-feedback]" });
  root.AelluxJs.ext("focus", { loadWhen: "[data-ae-focus]" });
  root.AelluxJs.ext("point", { loadWhen: "[data-ae-point]" });
  root.AelluxJs.ext("present", {
    loadWhen: "[data-ae-present],[data-ae-present-group],[data-ae-trigger],[data-ae-dismiss],[data-ae-target]"
  });
  root.AelluxJs.ext("scrollbox", { loadWhen: "[data-ae-scrollbox]" });
  root.AelluxJs.ext("scrollbox-snap", { loadWhen: "[data-ae-scrollbox-snap]" });
})();
//# sourceMappingURL=aellux.full.js.map
