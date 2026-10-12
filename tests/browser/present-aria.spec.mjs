import { expect, test } from "@playwright/test";

test("unpop restores previous focus only when hiding the active element", async ({ page }) => {
  await page.goto("/tests/index.htm");
  await page.evaluate(() => {
    document.body.innerHTML = `
      <button id="previous">Previous</button>
      <div id="panel" data-ae-present style="--ae-unpop-duration: 0ms">
        <div data-ae-present-motion><button id="inside">Inside</button></div>
      </div>
      <button id="outside">Outside</button>
    `;
  });
  await page.addScriptTag({ url: "/dist/aellux.js" });
  await page.evaluate(() => {
    AelluxJs.ext("focus");
    AelluxJs.init({ mode: "full" });
  });
  await expect.poll(() => page.evaluate(() => AelluxJs.ext.focus?.initialized)).toBe(true);
  await expect.poll(() => page.evaluate(() =>
    typeof AelluxJs.mountManager?.controller("panel")?.present?.unpop === "function"
  )).toBe(true);

  await page.locator("#previous").focus();
  await page.locator("#inside").focus();
  await page.evaluate(() => {
    window.focusLostCount = 0;
    AelluxJs.on("UnpopFocusLost", () => window.focusLostCount++);
    AelluxJs.mountManager.controller("panel").present.unpop();
  });
  await expect(page.locator("#panel")).toHaveJSProperty("hidden", true);
  await expect.poll(() => page.evaluate(() => document.activeElement.id)).toBe("previous");
  expect(await page.evaluate(() => window.focusLostCount)).toBe(1);

  await page.evaluate(() => AelluxJs.mountManager.controller("panel").present.pop());
  await expect(page.locator("#panel")).toHaveJSProperty("hidden", false);
  await page.locator("#outside").focus();
  await page.evaluate(() => AelluxJs.mountManager.controller("panel").present.unpop());
  await expect(page.locator("#panel")).toHaveJSProperty("hidden", true);
  expect(await page.evaluate(() => ({ active: document.activeElement.id, count: window.focusLostCount })))
    .toEqual({ active: "outside", count: 1 });
});

test("mounted present controller binds public methods to its element", async ({ page }) => {
  await page.goto("/tests/index.htm");
  await page.evaluate(() => {
    document.body.innerHTML = `
      <div id="panel" data-ae-present hidden
        style="--ae-pop-duration: 0ms; --ae-unpop-duration: 0ms">
        <div data-ae-present-motion></div>
      </div>
    `;
  });
  await page.addScriptTag({ url: "/dist/aellux.js" });
  await page.evaluate(() => AelluxJs.init({ mode: "full" }));
  await expect.poll(() => page.evaluate(() =>
    typeof AelluxJs.mountManager?.controller("panel")?.present?.pop === "function"
  )).toBe(true);

  const result = await page.evaluate(async () => {
    const panel = document.getElementById("panel");
    const byElement = AelluxJs.mountManager.controller(panel);
    const byId = AelluxJs.mountManager.controller("panel");
    const byPrefixedId = AelluxJs.mountManager.controller("#panel");
    const byCall = AelluxJs(panel);
    const byAlias = $ae("#panel");
    const transition = byElement.present.pop();
    const returnsPromise = transition instanceof Promise;
    await transition;
    return {
      sameController: byElement === byId && byId === byPrefixedId &&
        byPrefixedId === byCall && byCall === byAlias,
      methods: Object.keys(byElement.present).sort(),
      update: typeof byElement.update,
      returnsPromise,
      presentUpdate: byElement.present.update,
      missing: AelluxJs("#missing")
    };
  });
  expect(result).toEqual({
    sameController: true,
    methods: ["pop", "toggle", "trigger", "unpop", "update"],
    update: "function",
    returnsPromise: true,
    presentUpdate: null,
    missing: null
  });
  await expect(page.locator("#panel")).toHaveJSProperty("hidden", false);

  await page.evaluate(() => $ae("#panel").present.toggle(false));
  await expect(page.locator("#panel")).toHaveJSProperty("hidden", true);

  await page.evaluate(() => AelluxJs.unmount(document.getElementById("panel")));
  expect(await page.evaluate(() => $ae("panel"))).toBe(null);
});

