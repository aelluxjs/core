import { expect, test } from "@playwright/test";

test("global element memory restores selected attributes and inline CSS", async ({ page }) => {
  await page.goto("/tests/index.htm");
  await page.addScriptTag({ url: "/dist/aellux.js" });

  const result = await page.evaluate(() => {
    const element = document.createElement("div");
    element.setAttribute("aria-label", "before");
    element.setAttribute("data-empty", "");
    element.style.setProperty("max-height", "20px", "important");
    element.style.setProperty("transform-origin", "20% 30%");
    element.style.setProperty("color", "red");
    document.body.append(element);

    const memory = AelluxJs.persist.element.save(
      element,
      ["aria-label", "data-empty", "hidden"],
      ["max-height", "transform-origin", "--panel-progress"]
    );
    const snapshot = JSON.parse(JSON.stringify({
      attributes: memory.attributes,
      cssProperties: memory.cssProperties
    }));

    element.setAttribute("aria-label", "after");
    element.removeAttribute("data-empty");
    element.setAttribute("hidden", "");
    element.style.setProperty("max-height", "100px");
    element.style.setProperty("transform-origin", "0% 0%");
    element.style.setProperty("--panel-progress", "1");
    element.style.setProperty("color", "blue");
    const restored = memory.restore();

    const state = {
      restored,
      label: element.getAttribute("aria-label"),
      emptyPresent: element.hasAttribute("data-empty"),
      emptyValue: element.getAttribute("data-empty"),
      hiddenPresent: element.hasAttribute("hidden"),
      height: element.style.getPropertyValue("max-height"),
      heightPriority: element.style.getPropertyPriority("max-height"),
      origin: element.style.getPropertyValue("transform-origin"),
      progress: element.style.getPropertyValue("--panel-progress"),
      color: element.style.getPropertyValue("color"),
      legacyAttrMem: "attrMem" in AelluxJs,
      existingStorage: typeof AelluxJs.persist.local.set
    };
    element.remove();
    return { snapshot, state };
  });

  const originValue = result.snapshot.cssProperties["transform-origin"].value;
  expect(originValue).toMatch(/^20% 30%(?: 0px)?$/);
  expect(result.snapshot).toEqual({
    attributes: {
      "aria-label": { present: true, value: "before" },
      "data-empty": { present: true, value: "" },
      hidden: { present: false, value: null }
    },
    cssProperties: {
      "max-height": { present: true, value: "20px", priority: "important" },
      "transform-origin": { present: true, value: originValue, priority: "" },
      "--panel-progress": { present: false, value: "", priority: "" }
    }
  });
  expect(result.state).toEqual({
    restored: true,
    label: "before",
    emptyPresent: true,
    emptyValue: "",
    hiddenPresent: false,
    height: "20px",
    heightPriority: "important",
    origin: originValue,
    progress: "",
    color: "blue",
    legacyAttrMem: false,
    existingStorage: "function"
  });
});

test("element memories are independent and restore detached elements", async ({ page }) => {
  await page.goto("/tests/index.htm");
  await page.addScriptTag({ url: "/dist/aellux.js" });

  const result = await page.evaluate(() => {
    const element = document.createElement("div");
    element.setAttribute("title", "first");
    document.body.append(element);
    const first = $ae.persist.element.save(element, ["title"], []);
    element.setAttribute("title", "second");
    const second = $ae.persist.element.save(element, ["title"], []);
    element.remove();
    element.setAttribute("title", "third");
    const secondRestored = second.restore();
    const secondValue = element.getAttribute("title");
    const firstRestored = first.restore();
    return {
      sameAlias: $ae === AelluxJs,
      secondRestored,
      secondValue,
      firstRestored,
      firstValue: element.getAttribute("title"),
      attached: element.isConnected
    };
  });

  expect(result).toEqual({
    sameAlias: true,
    secondRestored: true,
    secondValue: "second",
    firstRestored: true,
    firstValue: "first",
    attached: false
  });
});
