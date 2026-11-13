(function() {
  // src/internal/sample-css-easing.js
  /*! aellux.js | SPDX-License-Identifier: Apache-2.0 | See LICENSE for terms. */
  function sampleCssEasing(api, name) {
    var points = [];
    var round = function round2(value2) {
      return Math.round(value2 * 1e5) / 1e5;
    };
    try {
      for (var index = 0; index <= 60; index++) {
        var progress = index / 60;
        var value = api.ease(name, progress);
        if (!Number.isFinite(value)) return null;
        points.push("".concat(round(value), " ").concat(round(progress * 100), "%"));
      }
    } catch (_) {
      return null;
    }
    return "linear(".concat(points.join(", "), ")");
  }

  // src/internal/create-present-playback.js
  function _typeof(o) {
    "@babel/helpers - typeof";
    return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function(o2) {
      return typeof o2;
    } : function(o2) {
      return o2 && "function" == typeof Symbol && o2.constructor === Symbol && o2 !== Symbol.prototype ? "symbol" : typeof o2;
    }, _typeof(o);
  }
  var _excluded = ["computedOffset"];
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
  function _objectWithoutProperties(e, t) {
    if (null == e) return {};
    var o, r, i = _objectWithoutPropertiesLoose(e, t);
    if (Object.getOwnPropertySymbols) {
      var n = Object.getOwnPropertySymbols(e);
      for (r = 0; r < n.length; r++) o = n[r], -1 === t.indexOf(o) && {}.propertyIsEnumerable.call(e, o) && (i[o] = e[o]);
    }
    return i;
  }
  function _objectWithoutPropertiesLoose(r, e) {
    if (null == r) return {};
    var t = {};
    for (var n in r) if ({}.hasOwnProperty.call(r, n)) {
      if (-1 !== e.indexOf(n)) continue;
      t[n] = r[n];
    }
    return t;
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
  function _toConsumableArray(r) {
    return _arrayWithoutHoles(r) || _iterableToArray(r) || _unsupportedIterableToArray(r) || _nonIterableSpread();
  }
  function _nonIterableSpread() {
    throw new TypeError("Invalid attempt to spread non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.");
  }
  function _unsupportedIterableToArray(r, a) {
    if (r) {
      if ("string" == typeof r) return _arrayLikeToArray(r, a);
      var t = {}.toString.call(r).slice(8, -1);
      return "Object" === t && r.constructor && (t = r.constructor.name), "Map" === t || "Set" === t ? Array.from(r) : "Arguments" === t || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(t) ? _arrayLikeToArray(r, a) : void 0;
    }
  }
  function _iterableToArray(r) {
    if ("undefined" != typeof Symbol && null != r[Symbol.iterator] || null != r["@@iterator"]) return Array.from(r);
  }
  function _arrayWithoutHoles(r) {
    if (Array.isArray(r)) return _arrayLikeToArray(r);
  }
  function _arrayLikeToArray(r, a) {
    (null == a || a > r.length) && (a = r.length);
    for (var e = 0, n = Array(a); e < a; e++) n[e] = r[e];
    return n;
  }
  /*! aellux.js | SPDX-License-Identifier: Apache-2.0 | See LICENSE for terms. */
  var presentPlaybackProperties = ["opacity", "transform", "grid-template-rows", "grid-template-columns", "max-height", "max-width", "--ae-present-pop-phase"];
  var camel = function camel2(name) {
    return name.startsWith("--") ? name : name.replace(/-([a-z])/g, function(_, letter) {
      return letter.toUpperCase();
    });
  };
  var suffix = function suffix2(name) {
    return name.replace(/^--ae-present-/, "");
  };
  var seconds = function seconds2(value) {
    return (parseFloat(value) || 0) * (String(value).trim().endsWith("ms") ? 1 : 1e3);
  };
  var list = function list2(value) {
    return value.split(/,(?![^()]*\))/).map(function(item) {
      return item.trim();
    });
  };
  var animationProperties = ["name", "duration", "delay", "timing-function", "direction", "fill-mode", "iteration-count", "play-state"];
  var transitionProperties = ["property", "duration", "delay", "timing-function"];
  function createPresentPlayback(root, api) {
    var interpolatedSizes = false;
    var now = function now2() {
      return root.performance.now();
    };
    var animations = function animations2(element) {
      try {
        return element.getAnimations();
      } catch (_) {
        return null;
      }
    };
    var properties = function properties2(element, controller, progress) {
      var tokens = (element.getAttribute(api.attr("present")) || "").split(/\s+/);
      return presentPlaybackProperties.filter(function(property) {
        if (property === "--ae-present-pop-phase") return progress;
        if (property === "transform") return tokens.includes(property) && !element.hasAttribute(api.attr("anchor"));
        if (property === "opacity") return tokens.includes(property);
        var dimension = /rows|height/.test(property) ? "height" : "width";
        return tokens.includes(dimension) && property.startsWith(controller.presentMotion ? "grid" : "max");
      });
    };
    function init() {
      interpolatedSizes = !!api.registerCssProperty.apply(api, _toConsumableArray(["height", "width"].map(function(dimension) {
        return {
          name: "--ae-present-reverse-max-".concat(dimension),
          syntax: "<length>",
          initialValue: "0px"
        };
      })));
    }
    function capture(element, controller, apply, size, progress) {
      var _api$motion, _root$CSS;
      var direction = arguments.length > 5 && arguments[5] !== void 0 ? arguments[5] : "pop";
      var computed = root.getComputedStyle(element);
      var tracks = properties(element, controller, progress).map(function(property) {
        var dimension = /rows|height/.test(property) ? "height" : "width";
        var to = property === "--ae-present-pop-phase" ? "1" : property.startsWith("max-") ? "".concat(direction === "pop" ? size[dimension] : 0, "px") : computed.getPropertyValue("--ae-".concat(direction, "-").concat(property.startsWith("grid") ? dimension : property)).trim();
        var from = property.startsWith("grid") ? computed.getPropertyValue("--ae-".concat(direction === "pop" ? "from" : "pop", "-").concat(dimension)).trim() : computed.getPropertyValue(property).trim();
        return {
          property: property,
          from: from,
          to: to
        };
      });
      var before = animations(element);
      apply();
      var style = root.getComputedStyle(element);
      var names = list(style.transitionProperty), durations = list(style.transitionDuration), delays = list(style.transitionDelay), easings = list(style.transitionTimingFunction);
      var _iterator = _createForOfIteratorHelper(tracks), _step;
      try {
        for (_iterator.s(); !(_step = _iterator.n()).done; ) {
          var track = _step.value;
          var index = names.lastIndexOf(track.property);
          if (index < 0) index = names.lastIndexOf("all");
          track.duration = index < 0 ? 0 : seconds(durations[index % durations.length]);
          track.delay = index < 0 ? 0 : seconds(delays[index % delays.length]);
          track.easing = index < 0 ? "linear" : easings[index % easings.length];
        }
      } catch (err) {
        _iterator.e(err);
      } finally {
        _iterator.f();
      }
      var after = animations(element);
      var advanced = style.getPropertyValue("--ae-".concat(direction, "-aellux-ease")).trim();
      var curve = advanced && (_api$motion = api.motion) !== null && _api$motion !== void 0 && _api$motion.supported(element) ? sampleCssEasing(api, advanced) : null;
      return {
        tracks: tracks,
        effects: after === null || after === void 0 ? void 0 : after.filter(function(effect) {
          return !(before !== null && before !== void 0 && before.includes(effect)) && tracks.some(function(track2) {
            return track2.property === effect.transitionProperty;
          });
        }),
        advancedEasing: curve && (_root$CSS = root.CSS) !== null && _root$CSS !== void 0 && _root$CSS.supports("animation-timing-function", curve) ? curve : null,
        nativeEasing: style.getPropertyValue("--ae-".concat(direction, "-ease")).trim(),
        start: now(),
        completed: false
      };
    }
    function _snapshot(element, controller, progress) {
      var record = controller.opening;
      if (!record) {
        if (controller.transition) return [];
        var owned = properties(element, controller, progress);
        var memory = api.persist.element.save(element, [], owned);
        var transition = api.persist.element.save(element, [], ["transition-property"]);
        var classes = ["pop", "popping"].map(function(name) {
          return api.className(name);
        }).filter(function(name) {
          return element.classList.contains(name);
        });
        var to = owned.map(function(property) {
          var style2 = root.getComputedStyle(element);
          if (property === "transform" || property.startsWith("grid")) {
            var name = property === "transform" ? property : property.endsWith("rows") ? "height" : "width";
            return style2.getPropertyValue("--ae-pop-".concat(name)).trim() || style2.getPropertyValue(property).trim();
          }
          return property.startsWith("max-") ? style2.getPropertyValue(property.slice(4)).trim() : style2.getPropertyValue(property).trim();
        });
        var style = root.getComputedStyle(element);
        var duration = seconds(style.getPropertyValue("--ae-pop-duration"));
        var easing = style.getPropertyValue("--ae-pop-ease").trim() || "ease-out";
        try {
          var _element$classList;
          element.style.setProperty("transition-property", "none", "important");
          (_element$classList = element.classList).remove.apply(_element$classList, _toConsumableArray(classes));
          if (controller.measuredHeight) element.style.setProperty("max-height", "0px", "important");
          if (controller.measuredWidth) element.style.setProperty("max-width", "0px", "important");
          if (progress) element.style.setProperty("--ae-present-pop-phase", "0");
          var from = root.getComputedStyle(element);
          record = {
            completed: true,
            start: now(),
            tracks: owned.map(function(property, index) {
              var name = property === "transform" ? property : property.endsWith("rows") ? "height" : "width";
              var start = property === "transform" || property.startsWith("grid") ? from.getPropertyValue("--ae-from-".concat(name)).trim() : from.getPropertyValue(property).trim();
              return {
                property: property,
                from: start,
                to: to[index],
                duration: duration,
                delay: 0,
                easing: easing
              };
            })
          };
        } finally {
          var _element$classList2;
          (_element$classList2 = element.classList).add.apply(_element$classList2, _toConsumableArray(classes));
          memory.restore();
          element.getBoundingClientRect();
          transition.restore();
        }
      }
      if (record.effects) {
        return record.effects.map(function(animation) {
          var timing = animation.effect.getTiming();
          if (record.advancedEasing) timing.easing = record.advancedEasing;
          else if (/^linear\(/i.test(record.nativeEasing || "") && timing.easing.startsWith("linear(")) timing.easing = record.nativeEasing;
          var duration2 = Number(timing.duration);
          var time = record.completed ? duration2 : Math.max(0, Math.min(duration2, Number(animation.currentTime) - timing.delay));
          var source = record.tracks.find(function(track) {
            return track.property === animation.transitionProperty;
          });
          var frames = source.property.startsWith("grid") ? [_defineProperty({}, camel(source.property), source.from), _defineProperty({}, camel(source.property), source.to)] : animation.effect.getKeyframes().map(function(_ref3) {
            var computedOffset = _ref3.computedOffset, frame = _objectWithoutProperties(_ref3, _excluded);
            return frame;
          });
          return {
            property: animation.transitionProperty,
            frames: frames,
            timing: timing,
            time: time,
            duration: duration2
          };
        }).filter(function(track) {
          return Number.isFinite(track.duration) && track.duration > 0 && track.time > 0;
        });
      }
      return record.tracks.map(function(track) {
        return _objectSpread(_objectSpread({}, track), {}, {
          frames: [_defineProperty({}, camel(track.property), track.from), _defineProperty({}, camel(track.property), track.to)],
          timing: {
            easing: /^linear\(/i.test(record.nativeEasing || "") ? record.nativeEasing : track.easing
          },
          time: record.completed ? track.duration : Math.max(0, Math.min(track.duration, now() - record.start - track.delay))
        });
      }).filter(function(track) {
        return track.duration > 0 && track.time > 0 && track.from !== track.to;
      });
    }
    function complete(element, controller, progress) {
      if (!controller.opening) return;
      controller.opening.completed = true;
      var tracks = _snapshot(element, controller, progress);
      controller.opening = {
        completed: true,
        start: now(),
        tracks: [],
        effects: null,
        saved: tracks
      };
    }
    function reverse(element, tracks, progress) {
      var interactive = arguments.length > 3 && arguments[3] !== void 0 ? arguments[3] : false;
      var duration = Math.max.apply(Math, [0].concat(_toConsumableArray(tracks.map(function(track) {
        return track.time;
      }))));
      var owned = _toConsumableArray(new Set(tracks.map(function(track) {
        return track.property;
      })));
      var privateProperties = owned.flatMap(function(property) {
        return ["from", "to"].map(function(phase) {
          return "--ae-present-reverse-".concat(phase, "-").concat(suffix(property));
        });
      });
      privateProperties.push.apply(privateProperties, _toConsumableArray(owned.filter(function(property) {
        return property.startsWith("max-");
      }).map(function(property) {
        return "--ae-present-reverse-".concat(property);
      })));
      var memory = null, effects = [];
      var inspectable = typeof element.getAnimations === "function" && root.KeyframeEffect && typeof root.KeyframeEffect.prototype.setKeyframes === "function";
      function apply() {
        memory = api.persist.element.save(element, [], [].concat(_toConsumableArray(owned), _toConsumableArray(privateProperties), _toConsumableArray(transitionProperties.map(function(name2) {
          return "transition-".concat(name2);
        })), _toConsumableArray(animationProperties.map(function(name2) {
          return "animation-".concat(name2);
        }))));
        var style = element.style;
        if (!duration) return;
        if (inspectable) {
          var _animations;
          style.setProperty("transition-property", "none", "important");
          var _iterator2 = _createForOfIteratorHelper(tracks), _step2;
          try {
            for (_iterator2.s(); !(_step2 = _iterator2.n()).done; ) {
              var track = _step2.value;
              style.setProperty(track.property, track.frames[0][camel(track.property)], track.property.startsWith("--") ? "" : "important");
            }
          } catch (err) {
            _iterator2.e(err);
          } finally {
            _iterator2.f();
          }
          element.getBoundingClientRect();
          style.setProperty("transition-property", owned.join(","), "important");
          style.setProperty("transition-duration", tracks.map(function(track2) {
            return "".concat(track2.duration, "ms");
          }).join(","), "important");
          style.setProperty("transition-delay", "0ms", "important");
          style.setProperty("transition-timing-function", "linear", "important");
          var _iterator3 = _createForOfIteratorHelper(tracks), _step3;
          try {
            for (_iterator3.s(); !(_step3 = _iterator3.n()).done; ) {
              var _track = _step3.value;
              style.setProperty(_track.property, _track.frames[_track.frames.length - 1][camel(_track.property)], _track.property.startsWith("--") ? "" : "important");
            }
          } catch (err) {
            _iterator3.e(err);
          } finally {
            _iterator3.f();
          }
          effects = ((_animations = animations(element)) === null || _animations === void 0 ? void 0 : _animations.filter(function(animation) {
            return owned.includes(animation.transitionProperty);
          })) || [];
          var _iterator4 = _createForOfIteratorHelper(effects), _step4;
          try {
            var _loop = function _loop3() {
              var animation = _step4.value;
              var track2 = tracks.find(function(track3) {
                return track3.property === animation.transitionProperty;
              });
              animation.effect.setKeyframes(track2.frames);
              animation.effect.updateTiming({
                duration: track2.duration,
                easing: interactive ? "linear" : track2.timing.easing || "linear",
                delay: interactive ? 0 : track2.time - track2.duration,
                direction: interactive ? "normal" : "reverse",
                fill: "both",
                iterations: 1,
                iterationStart: 0,
                endDelay: 0
              });
              if (interactive) animation.pause();
              animation.currentTime = 0;
            };
            for (_iterator4.s(); !(_step4 = _iterator4.n()).done; ) {
              _loop();
            }
          } catch (err) {
            _iterator4.e(err);
          } finally {
            _iterator4.f();
          }
        } else {
          var computed = root.getComputedStyle(element);
          var previous = animationProperties.map(function(name2) {
            return computed.getPropertyValue("animation-".concat(name2));
          });
          var additions = [[], [], [], [], [], [], [], []];
          var _iterator5 = _createForOfIteratorHelper(tracks), _step5;
          try {
            for (_iterator5.s(); !(_step5 = _iterator5.n()).done; ) {
              var _track2 = _step5.value;
              var name = suffix(_track2.property);
              style.setProperty("--ae-present-reverse-from-".concat(name), _track2.frames[0][camel(_track2.property)]);
              style.setProperty("--ae-present-reverse-to-".concat(name), _track2.frames[_track2.frames.length - 1][camel(_track2.property)]);
              if (_track2.property.startsWith("max-") && interpolatedSizes) style.setProperty(_track2.property, "var(--ae-present-reverse-".concat(_track2.property, ")"), "important");
              else style.setProperty(_track2.property, _track2.frames[0][camel(_track2.property)]);
              var nativeName = _track2.property.startsWith("max-") && !interpolatedSizes ? "".concat(name, "-plain") : name;
              var values = [api.className("present-reverse-".concat(nativeName)), "".concat(_track2.duration, "ms"), "".concat(_track2.time - _track2.duration, "ms"), _track2.timing.easing || "linear", "reverse", "both", "1", "running"];
              values.forEach(function(value, index) {
                return additions[index].push(value);
              });
            }
          } catch (err) {
            _iterator5.e(err);
          } finally {
            _iterator5.f();
          }
          animationProperties.forEach(function(name2, index) {
            return style.setProperty("animation-".concat(name2), [previous[index]].concat(_toConsumableArray(additions[index])).join(","), "important");
          });
        }
        if (progress && !interactive) {
          style.setProperty("--ae-unpop-progress", "0");
          element.getBoundingClientRect();
          var _computed = root.getComputedStyle(element);
          var _previous = list(_computed.transitionProperty);
          var durations = list(_computed.transitionDuration), delays = list(_computed.transitionDelay), easings = list(_computed.transitionTimingFunction);
          style.setProperty("transition-property", [].concat(_toConsumableArray(_previous), ["--ae-unpop-progress"]).join(","), "important");
          var _loop2 = function _loop22() {
            var _arr$_i = _slicedToArray(_arr[_i], 3), name2 = _arr$_i[0], values2 = _arr$_i[1], extra = _arr$_i[2];
            style.setProperty("transition-".concat(name2), [].concat(_toConsumableArray(_previous.map(function(_, index) {
              return values2[index % values2.length];
            })), [extra]).join(","), "important");
          };
          for (var _i = 0, _arr = [["duration", durations, "".concat(duration, "ms")], ["delay", delays, "0ms"], ["timing-function", easings, "linear"]]; _i < _arr.length; _i++) {
            _loop2();
          }
          style.setProperty("--ae-unpop-progress", "1");
        }
      }
      return {
        duration: duration,
        apply: apply,
        seek: function seek(value) {
          var _iterator6 = _createForOfIteratorHelper(effects), _step6;
          try {
            for (_iterator6.s(); !(_step6 = _iterator6.n()).done; ) {
              var effect = _step6.value;
              effect.currentTime = value * Number(effect.effect.getTiming().duration);
            }
          } catch (err) {
            _iterator6.e(err);
          } finally {
            _iterator6.f();
          }
        },
        playTo: function playTo(target) {
          var _iterator7 = _createForOfIteratorHelper(effects), _step7;
          try {
            var _loop3 = function _loop32() {
              var animation = _step7.value;
              var track = tracks.find(function(track2) {
                return track2.property === animation.transitionProperty;
              });
              var timing = animation.effect.getTiming();
              var value = Number(animation.currentTime) / Number(timing.duration);
              animation.effect.updateTiming({
                easing: track.timing.easing || "linear"
              });
              var best = value, error = Infinity;
              var evaluate = function evaluate2(fraction) {
                animation.currentTime = fraction * track.duration;
                return animation.effect.getComputedTiming().progress;
              };
              var previous = evaluate(0), previousTime = 0;
              for (var index = 1; index <= 120; index++) {
                var time = index / 120, next = evaluate(time);
                if ((previous - value) * (next - value) <= 0) {
                  var low = previousTime, high = time, lowValue = previous;
                  for (var step = 0; step < 20; step++) {
                    var middle = (low + high) / 2, result = evaluate(middle);
                    if ((lowValue - value) * (result - value) <= 0) high = middle;
                    else {
                      low = middle;
                      lowValue = result;
                    }
                  }
                  var candidate = (low + high) / 2;
                  if (Math.abs(candidate - value) < error) {
                    best = candidate;
                    error = Math.abs(candidate - value);
                  }
                }
                previous = next;
                previousTime = time;
              }
              if (value !== 0 && value !== 1 && Math.abs(evaluate(best) - value) > 1e-4) {
                animation.effect.updateTiming({
                  easing: "linear"
                });
                best = value;
              }
              animation.currentTime = (value === 0 || value === 1 ? value : best) * track.duration;
              animation.playbackRate = target ? 1 : -1;
              animation.play();
              if (value === target) animation.finish();
            };
            for (_iterator7.s(); !(_step7 = _iterator7.n()).done; ) {
              _loop3();
            }
          } catch (err) {
            _iterator7.e(err);
          } finally {
            _iterator7.f();
          }
          return Promise.all(effects.map(function(effect) {
            return effect.finished;
          }));
        },
        cleanup: function cleanup() {
          var _memory;
          var _iterator8 = _createForOfIteratorHelper(effects), _step8;
          try {
            for (_iterator8.s(); !(_step8 = _iterator8.n()).done; ) {
              var animation = _step8.value;
              animation.cancel();
            }
          } catch (err) {
            _iterator8.e(err);
          } finally {
            _iterator8.f();
          }
          effects = [];
          (_memory = memory) === null || _memory === void 0 || _memory.restore();
          memory = null;
        }
      };
    }
    function full(element, controller, progress) {
      var _controller$opening;
      if ((_controller$opening = controller.opening) !== null && _controller$opening !== void 0 && _controller$opening.saved) return controller.opening.saved;
      var record = controller.opening;
      if (record) {
        var completed = record.completed;
        record.completed = true;
        try {
          return _snapshot(element, controller, progress);
        } finally {
          record.completed = completed;
        }
      }
      return _snapshot(element, controller, progress);
    }
    function control(element, source, dismiss, progress, unpop) {
      var _tracks$;
      var tracks = source.filter(function(track) {
        return !track.property.startsWith("--ae-");
      });
      var duration = Math.max.apply(Math, [0].concat(_toConsumableArray(tracks.map(function(track) {
        return track.duration;
      }))));
      var easing = ((_tracks$ = tracks[0]) === null || _tracks$ === void 0 ? void 0 : _tracks$.timing.easing) || "linear";
      var channels = progress ? ["--ae-present-pop-phase", "--ae-present-dismiss-phase", "--ae-pop-progress", "--ae-dismiss-progress"] : [];
      if (unpop) channels.push("--ae-unpop-progress");
      for (var _i2 = 0, _channels = channels; _i2 < _channels.length; _i2++) {
        var property = _channels[_i2];
        var forward = property.includes("dismiss") ? dismiss : property.includes("unpop") ? dismiss : !dismiss;
        tracks.push({
          property: property,
          duration: duration,
          time: duration,
          timing: {
            easing: easing
          },
          frames: [_defineProperty({}, property, forward ? "0" : "1"), _defineProperty({}, property, forward ? "1" : "0")]
        });
      }
      return reverse(element, tracks, false, true);
    }
    return {
      init: init,
      capture: capture,
      full: full,
      control: control,
      snapshot: function snapshot(element, controller, progress) {
        var _controller$opening2;
        return ((_controller$opening2 = controller.opening) === null || _controller$opening2 === void 0 ? void 0 : _controller$opening2.saved) || _snapshot(element, controller, progress);
      },
      complete: complete,
      reverse: reverse
    };
  }

  // src/internal/create-present-gestures.js
  function _typeof2(o) {
    "@babel/helpers - typeof";
    return _typeof2 = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function(o2) {
      return typeof o2;
    } : function(o2) {
      return o2 && "function" == typeof Symbol && o2.constructor === Symbol && o2 !== Symbol.prototype ? "symbol" : typeof o2;
    }, _typeof2(o);
  }
  function _toConsumableArray2(r) {
    return _arrayWithoutHoles2(r) || _iterableToArray2(r) || _unsupportedIterableToArray2(r) || _nonIterableSpread2();
  }
  function _nonIterableSpread2() {
    throw new TypeError("Invalid attempt to spread non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.");
  }
  function _iterableToArray2(r) {
    if ("undefined" != typeof Symbol && null != r[Symbol.iterator] || null != r["@@iterator"]) return Array.from(r);
  }
  function _arrayWithoutHoles2(r) {
    if (Array.isArray(r)) return _arrayLikeToArray2(r);
  }
  function ownKeys2(e, r) {
    var t = Object.keys(e);
    if (Object.getOwnPropertySymbols) {
      var o = Object.getOwnPropertySymbols(e);
      r && (o = o.filter(function(r2) {
        return Object.getOwnPropertyDescriptor(e, r2).enumerable;
      })), t.push.apply(t, o);
    }
    return t;
  }
  function _objectSpread2(e) {
    for (var r = 1; r < arguments.length; r++) {
      var t = null != arguments[r] ? arguments[r] : {};
      r % 2 ? ownKeys2(Object(t), true).forEach(function(r2) {
        _defineProperty2(e, r2, t[r2]);
      }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(e, Object.getOwnPropertyDescriptors(t)) : ownKeys2(Object(t)).forEach(function(r2) {
        Object.defineProperty(e, r2, Object.getOwnPropertyDescriptor(t, r2));
      });
    }
    return e;
  }
  function _defineProperty2(e, r, t) {
    return (r = _toPropertyKey2(r)) in e ? Object.defineProperty(e, r, { value: t, enumerable: true, configurable: true, writable: true }) : e[r] = t, e;
  }
  function _toPropertyKey2(t) {
    var i = _toPrimitive2(t, "string");
    return "symbol" == _typeof2(i) ? i : i + "";
  }
  function _toPrimitive2(t, r) {
    if ("object" != _typeof2(t) || !t) return t;
    var e = t[Symbol.toPrimitive];
    if (void 0 !== e) {
      var i = e.call(t, r || "default");
      if ("object" != _typeof2(i)) return i;
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
  var directions = {
    up: ["y", -1],
    down: ["y", 1],
    left: ["x", -1],
    right: ["x", 1]
  };
  var clamp = function clamp2(value) {
    return Math.max(0, Math.min(1, value));
  };
  function createPresentGestures(root, api, services) {
    var entries = /* @__PURE__ */ new Map(), sources = /* @__PURE__ */ new Map();
    var interaction = null, suppressed = null, suppressTimer = null;
    var attribute = function attribute2(name) {
      return api.attr("present-gesture".concat(name ? "-".concat(name) : ""));
    };
    var inputExceptions = "a:not([draggable='false']),button:not([draggable='false']),input,textarea,select,[contenteditable],[draggable='true']," + "[".concat(api.attr("scrollbar-vertical"), "],[").concat(api.attr("scrollbar-horizontal"), "]");
    var warn = function warn2(element, name, value, reason) {
      return api.diagnostics.warn(api.diagnostics.WARN_CONFIGURATION_VALUE, {
        extension: "present",
        element: element,
        attribute: name,
        value: value,
        reason: reason
      });
    };
    var state = function state2(element) {
      return services.state(element);
    };
    function update(element) {
      var _source$matches, _entries$get, _entries$get2;
      if (!element.hasAttribute(attribute(""))) {
        remove(element);
        return;
      }
      var signature = ["", "source", "unpop", "dismiss"].map(function(name) {
        return element.getAttribute(attribute(name));
      }).join("|");
      var direction = element.getAttribute(attribute(""));
      if (!directions[direction]) {
        remove(element);
        warn(element, attribute(""), direction, "Use up, down, left or right.");
        return;
      }
      var value = element.getAttribute(attribute("source"));
      var id = value === null || value === void 0 ? void 0 : value.replace(/^#/, "");
      var source = value === "document" ? root.document : value ? !/[\s#]/.test(id) && root.document.getElementById(id) : element;
      if (source !== null && source !== void 0 && (_source$matches = source.matches) !== null && _source$matches !== void 0 && _source$matches.call(source, "a,button") && source.getAttribute("draggable") !== "false") {
        api.diagnostics.warn(api.diagnostics.WARN_CONFIGURATION_VALUE, {
          extension: "present",
          element: source,
          attribute: "draggable",
          value: source.getAttribute("draggable"),
          reason: "An interactive Present gesture source requires draggable=false; applying it automatically.",
          suggestion: 'Declare draggable="false" on the gesture source.'
        });
        source.setAttribute("draggable", "false");
      }
      if (((_entries$get = entries.get(element)) === null || _entries$get === void 0 ? void 0 : _entries$get.signature) === signature && ((_entries$get2 = entries.get(element)) === null || _entries$get2 === void 0 ? void 0 : _entries$get2.source) === source) return;
      remove(element);
      if (!source) {
        api.diagnostics.warn(api.diagnostics.WARN_CONFIGURATION_TARGET, {
          extension: "present",
          element: element,
          attribute: attribute("source"),
          value: value,
          reason: "Gesture source ID was not found."
        });
        return;
      }
      var dismiss = element.getAttribute(attribute("dismiss"));
      if (dismiss && (!directions[dismiss] || directions[dismiss][0] === directions[direction][0])) {
        warn(element, attribute("dismiss"), dismiss, "Dismiss must use a direction on the other axis.");
        dismiss = null;
      }
      var unpop = element.getAttribute(attribute("unpop"));
      if (unpop !== null && !["", "true", "false"].includes(unpop)) warn(element, attribute("unpop"), unpop, "Use true or false; invalid values enable gesture Unpop.");
      var entry = {
        element: element,
        source: source,
        direction: direction,
        dismiss: dismiss,
        unpop: unpop !== "false",
        signature: signature
      };
      entries.set(element, entry);
      var _iterator = _createForOfIteratorHelper2(/* @__PURE__ */ new Set([source, element])), _step;
      try {
        for (_iterator.s(); !(_step = _iterator.n()).done; ) {
          var target = _step.value;
          if (!sources.has(target)) {
            sources.set(target, /* @__PURE__ */ new Set());
            target.addEventListener("pointerdown", down, true);
          }
          sources.get(target).add(entry);
        }
      } catch (err) {
        _iterator.e(err);
      } finally {
        _iterator.f();
      }
      inspect(element);
    }
    function inspect(element) {
      var _entries$get3;
      if (((_entries$get3 = entries.get(element)) === null || _entries$get3 === void 0 ? void 0 : _entries$get3.source) === element && root.getComputedStyle(element).display === "none") api.diagnostics.info(api.diagnostics.INFO_PRESENT_GESTURE_HIDDEN, {
        extension: "present",
        element: element
      });
    }
    function remove(element) {
      var _interaction, _interaction2;
      var entry = entries.get(element);
      if (!entry) return;
      if (((_interaction = interaction) === null || _interaction === void 0 || (_interaction = _interaction.owner) === null || _interaction === void 0 ? void 0 : _interaction.entry) === entry || (_interaction2 = interaction) !== null && _interaction2 !== void 0 && _interaction2.candidates.some(function(candidate) {
        return candidate.entry === entry;
      })) cancel();
      entries.delete(element);
      var _iterator2 = _createForOfIteratorHelper2(/* @__PURE__ */ new Set([entry.source, element])), _step2;
      try {
        for (_iterator2.s(); !(_step2 = _iterator2.n()).done; ) {
          var target = _step2.value;
          var set = sources.get(target);
          set.delete(entry);
          if (!set.size) {
            target.removeEventListener("pointerdown", down, true);
            sources.delete(target);
          }
        }
      } catch (err) {
        _iterator2.e(err);
      } finally {
        _iterator2.f();
      }
    }
    function down(event) {
      if (interaction && interaction.id !== event.pointerId) {
        cancel();
        return;
      }
      if (event.button !== 0 || event.isPrimary === false || event.defaultPrevented) return;
      var target = event.target;
      if (!target.closest || target.closest(inputExceptions)) return;
      if (!interaction) {
        interaction = {
          id: event.pointerId,
          pointerType: event.pointerType,
          x: event.clientX,
          y: event.clientY,
          candidates: [],
          owner: null,
          target: target
        };
        for (var _i = 0, _arr = ["pointermove", "pointerup", "pointercancel", "lostpointercapture"]; _i < _arr.length; _i++) {
          var name = _arr[_i];
          root.addEventListener(name, move, {
            capture: true,
            passive: false
          });
        }
        if (event.pointerType === "touch") root.addEventListener("touchmove", touchMove, {
          capture: true,
          passive: false
        });
      }
      var _iterator3 = _createForOfIteratorHelper2(sources.get(event.currentTarget) || []), _step3;
      try {
        var _loop = function _loop2() {
          var entry = _step3.value;
          if (interaction.candidates.some(function(candidate) {
            return candidate.entry === entry;
          })) return 0;
          var origin = state(entry.element);
          var onElement = entry.element.contains(target);
          var onSource = entry.source === root.document || entry.source.contains(target);
          if (services.busy(entry.element)) return 0;
          if (origin === "Pop" ? onElement : onSource) interaction.candidates.push({
            entry: entry,
            origin: origin
          });
        }, _ret;
        for (_iterator3.s(); !(_step3 = _iterator3.n()).done; ) {
          _ret = _loop();
          if (_ret === 0) continue;
        }
      } catch (err) {
        _iterator3.e(err);
      } finally {
        _iterator3.f();
      }
      if (event.pointerType !== "touch" && interaction.candidates.length && !interaction.captured) {
        try {
          target.setPointerCapture(event.pointerId);
          interaction.captured = true;
        } catch (_) {
        }
      }
    }
    function parameters(element, axis) {
      var style = root.getComputedStyle(element);
      var thresholds = {};
      for (var _i2 = 0, _arr2 = ["pop", "unpop", "dismiss"]; _i2 < _arr2.length; _i2++) {
        var name = _arr2[_i2];
        var _property = "--ae-present-".concat(name, "-threshold"), _raw = style.getPropertyValue(_property).trim();
        var value = _raw === "" ? 0.5 : Number(_raw);
        thresholds[name] = Number.isFinite(value) && value >= 0 && value <= 1 ? value : 0.5;
        if (thresholds[name] !== value) warn(element, _property, _raw, "Use a number between 0 and 1; using 0.5.");
      }
      var property = "--ae-present-gesture-distance", raw = style.getPropertyValue(property).trim();
      var distance = 0;
      if (raw && raw !== "auto") {
        var probe = root.document.createElement("span");
        probe.style.cssText = "position:absolute;visibility:hidden;pointer-events:none;padding:0;border:0;min-width:0;max-width:none;height:0;";
        probe.style.fontSize = style.fontSize;
        probe.style.width = raw;
        if (probe.style.width && !raw.includes("%")) {
          element.appendChild(probe);
          distance = parseFloat(root.getComputedStyle(probe).width);
          probe.remove();
        }
        if (!(distance > 0)) warn(element, property, raw, "Use a positive CSS length or auto; using auto.");
      }
      return _objectSpread2(_objectSpread2({}, thresholds), {}, {
        distance: distance > 0 ? distance : 0,
        fallback: Math.max(1, axis === "x" ? element.offsetWidth : element.offsetHeight)
      });
    }
    function move(event) {
      var current = interaction;
      if (!current || current.id !== event.pointerId) return;
      if (event.type !== "pointermove") {
        release(event.type !== "pointerup");
        return;
      }
      if (event.isTrusted && event.pointerType !== "touch" && (event.buttons & 1) === 0) {
        release(false);
        return;
      }
      if (current.scrollOwned) return;
      var x = event.clientX - current.x, y = event.clientY - current.y;
      if (!current.owner) {
        var _root$KeyframeEffect;
        if (Math.max(Math.abs(x), Math.abs(y)) < 8) return;
        var axis = Math.abs(x) > Math.abs(y) * 1.2 ? "x" : Math.abs(y) > Math.abs(x) * 1.2 ? "y" : null;
        if (!axis) return;
        var delta = axis === "x" ? x : y;
        var candidates = current.candidates.filter(function(candidate2) {
          var entry = candidate2.entry, origin = candidate2.origin;
          if (!entry.element.isConnected || state(entry.element) !== origin || services.busy(entry.element)) return false;
          var main = directions[entry.direction], dismiss = directions[entry.dismiss];
          candidate2.dismiss = origin === "Pop" && (dismiss === null || dismiss === void 0 ? void 0 : dismiss[0]) === axis && delta * dismiss[1] > 0;
          candidate2.sign = candidate2.dismiss ? dismiss[1] : main[1];
          return candidate2.dismiss || main[0] === axis && (origin === "Pop" ? entry.unpop && delta * main[1] < 0 : delta * main[1] > 0);
        });
        candidates.sort(function(a, b) {
          var left = a.origin === "Pop" ? a.entry.element : a.entry.source;
          var right = b.origin === "Pop" ? b.entry.element : b.entry.source;
          if (left !== right) {
            if (left.contains(right)) return 1;
            if (right.contains(left)) return -1;
          }
          return services.order(b.entry.element) - services.order(a.entry.element);
        });
        var candidate = candidates[0];
        if (!candidate) {
          clear();
          return;
        }
        if (nativeScroll(current.target, candidate.entry.element, axis, delta)) {
          current.scrollOwned = true;
          return;
        }
        if (!((_root$KeyframeEffect = root.KeyframeEffect) !== null && _root$KeyframeEffect !== void 0 && _root$KeyframeEffect.prototype.setKeyframes) || !candidate.entry.element.getAnimations) {
          warn(candidate.entry.element, attribute(""), candidate.entry.direction, "Interactive Present requires inspectable Web Animations transitions.");
          clear();
          return;
        }
        var params = parameters(candidate.entry.element, axis);
        var resolve;
        var settled = new Promise(function(done) {
          resolve = done;
        });
        var _owner = current.owner = _objectSpread2(_objectSpread2({}, candidate), {}, {
          params: params,
          axis: axis,
          displacement: 0,
          progress: candidate.dismiss ? 0 : candidate.origin === "Pop" ? 1 : 0,
          handle: null,
          released: null,
          settled: settled,
          attach: function attach(handle, autoDistance) {
            this.handle = handle;
            if (!params.distance) params.distance = autoDistance || Math.max(1, axis === "x" ? this.entry.element.offsetWidth : this.entry.element.offsetHeight);
            this.progress = clamp(this.start + this.displacement / params.distance);
            this.seek();
            if (this.released !== null) this.finish(this.released);
          },
          seek: function seek() {
            var _this$handle;
            (_this$handle = this.handle) === null || _this$handle === void 0 || _this$handle.seek(this.progress);
          },
          finish: function finish(cancelled) {
            this.released = cancelled;
            if (!this.handle) return;
            var target = cancelled ? this.dismiss ? 0 : this.origin === "Pop" ? 1 : 0 : this.dismiss ? +(this.progress >= params.dismiss) : this.origin === "Pop" ? +(this.progress > params.unpop) : +(this.progress >= params.pop);
            var destination = this.dismiss ? target ? "Dismiss" : this.origin : target ? "Pop" : this.origin === "Dismiss" ? "Dismiss" : "Unpop";
            this.handle.playTo(target).then(function() {
              return resolve(destination);
            }, function() {
              return resolve(null);
            });
          },
          abort: function abort() {
            var _interaction3;
            resolve(null);
            if (((_interaction3 = interaction) === null || _interaction3 === void 0 ? void 0 : _interaction3.owner) === this) clear();
          }
        });
        _owner.start = _owner.progress;
        services.begin(candidate.entry.element, candidate.dismiss ? "Dismiss" : candidate.origin === "Pop" ? "Unpop" : "Pop", _owner);
        if (interaction !== current) return;
        if (event.pointerType === "touch" && !current.captured) {
          try {
            current.target.setPointerCapture(event.pointerId);
            current.captured = true;
          } catch (_) {
          }
        }
      }
      var owner = current.owner;
      var displacement = (owner.axis === "x" ? x : y) * owner.sign;
      owner.displacement = displacement;
      owner.progress = clamp(owner.start + displacement / (owner.params.distance || owner.params.fallback));
      owner.seek();
      if (event.cancelable) event.preventDefault();
    }
    function nativeScroll(target, element, axis, delta) {
      for (var current = target; current && current !== element && current !== root.document; current = current.parentElement) {
        var style = root.getComputedStyle(current);
        if (!/auto|scroll/.test(axis === "x" ? style.overflowX : style.overflowY)) continue;
        var position = axis === "x" ? current.scrollLeft : current.scrollTop;
        var maximum = axis === "x" ? current.scrollWidth - current.clientWidth : current.scrollHeight - current.clientHeight;
        if (maximum > 0 && (delta < 0 ? position < maximum : position > 0)) return true;
      }
      return false;
    }
    function touchMove(event) {
      var _interaction4;
      if (((_interaction4 = interaction) === null || _interaction4 === void 0 ? void 0 : _interaction4.pointerType) === "touch" && interaction.owner && event.touches.length === 1 && event.cancelable) event.preventDefault();
    }
    function release(cancelled) {
      var _interaction5;
      var owner = (_interaction5 = interaction) === null || _interaction5 === void 0 ? void 0 : _interaction5.owner;
      if (owner) {
        owner.finish(cancelled);
        suppressed = interaction.target;
        clearTimeout(suppressTimer);
        root.document.addEventListener("click", click, true);
        suppressTimer = setTimeout(clearClick, 500);
      }
      clear();
    }
    function click(event) {
      if (!suppressed || !(suppressed === event.target || suppressed.contains(event.target) || event.target.contains(suppressed))) return;
      event.preventDefault();
      event.stopImmediatePropagation();
      clearClick();
    }
    function clearClick() {
      clearTimeout(suppressTimer);
      suppressTimer = null;
      suppressed = null;
      root.document.removeEventListener("click", click, true);
    }
    function clear() {
      var previous = interaction;
      interaction = null;
      for (var _i3 = 0, _arr3 = ["pointermove", "pointerup", "pointercancel", "lostpointercapture"]; _i3 < _arr3.length; _i3++) {
        var name = _arr3[_i3];
        root.removeEventListener(name, move, true);
      }
      if ((previous === null || previous === void 0 ? void 0 : previous.pointerType) === "touch") root.removeEventListener("touchmove", touchMove, true);
      if (previous !== null && previous !== void 0 && previous.captured) try {
        previous.target.releasePointerCapture(previous.id);
      } catch (_) {
      }
    }
    function cancel() {
      release(true);
    }
    return {
      update: update,
      remove: remove,
      inspect: inspect,
      destroy: function destroy() {
        cancel();
        for (var _i4 = 0, _arr4 = _toConsumableArray2(entries.keys()); _i4 < _arr4.length; _i4++) {
          var element = _arr4[_i4];
          remove(element);
        }
        clearClick();
      }
    };
  }

  // src/internal/create-present-effects.js
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
  /*! aellux.js | SPDX-License-Identifier: Apache-2.0 | See LICENSE for terms. */
  function createPresentEffects(root, api, controllers) {
    var operations = /* @__PURE__ */ new Map();
    var targets = /* @__PURE__ */ new Map();
    var presets = /* @__PURE__ */ new Set(["shake", "yes", "no", "breathe", "tremble", "pulse", "alert"]);
    var presentAttribute = api.attr("present");
    function visible(element) {
      if (!element.isConnected || !element.getClientRects().length) return false;
      var style = root.getComputedStyle(element);
      if (["hidden", "collapse"].includes(style.visibility)) return false;
      for (var node = element; node; node = node.parentElement) {
        var computed = root.getComputedStyle(node);
        if (computed.display === "none" || computed.contentVisibility === "hidden" || Number(computed.opacity) === 0) return false;
      }
      return true;
    }
    function finish(operation, status) {
      if (operations.get(operation.element) !== operation) return;
      api.motion.cancel(operation.id);
      if (!operation.authoredClass) operation.target.classList.remove(operation.className);
      operations.delete(operation.element);
      if (targets.get(operation.target) === operation) targets.delete(operation.target);
      operation.resolve({
        status: status
      });
    }
    function cancelWithin(element) {
      var _iterator = _createForOfIteratorHelper3(operations.values()), _step;
      try {
        for (_iterator.s(); !(_step = _iterator.n()).done; ) {
          var operation = _step.value;
          if (element.contains(operation.element) || element.contains(operation.target)) finish(operation, "aborted");
        }
      } catch (err) {
        _iterator.e(err);
      } finally {
        _iterator.f();
      }
    }
    function blocked(operation) {
      var _controllers$get;
      for (var node = operation.target; node; node = node.parentElement) {
        var controller = controllers.get(node);
        if (controller !== null && controller !== void 0 && controller.transition) operation.waiting.add(controller.transition);
      }
      var transition = (_controllers$get = controllers.get(operation.element)) === null || _controllers$get === void 0 ? void 0 : _controllers$get.transition;
      if (transition) operation.waiting.add(transition);
      return operation.waiting.size > 0;
    }
    function start(operation) {
      if (operations.get(operation.element) !== operation) return;
      if (!controllers.has(operation.element) || !operation.element.contains(operation.target) || !visible(operation.target) || api.currentPreference("reduced-motion") === "reduced") {
        finish(operation, "skipped");
        return;
      }
      if (blocked(operation)) return;
      var transform = root.getComputedStyle(operation.target).transform;
      if (presets.has(operation.effect) && (operation.target.hasAttribute(api.attr("anchor")) || operation.target.hasAttribute(api.attr("scrollbox-elastic")) || (operation.target.getAttribute(presentAttribute) || "").split(/\s+/).includes("transform") || transform && transform !== "none" && transform !== "matrix(1, 0, 0, 1, 0, 0)")) {
        var owners = [];
        for (var _i = 0, _arr = ["anchor", "scrollbox-elastic"]; _i < _arr.length; _i++) {
          var name = _arr[_i];
          if (operation.target.hasAttribute(api.attr(name))) owners.push(name);
        }
        if (!operation.target.hasAttribute(api.attr("anchor")) && (operation.target.getAttribute(presentAttribute) || "").split(/\s+/).includes("transform")) owners.push("present");
        if (!owners.length) owners.push("authored-transform");
        if (api.options.environment === "development") {
          var _iterator2 = _createForOfIteratorHelper3(owners), _step2;
          try {
            for (_iterator2.s(); !(_step2 = _iterator2.n()).done; ) {
              var owner = _step2.value;
              api.diagnostics.warn(api.diagnostics.WARN_RESOURCE_CONFLICT, {
                extension: "present",
                element: operation.target,
                property: "transform",
                writers: [owner, "present-effect"],
                reason: "A preset effect would replace the stable transform.",
                suggestion: "Pass an untransformed inner effectTarget to present.effect()."
              });
            }
          } catch (err) {
            _iterator2.e(err);
          } finally {
            _iterator2.f();
          }
        }
        finish(operation, "skipped");
        return;
      }
      operation.target.getBoundingClientRect();
      api.motion.run(operation.target, {
        extension: "present-effect",
        id: operation.id,
        ownedOnly: true,
        apply: function apply() {
          return operation.target.classList.add(operation.className);
        },
        easing: root.getComputedStyle(operation.target).getPropertyValue("--ae-present-effect-aellux-ease").trim() || void 0,
        abort: function abort() {
          return operations.get(operation.element) !== operation || !controllers.has(operation.element) || !operation.target.isConnected || !operation.element.contains(operation.target) || api.currentPreference("reduced-motion") === "reduced" || blocked(operation);
        }
      }).then(function(result) {
        return finish(operation, result.status);
      }, function(cause) {
        api.diagnostics.error(api.diagnostics.ERROR_EXTENSION_TRANSITION, {
          cause: cause,
          extension: "present",
          element: operation.target
        });
        finish(operation, "aborted");
      });
    }
    function effect(element, effect2) {
      var effectTarget = arguments.length > 2 && arguments[2] !== void 0 ? arguments[2] : element;
      var controller = controllers.get(element);
      if (!controller) return Promise.resolve({
        status: "skipped"
      });
      if (typeof effect2 !== "string" || !/^[a-zA-Z_][\w-]*$/.test(effect2) || !effectTarget || effectTarget.nodeType !== 1 || !element.contains(effectTarget)) {
        api.diagnostics.warn(api.diagnostics.WARN_CONFIGURATION_VALUE, {
          extension: "present",
          element: element,
          value: effect2,
          reason: "An effect requires one CSS identifier and a target inside its mounted Present.",
          suggestion: "Use a preset or custom effect name and an optional descendant Element."
        });
        return Promise.resolve({
          status: "skipped"
        });
      }
      if (operations.has(element)) finish(operations.get(element), "aborted");
      if (targets.has(effectTarget)) finish(targets.get(effectTarget), "aborted");
      var resolve;
      var promise = new Promise(function(done) {
        resolve = done;
      });
      var className = api.className("present-effect-".concat(effect2));
      var operation = {
        element: element,
        target: effectTarget,
        effect: effect2,
        resolve: resolve,
        className: className,
        id: api.motion.id(),
        waiting: /* @__PURE__ */ new Set(),
        authoredClass: effectTarget.classList.contains(className)
      };
      operations.set(element, operation);
      targets.set(effectTarget, operation);
      if (api.currentPreference("reduced-motion") === "reduced") finish(operation, "skipped");
      else if (!blocked(operation)) start(operation);
      return promise;
    }
    function settled(transition) {
      var _iterator3 = _createForOfIteratorHelper3(operations.values()), _step3;
      try {
        for (_iterator3.s(); !(_step3 = _iterator3.n()).done; ) {
          var operation = _step3.value;
          if (!operation.waiting.delete(transition)) continue;
          if (!transition.completed) finish(operation, "aborted");
          else if (!operation.waiting.size) start(operation);
        }
      } catch (err) {
        _iterator3.e(err);
      } finally {
        _iterator3.f();
      }
    }
    function destroy() {
      var _iterator4 = _createForOfIteratorHelper3(operations.values()), _step4;
      try {
        for (_iterator4.s(); !(_step4 = _iterator4.n()).done; ) {
          var operation = _step4.value;
          finish(operation, "aborted");
        }
      } catch (err) {
        _iterator4.e(err);
      } finally {
        _iterator4.f();
      }
    }
    function preferences() {
      if (api.currentPreference("reduced-motion") === "reduced") {
        var _iterator5 = _createForOfIteratorHelper3(operations.values()), _step5;
        try {
          for (_iterator5.s(); !(_step5 = _iterator5.n()).done; ) {
            var operation = _step5.value;
            finish(operation, "skipped");
          }
        } catch (err) {
          _iterator5.e(err);
        } finally {
          _iterator5.f();
        }
      }
    }
    return {
      effect: effect,
      cancelWithin: cancelWithin,
      settled: settled,
      destroy: destroy,
      preferences: preferences
    };
  }

  // src/src/aellux.ext.present.js
  function _typeof3(o) {
    "@babel/helpers - typeof";
    return _typeof3 = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function(o2) {
      return typeof o2;
    } : function(o2) {
      return o2 && "function" == typeof Symbol && o2.constructor === Symbol && o2 !== Symbol.prototype ? "symbol" : typeof o2;
    }, _typeof3(o);
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
  function _createForOfIteratorHelper4(r, e) {
    var t = "undefined" != typeof Symbol && r[Symbol.iterator] || r["@@iterator"];
    if (!t) {
      if (Array.isArray(r) || (t = _unsupportedIterableToArray4(r)) || e && r && "number" == typeof r.length) {
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
  function _toConsumableArray3(r) {
    return _arrayWithoutHoles3(r) || _iterableToArray3(r) || _unsupportedIterableToArray4(r) || _nonIterableSpread3();
  }
  function _nonIterableSpread3() {
    throw new TypeError("Invalid attempt to spread non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.");
  }
  function _iterableToArray3(r) {
    if ("undefined" != typeof Symbol && null != r[Symbol.iterator] || null != r["@@iterator"]) return Array.from(r);
  }
  function _arrayWithoutHoles3(r) {
    if (Array.isArray(r)) return _arrayLikeToArray4(r);
  }
  function ownKeys3(e, r) {
    var t = Object.keys(e);
    if (Object.getOwnPropertySymbols) {
      var o = Object.getOwnPropertySymbols(e);
      r && (o = o.filter(function(r2) {
        return Object.getOwnPropertyDescriptor(e, r2).enumerable;
      })), t.push.apply(t, o);
    }
    return t;
  }
  function _objectSpread3(e) {
    for (var r = 1; r < arguments.length; r++) {
      var t = null != arguments[r] ? arguments[r] : {};
      r % 2 ? ownKeys3(Object(t), true).forEach(function(r2) {
        _defineProperty3(e, r2, t[r2]);
      }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(e, Object.getOwnPropertyDescriptors(t)) : ownKeys3(Object(t)).forEach(function(r2) {
        Object.defineProperty(e, r2, Object.getOwnPropertyDescriptor(t, r2));
      });
    }
    return e;
  }
  function _defineProperty3(e, r, t) {
    return (r = _toPropertyKey3(r)) in e ? Object.defineProperty(e, r, { value: t, enumerable: true, configurable: true, writable: true }) : e[r] = t, e;
  }
  function _toPropertyKey3(t) {
    var i = _toPrimitive3(t, "string");
    return "symbol" == _typeof3(i) ? i : i + "";
  }
  function _toPrimitive3(t, r) {
    if ("object" != _typeof3(t) || !t) return t;
    var e = t[Symbol.toPrimitive];
    if (void 0 !== e) {
      var i = e.call(t, r || "default");
      if ("object" != _typeof3(i)) return i;
      throw new TypeError("@@toPrimitive must return a primitive value.");
    }
    return ("string" === r ? String : Number)(t);
  }
  function _slicedToArray2(r, e) {
    return _arrayWithHoles2(r) || _iterableToArrayLimit2(r, e) || _unsupportedIterableToArray4(r, e) || _nonIterableRest2();
  }
  function _nonIterableRest2() {
    throw new TypeError("Invalid attempt to destructure non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.");
  }
  function _unsupportedIterableToArray4(r, a) {
    if (r) {
      if ("string" == typeof r) return _arrayLikeToArray4(r, a);
      var t = {}.toString.call(r).slice(8, -1);
      return "Object" === t && r.constructor && (t = r.constructor.name), "Map" === t || "Set" === t ? Array.from(r) : "Arguments" === t || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(t) ? _arrayLikeToArray4(r, a) : void 0;
    }
  }
  function _arrayLikeToArray4(r, a) {
    (null == a || a > r.length) && (a = r.length);
    for (var e = 0, n = Array(a); e < a; e++) n[e] = r[e];
    return n;
  }
  function _iterableToArrayLimit2(r, l) {
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
  function _arrayWithHoles2(r) {
    if (Array.isArray(r)) return r;
  }
  /*! aellux.js | SPDX-License-Identifier: Apache-2.0 | See LICENSE for terms. */
  (function(root) {
    "use strict";
    var aelluxJs = root.aelluxJs;
    var extensionName = "present";
    if (!aelluxJs) {
      throw new Error('[aellux.js] Cannot attach the "'.concat(extensionName, '" extension: root.aelluxJs is not defined. Load the aellux.js boot script before this extension.'));
    }
    var attr = {
      present: aelluxJs.attr(extensionName),
      group: aelluxJs.attr("present-group"),
      active: aelluxJs.attr("present-active"),
      when: aelluxJs.attr("present-when"),
      triggerOn: aelluxJs.attr("present-trigger-on"),
      autoDismiss: aelluxJs.attr("auto-dismiss"),
      presentMotion: aelluxJs.attr("present-motion"),
      dismissOnClick: aelluxJs.attr("dismiss-on-click"),
      trigger: aelluxJs.attr("present-trigger"),
      //toggle,pop,dismiss,unpop,effect
      target: aelluxJs.attr("present-target"),
      //target ID
      effect: aelluxJs.attr("present-effect")
    };
    var className = {
      pop: aelluxJs.className("pop"),
      popping: aelluxJs.className("popping"),
      dismissing: aelluxJs.className("dismissing"),
      unpopping: aelluxJs.className("unpopping"),
      unpop: aelluxJs.className("unpop"),
      dismissed: aelluxJs.className("dismissed"),
      willChange: aelluxJs.className("will-change"),
      grid: aelluxJs.className("present-grid")
    };
    var presentSelector = "[".concat(attr.present, "]");
    var groupSelector = "[".concat(attr.group, "]");
    aelluxJs.extAttach(extensionName, {
      init: init,
      destroy: destroy,
      pop: pop,
      dismiss: dismiss,
      unpop: unpop,
      toggle: toggle,
      trigger: trigger,
      show: show,
      selected: selected,
      popNext: popNext,
      effect: effect,
      cancelEffect: cancelEffect
    });
    var POP = "Pop", DISMISS = "Dismiss", UNPOP = "Unpop", BEFORE = "Before", MILLISECOND = "ms", SECOND = "s", DEFAULT_PRESENT = "opacity transform height width", OPACITY_SYNTAX = "<number> | <percentage>", TRANSFORM_SYNTAX = "<transform-list> | none";
    var TRANSITION_PREPARE_TIME = 100;
    var TAP_CLICK_WAIT_TIME = 32;
    var presentElements = /* @__PURE__ */ new Map();
    var effects = createPresentEffects(root, aelluxJs, presentElements);
    var openPresentElements = /* @__PURE__ */ new Set();
    var fallbackMotionId = 5e6;
    var triggerElementsSet = /* @__PURE__ */ new Set();
    var triggerTargets = /* @__PURE__ */ new Map();
    var triggersByTargetId = /* @__PURE__ */ new Map();
    var indexedTriggerValues = /* @__PURE__ */ new Map();
    var elementMemories = /* @__PURE__ */ new WeakMap();
    var containerAriaHandlers = /* @__PURE__ */ new WeakMap();
    var triggerAriaHandlers = /* @__PURE__ */ new WeakMap();
    var measuredMemories = /* @__PURE__ */ new WeakMap();
    var groups = /* @__PURE__ */ new Map();
    var hoverTimers = /* @__PURE__ */ new Map();
    var hoveredTriggers = /* @__PURE__ */ new Set();
    var pendingTaps = /* @__PURE__ */ new Set();
    var groupObserver = null;
    var groupsQueued = false;
    var interpolatedProgress = false;
    var interpolatedUnpop = false;
    var playback = createPresentPlayback(root, aelluxJs);
    var gestures = createPresentGestures(root, aelluxJs, {
      state: function state(element) {
        var _presentElements$get;
        return (_presentElements$get = presentElements.get(element)) === null || _presentElements$get === void 0 ? void 0 : _presentElements$get.state;
      },
      busy: function busy(element) {
        var _presentElements$get2;
        return !!((_presentElements$get2 = presentElements.get(element)) !== null && _presentElements$get2 !== void 0 && _presentElements$get2.transition);
      },
      order: function order(element) {
        var _presentElements$get3;
        return ((_presentElements$get3 = presentElements.get(element)) === null || _presentElements$get3 === void 0 ? void 0 : _presentElements$get3.presentationOrder) || 0;
      },
      begin: function begin(element, direction, gesture) {
        var controller = presentElements.get(element);
        controller.gestureRequest = gesture;
        presentTransition(element, direction === POP, false, false, void 0, direction).finally(function() {
          if (controller.gestureRequest === gesture) controller.gestureRequest = null;
          if (controller.gesture !== gesture) gesture.abort();
        });
        if (!controller.transition) gesture.abort();
      }
    });
    var autoObserver = null;
    var presentationSequence = 0;
    var cssProperties = [["pop-progress", "<number>", "0"], ["dismiss-progress", "<number>", "1"], ["present-pop-phase", "<number>", "0"], ["present-dismiss-phase", "<number>", "1"], ["from-opacity", OPACITY_SYNTAX, "0"], ["pop-opacity", OPACITY_SYNTAX, "1"], ["dismiss-opacity", OPACITY_SYNTAX, "0"], ["from-transform", TRANSFORM_SYNTAX, "scale(0.5)"], ["pop-transform", TRANSFORM_SYNTAX, "scale(1)"], ["dismiss-transform", TRANSFORM_SYNTAX, "scale(1.2)"], ["from-height", "*", "0fr"], ["pop-height", "*", "1fr"], ["dismiss-height", "*", "0fr"], ["from-width", "*", "0fr"], ["pop-width", "*", "1fr"], ["dismiss-width", "*", "0fr"], ["pop-ease", "*", "ease-out"], ["dismiss-ease", "*", "ease-in"], ["pop-duration", "<time>", "250ms"], ["dismiss-duration", "<time>", "250ms"]];
    function init(options) {
      var communication = {
        owner: extensionName
      };
      var _loop = function _loop2() {
        var _Object$entries$_i = _slicedToArray2(_Object$entries[_i], 2), name = _Object$entries$_i[0], method = _Object$entries$_i[1];
        aelluxJs.comm.handle("present." + name, function(_ref) {
          var element = _ref.element;
          return method(element);
        }, communication);
      };
      for (var _i = 0, _Object$entries = Object.entries({
        pop: pop,
        unpop: unpop,
        dismiss: dismiss
      }); _i < _Object$entries.length; _i++) {
        _loop();
      }
      aelluxJs.comm.handle("present.toggle", function(_ref2) {
        var element = _ref2.element, goto = _ref2.goto;
        return toggle(element, goto);
      }, communication);
      aelluxJs.comm.handle("present.effect", function(_ref3) {
        var element = _ref3.element, name = _ref3.effect, effectTarget = _ref3.effectTarget;
        return effect(element, name, effectTarget);
      }, communication);
      aelluxJs.comm.handle("present.show", function(_ref4) {
        var group = _ref4.group, member = _ref4.member;
        return show(group, member);
      }, communication);
      aelluxJs.comm.handle("present.selection", function(_ref5) {
        var group = _ref5.group;
        return selected(group);
      }, communication);
      aelluxJs.comm.handle("present.pop-next", function(request) {
        return popNext(request.group, function(member) {
          if (request.preparation) {
            var result = aelluxJs.comm.request(request.preparation.contract, _objectSpread3(_objectSpread3({}, request.preparation.payload), {}, {
              element: member
            }));
            if (!result.handled || result.value === false) throw new Error("Present preparation is unavailable.");
          }
        });
      }, communication);
      playback.init();
      var descriptors = cssProperties.map(function(_ref6) {
        var _ref7 = _slicedToArray2(_ref6, 3), name = _ref7[0], syntax = _ref7[1], initialValue = _ref7[2];
        return {
          name: "--ae-".concat(name),
          syntax: syntax,
          initialValue: initialValue
        };
      });
      var progressRegistered = aelluxJs.registerCssProperty.apply(aelluxJs, _toConsumableArray3(descriptors.slice(0, 4)));
      interpolatedProgress = !!(progressRegistered && root.CSS.supports && root.CSS.supports("opacity", "clamp(0, 0.5, 1)"));
      interpolatedUnpop = !!aelluxJs.registerCssProperty({
        name: "--ae-unpop-progress",
        syntax: "<number>",
        initialValue: "1"
      });
      aelluxJs.registerCssProperty.apply(aelluxJs, _toConsumableArray3(descriptors.slice(4)));
      aelluxJs.mountManager.add({
        extensionName: extensionName,
        selector: presentSelector,
        priority: 0,
        mount: mountPresentContainer,
        unmount: unmountPresentContainer,
        update: function update(element) {
          return autoDismissSchedule(element, presentElements.get(element));
        },
        controllers: ["pop", "dismiss", "unpop", "trigger", "toggle", "effect", "cancelEffect"]
      });
      aelluxJs.mountManager.add({
        extensionName: extensionName,
        priority: 0,
        selector: "[".concat(attr.trigger, "]"),
        mount: mountTriggerElement,
        unmount: unmountTriggerElement,
        update: refreshTriggerTargets
      });
      aelluxJs.mountManager.add({
        extensionName: extensionName,
        selector: groupSelector,
        priority: 1,
        mount: mountGroup,
        unmount: unmountGroup,
        controllers: ["show", "selected", "popNext"]
      });
      autoObserver = new root.MutationObserver(function(records) {
        var _iterator = _createForOfIteratorHelper4(records), _step;
        try {
          for (_iterator.s(); !(_step = _iterator.n()).done; ) {
            var record = _step.value;
            if (record.target === document.documentElement && record.attributeName === aelluxJs.attr("reduced-motion")) effects.preferences();
            var controller = presentElements.get(record.target);
            if (controller) {
              if (record.attributeName !== attr.autoDismiss) gestures.update(record.target);
              autoDismissSchedule(record.target, controller);
            }
          }
        } catch (err) {
          _iterator.e(err);
        } finally {
          _iterator.f();
        }
        if (records.some(function(record2) {
          return record2.type === "childList" || record2.attributeName === "id";
        })) {
          var _iterator2 = _createForOfIteratorHelper4(presentElements.keys()), _step2;
          try {
            for (_iterator2.s(); !(_step2 = _iterator2.n()).done; ) {
              var element = _step2.value;
              if (element.hasAttribute(aelluxJs.attr("present-gesture-source"))) gestures.update(element);
            }
          } catch (err) {
            _iterator2.e(err);
          } finally {
            _iterator2.f();
          }
        }
      });
      autoObserver.observe(document, {
        subtree: true,
        childList: true,
        attributes: true,
        attributeFilter: [attr.autoDismiss, "id", aelluxJs.attr("reduced-motion")].concat(_toConsumableArray3(["", "-source", "-unpop", "-dismiss"].map(function(suffix3) {
          return aelluxJs.attr("present-gesture".concat(suffix3));
        })))
      });
      document.addEventListener("pointerover", onHover);
      document.addEventListener("pointerout", onHover);
      aelluxJs.on("$click", OnClick);
      aelluxJs.on("tap", onTap);
      aelluxJs.onEvent(root, "$resize", refreshExpandedStates);
    }
    function destroy() {
      var _autoObserver;
      aelluxJs.comm.removeOwner(extensionName);
      effects.destroy();
      gestures.destroy();
      (_autoObserver = autoObserver) === null || _autoObserver === void 0 || _autoObserver.disconnect();
      autoObserver = null;
      aelluxJs.mountManager.remove({
        extensionName: extensionName
      });
      aelluxJs.off("$click", OnClick);
      aelluxJs.off("tap", onTap);
      var _iterator3 = _createForOfIteratorHelper4(pendingTaps), _step3;
      try {
        for (_iterator3.s(); !(_step3 = _iterator3.n()).done; ) {
          var pending = _step3.value;
          cancelPendingTap(pending);
        }
      } catch (err) {
        _iterator3.e(err);
      } finally {
        _iterator3.f();
      }
      aelluxJs.offEvent(root, "$resize", refreshExpandedStates);
      document.removeEventListener("pointerover", onHover);
      document.removeEventListener("pointerout", onHover);
      var _iterator4 = _createForOfIteratorHelper4(groups.keys()), _step4;
      try {
        for (_iterator4.s(); !(_step4 = _iterator4.n()).done; ) {
          var group = _step4.value;
          unmountGroup(group);
        }
      } catch (err) {
        _iterator4.e(err);
      } finally {
        _iterator4.f();
      }
      var _iterator5 = _createForOfIteratorHelper4(hoverTimers.keys()), _step5;
      try {
        for (_iterator5.s(); !(_step5 = _iterator5.n()).done; ) {
          var target = _step5.value;
          cancelHoverClose(target);
        }
      } catch (err) {
        _iterator5.e(err);
      } finally {
        _iterator5.f();
      }
      hoveredTriggers.clear();
      var _iterator6 = _createForOfIteratorHelper4(triggerElementsSet), _step6;
      try {
        for (_iterator6.s(); !(_step6 = _iterator6.n()).done; ) {
          var triggerElement = _step6.value;
          unmountTriggerElement(triggerElement);
        }
      } catch (err) {
        _iterator6.e(err);
      } finally {
        _iterator6.f();
      }
      var _iterator7 = _createForOfIteratorHelper4(presentElements.keys()), _step7;
      try {
        for (_iterator7.s(); !(_step7 = _iterator7.n()).done; ) {
          var element = _step7.value;
          unmountPresentContainer(element);
        }
      } catch (err) {
        _iterator7.e(err);
      } finally {
        _iterator7.f();
      }
      openPresentElements.clear();
    }
    function mountPresentContainer(element) {
      if (presentElements.has(element)) return;
      elementMemories.set(element, aelluxJs.persist.element.save(element, [attr.present, attr.presentMotion, "hidden"], ["--ae-pop-progress", "--ae-dismiss-progress", "--ae-unpop-progress", "--ae-present-pop-phase", "--ae-present-dismiss-phase"]));
      containerAriaHandlers.set(element, aelluxJs.aria.register(element));
      var initialState = element.classList.contains(className.dismissed) ? DISMISS : element.classList.contains(className.unpop) || element.hidden ? UNPOP : POP;
      var legacyHidden = element.hidden || ![className.pop, className.unpop, className.dismissed].some(function(name) {
        return element.classList.contains(name);
      });
      if ((element.getAttribute(attr.present) || "").trim().toLowerCase() === "all") {
        element.setAttribute(attr.present, DEFAULT_PRESENT);
      }
      if (element.hasAttribute(attr.presentMotion)) {
        element.removeAttribute(attr.presentMotion);
      }
      var presentMotion = element.querySelector(":scope>[".concat(attr.presentMotion, "]"));
      var tokens = (element.getAttribute(attr.present) || "").split(/\s+/);
      var measuredHeight = !presentMotion && tokens.includes("height");
      var measuredWidth = !presentMotion && tokens.includes("width");
      if (presentMotion) element.classList.add(className.grid);
      else if (measuredHeight || measuredWidth) {
        aelluxJs.diagnostics.info(aelluxJs.diagnostics.INFO_PRESENT_MEASURED_LAYOUT, {
          extension: extensionName,
          element: element
        });
      }
      var presentController = {
        state: initialState,
        legacyHidden: legacyHidden,
        initialClasses: [className.pop, className.unpop, className.dismissed].filter(function(name) {
          return element.classList.contains(name);
        }),
        gesture: null,
        gestureRequest: null,
        presentMotion: presentMotion,
        measuredHeight: measuredHeight,
        measuredWidth: measuredWidth,
        motionEnabled: (element.getAttribute(attr.present) || "").trim() !== "",
        motionId: aelluxJs.motion ? aelluxJs.motion.id() : fallbackMotionId++,
        transition: null,
        handoff: null,
        opening: null,
        reverse: null,
        operationRevision: 0,
        presentationOrder: element.hidden ? 0 : ++presentationSequence,
        autoDismissTimeout: null,
        autoCountdown: null,
        direction: initialState,
        classList: element.classList,
        triggers: /* @__PURE__ */ new Set(),
        triggerExpanded: initialState === POP,
        setAriaExpanded: function setAriaExpanded(value) {
          this.expanded = value === "true";
          containerAriaHandlers.get(element).set({
            expanded: this.expanded
          });
        },
        setTriggerExpanded: function setTriggerExpanded(value) {
          this.triggerExpanded = value;
          this.triggers.forEach(updateTriggerAriaExpanded);
        },
        stop: function stop() {
          var _this$gesture, _this$reverse, _this$gestureDisplay;
          var options = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : {};
          effects.cancelWithin(element);
          (_this$gesture = this.gesture) === null || _this$gesture === void 0 || _this$gesture.abort();
          this.gesture = null;
          var replacement = options.replacement === true;
          var transitionStart = options.transitionStart === true;
          var transition = this.transition;
          if (transition) {
            transition.cancelled = true;
            transition.replacement = replacement;
            if (aelluxJs.motion) aelluxJs.motion.cancel(this.motionId);
            if (transition.timeout !== null) {
              clearTimeout(transition.timeout);
              transition.timeout = null;
            }
            if (!transitionStart && transition.className) {
              this.classList.remove(transition.className);
            }
            this.transition = null;
            transition.interrupt(aelluxJs.diagnostics.create(aelluxJs.diagnostics.WARN_INTERRUPTION, {
              extensionName: extensionName,
              replacement: replacement
            }));
          }
          cancelAutoDismiss(this);
          (_this$reverse = this.reverse) === null || _this$reverse === void 0 || _this$reverse.cleanup();
          this.reverse = null;
          (_this$gestureDisplay = this.gestureDisplay) === null || _this$gestureDisplay === void 0 || _this$gestureDisplay.restore();
          this.gestureDisplay = null;
          restoreHandoff(this);
          if (transitionStart) {
            this.classList.remove(className.dismissing, className.unpopping);
          } else {
            this.classList.remove(className.pop, className.popping, className.dismissing, className.unpopping, className.willChange);
          }
          if (!replacement) restoreMeasuredStyles(element, this);
        }
      };
      establishState(element, presentController, initialState);
      if (initialState === POP) {
        openPresentElements.add(element);
      }
      presentElements.set(element, presentController);
      var _iterator8 = _createForOfIteratorHelper4(element.querySelectorAll("[".concat(attr.trigger, "]"))), _step8;
      try {
        for (_iterator8.s(); !(_step8 = _iterator8.n()).done; ) {
          var _triggerElement = _step8.value;
          if (triggerTargets.get(_triggerElement) === element) {
            presentController.triggers.add(_triggerElement);
            updateTriggerAriaExpanded(_triggerElement);
          }
        }
      } catch (err) {
        _iterator8.e(err);
      } finally {
        _iterator8.f();
      }
      var idTriggers = triggersByTargetId.get(element.id);
      if (idTriggers) {
        var _iterator9 = _createForOfIteratorHelper4(idTriggers), _step9;
        try {
          for (_iterator9.s(); !(_step9 = _iterator9.n()).done; ) {
            var triggerElement = _step9.value;
            refreshTriggerTargets(triggerElement);
          }
        } catch (err) {
          _iterator9.e(err);
        } finally {
          _iterator9.f();
        }
      }
      setProgress(element, initialState === POP);
      syncAriaExpanded(element, presentController);
      queueGroups();
      autoDismissSchedule(element, presentController);
      gestures.update(element);
    }
    function unmountPresentContainer(element) {
      var _aelluxJs$waitLayout, _element$classList, _containerAriaHandler, _elementMemories$get;
      if (!presentElements.has(element)) return;
      cancelElementTaps(element);
      var controller = presentElements.get(element);
      gestures.remove(element);
      cancelHoverClose(element);
      var _iterator0 = _createForOfIteratorHelper4(controller.triggers), _step0;
      try {
        for (_iterator0.s(); !(_step0 = _iterator0.n()).done; ) {
          var button = _step0.value;
          hoveredTriggers.delete(button);
        }
      } catch (err) {
        _iterator0.e(err);
      } finally {
        _iterator0.f();
      }
      controller.stop();
      (_aelluxJs$waitLayout = aelluxJs.waitLayout) === null || _aelluxJs$waitLayout === void 0 || _aelluxJs$waitLayout.cancel(controller.motionId);
      element.classList.remove(className.grid);
      element.classList.remove(className.pop, className.unpop, className.dismissed);
      (_element$classList = element.classList).add.apply(_element$classList, _toConsumableArray3(controller.initialClasses));
      presentElements.delete(element);
      openPresentElements.delete(element);
      (_containerAriaHandler = containerAriaHandlers.get(element)) === null || _containerAriaHandler === void 0 || _containerAriaHandler.release();
      containerAriaHandlers.delete(element);
      (_elementMemories$get = elementMemories.get(element)) === null || _elementMemories$get === void 0 || _elementMemories$get.restore();
      elementMemories.delete(element);
      controller.triggers.forEach(updateTriggerAriaExpanded);
      queueGroups();
    }
    function mountTriggerElement(triggerElement) {
      if (triggerElementsSet.has(triggerElement) || !triggerElement.hasAttribute(attr.trigger)) return;
      triggerAriaHandlers.set(triggerElement, aelluxJs.aria.register(triggerElement));
      triggerElementsSet.add(triggerElement);
      refreshTriggerTargets(triggerElement);
    }
    function unmountTriggerElement(triggerElement) {
      var _triggerAriaHandlers$;
      if (!triggerElementsSet.has(triggerElement)) return;
      cancelElementTaps(triggerElement);
      hoveredTriggers.delete(triggerElement);
      var target = triggerTargets.get(triggerElement);
      if (target) {
        var _presentElements$get4;
        cancelHoverClose(target);
        (_presentElements$get4 = presentElements.get(target)) === null || _presentElements$get4 === void 0 || _presentElements$get4.triggers.delete(triggerElement);
        triggerTargets.delete(triggerElement);
      }
      unindexTriggerTarget(triggerElement);
      triggerElementsSet.delete(triggerElement);
      (_triggerAriaHandlers$ = triggerAriaHandlers.get(triggerElement)) === null || _triggerAriaHandlers$ === void 0 || _triggerAriaHandlers$.release();
      triggerAriaHandlers.delete(triggerElement);
    }
    function targetIdFor(value) {
      if (!value) return null;
      var id = value.charAt(0) === "#" ? value.slice(1) : value;
      return id && !/[\s#]/.test(id) ? id : null;
    }
    function targetById(value) {
      var id = targetIdFor(value);
      if (!id) {
        aelluxJs.diagnostics.error(aelluxJs.diagnostics.ERROR_EXTENSION_SELECTOR, {
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
      var previous = indexedTriggerValues.get(triggerElement);
      var id = targetIdFor(previous);
      if (id) {
        var triggers = triggersByTargetId.get(id);
        triggers.delete(triggerElement);
        if (!triggers.size) triggersByTargetId.delete(id);
      }
      indexedTriggerValues.delete(triggerElement);
    }
    function indexTriggerTarget(triggerElement, value) {
      if (indexedTriggerValues.get(triggerElement) === value) return;
      unindexTriggerTarget(triggerElement);
      indexedTriggerValues.set(triggerElement, value);
      var id = targetIdFor(value);
      if (id) {
        var triggers = triggersByTargetId.get(id);
        if (!triggers) {
          triggers = /* @__PURE__ */ new Set();
          triggersByTargetId.set(id, triggers);
        }
        triggers.add(triggerElement);
      }
    }
    function refreshTriggerTargets(triggerElement) {
      var _presentElements$get6, _triggerAriaHandlers$4;
      if (!triggerElement.hasAttribute(attr.trigger)) {
        unmountTriggerElement(triggerElement);
        return;
      }
      if (!triggerElementsSet.has(triggerElement)) {
        mountTriggerElement(triggerElement);
        return;
      }
      var previousTarget = triggerTargets.get(triggerElement);
      var targetSelector = triggerElement.getAttribute(attr.target);
      indexTriggerTarget(triggerElement, targetSelector);
      var container = triggerElement.closest(presentSelector);
      if (previousTarget) {
        var _presentElements$get5;
        (_presentElements$get5 = presentElements.get(previousTarget)) === null || _presentElements$get5 === void 0 || _presentElements$get5.triggers.delete(triggerElement);
      }
      var target = null;
      if (targetSelector) {
        target = targetById(targetSelector);
      } else if (container) {
        target = container;
      }
      if (previousTarget !== target) hoveredTriggers.delete(triggerElement);
      if (!target) {
        var _triggerAriaHandlers$2, _triggerAriaHandlers$3;
        triggerTargets.delete(triggerElement);
        (_triggerAriaHandlers$2 = triggerAriaHandlers.get(triggerElement)) === null || _triggerAriaHandlers$2 === void 0 || _triggerAriaHandlers$2.unset("expanded");
        (_triggerAriaHandlers$3 = triggerAriaHandlers.get(triggerElement)) === null || _triggerAriaHandlers$3 === void 0 || _triggerAriaHandlers$3.unset("controls");
        return;
      }
      triggerTargets.set(triggerElement, target);
      (_presentElements$get6 = presentElements.get(target)) === null || _presentElements$get6 === void 0 || _presentElements$get6.triggers.add(triggerElement);
      var targetIds = new Set(target.id ? [target.id] : []);
      var initial = (_triggerAriaHandlers$4 = triggerAriaHandlers.get(triggerElement)) === null || _triggerAriaHandlers$4 === void 0 ? void 0 : _triggerAriaHandlers$4.initial("controls");
      if (initial) {
        initial.trim().split(/\s+/).forEach(function(x) {
          return targetIds.add(x);
        });
      }
      updateTriggerAriaExpanded(triggerElement);
      if (targetIds.size) triggerAriaHandlers.get(triggerElement).set({
        controls: _toConsumableArray3(targetIds)
      });
      else triggerAriaHandlers.get(triggerElement).unset("controls");
    }
    function updateTriggerAriaExpanded(triggerElement) {
      var _presentElements$get7, _triggerAriaHandlers$5;
      var target = triggerTargets.get(triggerElement);
      if (!target) return;
      var expanded = ((_presentElements$get7 = presentElements.get(target)) === null || _presentElements$get7 === void 0 ? void 0 : _presentElements$get7.triggerExpanded) === true;
      (_triggerAriaHandlers$5 = triggerAriaHandlers.get(triggerElement)) === null || _triggerAriaHandlers$5 === void 0 || _triggerAriaHandlers$5.set({
        expanded: expanded
      });
    }
    function pop(element) {
      return presentTransition(element, true, true);
    }
    function dismiss(element) {
      return presentTransition(element, false);
    }
    function unpop(element) {
      return presentTransition(element, false, false, false, void 0, UNPOP);
    }
    function toggle(element, goto) {
      return presentTransition(element, goto, false, false, void 0, UNPOP);
    }
    function effect(element, name, effectTarget) {
      return effects.effect(element, name, effectTarget);
    }
    function cancelEffect(element) {
      effects.cancelWithin(element);
    }
    function trigger(element, trigger2, name) {
      trigger2 = typeof trigger2 === "string" ? (trigger2 || "toggle").toLowerCase() : "toggle";
      if (trigger2 === "effect") return effect(element, name);
      if (!["pop", "dismiss", "unpop", "toggle"].includes(trigger2)) aelluxJs.diagnostics.warn(aelluxJs.diagnostics.WARN_CONFIGURATION_VALUE, {
        extension: extensionName,
        element: element,
        attribute: attr.trigger,
        value: trigger2,
        reason: "Unknown Present action; using toggle.",
        suggestion: "Use pop, dismiss, unpop, or toggle."
      });
      var method = trigger2 === "pop" ? pop : trigger2 === "dismiss" ? dismiss : trigger2 === "unpop" ? unpop : toggle;
      return method(element);
    }
    function restoreMeasuredStyles(element, controller) {
      var memory = measuredMemories.get(element);
      if (!memory) return;
      memory.restore();
      measuredMemories.delete(element);
    }
    function restoreHandoff(controller) {
      var _controller$handoff;
      (_controller$handoff = controller.handoff) === null || _controller$handoff === void 0 || _controller$handoff.memory.restore();
      controller.handoff = null;
    }
    function captureHandoff(element, controller) {
      if ((controller.measuredHeight || controller.measuredWidth) && !measuredMemories.has(element)) {
        measuredMemories.set(element, aelluxJs.persist.element.save(element, [], ["max-height", "max-width"]));
      }
      var tokens = (element.getAttribute(attr.present) || "").split(/\s+/);
      var properties = [];
      if (tokens.includes("opacity")) properties.push("opacity");
      if (tokens.includes("transform") && !element.hasAttribute(aelluxJs.attr("anchor"))) properties.push("transform");
      if (tokens.includes("height")) properties.push.apply(properties, _toConsumableArray3(controller.presentMotion ? ["grid-template-rows", "height"] : ["max-height"]));
      if (tokens.includes("width")) properties.push.apply(properties, _toConsumableArray3(controller.presentMotion ? ["grid-template-columns", "width"] : ["max-width"]));
      properties.push("--ae-present-pop-phase", "--ae-present-dismiss-phase", "--ae-pop-progress", "--ae-dismiss-progress", "--ae-unpop-progress");
      var computed = root.getComputedStyle(element);
      var values = properties.map(function(property) {
        var value = computed.getPropertyValue(property).trim();
        if (property === "max-height" || property === "max-width") {
          var dimension = property.slice(4);
          value = "".concat(Math.max(0, parseFloat(computed[dimension]) || 0), "px");
        }
        return [property, value];
      });
      if (controller.reverse) {
        controller.reverse.cleanup();
        controller.reverse = null;
        restoreHandoff(controller);
      }
      var memory = aelluxJs.persist.element.save(element, [], [].concat(properties, ["transition-property"]));
      var transition = aelluxJs.persist.element.save(element, [], ["transition-property"]);
      var freeze = function freeze2() {
        element.style.setProperty("transition-property", "none", "important");
        var _iterator1 = _createForOfIteratorHelper4(values), _step1;
        try {
          for (_iterator1.s(); !(_step1 = _iterator1.n()).done; ) {
            var _step1$value = _slicedToArray2(_step1.value, 2), property = _step1$value[0], value = _step1$value[1];
            element.style.setProperty(property, value, property.startsWith("--") ? "" : "important");
          }
        } catch (err) {
          _iterator1.e(err);
        } finally {
          _iterator1.f();
        }
        element.getBoundingClientRect();
      };
      freeze();
      return {
        memory: memory,
        transition: transition,
        values: values,
        freeze: freeze
      };
    }
    function prepareMeasuredSize(_x, _x2, _x3, _x4, _x5) {
      return _prepareMeasuredSize.apply(this, arguments);
    }
    function _prepareMeasuredSize() {
      _prepareMeasuredSize = _asyncToGenerator(/* @__PURE__ */ _regenerator().m(function _callee(element, controller, gotoVisible, previousSize, waitForPreparation) {
        var size, _element$classList2, _element$classList3, states, computed, height, width, start;
        return _regenerator().w(function(_context) {
          while (1) switch (_context.n) {
            case 0:
              if (!(!controller.measuredHeight && !controller.measuredWidth)) {
                _context.n = 1;
                break;
              }
              return _context.a(2, null);
            case 1:
              if (!measuredMemories.has(element)) {
                measuredMemories.set(element, aelluxJs.persist.element.save(element, [], ["max-height", "max-width"]));
              }
              if (gotoVisible || !previousSize) measuredMemories.get(element).restore();
              size = previousSize;
              if (gotoVisible || !size) {
                states = [className.unpop, className.dismissed].filter(function(name) {
                  return element.classList.contains(name);
                });
                if (gotoVisible) (_element$classList2 = element.classList).remove.apply(_element$classList2, _toConsumableArray3(states));
                computed = root.getComputedStyle(element);
                height = parseFloat(computed.height);
                width = parseFloat(computed.width);
                size = {
                  height: Number.isFinite(height) ? height : element.scrollHeight,
                  width: Number.isFinite(width) ? width : element.scrollWidth
                };
                if (gotoVisible) (_element$classList3 = element.classList).add.apply(_element$classList3, _toConsumableArray3(states));
              }
              start = previousSize || (gotoVisible ? {
                height: 0,
                width: 0
              } : size);
              if (controller.measuredHeight) {
                element.style.setProperty("max-height", "".concat(Math.max(0, start.height), "px"), "important");
              }
              if (controller.measuredWidth) {
                element.style.setProperty("max-width", "".concat(Math.max(0, start.width), "px"), "important");
              }
              if (waitForPreparation) {
                _context.n = 2;
                break;
              }
              _context.n = 2;
              return aelluxJs.waitLayout.read(controller.motionId, function() {
                return element.getBoundingClientRect();
              });
            case 2:
              return _context.a(2, size);
          }
        }, _callee);
      }));
      return _prepareMeasuredSize.apply(this, arguments);
    }
    function presentTransition(_x6, _x7) {
      return _presentTransition.apply(this, arguments);
    }
    function _presentTransition() {
      _presentTransition = _asyncToGenerator(/* @__PURE__ */ _regenerator().m(function _callee2(element, gotoVisible) {
        var forceRepop, groupOperation, presentationOrder, closingDirection, controller, gesture, reversing, group, groupState, groupRevision, hasCapacity, newDirection, transition, _aelluxJs$currentPref, _groups$get, revision, allowEvent, impliedReverse, reverseTracks, reusePreparation, waitForPreparation, previousSize, handoff, computed, interrupted, size, prepared, configurationDirection, duration, timeMs, applyDestination, activateTransition, advancedEase, motionOptions, completed, autoDismissValue, _duration, motionResult, finalVisible, _selected, active, ownsTransition, _controller$gesture, _controller$reverse2, _controller$gestureDi2, _args2 = arguments, _t, _t2;
        return _regenerator().w(function(_context2) {
          while (1) switch (_context2.p = _context2.n) {
            case 0:
              forceRepop = _args2.length > 2 && _args2[2] !== void 0 ? _args2[2] : false;
              groupOperation = _args2.length > 3 && _args2[3] !== void 0 ? _args2[3] : false;
              presentationOrder = _args2.length > 4 ? _args2[4] : void 0;
              closingDirection = _args2.length > 5 && _args2[5] !== void 0 ? _args2[5] : DISMISS;
              controller = presentElements.get(element);
              if (controller) {
                _context2.n = 1;
                break;
              }
              return _context2.a(2);
            case 1:
              gesture = controller.gestureRequest;
              reversing = closingDirection === UNPOP && gotoVisible === false;
              if (!(reversing && controller.direction === DISMISS && controller.transition)) {
                _context2.n = 2;
                break;
              }
              return _context2.a(2, false);
            case 2:
              if (controller.direction === null) controller.direction = element.hidden ? DISMISS : POP;
              if (typeof gotoVisible === "undefined" || gotoVisible === null) gotoVisible = controller.direction === POP ? false : true;
              group = element.closest(groupSelector);
              groupState = groups.get(group);
              groupRevision = groupState === null || groupState === void 0 ? void 0 : groupState.revision;
              if (!(!groupOperation && groupState && !groupState.accumulating && element !== group)) {
                _context2.n = 6;
                break;
              }
              if (element.id) {
                _context2.n = 3;
                break;
              }
              groupDiagnostic(group, "Present Group members must have an ID.");
              return _context2.a(2, false);
            case 3:
              if (!gotoVisible) {
                _context2.n = 4;
                break;
              }
              return _context2.a(2, show(group, element.id));
            case 4:
              if (!(groups.get(group).selected === element)) {
                _context2.n = 6;
                break;
              }
              if (reversing) {
                _context2.n = 5;
                break;
              }
              return _context2.a(2, show(group, ""));
            case 5:
              if (group.getAttribute(attr.active) !== "") group.setAttribute(attr.active, "");
              return _context2.a(2, selectGroup(group, null, groupMembers(group), UNPOP));
            case 6:
              hasCapacity = function hasCapacity2() {
                return groupOperation || element === group || !gotoVisible || !(groupState !== null && groupState !== void 0 && groupState.accumulating) || groupMemberActive(element, groupState) || activeGroupMembers(group, groupState).length < groupLimit(group, groupState);
              };
              if (hasCapacity()) {
                _context2.n = 7;
                break;
              }
              return _context2.a(2, false);
            case 7:
              newDirection = gotoVisible ? POP : closingDirection;
              if (!(controller.state !== POP && !controller.transition && !gotoVisible || newDirection === controller.direction && !forceRepop)) {
                _context2.n = 8;
                break;
              }
              if (!controller.transition) syncAriaExpanded(element, controller);
              return _context2.a(2);
            case 8:
              transition = null;
              _context2.p = 9;
              revision = controller.operationRevision;
              allowEvent = groupOperation || aelluxJs.dispatchFrom(element, "".concat(BEFORE).concat(newDirection), {
                bubbles: true,
                cancelable: true
              });
              if (!(!allowEvent || controller.operationRevision !== revision || presentElements.get(element) !== controller || !element.isConnected)) {
                _context2.n = 10;
                break;
              }
              return _context2.a(2);
            case 10:
              if (!(!groupOperation && element !== group && (element.closest(groupSelector) !== group || groupState && (groups.get(group) !== groupState || groupState.revision !== groupRevision)))) {
                _context2.n = 11;
                break;
              }
              return _context2.a(2);
            case 11:
              if (hasCapacity()) {
                _context2.n = 12;
                break;
              }
              return _context2.a(2, false);
            case 12:
              effects.cancelWithin(element);
              controller.operationRevision++;
              impliedReverse = reversing && !controller.opening && !controller.transition;
              reverseTracks = reversing && controller.motionEnabled && ((_aelluxJs$currentPref = aelluxJs.currentPreference) === null || _aelluxJs$currentPref === void 0 ? void 0 : _aelluxJs$currentPref.call(aelluxJs, "reduced-motion")) !== "reduced" ? gesture ? playback.full(element, controller, false) : playback.snapshot(element, controller, interpolatedProgress) : [];
              if (gotoVisible) controller.opening = null;
              if (gotoVisible) controller.presentationOrder = presentationOrder === void 0 ? ++presentationSequence : presentationOrder;
              if (!gotoVisible || !groupOperation) (_groups$get = groups.get(group)) === null || _groups$get === void 0 || _groups$get.reservations.delete(element);
              if (forceRepop && (!element.hidden || controller.transition)) {
                controller.stop();
                element.hidden = true;
                openPresentElements.delete(element);
                syncAriaExpanded(element, controller);
                element.getBoundingClientRect();
              }
              reusePreparation = !forceRepop && controller.motionEnabled && controller.transition !== null && controller.classList.contains(className.willChange);
              waitForPreparation = !gesture && controller.motionEnabled && !reusePreparation && !reversing;
              previousSize = null;
              handoff = !gesture && !gotoVisible && controller.motionEnabled ? captureHandoff(element, controller) : null;
              if (handoff && (controller.measuredHeight || controller.measuredWidth)) {
                computed = root.getComputedStyle(element);
                previousSize = {
                  height: parseFloat(computed.maxHeight),
                  width: parseFloat(computed.maxWidth)
                };
              }
              if (!forceRepop) {
                controller.stop({
                  replacement: !!handoff || reusePreparation,
                  transitionStart: true
                });
              }
              controller.handoff = handoff;
              controller.gestureRequest = null;
              controller.gesture = gesture;
              controller.direction = newDirection;
              if (reversing) controller.reverse = gesture ? playback.control(element, reverseTracks, false, interpolatedProgress, interpolatedUnpop) : playback.reverse(element, reverseTracks, interpolatedUnpop);
              controller.setTriggerExpanded(gotoVisible);
              if (!handoff) {
                setPhase(element, "pop", "0");
                setPhase(element, "dismiss", "0");
                element.style.setProperty("--ae-pop-progress", "0");
                element.style.setProperty("--ae-dismiss-progress", "0");
              }
              if (gotoVisible || reversing) element.style.setProperty("--ae-unpop-progress", "0");
              root.getComputedStyle(element).getPropertyValue("--ae-pop-progress");
              interrupted = new Promise(function(_, interruptTransition) {
                transition = {
                  className: null,
                  timeout: null,
                  interrupt: interruptTransition,
                  replacement: false
                };
                controller.transition = transition;
              });
              interrupted.catch(function() {
              });
              element.hidden = false;
              if (gesture && root.getComputedStyle(element).display === "none") {
                controller.gestureDisplay = aelluxJs.persist.element.save(element, [], ["display"]);
                element.style.setProperty("display", controller.presentMotion ? "inline-grid" : "block", "important");
              }
              openPresentElements.add(element);
              size = null;
              if (!(!reversing && (controller.measuredHeight || controller.measuredWidth))) {
                _context2.n = 14;
                break;
              }
              _context2.n = 13;
              return prepareMeasuredSize(element, controller, gotoVisible, previousSize, waitForPreparation || !!gesture);
            case 13:
              size = _context2.v;
            case 14:
              if (!(controller.transition !== transition)) {
                _context2.n = 15;
                break;
              }
              return _context2.a(2);
            case 15:
              if (controller.motionEnabled) {
                controller.classList.add(className.willChange);
              }
              if (!waitForPreparation) {
                _context2.n = 16;
                break;
              }
              prepared = new Promise(function(resolve) {
                transition.timeout = setTimeout(function() {
                  transition.timeout = null;
                  resolve();
                }, TRANSITION_PREPARE_TIME);
              });
              _context2.n = 16;
              return Promise.race([prepared, interrupted]);
            case 16:
              transition.className = gotoVisible ? className.popping : reversing ? className.unpopping : className.dismissing;
              configurationDirection = reversing ? POP : newDirection;
              duration = root.getComputedStyle(element).getPropertyValue("--ae-".concat(configurationDirection, "-duration").toLowerCase()).trim();
              timeMs = reversing ? controller.reverse.duration : getString2Time(duration);
              applyDestination = function applyDestination2() {
                controller.classList.remove(className.unpop, className.dismissed, className.pop, className.popping, className.dismissing, className.unpopping);
                controller.classList.add(transition.className);
                if (interpolatedProgress) {
                  element.style.setProperty("--ae-pop-progress", "clamp(0, var(--ae-present-pop-phase), 1)");
                  element.style.setProperty("--ae-dismiss-progress", "clamp(0, var(--ae-present-dismiss-phase), 1)");
                }
                setPhase(element, "pop", gotoVisible ? "1" : "0");
                setPhase(element, "dismiss", gotoVisible ? "0" : "1");
                if (size) {
                  if (controller.measuredHeight) {
                    element.style.setProperty("max-height", "".concat(gotoVisible ? size.height : 0, "px"), "important");
                  }
                  if (controller.measuredWidth) {
                    element.style.setProperty("max-width", "".concat(gotoVisible ? size.width : 0, "px"), "important");
                  }
                }
              };
              activateTransition = function activateTransition2() {
                if (controller.transition !== transition) return;
                if (gesture) {
                  var _tracks;
                  var tracks = reverseTracks;
                  if (!reversing) {
                    var opening = controller.opening;
                    controller.opening = playback.capture(element, controller, applyDestination, size, gotoVisible && interpolatedProgress, gotoVisible ? "pop" : "dismiss");
                    tracks = playback.full(element, controller, false);
                    controller.opening = gotoVisible ? {
                      saved: tracks,
                      completed: true
                    } : opening;
                    controller.reverse = playback.control(element, tracks, gesture.dismiss, interpolatedProgress, interpolatedUnpop);
                  }
                  controller.classList.remove(className.pop, className.unpop, className.dismissed, className.popping, className.unpopping, className.dismissing);
                  controller.classList.add(transition.className);
                  controller.reverse.apply();
                  var distance = 0;
                  var transform = (_tracks = tracks) === null || _tracks === void 0 ? void 0 : _tracks.find(function(track) {
                    return track.property === "transform";
                  });
                  if (transform) try {
                    var frames = transform.frames;
                    var from = new root.DOMMatrix(frames[0].transform), to = new root.DOMMatrix(frames[frames.length - 1].transform);
                    distance = Math.abs(gesture.axis === "x" ? to.m41 - from.m41 : to.m42 - from.m42);
                  } catch (_) {
                  }
                  var previous = gesture.progress;
                  gesture.attach({
                    seek: function seek(value2) {
                      if (controller.transition !== transition) return;
                      controller.reverse.seek(value2);
                      if (!gesture.dismiss && value2 !== previous) {
                        transition.className = value2 > previous ? className.popping : className.unpopping;
                        controller.classList.remove(className.popping, className.unpopping);
                        controller.classList.add(transition.className);
                      }
                      previous = value2;
                      var popValue = gesture.dismiss ? 1 - value2 : value2;
                      if (!interpolatedProgress) {
                        setPhase(element, "pop", String(popValue));
                        setPhase(element, "dismiss", String(gesture.dismiss ? value2 : 1 - value2));
                        element.style.setProperty("--ae-pop-progress", String(popValue));
                        element.style.setProperty("--ae-dismiss-progress", String(gesture.dismiss ? value2 : 1 - value2));
                      }
                      if (!interpolatedUnpop) element.style.setProperty("--ae-unpop-progress", String(1 - popValue));
                    },
                    playTo: function playTo(target) {
                      if (controller.transition !== transition) return Promise.reject();
                      if (!gesture.dismiss) {
                        transition.className = target ? className.popping : className.unpopping;
                        controller.classList.remove(className.popping, className.unpopping);
                        controller.classList.add(transition.className);
                      }
                      return controller.reverse.playTo(target);
                    }
                  }, distance);
                  return;
                }
                if (reversing) {
                  handoff === null || handoff === void 0 || handoff.memory.restore();
                  if (interpolatedProgress) element.style.setProperty("--ae-pop-progress", "clamp(0, var(--ae-present-pop-phase), 1)");
                  controller.classList.remove(className.pop, className.popping, className.dismissing);
                  controller.classList.add(className.unpopping);
                  controller.reverse.apply();
                  return;
                }
                if (handoff) {
                  handoff.memory.restore();
                  element.style.setProperty("transition-property", "none", "important");
                  applyDestination();
                  var _computed = root.getComputedStyle(element);
                  var _tracks2 = handoff.values.filter(function(_ref8) {
                    var _ref9 = _slicedToArray2(_ref8, 1), property2 = _ref9[0];
                    return property2.startsWith("grid-template-") || property2 === "height" || property2 === "width";
                  }).map(function(_ref0) {
                    var _ref1 = _slicedToArray2(_ref0, 1), property2 = _ref1[0];
                    return [property2, _computed.getPropertyValue(property2)];
                  });
                  handoff.freeze();
                  handoff.transition.restore();
                  var properties = root.getComputedStyle(element).transitionProperty;
                  element.getBoundingClientRect();
                  handoff.memory.restore();
                  applyDestination();
                  if (_tracks2.length) element.style.setProperty("transition-property", "".concat(properties, ", height, width"), "important");
                  var _iterator19 = _createForOfIteratorHelper4(_tracks2), _step19;
                  try {
                    for (_iterator19.s(); !(_step19 = _iterator19.n()).done; ) {
                      var _step19$value = _slicedToArray2(_step19.value, 2), property = _step19$value[0], value = _step19$value[1];
                      element.style.setProperty(property, value, "important");
                    }
                  } catch (err) {
                    _iterator19.e(err);
                  } finally {
                    _iterator19.f();
                  }
                } else if (gotoVisible) {
                  controller.opening = playback.capture(element, controller, applyDestination, size, interpolatedProgress);
                } else applyDestination();
              };
              advancedEase = root.getComputedStyle(element).getPropertyValue("--ae-".concat(configurationDirection, "-aellux-ease").toLowerCase()).trim() || void 0;
              motionOptions = {
                extension: extensionName,
                id: controller.motionId,
                ownedOnly: reversing,
                apply: activateTransition,
                easing: reversing && !impliedReverse ? void 0 : advancedEase,
                nativeDuration: timeMs,
                maxFPS: aelluxJs.layoutMaxFPS ? aelluxJs.layoutMaxFPS(element) : void 0,
                abort: function abort() {
                  return controller.transition !== transition || !element.isConnected;
                }
              };
              completed = gesture ? (activateTransition(), gesture.settled) : aelluxJs.motion ? aelluxJs.motion.run(element, motionOptions) : legacyMotionRun(motionOptions, transition);
              aelluxJs.dispatchFrom(element, "Layout", {
                detail: {
                  origin: "present.".concat(newDirection).toLowerCase(),
                  durationMs: Number.isFinite(timeMs) ? Math.max(0, timeMs) : 0
                },
                bubbles: true
              });
              if (!(controller.transition !== transition || !element.isConnected)) {
                _context2.n = 17;
                break;
              }
              return _context2.a(2);
            case 17:
              autoDismissValue = gotoVisible && element.getAttribute(attr.autoDismiss);
              if (autoDismissValue) {
                _duration = getString2Time(autoDismissValue);
                if (Number.isFinite(_duration) && _duration >= 0) {
                  emitAutoDismissProgress(element, 0, _duration);
                }
              }
              if (!(controller.transition !== transition || !element.isConnected)) {
                _context2.n = 18;
                break;
              }
              return _context2.a(2);
            case 18:
              aelluxJs.dispatchFrom(element, gotoVisible ? "Popping" : reversing ? "Unpopping" : "Dismissing", {
                bubbles: true
              });
              _context2.n = 19;
              return Promise.race([completed, interrupted]);
            case 19:
              motionResult = _context2.v;
              if (!(controller.transition !== transition || gesture && !motionResult || !gesture && motionResult && motionResult.status !== "completed")) {
                _context2.n = 20;
                break;
              }
              return _context2.a(2);
            case 20:
              if (!gesture) {
                _context2.n = 21;
                break;
              }
              finalVisible = motionResult === POP;
              controller.direction = motionResult;
              controller.setTriggerExpanded(finalVisible);
              finishTransition(element, controller, transition, finalVisible);
              if (groupState && groups.get(group) === groupState && !groupState.accumulating) {
                _selected = finalVisible ? element : groupState.selected === element ? null : groupState.selected;
                groupState.selected = _selected;
                active = (_selected === null || _selected === void 0 ? void 0 : _selected.id) || "";
                if (group.getAttribute(attr.active) !== active) group.setAttribute(attr.active, active);
                publishGroup(group, groupState, _selected);
              }
              controller.gesture = null;
              aelluxJs.dispatchFrom(element, motionResult, {
                bubbles: true
              });
              if (finalVisible) autoDismissSchedule(element, controller);
              return _context2.a(2);
            case 21:
              if (gotoVisible) playback.complete(element, controller, interpolatedProgress);
              finishTransition(element, controller, transition, gotoVisible);
              if (gotoVisible && !element.hidden) {
                autoDismissSchedule(element, controller);
                controller.classList.add(className.pop);
                aelluxJs.dispatchFrom(element, POP, {
                  bubbles: true
                });
              }
              if (!gotoVisible && controller.state !== POP) {
                aelluxJs.dispatchFrom(element, newDirection, {
                  bubbles: true
                });
              }
              _context2.n = 26;
              break;
            case 22:
              _context2.p = 22;
              _t = _context2.v;
              ownsTransition = transition && controller.transition === transition;
              if (ownsTransition && transition.timeout !== null) {
                clearTimeout(transition.timeout);
                transition.timeout = null;
              }
              if (ownsTransition && transition.className) {
                controller.classList.remove(transition.className);
              }
              _t2 = _t && _t.code;
              _context2.n = _t2 === aelluxJs.diagnostics.WARN_INTERRUPTION.code ? 23 : 25;
              break;
            case 23:
              if (!(transition && transition.cancelled)) {
                _context2.n = 24;
                break;
              }
              return _context2.a(3, 26);
            case 24:
              aelluxJs.diagnostics.warn(aelluxJs.diagnostics.WARN_INTERRUPTION, {
                cause: _t,
                extension: extensionName,
                element: element,
                replacement: transition && transition.replacement === true
              });
              return _context2.a(3, 26);
            case 25:
              aelluxJs.diagnostics.error(aelluxJs.diagnostics.ERROR_EXTENSION_TRANSITION, {
                cause: _t,
                extension: extensionName,
                element: element
              });
              return _context2.a(3, 26);
            case 26:
              _context2.p = 26;
              if (transition && controller.transition === transition) {
                (_controller$gesture = controller.gesture) === null || _controller$gesture === void 0 || _controller$gesture.abort();
                controller.gesture = null;
                (_controller$reverse2 = controller.reverse) === null || _controller$reverse2 === void 0 || _controller$reverse2.cleanup();
                controller.reverse = null;
                (_controller$gestureDi2 = controller.gestureDisplay) === null || _controller$gestureDi2 === void 0 || _controller$gestureDi2.restore();
                controller.gestureDisplay = null;
                restoreHandoff(controller);
                restoreMeasuredStyles(element, controller);
                controller.transition = null;
                controller.classList.remove(className.willChange);
                effects.settled(transition);
              }
              return _context2.f(26);
            case 27:
              return _context2.a(2);
          }
        }, _callee2, null, [[9, 22, 26, 27]]);
      }));
      return _presentTransition.apply(this, arguments);
    }
    function legacyMotionRun(options, transition) {
      options.apply();
      return new Promise(function(resolve) {
        transition.timeout = setTimeout(function() {
          transition.timeout = null;
          resolve({
            id: options.id,
            status: "completed",
            mode: "native"
          });
        }, Math.max(0, Number(options.nativeDuration) || 0));
      });
    }
    function finishTransition(element, controller, transition, gotoVisible) {
      var _controller$reverse, _controller$gestureDi;
      restoreHandoff(controller);
      var focused = !gotoVisible && element.contains(document.activeElement) ? document.activeElement : null;
      controller.classList.remove(className.popping, className.unpopping, className.dismissing);
      establishState(element, controller, gotoVisible ? POP : controller.direction);
      element.hidden = !gotoVisible && controller.legacyHidden;
      (_controller$reverse = controller.reverse) === null || _controller$reverse === void 0 || _controller$reverse.cleanup();
      controller.reverse = null;
      (_controller$gestureDi = controller.gestureDisplay) === null || _controller$gestureDi === void 0 || _controller$gestureDi.restore();
      controller.gestureDisplay = null;
      restoreMeasuredStyles(element, controller);
      setProgress(element, gotoVisible);
      syncAriaExpanded(element, controller);
      refreshExpandedStates();
      gestures.inspect(element);
      if (!gotoVisible) openPresentElements.delete(element);
      else openPresentElements.add(element);
      if (focused && !controller.expanded) {
        if (document.activeElement === focused) focused.blur();
        if (document.activeElement !== focused) aelluxJs.dispatch("".concat(controller.direction, "FocusLost"), {
          detail: {
            element: element,
            focused: focused
          }
        });
      }
      transition.timeout = null;
      transition.completed = true;
    }
    function establishState(element, controller, state) {
      controller.state = state;
      controller.classList.toggle(className.pop, state === POP);
      controller.classList.toggle(className.unpop, state === UNPOP);
      controller.classList.toggle(className.dismissed, state === DISMISS);
    }
    function autoDismissSchedule(element, controller) {
      if (!controller) return;
      cancelAutoDismiss(controller);
      var autoDismissValue = element.getAttribute(attr.autoDismiss);
      if (controller.state !== POP || controller.transition && !controller.classList.contains(className.pop) || !element.isConnected || !autoDismissValue) return;
      var duration = getString2Time(autoDismissValue);
      if (!Number.isFinite(duration) || duration < 0) return;
      var countdown = {
        start: root.performance.now(),
        duration: duration,
        frame: null,
        last: 0
      };
      controller.autoCountdown = countdown;
      var valid = function valid2() {
        return controller.autoCountdown === countdown && presentElements.get(element) === controller && element.isConnected;
      };
      var emit = function emit2(completed) {
        var initial = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : false;
        var elapsedMs = completed ? duration : initial ? 0 : Math.min(duration, Math.max(0, root.performance.now() - countdown.start));
        emitAutoDismissProgress(element, elapsedMs, duration, completed);
      };
      var _tick = function tick() {
        var _aelluxJs$layoutMaxFP;
        if (!valid()) {
          if (controller.autoCountdown === countdown) cancelAutoDismiss(controller);
          return;
        }
        var now = root.performance.now();
        var fps = ((_aelluxJs$layoutMaxFP = aelluxJs.layoutMaxFPS) === null || _aelluxJs$layoutMaxFP === void 0 ? void 0 : _aelluxJs$layoutMaxFP.call(aelluxJs, element)) || aelluxJs.options.cssMotionPropertyMaxFPS || 55;
        if (now - countdown.last >= 1e3 / fps) {
          countdown.last = now;
          emit(false);
        }
        if (valid()) countdown.frame = root.requestAnimationFrame(_tick);
      };
      controller.autoDismissTimeout = setTimeout(function() {
        if (!valid()) {
          if (controller.autoCountdown === countdown) cancelAutoDismiss(controller);
          return;
        }
        if (countdown.frame !== null) root.cancelAnimationFrame(countdown.frame);
        countdown.frame = null;
        controller.autoDismissTimeout = null;
        emit(true);
        if (!valid()) return;
        controller.autoCountdown = null;
        dismiss(element);
      }, duration);
      emit(false, true);
      if (valid()) countdown.frame = root.requestAnimationFrame(_tick);
    }
    function emitAutoDismissProgress(element, elapsedMs, duration) {
      var completed = arguments.length > 3 && arguments[3] !== void 0 ? arguments[3] : false;
      aelluxJs.dispatchFrom(element, "Progress", {
        bubbles: false,
        cancelable: false,
        detail: {
          value: completed ? 1 : duration ? elapsedMs / duration : 0,
          max: 1,
          status: completed ? "completed" : "running",
          elapsedMs: elapsedMs,
          durationMs: duration,
          remainingMs: Math.max(0, duration - elapsedMs)
        }
      });
    }
    function cancelAutoDismiss(controller) {
      if (controller.autoDismissTimeout !== null) clearTimeout(controller.autoDismissTimeout);
      var countdown = controller.autoCountdown;
      if (countdown && countdown.frame !== null) root.cancelAnimationFrame(countdown.frame);
      controller.autoDismissTimeout = null;
      controller.autoCountdown = null;
    }
    function clickAutoDismiss(eventTarget, currentExceptions) {
      var _iterator10 = _createForOfIteratorHelper4(openPresentElements), _step10;
      try {
        var _loop2 = function _loop22() {
          var pContainer = _step10.value;
          if (pContainer.hidden === true || currentExceptions.some(function(e) {
            return pContainer.contains(e);
          })) return 0;
          var mode = (pContainer.getAttribute(attr.dismissOnClick) || "outside").trim().toLowerCase();
          if (mode === "false" || mode === "none") return 0;
          var inside = pContainer.contains(eventTarget);
          if (inside === (mode === "inside" || mode === "in")) dismiss(pContainer);
        }, _ret;
        for (_iterator10.s(); !(_step10 = _iterator10.n()).done; ) {
          _ret = _loop2();
          if (_ret === 0) continue;
        }
      } catch (err) {
        _iterator10.e(err);
      } finally {
        _iterator10.f();
      }
    }
    function refreshChangedTrigger(button) {
      if (!triggerElementsSet.has(button)) return;
      var value = button.getAttribute(attr.target);
      if (value !== indexedTriggerValues.get(button)) refreshTriggerTargets(button);
    }
    function OnClick(event) {
      var target = activationTarget(event);
      if (!target) return;
      var matched;
      var _iterator11 = _createForOfIteratorHelper4(pendingTaps), _step11;
      try {
        for (_iterator11.s(); !(_step11 = _iterator11.n()).done; ) {
          var _pending$event$detail, _pending$event$detail2;
          var pending = _step11.value;
          var pointerId = event.pointerId;
          var compatibilityClick = event.pointerType === "mouse" && ["touch", "pen"].includes((_pending$event$detail = pending.event.detail) === null || _pending$event$detail === void 0 ? void 0 : _pending$event$detail.pointerType);
          if (!compatibilityClick && typeof pointerId === "number" && typeof ((_pending$event$detail2 = pending.event.detail) === null || _pending$event$detail2 === void 0 ? void 0 : _pending$event$detail2.pointerId) === "number" && pointerId !== pending.event.detail.pointerId) continue;
          if (pending.target === target || pending.target.contains(target) || target.contains(pending.target)) matched = pending;
        }
      } catch (err) {
        _iterator11.e(err);
      } finally {
        _iterator11.f();
      }
      if (matched) cancelPendingTap(matched);
      activate(event, target);
    }
    function activationTarget(event) {
      var path = event.composedPath ? event.composedPath() : [];
      var target = path[0] || event.target;
      return target !== null && target !== void 0 && target.closest ? target : null;
    }
    function onTap(event) {
      var target = activationTarget(event);
      if (!target) return;
      var control = target.closest("[".concat(attr.trigger, "]"));
      if (control) refreshChangedTrigger(control);
      var pending = {
        event: event,
        target: target,
        hoverSuppressed: control && suppressHoverClick(control, event),
        present: triggerTargets.get(control),
        input: aelluxJs.comm.request("input.mount-token", {
          element: target
        }).value,
        timer: null
      };
      pendingTaps.add(pending);
      pending.timer = setTimeout(function() {
        pendingTaps.delete(pending);
        if (!target.isConnected || pending.input && aelluxJs.comm.request("input.mount-token", {
          element: target
        }).value !== pending.input) return;
        activate(event, target, pending.hoverSuppressed);
      }, TAP_CLICK_WAIT_TIME);
    }
    function cancelPendingTap(pending) {
      clearTimeout(pending.timer);
      pendingTaps.delete(pending);
    }
    function cancelElementTaps(element) {
      var _iterator12 = _createForOfIteratorHelper4(pendingTaps), _step12;
      try {
        for (_iterator12.s(); !(_step12 = _iterator12.n()).done; ) {
          var pending = _step12.value;
          if (element.contains(pending.target) || pending.present === element) cancelPendingTap(pending);
        }
      } catch (err) {
        _iterator12.e(err);
      } finally {
        _iterator12.f();
      }
    }
    function activate(event, eventTarget, hoverSuppressed) {
      var container = eventTarget.closest(presentSelector);
      var exceptions = [];
      var button;
      button = eventTarget.closest("[".concat(attr.trigger, "]"));
      if (button) {
        refreshChangedTrigger(button);
        var triggerAttr = button.getAttribute(attr.trigger);
        var targetSelector = button.getAttribute(attr.target);
        if (targetSelector) {
          var target = targetById(targetSelector);
          diagnoseTarget(button, target, attr.target, targetSelector);
          if (target) {
            exceptions.push(target);
            if (!(hoverSuppressed !== null && hoverSuppressed !== void 0 ? hoverSuppressed : suppressHoverClick(button, event))) trigger(target, triggerAttr, button.getAttribute(attr.effect));
          }
        } else if (container) {
          exceptions.push(container);
          if (!(hoverSuppressed !== null && hoverSuppressed !== void 0 ? hoverSuppressed : suppressHoverClick(button, event))) trigger(container, triggerAttr, button.getAttribute(attr.effect));
        } else {
          aelluxJs.diagnostics.error(aelluxJs.diagnostics.ERROR_PRESENT_CONTROL_TARGET_MISSING, {
            extension: extensionName,
            element: button,
            action: triggerAttr === "dismiss" ? "dismiss" : "trigger"
          });
        }
      }
      clickAutoDismiss(eventTarget, exceptions);
    }
    function diagnoseTarget(element, target, attribute, value) {
      if (!targetIdFor(value)) return;
      if (target && target.hasAttribute(attr.present)) return;
      aelluxJs.diagnostics.warn(aelluxJs.diagnostics.WARN_CONFIGURATION_TARGET, {
        extension: extensionName,
        element: element,
        attribute: attribute,
        value: value,
        reason: target ? "Target is not a Present container." : "Target element was not found.",
        suggestion: "Use one existing Present element ID, optionally prefixed with #, and mount it before interacting."
      });
    }
    function syncAriaExpanded(element, controller) {
      var visible = element.isConnected;
      var visibility = root.getComputedStyle(element).visibility;
      if (visibility === "hidden" || visibility === "collapse") visible = false;
      for (var current = element; visible && current; current = current.parentElement) {
        var style = root.getComputedStyle(current);
        if (style.display === "none" || style.contentVisibility === "hidden" || Number(style.opacity) === 0) visible = false;
      }
      if (controller.expanded !== visible) controller.setAriaExpanded(String(visible));
    }
    function refreshExpandedStates() {
      var _iterator13 = _createForOfIteratorHelper4(presentElements), _step13;
      try {
        for (_iterator13.s(); !(_step13 = _iterator13.n()).done; ) {
          var _step13$value = _slicedToArray2(_step13.value, 2), element = _step13$value[0], controller = _step13$value[1];
          if (!controller.transition) syncAriaExpanded(element, controller);
        }
      } catch (err) {
        _iterator13.e(err);
      } finally {
        _iterator13.f();
      }
    }
    function setProgress(element, visible) {
      setPhase(element, "pop", visible ? "1" : "0");
      setPhase(element, "dismiss", visible ? "0" : "1");
      element.style.setProperty("--ae-pop-progress", visible ? "1" : "0");
      element.style.setProperty("--ae-dismiss-progress", visible ? "0" : "1");
      element.style.setProperty("--ae-unpop-progress", visible ? "0" : "1");
    }
    function setPhase(element, direction, value) {
      element.style.setProperty("--ae-present-".concat(direction, "-phase"), value);
      if (!interpolatedProgress) element.style.setProperty("--ae-".concat(direction, "-progress"), value);
    }
    function groupMembers(group) {
      var includeUnidentified = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : false;
      return _toConsumableArray3(presentElements.keys()).filter(function(element) {
        return element.isConnected && element !== group && (includeUnidentified || element.id) && element.closest(groupSelector) === group;
      });
    }
    function groupLimit(group, state) {
      var value = group.getAttribute(attr.group);
      if (state.limitValue === value) return state.limit;
      state.limitValue = value;
      var text = (value || "").trim();
      var limit = text === "" ? 1 : Number(text);
      var valid = text === "" || /^\d+$/.test(text) && Number.isSafeInteger(limit) && limit > 0;
      state.limit = valid ? limit : 1;
      if (!valid) aelluxJs.diagnostics.warn(aelluxJs.diagnostics.WARN_CONFIGURATION_VALUE, {
        extension: extensionName,
        element: group,
        attribute: attr.group,
        value: value,
        reason: "Present Group capacity must be a positive integer.",
        suggestion: "Use a positive integer, or leave the attribute empty for a capacity of 1."
      });
      return state.limit;
    }
    function groupMemberActive(member, state) {
      return state.reservations.has(member) || isPresented(member);
    }
    function isPresented(element) {
      var controller = presentElements.get(element);
      return controller && (controller.transition ? controller.direction === POP : controller.state === POP);
    }
    function activeGroupMembers(group, state) {
      return groupMembers(group, true).filter(function(member) {
        return groupMemberActive(member, state);
      });
    }
    function mountGroup(group) {
      if (groups.has(group)) return;
      var visible = groupMembers(group).filter(function(member) {
        var _presentElements$get8;
        return ((_presentElements$get8 = presentElements.get(member)) === null || _presentElements$get8 === void 0 ? void 0 : _presentElements$get8.state) === POP;
      });
      groups.set(group, {
        selected: visible.length === 1 ? visible[0] : null,
        accumulating: false,
        reservations: /* @__PURE__ */ new Map(),
        revision: 0,
        pending: Promise.resolve(true),
        jobs: /* @__PURE__ */ new Map(),
        memory: aelluxJs.persist.element.save(group, [attr.active])
      });
      groupLimit(group, groups.get(group));
      if (!groupObserver && typeof root.MutationObserver === "function") {
        groupObserver = new root.MutationObserver(function(records) {
          if (records.some(function(record) {
            return record.type === "childList" || record.attributeName !== "class" || groups.has(record.target);
          })) queueGroups();
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
      var state = groups.get(group);
      if (!state) return;
      state.revision++;
      groups.delete(group);
      state.jobs.clear();
      state.reservations.clear();
      publishGroup(group, state, null);
      var _iterator14 = _createForOfIteratorHelper4(groupMembers(group)), _step14;
      try {
        for (_iterator14.s(); !(_step14 = _iterator14.n()).done; ) {
          var member = _step14.value;
          var controller = presentElements.get(member);
          if (controller.transition) {
            var visible = controller.direction === POP;
            controller.stop();
            member.hidden = !visible && controller.legacyHidden;
            establishState(member, controller, visible ? POP : controller.direction);
            controller.setTriggerExpanded(visible);
            setProgress(member, visible);
            syncAriaExpanded(member, controller);
            if (!visible) openPresentElements.delete(member);
          }
        }
      } catch (err) {
        _iterator14.e(err);
      } finally {
        _iterator14.f();
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
      Promise.resolve().then(function() {
        groupsQueued = false;
        groups.forEach(function(state, group) {
          reconcileGroup(group);
          if (groups.get(group) === state) publishGroup(group, state, state.selected);
        });
      });
    }
    function groupDiagnostic(group, reason) {
      aelluxJs.diagnostics.warn(aelluxJs.diagnostics.WARN_PRESENT_GROUP_SELECTION, {
        extension: extensionName,
        element: group,
        attribute: attr.active,
        value: group.getAttribute(attr.active),
        reason: reason,
        suggestion: "Use unique native IDs on Present members of this group; select one ID or one matching condition."
      });
    }
    function reconcileGroup(group) {
      var exclusive = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : false;
      if (!group.isConnected || !group.hasAttribute(attr.group)) return;
      var members = groupMembers(group);
      var state = groups.get(group);
      groupLimit(group, state);
      if (state.accumulating) {
        if (!exclusive && state.accumulationInputs === selectionInputs(group)) return;
      }
      if (!members.includes(state.selected)) state.selected = null;
      var matches;
      if (group.hasAttribute(attr.active)) {
        var id = group.getAttribute(attr.active);
        matches = id === "" ? [] : members.filter(function(member) {
          return member.id === id;
        });
        if (id && matches.length !== 1) {
          groupDiagnostic(group, "Active ID must match one mounted Present descendant in this group.");
          return;
        }
      } else {
        matches = members.filter(function(member) {
          var token = member.getAttribute(attr.when);
          return token && !/\s/.test(token) && group.classList.contains(token);
        });
        if (!matches.length) {
          var visible = members.filter(isPresented);
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
      var state = groups.get(group);
      if (!state || typeof id !== "string") return Promise.resolve(false);
      var matches = groupMembers(group).filter(function(member) {
        return member.id === id;
      });
      if (id && matches.length !== 1) {
        groupDiagnostic(group, "Active ID must match one mounted Present descendant in this group.");
        return Promise.resolve(false);
      }
      if (group.getAttribute(attr.active) !== id) group.setAttribute(attr.active, id);
      var result = reconcileGroup(group, true);
      return Promise.resolve(result === void 0 ? state.pending : result);
    }
    function selectionInputs(group) {
      return JSON.stringify([group.getAttribute(attr.active), groupMembers(group).filter(function(member) {
        var token = member.getAttribute(attr.when);
        return token && !/\s/.test(token) && group.classList.contains(token);
      }).map(function(member) {
        return member.id;
      }).sort()]);
    }
    function popNext(group, prepare) {
      var state = groups.get(group);
      if (!state || !group.isConnected || !group.hasAttribute(attr.group)) return Promise.resolve(null);
      var members = Array.from(group.children).filter(function(member2) {
        return member2 !== group && member2.hasAttribute(attr.present) && presentElements.has(member2) && member2.closest(groupSelector) === group;
      });
      var limit = groupLimit(group, state);
      var active = activeGroupMembers(group, state);
      var inactive = members.filter(function(member2) {
        return !groupMemberActive(member2, state);
      });
      var closed = inactive.filter(function(member2) {
        var _presentElements$get9;
        return ((_presentElements$get9 = presentElements.get(member2)) === null || _presentElements$get9 === void 0 ? void 0 : _presentElements$get9.state) !== POP;
      });
      var available = closed.length ? closed : inactive;
      var candidates = active.length < limit && available.length ? available : members.filter(function(member2) {
        return active.includes(member2);
      }).sort(function(left, right) {
        var order = function order2(member2) {
          var _state$reservations$g;
          return ((_state$reservations$g = state.reservations.get(member2)) === null || _state$reservations$g === void 0 ? void 0 : _state$reservations$g.order) || presentElements.get(member2).presentationOrder;
        };
        return order(right) - order(left);
      });
      var member = candidates[candidates.length - 1];
      if (!member) return Promise.resolve(null);
      var entering = !state.accumulating;
      if (entering) {
        state.revision++;
        state.jobs.clear();
        state.accumulating = true;
        state.accumulationInputs = selectionInputs(group);
        state.selected = null;
      }
      var controller = presentElements.get(member);
      var revision = state.revision;
      var capacity = group.getAttribute(attr.group);
      var inputs = selectionInputs(group);
      var previousReservation = state.reservations.get(member);
      var reservation = {
        revision: controller.operationRevision,
        order: ++presentationSequence
      };
      state.reservations.set(member, reservation);
      group.insertBefore(member, members[0]);
      var valid = function valid2() {
        var preflight = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : false;
        return groups.get(group) === state && state.revision === revision && state.accumulating && state.reservations.get(member) === reservation && presentElements.get(member) === controller && controller.operationRevision === reservation.revision && (!preflight || group.getAttribute(attr.group) === capacity && selectionInputs(group) === inputs) && member.isConnected && member.parentElement === group && member.closest(groupSelector) === group;
      };
      var release = function release2() {
        var restore = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : false;
        if (state.reservations.get(member) !== reservation) return;
        if (restore && previousReservation && groups.get(group) === state && state.revision === revision && state.accumulating && presentElements.get(member) === controller && previousReservation.revision === controller.operationRevision && member.isConnected && member.closest(groupSelector) === group) {
          state.reservations.set(member, previousReservation);
        } else state.reservations.delete(member);
      };
      var job;
      try {
        if (entering) publishGroup(group, state, null);
        if (!valid(true)) {
          release(true);
          return Promise.resolve(null);
        }
        if (typeof prepare === "function") prepare(member);
        if (!valid(true) || !aelluxJs.dispatchFrom(member, "BeforePop", {
          bubbles: true,
          cancelable: true
        }) || !valid(true)) {
          release(true);
          return Promise.resolve(null);
        }
        reservation.revision++;
        job = presentTransition(member, true, true, true, reservation.order);
      } catch (error) {
        release(true);
        return Promise.reject(error);
      }
      return job.then(function() {
        return valid() && !member.hidden && presentElements.get(member).direction === POP ? member : null;
      }).finally(function() {
        return release();
      });
    }
    function selected(group) {
      var state = groups.get(group);
      var member = state && state.selected;
      return member && member !== group && presentElements.has(member) && member.isConnected && member.id && member.closest(groupSelector) === group ? member : null;
    }
    function publishGroup(group, state, current) {
      if (state.announced === current) return;
      var previous = state.announced || null;
      state.announced = current;
      aelluxJs.dispatchFrom(group, "PresentGroupChange", {
        bubbles: true,
        detail: {
          group: group,
          previous: previous,
          current: current,
          key: current && current.id
        }
      });
    }
    function selectGroup(group, selected2, members) {
      var closingDirection = arguments.length > 3 && arguments[3] !== void 0 ? arguments[3] : DISMISS;
      var state = groups.get(group);
      var changes = members.filter(function(member2) {
        return member2 === selected2 ? !isPresented(member2) : isPresented(member2);
      });
      if (state.selected === selected2 && !changes.length) {
        state.accumulating = false;
        state.reservations.clear();
        return state.pending;
      }
      var revision = ++state.revision;
      var active = group.getAttribute(attr.active);
      var classes = group.getAttribute("class");
      var ids = members.map(function(member2) {
        return member2.id;
      });
      var conditions = members.map(function(member2) {
        return member2.getAttribute(attr.when);
      });
      var valid = function valid2() {
        return groups.get(group) === state && state.revision === revision && group.isConnected && group.hasAttribute(attr.group) && group.getAttribute(attr.active) === active && group.getAttribute("class") === classes && groupMembers(group).length === members.length && members.every(function(member2, index) {
          return presentElements.has(member2) && member2.isConnected && member2.closest(groupSelector) === group && member2.id === ids[index] && member2.getAttribute(attr.when) === conditions[index];
        });
      };
      var _iterator15 = _createForOfIteratorHelper4(changes), _step15;
      try {
        for (_iterator15.s(); !(_step15 = _iterator15.n()).done; ) {
          var member = _step15.value;
          var allowed = aelluxJs.dispatchFrom(member, member === selected2 ? "BeforePop" : "".concat(BEFORE).concat(closingDirection), {
            bubbles: true,
            cancelable: true
          });
          if (!valid()) {
            queueGroups();
            return false;
          }
          if (!allowed) {
            if (state.accumulating) {
              state.accumulationInputs = selectionInputs(group);
              return false;
            }
            if (state.revision === revision) {
              var _state$selected;
              var id = ((_state$selected = state.selected) === null || _state$selected === void 0 ? void 0 : _state$selected.id) || "";
              if (group.getAttribute(attr.active) !== id) group.setAttribute(attr.active, id);
            }
            return false;
          }
        }
      } catch (err) {
        _iterator15.e(err);
      } finally {
        _iterator15.f();
      }
      state.accumulating = false;
      state.reservations.clear();
      state.selected = selected2;
      var complete;
      var pending = new Promise(function(resolve) {
        complete = resolve;
      });
      state.pending = pending;
      var _iterator16 = _createForOfIteratorHelper4(changes), _step16;
      try {
        var _loop3 = function _loop32() {
          var member2 = _step16.value;
          var job = presentTransition(member2, member2 === selected2, false, true, void 0, closingDirection);
          if (groups.get(group) !== state || state.revision !== revision) {
            complete(false);
            return {
              v: pending
            };
          }
          state.jobs.set(member2, job);
          job.then(function() {
            if (state.jobs.get(member2) === job) state.jobs.delete(member2);
          });
        }, _ret2;
        for (_iterator16.s(); !(_step16 = _iterator16.n()).done; ) {
          _ret2 = _loop3();
          if (_ret2) return _ret2.v;
        }
      } catch (err) {
        _iterator16.e(err);
      } finally {
        _iterator16.f();
      }
      publishGroup(group, state, selected2);
      Promise.all(members.map(function(member2) {
        return state.jobs.get(member2);
      })).then(function() {
        var current = groupMembers(group);
        complete(groups.get(group) === state && state.revision === revision && (!selected2 || current.includes(selected2)) && current.every(function(member2) {
          var _presentElements$get0, _presentElements$get1;
          return member2 === selected2 ? ((_presentElements$get0 = presentElements.get(member2)) === null || _presentElements$get0 === void 0 ? void 0 : _presentElements$get0.state) === POP : ((_presentElements$get1 = presentElements.get(member2)) === null || _presentElements$get1 === void 0 ? void 0 : _presentElements$get1.state) !== POP;
        }));
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
      var _iterator17 = _createForOfIteratorHelper4(triggerElementsSet), _step17;
      try {
        for (_iterator17.s(); !(_step17 = _iterator17.n()).done; ) {
          var button = _step17.value;
          if (button.getAttribute(attr.triggerOn) === "hover" && triggerTargets.get(button) === target && button.contains(node)) return true;
        }
      } catch (err) {
        _iterator17.e(err);
      } finally {
        _iterator17.f();
      }
      return false;
    }
    function suppressHoverClick(button, event) {
      var _event$detail;
      var pointerType = event.pointerType || ((_event$detail = event.detail) === null || _event$detail === void 0 ? void 0 : _event$detail.pointerType);
      var pointerActivation = typeof event.detail === "number" ? event.detail > 0 : !!pointerType;
      return button.getAttribute(attr.triggerOn) === "hover" && pointerActivation && pointerType !== "touch" && hoveredTriggers.has(button);
    }
    function onHover(event) {
      var _event$target;
      if (event.pointerType === "touch" || !((_event$target = event.target) !== null && _event$target !== void 0 && _event$target.closest)) return;
      var entering = event.type === "pointerover";
      var button = event.target.closest("[".concat(attr.trigger, "][").concat(attr.triggerOn, '="hover"]'));
      if (button && triggerElementsSet.has(button) && !button.contains(event.relatedTarget)) {
        refreshChangedTrigger(button);
        var target = triggerTargets.get(button);
        if (target && presentElements.has(target)) {
          if (entering) {
            cancelHoverClose(target);
            hoveredTriggers.add(button);
            var action = button.getAttribute(attr.trigger);
            if (action === "pop") toggle(target, true);
            else trigger(target, action, button.getAttribute(attr.effect));
          } else hoveredTriggers.delete(button);
        }
      }
      var _iterator18 = _createForOfIteratorHelper4(openPresentElements), _step18;
      try {
        var _loop4 = function _loop42() {
          var target2 = _step18.value;
          if (!inHoverRegion(target2, event.target)) return 1;
          if (entering || inHoverRegion(target2, event.relatedTarget)) cancelHoverClose(target2);
          else if (_toConsumableArray3(triggerElementsSet).some(function(control) {
            return triggerTargets.get(control) === target2 && control.getAttribute(attr.triggerOn) === "hover" && !["dismiss", "unpop", "effect"].includes(control.getAttribute(attr.trigger));
          })) {
            cancelHoverClose(target2);
            hoverTimers.set(target2, setTimeout(function() {
              hoverTimers.delete(target2);
              if (presentElements.has(target2) && target2.isConnected && !inHoverRegion(target2, document.activeElement)) dismiss(target2);
            }, 120));
          }
        };
        for (_iterator18.s(); !(_step18 = _iterator18.n()).done; ) {
          if (_loop4()) continue;
        }
      } catch (err) {
        _iterator18.e(err);
      } finally {
        _iterator18.f();
      }
    }
    function getString2Time(string) {
      return string ? parseFloat(string) * getMillisecondsMulti(string) : 0;
    }
    function getMillisecondsMulti(value) {
      return !value.endsWith(MILLISECOND) && value.endsWith(SECOND) ? 1e3 : 1;
    }
  })(typeof globalThis !== "undefined" ? globalThis : window);
})();
//# sourceMappingURL=aellux.ext.present.legacy.js.map
