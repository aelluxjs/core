import { expect, test } from "@playwright/test";
import { createHash } from "node:crypto";
import { readFile, readdir } from "node:fs/promises";

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
      const requests = [];
      page.on("request", request => requests.push(new URL(request.url()).pathname));
      page.on("pageerror", error => errors.push(error.message));
      await page.goto("/tests/index.htm");
      await removeDialogAPI(page);
      await page.evaluate(() => {
        document.body.innerHTML = `<dialog id="modal"><form method="dialog">
          <input autofocus aria-label="Name"><button value="accepted">Accept</button>
        </form></dialog>`;
      });
      await page.addScriptTag({ url: `/dist/${boot}` });
      if (mode === "basic") await page.evaluate(() => AelluxJs.ext("dialog"));
      await initialize(page, { mode });
      const variant = boot.includes(".min.") ? ".legacy.min.js" : ".legacy.js";
      expect(requests.filter(path => /aellux\.ext\.dialog.*\.js$/.test(path)))
        .toEqual([`/dist/aellux.ext.dialog${variant}`]);
      expect(requests.some(path => /dialog-polyfill|aellux\.ext\.dialog.*\.css$/.test(path))).toBe(false);
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
        $ae(dialog).dialog.showModal();
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
      await expect(page.locator("style[data-ae-dialog-polyfill-style]")).toHaveCount(1);
    });
  }
}

for (const missing of ["show", "showModal", "close"]) {
  test(`a missing ${missing} method selects Legacy and repairs partial dialog support`, async ({ page }) => {
    await page.goto("/tests/index.htm");
    await removeDialogAPI(page, missing);
    await page.addScriptTag({ url: "/dist/aellux.js" });
    await page.evaluate(() => AelluxJs.ext("dialog"));
    await initialize(page, { mode: "basic", skipGlobalMount: true });
    expect(await page.evaluate(() => AelluxJs.diagnostics.notAvailable))
      .toEqual([`HTMLDialogElement.prototype.${missing}`]);
    expect(await page.evaluate(async () => {
      const dialog = document.createElement("dialog");
      document.body.appendChild(dialog);
      await $ae.mount(dialog);
      $ae(dialog).dialog.showModal();
      const open = dialog.open;
      $ae(dialog).dialog.close("done");
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
            $ae(dialog).dialog.showModal();
            window.extensionSawOpenDialog = dialog.open;
            dialog.close();
          }
        });
      }
    });
    // Register the provider after its consumer to exercise mount priority.
    AelluxJs.ext("dialog", { loadWhen: "dialog" });
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
    await page.evaluate(() => AelluxJs.ext("dialog"));
    await initialize(page, { mode: "basic", forceLegacy });
    expect(await page.evaluate(() => ({
      legacy: AelluxJs.diagnostics.legacy,
      preserved: window.originalDialogAPI.every((method, index) => method ===
        [HTMLDialogElement.prototype.show, HTMLDialogElement.prototype.showModal,
          HTMLDialogElement.prototype.close, HTMLFormElement.prototype.submit][index]),
      ownMethod: Object.hasOwn(document.querySelector("dialog"), "showModal")
    }))).toEqual({ legacy: forceLegacy, preserved: true, ownMethod: false });
    await expect(page.locator("style[data-ae-dialog-polyfill-style]")).toHaveCount(0);
    expect(await page.locator("dialog").evaluate(dialog => {
      $ae(dialog).dialog.show();
      const open = dialog.open;
      $ae(dialog).dialog.close();
      return open;
    })).toBe(true);
    await page.locator("dialog").evaluate(dialog => $ae(dialog).dialog.showModal());
    await expect(page.locator("dialog")).toBeVisible();
    await page.locator("dialog").evaluate(dialog => $ae(dialog).dialog.close("native"));
    await expect(page.locator("dialog")).toBeHidden();
    expect(await page.locator("dialog").evaluate(dialog => dialog.returnValue)).toBe("native");
  });
}

for (const missingAPI of [false, true]) {
  test(`Dialog lifecycle releases controllers and reuses registrations, missingAPI=${missingAPI}`, async ({ page }) => {
    await page.goto("/tests/index.htm");
    if (missingAPI) await removeDialogAPI(page);
    await page.addScriptTag({ url: "/dist/aellux.js" });
    await page.evaluate(() => {
      document.body.innerHTML = '<dialog id="first">First</dialog><dialog id="second">Second</dialog>';
      AelluxJs.ext("dialog");
    });
    await initialize(page, { mode: "basic" });
    expect(await page.evaluate(async () => {
      const first = document.getElementById("first");
      const second = document.getElementById("second");
      const methods = [first.show, first.showModal, first.close];
      const controller = $ae(first);
      const namespace = controller.dialog;
      await $ae.mount(first);
      const sameNamespace = namespace === $ae(first).dialog;
      $ae(second).dialog.showModal();
      await $ae.unmount(first);
      const cleared = !controller.dialog && !namespace.showModal;
      const otherStillOpen = second.open;
      $ae(second).dialog.close();
      await $ae.mount(first);
      $ae(first).dialog.showModal();
      $ae(first).dialog.close("remounted");
      const formSubmit = HTMLFormElement.prototype.submit;
      await AelluxJs.destroyExtensions(["dialog"]);
      const destroyed = !controller.dialog;
      // The fallback's native-style methods remain usable without a controller.
      first.show();
      const usableAfterDestroy = first.open;
      first.close();
      AelluxJs.ext("dialog");
      await AelluxJs.wait("dialog");
      const fresh = document.createElement("dialog");
      document.body.appendChild(fresh);
      await $ae.mount(document);
      $ae(fresh).dialog.showModal();
      const reinitialized = fresh.open && !!$ae(first).dialog;
      $ae(fresh).dialog.close();
      return {
        sameNamespace, cleared, otherStillOpen, destroyed, usableAfterDestroy, reinitialized,
        methodsPreserved: methods.every((method, index) => method === [first.show, first.showModal, first.close][index]),
        formSubmitPreserved: HTMLFormElement.prototype.submit === formSubmit
      };
    })).toEqual({
      sameNamespace: true, cleared: true, otherStillOpen: true, destroyed: true,
      usableAfterDestroy: true, reinitialized: true, methodsPreserved: true, formSubmitPreserved: true
    });
    await expect(page.locator("style[data-ae-dialog-polyfill-style]")).toHaveCount(missingAPI ? 1 : 0);
  });
}