test("present prepares will-change before starting a transition", async ({ page }) => {
  await page.goto("/tests/index.htm");
  await page.evaluate(() => {
    document.body.innerHTML = `
      <div id="panel" data-ae-present hidden
        style="--ae-pop-duration: 0ms; --ae-unpop-duration: 0ms">
        <div data-ae-present-motion></div>
      </div>`;
  });
  await page.addScriptTag({ url: "/dist/aellux.js" });
  await page.evaluate(() => AelluxJs.init({ mode: "full" }));
  await expect(page.locator('link[data-ae-ext-style="present"]')).toHaveAttribute(
    "href", /aellux\.ext\.present\.css$/
  );
  await expect.poll(() => page.evaluate(() =>
    typeof AelluxJs.mountManager?.controller("panel")?.present?.pop === "function"
  )).toBe(true);

  const initial = await page.evaluate(() => {
    const panel = document.getElementById("panel");
    const motion = panel.querySelector(":scope > [data-ae-present-motion]");
    const willChange = AelluxJs.className("will-change");
    const popping = AelluxJs.className("popping");
    window.presentTransitionStartedAt = performance.now();
    window.presentPoppingAt = null;
    panel.addEventListener(AelluxJs.eventName("Popping"), () => {
      window.presentPoppingAt = performance.now();
    }, { once: true });
    window.presentTransitionPromise = AelluxJs.mountManager.controller(panel).present.pop();
    return {
      hidden: panel.hidden,
      willChange: panel.classList.contains(willChange),
      popping: panel.classList.contains(popping),
      returnsPromise: window.presentTransitionPromise instanceof Promise,
      willChangeStyle: getComputedStyle(panel).willChange,
      motionWillChange: motion.classList.contains(willChange),
      motionWillChangeStyle: getComputedStyle(motion).willChange
    };
  });
  expect(initial).toEqual({
    hidden: false,
    willChange: true,
    popping: false,
    returnsPromise: true,
    willChangeStyle: "opacity, transform",
    motionWillChange: false,
    motionWillChangeStyle: "auto"
  });

  await expect.poll(() => page.evaluate(() => window.presentPoppingAt)).not.toBeNull();
  const preparationTime = await page.evaluate(() =>
    window.presentPoppingAt - window.presentTransitionStartedAt
  );
  expect(preparationTime).toBeGreaterThanOrEqual(90);
  await page.evaluate(() => window.presentTransitionPromise);
  await expect.poll(() => page.evaluate(() => {
    const panel = document.getElementById("panel");
    const motion = panel.querySelector(":scope > [data-ae-present-motion]");
    return {
      willChange: panel.classList.contains(AelluxJs.className("will-change")),
      popped: panel.classList.contains(AelluxJs.className("pop")),
      willChangeStyle: getComputedStyle(panel).willChange,
      motionWillChange: motion.classList.contains(AelluxJs.className("will-change")),
      motionWillChangeStyle: getComputedStyle(motion).willChange
    };
  })).toEqual({
    willChange: false,
    popped: true,
    willChangeStyle: "auto",
    motionWillChange: false,
    motionWillChangeStyle: "auto"
  });
});

test("present disables transitions when reduced motion is active", async ({ page }) => {
  await page.goto("/tests/index.htm");
  await page.evaluate(() => {
    document.body.innerHTML = '<div id="panel" data-ae-present hidden><div data-ae-present-motion></div></div>';
  });
  await page.addScriptTag({ url: "/dist/aellux.js" });
  await page.evaluate(() => AelluxJs.init({ mode: "full" }));
  await expect(page.locator('link[data-ae-ext-style="present"]')).toHaveAttribute(
    "href", /aellux\.ext\.present\.css$/
  );
  await page.evaluate(() => {
    document.documentElement.setAttribute("data-ae-reduced-motion", "reduced");
  });
  await expect.poll(() => page.evaluate(() =>
    getComputedStyle(document.getElementById("panel")).transitionDuration
  )).toBe("0s");
});

