import { expect, test } from "@playwright/test";

test("present trigger stays expanded while any target is expanded", async ({ page }) => {
  await page.goto("/tests/index.htm");
  await page.evaluate(() => {
    document.body.innerHTML = `
      <button id="control" data-ae-trigger="toggle" data-ae-target=".panel"></button>
      <div id="first" class="panel" data-ae-present></div>
      <div id="second" class="panel" data-ae-present></div>
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
      extAttach: (_name, extension) => { window.presentExtension = extension; },
      dispatchFrom: () => true
    };
  });
  await page.addScriptTag({ url: "/src/aellux.ext.present.js" });
  await page.evaluate(() => {
    const extension = window.presentExtension;
    extension.init();
    const [panels, controls] = extension.mountMap.values();
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
    const [panels] = window.presentExtension.mountMap.values();
    panels.unmount(document.querySelector("#first"));
  });
  await expect(control).toHaveAttribute("aria-expanded", "true");

  await page.evaluate(() => {
    const [panels] = window.presentExtension.mountMap.values();
    panels.unmount(document.querySelector("#second"));
  });
  await expect(control).toHaveAttribute("aria-expanded", "false");

  await page.evaluate(() => {
    const [panels] = window.presentExtension.mountMap.values();
    panels.mount(document.querySelector("#first"));
  });
  await expect(control).toHaveAttribute("aria-expanded", "true");
});

test("present restores initial attributes and resets memory after unmount", async ({ page }) => {
  await page.goto("/tests/index.htm");
  await page.evaluate(async () => {
    const { saveAttr, restoreAttr } = await import("/src/internal/create-initial-attr-memory.js");
    document.body.innerHTML = `
      <button id="control" data-ae-trigger="toggle" data-ae-target="#panel"
        aria-expanded="" aria-controls=""></button>
      <div id="panel" data-ae-present hidden aria-expanded="custom">
        <div id="motion" data-ae-present-motion hidden></div>
      </div>
    `;
    window.AelluxJs = {
      attr: name => `data-ae-${name}`,
      className: name => `ae-${name}`,
      attrMem: { save: saveAttr, restore: restoreAttr },
      extAttach: (_name, extension) => { window.presentExtension = extension; },
      dispatchFrom: () => true
    };
  });
  await page.addScriptTag({ url: "/src/aellux.ext.present.js" });

  const state = await page.evaluate(() => {
    const extension = window.presentExtension;
    extension.init();
    const [panels, controls] = extension.mountMap.values();
    const panel = document.querySelector("#panel");
    const motion = document.querySelector("#motion");
    const control = document.querySelector("#control");

    panels.mount(panel);
    controls.mount(control);
    controls.unmount(control);
    panels.unmount(panel);
    const first = {
      panelHidden: panel.hasAttribute("hidden"),
      panelExpanded: panel.getAttribute("aria-expanded"),
      motionHidden: motion.hasAttribute("hidden"),
      controlExpanded: control.getAttribute("aria-expanded"),
      controlControls: control.getAttribute("aria-controls")
    };

    panel.setAttribute("aria-expanded", "after-reset");
    window.AelluxJs.attrMem.restore(panel);
    const memoryWasReset = panel.getAttribute("aria-expanded") === "after-reset";
    panel.removeAttribute("hidden");
    panel.setAttribute("aria-expanded", "changed");
    control.setAttribute("aria-expanded", "before-remount");
    control.setAttribute("aria-controls", "original");
    panels.mount(panel);
    controls.mount(control);
    controls.unmount(control);
    panels.unmount(panel);
    const second = {
      panelHidden: panel.hasAttribute("hidden"),
      panelExpanded: panel.getAttribute("aria-expanded"),
      motionHidden: motion.hasAttribute("hidden"),
      controlExpanded: control.getAttribute("aria-expanded"),
      controlControls: control.getAttribute("aria-controls")
    };

    panel.setAttribute("data-ae-trigger", "toggle");
    panel.setAttribute("data-ae-target", "#panel");
    panels.mount(panel);
    controls.mount(panel);
    panels.unmount(panel);
    controls.unmount(panel);
    const sharedElement = {
      hidden: panel.hasAttribute("hidden"),
      expanded: panel.getAttribute("aria-expanded"),
      controls: panel.getAttribute("aria-controls"),
      presentMotion: panel.getAttribute("data-ae-present-motion")
    };
    extension.destroy();
    return { first, second, sharedElement, memoryWasReset };
  });

  expect(state.memoryWasReset).toBe(true);
  expect(state.first).toEqual({
    panelHidden: true,
    panelExpanded: "custom",
    motionHidden: true,
    controlExpanded: "",
    controlControls: ""
  });
  expect(state.second).toEqual({
    panelHidden: false,
    panelExpanded: "changed",
    motionHidden: true,
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
        report: (definition, context) => reports.push({ code: definition.code, selector: context.selector })
      },
      extAttach: (_name, extension) => { window.presentExtension = extension; },
      dispatchFrom: () => true
    };
  });
  await page.addScriptTag({ url: "/src/aellux.ext.present.js" });
  const reports = await page.evaluate(() => {
    const extension = window.presentExtension;
    extension.init();
    const [, controls] = extension.mountMap.values();
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
