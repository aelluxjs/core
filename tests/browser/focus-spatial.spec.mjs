import { expect, test } from "@playwright/test";

const layout = `<section id="panel" data-ae-focus-scope style="position:relative;width:500px;height:400px">
  <button id="a" style="left:0;top:0">A</button><button id="h" style="left:240px;top:200px">H</button>
  <button id="d" style="left:0;top:100px">D</button><button id="b" style="left:120px;top:0">B</button>
  <button id="f" style="left:0;top:200px">F</button><button id="e" style="left:240px;top:100px">E</button>
  <button id="g" style="left:120px;top:200px">G</button></section>`;

async function start(page, legacy, markup = layout, inputs = "keyboard gamepad", mode = "basic") {
  await page.goto("/tests/index.htm");
  await page.addStyleTag({ content: "#panel > button { position:absolute;width:70px;height:40px }" });
  await page.addScriptTag({ url: "/dist/aellux.js" });
  await page.evaluate(({ markup, inputs, legacy, mode }) => {
    document.body.innerHTML = markup;
    document.documentElement.setAttribute("data-ae-inputs", inputs);
    window.pads = [];
    Object.defineProperty(navigator, "getGamepads", { configurable: true, value: () => window.pads });
    window.connectPad = index => {
      const pad = { index, id: "Xbox Controller", mapping: "standard", connected: true,
        buttons: Array.from({ length: 17 }, () => ({ pressed: false, value: 0 })), axes: [0, 0, 0, 0] };
      window.pads[index] = pad;
      const event = new Event("gamepadconnected"); Object.defineProperty(event, "gamepad", { value: pad }); dispatchEvent(event);
    };
    window.send = (action, source = "gamepad", deviceId = "test") => AelluxJs.ext.input.dispatchCommand({
      deviceId, source, code: action, action: `navigate-${action}`, phase: "press" });
    if (mode === "basic") { AelluxJs.ext("focus"); AelluxJs.ext("input"); }
    return new Promise(resolve => { AelluxJs.on("Ready", resolve, { once: true }); AelluxJs.init({ mode, forceLegacy: legacy }); });
  }, { markup, inputs, legacy, mode });
}