test("present applies independent height and width animation keyframes", async ({ page }) => {
  await page.goto("/tests/index.htm");
  await page.evaluate(() => {
    document.body.innerHTML = `
      <style>[data-ae-present] { --ae-pop-duration: 0ms; --ae-unpop-duration: 0ms; }</style>
      <div id="empty" data-ae-present><div data-ae-present-motion>empty</div></div>
      <div id="height" data-ae-present="height"
        style="width: 200px; --ae-from-height: 11px; --ae-pop-height: 41px; --ae-unpop-height: 7px"><div data-ae-present-motion>height</div></div>
      <div id="width" data-ae-present="width"
        style="height: 50px; --ae-from-width: 13px; --ae-pop-width: 83px; --ae-unpop-width: 5px"><div data-ae-present-motion>width</div></div>
      <div id="both" data-ae-present="width height"
        style="--ae-from-width: 17px; --ae-pop-width: 97px; --ae-unpop-width: 3px;
          --ae-from-height: 19px; --ae-pop-height: 43px; --ae-unpop-height: 2px"><div data-ae-present-motion>both</div></div>
    `;
  });
  await page.addScriptTag({ url: "/dist/aellux.js" });
  await page.evaluate(() => AelluxJs.init({ mode: "full" }));
  await expect.poll(() => page.evaluate(() => {
    const pop = AelluxJs.className("pop");
    return ["empty", "height", "width", "both"].every(id =>
      document.getElementById(id).classList.contains(pop)
    );
  })).toBe(true);

  const states = await page.evaluate(() => {
    const ids = ["empty", "height", "width", "both"];
    const pop = AelluxJs.className("pop");
    const unpopping = AelluxJs.className("unpopping");
    const willChange = AelluxJs.className("will-change");
    const read = () => Object.fromEntries(ids.map(id => {
      const element = document.getElementById(id);
      const style = getComputedStyle(element);
      const motionStyle = getComputedStyle(
        element.querySelector(":scope > [data-ae-present-motion]")
      );
      return [id, {
        display: style.display,
        columns: style.gridTemplateColumns,
        rows: style.gridTemplateRows,
        transitionProperty: style.transitionProperty,
        willChange: style.willChange,
        motionWillChange: motionStyle.willChange,
        motionMinWidth: motionStyle.minWidth,
        motionMinHeight: motionStyle.minHeight,
        motionTransitionProperty: motionStyle.transitionProperty
      }];
    }));

    const opened = read();
    ids.forEach(id => document.getElementById(id).classList.remove(pop));
    const from = read();
    ids.forEach(id => document.getElementById(id).classList.add(unpopping));
    const unpoppingState = read();
    ids.forEach(id => {
      const element = document.getElementById(id);
      element.classList.remove(unpopping);
      element.classList.add(willChange);
    });
    const prepared = read();
    return { opened, from, unpopping: unpoppingState, prepared };
  });

  expect(states.opened.empty).toMatchObject({
    display: "inline-grid", transitionProperty: "opacity, transform"
  });
  expect(states.opened.height).toMatchObject({
    display: "inline-grid", columns: "200px", rows: "41px",
    transitionProperty: "opacity, transform, grid-template-rows"
  });
  expect(states.opened.width).toMatchObject({
    display: "inline-grid", columns: "83px", rows: "50px",
    transitionProperty: "opacity, transform, grid-template-columns"
  });
  expect(states.opened.both).toMatchObject({
    display: "inline-grid", columns: "97px", rows: "43px",
    transitionProperty: "opacity, transform, grid-template-columns, grid-template-rows"
  });
  expect(states.from.height.rows).toBe("11px");
  expect(states.from.width.columns).toBe("13px");
  expect(states.from.both).toMatchObject({ columns: "17px", rows: "19px" });
  expect(states.unpopping.height.rows).toBe("7px");
  expect(states.unpopping.width.columns).toBe("5px");
  expect(states.unpopping.both).toMatchObject({ columns: "3px", rows: "2px" });
  expect(states.prepared.empty).toMatchObject({
    willChange: "opacity, transform",
    motionWillChange: "auto",
    motionMinWidth: "0px",
    motionMinHeight: "0px",
    motionTransitionProperty: "all"
  });
  expect(states.prepared.height.willChange).toBe("opacity, transform, grid-template-rows");
  expect(states.prepared.width.willChange).toBe("opacity, transform, grid-template-columns");
  expect(states.prepared.both.willChange)
    .toBe("opacity, transform, grid-template-columns, grid-template-rows");
});

