import { expect, test } from "@playwright/test";

async function start(page, legacy, { markup = `<section id="panel" data-ae-focus-scope>
  <button id="one" data-ae-shortcut="keyboard:KeyI; gamepad:north">One <kbd id="hint" data-ae-shortcut-hint></kbd></button>
  <button id="two" data-ae-shortcut="keyboard:KeyI; gamepad:north">Two</button><input id="editor"></section>`,
  inputs = "point keyboard gamepad", focus = true, present = false } = {}) {
  await page.goto("/tests/index.htm");
  await page.addScriptTag({ url: "/dist/aellux.js" });
  await page.evaluate(({ markup, inputs, legacy, focus, present }) => {
    document.body.innerHTML = markup;
    document.documentElement.setAttribute("data-ae-inputs", inputs);
    window.padSlots = [];
    window.padReads = 0;
    window.commands = [];
    window.clicks = [];
    Object.defineProperty(navigator, "getGamepads", { configurable: true, value() { window.padReads++; return window.padSlots; } });
    window.connectPad = (index, id = "Xbox Wireless Controller") => {
      const pad = { index, id, connected: true, mapping: "standard", buttons: Array.from({ length: 17 }, () => ({ pressed: false, value: 0 })), axes: [0, 0, 0, 0] };
      window.padSlots[index] = pad;
      const event = new Event("gamepadconnected"); Object.defineProperty(event, "gamepad", { value: pad }); dispatchEvent(event);
    };
    window.disconnectPad = index => {
      const pad = window.padSlots[index]; window.padSlots[index] = null;
      const event = new Event("gamepaddisconnected"); Object.defineProperty(event, "gamepad", { value: pad }); dispatchEvent(event);
    };
    window.padButton = (index, button, pressed) => { window.padSlots[index].buttons[button] = { pressed, value: pressed ? 1 : 0 }; };
    document.addEventListener("click", event => { const button = event.target.closest("button"); if (button) window.clicks.push(button.id); });
    aelluxJs.on("InputCommand", event => window.commands.push({ ...event.detail.command, originalEvent: undefined, target: undefined }));
    aelluxJs.ext("input", { loadStyle: true });
    if (focus) aelluxJs.ext("focus");
    if (present) aelluxJs.ext("present");
    return new Promise(resolve => { aelluxJs.on("Ready", resolve, { once: true }); aelluxJs.init({ mode: "basic", forceLegacy: legacy }); });
  }, { markup, inputs, legacy, focus, present });
}

