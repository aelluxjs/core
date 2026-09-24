(function() {
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
  /*! Aellux | SPDX-License-Identifier: Apache-2.0 | See LICENSE for terms. */
  (function() {
    "use strict";
    var extensionName = "ajax-href";
    Aellux.extRegister(extensionName, {
      init: init,
      destroy: destroy,
      load: load
    });
    var attr = {
      ajaxHref: Aellux.attr(extensionName)
    };
    function init() {
      document.addEventListener("click", onClick);
    }
    function destroy() {
      return _destroy.apply(this, arguments);
    }
    function _destroy() {
      _destroy = _asyncToGenerator(/* @__PURE__ */ _regenerator().m(function _callee() {
        return _regenerator().w(function(_context) {
          while (1) switch (_context.n) {
            case 0:
              document.removeEventListener("click", onClick);
              if (previousController) {
                previousController.abort();
              }
            case 1:
              return _context.a(2);
          }
        }, _callee);
      }));
      return _destroy.apply(this, arguments);
    }
    var previousController = null;
    function load(_x, _x2) {
      return _load.apply(this, arguments);
    }
    function _load() {
      _load = _asyncToGenerator(/* @__PURE__ */ _regenerator().m(function _callee2(url, selectors) {
        var options, controller, selectorList, elements, response, html, loadedDocument, _args2 = arguments, _t;
        return _regenerator().w(function(_context2) {
          while (1) switch (_context2.p = _context2.n) {
            case 0:
              options = _args2.length > 2 && _args2[2] !== void 0 ? _args2[2] : {};
              options = options || {};
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
              selectorList = (Array.isArray(selectors) ? selectors : selectors.split(",")).map(function(selector) {
                return selector.trim();
              }).filter(Boolean);
              elements = /* @__PURE__ */ new Map();
              selectorList.forEach(function(selector) {
                var currentElement = document.querySelector(selector);
                if (!currentElement) return;
                elements.set(selector, currentElement);
                if (Aellux.feedback) {
                  Aellux.feedback.busy(currentElement, "Ajax loading", true);
                  Aellux.feedback.progress(currentElement, "Ajax loading", 0);
                }
              });
              _context2.p = 1;
              _context2.n = 2;
              return Aellux.request(url, {
                signal: controller.signal
              });
            case 2:
              response = _context2.v;
              _context2.n = 3;
              return response.text();
            case 3:
              html = _context2.v;
              loadedDocument = new DOMParser().parseFromString(html, "text/html");
              selectorList.forEach(function(selector) {
                var currentElement = elements.get(selector);
                if (!currentElement) return;
                var loadedElement = loadedDocument.querySelector(selector);
                if (!loadedElement) return;
                var replacement = document.importNode(loadedElement, true);
                currentElement.replaceWith(replacement);
                if (selector === "title" && Aellux.stateNavigation) Aellux.stateNavigation.updateBaseTitle(replacement.innerText);
                Aellux(replacement);
                if (Aellux.feedback) {
                  Aellux.feedback.busy(replacement, "Ajax loaded", false);
                  Aellux.feedback.progress(replacement, "Ajax loaded", 1);
                }
              });
              if (!options.ignoreHistory && Aellux.stateNavigation) {
                Aellux.stateNavigation.ajaxHref(url, selectors);
              }
              _context2.n = 6;
              break;
            case 4:
              _context2.p = 4;
              _t = _context2.v;
              selectorList.forEach(function(selector) {
                var currentElement = elements.get(selector);
                if (!currentElement) return;
                if (Aellux.feedback) {
                  Aellux.feedback.busy(currentElement, "Ajax loading", false);
                  Aellux.feedback.progress(currentElement, "Ajax loading", 1);
                }
              });
              if (!(_t.name === "AbortError")) {
                _context2.n = 5;
                break;
              }
              return _context2.a(2, null);
            case 5:
              throw _t;
            case 6:
              _context2.p = 6;
              if (previousController === controller) previousController = null;
              return _context2.f(6);
            case 7:
              return _context2.a(2);
          }
        }, _callee2, null, [[1, 4, 6, 7]]);
      }));
      return _load.apply(this, arguments);
    }
    function onClick(event) {
      if (event.button !== 0) return;
      if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
      var link = event.target.closest("[".concat(attr.ajaxHref, "]"));
      if (!link || link.tagName !== "A") return;
      if (link.target && link.target !== "_self") return;
      if (link.hasAttribute("download")) return;
      var selectors = link.getAttribute(attr.ajaxHref);
      if (!selectors) return;
      event.preventDefault();
      Aellux.ajaxHref.load(link.href, selectors);
    }
  })();
})();
//# sourceMappingURL=aellux.ext.ajax-href.legacy.js.map