test("present derives stepped easing from duration on low hardware", async ({ page }) => {
  await page.goto("/tests/index.htm");
  await page.evaluate(() => {
    document.documentElement.setAttribute("data-ae-low-hardware", "");
    document.body.innerHTML = `
      <div id="panel" data-ae-present hidden
        style="--ae-pop-duration: 500ms"><div data-ae-present-motion></div></div>`;
  });
  await page.addScriptTag({ url: "/dist/aellux.js" });
  await page.evaluate(() => AelluxJs.init({ mode: "full" }));
  await expect.poll(() => page.evaluate(() =>
    typeof AelluxJs.mountManager?.controller("panel")?.present?.pop === "function"
  )).toBe(true);
  await page.evaluate(() => AelluxJs.mountManager.controller("panel").present.pop());
  await expect.poll(() => page.evaluate(() => {
    const panel = document.getElementById("panel");
    const style = getComputedStyle(panel);
    return {
      steps: style.getPropertyValue("--ae-pop-low-steps").trim(),
      easing: style.getPropertyValue("--ae-pop-ease").trim(),
      inlineSteps: panel.style.getPropertyValue("--ae-pop-low-steps").trim()
    };
  })).toEqual({ steps: "8", easing: "steps(8)", inlineSteps: "8" });
});

test("controller lookup diagnoses invalid inputs and unmounted elements", async ({ page }) => {
  await page.goto("/tests/index.htm");
  await page.addScriptTag({ url: "/dist/aellux.js" });
  await page.evaluate(() => AelluxJs.init({ mode: "full" }));
  await expect.poll(() => page.evaluate(() => !!AelluxJs.mountManager)).toBe(true);

  const result = await page.evaluate(() => {
    const invalidValue = $ae(42);
    const missingId = $ae("#missing");
    const unmounted = $ae(document.createElement("div"));
    const originalLog = console.log;
    console.log = () => {};
    try {
      const entries = AelluxJs.diagnostics.showHistory(3);
      return {
        results: [invalidValue, missingId, unmounted],
        diagnostics: entries.map(({ code, level, message }) => ({ code, level, message }))
      };
    } finally {
      console.log = originalLog;
    }
  });
  expect(result.results).toEqual([null, null, null]);
  expect(result.diagnostics).toEqual([
    { code: 2003, level: 1, message: expect.stringContaining("DOM Element") },
    { code: 2003, level: 1, message: expect.stringContaining("element ID") },
    { code: 1004, level: 0, message: expect.stringContaining("may not be mounted") }
  ]);
});

test("present keeps visibility on the container and diagnoses controls without a target", async ({ page }) => {
  await page.goto("/tests/index.htm");
  await page.evaluate(() => {
    document.body.innerHTML = `
      <button id="orphan-trigger" data-ae-trigger="pop"></button>
      <button id="orphan-dismiss" data-ae-dismiss></button>
      <div id="panel" data-ae-present hidden>
        <div id="motion" data-ae-present-motion></div>
      </div>
    `;
  });
  await page.addScriptTag({ url: "/dist/aellux.js" });
  await page.evaluate(() => AelluxJs.init({ mode: "full" }));
  await expect(page.locator("#panel")).toHaveJSProperty("hidden", true);
  await expect(page.locator("#panel")).toHaveAttribute("aria-expanded", "false");
  await expect(page.locator("#motion")).not.toHaveAttribute("hidden", "");

  await page.locator("#orphan-trigger").click();
  await page.locator("#orphan-dismiss").click();
  const entries = await page.evaluate(() => AelluxJs.diagnostics.showHistory()
    .filter(entry => entry.code === 1111)
    .map(entry => ({
      code: entry.code,
      level: entry.level,
      element: entry.context.element.id,
      action: entry.context.action || null
    })));
  expect(entries).toEqual([
    { code: 1111, level: 0, element: "orphan-trigger", action: "trigger" },
    { code: 1111, level: 0, element: "orphan-dismiss", action: "dismiss" }
  ]);
});

