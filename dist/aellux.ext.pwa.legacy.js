(function() {
  // src/internal/utils-name-case.js
  /*! aellux.js | SPDX-License-Identifier: Apache-2.0 | See LICENSE for terms. */

  // src/internal/development-helpers.js
  /*! aellux.js | SPDX-License-Identifier: Apache-2.0 | See LICENSE for terms. */
  function validatePWAManifest(root, getManifestLink) {
    var _link$getAttribute, _link$getAttribute2;
    var api = root.AelluxJs;
    if (api.options.environment !== "development") return;
    var link = getManifestLink();
    if (link !== null && link !== void 0 && (_link$getAttribute = link.getAttribute("href")) !== null && _link$getAttribute !== void 0 && _link$getAttribute.trim()) return;
    api.diagnostics.warn(api.diagnostics.WARN_CONFIGURATION_STRUCTURE, {
      extension: "pwa",
      element: link || root.document.documentElement,
      attribute: link ? "href" : "rel",
      value: (_link$getAttribute2 = link === null || link === void 0 ? void 0 : link.getAttribute("href")) !== null && _link$getAttribute2 !== void 0 ? _link$getAttribute2 : null,
      reason: link ? "The Web App Manifest link has no nonempty href." : "The page has no Web App Manifest link.",
      suggestion: 'Add <link rel="manifest" href="./manifest.webmanifest"> in the document head and provide an application manifest. See the PWA documentation; registering a Service Worker does not supply a manifest.'
    });
  }

  // src/src/aellux.ext.pwa.js
  function _typeof(o) {
    "@babel/helpers - typeof";
    return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function(o2) {
      return typeof o2;
    } : function(o2) {
      return o2 && "function" == typeof Symbol && o2.constructor === Symbol && o2 !== Symbol.prototype ? "symbol" : typeof o2;
    }, _typeof(o);
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
  (function(root) {
    "use strict";
    var api = root.AelluxJs;
    if (!api) throw new Error('[aellux.js] Load the boot script before the "pwa" extension.');
    var extensionName = "pwa", attribute = api.attr(extensionName);
    var active = false, revision = 0, settings = {}, promptEvent = null;
    var installed = null, media = null, registration = null, registrationKey = null;
    var pendingRegistration = null, registrationRevision = 0, workerState = "unregistered";
    var promptTask = null, guideTask = null, guide = null, guideReturnFocus = null, guideId = 0;
    var mounted = /* @__PURE__ */ new Set(), observers = /* @__PURE__ */ new Set();
    var texts = {
      en: {
        title: "Add to Home Screen",
        intro: "To install this app:",
        close: "Close",
        steps: ["Open the browser's Share menu.", "Select Add to Home Screen.", "Confirm the installation."]
      },
      "pt-BR": {
        title: "Adicionar \xE0 Tela de In\xEDcio",
        intro: "Para instalar este aplicativo:",
        close: "Fechar",
        steps: ["Abra o menu Compartilhar do navegador.", "Selecione Adicionar \xE0 Tela de In\xEDcio.", "Confirme a instala\xE7\xE3o."]
      }
    };
    api.extAttach(extensionName, {
      init: init,
      destroy: destroy,
      register: register,
      install: install,
      checkUpdate: checkUpdate,
      applyUpdate: applyUpdate,
      status: status
    });
    function init() {
      var _media, _media2;
      var options = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : {};
      if (active) return;
      active = true;
      revision++;
      settings = options;
      media = typeof root.matchMedia === "function" ? root.matchMedia("(display-mode: standalone)") : null;
      api.onEvent(root, "$beforeinstallprompt", onPrompt);
      api.onEvent(root, "$appinstalled", onInstalled);
      if ((_media = media) !== null && _media !== void 0 && _media.addEventListener) media.addEventListener("change", onDisplayChange);
      else if ((_media2 = media) !== null && _media2 !== void 0 && _media2.addListener) media.addListener(onDisplayChange);
      api.mountManager.add({
        extensionName: extensionName,
        selector: "[".concat(attribute, "]"),
        mount: mount,
        unmount: unmount,
        controllers: ["install", "register", "checkUpdate", "applyUpdate", "status"]
      });
      validatePWAManifest(root, manifestLink);
    }
    function destroy() {
      var _media3, _media4;
      if (!active) return;
      active = false;
      revision++;
      registrationRevision++;
      var _iterator = _createForOfIteratorHelper(mounted), _step;
      try {
        for (_iterator.s(); !(_step = _iterator.n()).done; ) {
          var element = _step.value;
          unmount(element);
        }
      } catch (err) {
        _iterator.e(err);
      } finally {
        _iterator.f();
      }
      api.mountManager.remove({
        extensionName: extensionName
      });
      api.offEvent(root, "$beforeinstallprompt", onPrompt);
      api.offEvent(root, "$appinstalled", onInstalled);
      if ((_media3 = media) !== null && _media3 !== void 0 && _media3.removeEventListener) media.removeEventListener("change", onDisplayChange);
      else if ((_media4 = media) !== null && _media4 !== void 0 && _media4.removeListener) media.removeListener(onDisplayChange);
      clearObservers();
      removeGuide();
      media = promptEvent = registration = pendingRegistration = registrationKey = null;
      guideTask = promptTask = null;
      installed = null;
      workerState = "unregistered";
      settings = {};
    }
    function mount(element) {
      if (mounted.has(element)) return;
      mounted.add(element);
      api.onEvent(element, "$click", onClick);
    }
    function unmount(element) {
      if (mounted.delete(element)) api.offEvent(element, "$click", onClick);
    }
    function onClick(event) {
      if (event.defaultPrevented || event.button > 0 || event.ctrlKey || event.metaKey || event.altKey || event.shiftKey) return;
      var element = event.currentTarget;
      if (element.getAttribute(attribute) !== "install" || element.matches(":disabled,[aria-disabled=true]")) return;
      var target = event.target.nodeType === 1 ? event.target : event.target.parentElement;
      if ((target === null || target === void 0 ? void 0 : target.closest("[".concat(attribute, "]"))) !== element) return;
      event.preventDefault();
      install(element).catch(function() {
      });
    }
    function emit(name) {
      var detail = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {};
      var element = arguments.length > 2 && arguments[2] !== void 0 ? arguments[2] : null;
      if (active) api.dispatchFrom(element || root.document, api.eventName(name), {
        detail: _objectSpread(_objectSpread({}, detail), {}, {
          status: status()
        })
      });
    }
    function onPrompt(event) {
      if (typeof event.prompt !== "function") return;
      event.preventDefault();
      if (promptEvent === event) return;
      promptEvent = event;
      emit("PwaInstallAvailable");
    }
    function onInstalled() {
      if (installed === true) return;
      installed = true;
      promptEvent = null;
      removeGuide();
      emit("PwaInstalled");
    }
    function onDisplayChange() {
      var _media5;
      if ((_media5 = media) !== null && _media5 !== void 0 && _media5.matches) onInstalled();
    }
    function environment() {
      var nav = root.navigator || {}, ua = nav.userAgent || "";
      var ios = /iPad|iPhone|iPod/.test(ua) || /Macintosh/.test(ua) && nav.maxTouchPoints > 1;
      var browser = /Edg\//.test(ua) ? "edge" : /CriOS|Chrome\//.test(ua) ? "chrome" : /FxiOS|Firefox\//.test(ua) ? "firefox" : /Version\/.*Safari\//.test(ua) ? "safari" : "unknown";
      return {
        platform: ios ? "ios" : /Android/.test(ua) ? "android" : "unknown",
        browser: browser,
        manual: ios && browser === "safari" && !/CriOS|FxiOS|EdgiOS|OPiOS|DuckDuckGo/.test(ua)
      };
    }
    function status() {
      var _media6, _root$navigator, _root$navigator2;
      var env = environment();
      var runningInstalled = installed === true || ((_media6 = media) === null || _media6 === void 0 ? void 0 : _media6.matches) === true || ((_root$navigator = root.navigator) === null || _root$navigator === void 0 ? void 0 : _root$navigator.standalone) === true;
      var unavailable = root.isSecureContext === false || !/^https?:$/.test(root.location.protocol);
      return {
        installed: runningInstalled ? true : null,
        installMethod: runningInstalled || unavailable ? "unavailable" : promptEvent ? "native" : env.manual ? "manual" : "unknown",
        canPrompt: !runningInstalled && !unavailable && !!promptEvent,
        platform: env.platform,
        browser: env.browser,
        serviceWorker: !((_root$navigator2 = root.navigator) !== null && _root$navigator2 !== void 0 && _root$navigator2.serviceWorker) || root.isSecureContext === false ? "unavailable" : workerState
      };
    }
    function argumentsFor(first, second) {
      return (first === null || first === void 0 ? void 0 : first.nodeType) === 1 ? {
        element: first,
        options: second || {}
      } : {
        element: null,
        options: first || {}
      };
    }
    function manifestLink() {
      return Array.from(root.document.querySelectorAll("link[rel]")).find(function(link) {
        return /(?:^|\s)manifest(?:\s|$)/i.test(link.getAttribute("rel") || "");
      });
    }
    function install(first, second) {
      var _ref, _options$fallback, _link$getAttribute;
      var _argumentsFor = argumentsFor(first, second), element = _argumentsFor.element, options = _argumentsFor.options;
      if (!active) return Promise.reject(new Error("PWA is not initialized."));
      if (promptTask) return promptTask;
      validatePWAManifest(root, manifestLink);
      var current = status(), token = revision;
      if (current.installMethod === "unavailable") return Promise.resolve({
        outcome: "unavailable",
        status: current
      });
      if (current.canPrompt) {
        var event = promptEvent;
        promptEvent = null;
        var result;
        try {
          result = event.prompt();
        } catch (error) {
          emit("PwaError", {
            operation: "install",
            error: error
          }, element);
          return Promise.reject(error);
        }
        var _task = Promise.resolve(result).then(function(choice) {
          return event.userChoice || choice;
        }).then(function(choice) {
          var outcome = (choice === null || choice === void 0 ? void 0 : choice.outcome) === "accepted" ? "accepted" : "dismissed";
          if (active && token === revision) emit(outcome === "accepted" ? "PwaInstallAccepted" : "PwaInstallDismissed", {
            outcome: outcome
          }, element);
          return {
            outcome: outcome,
            status: status()
          };
        }).catch(function(error) {
          if (token === revision) emit("PwaError", {
            operation: "install",
            error: error
          }, element);
          throw error;
        }).finally(function() {
          if (promptTask === _task) promptTask = null;
        });
        promptTask = _task;
        emit("PwaInstallRequested", {}, element);
        return _task;
      }
      if (guideTask) return guideTask;
      var fallback = (_ref = (_options$fallback = options.fallback) !== null && _options$fallback !== void 0 ? _options$fallback : settings.fallback) !== null && _ref !== void 0 ? _ref : "default";
      var link = manifestLink();
      var context = {
        status: current,
        element: element,
        manifest: options.manifest || settings.manifest || null,
        manifestURL: link !== null && link !== void 0 && (_link$getAttribute = link.getAttribute("href")) !== null && _link$getAttribute !== void 0 && _link$getAttribute.trim() ? link.href : null
      };
      var task = Promise.resolve().then(function() {
        if (!active || token !== revision) return {
          outcome: "unavailable",
          status: status()
        };
        if (typeof fallback === "function") return Promise.resolve(fallback(context)).then(function(value) {
          return {
            outcome: "custom",
            value: value,
            status: status()
          };
        });
        if (fallback === "default" && current.installMethod === "manual") return showGuide(_objectSpread(_objectSpread({}, settings), options), context, token).then(function() {
          return {
            outcome: "manual",
            status: status()
          };
        });
        return {
          outcome: current.installMethod,
          status: current
        };
      }).catch(function(error) {
        if (token === revision) {
          if (fallback === "default") removeGuide();
          emit("PwaError", {
            operation: "install",
            error: error
          }, element);
        }
        throw error;
      }).finally(function() {
        if (guideTask === task) guideTask = null;
      });
      guideTask = task;
      emit("PwaInstallRequested", {}, element);
      if (current.installMethod === "manual") emit("PwaInstallManual", context, element);
      return task;
    }
    function showGuide(_x, _x2, _x3) {
      return _showGuide.apply(this, arguments);
    }
    function _showGuide() {
      _showGuide = _asyncToGenerator(/* @__PURE__ */ _regenerator().m(function _callee(options, context, token) {
        var _guide, _root$navigator4;
        var dialogAPI, language, copy, dialog, content, title, intro, list, _iterator3, _step3, step, item, _i, _arr, child, close, mounted2, _t;
        return _regenerator().w(function(_context) {
          while (1) switch (_context.p = _context.n) {
            case 0:
              if (!((_guide = guide) !== null && _guide !== void 0 && _guide.open)) {
                _context.n = 1;
                break;
              }
              return _context.a(2);
            case 1:
              _context.n = 2;
              return api.wait("dialog");
            case 2:
              dialogAPI = _context.v;
              if (!(!active || token !== revision)) {
                _context.n = 3;
                break;
              }
              return _context.a(2);
            case 3:
              if (dialogAPI) {
                _context.n = 4;
                break;
              }
              throw new Error("Dialog could not be loaded for the installation guide.");
            case 4:
              removeGuide();
              language = options.language || root.document.documentElement.lang || ((_root$navigator4 = root.navigator) === null || _root$navigator4 === void 0 ? void 0 : _root$navigator4.language) || "en";
              copy = _objectSpread(_objectSpread({}, texts[/^pt(-BR)?$/i.test(language) ? "pt-BR" : "en"]), options.texts);
              dialog = root.document.createElement("dialog");
              dialog.lang = language;
              dialog.setAttribute(api.attr("pwa-guide"), "");
              guide = dialog;
              guideReturnFocus = context.element || root.document.activeElement;
              content = typeof options.template === "function" ? options.template(_objectSpread(_objectSpread({}, context), {}, {
                texts: copy
              })) : null;
              if (content) dialog.appendChild(content);
              else {
                title = root.document.createElement("h2"), intro = root.document.createElement("p"), list = root.document.createElement("ol");
                title.id = "".concat(api.attr("pwa-guide"), "-").concat(++guideId);
                title.textContent = copy.title;
                dialog.setAttribute("aria-labelledby", title.id);
                intro.textContent = copy.intro;
                _iterator3 = _createForOfIteratorHelper(copy.steps);
                try {
                  for (_iterator3.s(); !(_step3 = _iterator3.n()).done; ) {
                    step = _step3.value;
                    item = root.document.createElement("li");
                    item.textContent = step;
                    list.appendChild(item);
                  }
                } catch (err) {
                  _iterator3.e(err);
                } finally {
                  _iterator3.f();
                }
                for (_i = 0, _arr = [title, intro, list]; _i < _arr.length; _i++) {
                  child = _arr[_i];
                  dialog.appendChild(child);
                }
              }
              if (!dialog.hasAttribute("aria-labelledby")) dialog.setAttribute("aria-label", copy.title);
              close = root.document.createElement("button");
              close.type = "button";
              close.textContent = copy.close;
              close.autofocus = true;
              close.addEventListener("click", function() {
                return dialog.close();
              });
              dialog.appendChild(close);
              dialog.addEventListener("close", function() {
                if (guide === dialog) removeGuide();
              }, {
                once: true
              });
              root.document.body.appendChild(dialog);
              _context.n = 5;
              return api.mount(dialog, "dialog");
            case 5:
              mounted2 = _context.v;
              if (!(!active || token !== revision || guide !== dialog || !dialog.isConnected)) {
                _context.n = 6;
                break;
              }
              return _context.a(2);
            case 6:
              if (!(mounted2 === false)) {
                _context.n = 7;
                break;
              }
              removeGuide();
              return _context.a(2);
            case 7:
              _context.p = 7;
              dialogAPI.showModal(dialog);
              _context.n = 9;
              break;
            case 8:
              _context.p = 8;
              _t = _context.v;
              removeGuide();
              throw _t;
            case 9:
              return _context.a(2);
          }
        }, _callee, null, [[7, 8]]);
      }));
      return _showGuide.apply(this, arguments);
    }
    function removeGuide() {
      var dialog = guide;
      var returnFocus = guideReturnFocus;
      guide = null;
      guideReturnFocus = null;
      if (!dialog) return;
      if (dialog.open) dialog.close();
      var focused = root.document.activeElement;
      if ((focused === root.document.body || dialog.contains(focused)) && returnFocus !== null && returnFocus !== void 0 && returnFocus.isConnected && typeof returnFocus.focus === "function" && !returnFocus.matches(":disabled,[inert]")) returnFocus.focus();
      if (dialog.parentNode) dialog.parentNode.removeChild(dialog);
    }
    function observe(target, name, handler) {
      api.onEvent(target, "$".concat(name), handler);
      var _remove = function remove() {
        api.offEvent(target, "$".concat(name), handler);
        observers.delete(_remove);
      };
      observers.add(_remove);
      return _remove;
    }
    function clearObservers() {
      var _iterator2 = _createForOfIteratorHelper(observers), _step2;
      try {
        for (_iterator2.s(); !(_step2 = _iterator2.n()).done; ) {
          var remove = _step2.value;
          remove();
        }
      } catch (err) {
        _iterator2.e(err);
      } finally {
        _iterator2.f();
      }
    }
    function watchRegistration(value) {
      clearObservers();
      var announced = null;
      var waiting = function waiting2() {
        if (value.waiting && value.waiting !== announced && value.active) {
          announced = value.waiting;
          workerState = "waiting";
          emit("PwaUpdateAvailable", {
            registration: value,
            worker: value.waiting
          });
        }
      };
      var seen = /* @__PURE__ */ new Set();
      var update = function update2() {
        var worker = value.installing;
        if (worker && !seen.has(worker)) {
          seen.add(worker);
          var stop = observe(worker, "statechange", function() {
            waiting();
            if (worker.state === "activated" || worker.state === "redundant") {
              seen.delete(worker);
              stop();
            }
            if (worker.state === "redundant") {
              workerState = "error";
              emit("PwaError", {
                operation: "update",
                error: new Error("Service Worker became redundant before activation."),
                registration: value
              });
            }
          });
        }
        waiting();
      };
      observe(value, "updatefound", update);
      var previousController = root.navigator.serviceWorker.controller;
      observe(root.navigator.serviceWorker, "controllerchange", function() {
        var _value$active;
        var controller = root.navigator.serviceWorker.controller;
        if (!controller || controller === previousController || controller.scriptURL !== ((_value$active = value.active) === null || _value$active === void 0 ? void 0 : _value$active.scriptURL)) return;
        previousController = controller;
        workerState = "registered";
        emit("PwaUpdateComplete", {
          registration: value
        });
      });
      update();
    }
    function register(first, second) {
      var _argumentsFor2 = argumentsFor(first, second), options = _argumentsFor2.options, element = _argumentsFor2.element;
      var script, nativeOptions;
      try {
        var _root$navigator3;
        if (!active) throw new Error("PWA is not initialized.");
        if (!((_root$navigator3 = root.navigator) !== null && _root$navigator3 !== void 0 && _root$navigator3.serviceWorker) || root.isSecureContext === false) throw new Error("Service Workers require a supported secure context.");
        if (typeof options.script !== "string" || !options.script.trim()) throw new TypeError("register requires a script URL.");
        script = new URL(options.script, root.document.baseURI);
        if (!/^https?:$/.test(script.protocol) || script.origin !== root.location.origin || script.username || script.password || script.hash) throw new TypeError("Service Worker script must use the page origin and have no credentials or fragment.");
        nativeOptions = {};
        if (options.scope !== void 0) {
          if (typeof options.scope !== "string" || !options.scope.trim()) throw new TypeError("Invalid Service Worker scope.");
          var scope = new URL(options.scope, root.document.baseURI);
          if (scope.origin !== script.origin || scope.username || scope.password || scope.hash || scope.search) throw new TypeError("Service Worker scope must use the page origin without query or fragment.");
          nativeOptions.scope = scope.href;
        }
        if (options.type !== void 0) {
          if (!["classic", "module"].includes(options.type)) throw new TypeError("Invalid Service Worker type.");
          nativeOptions.type = options.type;
        }
        if (options.updateViaCache !== void 0) {
          if (!["all", "imports", "none"].includes(options.updateViaCache)) throw new TypeError("Invalid updateViaCache.");
          nativeOptions.updateViaCache = options.updateViaCache;
        }
      } catch (error) {
        emit("PwaError", {
          operation: "register",
          error: error
        }, element);
        return Promise.reject(error);
      }
      var key = script.href + JSON.stringify(nativeOptions);
      if (registrationKey === key && (pendingRegistration || registration)) return pendingRegistration || Promise.resolve(registration);
      var token = revision, request = ++registrationRevision;
      registrationKey = key;
      workerState = "registering";
      var task = Promise.resolve().then(function() {
        if (!active || token !== revision) throw new Error("PWA registration was canceled by destroy.");
        return root.navigator.serviceWorker.register(script.href, nativeOptions);
      }).then(function(value) {
        if (!active || token !== revision || request !== registrationRevision) return value;
        registration = value;
        workerState = "registered";
        emit("PwaWorkerRegistered", {
          registration: value
        }, element);
        if (active && token === revision && request === registrationRevision) watchRegistration(value);
        return value;
      }).catch(function(error) {
        if (active && token === revision && request === registrationRevision) {
          workerState = "error";
          registrationKey = null;
          emit("PwaError", {
            operation: "register",
            error: error
          }, element);
        }
        throw error;
      }).finally(function() {
        if (pendingRegistration === task) pendingRegistration = null;
      });
      pendingRegistration = task;
      return task;
    }
    function checkUpdate() {
      return _checkUpdate.apply(this, arguments);
    }
    function _checkUpdate() {
      _checkUpdate = _asyncToGenerator(/* @__PURE__ */ _regenerator().m(function _callee2() {
        var token, value, _t2, _t3;
        return _regenerator().w(function(_context2) {
          while (1) switch (_context2.p = _context2.n) {
            case 0:
              token = revision;
              _context2.p = 1;
              if (!pendingRegistration) {
                _context2.n = 3;
                break;
              }
              _context2.n = 2;
              return pendingRegistration;
            case 2:
              _t2 = _context2.v;
              _context2.n = 4;
              break;
            case 3:
              _t2 = registration;
            case 4:
              value = _t2;
              if (!(!value || !active || token !== revision)) {
                _context2.n = 5;
                break;
              }
              return _context2.a(2, null);
            case 5:
              _context2.n = 6;
              return value.update();
            case 6:
              return _context2.a(2, value);
            case 7:
              _context2.p = 7;
              _t3 = _context2.v;
              if (active && token === revision) {
                workerState = "error";
                emit("PwaError", {
                  operation: "update",
                  error: _t3
                });
              }
              throw _t3;
            case 8:
              return _context2.a(2);
          }
        }, _callee2, null, [[1, 7]]);
      }));
      return _checkUpdate.apply(this, arguments);
    }
    function applyUpdate() {
      var _registration;
      if (!active || !((_registration = registration) !== null && _registration !== void 0 && _registration.waiting)) return false;
      registration.waiting.postMessage({
        type: "AELLUX_PWA_SKIP_WAITING"
      });
      return true;
    }
  })(typeof globalThis !== "undefined" ? globalThis : window);
})();
//# sourceMappingURL=aellux.ext.pwa.legacy.js.map