for (const legacy of [false, true]) test.describe(`Spatial Focus (Legacy=${legacy})`, () => {
  test("Full activates from focus-nav alone and only consumes arrows that move focus", async ({ page }) => {
    await start(page, legacy, `<nav data-ae-focus-nav="spatial"><button id="a">A</button><button id="b" tabindex="-1">B</button></nav>`, "keyboard", "full");
    await page.locator("#a").focus();
    const send = () => page.evaluate(() => document.activeElement.dispatchEvent(new KeyboardEvent("keydown", {
      key: "ArrowRight", code: "ArrowRight", bubbles: true, cancelable: true })));
    expect(await send()).toBe(false);
    await expect(page.locator("#b")).toBeFocused(); await expect(page.locator("#b")).toHaveAttribute("tabindex", "-1");
    expect(await send()).toBe(true);
    await expect(page.locator("#b")).toBeFocused();
  });
  test("keyboard auto, spatial, nested native, none, dynamic policies and native Tab", async ({ page }) => {
    await start(page, legacy);
    await page.locator("#a").focus();
    await page.keyboard.press("ArrowRight"); await expect(page.locator("#a")).toBeFocused();
    await page.keyboard.press("Tab"); await expect(page.locator("#h")).toBeFocused();
    await page.keyboard.press("Shift+Tab"); await expect(page.locator("#a")).toBeFocused();
    await page.locator("#panel").evaluate(el => el.setAttribute("data-ae-focus-nav", "spatial"));
    await page.keyboard.press("ArrowRight"); await expect(page.locator("#b")).toBeFocused();
    await page.keyboard.press("ArrowDown"); await expect(page.locator("#g")).toBeFocused();
    await page.evaluate(() => {
      const group = document.createElement("div"); group.id = "nativeRegion"; group.setAttribute("data-ae-focus-nav", "native");
      document.getElementById("panel").append(group);
      for (const id of ["g", "h"]) { const el = document.getElementById(id); el.style.position = "absolute"; group.append(el); }
    });
    await page.locator("#g").focus();
    await page.keyboard.press("ArrowRight"); await expect(page.locator("#g")).toBeFocused();
    expect(await page.evaluate(() => window.send("right"))).toBe(true);
    await expect(page.locator("#h")).toBeFocused();
    await page.locator("#nativeRegion").evaluate(el => el.setAttribute("data-ae-focus-nav", "none"));
    expect(await page.evaluate(() => window.send("left"))).toBe(false);
    await expect(page.locator("#h")).toBeFocused();
    await page.locator("#nativeRegion").evaluate(el => el.removeAttribute("data-ae-focus-nav"));
    expect(await page.evaluate(() => window.send("left"))).toBe(true);
    await expect(page.locator("#g")).toBeFocused();
  });

  test("native editing, ARIA widgets, IME, modifiers and already handled commands keep their keys", async ({ page }) => {
    await start(page, legacy, `<section data-ae-focus-nav="spatial">
      <input id="text" value="abcd"><textarea id="textarea">abcd</textarea><select id="select"><option>A</option><option>B</option></select>
      <input id="range" type="range" value="20"><input id="number" type="number" value="2">
      <div id="editable" contenteditable>abcd</div><div role="tablist"><button id="tab" role="tab">Tab</button></div>
      <div role="grid"><button id="cell">Cell</button></div><button id="plain">Plain</button><button id="next">Next</button></section>`);
    await page.locator("#text").focus();
    await page.locator("#text").evaluate(el => el.setSelectionRange(2, 2));
    await page.keyboard.press("ArrowLeft");
    expect(await page.locator("#text").evaluate(el => el.selectionStart)).toBe(1);
    for (const id of ["textarea", "select", "range", "number", "editable", "tab", "cell"]) {
      await page.locator(`#${id}`).focus(); await page.keyboard.press("ArrowRight");
      await expect(page.locator(`#${id}`)).toBeFocused();
    }
    await page.locator("#plain").focus();
    expect(await page.evaluate(() => {
      const el = document.activeElement;
      const send = options => el.dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, cancelable: true, code: "ArrowRight", key: "ArrowRight", ...options }));
      return [send({ isComposing: true }), send({ ctrlKey: true }), send({ altKey: true }), send({ shiftKey: true }), send({ metaKey: true })];
    })).toEqual([true, true, true, true, true]);
    await page.locator("#plain").evaluate(el => el.addEventListener("keydown", event => event.preventDefault()));
    await page.keyboard.press("ArrowRight"); await expect(page.locator("#plain")).toBeFocused();
  });

  test("irregular geometry, responsive relocation, no wrap and consumption only after movement", async ({ page }) => {
    await start(page, legacy);
    await page.locator("#d").focus();
    expect(await page.evaluate(() => window.send("right"))).toBe(true); await expect(page.locator("#e")).toBeFocused();
    expect(await page.evaluate(() => window.send("right"))).toBe(false); await expect(page.locator("#e")).toBeFocused();
    await page.locator("#d").focus(); await page.evaluate(() => window.send("up")); await expect(page.locator("#a")).toBeFocused();
    await page.locator("#d").focus(); await page.evaluate(() => window.send("down")); await expect(page.locator("#f")).toBeFocused();
    await page.addStyleTag({ content: "@media (max-width: 600px) { #b { left:240px !important } #h { left:120px !important;top:0 !important } }" });
    await page.setViewportSize({ width: 550, height: 500 });
    await page.locator("#a").focus(); await page.evaluate(() => window.send("right")); await expect(page.locator("#h")).toBeFocused();
    const changes = await page.evaluate(() => {
      let count = 0; AelluxJs.on("FocusChange", () => count++);
      window.send("right"); return count;
    });
    expect(changes).toBe(1);
    await expect(page.locator("#b")).not.toHaveAttribute("tabindex");
  });

  test("disabled, hidden, inert, closed presentations and zero geometry are excluded", async ({ page }) => {
    await start(page, legacy, `<section data-ae-focus-scope>
      <button id="origin">Origin</button><div style="position:relative;height:100px">
      <button disabled style="position:absolute;left:0">Disabled</button>
      <fieldset disabled><button>Fieldset</button></fieldset><div inert><button>Inert</button></div>
      <div style="visibility:hidden"><button>Hidden</button></div><button hidden>Hidden</button>
      <div style="opacity:0"><button>Transparent</button></div>
      <div style="content-visibility:hidden"><button>Content hidden</button></div>
      <div data-ae-present class="ae--dismissed"><button>Closed</button></div>
      <button style="width:0;height:0;padding:0;border:0">Zero</button>
      <button id="target" style="position:absolute;left:0;top:200px">Target</button></div></section>`);
    await page.locator("#origin").focus();
    await page.evaluate(() => window.send("down")); await expect(page.locator("#target")).toBeFocused();
  });

  test("nearest scopes, programmatic scopes, closed modals and open modal isolation", async ({ page }) => {
    await start(page, legacy, `<section id="outer" data-ae-focus-scope>
      <section id="inner" data-ae-focus-scope><button id="a">A</button><button id="b">B</button></section>
      <button id="outside">Outside</button><dialog id="modal"><button id="modalTarget">Modal</button></dialog>
      <section aria-modal="true" hidden><button>Inactive modal</button></section></section>`);
    await page.locator("#a").focus(); await page.evaluate(() => window.send("right")); await expect(page.locator("#b")).toBeFocused();
    expect(await page.evaluate(() => window.send("right"))).toBe(false);
    await page.evaluate(() => {
      AelluxJs.ext.focus.createContext(2, { scope: document.getElementById("inner") });
      AelluxJs.ext.focus.setFocus(2, "a"); AelluxJs.ext.input.registerRouter(() => 2);
      document.getElementById("modal").showModal();
    });
    expect(await page.evaluate(() => window.send("right"))).toBe(false);
    expect(await page.evaluate(() => AelluxJs.ext.focus.getContext(2).element.id)).toBe("a");
  });

  test("two routed gamepads move independent contexts with D-pad and stick and clean disconnect metadata", async ({ page }) => {
    await start(page, legacy);
    await page.locator("#a").focus();
    await page.evaluate(() => {
      const focus = AelluxJs.ext.focus, input = AelluxJs.ext.input;
      focus.createContext(2, { scope: document.getElementById("panel") }); focus.setFocus(2, "a");
      window.connectPad(0); window.connectPad(1);
      const devices = input.devices(); window.pad2 = devices[1].deviceId;
      input.registerRouter(command => command.deviceId === window.pad2 ? 2 : undefined);
      window.pads[0].buttons[15] = { pressed: true, value: 1 }; window.pads[1].axes[1] = 1;
    });
    await expect(page.locator("#b")).toBeFocused();
    await expect.poll(() => page.evaluate(() => AelluxJs.ext.focus.getContext(2).element.id)).toBe("d");
    await page.evaluate(() => { window.pads[0].buttons[15] = { pressed: false, value: 0 }; window.pads[1].axes[1] = 0; });
    await expect(page.locator("#b")).toHaveClass(/ae--focus-player1/);
    await expect(page.locator("#d")).toHaveClass(/ae--focus-player2/);
    await page.evaluate(() => AelluxJs.ext.focus.setFocus(2, "b"));
    await expect(page.locator("#b")).toHaveClass(/ae--focus-player1/); await expect(page.locator("#b")).toHaveClass(/ae--focus-player2/);
    await page.evaluate(() => {
      const pad = window.pads[1]; window.pads[1] = null;
      const event = new Event("gamepaddisconnected"); Object.defineProperty(event, "gamepad", { value: pad }); dispatchEvent(event);
    });
    expect(await page.evaluate(() => AelluxJs.ext.input.devices().some(device => device.deviceId === window.pad2))).toBe(false);
    await page.evaluate(() => {
      const hint = document.createElement("kbd"); hint.id = "padHint";
      hint.setAttribute("data-ae-shortcut-hint", "keyboard:KeyI; gamepad:north"); hint.setAttribute("data-ae-shortcut-focus", "2");
      document.body.append(hint); return AelluxJs.mount(hint, "input");
    });
    await expect(page.locator("#padHint")).toHaveAttribute("data-ae-shortcut-label", "I");
  });

  test("independent context defaults, none, and application adapters with explicit spatial policy", async ({ page }) => {
    await start(page, legacy);
    const result = await page.evaluate(async () => {
      const focus = AelluxJs.ext.focus, panel = document.getElementById("panel");
      document.getElementById("a").focus(); focus.createContext(2, { scope: panel }); focus.setFocus(2, "a");
      const off = AelluxJs.ext.input.registerRouter(() => 2);
      const moved = window.send("right", "keyboard");
      panel.setAttribute("data-ae-focus-nav", "none"); const blocked = window.send("down", "keyboard");
      off(); panel.setAttribute("data-ae-focus-nav", "auto");
      document.documentElement.setAttribute("data-ae-inputs", "keyboard gamepad remote");
      AelluxJs.ext.input.registerAdapter("remote", () => ({ init() {}, destroy() {} }));
      await AelluxJs.mount(document, "input");
      const auto = window.send("right", "remote");
      panel.setAttribute("data-ae-focus-nav", "spatial");
      const spatial = window.send("right", "remote");
      return { moved, blocked, auto, spatial, logical: focus.getContext(2).element.id, native: document.activeElement.id };
    });
    expect(result).toEqual({ moved: true, blocked: false, auto: false, spatial: true, logical: "b", native: "b" });
  });

  test("offscreen targets scroll inside their scope, including logical contexts and Scrollbox", async ({ page }) => {
    await start(page, legacy, `<div id="scroller" data-ae-focus-scope data-ae-scrollbox style="height:100px;width:200px;overflow:auto">
      <button id="a">A</button><div style="height:500px"></div><button id="b">B</button></div>`);
    await page.evaluate(async () => {
      AelluxJs.ext("scrollbox"); await AelluxJs.wait("scrollbox"); await AelluxJs.mount(document);
      document.getElementById("a").focus();
      AelluxJs.ext.focus.createContext(2, { scope: document.getElementById("scroller") });
      AelluxJs.ext.focus.setFocus(2, "a"); AelluxJs.ext.input.registerRouter(() => 2);
    });
    expect(await page.evaluate(() => window.send("down"))).toBe(true);
    await expect.poll(() => page.locator("#scroller").evaluate(el => el.scrollTop)).toBeGreaterThan(400);
    await expect(page.locator("#a")).toBeFocused();
    expect(await page.evaluate(() => AelluxJs.ext.focus.getContext(2).element.id)).toBe("b");
  });

  test("removal, insertion, unmount, remount, destroy and history keep their lifecycle", async ({ page }) => {
    await start(page, legacy);
    await page.locator("#a").focus(); await page.evaluate(() => window.send("right"));
    expect(await page.evaluate(() => AelluxJs.ext.focus.restoreLastFocus())).toBe(true); await expect(page.locator("#a")).toBeFocused();
    await page.evaluate(() => {
      const focus = AelluxJs.ext.focus; focus.createContext(2, { scope: document.getElementById("panel") }); focus.setFocus(2, "b");
      document.getElementById("b").remove();
    });
    await expect.poll(() => page.evaluate(() => AelluxJs.ext.focus.getContext(2).element)).toBeNull();
    await page.evaluate(async () => {
      const button = document.createElement("button"); button.id = "new"; button.style.cssText = "left:120px;top:0";
      document.getElementById("panel").append(button); await AelluxJs.mount("panel"); window.send("right");
    });
    await expect(page.locator("#new")).toBeFocused();
    await page.evaluate(() => AelluxJs.unmount("panel", "focus"));
    expect(await page.evaluate(() => AelluxJs.ext.focus.getContext(2))).toBeNull();
    await page.evaluate(() => AelluxJs.mount("panel", "focus")); await expect(page.locator("#new")).toHaveClass(/ae--focus-player1/);
    await page.evaluate(() => AelluxJs.destroyExtensions("focus")); await expect(page.locator("#new")).not.toHaveClass(/ae--focus-player1/);
    await page.evaluate(async () => { AelluxJs.ext("focus"); await AelluxJs.wait("focus"); await AelluxJs.mount(document); });
    await page.evaluate(() => window.send("left")); await expect(page.locator("#a")).toBeFocused();
  });

  test("native focus history survives controls focused during presentation opening preparation", async ({ page }) => {
    await start(page, legacy, `<button id="trigger">Open</button><section id="opening" data-ae-present class="ae--dismissed" style="opacity:0"><input id="field"><button id="done">Done</button></section>`);
    await page.locator("#trigger").focus();
    await page.locator("#field").focus();
    await page.locator("#done").focus();
    expect(await page.evaluate(() => {
      document.getElementById("opening").hidden = true;
      return AelluxJs.ext.focus.restoreLastFocus();
    })).toBe(true);
    await expect(page.locator("#trigger")).toBeFocused();
  });
});