test("present trigger stays expanded while any target is expanded", async ({ page }) => {
  await page.goto("/tests/index.htm");
  await page.evaluate(() => {
    document.body.innerHTML = `
      <button id="control" data-ae-trigger="toggle" data-ae-target=".panel"></button>
      <div id="first" class="panel" data-ae-present><div data-ae-present-motion></div></div>
      <div id="second" class="panel" data-ae-present><div data-ae-present-motion></div></div>
    `;
    const attributes = new WeakMap();
    window.AelluxJs = {
      attr: (name) => `data-ae-${name}`,
      className: (name) => `ae-${name}`,
      attrMem: {
        save: (element, names) => attributes.set(
          element, names.map(name => [name, element.getAttribute(name)])
        ),
        restore: (element) => {
          for (const [name, value] of attributes.get(element) || []) {
            if (value === null) element.removeAttribute(name);
            else element.setAttribute(name, value);
          }
          attributes.delete(element);
        }
      },
      mountManager: {
        add: ({ selector, mount, unmount, update, controllers }) => {
          (window.mountEntries ||= new Map()).set(selector, { mount, unmount, update, controllers });
        },
        remove: () => window.mountEntries?.clear()
      },
      extAttach: (_name, extension) => { window.presentExtension = extension; },
      dispatchFrom: () => true
    };
  });
  await page.addScriptTag({ url: "/src/aellux.ext.present.js" });
  await page.evaluate(() => {
    const extension = window.presentExtension;
    extension.init();
    const panels = window.mountEntries.get("[data-ae-present]");
    const controls = window.mountEntries.get("[data-ae-trigger],[data-ae-dismiss],[data-ae-target]");
    panels.mount(document.querySelector("#first"));
    panels.mount(document.querySelector("#second"));
    controls.mount(document.querySelector("#control"));
  });

  const control = page.locator("#control");
  await expect(control).toHaveAttribute("aria-expanded", "true");

  await page.evaluate(() => window.presentExtension.unpop(document.querySelector("#first")));
  await expect(page.locator("#first")).toHaveJSProperty("hidden", true);
  await expect(control).toHaveAttribute("aria-expanded", "true");

  await page.evaluate(() => window.presentExtension.unpop(document.querySelector("#second")));
  await expect(page.locator("#second")).toHaveJSProperty("hidden", true);
  await expect(control).toHaveAttribute("aria-expanded", "false");

  await page.evaluate(() => window.presentExtension.pop(document.querySelector("#first")));
  await expect(page.locator("#first")).toHaveJSProperty("hidden", false);
  await expect(control).toHaveAttribute("aria-expanded", "true");

  await page.evaluate(() => window.presentExtension.pop(document.querySelector("#second")));
  await expect(page.locator("#second")).toHaveJSProperty("hidden", false);
  await expect(page.locator("#second")).toHaveAttribute("aria-expanded", "true");
  await page.evaluate(() => {
    const panels = window.mountEntries.get("[data-ae-present]");
    panels.unmount(document.querySelector("#first"));
  });
  await expect(control).toHaveAttribute("aria-expanded", "true");

  await page.evaluate(() => {
    const panels = window.mountEntries.get("[data-ae-present]");
    panels.unmount(document.querySelector("#second"));
  });
  await expect(control).toHaveAttribute("aria-expanded", "false");

  await page.evaluate(() => {
    const panels = window.mountEntries.get("[data-ae-present]");
    panels.mount(document.querySelector("#first"));
  });
  await expect(control).toHaveAttribute("aria-expanded", "true");
});

test("present restores initial attributes and captures fresh values on remount", async ({ page }) => {
  await page.goto("/tests/index.htm");
  await page.evaluate(() => {
    document.body.innerHTML = `
      <button id="control" data-ae-trigger="toggle" data-ae-target="#panel"
        aria-expanded="" aria-controls=""></button>
      <div id="panel" data-ae-present hidden aria-expanded="custom">
        <div id="motion" data-ae-present-motion></div>
      </div>
    `;
  });
  await page.addScriptTag({ url: "/dist/aellux.js" });
  await page.evaluate(() => AelluxJs.init({ mode: "full" }));
  await expect.poll(() => page.evaluate(() =>
    document.getElementById("panel").classList.contains(AelluxJs.className("mounted"))
  )).toBe(true);

  const state = await page.evaluate(async () => {
    const panel = document.querySelector("#panel");
    const motion = document.querySelector("#motion");
    const control = document.querySelector("#control");

    await AelluxJs.unmount(control, "present");
    await AelluxJs.unmount(panel, "present");
    const first = {
      panelHidden: panel.hasAttribute("hidden"),
      panelExpanded: panel.getAttribute("aria-expanded"),
      motionHidden: motion.hasAttribute("hidden"),
      controlExpanded: control.getAttribute("aria-expanded"),
      controlControls: control.getAttribute("aria-controls")
    };

    panel.setAttribute("aria-expanded", "after-reset");
    panel.removeAttribute("hidden");
    panel.setAttribute("aria-expanded", "changed");
    control.setAttribute("aria-expanded", "before-remount");
    control.setAttribute("aria-controls", "original");
    await AelluxJs.mount(panel, "present");
    await AelluxJs.mount(control, "present");
    await AelluxJs.unmount(control, "present");
    await AelluxJs.unmount(panel, "present");
    const second = {
      panelHidden: panel.hasAttribute("hidden"),
      panelExpanded: panel.getAttribute("aria-expanded"),
      motionHidden: motion.hasAttribute("hidden"),
      controlExpanded: control.getAttribute("aria-expanded"),
      controlControls: control.getAttribute("aria-controls")
    };

    panel.setAttribute("data-ae-trigger", "toggle");
    panel.setAttribute("data-ae-target", "#panel");
    await AelluxJs.mount(panel, "present");
    await AelluxJs.unmount(panel, "present");
    const sharedElement = {
      hidden: panel.hasAttribute("hidden"),
      expanded: panel.getAttribute("aria-expanded"),
      controls: panel.getAttribute("aria-controls"),
      presentMotion: panel.getAttribute("data-ae-present-motion")
    };
    return { first, second, sharedElement };
  });

  expect(state.first).toEqual({
    panelHidden: true,
    panelExpanded: "custom",
    motionHidden: false,
    controlExpanded: "",
    controlControls: ""
  });
  expect(state.second).toEqual({
    panelHidden: false,
    panelExpanded: "changed",
    motionHidden: false,
    controlExpanded: "before-remount",
    controlControls: "original"
  });
  expect(state.sharedElement).toEqual({
    hidden: false,
    expanded: "changed",
    controls: null,
    presentMotion: null
  });
});

