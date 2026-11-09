import { expect, test } from "@playwright/test";
import { readFile } from "node:fs/promises";
import { runInNewContext } from "node:vm";
import { openCodePen } from "./library-codepen.mjs";

const window = {};
runInNewContext(await readFile(new URL("../../home/library/assets/snippets.js", import.meta.url), "utf8"), { window });
const snippets = window.librarySource.snippets;
test.use({ viewport: { width: 900, height: 950 } });

async function open(page, id) {
  await page.goto("/home/library/index.htm");
  const card = page.locator(`#snippet-${id}`);
  await card.locator(".preview-slot").scrollIntoViewIfNeeded();
  await expect(card.locator(".preview-state")).toHaveText("· ao vivo");
  await card.locator('[data-action="expand"]').click();
  await expect(card.locator('.preview-shell')).toHaveClass(/is-fullscreen/);
  return { card, frame: page.frameLocator(`#snippet-${id} iframe`) };
}

for (const [preset, width] of [["mobile", 375], ["tablet", 768], ["desktop", 1280]]) {
  test(`all 17 components render at the real ${width}px preview viewport`, async ({ page }) => {
    test.setTimeout(90_000);
    const errors = [];
    page.on("pageerror", error => errors.push(error.message));
    await page.goto("/home/library/index.htm");
    for (const snippet of snippets) {
      const card = page.locator(`#snippet-${snippet.id}`);
      await card.locator(".preview-slot").scrollIntoViewIfNeeded();
      await expect(card.locator(".preview-state"), snippet.id).toHaveText("· ao vivo");
      await card.locator('[data-action="expand"]').click();
      await expect(card.locator('.preview-shell')).toHaveClass(/is-fullscreen/);
      await card.locator('.preview-width').selectOption(preset);
      const frame = page.frameLocator(`#snippet-${snippet.id} iframe`);
      await expect.poll(() => frame.locator('html').evaluate(() => innerWidth), { message: snippet.id }).toBe(width);
      await expect(frame.getByRole('heading').first()).toBeVisible();
      // The iframe viewport is independent of the containing application width.
      expect(await frame.locator('html').evaluate(element => element.scrollWidth <= innerWidth), snippet.id).toBe(true);
      await expect(card.locator(".preview-state"), snippet.id).toHaveText("· ao vivo");
      await card.locator('[data-action="back"]').click();
      await expect(card.locator('.preview-shell')).not.toHaveClass(/is-fullscreen/);
    }
    expect(errors).toEqual([]);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  });
}

test("width selection persists through fullscreen and preview unloading without zoom", async ({ page }) => {
  const { card, frame } = await open(page, 'responsive-split-hero');
  await card.locator('.preview-width').selectOption('desktop');
  await expect.poll(() => frame.locator('html').evaluate(() => innerWidth)).toBe(1280);
  const hero = frame.locator('.ae-lib-hero__layout');
  await expect.poll(() => hero.evaluate(element => getComputedStyle(element).gridTemplateColumns.split(' ').length)).toBe(2);
  await card.locator('[data-action="back"]').click();
  await card.locator('.preview-slot').scrollIntoViewIfNeeded();
  await expect.poll(() => frame.locator('html').evaluate(() => innerWidth)).toBe(1280);
  await page.locator('#snippet-next-focus .preview-slot').scrollIntoViewIfNeeded();
  await expect(card.locator('iframe')).not.toHaveAttribute('srcdoc');
  await card.locator('.preview-slot').scrollIntoViewIfNeeded();
  await expect(card.locator('.preview-state')).toHaveText('· ao vivo');
  await expect.poll(() => frame.locator('html').evaluate(() => innerWidth)).toBe(1280);
  await card.locator('.preview-width').selectOption('mobile');
  await expect.poll(() => hero.evaluate(element => getComputedStyle(element).gridTemplateColumns.split(' ').length)).toBe(1);
});

test("navbar responds to component width and Escape closes only the mobile menu", async ({ page }) => {
  const { card, frame } = await open(page, 'responsive-navbar');
  await card.locator('.preview-width').selectOption('mobile');
  const menu = frame.getByRole('button', { name: 'Menu', exact: true });
  const nav = frame.getByRole('navigation');
  await expect(nav).toBeHidden();
  await menu.click();
  await expect(nav).toBeVisible();
  await expect(menu).toHaveAttribute('aria-expanded', 'true');
  await menu.press('Escape');
  await expect(nav).toBeHidden();
  await expect(card.locator('.preview-shell')).toHaveClass(/is-fullscreen/);
  await card.locator('.preview-width').selectOption('tablet');
  await expect(nav).toBeVisible();
  await expect(menu).toBeHidden();
  expect(await nav.evaluate(element => element.inert)).toBe(false);
  await card.locator('.preview-width').selectOption('mobile');
  await expect(nav).toBeHidden();
});

