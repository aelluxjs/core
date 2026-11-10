import { expect, test } from "@playwright/test";

for (const forceLegacy of [false, true]) {
  test(`automatic navigation and Viewport failures reach application listeners (legacy=${forceLegacy})`, async ({ page }) => {
    const uncaught = [];
    page.on("pageerror", error => uncaught.push(error.message));
    await page.goto("/tests/index.htm");
    await page.addScriptTag({ url: "/dist/aellux.js" });
    const result = await page.evaluate(async forceLegacy => {
      aelluxJs.ext("state-navigation", { load: false });
      aelluxJs.ext("viewport", { load: false });
      await new Promise(resolve => {
        aelluxJs.on("Ready", resolve, { once: true });
        aelluxJs.init({ mode: "basic", forceLegacy });
      });
      const navigation = await aelluxJs.wait("state-navigation");
      await aelluxJs.wait("viewport");
      window.asyncFailureEvents = [];
      const navigationError = new DOMException("History denied", "SecurityError");
      const push = history.pushState;
      history.pushState = () => { throw navigationError; };
      aelluxJs.on("StateNavigationError", event => asyncFailureEvents.push({
        operation: event.detail.operation, original: event.detail.error === navigationError
      }));
      aelluxJs.dispatch("PushState", { detail: { key: "panel", value: "open" } });
      let rejected = false;
      try { await navigation.setState("panel", "closed"); }
      catch (error) { rejected = error === navigationError; }
      history.pushState = push;

      const element = document.createElement("div");
      element.style.cssText = "width:100px;height:100px";
      element.setAttribute("data-ae-viewport", "");
      document.body.append(element);
      await aelluxJs.mount(element);
      const layout = aelluxJs.waitLayout;
      const viewportError = new Error("Viewport read failed");
      let fail = true;
      aelluxJs.waitLayout = { ...layout, read(id, ...args) {
        if (fail && id >= 6000000) return Promise.reject(viewportError);
        return layout.read(id, ...args);
      } };
      await new Promise(resolve => {
        aelluxJs.on("ViewportError", event => {
          asyncFailureEvents.push({ operation: event.detail.operation,
            original: event.detail.error === viewportError,
            includesSource: event.detail.elements.includes(element) });
          fail = false;
          resolve();
        }, { once: true });
        window.dispatchEvent(new Event("resize"));
      });
      await aelluxJs.mountManager.update(element);
      aelluxJs.waitLayout = layout;
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