test("present warns and generates a missing direct motion child", async ({ page }) => {
  await page.goto("/tests/index.htm");
  await page.evaluate(() => {
    document.body.innerHTML = `
      <div id="missing" data-ae-present data-ae-present-motion hidden>
        <button id="missing-control">Control</button>
      </div>
      <div id="valid" data-ae-present hidden>
        <div id="motion" data-ae-present-motion><span id="existing-content"></span></div>
      </div>
    `;
  });
  await page.addScriptTag({ url: "/dist/aellux.js" });
  await page.evaluate(() => AelluxJs.init({ mode: "full" }));
  await expect.poll(() => page.evaluate(() =>
    typeof AelluxJs.mountManager?.controller("missing")?.present?.pop === "function"
  )).toBe(true);

  const result = await page.evaluate(async () => {
    const missing = document.getElementById("missing");
    const motion = document.getElementById("motion");
    const mounted = {
      missingMarker: missing.getAttribute("data-ae-present-motion"),
      generatedWrapper: missing.querySelector(":scope > [data-ae-present-motion]")?.tagName,
      controlParentHasMotion: document.getElementById("missing-control").parentElement.hasAttribute("data-ae-present-motion"),
      existingMotionPreserved: document.querySelector("#valid > [data-ae-present-motion]") === motion,
      missingHidden: missing.hidden
    };
    const diagnostics = AelluxJs.diagnostics.showHistory()
      .filter(entry => entry.code === 2010)
      .map(entry => ({ code: entry.code, level: entry.level, element: entry.context.element.id }));
    await AelluxJs.unmount(document, "present");
    const restored = {
      missingMarker: missing.getAttribute("data-ae-present-motion"),
      generatedWrapper: missing.querySelector(":scope > [data-ae-present-motion]"),
      controlParent: document.getElementById("missing-control").parentElement.id,
      existingMotionPreserved: document.querySelector("#valid > [data-ae-present-motion]") === motion
    };
    return { mounted, diagnostics, restored };
  });
  expect(result).toEqual({
    mounted: {
      missingMarker: null,
      generatedWrapper: "DIV",
      controlParentHasMotion: true,
      existingMotionPreserved: true,
      missingHidden: true
    },
    diagnostics: [{ code: 2010, level: 1, element: "missing" }],
    restored: {
      missingMarker: "",
      generatedWrapper: null,
      controlParent: "missing",
      existingMotionPreserved: true
    }
  });
});

