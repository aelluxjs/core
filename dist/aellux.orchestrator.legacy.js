"use strict";
(function() {
  /*! Aellux | SPDX-License-Identifier: Apache-2.0 | See LICENSE for terms. */
  function _slicedToArray(r, e) {
    return _arrayWithHoles(r) || _iterableToArrayLimit(r, e) || _unsupportedIterableToArray(r, e) || _nonIterableRest();
  }
  function _nonIterableRest() {
    throw new TypeError("Invalid attempt to destructure non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.");
  }
  function _iterableToArrayLimit(r, l) {
    var t = null == r ? null : "undefined" != typeof Symbol && r[Symbol.iterator] || r["@@iterator"];
    if (null != t) {
      var e, n, i, u, a = [], f = true, o = false;
      try {
        if (i = (t = t.call(r)).next, 0 === l) {
          if (Object(t) !== t) return;
          f = false;
        } else for (; !(f = (e = i.call(t)).done) && (a.push(e.value), a.length !== l); f = true) ;
      } catch (r2) {
        o = true, n = r2;
      } finally {
        try {
          if (!f && null != t.return && (u = t.return(), Object(u) !== u)) return;
        } finally {
          if (o) throw n;
        }
      }
      return a;
    }
  }
  function _arrayWithHoles(r) {
    if (Array.isArray(r)) return r;
  }
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
  var root = typeof globalThis !== "undefined" ? globalThis : window;
  var extensionPromises = {};
  root.Aellux = Object.assign(AelluxForceUpdate, root.Aellux, {
    startAellux: function startAellux() {
      return _asyncToGenerator(/* @__PURE__ */ _regenerator().m(function _callee() {
        return _regenerator().w(function(_context) {
          while (1) switch (_context.n) {
            case 0:
              if (root.Aellux.bundledExtensions) {
                Object.keys(root.Aellux.bundledExtensions).forEach(function(extensionName) {
                  return Aellux.ext(extensionName);
                });
              }
              _context.n = 1;
              return new Promise(function(resolve, reject) {
                var _startUpdateCallback = function startUpdateCallback() {
                  Aellux.update().then(function() {
                    document.removeEventListener("DOMContentLoaded", _startUpdateCallback);
                    resolve();
                  });
                };
                if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", _startUpdateCallback, {
                  once: true
                });
                else _startUpdateCallback();
              });
            case 1:
              Aellux.dispatch("Ready");
              return _context.a(2, true);
          }
        }, _callee);
      }))();
    },
    update: function update(rootOrSelector) {
      return AelluxForceUpdate(rootOrSelector);
    },
    unmount: function unmount(rootOrSelector) {
      return AelluxForceUnmount(rootOrSelector);
    },
    destroy: function destroy() {
      Aellux.observers.resize.disconnect();
      Aellux.observers.mutation.disconnect();
      Aellux.observers.intersection.disconnect();
      document.removeEventListener("DOMContentLoaded", Aellux.update);
    },
    dispatchFrom: function dispatchFrom(from, event, options) {
      from.dispatchEvent(new CustomEvent(Aellux.eventName(event), options));
    },
    wait: function wait(extensionName) {
      return getExtension(extensionName);
    },
    observe: function observe(element, type) {
      Aellux.observers[type].observe(element);
    },
    unobserve: function unobserve(element, type) {
      Aellux.observers[type].unobserve(element);
    },
    request: defaultRequest,
    observers: Object.freeze({
      resize: new ResizeObserver(resizeObserverCallback),
      mutation: new MutationObserver(mutationObserverCallback),
      intersection: new IntersectionObserver(intersectionObserverCallback)
    }),
    waitLayout: createLayoutScheduler()
  });
  root[root.Aellux.shortJSName] = root.Aellux;
  function intersectionObserverCallback(entries) {
    observerCallback(entries, "Intersection");
  }
  function mutationObserverCallback(entries) {
    observerCallback(entries, "Mutation");
  }
  function resizeObserverCallback(entries) {
    observerCallback(entries, "Resize");
  }
  function observerCallback(entries, event) {
    for (var i = 0; i < entries.length; i++) {
      var entry = entries[i];
      Aellux.dispatchFrom(entry.target, "".concat(event, "Observer"), {
        detail: entry
      });
    }
  }
  function getExtension(extensionName) {
    extensionName = fromCamelCase(extensionName);
    var key = toCamelCase(extensionName);
    if (extensionPromises[key]) return extensionPromises[key];
    if (Aellux[key]) {
      if (!Aellux[key].initialized) {
        try {
          extensionInitialize(key);
        } catch (error) {
          console.error('[Aellux] Aellux Extension "'.concat(extensionName, '" failed to initialize.'), error);
          extensionPromises[key] = Promise.resolve(null);
          return extensionPromises[key];
        }
      }
      extensionPromises[key] = Promise.resolve(Aellux[key]);
      return extensionPromises[key];
    }
    if (!(extensionName in Aellux.extRegistry)) {
      return Promise.reject();
    }
    var bundledLoader = Aellux.bundledExtensions ? Aellux.bundledExtensions[extensionName] : null;
    extensionPromises[key] = (bundledLoader ? Promise.resolve().then(function() {
      return bundledLoader();
    }) : appendExtensionAssets(key)).then(function() {
      return extensionInitialize(key);
    }).catch(function(error) {
      console.error('[Aellux] Aellux Extension "'.concat(extensionName, '" failed to initialize.'), error);
      return null;
    });
    return extensionPromises[key];
  }
  function extensionInitialize(extensionLabel) {
    var extensionName = fromCamelCase(extensionLabel);
    var key = toCamelCase(extensionLabel);
    Aellux[key].init();
    Aellux[key].initialized = true;
    if (Aellux[key].mountDOM) {
      var selectors = Array.from(Aellux[key].mountDOM.keys()).join(",");
      if (selectors) Aellux.extensionMounters[extensionName] = selectors;
    }
    delete Aellux.lazyExtensionSelectors[extensionName];
    return Aellux[key];
  }
  function appendExtensionAssets(_x) {
    return _appendExtensionAssets.apply(this, arguments);
  }
  function _appendExtensionAssets() {
    _appendExtensionAssets = _asyncToGenerator(/* @__PURE__ */ _regenerator().m(function _callee2(name) {
      var extensionName, data, url, scriptURL, loadPromises;
      return _regenerator().w(function(_context2) {
        while (1) switch (_context2.n) {
          case 0:
            extensionName = fromCamelCase(name);
            data = Aellux.extRegistry[extensionName];
            url = data.url.replace(/^\.\//, Aellux.aelluxBasePath);
            scriptURL = Aellux.legacy ? toLegacyScriptURL(url) : url;
            loadPromises = [];
            loadPromises.push(new Promise(function(resolve, reject) {
              var attr = Aellux.attr("ext");
              var script = document.createElement("script");
              script.src = scriptURL;
              script.setAttribute(attr, name);
              script.onload = resolve;
              script.onerror = reject;
              document.head.appendChild(script);
            }));
            if (data.loadStyle && data.loadStyle !== "false") {
              loadPromises.push(new Promise(function(resolve) {
                var styleDefaultURL = data.loadStyle === "true" || data.loadStyle === "";
                var href = styleDefaultURL ? url.replace(/\.js(?=[?#]|$)/, ".css") : data.loadStyle;
                var attrStyle = Aellux.attr("ext-style");
                var link = document.createElement("link");
                link.href = href;
                link.rel = "stylesheet";
                link.setAttribute(attrStyle, name);
                link.onload = resolve;
                link.onerror = resolve;
                document.head.appendChild(link);
              }));
            }
            return _context2.a(2, Promise.all(loadPromises));
        }
      }, _callee2);
    }));
    return _appendExtensionAssets.apply(this, arguments);
  }
  function toLegacyScriptURL(url) {
    return url.replace(/(?:\.legacy)?(?:\.min)?\.js(?=[?#]|$)/, ".legacy" + (Aellux.minified ? ".min" : "") + ".js");
  }
  function createLayoutScheduler() {
    var readQueue = [];
    var updateQueue = [];
    var framePending = false;
    var phase = "idle";
    function scheduleFrame() {
      if (framePending || phase !== "idle") return;
      framePending = true;
      requestAnimationFrame(flushFrame);
    }
    function flushFrame() {
      framePending = false;
      phase = "read";
      var reads = readQueue.splice(0);
      for (var i = 0; i < reads.length; i++) runTask(reads[i]);
      Promise.resolve().then(function() {
        phase = "update";
        var updates = updateQueue.splice(0);
        for (var i2 = 0; i2 < updates.length; i2++) runTask(updates[i2]);
        phase = "idle";
        if (readQueue.length || updateQueue.length) scheduleFrame();
      });
    }
    function runTask(task) {
      try {
        task.resolve(task.callback());
      } catch (error) {
        task.reject(error);
      }
    }
    function queueTask(queue, callback) {
      var promise = new Promise(function(resolve, reject) {
        queue.push({
          callback: callback,
          resolve: resolve,
          reject: reject
        });
      });
      if (phase === "idle") scheduleFrame();
      return promise;
    }
    return Object.freeze({
      read: function read(callback) {
        return queueTask(readQueue, callback);
      },
      update: function update2(callback) {
        return queueTask(updateQueue, callback);
      }
    });
  }
  function defaultRequest(url, options) {
    var requestOptions = Object.assign({
      method: "GET",
      credentials: "same-origin"
    }, options);
    return fetch(url, requestOptions).then(function(response) {
      if (!response.ok) {
        var error = new Error("HTTP " + response.status + " " + response.statusText);
        error.name = "AelluxRequestError";
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
  function AelluxForceUnmount(_x2) {
    return _AelluxForceUnmount.apply(this, arguments);
  }
  function _AelluxForceUnmount() {
    _AelluxForceUnmount = _asyncToGenerator(/* @__PURE__ */ _regenerator().m(function _callee3(rootOrSelector) {
      var _iterator, _step, rootElement, _t;
      return _regenerator().w(function(_context3) {
        while (1) switch (_context3.p = _context3.n) {
          case 0:
            _iterator = _createForOfIteratorHelper(resolveRoots(rootOrSelector));
            _context3.p = 1;
            _iterator.s();
          case 2:
            if ((_step = _iterator.n()).done) {
              _context3.n = 4;
              break;
            }
            rootElement = _step.value;
            _context3.n = 3;
            return AelluxForce(rootElement, "unmount");
          case 3:
            _context3.n = 2;
            break;
          case 4:
            _context3.n = 6;
            break;
          case 5:
            _context3.p = 5;
            _t = _context3.v;
            _iterator.e(_t);
          case 6:
            _context3.p = 6;
            _iterator.f();
            return _context3.f(6);
          case 7:
            return _context3.a(2, true);
        }
      }, _callee3, null, [[1, 5, 6, 7]]);
    }));
    return _AelluxForceUnmount.apply(this, arguments);
  }
  function AelluxForceUpdate(_x3) {
    return _AelluxForceUpdate.apply(this, arguments);
  }
  function _AelluxForceUpdate() {
    _AelluxForceUpdate = _asyncToGenerator(/* @__PURE__ */ _regenerator().m(function _callee4(rootOrSelector) {
      var _iterator2, _step2, rootElement, allWaiters, allLinks, _iterator3, _step3, link, href, loadWhen, loadStyle, waitExtensions, _i, _Object$entries, _Object$entries$_i, extensionLabel, options, _t2;
      return _regenerator().w(function(_context4) {
        while (1) switch (_context4.p = _context4.n) {
          case 0:
            _iterator2 = _createForOfIteratorHelper(resolveRoots(rootOrSelector));
            _context4.p = 1;
            _iterator2.s();
          case 2:
            if ((_step2 = _iterator2.n()).done) {
              _context4.n = 10;
              break;
            }
            rootElement = _step2.value;
            allWaiters = findElements(rootElement, Aellux.attr("wait-mounted"));
            allWaiters.forEach(function(waiter) {
              return waiter.setAttribute("aria-busy", "true");
            });
            allLinks = findElements(rootElement, "link[rel='aellux-ext']");
            _iterator3 = _createForOfIteratorHelper(allLinks);
            try {
              for (_iterator3.s(); !(_step3 = _iterator3.n()).done; ) {
                link = _step3.value;
                href = link.getAttribute("href");
                loadWhen = link.getAttribute(Aellux.attr("load-when")) || void 0;
                loadStyle = link.hasAttribute(Aellux.attr("load-style")) && link.getAttribute(Aellux.attr("load-style")) !== "false";
                link.setAttribute("rel", "aellux-ext-registered");
                Aellux.ext(href, {
                  loadWhen: loadWhen,
                  loadStyle: loadStyle
                });
              }
            } catch (err) {
              _iterator3.e(err);
            } finally {
              _iterator3.f();
            }
            waitExtensions = [];
            _i = 0, _Object$entries = Object.entries(root.Aellux.extRegistry);
          case 3:
            if (!(_i < _Object$entries.length)) {
              _context4.n = 6;
              break;
            }
            _Object$entries$_i = _slicedToArray(_Object$entries[_i], 2), extensionLabel = _Object$entries$_i[0], options = _Object$entries$_i[1];
            if (!options.loadWhen) {
              _context4.n = 4;
              break;
            }
            return _context4.a(3, 5);
          case 4:
            waitExtensions.push(getExtension(extensionLabel));
          case 5:
            _i++;
            _context4.n = 3;
            break;
          case 6:
            _context4.n = 7;
            return Promise.all(waitExtensions);
          case 7:
            _context4.n = 8;
            return AelluxForce(rootElement, "mount");
          case 8:
            allWaiters.forEach(function(waiter) {
              return waiter.setAttribute("aria-busy", "false");
            });
          case 9:
            _context4.n = 2;
            break;
          case 10:
            _context4.n = 12;
            break;
          case 11:
            _context4.p = 11;
            _t2 = _context4.v;
            _iterator2.e(_t2);
          case 12:
            _context4.p = 12;
            _iterator2.f();
            return _context4.f(12);
          case 13:
            return _context4.a(2, true);
        }
      }, _callee4, null, [[1, 11, 12, 13]]);
    }));
    return _AelluxForceUpdate.apply(this, arguments);
  }
  function AelluxForce(_x4, _x5) {
    return _AelluxForce.apply(this, arguments);
  }
  function _AelluxForce() {
    _AelluxForce = _asyncToGenerator(/* @__PURE__ */ _regenerator().m(function _callee5(rootElement, method) {
      var mounterSelectors, lazySelectors, selector, allElements, _iterator4, _step4, element, extensionLabels, elementsAffected, _i2, _Object$entries2, _Object$entries2$_i, extensionLabel, _selector, _i3, _Object$entries3, _Object$entries3$_i, _extensionLabel, _selector2, _iterator5, _step5, _extensionLabel2, extension, mounter, _iterator7, _step7, _step7$value, attr, controller, mountableElements, _iterator8, _step8, mountable, _iterator6, _step6, affected, _t3, _t4, _t5, _t6, _t7;
      return _regenerator().w(function(_context5) {
        while (1) switch (_context5.p = _context5.n) {
          case 0:
            mounterSelectors = Object.values(Aellux.extensionMounters);
            lazySelectors = Object.values(Aellux.lazyExtensionSelectors);
            if (!(mounterSelectors.length + lazySelectors.length === 0)) {
              _context5.n = 1;
              break;
            }
            return _context5.a(2);
          case 1:
            selector = [].concat(mounterSelectors, lazySelectors).join(",");
            allElements = findElements(rootElement, selector);
            _iterator4 = _createForOfIteratorHelper(allElements);
            _context5.p = 2;
            _iterator4.s();
          case 3:
            if ((_step4 = _iterator4.n()).done) {
              _context5.n = 31;
              break;
            }
            element = _step4.value;
            extensionLabels = /* @__PURE__ */ new Set();
            elementsAffected = /* @__PURE__ */ new Set();
            for (_i2 = 0, _Object$entries2 = Object.entries(Aellux.lazyExtensionSelectors); _i2 < _Object$entries2.length; _i2++) {
              _Object$entries2$_i = _slicedToArray(_Object$entries2[_i2], 2), extensionLabel = _Object$entries2$_i[0], _selector = _Object$entries2$_i[1];
              if (element.matches(_selector)) extensionLabels.add(extensionLabel);
            }
            for (_i3 = 0, _Object$entries3 = Object.entries(Aellux.extensionMounters); _i3 < _Object$entries3.length; _i3++) {
              _Object$entries3$_i = _slicedToArray(_Object$entries3[_i3], 2), _extensionLabel = _Object$entries3$_i[0], _selector2 = _Object$entries3$_i[1];
              if (element.matches(_selector2)) extensionLabels.add(_extensionLabel);
            }
            _iterator5 = _createForOfIteratorHelper(extensionLabels);
            _context5.p = 4;
            _iterator5.s();
          case 5:
            if ((_step5 = _iterator5.n()).done) {
              _context5.n = 26;
              break;
            }
            _extensionLabel2 = _step5.value;
            _context5.n = 6;
            return getExtension(_extensionLabel2);
          case 6:
            extension = _context5.v;
            if (!(!extension || !extension.mountDOM)) {
              _context5.n = 7;
              break;
            }
            return _context5.a(3, 25);
          case 7:
            mounter = extension.mountDOM;
            _iterator7 = _createForOfIteratorHelper(mounter);
            _context5.p = 8;
            _iterator7.s();
          case 9:
            if ((_step7 = _iterator7.n()).done) {
              _context5.n = 22;
              break;
            }
            _step7$value = _slicedToArray(_step7.value, 2), attr = _step7$value[0], controller = _step7$value[1];
            _context5.p = 10;
            if (controller[method]) {
              _context5.n = 11;
              break;
            }
            return _context5.a(3, 21);
          case 11:
            mountableElements = findElements(element, attr);
            _iterator8 = _createForOfIteratorHelper(mountableElements);
            _context5.p = 12;
            _iterator8.s();
          case 13:
            if ((_step8 = _iterator8.n()).done) {
              _context5.n = 16;
              break;
            }
            mountable = _step8.value;
            _context5.n = 14;
            return controller[method](mountable);
          case 14:
            elementsAffected.add(mountable);
          case 15:
            _context5.n = 13;
            break;
          case 16:
            _context5.n = 18;
            break;
          case 17:
            _context5.p = 17;
            _t3 = _context5.v;
            _iterator8.e(_t3);
          case 18:
            _context5.p = 18;
            _iterator8.f();
            return _context5.f(18);
          case 19:
            _context5.n = 21;
            break;
          case 20:
            _context5.p = 20;
            _t4 = _context5.v;
            console.error(_t4);
          case 21:
            _context5.n = 9;
            break;
          case 22:
            _context5.n = 24;
            break;
          case 23:
            _context5.p = 23;
            _t5 = _context5.v;
            _iterator7.e(_t5);
          case 24:
            _context5.p = 24;
            _iterator7.f();
            return _context5.f(24);
          case 25:
            _context5.n = 5;
            break;
          case 26:
            _context5.n = 28;
            break;
          case 27:
            _context5.p = 27;
            _t6 = _context5.v;
            _iterator5.e(_t6);
          case 28:
            _context5.p = 28;
            _iterator5.f();
            return _context5.f(28);
          case 29:
            _iterator6 = _createForOfIteratorHelper(elementsAffected);
            try {
              for (_iterator6.s(); !(_step6 = _iterator6.n()).done; ) {
                affected = _step6.value;
                affected.classList[method === "mount" ? "add" : "remove"](Aellux.className("mounted"));
              }
            } catch (err) {
              _iterator6.e(err);
            } finally {
              _iterator6.f();
            }
          case 30:
            _context5.n = 3;
            break;
          case 31:
            _context5.n = 33;
            break;
          case 32:
            _context5.p = 32;
            _t7 = _context5.v;
            _iterator4.e(_t7);
          case 33:
            _context5.p = 33;
            _iterator4.f();
            return _context5.f(33);
          case 34:
            Aellux.dispatch("Update");
          case 35:
            return _context5.a(2);
        }
      }, _callee5, null, [[12, 17, 18, 19], [10, 20], [8, 23, 24, 25], [4, 27, 28, 29], [2, 32, 33, 34]]);
    }));
    return _AelluxForce.apply(this, arguments);
  }
  function resolveRoots(root2) {
    if (!root2) {
      return [document];
    }
    if (typeof root2 === "string") {
      try {
        return Array.from(document.querySelectorAll(root2));
      } catch (error) {
        return [];
      }
    }
    if (root2 instanceof Element || root2 instanceof Document || root2 instanceof DocumentFragment) {
      return [root2];
    }
    return [];
  }
  function findElements(root2, selector) {
    var elements = [];
    if (root2.nodeType === Node.ELEMENT_NODE && root2.matches(selector)) {
      elements.push(root2);
    }
    if (root2.querySelectorAll) {
      root2.querySelectorAll(selector).forEach(function(element) {
        elements.push(element);
      });
    }
    return elements;
  }
  function toCamelCase(name) {
    return name.replace(/-([a-z])/g, function(_, c) {
      return c.toUpperCase();
    });
  }
  function fromCamelCase(name) {
    return name.replace(/([A-Z])/g, "-$1").toLowerCase();
  }
  var pageWasHidden = false;
  window.addEventListener("pagehide", function() {
    return pageWasHidden = true;
  });
  window.addEventListener("pageshow", function(event) {
    if (event.persisted && pageWasHidden) {
      pageWasHidden = false;
    }
  });
})();
//# sourceMappingURL=aellux.orchestrator.legacy.js.map
