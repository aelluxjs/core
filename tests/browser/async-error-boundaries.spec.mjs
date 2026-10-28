import { expect, test } from "@playwright/test";

for (const forceLegacy of [false, true]) {
  test(`automatic navigation and Viewport failures reach application listeners (legacy=${forceLegacy})`, async ({ page }) => {
    const uncaught = [];
    page.on("pageerror", error => uncaught.push(error.message));
    await page.goto("/tests/index.htm");
    await page.addScriptTag({ url: "/dist/aellux.js" });
    const result = await page.evaluate(async forceLegacy => {
      AelluxJs.ext("state-navigation", { load: false });
      AelluxJs.ext("viewport", { load: false });
      await new Promise(resolve => {
        AelluxJs.on("Ready", resolve, { once: true });
        AelluxJs.init({ mode: "basic", forceLegacy });
      });
      const navigation = await AelluxJs.wait("state-navigation");
      await AelluxJs.wait("viewport");
      window.asyncFailureEvents = [];
      const navigationError = new DOMException("History denied", "SecurityError");
      const push = history.pushState;
      history.pushState = () => { throw navigationError; };
      AelluxJs.on("StateNavigationError", event => asyncFailureEvents.push({
        operation: event.detail.operation, original: event.detail.error === navigationError
      }));
      AelluxJs.dispatch("PushState", { detail: { key: "panel", value: "open" } });
      let rejected = false;
      try { await navigation.setState("panel", "closed"); }
      catch (error) { rejected = error === navigationError; }
      history.pushState = push;

      const element = document.createElement("div");
      element.style.cssText = "width:100px;height:100px";
      element.setAttribute("data-ae-viewport", "");
      document.body.append(element);
      await AelluxJs.mount(element);
      const layout = AelluxJs.waitLayout;
      const viewportError = new Error("Viewport read failed");
      let fail = true;
      AelluxJs.waitLayout = { ...layout, read(id, ...args) {
        if (fail && id >= 6000000) return Promise.reject(viewportError);
        return layout.read(id, ...args);
      } };
      await new Promise(resolve => {
        AelluxJs.on("ViewportError", event => {
          asyncFailureEvents.push({ operation: event.detail.operation,
            original: event.detail.error === viewportError,
            includesSource: event.detail.elements.includes(element) });
          fail = false;
          resolve();
        }, { once: true });
        window.dispatchEvent(new Event("resize"));
      });
      await AelluxJs.mountManager.update(element);
      AelluxJs.waitLayout = layout;
      return { rejected, events: asyncFailureEvents };
    }, forceLegacy);
    expect(result).toEqual({ rejected: true, events: [
      { operation: "setState", original: true },
      { operation: "setState", original: true },
      { operation: "refresh", original: true, includesSource: true }
    ] });
    expect(uncaught).toEqual([]);
  });
}