test("present reports invalid selectors without throwing from click", async ({ page }) => {
  await page.goto("/tests/index.htm");
  const pageErrors = [];
  page.on("pageerror", error => pageErrors.push(error.message));
  await page.evaluate(() => {
    document.body.innerHTML = '<button id="dismiss" data-ae-dismiss="["></button>';
    const reports = [];
    window.selectorReports = reports;
    window.AelluxJs = {
      attr: name => `data-ae-${name}`,
      className: name => `ae-${name}`,
      attrMem: { save() {}, restore() {} },
      diagnostics: {
        ERROR_EXTENSION_SELECTOR: { code: 1107 },
        error: (definition, context) => reports.push({ code: definition.code, selector: context.selector })
      },
      mountManager: {
        add: ({ selector, mount, unmount, update, controllers }) => {
          (window.mountEntries ||= new Map()).set(selector, { mount, unmount, update, controllers });
        },
        remove: () => window.mountEntries?.clear()
      },
      extAttach: (_name, extension) => { window.presentExtension = extension; },
      dispatchFrom: () => true
    };
  });
  await page.addScriptTag({ url: "/src/aellux.ext.present.js" });
  const reports = await page.evaluate(() => {
    const extension = window.presentExtension;
    extension.init();
    const controls = window.mountEntries.get("[data-ae-trigger],[data-ae-dismiss],[data-ae-target]");
    controls.mount(document.querySelector("#dismiss"));
    document.querySelector("#dismiss").click();
    return window.selectorReports;
  });
  expect(reports).toEqual([
    { code: 1107, selector: "[" },
    { code: 1107, selector: "[" }
  ]);
  expect(pageErrors).toEqual([]);
});

test("present restores a trigger without targets and can mount it again", async ({ page }) => {
  await page.goto("/tests/index.htm");
  const result = await page.evaluate(async () => {
    const { saveAttr, restoreAttr } = await import("/src/internal/build-initial-attr-memory.js");
    document.body.innerHTML = '<button id="control" data-ae-trigger="toggle" data-ae-target="#later"></button>';
    window.AelluxJs = {
      attr: name => `data-ae-${name}`,
      className: name => `ae-${name}`,
      attrMem: { save: saveAttr, restore: restoreAttr },
      mountManager: {
        add: ({ selector, mount, unmount, update, controllers }) => {
          (window.mountEntries ||= new Map()).set(selector, { mount, unmount, update, controllers });
        },
        remove: () => window.mountEntries?.clear()
      },
      extAttach: (_name, extension) => { window.presentExtension = extension; },
      dispatchFrom: () => true
    };
    return true;
  });
  expect(result).toBe(true);
  await page.addScriptTag({ url: "/src/aellux.ext.present.js" });
  const state = await page.evaluate(() => {
    const extension = window.presentExtension;
    extension.init();
    const panels = window.mountEntries.get("[data-ae-present]");
    const controls = window.mountEntries.get("[data-ae-trigger],[data-ae-dismiss],[data-ae-target]");
    const control = document.querySelector("#control");
    controls.mount(control);
    controls.unmount(control);
    const afterUnmount = {
      expanded: control.getAttribute("aria-expanded"),
      controls: control.getAttribute("aria-controls")
    };
    document.body.insertAdjacentHTML("beforeend", '<div id="later" data-ae-present hidden><div data-ae-present-motion></div></div>');
    const panel = document.querySelector("#later");
    panels.mount(panel);
    controls.mount(control);
    const afterRemount = {
      expanded: control.getAttribute("aria-expanded"),
      controls: control.getAttribute("aria-controls")
    };
    controls.unmount(control);
    panels.unmount(panel);
    extension.destroy();
    return { afterUnmount, afterRemount };
  });
  expect(state.afterUnmount).toEqual({ expanded: null, controls: null });
  expect(state.afterRemount).toEqual({ expanded: "false", controls: "later" });
});