test("controllers preserve native return values, argument lists and thrown exceptions", async ({ page }) => {
  await page.goto("/tests/index.htm");
  await page.addScriptTag({ url: "/dist/aellux.js" });
  await page.evaluate(() => {
    document.body.innerHTML = '<dialog id="forwarding"></dialog>';
    AelluxJs.ext("dialog");
  });
  await initialize(page, { mode: "basic" });
  expect(await page.evaluate(() => {
    const dialog = document.getElementById("forwarding");
    const controller = $ae(dialog).dialog;
    controller.show();
    let invalidState = false;
    try { controller.showModal(); } catch (error) { invalidState = error.name === "InvalidStateError"; }
    controller.close();
    const token = {};
    const failure = new Error("sentinel");
    let receiver = true;
    const args = [];
    for (const name of ["show", "showModal", "close"]) {
      dialog[name] = function (...values) { receiver = receiver && this === dialog; args.push(values); return token; };
    }
    const returns = [controller.show(), controller.showModal(1, 2), controller.close(undefined), controller.close("accepted")];
    dialog.close = () => { throw failure; };
    let sameException = false;
    try { controller.close(); } catch (error) { sameException = error === failure; }
    return { invalidState, receiver, returns: returns.every(value => value === token),
      args: args.map(values => ({ length: values.length, first: values[0] ?? null })), sameException };
  })).toEqual({ invalidState: true, receiver: true, returns: true, sameException: true,
    args: [{ length: 0, first: null }, { length: 2, first: 1 }, { length: 1, first: null }, { length: 1, first: "accepted" }] });
});

for (const mode of ["basic", "full"]) {
  test(`${mode} leaves fallback unloaded until Dialog is explicitly needed`, async ({ page }) => {
    const requests = [];
    page.on("request", request => requests.push(new URL(request.url()).pathname));
    await page.goto("/tests/index.htm");
    await removeDialogAPI(page);
    await page.addScriptTag({ url: "/dist/aellux.min.js" });
    await initialize(page, { mode, skipGlobalMount: true });
    expect(requests.filter(path => /aellux\.ext\.dialog/.test(path))).toEqual([]);
    expect(await page.evaluate(async mode => {
      const dialog = document.createElement("dialog");
      document.body.appendChild(dialog);
      if (mode === "basic") {
        await $ae.mount(dialog);
        if (typeof dialog.showModal === "function") return false;
        AelluxJs.ext("dialog", { loadWhen: "dialog" });
      }
      if (typeof dialog.showModal === "function") return false;
      await $ae.mount(dialog);
      $ae(dialog).dialog.showModal();
      const open = dialog.open;
      $ae(dialog).dialog.close();
      return open;
    }, mode)).toBe(true);
    expect(requests.filter(path => /aellux\.ext\.dialog.*\.js$/.test(path)))
      .toEqual(["/dist/aellux.ext.dialog.legacy.min.js"]);
  });
}

test("only the dedicated Legacy Dialog artifacts contain the polyfill and inline CSS", async () => {
  const directory = new URL("../../dist/", import.meta.url);
  const files = (await readdir(directory)).filter(file => file.endsWith(".js"));
  for (const file of files) {
    const code = await readFile(new URL(file, directory), "utf8");
    const dialogLegacy = /^aellux\.ext\.dialog\.legacy(?:\.min)?\.js$/.test(file);
    expect(code.includes("._dialog_overlay"), `${file} polyfill CSS`).toBe(dialogLegacy);
    expect(code.includes("forceRegisterDialog"), `${file} polyfill code`).toBe(dialogLegacy);
  }
  const manifest = JSON.parse(await readFile(new URL("aellux.extensions.min.json", directory), "utf8"));
  const dialog = manifest.extensions.dialog;
  expect(dialog.dependencies).toEqual([]);
  expect(dialog.style).toBeUndefined();
  for (const [runtime, suffix] of [["modern", ".min.js"], ["legacy", ".legacy.min.js"]]) {
    const code = await readFile(new URL(`aellux.ext.dialog${suffix}`, directory));
    expect(dialog.builds[runtime].integrity).toBe("sha384-" + createHash("sha384").update(code).digest("base64"));
  }
});
