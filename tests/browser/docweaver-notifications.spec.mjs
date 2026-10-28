import { readFileSync } from "node:fs";
import { expect, test } from "@playwright/test";

// Read the current theme and its generated page instead of a frozen fixture.
const documents = [
  ["template", "../../templates/docweaver/docs-layout.eta.htm"],
  ["generated page", "../../docs/0.1.x/index.htm"]
].map(([label, path]) => [label, readFileSync(new URL(path, import.meta.url), "utf8")]);

for (const [label, html] of documents) for (const mode of ["basic", "full"]) for (const forceLegacy of [false, true]) {
  test(`Docweaver notifications survive subsequent clicks (${label}, ${mode}, legacy=${forceLegacy})`, async ({ page }) => {
    await page.goto("/tests/index.htm");
    await page.addStyleTag({ url: "/tests/fixtures/bootstrap-5.3.8.min.css" });
    await page.evaluate(html => {
      const parsed = new DOMParser().parseFromString(html.replace(/<%[\s\S]*?%>/g, ""), "text/html");
      document.body.replaceChildren(document.importNode(parsed.getElementById("toast-present-group"), true));
      for (const attr of parsed.body.attributes) {
        if (attr.name.startsWith("data-ae-")) document.body.setAttribute(attr.name, attr.value);
      }
      window.unpops = [];
      for (const member of document.querySelectorAll("[data-ae-present]")) {
        // Isolate outside-click behavior from the intended one-second expiry.
        member.setAttribute("data-ae-auto-unpop", "30s");
        member.addEventListener("AelluxJsBeforeUnpop", () => window.unpops.push(member.id));
      }
      for (const message of ["First", "Second", "Third"]) {
        const button = document.createElement("button");
        button.textContent = message;
        // AjaxHrefError arrives after the initiating click has propagated.
        button.onclick = () => setTimeout(() => $ae(document.body).feedback.error(message, null, "shake"), 0);
        document.body.appendChild(button);
      }
      const outside = document.createElement("button");
      outside.textContent = "Outside";
      document.body.appendChild(outside);
    }, html);
    await page.addScriptTag({ url: "/dist/aellux.min.js" });
    await page.evaluate(async ({ mode, forceLegacy }) => {
      if (mode === "basic") for (const name of ["present", "feedback"]) AelluxJs.ext(name, { loadStyle: true });
      AelluxJs.ext("progress");
      await new Promise(resolve => {
        AelluxJs.on("Ready", resolve, { once: true });
        AelluxJs.init({ mode, forceLegacy, skipGlobalMount: true });
      });
      await AelluxJs.mount(document);
    }, { mode, forceLegacy });

    await page.getByRole("button", { name: "First", exact: true }).click();
    await expect(page.locator("#toast-2")).toHaveText("First");
    await expect(page.locator("#toast-2")).toHaveClass(/ae--pop(?:\s|$)/);
    await page.getByRole("button", { name: "Second", exact: true }).click();
    await expect(page.locator("#toast-1")).toHaveText("Second");
    await expect(page.locator("#toast-1")).toHaveClass(/ae--pop(?:\s|$)/);
    await expect(page.locator("#toast-2")).toBeVisible();
    await expect(page.locator("#toast-2")).toHaveText("First");

    await page.getByRole("button", { name: "Third", exact: true }).click();
    await expect(page.locator("#toast-2")).toHaveText("Third");
    await expect(page.locator("#toast-1")).toHaveText("Second");
    await page.getByRole("button", { name: "Outside", exact: true }).click();
    await expect(page.locator("#toast-1")).toBeVisible();
    await expect(page.locator("#toast-2")).toBeVisible();
    expect(await page.evaluate(() => window.unpops)).toEqual([]);
    await expect(page.locator("#toast-present-group progress")).toHaveCount(2);
  });
}