test("present records interrupted transitions as warnings and failures as errors", async ({ page }) => {
  await page.goto("/tests/index.htm");
  await page.evaluate(async () => {
    const [{ buildDiagnostics }, { createAelluxConstants }, { saveAttr, restoreAttr }] = await Promise.all([
      import("/src/internal/build-diagnostics.js"),
      import("/src/internal/create-aellux-constants.js"),
      import("/src/internal/build-initial-attr-memory.js")
    ]);
    document.body.innerHTML = '<div id="panel" data-ae-present hidden style="--ae-pop-duration: 100ms; --ae-unpop-duration: 0ms"><div data-ae-present-motion></div></div>';
    window.AelluxJs = {
      attr: name => `data-ae-${name}`,
      className: name => `ae-${name}`,
      attrMem: { save: saveAttr, restore: restoreAttr },
      diagnostics: buildDiagnostics(createAelluxConstants().AELLUXJS_DIAGNOSTICS),
      mountManager: {
        add: ({ selector, mount, unmount, update, controllers }) => {
          (window.mountEntries ||= new Map()).set(selector, { mount, unmount, update, controllers });
        },
        remove: () => window.mountEntries?.clear()
      },
      extAttach: (_name, extension) => { window.presentExtension = extension; },
      dispatchFrom: (_element, event) => {
        if (window.failPopping && event === "Popping") throw new Error("transition probe");
        return true;
      }
    };
  });
  await page.addScriptTag({ url: "/src/aellux.ext.present.js" });
  const entries = await page.evaluate(async () => {
    const extension = window.presentExtension;
    extension.init();
    const panels = window.mountEntries.get("[data-ae-present]");
    const panel = document.querySelector("#panel");
    panels.mount(panel);
    extension.pop(panel);
    extension.unpop(panel);
    await new Promise(resolve => setTimeout(resolve, 130));
    window.failPopping = true;
    extension.pop(panel);
    await new Promise(resolve => setTimeout(resolve, 130));
    return AelluxJs.diagnostics.showHistory().map(entry => ({ code: entry.code, level: entry.level }));
  });
  expect(entries).toEqual([
    { code: 2002, level: 1 },
    { code: 1109, level: 0 }
  ]);
});

test("present reports a transition callback failure with its own diagnostic", async ({ page }) => {
  await page.goto("/tests/index.htm");
  await page.evaluate(async () => {
    const [{ buildDiagnostics }, { createAelluxConstants }, { saveAttr, restoreAttr }] = await Promise.all([
      import("/src/internal/build-diagnostics.js"),
      import("/src/internal/create-aellux-constants.js"),
      import("/src/internal/build-initial-attr-memory.js")
    ]);
    document.body.innerHTML = `
      <button id="control" data-ae-trigger="pop" data-ae-target="#panel"></button>
      <div id="panel" data-ae-present hidden><div data-ae-present-motion></div></div>
    `;
    window.AelluxJs = {
      attr: name => `data-ae-${name}`,
      className: name => `ae-${name}`,
      attrMem: { save: saveAttr, restore: restoreAttr },
      diagnostics: buildDiagnostics(createAelluxConstants().AELLUXJS_DIAGNOSTICS),
      mountManager: {
        add: ({ selector, mount, unmount, update, controllers }) => {
          (window.mountEntries ||= new Map()).set(selector, { mount, unmount, update, controllers });
        },
        remove: () => window.mountEntries?.clear()
      },
      extAttach: (_name, extension) => { window.presentExtension = extension; },
      dispatchFrom: () => { throw new Error("callback probe"); }
    };
  });
  await page.addScriptTag({ url: "/src/aellux.ext.present.js" });
  const codes = await page.evaluate(() => {
    const extension = window.presentExtension;
    extension.init();
    const panels = window.mountEntries.get("[data-ae-present]");
    panels.mount(document.querySelector("#panel"));
    document.querySelector("#control").click();
    return AelluxJs.diagnostics.showHistory().map(entry => entry.code);
  });
  expect(codes).toEqual([1109]);
});

test("present refreshes trigger controls from its initial value", async ({ page }) => {
  await page.goto("/tests/index.htm");
  await page.evaluate(() => {
    document.body.innerHTML = `
      <button id="control" data-ae-trigger="toggle" data-ae-target="#first" aria-controls="external"></button>
      <div id="first" data-ae-present hidden><div data-ae-present-motion></div></div>
    `;
  });
  await page.addScriptTag({ url: "/dist/aellux.js" });
  await page.evaluate(() => AelluxJs.init({ mode: "full" }));
  await expect.poll(() => page.evaluate(() =>
    typeof AelluxJs.mountManager?.mount === "function"
  )).toBe(true);
  const controls = await page.evaluate(async () => {
    const control = document.querySelector("#control");
    await AelluxJs.mount(document, "present");
    const before = control.getAttribute("aria-controls");
    control.setAttribute("data-ae-target", "#second");
    document.body.insertAdjacentHTML("beforeend", '<div id="second" data-ae-present hidden><div data-ae-present-motion></div></div>');
    await AelluxJs.mount(document.querySelector("#second"), "present");
    const after = control.getAttribute("aria-controls");
    await AelluxJs.unmount(control, "present");
    return { before, after, restored: control.getAttribute("aria-controls") };
  });
  expect(controls).toEqual({
    before: "first external",
    after: "second external",
    restored: "external"
  });
});
