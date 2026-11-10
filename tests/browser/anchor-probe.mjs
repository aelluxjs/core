// Test-only observation of scheduler operations; no runtime hooks.
export async function installAnchorProbe(page) {
  await page.evaluate(() => {
    const scheduler = aelluxJs.waitLayout;
    window.switchProbe = { operations: [] };
    window.waitAnchor = async predicate => {
      const deadline = performance.now() + 3000;
      do {
        await new Promise(requestAnimationFrame);
        if (predicate()) return;
      } while (performance.now() < deadline);
      throw new Error("Anchor did not reach the expected animation frame");
    };
    window.waitAnchorFrame = async (operation, age) => {
      await waitAnchor(() => operation.frames.some(frame => frame.switching && frame.at - operation.at >= age));
      return operation.frames.find(frame => frame.switching && frame.at - operation.at >= age);
    };
    aelluxJs.waitLayout = { ...scheduler, sequence(id, ...stages) {
      const anchor = document.getElementById("indicator");
      if (id < 4000000 || !anchor?.classList.contains("ae--anchor-switching")) return scheduler.sequence(id, ...stages);
      const operation = { id, target: anchor.getAttribute("data-ae-anchor-target"), at: performance.now(), frames: [] };
      switchProbe.operations.push(operation);
      return scheduler.sequence(id, ...stages.map(stage => ({ ...stage, update: (...args) => {
        const result = stage.update?.(...args);
        const value = name => parseFloat(anchor.style.getPropertyValue(name));
        operation.frames.push({ at: performance.now(), switching: anchor.classList.contains("ae--anchor-switching"),
          width: value("--ae-anchor-target-width"), height: value("--ae-anchor-target-height"),
          x: value("--ae-anchor-x"), y: value("--ae-anchor-y"),
          originX: value("--ae-anchor-origin-x"), originY: value("--ae-anchor-origin-y"),
          pivotX: value("--ae-anchor-pivot-x"), pivotY: value("--ae-anchor-pivot-y") });
        switchProbe.onFrame?.(operation, operation.frames.at(-1));
        return result;
      } })));
    } };
  });
}
