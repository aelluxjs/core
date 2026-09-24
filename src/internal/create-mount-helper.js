/*! Aellux | SPDX-License-Identifier: Apache-2.0 | See LICENSE for terms. */

export function createMountHelper(root, extensionPromises) {
  const mountedElements = new WeakMap(); //DOM, string Set

  async function AelluxForceUnmount(rootOrSelector, extensionLabels = null) {
    for (const rootElement of resolveRoots(rootOrSelector)) {
      await AelluxForce(rootElement, "unmount", extensionLabels);
    }
    return true;
  }

  async function AelluxForceUpdate(rootOrSelector, extensionLabels = null) {
    const Aellux = root.Aellux;
    for (const rootElement of resolveRoots(rootOrSelector)) {
      const allWaiters = findElements(rootElement, Aellux.attr("wait-mounted"));
      allWaiters.forEach(waiter => waiter.setAttribute("aria-busy", "true"));

      const allLinks = findElements(rootElement, "link[rel='aellux-ext']");
      for (const link of allLinks) {
        const href = link.getAttribute("href");
        const loadWhen = link.getAttribute(Aellux.attr("load-when")) || undefined;
        const loadStyleValue = link.getAttribute(Aellux.attr("load-style"));
        const loadStyle = loadStyleValue === null || loadStyleValue === "false"
          ? false
          : loadStyleValue || true;
        link.setAttribute("rel", "aellux-ext-registered");
        Aellux.ext(href, { loadWhen, loadStyle });
      }

      const waitExtensions = [];
      for (const [extensionLabel, options] of
        Object.entries(root.Aellux.extRegistry)) {
        if (options.loadWhen) continue;
        waitExtensions.push(Aellux.wait(extensionLabel));
      }
      await Promise.all(waitExtensions);

      await AelluxForce(rootElement, "mount", extensionLabels);

      allWaiters.forEach(waiter => waiter.setAttribute("aria-busy", "false"));
    }
    return true;
  }

  async function AelluxForce(rootElement, method, extensionLabels = null) {
    const Aellux = root.Aellux;
    if (typeof extensionLabels === "string")
      extensionLabels = [extensionLabels];

    var filter;
    if (!extensionLabels) {
      const mounterSelectors = Object.values(Aellux.extensionMounters);
      const lazySelectors = Object.values(Aellux.lazyExtensionSelectors);
      filter = [...mounterSelectors, ...lazySelectors];
    } else {
      filter = [];
      extensionLabels = extensionLabels.map(_ => fromCamelCase(_));

      for (const [label, selectorString] of Object.entries(Aellux.extensionMounters))
        if (extensionLabels.indexOf(fromCamelCase(label)) !== -1)
          filter.push(selectorString);

      for (const [label, selectorString] of Object.entries(Aellux.lazyExtensionSelectors))
        if (extensionLabels.indexOf(fromCamelCase(label)) !== -1)
          filter.push(selectorString);
    }

    if (filter.length === 0) return;

    const allElements = findElements(rootElement, filter.join(","));
    for (const element of allElements) {
      const elementsAffected = new Set();
      var localExtensionLabels;

      if (extensionLabels) {
        localExtensionLabels = new Set(extensionLabels);
      } else {
        localExtensionLabels = new Set();
        //Load needed lazies
        for (const [extensionLabel, selector]
          of Object.entries(Aellux.lazyExtensionSelectors))
          if (element.matches(selector) && filter.indexOf(selector) !== -1)
            localExtensionLabels.add(extensionLabel);

        //Mount readies
        for (const [extensionLabel, selector]
          of Object.entries(Aellux.extensionMounters))
          if (element.matches(selector) && filter.indexOf(selector) !== -1)
            localExtensionLabels.add(extensionLabel);
      }

      for (const extensionLabel of localExtensionLabels) {
        const extensionPromise = method === "mount" ?
          Aellux.wait(extensionLabel) :
          extensionPromises[toCamelCase(extensionLabel)];
        if (!extensionPromise) { continue; }
        const extension = await extensionPromise;
        if (!extension || !extension.mountDOM) { continue; }
        const mounter = extension.mountDOM;
        for (const [selector, controller] of mounter) {
          try {
            if (!controller[method]) { continue; }
            const mountableElements = findElements(element, selector);
            for (const mountable of mountableElements) {
              const mountId = `${extensionLabel}@${selector}`;
              const mounting = (method === "mount");
              if (mounting === isMounted(mountable, mountId)) continue;
              await controller[method](mountable);
              elementsAffected.add(mountable);
              setMounted(mountable, mountId, mounting);
            }
          } catch (error) {
            console.error(error);
          }
        }
      }

      for (const affected of elementsAffected) {
        affected.classList.toggle(
          Aellux.className("mounted"),
          isMounted(affected)
        );
      }
    }
    Aellux.dispatch("Update");
  }

  function resolveRoots(root) {
    if (!root) { return [document]; }
    if (typeof root === "string") {
      try { return Array.from(document.querySelectorAll(root)); }
      catch (error) { return []; }
    }
    if (
      root instanceof Element ||
      root instanceof Document ||
      root instanceof DocumentFragment
    ) { return [root]; }
    return [];
  }

  function findElements(root, selector) {
    const elements = [];
    if (
      root.nodeType === Node.ELEMENT_NODE &&
      root.matches(selector)
    ) { elements.push(root); }
    if (root.querySelectorAll) {
      root.querySelectorAll(selector)
        .forEach(function (element) {
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

  function setMounted(element, mountId, mounted = true) {
    if (!mountedElements.has(element)) {
      mountedElements.set(element, new Set());
    }
    const mounts = mountedElements.get(element);
    mounts[mounted ? "add" : "delete"](mountId);
    if (mounts.size === 0) mountedElements.delete(element);
  }

  function toCamelCase(name) { return name.replace(/-([a-z])/g, (_, c) => c.toUpperCase()); };
  function fromCamelCase(name) { return name.replace(/([A-Z])/g, "-$1").toLowerCase(); };

  return {
    AelluxForceUpdate,
    AelluxForceUnmount
  };
}