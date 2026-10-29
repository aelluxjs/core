/*! aellux.js | SPDX-License-Identifier: Apache-2.0 | See LICENSE for terms. */

/**
 * PWA Extension
 * Purpose: optional page-side installation and Service Worker management.
 * Activation: explicit wait("pwa") or mounted data-ae-pwa="install" controls.
 * Ownership: native prompt references, mounted click handlers, registration
 * observers and an on-demand native dialog. Never unregisters persistent workers.
 * Accessibility: native click/keyboard activation; named dialog with native focus
 * management. No Point dependency, global styles or simulated installation APIs.
 * Limitations: early beforeinstallprompt events cannot be recovered by lazy code;
 * manual Safari instructions are heuristics, not evidence of installation.
 */
import { validatePWAManifest } from "./internal/development-helpers.js";

(function (root) {
  "use strict";
  const api = root.AelluxJs;
  if (!api) throw new Error('[aellux.js] Load the boot script before the "pwa" extension.');
  const extensionName = "pwa", attribute = api.attr(extensionName);
  let active = false, revision = 0, settings = {}, promptEvent = null;
  let installed = null, media = null, registration = null, registrationKey = null;
  let pendingRegistration = null, registrationRevision = 0, workerState = "unregistered";
  let promptTask = null, guideTask = null, guide = null, guideReturnFocus = null, guideId = 0;
  const mounted = new Set(), observers = new Set();
  const texts = {
    en: { title: "Add to Home Screen", intro: "To install this app:", close: "Close", steps: [
      "Open the browser's Share menu.", "Select Add to Home Screen.", "Confirm the installation."
    ] },
    "pt-BR": { title: "Adicionar à Tela de Início", intro: "Para instalar este aplicativo:", close: "Fechar", steps: [
      "Abra o menu Compartilhar do navegador.", "Selecione Adicionar à Tela de Início.", "Confirme a instalação."
    ] }
  };
  api.extAttach(extensionName, { init, destroy, register, install, checkUpdate, applyUpdate, status });

  function init(options = {}) {
    if (active) return;
    active = true;
    revision++;
    settings = options;
    media = typeof root.matchMedia === "function" ? root.matchMedia("(display-mode: standalone)") : null;
    api.onEvent(root, "$beforeinstallprompt", onPrompt);
    api.onEvent(root, "$appinstalled", onInstalled);
    if (media?.addEventListener) media.addEventListener("change", onDisplayChange);
    else if (media?.addListener) media.addListener(onDisplayChange);
    api.mountManager.add({ extensionName, selector: `[${attribute}]`, mount, unmount,
      controllers: ["install", "register", "checkUpdate", "applyUpdate", "status"] });
    validatePWAManifest(root, manifestLink);
  }

  function destroy() {
    if (!active) return;
    active = false;
    revision++;
    registrationRevision++;
    for (const element of mounted) unmount(element);
    api.mountManager.remove({ extensionName });
    api.offEvent(root, "$beforeinstallprompt", onPrompt);
    api.offEvent(root, "$appinstalled", onInstalled);
    if (media?.removeEventListener) media.removeEventListener("change", onDisplayChange);
    else if (media?.removeListener) media.removeListener(onDisplayChange);
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
    const element = event.currentTarget;
    if (element.getAttribute(attribute) !== "install" || element.matches(":disabled,[aria-disabled=true]")) return;
    // Only the closest mounted declaration owns an activation.
    const target = event.target.nodeType === 1 ? event.target : event.target.parentElement;
    if (target?.closest(`[${attribute}]`) !== element) return;
    event.preventDefault();
    install(element).catch(() => {}); // Errors also reach the semantic event.
  }
  function emit(name, detail = {}, element = null) {
    if (active) api.dispatchFrom(element || root.document, api.eventName(name), {
      detail: { ...detail, status: status() }
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
    if (media?.matches) onInstalled();
  }
  function environment() {
    const nav = root.navigator || {}, ua = nav.userAgent || "";
    const ios = /iPad|iPhone|iPod/.test(ua) || /Macintosh/.test(ua) && nav.maxTouchPoints > 1;
    const browser = /Edg\//.test(ua) ? "edge" : /CriOS|Chrome\//.test(ua) ? "chrome" :
      /FxiOS|Firefox\//.test(ua) ? "firefox" : /Version\/.*Safari\//.test(ua) ? "safari" : "unknown";
    return { platform: ios ? "ios" : /Android/.test(ua) ? "android" : "unknown", browser,
      manual: ios && browser === "safari" && !/CriOS|FxiOS|EdgiOS|OPiOS|DuckDuckGo/.test(ua) };
  }
  function status() {
    const env = environment();
    const runningInstalled = installed === true || media?.matches === true || root.navigator?.standalone === true;
    const unavailable = root.isSecureContext === false || !/^https?:$/.test(root.location.protocol);
    return { installed: runningInstalled ? true : null,
      installMethod: runningInstalled || unavailable ? "unavailable" : promptEvent ? "native" : env.manual ? "manual" : "unknown",
      canPrompt: !runningInstalled && !unavailable && !!promptEvent,
      platform: env.platform, browser: env.browser,
      serviceWorker: !root.navigator?.serviceWorker || root.isSecureContext === false ? "unavailable" : workerState };
  }
  function argumentsFor(first, second) {
    return first?.nodeType === 1 ? { element: first, options: second || {} } : { element: null, options: first || {} };
  }
  function manifestLink() {
    return Array.from(root.document.querySelectorAll("link[rel]")).find(link =>
      /(?:^|\s)manifest(?:\s|$)/i.test(link.getAttribute("rel") || ""));
  }
  function install(first, second) {
    const { element, options } = argumentsFor(first, second);
    if (!active) return Promise.reject(new Error("PWA is not initialized."));
    if (promptTask) return promptTask;
    validatePWAManifest(root, manifestLink);
    const current = status(), token = revision;
    if (current.installMethod === "unavailable") return Promise.resolve({ outcome: "unavailable", status: current });
    if (current.canPrompt) {
      const event = promptEvent;
      promptEvent = null; // Consume before any reentrant application event.
      let result;
      try {
        // Must remain synchronous in the native click / controller call stack.
        result = event.prompt();
      } catch (error) {
        emit("PwaError", { operation: "install", error }, element);
        return Promise.reject(error);
      }
      const task = Promise.resolve(result).then(choice => event.userChoice || choice).then(choice => {
        const outcome = choice?.outcome === "accepted" ? "accepted" : "dismissed";
        if (active && token === revision) emit(outcome === "accepted" ? "PwaInstallAccepted" : "PwaInstallDismissed", { outcome }, element);
        return { outcome, status: status() };
      }).catch(error => {
        if (token === revision) emit("PwaError", { operation: "install", error }, element);
        throw error;
      }).finally(() => { if (promptTask === task) promptTask = null; });
      promptTask = task;
      emit("PwaInstallRequested", {}, element);
      return task;
    }
    if (guideTask) return guideTask;
    const fallback = options.fallback ?? settings.fallback ?? "default";
    const link = manifestLink();
    const context = { status: current, element, manifest: options.manifest || settings.manifest || null,
      manifestURL: link?.getAttribute("href")?.trim() ? link.href : null };
    // Publish the shared task before semantic events, which can reenter install
    // or destroy this Extension. Manual rendering needs no transient activation.
    const task = Promise.resolve().then(() => {
      if (!active || token !== revision) return { outcome: "unavailable", status: status() };
      // Custom renderers may explain unknown environments; the default never guesses.
      if (typeof fallback === "function") return Promise.resolve(fallback(context))
        .then(value => ({ outcome: "custom", value, status: status() }));
      if (fallback === "default" && current.installMethod === "manual") return showGuide({ ...settings, ...options }, context, token)
        .then(() => ({ outcome: "manual", status: status() }));
      return { outcome: current.installMethod, status: current };
    })
      .catch(error => {
        if (token === revision) {
          if (fallback === "default") removeGuide();
          emit("PwaError", { operation: "install", error }, element);
        }
        throw error;
      })
      .finally(() => { if (guideTask === task) guideTask = null; });
    guideTask = task;
    emit("PwaInstallRequested", {}, element);
    if (current.installMethod === "manual") emit("PwaInstallManual", context, element);
    return task;
  }

  async function showGuide(options, context, token) {
    if (guide?.open) return;
    // Reuse Dialog's native / Legacy contract only when the guide is requested.
    const dialogAPI = await api.wait("dialog");
    if (!active || token !== revision) return;
    if (!dialogAPI) throw new Error("Dialog could not be loaded for the installation guide.");
    removeGuide();
    const language = options.language || root.document.documentElement.lang || root.navigator?.language || "en";
    const copy = { ...texts[/^pt(-BR)?$/i.test(language) ? "pt-BR" : "en"], ...options.texts };
    const dialog = root.document.createElement("dialog");
    dialog.lang = language;
    dialog.setAttribute(api.attr("pwa-guide"), "");
    guide = dialog;
    guideReturnFocus = context.element || root.document.activeElement;
    const content = typeof options.template === "function" ? options.template({ ...context, texts: copy }) : null;
    if (content) dialog.appendChild(content); // Template returns a developer-owned DOM node.
    else {
      const title = root.document.createElement("h2"), intro = root.document.createElement("p"), list = root.document.createElement("ol");
      title.id = `${api.attr("pwa-guide")}-${++guideId}`;
      title.textContent = copy.title;
      dialog.setAttribute("aria-labelledby", title.id);
      intro.textContent = copy.intro;
      for (const step of copy.steps) {
        const item = root.document.createElement("li");
        item.textContent = step;
        list.appendChild(item);
      }
      for (const child of [title, intro, list]) dialog.appendChild(child);
    }
    if (!dialog.hasAttribute("aria-labelledby")) dialog.setAttribute("aria-label", copy.title);
    const close = root.document.createElement("button");
    close.type = "button";
    close.textContent = copy.close;
    close.autofocus = true;
    close.addEventListener("click", () => dialog.close());
    dialog.appendChild(close);
    dialog.addEventListener("close", () => { if (guide === dialog) removeGuide(); }, { once: true });
    root.document.body.appendChild(dialog);
    const mounted = await api.mount(dialog, "dialog");
    if (!active || token !== revision || guide !== dialog || !dialog.isConnected) return;
    if (mounted === false) { removeGuide(); return; }
    try { dialogAPI.showModal(dialog); }
    catch (error) { removeGuide(); throw error; }
  }
  function removeGuide() {
    const dialog = guide;
    const returnFocus = guideReturnFocus;
    guide = null;
    guideReturnFocus = null;
    if (!dialog) return;
    if (dialog.open) dialog.close();
    // Safari pointer activation may not focus its button. Return to the explicit
    // initiator only when native closing leaves focus on the body / removed UI.
    const focused = root.document.activeElement;
    if ((focused === root.document.body || dialog.contains(focused)) && returnFocus?.isConnected &&
      typeof returnFocus.focus === "function" && !returnFocus.matches(":disabled,[inert]")) returnFocus.focus();
    if (dialog.parentNode) dialog.parentNode.removeChild(dialog); // Existing detached-node lifecycle releases the controller.
  }

  function observe(target, name, handler) {
    api.onEvent(target, `$${name}`, handler);
    const remove = () => { api.offEvent(target, `$${name}`, handler); observers.delete(remove); };
    observers.add(remove);
    return remove;
  }
  function clearObservers() { for (const remove of observers) remove(); }
  function watchRegistration(value) {
    clearObservers();
    let announced = null;
    const waiting = () => {
      if (value.waiting && value.waiting !== announced && value.active) {
        announced = value.waiting;
        workerState = "waiting";
        emit("PwaUpdateAvailable", { registration: value, worker: value.waiting });
      }
    };
    const seen = new Set();
    const update = () => {
      const worker = value.installing;
      if (worker && !seen.has(worker)) {
        seen.add(worker);
        const stop = observe(worker, "statechange", () => {
          waiting();
          if (worker.state === "activated" || worker.state === "redundant") {
            seen.delete(worker);
            stop();
          }
          if (worker.state === "redundant") {
            workerState = "error";
            emit("PwaError", { operation: "update", error: new Error("Service Worker became redundant before activation."), registration: value });
          }
        });
      }
      waiting();
    };
    observe(value, "updatefound", update);
    let previousController = root.navigator.serviceWorker.controller;
    observe(root.navigator.serviceWorker, "controllerchange", () => {
      const controller = root.navigator.serviceWorker.controller;
      if (!controller || controller === previousController || controller.scriptURL !== value.active?.scriptURL) return;
      previousController = controller;
      workerState = "registered";
      emit("PwaUpdateComplete", { registration: value });
    });
    update();
  }
  function register(first, second) {
    const { options, element } = argumentsFor(first, second);
    let script, nativeOptions;
    try {
      if (!active) throw new Error("PWA is not initialized.");
      if (!root.navigator?.serviceWorker || root.isSecureContext === false) throw new Error("Service Workers require a supported secure context.");
      if (typeof options.script !== "string" || !options.script.trim()) throw new TypeError("register requires a script URL.");
      script = new URL(options.script, root.document.baseURI);
      if (!/^https?:$/.test(script.protocol) || script.origin !== root.location.origin || script.username || script.password || script.hash) throw new TypeError("Service Worker script must use the page origin and have no credentials or fragment.");
      nativeOptions = {};
      if (options.scope !== undefined) {
        if (typeof options.scope !== "string" || !options.scope.trim()) throw new TypeError("Invalid Service Worker scope.");
        const scope = new URL(options.scope, root.document.baseURI);
        if (scope.origin !== script.origin || scope.username || scope.password || scope.hash || scope.search) throw new TypeError("Service Worker scope must use the page origin without query or fragment.");
        nativeOptions.scope = scope.href;
      }
      if (options.type !== undefined) {
        if (!["classic", "module"].includes(options.type)) throw new TypeError("Invalid Service Worker type.");
        nativeOptions.type = options.type;
      }
      if (options.updateViaCache !== undefined) {
        if (!["all", "imports", "none"].includes(options.updateViaCache)) throw new TypeError("Invalid updateViaCache.");
        nativeOptions.updateViaCache = options.updateViaCache;
      }
    } catch (error) {
      emit("PwaError", { operation: "register", error }, element);
      return Promise.reject(error);
    }
    const key = script.href + JSON.stringify(nativeOptions);
    if (registrationKey === key && (pendingRegistration || registration)) return pendingRegistration || Promise.resolve(registration);
    const token = revision, request = ++registrationRevision;
    registrationKey = key;
    workerState = "registering";
    const task = Promise.resolve().then(() => {
      if (!active || token !== revision) throw new Error("PWA registration was canceled by destroy.");
      return root.navigator.serviceWorker.register(script.href, nativeOptions);
    }).then(value => {
      if (!active || token !== revision || request !== registrationRevision) return value;
      registration = value;
      workerState = "registered";
      emit("PwaWorkerRegistered", { registration: value }, element);
      if (active && token === revision && request === registrationRevision) watchRegistration(value);
      return value;
    }).catch(error => {
      if (active && token === revision && request === registrationRevision) {
        workerState = "error";
        registrationKey = null;
        emit("PwaError", { operation: "register", error }, element);
      }
      throw error;
    }).finally(() => { if (pendingRegistration === task) pendingRegistration = null; });
    pendingRegistration = task;
    return task;
  }
  async function checkUpdate() {
    const token = revision;
    try {
      const value = pendingRegistration ? await pendingRegistration : registration;
      if (!value || !active || token !== revision) return null;
      await value.update();
      return value;
    } catch (error) {
      if (active && token === revision) { workerState = "error"; emit("PwaError", { operation: "update", error }); }
      throw error;
    }
  }
  function applyUpdate() {
    if (!active || !registration?.waiting) return false;
    registration.waiting.postMessage({ type: "AELLUX_PWA_SKIP_WAITING" });
    return true; // Explicit application authorization; never reload the page.
  }
})(typeof globalThis !== "undefined" ? globalThis : window);
