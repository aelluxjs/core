/*! Includes dialog-polyfill (BSD-3-Clause). Copyright and license text: third-party/licenses/dialog-polyfill.LICENSE in this distribution. */
(function() {
  var __defProp = Object.defineProperty;
  var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __hasOwnProp = Object.prototype.hasOwnProperty;
  var __esm = function(fn, res) {
    return function __init() {
      return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
    };
  };
  var __commonJS = function(cb, mod) {
    return function __require() {
      return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
    };
  };
  var __copyProps = function(to, from, except, desc) {
    if (from && typeof from === "object" || typeof from === "function")
      for (var keys = __getOwnPropNames(from), i = 0, n = keys.length, key; i < n; i++) {
        key = keys[i];
        if (!__hasOwnProp.call(to, key) && key !== except)
          __defProp(to, key, { get: function(k) {
            return from[k];
          }.bind(null, key), enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
      }
    return to;
  };
  var __toCommonJS = function(mod) {
    return __copyProps(__defProp({}, "__esModule", { value: true }), mod);
  };

  // src/internal/attach-dialog-extension.js
  function attachDialogExtension(root2) {
    var prepareDialog = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : function() {
    };
    var AelluxJs = root2.AelluxJs;
    var extensionName = "dialog";
    if (!AelluxJs) {
      throw new Error('[aellux.js] Cannot attach the "'.concat(extensionName, '" extension: root.AelluxJs is not defined. Load the aellux.js boot script before this extension.'));
    }
    AelluxJs.extAttach(extensionName, {
      init: init,
      destroy: destroy,
      show: show,
      showModal: showModal,
      close: close
    });
    function init() {
      AelluxJs.mountManager.add({
        // Lower priorities mount first, before ordinary consuming Extensions.
        extensionName: extensionName,
        selector: "dialog",
        priority: -1,
        mount: function mount(element) {
          return prepareDialog(element);
        },
        controllers: ["show", "showModal", "close"]
      });
    }
    function destroy() {
      AelluxJs.mountManager.remove({
        extensionName: extensionName
      });
    }
    function show(element) {
      for (var _len = arguments.length, args = new Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
        args[_key - 1] = arguments[_key];
      }
      return element.show.apply(element, args);
    }
    function showModal(element) {
      for (var _len2 = arguments.length, args = new Array(_len2 > 1 ? _len2 - 1 : 0), _key2 = 1; _key2 < _len2; _key2++) {
        args[_key2 - 1] = arguments[_key2];
      }
      return element.showModal.apply(element, args);
    }
    function close(element) {
      for (var _len3 = arguments.length, args = new Array(_len3 > 1 ? _len3 - 1 : 0), _key3 = 1; _key3 < _len3; _key3++) {
        args[_key3 - 1] = arguments[_key3];
      }
      return element.close.apply(element, args);
    }
  }
  var init_attach_dialog_extension = __esm({
    "src/internal/attach-dialog-extension.js": function() {
      /*! aellux.js | SPDX-License-Identifier: Apache-2.0 | See LICENSE for terms. */
    }
  });

  // node_modules/dialog-polyfill/dist/dialog-polyfill.js
  var require_dialog_polyfill = __commonJS({
    "node_modules/dialog-polyfill/dist/dialog-polyfill.js": function(exports, module) {
      (function(global, factory) {
        typeof exports === "object" && typeof module !== "undefined" ? module.exports = factory() : typeof define === "function" && define.amd ? define(factory) : (global = global || self, global.dialogPolyfill = factory());
      })(exports, function() {
        "use strict";
        var supportCustomEvent = window.CustomEvent;
        if (!supportCustomEvent || typeof supportCustomEvent === "object") {
          supportCustomEvent = function CustomEvent(event, x) {
            x = x || {};
            var ev = document.createEvent("CustomEvent");
            ev.initCustomEvent(event, !!x.bubbles, !!x.cancelable, x.detail || null);
            return ev;
          };
          supportCustomEvent.prototype = window.Event.prototype;
        }
        function safeDispatchEvent(target, event) {
          var check = "on" + event.type.toLowerCase();
          if (typeof target[check] === "function") {
            target[check](event);
          }
          return target.dispatchEvent(event);
        }
        function createsStackingContext(el) {
          while (el && el !== document.body) {
            var s = window.getComputedStyle(el);
            var invalid = function(k, ok) {
              return !(s[k] === void 0 || s[k] === ok);
            };
            if (s.opacity < 1 || invalid("zIndex", "auto") || invalid("transform", "none") || invalid("mixBlendMode", "normal") || invalid("filter", "none") || invalid("perspective", "none") || s["isolation"] === "isolate" || s.position === "fixed" || s.webkitOverflowScrolling === "touch") {
              return true;
            }
            el = el.parentElement;
          }
          return false;
        }
        function findNearestDialog(el) {
          while (el) {
            if (el.localName === "dialog") {
              return (
                /** @type {HTMLDialogElement} */
                el
              );
            }
            if (el.parentElement) {
              el = el.parentElement;
            } else if (el.parentNode) {
              el = el.parentNode.host;
            } else {
              el = null;
            }
          }
          return null;
        }
        function safeBlur(el) {
          while (el && el.shadowRoot && el.shadowRoot.activeElement) {
            el = el.shadowRoot.activeElement;
          }
          if (el && el.blur && el !== document.body) {
            el.blur();
          }
        }
        function inNodeList(nodeList, node) {
          for (var i = 0; i < nodeList.length; ++i) {
            if (nodeList[i] === node) {
              return true;
            }
          }
          return false;
        }
        function isFormMethodDialog(el) {
          if (!el || !el.hasAttribute("method")) {
            return false;
          }
          return el.getAttribute("method").toLowerCase() === "dialog";
        }
        function findFocusableElementWithin(hostElement) {
          var opts = ["button", "input", "keygen", "select", "textarea"];
          var query = opts.map(function(el) {
            return el + ":not([disabled])";
          });
          query.push('[tabindex]:not([disabled]):not([tabindex=""])');
          var target = hostElement.querySelector(query.join(", "));
          if (!target && "attachShadow" in Element.prototype) {
            var elems = hostElement.querySelectorAll("*");
            for (var i = 0; i < elems.length; i++) {
              if (elems[i].tagName && elems[i].shadowRoot) {
                target = findFocusableElementWithin(elems[i].shadowRoot);
                if (target) {
                  break;
                }
              }
            }
          }
          return target;
        }
        function isConnected(element) {
          return element.isConnected || document.body.contains(element);
        }
        function findFormSubmitter(event) {
          if (event.submitter) {
            return event.submitter;
          }
          var form = event.target;
          if (!(form instanceof HTMLFormElement)) {
            return null;
          }
          var submitter = dialogPolyfill.formSubmitter;
          if (!submitter) {
            var target = event.target;
            var root2 = "getRootNode" in target && target.getRootNode() || document;
            submitter = root2.activeElement;
          }
          if (!submitter || submitter.form !== form) {
            return null;
          }
          return submitter;
        }
        function maybeHandleSubmit(event) {
          if (event.defaultPrevented) {
            return;
          }
          var form = (
            /** @type {!HTMLFormElement} */
            event.target
          );
          var value = dialogPolyfill.imagemapUseValue;
          var submitter = findFormSubmitter(event);
          if (value === null && submitter) {
            value = submitter.value;
          }
          var dialog = findNearestDialog(form);
          if (!dialog) {
            return;
          }
          var formmethod = submitter && submitter.getAttribute("formmethod") || form.getAttribute("method");
          if (formmethod !== "dialog") {
            return;
          }
          event.preventDefault();
          if (value != null) {
            dialog.close(value);
          } else {
            dialog.close();
          }
        }
        function dialogPolyfillInfo(dialog) {
          this.dialog_ = dialog;
          this.replacedStyleTop_ = false;
          this.openAsModal_ = false;
          if (!dialog.hasAttribute("role")) {
            dialog.setAttribute("role", "dialog");
          }
          dialog.show = this.show.bind(this);
          dialog.showModal = this.showModal.bind(this);
          dialog.close = this.close.bind(this);
          dialog.addEventListener("submit", maybeHandleSubmit, false);
          if (!("returnValue" in dialog)) {
            dialog.returnValue = "";
          }
          if ("MutationObserver" in window) {
            var mo = new MutationObserver(this.maybeHideModal.bind(this));
            mo.observe(dialog, { attributes: true, attributeFilter: ["open"] });
          } else {
            var removed = false;
            var cb = function() {
              removed ? this.downgradeModal() : this.maybeHideModal();
              removed = false;
            }.bind(this);
            var timeout;
            var delayModel = function(ev) {
              if (ev.target !== dialog) {
                return;
              }
              var cand = "DOMNodeRemoved";
              removed |= ev.type.substr(0, cand.length) === cand;
              window.clearTimeout(timeout);
              timeout = window.setTimeout(cb, 0);
            };
            ["DOMAttrModified", "DOMNodeRemoved", "DOMNodeRemovedFromDocument"].forEach(function(name) {
              dialog.addEventListener(name, delayModel);
            });
          }
          Object.defineProperty(dialog, "open", {
            set: this.setOpen.bind(this),
            get: dialog.hasAttribute.bind(dialog, "open")
          });
          this.backdrop_ = document.createElement("div");
          this.backdrop_.className = "backdrop";
          this.backdrop_.addEventListener("mouseup", this.backdropMouseEvent_.bind(this));
          this.backdrop_.addEventListener("mousedown", this.backdropMouseEvent_.bind(this));
          this.backdrop_.addEventListener("click", this.backdropMouseEvent_.bind(this));
        }
        dialogPolyfillInfo.prototype = /** @type {HTMLDialogElement.prototype} */
        {
          get dialog() {
            return this.dialog_;
          },
          /**
           * Maybe remove this dialog from the modal top layer. This is called when
           * a modal dialog may no longer be tenable, e.g., when the dialog is no
           * longer open or is no longer part of the DOM.
           */
          maybeHideModal: function() {
            if (this.dialog_.hasAttribute("open") && isConnected(this.dialog_)) {
              return;
            }
            this.downgradeModal();
          },
          /**
           * Remove this dialog from the modal top layer, leaving it as a non-modal.
           */
          downgradeModal: function() {
            if (!this.openAsModal_) {
              return;
            }
            this.openAsModal_ = false;
            this.dialog_.style.zIndex = "";
            if (this.replacedStyleTop_) {
              this.dialog_.style.top = "";
              this.replacedStyleTop_ = false;
            }
            this.backdrop_.parentNode && this.backdrop_.parentNode.removeChild(this.backdrop_);
            dialogPolyfill.dm.removeDialog(this);
          },
          /**
           * @param {boolean} value whether to open or close this dialog
           */
          setOpen: function(value) {
            if (value) {
              this.dialog_.hasAttribute("open") || this.dialog_.setAttribute("open", "");
            } else {
              this.dialog_.removeAttribute("open");
              this.maybeHideModal();
            }
          },
          /**
           * Handles mouse events ('mouseup', 'mousedown', 'click') on the fake .backdrop element, redirecting them as if
           * they were on the dialog itself.
           *
           * @param {!Event} e to redirect
           */
          backdropMouseEvent_: function(e) {
            if (!this.dialog_.hasAttribute("tabindex")) {
              var fake = document.createElement("div");
              this.dialog_.insertBefore(fake, this.dialog_.firstChild);
              fake.tabIndex = -1;
              fake.focus();
              this.dialog_.removeChild(fake);
            } else {
              this.dialog_.focus();
            }
            var redirectedEvent = document.createEvent("MouseEvents");
            redirectedEvent.initMouseEvent(
              e.type,
              e.bubbles,
              e.cancelable,
              window,
              e.detail,
              e.screenX,
              e.screenY,
              e.clientX,
              e.clientY,
              e.ctrlKey,
              e.altKey,
              e.shiftKey,
              e.metaKey,
              e.button,
              e.relatedTarget
            );
            this.dialog_.dispatchEvent(redirectedEvent);
            e.stopPropagation();
          },
          /**
           * Focuses on the first focusable element within the dialog. This will always blur the current
           * focus, even if nothing within the dialog is found.
           */
          focus_: function() {
            var target = this.dialog_.querySelector("[autofocus]:not([disabled])");
            if (!target && this.dialog_.tabIndex >= 0) {
              target = this.dialog_;
            }
            if (!target) {
              target = findFocusableElementWithin(this.dialog_);
            }
            safeBlur(document.activeElement);
            target && target.focus();
          },
          /**
           * Sets the zIndex for the backdrop and dialog.
           *
           * @param {number} dialogZ
           * @param {number} backdropZ
           */
          updateZIndex: function(dialogZ, backdropZ) {
            if (dialogZ < backdropZ) {
              throw new Error("dialogZ should never be < backdropZ");
            }
            this.dialog_.style.zIndex = dialogZ;
            this.backdrop_.style.zIndex = backdropZ;
          },
          /**
           * Shows the dialog. If the dialog is already open, this does nothing.
           */
          show: function() {
            if (!this.dialog_.open) {
              this.setOpen(true);
              this.focus_();
            }
          },
          /**
           * Show this dialog modally.
           */
          showModal: function() {
            if (this.dialog_.hasAttribute("open")) {
              throw new Error("Failed to execute 'showModal' on dialog: The element is already open, and therefore cannot be opened modally.");
            }
            if (!isConnected(this.dialog_)) {
              throw new Error("Failed to execute 'showModal' on dialog: The element is not in a Document.");
            }
            if (!dialogPolyfill.dm.pushDialog(this)) {
              throw new Error("Failed to execute 'showModal' on dialog: There are too many open modal dialogs.");
            }
            if (createsStackingContext(this.dialog_.parentElement)) {
              console.warn("A dialog is being shown inside a stacking context. This may cause it to be unusable. For more information, see this link: https://github.com/GoogleChrome/dialog-polyfill/#stacking-context");
            }
            this.setOpen(true);
            this.openAsModal_ = true;
            if (dialogPolyfill.needsCentering(this.dialog_)) {
              dialogPolyfill.reposition(this.dialog_);
              this.replacedStyleTop_ = true;
            } else {
              this.replacedStyleTop_ = false;
            }
            this.dialog_.parentNode.insertBefore(this.backdrop_, this.dialog_.nextSibling);
            this.focus_();
          },
          /**
           * Closes this HTMLDialogElement. This is optional vs clearing the open
           * attribute, however this fires a 'close' event.
           *
           * @param {string=} opt_returnValue to use as the returnValue
           */
          close: function(opt_returnValue) {
            if (!this.dialog_.hasAttribute("open")) {
              throw new Error("Failed to execute 'close' on dialog: The element does not have an 'open' attribute, and therefore cannot be closed.");
            }
            this.setOpen(false);
            if (opt_returnValue !== void 0) {
              this.dialog_.returnValue = opt_returnValue;
            }
            var closeEvent = new supportCustomEvent("close", {
              bubbles: false,
              cancelable: false
            });
            safeDispatchEvent(this.dialog_, closeEvent);
          }
        };
        var dialogPolyfill = {};
        dialogPolyfill.reposition = function(element) {
          var scrollTop = document.body.scrollTop || document.documentElement.scrollTop;
          var topValue = scrollTop + (window.innerHeight - element.offsetHeight) / 2;
          element.style.top = Math.max(scrollTop, topValue) + "px";
        };
        dialogPolyfill.isInlinePositionSetByStylesheet = function(element) {
          for (var i = 0; i < document.styleSheets.length; ++i) {
            var styleSheet = document.styleSheets[i];
            var cssRules = null;
            try {
              cssRules = styleSheet.cssRules;
            } catch (e) {
            }
            if (!cssRules) {
              continue;
            }
            for (var j = 0; j < cssRules.length; ++j) {
              var rule = cssRules[j];
              var selectedNodes = null;
              try {
                selectedNodes = document.querySelectorAll(rule.selectorText);
              } catch (e) {
              }
              if (!selectedNodes || !inNodeList(selectedNodes, element)) {
                continue;
              }
              var cssTop = rule.style.getPropertyValue("top");
              var cssBottom = rule.style.getPropertyValue("bottom");
              if (cssTop && cssTop !== "auto" || cssBottom && cssBottom !== "auto") {
                return true;
              }
            }
          }
          return false;
        };
        dialogPolyfill.needsCentering = function(dialog) {
          var computedStyle = window.getComputedStyle(dialog);
          if (computedStyle.position !== "absolute") {
            return false;
          }
          if (dialog.style.top !== "auto" && dialog.style.top !== "" || dialog.style.bottom !== "auto" && dialog.style.bottom !== "") {
            return false;
          }
          return !dialogPolyfill.isInlinePositionSetByStylesheet(dialog);
        };
        dialogPolyfill.forceRegisterDialog = function(element) {
          if (window.HTMLDialogElement || element.showModal) {
            console.warn("This browser already supports <dialog>, the polyfill may not work correctly", element);
          }
          if (element.localName !== "dialog") {
            throw new Error("Failed to register dialog: The element is not a dialog.");
          }
          new dialogPolyfillInfo(
            /** @type {!HTMLDialogElement} */
            element
          );
        };
        dialogPolyfill.registerDialog = function(element) {
          if (!element.showModal) {
            dialogPolyfill.forceRegisterDialog(element);
          }
        };
        dialogPolyfill.DialogManager = function() {
          this.pendingDialogStack = [];
          var checkDOM = this.checkDOM_.bind(this);
          this.overlay = document.createElement("div");
          this.overlay.className = "_dialog_overlay";
          this.overlay.addEventListener("click", function(e) {
            this.forwardTab_ = void 0;
            e.stopPropagation();
            checkDOM([]);
          }.bind(this));
          this.handleKey_ = this.handleKey_.bind(this);
          this.handleFocus_ = this.handleFocus_.bind(this);
          this.zIndexLow_ = 1e5;
          this.zIndexHigh_ = 1e5 + 150;
          this.forwardTab_ = void 0;
          if ("MutationObserver" in window) {
            this.mo_ = new MutationObserver(function(records) {
              var removed = [];
              records.forEach(function(rec) {
                for (var i = 0, c; c = rec.removedNodes[i]; ++i) {
                  if (!(c instanceof Element)) {
                    continue;
                  } else if (c.localName === "dialog") {
                    removed.push(c);
                  }
                  removed = removed.concat(c.querySelectorAll("dialog"));
                }
              });
              removed.length && checkDOM(removed);
            });
          }
        };
        dialogPolyfill.DialogManager.prototype.blockDocument = function() {
          document.documentElement.addEventListener("focus", this.handleFocus_, true);
          document.addEventListener("keydown", this.handleKey_);
          this.mo_ && this.mo_.observe(document, { childList: true, subtree: true });
        };
        dialogPolyfill.DialogManager.prototype.unblockDocument = function() {
          document.documentElement.removeEventListener("focus", this.handleFocus_, true);
          document.removeEventListener("keydown", this.handleKey_);
          this.mo_ && this.mo_.disconnect();
        };
        dialogPolyfill.DialogManager.prototype.updateStacking = function() {
          var zIndex = this.zIndexHigh_;
          for (var i = 0, dpi; dpi = this.pendingDialogStack[i]; ++i) {
            dpi.updateZIndex(--zIndex, --zIndex);
            if (i === 0) {
              this.overlay.style.zIndex = --zIndex;
            }
          }
          var last = this.pendingDialogStack[0];
          if (last) {
            var p = last.dialog.parentNode || document.body;
            p.appendChild(this.overlay);
          } else if (this.overlay.parentNode) {
            this.overlay.parentNode.removeChild(this.overlay);
          }
        };
        dialogPolyfill.DialogManager.prototype.containedByTopDialog_ = function(candidate) {
          while (candidate = findNearestDialog(candidate)) {
            for (var i = 0, dpi; dpi = this.pendingDialogStack[i]; ++i) {
              if (dpi.dialog === candidate) {
                return i === 0;
              }
            }
            candidate = candidate.parentElement;
          }
          return false;
        };
        dialogPolyfill.DialogManager.prototype.handleFocus_ = function(event) {
          var target = event.composedPath ? event.composedPath()[0] : event.target;
          if (this.containedByTopDialog_(target)) {
            return;
          }
          if (document.activeElement === document.documentElement) {
            return;
          }
          event.preventDefault();
          event.stopPropagation();
          safeBlur(
            /** @type {Element} */
            target
          );
          if (this.forwardTab_ === void 0) {
            return;
          }
          var dpi = this.pendingDialogStack[0];
          var dialog = dpi.dialog;
          var position = dialog.compareDocumentPosition(target);
          if (position & Node.DOCUMENT_POSITION_PRECEDING) {
            if (this.forwardTab_) {
              dpi.focus_();
            } else if (target !== document.documentElement) {
              document.documentElement.focus();
            }
          }
          return false;
        };
        dialogPolyfill.DialogManager.prototype.handleKey_ = function(event) {
          this.forwardTab_ = void 0;
          if (event.keyCode === 27) {
            event.preventDefault();
            event.stopPropagation();
            var cancelEvent = new supportCustomEvent("cancel", {
              bubbles: false,
              cancelable: true
            });
            var dpi = this.pendingDialogStack[0];
            if (dpi && safeDispatchEvent(dpi.dialog, cancelEvent)) {
              dpi.dialog.close();
            }
          } else if (event.keyCode === 9) {
            this.forwardTab_ = !event.shiftKey;
          }
        };
        dialogPolyfill.DialogManager.prototype.checkDOM_ = function(removed) {
          var clone = this.pendingDialogStack.slice();
          clone.forEach(function(dpi) {
            if (removed.indexOf(dpi.dialog) !== -1) {
              dpi.downgradeModal();
            } else {
              dpi.maybeHideModal();
            }
          });
        };
        dialogPolyfill.DialogManager.prototype.pushDialog = function(dpi) {
          var allowed = (this.zIndexHigh_ - this.zIndexLow_) / 2 - 1;
          if (this.pendingDialogStack.length >= allowed) {
            return false;
          }
          if (this.pendingDialogStack.unshift(dpi) === 1) {
            this.blockDocument();
          }
          this.updateStacking();
          return true;
        };
        dialogPolyfill.DialogManager.prototype.removeDialog = function(dpi) {
          var index = this.pendingDialogStack.indexOf(dpi);
          if (index === -1) {
            return;
          }
          this.pendingDialogStack.splice(index, 1);
          if (this.pendingDialogStack.length === 0) {
            this.unblockDocument();
          }
          this.updateStacking();
        };
        dialogPolyfill.dm = new dialogPolyfill.DialogManager();
        dialogPolyfill.formSubmitter = null;
        dialogPolyfill.imagemapUseValue = null;
        if (window.HTMLDialogElement === void 0) {
          var testForm = document.createElement("form");
          testForm.setAttribute("method", "dialog");
          if (testForm.method !== "dialog") {
            var methodDescriptor = Object.getOwnPropertyDescriptor(HTMLFormElement.prototype, "method");
            if (methodDescriptor) {
              var realGet = methodDescriptor.get;
              methodDescriptor.get = function() {
                if (isFormMethodDialog(this)) {
                  return "dialog";
                }
                return realGet.call(this);
              };
              var realSet = methodDescriptor.set;
              methodDescriptor.set = function(v) {
                if (typeof v === "string" && v.toLowerCase() === "dialog") {
                  return this.setAttribute("method", v);
                }
                return realSet.call(this, v);
              };
              Object.defineProperty(HTMLFormElement.prototype, "method", methodDescriptor);
            }
          }
          document.addEventListener("click", function(ev) {
            dialogPolyfill.formSubmitter = null;
            dialogPolyfill.imagemapUseValue = null;
            if (ev.defaultPrevented) {
              return;
            }
            var target = (
              /** @type {Element} */
              ev.target
            );
            if ("composedPath" in ev) {
              var path = ev.composedPath();
              target = path.shift() || target;
            }
            if (!target || !isFormMethodDialog(target.form)) {
              return;
            }
            var valid = target.type === "submit" && ["button", "input"].indexOf(target.localName) > -1;
            if (!valid) {
              if (!(target.localName === "input" && target.type === "image")) {
                return;
              }
              dialogPolyfill.imagemapUseValue = ev.offsetX + "," + ev.offsetY;
            }
            var dialog = findNearestDialog(target);
            if (!dialog) {
              return;
            }
            dialogPolyfill.formSubmitter = target;
          }, false);
          document.addEventListener("submit", function(ev) {
            var form = ev.target;
            var dialog = findNearestDialog(form);
            if (dialog) {
              return;
            }
            var submitter = findFormSubmitter(ev);
            var formmethod = submitter && submitter.getAttribute("formmethod") || form.getAttribute("method");
            if (formmethod === "dialog") {
              ev.preventDefault();
            }
          });
          var nativeFormSubmit = HTMLFormElement.prototype.submit;
          var replacementFormSubmit = function() {
            if (!isFormMethodDialog(this)) {
              return nativeFormSubmit.call(this);
            }
            var dialog = findNearestDialog(this);
            dialog && dialog.close();
          };
          HTMLFormElement.prototype.submit = replacementFormSubmit;
        }
        return dialogPolyfill;
      });
    }
  });

  // src/internal/install-dialog-polyfill.js
  function installDialogPolyfill(root2, dialog, css) {
    if (hasDialogAPI(dialog)) return;
    var document2 = root2.document;
    var attribute = root2.AelluxJs.attr("dialog-polyfill-style");
    var style = document2.querySelector("style[" + attribute + "]");
    if (!style) {
      style = document2.createElement("style");
      style.setAttribute(attribute, "");
      style.textContent = css;
      document2.head.insertBefore(style, document2.head.firstChild);
    }
    var dialogPolyfill = style.aelluxDialogPolyfill;
    if (!dialogPolyfill) {
      dialogPolyfill = require_dialog_polyfill();
      Object.defineProperty(style, "aelluxDialogPolyfill", {
        value: dialogPolyfill
      });
    }
    dialogPolyfill.forceRegisterDialog(dialog);
  }
  function hasDialogAPI(dialog) {
    return typeof dialog.show === "function" && typeof dialog.showModal === "function" && typeof dialog.close === "function";
  }
  var init_install_dialog_polyfill = __esm({
    "src/internal/install-dialog-polyfill.js": function() {
      /*! aellux.js | SPDX-License-Identifier: Apache-2.0 | See LICENSE for terms. */
    }
  });

  // node_modules/dialog-polyfill/dist/dialog-polyfill.css
  var dialog_polyfill_default;
  var init_dialog_polyfill = __esm({
    "node_modules/dialog-polyfill/dist/dialog-polyfill.css": function() {
      dialog_polyfill_default = "dialog {\n  position: absolute;\n  left: 0; right: 0;\n  width: -moz-fit-content;\n  width: -webkit-fit-content;\n  width: fit-content;\n  height: -moz-fit-content;\n  height: -webkit-fit-content;\n  height: fit-content;\n  margin: auto;\n  border: solid;\n  padding: 1em;\n  background: white;\n  color: black;\n  display: block;\n}\n\ndialog:not([open]) {\n  display: none;\n}\n\ndialog + .backdrop {\n  position: fixed;\n  top: 0; right: 0; bottom: 0; left: 0;\n  background: rgba(0,0,0,0.1);\n}\n\n._dialog_overlay {\n  position: fixed;\n  top: 0; right: 0; bottom: 0; left: 0;\n}\n\ndialog.fixed {\n  position: fixed;\n  top: 50%;\n  transform: translate(0, -50%);\n}";
    }
  });

  // src/internal/dialog.legacy.entry.js
  var dialog_legacy_entry_exports = {};
  var root;
  var init_dialog_legacy_entry = __esm({
    "src/internal/dialog.legacy.entry.js": function() {
      init_attach_dialog_extension();
      init_install_dialog_polyfill();
      init_dialog_polyfill();
      /*! aellux.js | SPDX-License-Identifier: Apache-2.0 | See LICENSE for terms. */
      root = typeof globalThis !== "undefined" ? globalThis : window;
      attachDialogExtension(root, function(element) {
        return installDialogPolyfill(root, element, dialog_polyfill_default);
      });
    }
  });

  // aellux.ext.dialog.legacy.entry.js
  init_dialog_legacy_entry();
})();
//# sourceMappingURL=aellux.ext.dialog.legacy.js.map
