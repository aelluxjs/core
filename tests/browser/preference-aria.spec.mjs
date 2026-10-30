import { expect, test } from "@playwright/test";

for (const mode of ["basic", "full"]) for (const forceLegacy of [false, true]) {
  test(`Preference owns option-button pressed state and restores it (${mode}, legacy=${forceLegacy})`, async ({ page }) => {
    await page.goto("/tests/index.htm");
    await page.addScriptTag({ url: forceLegacy ? "/dist/aellux.min.js" : "/dist/aellux.js" });
    await page.evaluate(({ mode, forceLegacy }) => {
      document.body.innerHTML = `<section id="choices" data-ae-preference="color-scheme">
        <button id="auto" data-ae-option="auto">System</button>
        <button id="light" data-ae-option="light" aria-pressed="mixed">Light</button>
        <button id="dark" data-ae-option="dark" aria-pressed="false">Dark</button>
        <span id="role-button" role="button" tabindex="0" data-ae-option="dark">Dark alternative</span>
        <input id="input-button" type="button" data-ae-option="light" value="Light alternative">
        <label id="label" for="radio" data-ae-option="dark">Dark input</label>
        <input id="radio" type="radio">
        <span id="generic" data-ae-option="auto">System label</span>
        <button id="radio-button" role="radio" data-ae-option="auto">Radio semantics</button>
        <button id="next" data-ae-next>Next</button>
      </section><section data-ae-preference="text-scale">
        <button id="scale-default" data-ae-option="1">Default scale</button>
        <button id="scale-large" data-ae-option="1.5">Large scale</button>
      </section>`;
      $ae.persist.preferences.set("colorScheme", "dark");
      if (mode === "basic") $ae.ext("preference");
      $ae.init({ mode, forceLegacy });
    }, { mode, forceLegacy });
    await expect.poll(() => page.evaluate(() => !!$ae.ext.preference?.initialized)).toBe(true);
    const pressed = id => page.locator(`#${id}`).getAttribute("aria-pressed");
    await expect.poll(() => pressed("auto")).toBe("false");
    await expect.poll(() => pressed("light")).toBe("false");
    await expect.poll(() => pressed("dark")).toBe("true");
    await expect.poll(() => pressed("role-button")).toBe("true");
    await expect.poll(() => pressed("input-button")).toBe("false");
    await expect.poll(() => pressed("scale-default")).toBe("true");
    await expect.poll(() => pressed("scale-large")).toBe("false");
    for (const id of ["label", "radio", "generic", "radio-button", "next"]) expect(await pressed(id)).toBeNull();
    await expect(page.locator("#radio")).toBeChecked();

    await page.evaluate(() => $ae.on("PreferencesChange", () => {
      window.pressedAtChange = document.getElementById("light").getAttribute("aria-pressed");
    }));
    await page.getByRole("button", { name: "Light", exact: true }).click();
    await expect.poll(() => pressed("light")).toBe("true");
    await expect.poll(() => pressed("dark")).toBe("false");
    expect(await page.evaluate(() => window.pressedAtChange)).toBe("true");
    await page.evaluate(() => {
      $ae.ext.preference.set("colorScheme", "auto");
      $ae.ext.preference.update();
    });
    await expect.poll(() => pressed("auto")).toBe("true");

    // Removed options are released on the next affected update, even while detached.
    await page.evaluate(() => {
      window.removedOption = document.getElementById("role-button");
      window.removedOption.remove();
      document.getElementById("choices").insertAdjacentHTML("beforeend", '<button id="added" data-ae-option="light">Added</button>');
      $ae.ext.preference.set("colorScheme", "light");
      $ae.ext.preference.update();
    });
    expect(await page.evaluate(() => window.removedOption.getAttribute("aria-pressed"))).toBeNull();
    await expect.poll(() => pressed("added")).toBe("true");
    await page.evaluate(() => $ae.unmount("choices", "preference"));
    expect(await pressed("auto")).toBeNull();
    expect(await pressed("light")).toBe("mixed");
    expect(await pressed("dark")).toBe("false");
    expect(await pressed("added")).toBeNull();
    await page.evaluate(() => $ae.mount("choices", "preference"));
    await expect.poll(() => pressed("light")).toBe("true");
    await page.evaluate(() => $ae.destroyExtensions("preference"));
    expect(await pressed("auto")).toBeNull();
    expect(await pressed("light")).toBe("mixed");
    expect(await pressed("scale-default")).toBeNull();
  });
}