test("bottom navigation preserves selection when adapting its placement", async ({ page }) => {
  const { card, frame } = await open(page, 'mobile-bottom-navigation');
  await card.locator('.preview-width').selectOption('mobile');
  await frame.getByRole('button', { name: /Salvos/ }).click();
  await expect(frame.locator('#ae-bottomnav-saved')).toBeVisible();
  await expect(frame.locator('#ae-bottomnav-home')).toBeHidden();
  for (const preset of ['desktop', 'mobile']) {
    await card.locator('.preview-width').selectOption(preset);
    await expect(frame.getByRole('button', { name: /Salvos/ })).toHaveAttribute('aria-pressed', 'true');
    await expect(frame.locator('#ae-bottomnav-saved')).toBeVisible();
  }
});

test("carousel buttons, keyboard and parallax use Scrollbox Snap navigation", async ({ page }) => {
  for (const id of ['slow-scroll', 'parallax-carousel']) {
    const { card, frame } = await open(page, id);
    await card.locator('.preview-width').selectOption('mobile');
    const track = frame.locator('[data-ae-scrollbox]');
    await frame.locator('[data-direction="next"]').click();
    await expect.poll(() => track.evaluate(element => element.scrollLeft)).toBeGreaterThan(100);
    await frame.locator('[data-direction="previous"]').click();
    await expect.poll(() => track.evaluate(element => element.scrollLeft)).toBeLessThan(5);
    if (id === 'parallax-carousel') {
      const scene = frame.locator('.ae-lib-parallax__scene').first();
      const before = await scene.evaluate(element => element.style.getPropertyValue('--ae-viewport-x'));
      await track.press('ArrowRight');
      await expect.poll(() => scene.evaluate(element => element.style.getPropertyValue('--ae-viewport-x'))).not.toBe(before);
    } else {
      await track.press('ArrowRight');
      await expect.poll(() => track.evaluate(element => element.scrollLeft)).toBeGreaterThan(100);
    }
  }
});

test("bottom sheet uses modal focus and Escape returns to its trigger", async ({ page }) => {
  const { card, frame } = await open(page, 'responsive-bottom-sheet');
  await card.locator('.preview-width').selectOption('mobile');
  const opener = frame.getByRole('button', { name: 'Compartilhar projeto', exact: true });
  await opener.click();
  await expect(frame.getByRole('dialog')).toBeVisible();
  await expect(frame.getByRole('button', { name: 'Fechar painel' })).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(frame.locator('input')).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(frame.getByRole('dialog')).toBeHidden();
  await expect(opener).toBeFocused();
  await expect(card.locator('.preview-shell')).toHaveClass(/is-fullscreen/);
  await card.locator('.preview-width').selectOption('desktop');
  await opener.click();
  await frame.getByRole('button', { name: 'Concluir', exact: true }).click();
  await expect(frame.getByRole('dialog')).toBeHidden();
});

test("toast stack mounts dynamic messages, pauses on focus and dismisses automatically", async ({ page }) => {
  const { frame } = await open(page, 'toast-notification-stack');
  const add = frame.getByRole('button', { name: 'Salvar projeto' });
  await add.click();
  const first = frame.locator('article').first();
  await expect(first).toBeVisible();
  await first.getByRole('button').focus();
  const before = await first.locator('progress').getAttribute('value');
  // Poll a later timer tick to verify focus pauses the countdown.
  await page.waitForTimeout(250);
  expect(await first.locator('progress').getAttribute('value')).toBe(before);
  await first.getByRole('button').click();
  await expect(frame.locator('article')).toHaveCount(0);
  await expect(add).toBeFocused();
  await add.click();
  await page.mouse.move(0, 0);
  await expect(frame.locator('article')).toHaveCount(0, { timeout: 10000 });
});

test("anchored popover follows its trigger and returns focus on Escape", async ({ page }) => {
  const { card, frame } = await open(page, 'anchored-popover');
  const opener = frame.getByRole('button', { name: 'Detalhes do projeto', exact: true });
  await opener.click();
  const panel = frame.locator('aside');
  await expect(panel).toBeVisible();
  await expect(panel.getByRole('button')).toBeFocused();
  const trigger = await opener.boundingBox(), popover = await panel.boundingBox();
  expect(Math.abs(trigger.x - popover.x)).toBeLessThan(3);
  expect(popover.y).toBeGreaterThanOrEqual(trigger.y + trigger.height - 1);
  await panel.getByRole('button').press('Escape');
  await expect(panel).toBeHidden();
  await expect(opener).toBeFocused();
  await expect(card.locator('.preview-shell')).toHaveClass(/is-fullscreen/);
});

