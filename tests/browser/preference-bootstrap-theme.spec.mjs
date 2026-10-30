import { expect, test } from "@playwright/test";

const variants = [
  { mode: "basic", forceLegacy: false, minified: false },
  { mode: "basic", forceLegacy: true, minified: true },
  { mode: "full", forceLegacy: false, minified: true },
  { mode: "full", forceLegacy: true, minified: false }
];

for (const variant of variants) {
  const label = `${variant.mode}, legacy=${variant.forceLegacy}, minified=${variant.minified}`;
  test(`syncBootstrapThemeTag follows resolved preferences and restores ownership (${label})`, async ({ page }) => {
    await page.goto("/tests/index.htm");
    await page.emulateMedia({ colorScheme: "light" });
    await page.addStyleTag({ url: "/tests/fixtures/bootstrap-5.3.8.min.css" });
    await page.addScriptTag({ url: variant.minified ? "/dist/aellux.min.js" : "/dist/aellux.js" });
    const previousTheme = variant.forceLegacy ? null : "application-theme";
    await page.evaluate(({ variant, previousTheme }) => {
      if (previousTheme !== null) document.documentElement.setAttribute("data-bs-theme", previousTheme);
      document.body.innerHTML = `<div data-ae-preference="color-scheme">
        <button data-ae-option="light">Light</button>
        <button data-ae-option="dark">Dark</button>
      </div>`;
      window.themeNotifications = [];
      $ae.on("PreferencesChange", event => window.themeNotifications.push({
        theme: document.documentElement.getAttribute("data-bs-theme"),
        resolved: $ae.currentPreference("color-scheme"),
        changed: event.detail.changed
      }));
      $ae.persist.preferences.set("colorScheme", "dark");
      if (variant.mode === "basic") $ae.ext("preference");
      $ae.init({
        mode: variant.mode,
        forceLegacy: variant.forceLegacy,
        extensions: { preference: { syncBootstrapThemeTag: true } }
      });
    }, { variant, previousTheme });

    const root = page.locator("html");
    await expect.poll(() => page.evaluate(() => !!$ae.ext.preference?.initialized)).toBe(true);
    await expect(root).toHaveAttribute("data-bs-theme", "dark");
    await expect(page.locator("body")).toHaveCSS("background-color", "rgb(33, 37, 41)");
    expect(await page.evaluate(() => window.themeNotifications[0].theme)).toBe("dark");

    // Saving a preference alone retains the existing publication contract.
    await page.evaluate(() => $ae.ext.preference.set("colorScheme", "light"));
    await expect(root).toHaveAttribute("data-bs-theme", "dark");
    await page.evaluate(() => $ae.ext.preference.update());
    await expect(root).toHaveAttribute("data-bs-theme", "light");
    await expect(page.locator("body")).toHaveCSS("background-color", "rgb(255, 255, 255)");
    await page.getByRole("button", { name: "Dark", exact: true }).click();
    await expect(root).toHaveAttribute("data-bs-theme", "dark");

    await page.evaluate(() => {
      $ae.ext.preference.set("colorScheme", "auto");
      $ae.ext.preference.update();
    });
    await expect(root).toHaveAttribute("data-bs-theme", "light");
    await page.emulateMedia({ colorScheme: "dark" });
    await expect(root).toHaveAttribute("data-bs-theme", "dark");
    // The raw preference remains auto; device changes can have no changed keys.
    expect(await page.evaluate(() => window.themeNotifications.at(-1).changed)).toEqual([]);

    const writer = await page.context().newPage();
    await writer.goto("/tests/index.htm");
    await writer.evaluate(() => localStorage.setItem("AelluxJsPreferences", "colorScheme=light"));
    await expect(root).toHaveAttribute("data-bs-theme", "light");
    await writer.close();
    expect(await page.evaluate(() => window.themeNotifications.every(event => event.theme === event.resolved))).toBe(true);

    await page.evaluate(() => $ae.destroyExtensions("preference"));
    expect(await root.getAttribute("data-bs-theme")).toBe(previousTheme);
    await page.emulateMedia({ colorScheme: "light" });
    expect(await root.getAttribute("data-bs-theme")).toBe(previousTheme);
  });
}

for (const mode of ["basic", "full"]) {
  for (const enabled of [undefined, false]) {
    test(`Bootstrap theme remains application owned when option is ${enabled} (${mode})`, async ({ page }) => {
      await page.goto("/tests/index.htm");
      await page.addScriptTag({ url: "/dist/aellux.js" });
      await page.evaluate(({ mode, enabled }) => {
        document.documentElement.setAttribute("data-bs-theme", "application-theme");
        $ae.persist.preferences.set("colorScheme", "dark");
        if (mode === "basic") $ae.ext("preference");
        $ae.init({ mode, extensions: { preference: { syncBootstrapThemeTag: enabled } } });
      }, { mode, enabled });
      await expect.poll(() => page.evaluate(() => !!$ae.ext.preference?.initialized)).toBe(true);
      await expect(page.locator("html")).toHaveAttribute("data-bs-theme", "application-theme");
      await page.evaluate(() => {
        $ae.ext.preference.set("colorScheme", "light");
        $ae.ext.preference.update();
        document.documentElement.removeAttribute("data-bs-theme");
        $ae.ext.preference.update();
      });
      expect(await page.locator("html").getAttribute("data-bs-theme")).toBeNull();
      await page.evaluate(() => $ae.destroyExtensions("preference"));
      expect(await page.locator("html").getAttribute("data-bs-theme")).toBeNull();
    });
  }
}
