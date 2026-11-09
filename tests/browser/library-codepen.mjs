// Intercept the real new-window POST and render its payload like a plain Pen.
// This checks the export without creating anything in the external service.
export async function openCodePen(page, button) {
  const context = page.context();
  const endpoint = "https://codepen.io/pen/define/";
  let data;
  await context.route(endpoint, async route => {
    data = JSON.parse(new URLSearchParams(route.request().postData()).get("data"));
    const js = data.js.replace(/<\/script/gi, "<\\/script");
    await route.fulfill({ contentType: "text/html; charset=utf-8", body: `<!doctype html><html><head><meta charset="utf-8">${data.head}<style>${data.css}</style></head><body>${data.html}<script>${js}</script></body></html>` });
  });
  const [pen, request] = await Promise.all([
    context.waitForEvent("page"),
    context.waitForEvent("request", request => request.url() === endpoint),
    button.click()
  ]);
  await pen.waitForLoadState();
  const viewport = page.viewportSize();
  if (viewport) await pen.setViewportSize(viewport);
  await context.unroute(endpoint);
  return { pen, request, data };
}