test("multi-step form validates, keeps values on Back and finishes locally", async ({ page }) => {
  const { frame } = await open(page, 'multi-step-form');
  await frame.getByRole('button', { name: 'Continuar →' }).click();
  await expect(frame.locator('#ae-steps-name')).toBeFocused();
  await expect(frame.locator('[data-step-status]')).toContainText('Etapa 1');
  await frame.locator('#ae-steps-name').fill('Ada');
  await frame.locator('#ae-steps-email').fill('ada@example.com');
  await frame.getByRole('button', { name: 'Continuar →' }).click();
  await expect(frame.locator('#ae-steps-project')).toBeFocused();
  await frame.locator('#ae-steps-project').fill('Uma biblioteca de boas ideias');
  await frame.getByRole('button', { name: '← Voltar' }).click();
  await expect(frame.locator('#ae-steps-name')).toHaveValue('Ada');
  await frame.getByRole('button', { name: 'Continuar →' }).click();
  await expect(frame.locator('#ae-steps-project')).toHaveValue('Uma biblioteca de boas ideias');
  await frame.getByRole('button', { name: 'Concluir briefing' }).click();
  await expect(frame.locator('[data-done]')).toBeVisible();
  await frame.getByRole('button', { name: 'Começar novamente' }).click();
  await expect(frame.locator('#ae-steps-name')).toHaveValue('');
  await expect(frame.locator('#ae-steps-name')).toBeFocused();
});

test("adaptive toolbar retains user choices and applies them after resizing", async ({ page }) => {
  const { card, frame } = await open(page, 'adaptive-toolbar');
  await frame.getByLabel('Alinhamento').selectOption('center');
  await frame.getByLabel('Espaçamento').selectOption('12');
  await card.locator('.preview-width').selectOption('mobile');
  await expect(frame.getByLabel('Alinhamento')).toHaveValue('center');
  await frame.getByRole('button', { name: 'Aplicar', exact: true }).click();
  await expect(frame.locator('[data-result]')).toHaveText('Preferências aplicadas.');
  await expect(frame.locator('.ae-lib-toolbar__preview')).toHaveCSS('text-align', 'center');
  await card.locator('.preview-width').selectOption('desktop');
  await expect(frame.getByLabel('Espaçamento')).toHaveValue('12');
});

test("virtual gamepad combines held keys and releases them when focus leaves", async ({ page }) => {
  const { frame } = await open(page, 'virtual-gamepad');
  const up = frame.getByRole('button', { name: 'Cima', exact: true }), action = frame.getByRole('button', { name: 'Ação', exact: true });
  await up.focus();
  await page.keyboard.down('ArrowUp');
  await page.keyboard.down('Space');
  await expect(up).toHaveAttribute('aria-pressed', 'true');
  await expect(action).toHaveAttribute('aria-pressed', 'true');
  await page.keyboard.up('ArrowUp');
  await expect(up).toHaveAttribute('aria-pressed', 'false');
  await expect(action).toHaveAttribute('aria-pressed', 'true');
  await page.keyboard.up('Space');
  await expect(action).toHaveAttribute('aria-pressed', 'false');
  await page.keyboard.down('a');
  await expect(frame.getByRole('button', { name: 'Esquerda' })).toHaveAttribute('aria-pressed', 'true');
  await page.locator('.preview-back').filter({ visible: true }).focus();
  await expect(frame.getByRole('button', { name: 'Esquerda' })).toHaveAttribute('aria-pressed', 'false');
  await page.keyboard.up('a');
});

test.describe('virtual gamepad on a touch device', () => {
  test.use({ hasTouch: true });
  test('independent native touches release and cancel without stuck controls', async ({ page, context, browserName }) => {
    test.skip(browserName !== 'chromium', 'Native multitouch injection uses Chromium CDP.');
    const { frame } = await open(page, 'virtual-gamepad');
    const up = frame.getByRole('button', { name: 'Cima', exact: true }), action = frame.getByRole('button', { name: 'Ação', exact: true });
    const a = await up.boundingBox(), b = await action.boundingBox();
    const first = { id: 1, x: a.x + a.width / 2, y: a.y + a.height / 2 }, second = { id: 2, x: b.x + b.width / 2, y: b.y + b.height / 2 };
    const session = await context.newCDPSession(page);
    await session.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [first, second] });
    await expect(up).toHaveAttribute('aria-pressed', 'true');
    await expect(action).toHaveAttribute('aria-pressed', 'true');
    await session.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [first] });
    await expect(up).toHaveAttribute('aria-pressed', 'false');
    await expect(action).toHaveAttribute('aria-pressed', 'true');
    await session.send('Input.dispatchTouchEvent', { type: 'touchCancel', touchPoints: [] });
    await expect(action).toHaveAttribute('aria-pressed', 'false');
    await session.detach();
  });
});

test("CSS-only CodePen export has no runtime and reduced motion removes decorative movement", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  const { card, frame } = await open(page, 'responsive-split-hero');
  expect(await frame.locator('script[src]').count()).toBe(0);
  const { pen, data } = await openCodePen(page, card.locator('[data-action="codepen"]'));
  expect(data.js).toBe("");
  expect(data.css).toContain(".ae-lib-hero");
  expect(JSON.stringify(data)).not.toMatch(/aellux\.min\.js|bootstrap\.min\.css|\$ae\.init|library-preview-background/);
  await expect(pen.locator('.ae-lib-hero')).toBeVisible();
  await pen.close();
  const parallax = await open(page, 'parallax-carousel');
  await expect(parallax.frame.locator('.ae-lib-parallax__caption').first()).toHaveCSS('transform', 'none');
  expect(await parallax.frame.locator('.ae-lib-parallax__scene').first().evaluate(element => getComputedStyle(element, '::before').transform)).toBe('none');
});
