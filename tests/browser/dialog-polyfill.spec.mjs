import { expect, test } from "@playwright/test";

async function initialize(page, options) {
  await page.evaluate(options => new Promise(resolve => {
    AelluxJs.on("Ready", resolve, { once: true });
    AelluxJs.init(options);
  }), options);
}

async function removeDialogAPI(page, missing = "all") {
  await page.evaluate(missing => {
    for (const method of missing === "all" ? ["show", "showModal", "close"] : [missing]) {
      Object.defineProperty(HTMLDialogElement.prototype, method, { configurable: true, value: undefined });
    }
    if (missing === "all") window.HTMLDialogElement = undefined;
  }, missing);
}

for (const mode of ["basic", "full"]) {
  for (const boot of ["aellux.js", "aellux.min.js"]) {
    test(`${mode} ${boot} supplies missing dialog API, CSS, forms and dynamic roots`, async ({ page }) => {
      const errors = [];
      page.on("pageerror", error => errors.push(error.message));
      await page.goto("/tests/index.htm");
      await removeDialogAPI(page);
      await page.evaluate(() => {
        document.body.innerHTML = `<dialog id="modal"><form method="dialog">
          <input autofocus aria-label="Name"><button value="accepted">Accept</button>
        </form></dialog>`;
      });
      await page.addScriptTag({ url: `/dist/${boot}` });
      await initialize(page, { mode });
      expect(await page.evaluate(() => ({
        legacy: AelluxJs.diagnostics.legacy,
        missing: AelluxJs.diagnostics.notAvailable
      }))).toEqual({
        legacy: true,
        missing: ["HTMLDialogElement.prototype.show", "HTMLDialogElement.prototype.showModal", "HTMLDialogElement.prototype.close"]
      });
      await expect(page.locator("style[data-ae-dialog-polyfill-style]")).toHaveCount(1);
      const modal = page.locator("#modal");
      await expect(modal).toBeHidden();
      await modal.evaluate(dialog => {
        window.closeCount = 0;
        window.cancelCount = 0;
        dialog.addEventListener("close", () => window.closeCount++);
        dialog.addEventListener("cancel", () => window.cancelCount++);
        dialog.showModal();
      });
      await expect(modal).toBeVisible();
      await expect(modal.locator("input")).toBeFocused();
      await expect(page.locator("dialog + .backdrop")).toBeVisible();
      await modal.locator("button").click();
      await expect(modal).toBeHidden();
      expect(await modal.evaluate(dialog => dialog.returnValue)).toBe("accepted");
      await modal.evaluate(dialog => dialog.showModal());
      await page.keyboard.press("Escape");
      await expect(modal).toBeHidden();
      expect(await page.evaluate(() => ({ close: window.closeCount, cancel: window.cancelCount })))
        .toEqual({ close: 2, cancel: 1 });
      await modal.evaluate(dialog => {
        dialog.showModal();
        dialog.addEventListener("cancel", event => event.preventDefault(), { once: true });
      });
      await page.keyboard.press("Escape");
      await expect(modal).toBeVisible();
      await modal.evaluate(dialog => dialog.close("manual"));
      await expect(page.locator(".backdrop, ._dialog_overlay")).toHaveCount(0);

      expect(await page.evaluate(async () => {
        const wrapper = document.createElement("section");
        wrapper.innerHTML = '<dialog id="nested">Nested</dialog>';
        document.body.appendChild(wrapper);
        await $ae.mount(wrapper);
        const nested = wrapper.firstChild;
        nested.show();
        const open = nested.open;
        nested.close();
        const dialog = document.createElement("dialog");
        document.body.appendChild(dialog);
        await $ae.mount(dialog);
        const showModal = dialog.showModal;
        await $ae.mount(dialog);
        dialog.showModal();
        dialog.close();
        await $ae.unmount(dialog);
        dialog.remove();
        document.body.appendChild(dialog);
        await $ae.mount(dialog);
        return { open, methodsPreserved: showModal === dialog.showModal };
      })).toEqual({ open: true, methodsPreserved: true });
      expect(errors).toEqual([]);
    });
  }
}

for (const missing of ["show", "showModal", "close"]) {
  test(`a missing ${missing} method selects Legacy and repairs partial dialog support`, async ({ page }) => {
    await page.goto("/tests/index.htm");
    await removeDialogAPI(page, missing);
    await page.addScriptTag({ url: "/dist/aellux.js" });
    await initialize(page, { mode: "basic", skipGlobalMount: true });
    expect(await page.evaluate(() => AelluxJs.diagnostics.notAvailable))
      .toEqual([`HTMLDialogElement.prototype.${missing}`]);
    expect(await page.evaluate(async () => {
      const dialog = document.createElement("dialog");
      document.body.appendChild(dialog);
      await $ae.mount(dialog);
      dialog.showModal();
      const open = dialog.open;
      dialog.close("done");
      return { open, closed: !dialog.open, result: dialog.returnValue };
    })).toEqual({ open: true, closed: true, result: "done" });
  });
}

test("dialog methods are available inside Extension mount callbacks", async ({ page }) => {
  await page.goto("/tests/index.htm");
  await removeDialogAPI(page);
  await page.addScriptTag({ url: "/dist/aellux.js" });
  await page.evaluate(() => {
    document.body.innerHTML = '<dialog id="extension-dialog">Extension modal</dialog>';
    AelluxJs.ext("dialog-test");
    AelluxJs.extAttach("dialog-test", {
      init() {
        AelluxJs.mountManager.add({
          extensionName: "dialog-test", selector: "dialog",
          mount(dialog) {
            dialog.showModal();
            window.extensionSawOpenDialog = dialog.open;
            dialog.close();
          }
        });
      }
    });
  });
  await initialize(page, { mode: "basic" });
  expect(await page.evaluate(() => window.extensionSawOpenDialog)).toBe(true);
});

for (const forceLegacy of [false, true]) {
  test(`native dialogs are preserved with forceLegacy=${forceLegacy}`, async ({ page }) => {
    await page.goto("/tests/index.htm");
    await page.evaluate(() => {
      window.originalDialogAPI = [HTMLDialogElement.prototype.show, HTMLDialogElement.prototype.showModal,
        HTMLDialogElement.prototype.close, HTMLFormElement.prototype.submit];
      document.body.innerHTML = '<dialog id="native">Native</dialog>';
    });
    await page.addScriptTag({ url: "/dist/aellux.js" });
    await initialize(page, { mode: "basic", forceLegacy });
    expect(await page.evaluate(() => ({
      legacy: AelluxJs.diagnostics.legacy,
      preserved: window.originalDialogAPI.every((method, index) => method ===
        [HTMLDialogElement.prototype.show, HTMLDialogElement.prototype.showModal,
          HTMLDialogElement.prototype.close, HTMLFormElement.prototype.submit][index]),
      ownMethod: Object.hasOwn(document.querySelector("dialog"), "showModal")
    }))).toEqual({ legacy: forceLegacy, preserved: true, ownMethod: false });
    await expect(page.locator("style[data-ae-dialog-polyfill-style]")).toHaveCount(0);
    await page.locator("dialog").evaluate(dialog => dialog.showModal());
    await expect(page.locator("dialog")).toBeVisible();
    await page.locator("dialog").evaluate(dialog => dialog.close());
    await expect(page.locator("dialog")).toBeHidden();
  });
}
