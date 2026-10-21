(function() {
  // src/internal/find-duplicate-attributes.js
  function _createForOfIteratorHelper(r, e) {
    var t = "undefined" != typeof Symbol && r[Symbol.iterator] || r["@@iterator"];
    if (!t) {
      if (Array.isArray(r) || (t = _unsupportedIterableToArray(r)) || e && r && "number" == typeof r.length) {
        t && (r = t);
        var _n = 0, F = function F2() {
        };
        return { s: F, n: function n() {
          return _n >= r.length ? { done: true } : { done: false, value: r[_n++] };
        }, e: function e2(r2) {
          throw r2;
        }, f: F };
      }
      throw new TypeError("Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.");
    }
    var o, a = true, u = false;
    return { s: function s() {
      t = t.call(r);
    }, n: function n() {
      var r2 = t.next();
      return a = r2.done, r2;
    }, e: function e2(r2) {
      u = true, o = r2;
    }, f: function f() {
      try {
        a || null == t.return || t.return();
      } finally {
        if (u) throw o;
      }
    } };
  }
  function _unsupportedIterableToArray(r, a) {
    if (r) {
      if ("string" == typeof r) return _arrayLikeToArray(r, a);
      var t = {}.toString.call(r).slice(8, -1);
      return "Object" === t && r.constructor && (t = r.constructor.name), "Map" === t || "Set" === t ? Array.from(r) : "Arguments" === t || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(t) ? _arrayLikeToArray(r, a) : void 0;
    }
  }
  function _arrayLikeToArray(r, a) {
    (null == a || a > r.length) && (a = r.length);
    for (var e = 0, n = Array(a); e < a; e++) n[e] = r[e];
    return n;
  }
  /*! aellux.js | SPDX-License-Identifier: Apache-2.0 | See LICENSE for terms. */
  function findDuplicateAttributes(html) {
    var duplicates = [];
    var space = /[\t\n\f\r ]/;
    var lower = function lower2(text) {
      return text.replace(/[A-Z]/g, function(char2) {
        return char2.toLowerCase();
      });
    };
    var index = 0, lineIndex = 0, line = 1, column = 1;
    while ((index = html.indexOf("<", index)) !== -1) {
      if (html.startsWith("<!--", index)) {
        var end = /--!?>/.exec(html.slice(index + 4));
        index = end ? index + 4 + end.index + end[0].length : html.length;
        continue;
      }
      if (html.startsWith("<![CDATA[", index)) {
        var _end = html.indexOf("]]>", index + 9);
        index = _end < 0 ? html.length : _end + 3;
        continue;
      }
      if (/[!?/]/.test(html[index + 1] || "")) {
        var _end2 = html.indexOf(">", index + 2);
        index = _end2 < 0 ? html.length : _end2 + 1;
        continue;
      }
      if (!/[a-z]/i.test(html[index + 1] || "")) {
        index++;
        continue;
      }
      var tagStart = ++index;
      while (index < html.length && !space.test(html[index]) && !/[/>]/.test(html[index])) index++;
      var tagName = lower(html.slice(tagStart, index));
      var attributes = /* @__PURE__ */ new Map();
      while (index < html.length && html[index] !== ">") {
        if (space.test(html[index]) || html[index] === "/") {
          index++;
          continue;
        }
        var offset = index++;
        while (index < html.length && !space.test(html[index]) && !/[=/>]/.test(html[index])) index++;
        var attribute = lower(html.slice(offset, index).replace(/\0/g, "\uFFFD"));
        while (space.test(html[index] || "")) index++;
        var value = "";
        if (html[index] === "=") {
          index++;
          while (space.test(html[index] || "")) index++;
          var quote = html[index];
          if (quote === '"' || quote === "'") {
            var start = ++index;
            while (index < html.length && html[index] !== quote) index++;
            value = html.slice(start, index);
            if (index < html.length) index++;
          } else {
            var _start = index;
            while (index < html.length && !space.test(html[index]) && html[index] !== ">") index++;
            value = html.slice(_start, index);
          }
        }
        var previous = attributes.get(attribute);
        if (previous) {
          previous.values.push(value);
          if (!previous.duplicate) {
            while (lineIndex < offset) {
              var char = html[lineIndex++];
              if (char === "\r" || char === "\n" && html[lineIndex - 2] !== "\r") {
                line++;
                column = 1;
              } else if (char !== "\n") column++;
            }
            previous.duplicate = {
              tagName: tagName,
              attribute: attribute,
              value: previous.values[0],
              values: previous.values,
              offset: offset,
              line: line,
              column: column
            };
          }
        } else attributes.set(attribute, {
          values: [value]
        });
      }
      if (index >= html.length) break;
      var _iterator = _createForOfIteratorHelper(attributes.values()), _step;
      try {
        for (_iterator.s(); !(_step = _iterator.n()).done; ) {
          var _attribute = _step.value;
          if (_attribute.duplicate) duplicates.push(_attribute.duplicate);
        }
      } catch (err) {
        _iterator.e(err);
      } finally {
        _iterator.f();
      }
      index++;
      if (tagName === "plaintext") break;
      if (/^(script|style|textarea|title|xmp|iframe|noembed|noframes|noscript)$/.test(tagName)) {
        var closing = new RegExp("</".concat(tagName, "(?=[\\t\\n\\f\\r />])"), "ig");
        closing.lastIndex = index;
        var _end3 = closing.exec(html);
        index = _end3 ? _end3.index : html.length;
      }
    }
    return duplicates;
  }

  // src/internal/report-configuration.js
  /*! aellux.js | SPDX-License-Identifier: Apache-2.0 | See LICENSE for terms. */
  function reportConfiguration(api, name, context) {
    if (context.element && context.attribute && !("value" in context)) context.value = context.element.getAttribute(context.attribute);
    return api.diagnostics.warn(api.diagnostics[name], context);
  }

  // src/internal/validate-html-source.js
  function _typeof(o) {
    "@babel/helpers - typeof";
    return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function(o2) {
      return typeof o2;
    } : function(o2) {
      return o2 && "function" == typeof Symbol && o2.constructor === Symbol && o2 !== Symbol.prototype ? "symbol" : typeof o2;
    }, _typeof(o);
  }
  function ownKeys(e, r) {
    var t = Object.keys(e);
    if (Object.getOwnPropertySymbols) {
      var o = Object.getOwnPropertySymbols(e);
      r && (o = o.filter(function(r2) {
        return Object.getOwnPropertyDescriptor(e, r2).enumerable;
      })), t.push.apply(t, o);
    }
    return t;
  }
  function _objectSpread(e) {
    for (var r = 1; r < arguments.length; r++) {
      var t = null != arguments[r] ? arguments[r] : {};
      r % 2 ? ownKeys(Object(t), true).forEach(function(r2) {
        _defineProperty(e, r2, t[r2]);
      }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(e, Object.getOwnPropertyDescriptors(t)) : ownKeys(Object(t)).forEach(function(r2) {
        Object.defineProperty(e, r2, Object.getOwnPropertyDescriptor(t, r2));
      });
    }
    return e;
  }
  function _defineProperty(e, r, t) {
    return (r = _toPropertyKey(r)) in e ? Object.defineProperty(e, r, { value: t, enumerable: true, configurable: true, writable: true }) : e[r] = t, e;
  }
  function _toPropertyKey(t) {
    var i = _toPrimitive(t, "string");
    return "symbol" == _typeof(i) ? i : i + "";
  }
  function _toPrimitive(t, r) {
    if ("object" != _typeof(t) || !t) return t;
    var e = t[Symbol.toPrimitive];
    if (void 0 !== e) {
      var i = e.call(t, r || "default");
      if ("object" != _typeof(i)) return i;
      throw new TypeError("@@toPrimitive must return a primitive value.");
    }
    return ("string" === r ? String : Number)(t);
  }
  function _createForOfIteratorHelper2(r, e) {
    var t = "undefined" != typeof Symbol && r[Symbol.iterator] || r["@@iterator"];
    if (!t) {
      if (Array.isArray(r) || (t = _unsupportedIterableToArray2(r)) || e && r && "number" == typeof r.length) {
        t && (r = t);
        var _n = 0, F = function F2() {
        };
        return { s: F, n: function n() {
          return _n >= r.length ? { done: true } : { done: false, value: r[_n++] };
        }, e: function e2(r2) {
          throw r2;
        }, f: F };
      }
      throw new TypeError("Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.");
    }
    var o, a = true, u = false;
    return { s: function s() {
      t = t.call(r);
    }, n: function n() {
      var r2 = t.next();
      return a = r2.done, r2;
    }, e: function e2(r2) {
      u = true, o = r2;
    }, f: function f() {
      try {
        a || null == t.return || t.return();
      } finally {
        if (u) throw o;
      }
    } };
  }
  function _unsupportedIterableToArray2(r, a) {
    if (r) {
      if ("string" == typeof r) return _arrayLikeToArray2(r, a);
      var t = {}.toString.call(r).slice(8, -1);
      return "Object" === t && r.constructor && (t = r.constructor.name), "Map" === t || "Set" === t ? Array.from(r) : "Arguments" === t || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(t) ? _arrayLikeToArray2(r, a) : void 0;
    }
  }
  function _arrayLikeToArray2(r, a) {
    (null == a || a > r.length) && (a = r.length);
    for (var e = 0, n = Array(a); e < a; e++) n[e] = r[e];
    return n;
  }
  /*! aellux.js | SPDX-License-Identifier: Apache-2.0 | See LICENSE for terms. */
  function validateHTMLSource(api, html, source) {
    if (api.options.environment !== "development") return;
    var _iterator = _createForOfIteratorHelper2(findDuplicateAttributes(html)), _step;
    try {
      for (_iterator.s(); !(_step = _iterator.n()).done; ) {
        var duplicate = _step.value;
        var attribute = duplicate.attribute;
        reportConfiguration(api, "WARN_ATTRIBUTE_DUPLICATE", _objectSpread(_objectSpread({
          extension: "core",
          source: source
        }, duplicate), {}, {
          reason: "The ".concat(attribute, " attribute occurs more than once on the same start tag; the HTML parser keeps the first value and discards the others."),
          suggestion: attribute === "class" ? "Combine all class names in one class attribute, separated by spaces." : attribute === "style" ? "Combine the intended CSS declarations in one style attribute, separated by semicolons." : "Keep one ".concat(attribute, " attribute with the intended value.")
        }));
      }
    } catch (err) {
      _iterator.e(err);
    } finally {
      _iterator.f();
    }
  }

  // src/src/aellux.ext.ajax-href.js
  function _regenerator() {
    /*! regenerator-runtime -- Copyright (c) 2014-present, Facebook, Inc. -- license (MIT): https://github.com/babel/babel/blob/main/packages/babel-helpers/LICENSE */
    var e, t, r = "function" == typeof Symbol ? Symbol : {}, n = r.iterator || "@@iterator", o = r.toStringTag || "@@toStringTag";
    function i(r2, n2, o2, i2) {
      var c2 = n2 && n2.prototype instanceof Generator ? n2 : Generator, u2 = Object.create(c2.prototype);
      return _regeneratorDefine2(u2, "_invoke", (function(r3, n3, o3) {
        var i3, c3, u3, f2 = 0, p = o3 || [], y = false, G = { p: 0, n: 0, v: e, a: d, f: d.bind(e, 4), d: function d2(t2, r4) {
          return i3 = t2, c3 = 0, u3 = e, G.n = r4, a;
        } };
        function d(r4, n4) {
          for (c3 = r4, u3 = n4, t = 0; !y && f2 && !o4 && t < p.length; t++) {
            var o4, i4 = p[t], d2 = G.p, l = i4[2];
            r4 > 3 ? (o4 = l === n4) && (u3 = i4[(c3 = i4[4]) ? 5 : (c3 = 3, 3)], i4[4] = i4[5] = e) : i4[0] <= d2 && ((o4 = r4 < 2 && d2 < i4[1]) ? (c3 = 0, G.v = n4, G.n = i4[1]) : d2 < l && (o4 = r4 < 3 || i4[0] > n4 || n4 > l) && (i4[4] = r4, i4[5] = n4, G.n = l, c3 = 0));
          }
          if (o4 || r4 > 1) return a;
          throw y = true, n4;
        }
        return function(o4, p2, l) {
          if (f2 > 1) throw TypeError("Generator is already running");
          for (y && 1 === p2 && d(p2, l), c3 = p2, u3 = l; (t = c3 < 2 ? e : u3) || !y; ) {
            i3 || (c3 ? c3 < 3 ? (c3 > 1 && (G.n = -1), d(c3, u3)) : G.n = u3 : G.v = u3);
            try {
              if (f2 = 2, i3) {
                if (c3 || (o4 = "next"), t = i3[o4]) {
                  if (!(t = t.call(i3, u3))) throw TypeError("iterator result is not an object");
                  if (!t.done) return t;
                  u3 = t.value, c3 < 2 && (c3 = 0);
                } else 1 === c3 && (t = i3.return) && t.call(i3), c3 < 2 && (u3 = TypeError("The iterator does not provide a '" + o4 + "' method"), c3 = 1);
                i3 = e;
              } else if ((t = (y = G.n < 0) ? u3 : r3.call(n3, G)) !== a) break;
            } catch (t2) {
              i3 = e, c3 = 1, u3 = t2;
            } finally {
              f2 = 1;
            }
          }
          return { value: t, done: y };
        };
      })(r2, o2, i2), true), u2;
    }
    var a = {};
    function Generator() {
    }
    function GeneratorFunction() {
    }
    function GeneratorFunctionPrototype() {
    }
    t = Object.getPrototypeOf;
    var c = [][n] ? t(t([][n]())) : (_regeneratorDefine2(t = {}, n, function() {
      return this;
    }), t), u = GeneratorFunctionPrototype.prototype = Generator.prototype = Object.create(c);
    function f(e2) {
      return Object.setPrototypeOf ? Object.setPrototypeOf(e2, GeneratorFunctionPrototype) : (e2.__proto__ = GeneratorFunctionPrototype, _regeneratorDefine2(e2, o, "GeneratorFunction")), e2.prototype = Object.create(u), e2;
    }
    return GeneratorFunction.prototype = GeneratorFunctionPrototype, _regeneratorDefine2(u, "constructor", GeneratorFunctionPrototype), _regeneratorDefine2(GeneratorFunctionPrototype, "constructor", GeneratorFunction), GeneratorFunction.displayName = "GeneratorFunction", _regeneratorDefine2(GeneratorFunctionPrototype, o, "GeneratorFunction"), _regeneratorDefine2(u), _regeneratorDefine2(u, o, "Generator"), _regeneratorDefine2(u, n, function() {
      return this;
    }), _regeneratorDefine2(u, "toString", function() {
      return "[object Generator]";
    }), (_regenerator = function _regenerator2() {
      return { w: i, m: f };
    })();
  }
  function _regeneratorDefine2(e, r, n, t) {
    var i = Object.defineProperty;
    try {
      i({}, "", {});
    } catch (e2) {
      i = 0;
    }
    _regeneratorDefine2 = function _regeneratorDefine(e2, r2, n2, t2) {
      function o(r3, n3) {
        _regeneratorDefine2(e2, r3, function(e3) {
          return this._invoke(r3, n3, e3);
        });
      }
      r2 ? i ? i(e2, r2, { value: n2, enumerable: !t2, configurable: !t2, writable: !t2 }) : e2[r2] = n2 : (o("next", 0), o("throw", 1), o("return", 2));
    }, _regeneratorDefine2(e, r, n, t);
  }
  function _createForOfIteratorHelper3(r, e) {
    var t = "undefined" != typeof Symbol && r[Symbol.iterator] || r["@@iterator"];
    if (!t) {
      if (Array.isArray(r) || (t = _unsupportedIterableToArray3(r)) || e && r && "number" == typeof r.length) {
        t && (r = t);
        var _n = 0, F = function F2() {
        };
        return { s: F, n: function n() {
          return _n >= r.length ? { done: true } : { done: false, value: r[_n++] };
        }, e: function e2(r2) {
          throw r2;
        }, f: F };
      }
      throw new TypeError("Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.");
    }
    var o, a = true, u = false;
    return { s: function s() {
      t = t.call(r);
    }, n: function n() {
      var r2 = t.next();
      return a = r2.done, r2;
    }, e: function e2(r2) {
      u = true, o = r2;
    }, f: function f() {
      try {
        a || null == t.return || t.return();
      } finally {
        if (u) throw o;
      }
    } };
  }
  function _unsupportedIterableToArray3(r, a) {
    if (r) {
      if ("string" == typeof r) return _arrayLikeToArray3(r, a);
      var t = {}.toString.call(r).slice(8, -1);
      return "Object" === t && r.constructor && (t = r.constructor.name), "Map" === t || "Set" === t ? Array.from(r) : "Arguments" === t || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(t) ? _arrayLikeToArray3(r, a) : void 0;
    }
  }
  function _arrayLikeToArray3(r, a) {
    (null == a || a > r.length) && (a = r.length);
    for (var e = 0, n = Array(a); e < a; e++) n[e] = r[e];
    return n;
  }
  function asyncGeneratorStep(n, t, e, r, o, a, c) {
    try {
      var i = n[a](c), u = i.value;
    } catch (n2) {
      return void e(n2);
    }
    i.done ? t(u) : Promise.resolve(u).then(r, o);
  }
  function _asyncToGenerator(n) {
    return function() {
      var t = this, e = arguments;
      return new Promise(function(r, o) {
        var a = n.apply(t, e);
        function _next(n2) {
          asyncGeneratorStep(a, r, o, _next, _throw, "next", n2);
        }
        function _throw(n2) {
          asyncGeneratorStep(a, r, o, _next, _throw, "throw", n2);
        }
        _next(void 0);
      });
    };
  }
  /*! aellux.js | SPDX-License-Identifier: Apache-2.0 | See LICENSE for terms. */
  (function(root) {
    "use strict";
    var AelluxJs = root.AelluxJs;
    var extensionName = "ajax-href";
    if (!AelluxJs) {
      throw new Error('[aellux.js] Cannot attach the "'.concat(extensionName, '" extension: root.AelluxJs is not defined. Load the aellux.js boot script before this extension.'));
    }
    AelluxJs.extAttach(extensionName, {
      init: init,
      destroy: destroy,
      load: load
    });
    var attr = {
      ajaxHref: AelluxJs.attr(extensionName)
    };
    function init() {
      document.addEventListener("click", onClick);
      AelluxJs.on("SnapshotRestore", OnSnapshotRestoreAjax);
    }
    function destroy() {
      document.removeEventListener("click", onClick);
      AelluxJs.off("SnapshotRestore", OnSnapshotRestoreAjax);
      if (previousController) {
        previousController.abort();
      }
    }
    var previousController = null;
    function load(_x, _x2) {
      return _load.apply(this, arguments);
    }
    function _load() {
      _load = _asyncToGenerator(/* @__PURE__ */ _regenerator().m(function _callee(url, selectors) {
        var options, selectorList, elements, _iterator2, _step2, _selector, _currentElement, controller, response, html, loadedDocument, _iterator3, _step3, selector, currentElement, loadedElement, replacement, _args = arguments, _t, _t2, _t3, _t4;
        return _regenerator().w(function(_context) {
          while (1) switch (_context.p = _context.n) {
            case 0:
              options = _args.length > 2 && _args[2] !== void 0 ? _args[2] : {};
              options = options || {};
              selectorList = parseSelectors(selectors);
              if (selectorList) {
                _context.n = 1;
                break;
              }
              return _context.a(2, null);
            case 1:
              elements = /* @__PURE__ */ new Map();
              _iterator2 = _createForOfIteratorHelper3(selectorList);
              try {
                for (_iterator2.s(); !(_step2 = _iterator2.n()).done; ) {
                  _selector = _step2.value;
                  _currentElement = document.querySelector(_selector);
                  if (_currentElement) elements.set(_selector, _currentElement);
                  else selectorDiagnostic(_selector, "No current element matches the selector.");
                }
              } catch (err) {
                _iterator2.e(err);
              } finally {
                _iterator2.f();
              }
              if (elements.size) {
                _context.n = 2;
                break;
              }
              return _context.a(2, null);
            case 2:
              if (previousController) {
                previousController.abort();
              }
              controller = "AbortController" in window ? new AbortController() : {
                signal: null,
                abort: function abort() {
                  return null;
                }
              };
              previousController = controller;
              elements.forEach(function(currentElement2) {
                if (AelluxJs.ext.feedback) {
                  AelluxJs.ext.feedback.busy(currentElement2, "Ajax loading", true);
                  AelluxJs.ext.feedback.progress(currentElement2, "Ajax loading", 0);
                }
              });
              if (!("ignoreHistory" in options) || !options.ignoreHistory) {
                AelluxJs.dispatch("PushAjaxReplace", {
                  detail: {
                    url: url,
                    selectors: selectors
                  }
                });
              }
              AelluxJs.dispatch("AjaxHrefStart");
              _context.p = 3;
              _context.n = 4;
              return AelluxJs.request(url, {
                signal: controller.signal
              });
            case 4:
              response = _context.v;
              _context.n = 5;
              return response.text();
            case 5:
              html = _context.v;
              validateHTMLSource(AelluxJs, html, response.url || String(url));
              loadedDocument = new DOMParser().parseFromString(html, "text/html");
              _iterator3 = _createForOfIteratorHelper3(selectorList);
              _context.p = 6;
              _iterator3.s();
            case 7:
              if ((_step3 = _iterator3.n()).done) {
                _context.n = 14;
                break;
              }
              selector = _step3.value;
              currentElement = elements.get(selector);
              if (currentElement) {
                _context.n = 8;
                break;
              }
              return _context.a(3, 13);
            case 8:
              loadedElement = loadedDocument.querySelector(selector);
              _t = !loadedElement;
              if (_t) {
                _context.n = 10;
                break;
              }
              _context.n = 9;
              return AelluxJs.unmount(currentElement);
            case 9:
              _t2 = _context.v;
              _t = _t2 === false;
            case 10:
              if (!_t) {
                _context.n = 11;
                break;
              }
              if (!loadedElement) selectorDiagnostic(selector, "No response element matches the selector.", currentElement);
              if (AelluxJs.ext.feedback) {
                AelluxJs.ext.feedback.busy(currentElement, "Ajax loading", false);
                AelluxJs.ext.feedback.progress(currentElement, "Ajax loading", 1);
              }
              return _context.a(3, 13);
            case 11:
              replacement = document.importNode(loadedElement, true);
              currentElement.parentNode.replaceChild(replacement, currentElement);
              if (selector === "title") {
                AelluxJs.dispatch("UpdateBaseTitle", {
                  detail: {
                    title: replacement.textContent
                  }
                });
              }
              _context.n = 12;
              return AelluxJs.mount(replacement);
            case 12:
              if (AelluxJs.ext.feedback) {
                AelluxJs.ext.feedback.busy(replacement, "Ajax loaded", false);
                AelluxJs.ext.feedback.progress(replacement, "Ajax loaded", 1);
              }
            case 13:
              _context.n = 7;
              break;
            case 14:
              _context.n = 16;
              break;
            case 15:
              _context.p = 15;
              _t3 = _context.v;
              _iterator3.e(_t3);
            case 16:
              _context.p = 16;
              _iterator3.f();
              return _context.f(16);
            case 17:
              AelluxJs.dispatch("AjaxHrefLoaded");
              _context.n = 20;
              break;
            case 18:
              _context.p = 18;
              _t4 = _context.v;
              selectorList.forEach(function(selector2) {
                var currentElement2 = elements.get(selector2);
                if (!currentElement2) return;
                if (AelluxJs.ext.feedback) {
                  AelluxJs.ext.feedback.busy(currentElement2, "Ajax loading", false);
                  AelluxJs.ext.feedback.progress(currentElement2, "Ajax loading", 1);
                }
              });
              AelluxJs.dispatch("AjaxHrefError");
              if (!(_t4.name === "AbortError")) {
                _context.n = 19;
                break;
              }
              return _context.a(2, null);
            case 19:
              throw _t4;
            case 20:
              _context.p = 20;
              if (previousController === controller) previousController = null;
              AelluxJs.dispatch("AjaxHrefComplete");
              return _context.f(20);
            case 21:
              return _context.a(2);
          }
        }, _callee, null, [[6, 15, 16, 17], [3, 18, 20, 21]]);
      }));
      return _load.apply(this, arguments);
    }
    function selectorDiagnostic(value, reason) {
      var element = arguments.length > 2 && arguments[2] !== void 0 ? arguments[2] : null;
      AelluxJs.diagnostics.warn(AelluxJs.diagnostics.WARN_CONFIGURATION_TARGET, {
        extension: extensionName,
        element: element,
        attribute: attr.ajaxHref,
        value: value,
        reason: reason,
        suggestion: "Use valid CSS selectors identifying content in both the current document and the AJAX response."
      });
    }
    function parseSelectors(selectors) {
      var list = [];
      var _iterator = _createForOfIteratorHelper3(Array.isArray(selectors) ? selectors : [selectors]), _step;
      try {
        for (_iterator.s(); !(_step = _iterator.n()).done; ) {
          var input = _step.value;
          if (typeof input !== "string" || !input.trim()) {
            selectorDiagnostic(input, "Expected a nonempty selector string or array of strings.");
            return null;
          }
          var start = 0, depth = 0, quote = null;
          for (var index = 0; index <= input.length; index++) {
            var char = input[index];
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
              var selector = input.slice(start, index).trim();
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
      } catch (err) {
        _iterator.e(err);
      } finally {
        _iterator.f();
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
      var target = event.target && event.target.nodeType === 1 ? event.target : event.target && event.target.parentElement;
      var link = target && target.closest("a[".concat(attr.ajaxHref, "]"));
      if (!link || !link.href || link.tagName !== "A") return;
      var rawHref = link.getAttribute("href");
      if (link.target && link.target !== "_self") return;
      if (rawHref && rawHref.startsWith("#")) return;
      if (link.hasAttribute("download") || link.hasAttribute("data-no-ajax")) return;
      var selectors = link.getAttribute(attr.ajaxHref);
      if (!selectors) return;
      var destinyUrl = comparableUrl(link.href);
      var currentUrl = comparableUrl(window.location.href);
      if (destinyUrl.origin !== currentUrl.origin) {
        AelluxJs.dispatch("AjaxHrefDropOrigin");
        return;
      }
      if (destinyUrl.href === currentUrl.href) {
        if (destinyUrl.hash && destinyUrl.hash !== currentUrl.hash) return;
        event.preventDefault();
        AelluxJs.dispatch("AjaxHrefStart");
        AelluxJs.dispatch("AjaxHrefLoaded");
        AelluxJs.dispatch("AjaxHrefComplete");
        return;
      }
      event.preventDefault();
      load(link.href, selectors);
    }
    function OnSnapshotRestoreAjax(event) {
      if (!event.detail || !event.detail.popState) return;
      var state = event.detail.popState;
      if (state.ajaxReplace) {
        var url = state.ajaxReplace.url;
        var selectors = state.ajaxReplace.selectors;
        load(url, selectors, {
          ignoreHistory: true
        });
      }
    }
    function comparableUrl(value) {
      var url = new URL(value, window.location.href);
      return {
        origin: url.origin,
        href: "".concat(url.origin).concat(url.pathname).concat(url.search),
        hash: url.hash
      };
    }
  })(typeof globalThis !== "undefined" ? globalThis : window);
})();
//# sourceMappingURL=aellux.ext.ajax-href.legacy.js.map