for (const legacy of [false, true]) test.describe(`Input / Focus (Legacy=${legacy})`, () => {
  test("only enabled adapter scripts load and nested scopes can enable a modality later", async ({ page }) => {
    const scripts = [];
    page.on("request", request => { if (/aellux\.input\..*\.js$/.test(request.url())) scripts.push(new URL(request.url()).pathname.split("/").pop()); });
    await start(page, legacy, { inputs: "keyboard" });
    expect(scripts).toEqual([`aellux.input.keyboard${legacy ? ".legacy" : ""}.js`]);
    expect(await page.evaluate(() => window.padReads)).toBe(0);
    await page.evaluate(async () => { document.getElementById("panel").setAttribute("data-ae-inputs", "keyboard gamepad"); await aelluxJs.mount("panel", "input"); });
    expect(scripts).toContain(`aellux.input.gamepad${legacy ? ".legacy" : ""}.js`);
    expect(scripts.some(name => name.includes(".point."))).toBe(false);
  });

  test("native mouse, Tab, Enter and text editing stay accessible without duplicate activation", async ({ page }) => {
    await start(page, legacy, { inputs: "point keyboard" });
    await page.locator("#one").focus();
    await expect(page.locator("#one")).toHaveClass(/ae--focus-player1/);
    await page.keyboard.press("Enter");
    expect(await page.evaluate(() => window.clicks)).toEqual(["one"]);
    await page.keyboard.press("Tab");
    await expect(page.locator("#two")).toBeFocused();
    expect(await page.evaluate(() => aelluxJs.ext.focus.getContext().element.id)).toBe("two");
    await page.keyboard.press("i");
    expect(await page.evaluate(() => window.clicks)).toEqual(["one", "two"]);
    await page.locator("#editor").focus();
    await page.keyboard.type("iii");
    await expect(page.locator("#editor")).toHaveValue("iii");
    expect(await page.evaluate(() => window.clicks.length)).toBe(2);
    await page.locator("#one").click();
    expect(await page.evaluate(() => window.clicks)).toEqual(["one", "two", "one"]);
    expect(await page.evaluate(() => window.padReads)).toBe(0);
  });

  test("independent contexts share panels and elements, constrain navigation and clean detached scopes", async ({ page }) => {
    await start(page, legacy);
    const result = await page.evaluate(() => {
      const focus = aelluxJs.ext.focus, panel = document.getElementById("panel"), one = document.getElementById("one");
      one.focus();
      focus.createContext(2, { scope: panel }); focus.createContext(3, { scope: panel });
      focus.setFocus(2, "two"); focus.setFocus(3, "one");
      const distinct = [focus.getContext(2).element.id, document.activeElement.id];
      focus.setFocus(2, "one");
      const classes = one.className;
      const invalid = focus.setFocus(2, document.body);
      focus.destroyContext(3);
      return { distinct, classes, invalid, after: one.className };
    });
    expect(result.distinct).toEqual(["two", "one"]);
    expect(result.classes).toContain("ae--focus-player1");
    expect(result.classes).toContain("ae--focus-player2");
    expect(result.classes).toContain("ae--focus-player3");
    expect(result.invalid).toBe(false);
    expect(result.after).not.toContain("ae--focus-player3");
    await page.locator("#panel").evaluate(element => element.remove());
    await expect.poll(() => page.evaluate(() => aelluxJs.ext.focus.getContext(2))).toBeNull();
  });

  test("Focus unmount clears programmatic contexts and remount restores native synchronization", async ({ page }) => {
    await start(page, legacy);
    await page.locator("#one").focus();
    await page.evaluate(async () => {
      aelluxJs.ext.focus.createContext(2, { scope: document.getElementById("panel") });
      aelluxJs.ext.focus.setFocus(2, "one");
      await aelluxJs.unmount("panel", "focus");
    });
    expect(await page.evaluate(() => aelluxJs.ext.focus.getContext(2))).toBeNull();
    await expect(page.locator("#one")).not.toHaveClass(/ae--focus-player/);
    await page.evaluate(() => aelluxJs.mount("panel", "focus"));
    await expect(page.locator("#one")).toHaveClass(/ae--focus-player1/);
    await page.evaluate(async () => {
      const detached = document.createElement("button"); detached.setAttribute("data-ae-point", "");
      document.body.append(detached); await aelluxJs.mount(detached, "input"); detached.remove();
    });
    await expect(page.locator("#one")).toHaveClass(/ae--focus-player1/);
  });

  test("modal isolation and prevented keyboard commands protect unrelated scopes", async ({ page }) => {
    await start(page, legacy, { markup: `<section id="panel" data-ae-focus-scope>
      <button id="one" data-ae-shortcut="keyboard:KeyI; gamepad:north">One</button>
      <dialog id="modal"><button id="two" data-ae-shortcut="gamepad:north">Two</button></dialog></section>` });
    await page.evaluate(() => {
      const focus = aelluxJs.ext.focus;
      focus.createContext(2, { scope: document.getElementById("panel") }); focus.setFocus(2, "one");
      aelluxJs.ext.input.registerRouter(() => 2);
      document.getElementById("modal").showModal();
      aelluxJs.ext.input.dispatchCommand({ deviceId: "test", source: "gamepad", code: "north", phase: "press" });
    });
    expect(await page.evaluate(() => window.clicks)).toEqual([]);
    await page.evaluate(() => { document.getElementById("modal").close(); document.getElementById("one").focus(); document.getElementById("one").addEventListener("keydown", event => event.preventDefault()); });
    await page.keyboard.press("i");
    expect(await page.evaluate(() => window.clicks)).toEqual([]);
  });

  test("identical shortcuts in separate panels follow their routed logical scope", async ({ page }) => {
    await start(page, legacy, { markup: `<section id="panel" data-ae-focus-scope><button id="one" data-ae-shortcut="gamepad:north">One</button></section>
      <section id="other" data-ae-focus-scope><button id="two" data-ae-shortcut="gamepad:north">Two</button></section>` });
    await page.evaluate(() => {
      const focus = aelluxJs.ext.focus, input = aelluxJs.ext.input;
      document.getElementById("one").focus();
      focus.createContext(2, { scope: document.getElementById("other") }); focus.setFocus(2, "two");
      input.registerRouter(command => command.deviceId === "secondary" ? 2 : undefined);
      for (const deviceId of ["secondary", "primary"]) input.dispatchCommand({ deviceId, source: "gamepad", code: "north", phase: "press" });
    });
    expect(await page.evaluate(() => window.clicks)).toEqual(["two", "one"]);
  });

  test("hidden documents suspend gamepad polling and resume without replaying held buttons", async ({ page }) => {
    await start(page, legacy);
    await page.locator("#one").focus();
    await page.evaluate(() => {
      window.connectPad(0);
      Object.defineProperty(document, "hidden", { configurable: true, value: true });
      document.dispatchEvent(new Event("visibilitychange"));
    });
    const reads = await page.evaluate(() => window.padReads);
    await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
    expect(await page.evaluate(() => window.padReads)).toBe(reads);
    await page.evaluate(() => {
      window.padButton(0, 3, true);
      Object.defineProperty(document, "hidden", { configurable: true, value: false });
      document.dispatchEvent(new Event("visibilitychange"));
    });
    await expect.poll(() => page.evaluate(() => window.padReads)).toBeGreaterThan(reads + 1);
    expect(await page.evaluate(() => window.clicks)).toEqual([]);
    await page.evaluate(() => window.padButton(0, 3, false));
    await expect.poll(() => page.evaluate(() => window.commands.some(command => command.phase === "release"))).toBe(true);
    await page.evaluate(() => window.padButton(0, 3, true));
    await expect.poll(() => page.evaluate(() => window.clicks)).toEqual(["one"]);
  });

  test("default gamepad routing navigates focus 1 and physical south has no implicit confirmation", async ({ page }) => {
    await start(page, legacy);
    await page.locator("#one").focus();
    await page.evaluate(() => { window.connectPad(0); window.padButton(0, 15, true); });
    await expect(page.locator("#two")).toBeFocused();
    await expect(page.locator("html")).toHaveAttribute("data-ae-gamepad", "true");
    await page.evaluate(() => { window.padButton(0, 15, false); window.padButton(0, 0, true); });
    await expect.poll(() => page.evaluate(() => window.commands.some(command => command.code === "south"))).toBe(true);
    expect(await page.evaluate(() => window.clicks)).toEqual([]);
    await page.evaluate(() => window.padButton(0, 3, true));
    await expect.poll(() => page.evaluate(() => window.clicks)).toEqual(["two"]);
    await page.keyboard.press("Shift");
    await expect(page.locator("html")).toHaveAttribute("data-ae-active-input", "keyboard");
    await expect(page.locator("html")).toHaveAttribute("data-ae-gamepad", "true");
  });

  test("two gamepads execute distinct shortcuts in one frame and routing can change, block and fall back", async ({ page }) => {
    await start(page, legacy);
    await page.evaluate(() => {
      const input = aelluxJs.ext.input, focus = aelluxJs.ext.focus;
      document.getElementById("one").focus();
      focus.createContext(2, { scope: document.getElementById("panel") }); focus.setFocus(2, "two");
      window.connectPad(0); window.connectPad(1, "DualSense Wireless Controller");
      const devices = input.devices();
      window.routes = new Map([[devices[0].deviceId, 1], [devices[1].deviceId, 2]]);
      window.removeRoute = input.registerRouter(command => window.routes.get(command.deviceId), { priority: 10 });
      window.padButton(0, 3, true); window.padButton(1, 3, true);
    });
    await expect.poll(() => page.evaluate(() => window.clicks)).toEqual(["one", "two"]);
    const result = await page.evaluate(() => {
      const input = aelluxJs.ext.input;
      const deviceId = input.devices()[0].deviceId;
      const send = () => input.dispatchCommand({ deviceId, source: "gamepad", code: "north", phase: "press" });
      window.routes.set(deviceId, 2); send();
      const removeBlock = input.registerRouter(() => null, { priority: 20 });
      send(); removeBlock();
      const invalid = input.registerRouter(() => 0, { priority: 30 }); send(); invalid();
      window.removeRoute(); send();
      return { clicks: window.clicks, ids: window.commands.filter(command => command.phase === "press").map(command => command.focusId) };
    });
    expect(result.clicks).toEqual(["one", "two", "two", "one"]);
    expect(result.ids).toEqual([1, 2, 2, 1]);
  });

  test("router precedence, cancellation, unknown contexts and lifecycle ownership never redirect invalid commands", async ({ page }) => {
    await start(page, legacy);
    const result = await page.evaluate(async () => {
      const input = aelluxJs.ext.input;
      document.getElementById("one").focus();
      const send = () => input.dispatchCommand({ deviceId: "keyboard", source: "keyboard", code: "KeyI", phase: "press" });
      const first = input.registerRouter(() => 1, { priority: 5 });
      const second = input.registerRouter(() => null, { priority: 5 }); send(); first(); send(); second();
      const unknown = input.registerRouter(() => 999); send(); unknown();
      const asyncRouter = input.registerRouter(() => Promise.reject(new Error("Invalid async router"))); send(); asyncRouter();
      const abort = new AbortController(); input.registerRouter(() => null, { signal: abort.signal }); send(); abort.abort(); send();
      aelluxJs.ext("router-owner");
      aelluxJs.extAttach("router-owner", { init() { input.registerRouter(() => null, { owner: "router-owner" }); }, destroy() {} });
      await aelluxJs.wait("router-owner"); send(); await aelluxJs.destroyExtensions("router-owner"); send();
      input.registerRouter(() => null, { owner: document.getElementById("panel") });
      send(); await aelluxJs.unmount("panel", "input"); send(); await aelluxJs.mount("panel", "input");
      const cancel = event => event.preventDefault();
      aelluxJs.on("BeforeInputCommand", cancel); send(); aelluxJs.off("BeforeInputCommand", cancel);
      return window.clicks;
    });
    expect(result).toEqual(["one", "one", "one", "one"]);
  });

  test("shortcuts choose proximity, priority and DOM order inside isolated eligible scopes", async ({ page }) => {
    await start(page, legacy, { markup: `<section id="panel" data-ae-focus-scope>
      <div id="near" data-ae-shortcut="keyboard:KeyI"><button id="one">Current</button></div>
      <button id="disabled" disabled data-ae-shortcut="keyboard:KeyI">Disabled</button>
      <button hidden data-ae-shortcut="keyboard:KeyI">Hidden</button>
      <div inert><button data-ae-shortcut="keyboard:KeyI">Inert</button></div>
      <section data-ae-focus-scope><button data-ae-shortcut="keyboard:KeyI">Other scope</button></section>
      <button id="two" data-ae-shortcut="keyboard:KeyI" data-ae-shortcut-priority="10">Two</button>
      <button id="three" data-ae-shortcut="keyboard:KeyI">Three</button></section>` });
    await page.evaluate(() => {
      window.actions = [];
      aelluxJs.ext.focus.registerShortcutAction("record", element => window.actions.push(element.id));
      document.querySelectorAll("[data-ae-shortcut]").forEach(element => element.setAttribute("data-ae-shortcut-action", "record"));
    });
    await page.locator("#one").focus(); await page.keyboard.press("i");
    expect(await page.evaluate(() => window.actions)).toEqual(["near"]);
    await page.locator("#near").evaluate(element => element.removeAttribute("data-ae-shortcut"));
    await page.keyboard.press("i");
    expect(await page.evaluate(() => window.actions)).toEqual(["near", "two"]);
    await page.evaluate(() => { document.getElementById("one").setAttribute("data-ae-shortcut", "keyboard:Ctrl+KeyI"); document.getElementById("one").setAttribute("data-ae-shortcut-action", "record"); });
    await page.keyboard.press("Control+i");
    expect(await page.evaluate(() => window.actions)).toEqual(["near", "two", "one"]);
  });

  test("hints use CSS text and independent per-focus families without requiring Focus", async ({ page }) => {
    await start(page, legacy, { focus: false, markup: `<kbd id="hint" data-ae-shortcut-hint="keyboard:KeyI; gamepad:north"></kbd>
      <kbd id="other" data-ae-shortcut-hint="gamepad:south" data-ae-shortcut-focus="2"></kbd>` });
    await expect(page.locator("#hint")).toHaveAttribute("data-ae-shortcut-label", "I");
    await page.evaluate(() => { aelluxJs.ext.input.setHintContext(1, { source: "gamepad", family: "xbox" }); aelluxJs.ext.input.setHintContext(2, { source: "gamepad", family: "playstation" }); });
    await expect(page.locator("#hint")).toHaveAttribute("data-ae-shortcut-label", "Y");
    await expect(page.locator("#other")).toHaveAttribute("data-ae-shortcut-label", "×");
    expect(await page.locator("#hint").evaluate(element => getComputedStyle(element, "::before").content)).toBe('"Y"');
    await page.evaluate(() => aelluxJs.ext.input.setHintContext(1, { source: "gamepad", family: "nintendo" }));
    await expect(page.locator("#hint")).toHaveAttribute("data-ae-shortcut-label", "X");
  });

  test("gamepad reconnect and index changes create new sessions; noise and disabled adapters stay idle", async ({ page }) => {
    await start(page, legacy);
    const first = await page.evaluate(() => { window.connectPad(0); return aelluxJs.ext.input.devices()[0].deviceId; });
    await page.evaluate(() => { window.padSlots[0].axes[0] = .08; });
    // Wait for real polling, then inspect the absence of intentional noise commands.
    await expect.poll(() => page.evaluate(() => window.padReads)).toBeGreaterThan(3);
    expect(await page.evaluate(() => window.commands.length)).toBe(0);
    await page.evaluate(() => window.disconnectPad(0));
    await expect(page.locator("html")).toHaveAttribute("data-ae-gamepad", "false");
    const second = await page.evaluate(() => { window.connectPad(0); return aelluxJs.ext.input.devices()[0].deviceId; });
    expect(second).not.toBe(first);
    const third = await page.evaluate(() => { window.disconnectPad(0); window.connectPad(3); return aelluxJs.ext.input.devices()[0]; });
    expect(third.deviceId).not.toBe(second); expect(third.index).toBe(3);
    await page.locator("html").evaluate(element => element.setAttribute("data-ae-inputs", "point keyboard"));
    await expect(page.locator("html")).toHaveAttribute("data-ae-gamepad", "false");
    const reads = await page.evaluate(() => window.padReads);
    await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
    expect(await page.evaluate(() => window.padReads)).toBe(reads);
  });

  test("destroy and remount release routers, listeners, hints and classes", async ({ page }) => {
    await start(page, legacy);
    await page.locator("#one").focus();
    await page.evaluate(async () => {
      window.oldInput = aelluxJs.ext.input;
      window.oldInput.registerRouter(() => null);
      await aelluxJs.destroyExtensions(["input", "focus"]);
    });
    await expect(page.locator("#one")).not.toHaveClass(/ae--focus-player1/);
    await expect(page.locator("#hint")).not.toHaveAttribute("data-ae-shortcut-label");
    await page.evaluate(async () => {
      aelluxJs.ext("input", { loadStyle: true }); aelluxJs.ext("focus");
      await Promise.all([aelluxJs.wait("input"), aelluxJs.wait("focus")]);
      await aelluxJs.mount(document);
    });
    await page.keyboard.press("i");
    expect(await page.evaluate(() => window.clicks)).toEqual(["one"]);
    expect(await page.evaluate(() => window.oldInput.resolveFocusId({ deviceId: "keyboard" }))).toBe(1);
  });

  test("Present shortcut actions use the existing controllers", async ({ page }) => {
    await start(page, legacy, { present: true, markup: `<section data-ae-focus-scope>
      <button id="one" data-ae-shortcut="keyboard:KeyI" data-ae-shortcut-action="pop" data-ae-shortcut-target="details">Open</button>
      <div id="details" data-ae-present hidden>Details</div></section>` });
    await page.locator("#one").focus(); await page.keyboard.press("i");
    await expect(page.locator("#details")).toBeVisible();
    await page.locator("#one").evaluate(element => element.setAttribute("data-ae-shortcut-action", "dismiss"));
    await page.keyboard.press("i");
    await expect(page.locator("#details")).toBeHidden();
  });
});
