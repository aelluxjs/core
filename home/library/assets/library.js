/* A apresentação de todos os exemplos é definida aqui; os dados ficam em snippets.js. */
(() => {
  "use strict";

  const source = window.librarySource;
  const base = new URL("../", document.currentScript.src);
  const dist = new URL("../../dist/", base);
  const categories = new Map(source.categories.map(category => [category.id, category]));
  const snippets = new Map(source.snippets.map(snippet => [snippet.id, snippet]));
  const cards = new Map();
  const assets = new Map();
  const feed = document.getElementById("feed");
  const search = document.getElementById("search");
  const storageKey = "aellux-library-v1";
  const previewWidths = { fluid: null, mobile: 375, tablet: 768, desktop: 1280 };
  const extensionLabels = { input: "Input", present: "Present", focus: "Focus", adaptive: "Adaptive", anchor: "Anchor", viewport: "Viewport", preference: "Preference", feedback: "Feedback", "scrollbox": "Scrollbox", "scrollbox-snap": "Scrollbox Snap", "state-navigation": "State Navigation" };
  let stored = {};
  try { stored = JSON.parse(localStorage.getItem(storageKey)) || {}; } catch { /* Storage is optional. */ }
  const saved = new Set(Array.isArray(stored.saved) ? stored.saved.filter(id => snippets.has(id)) : []);
  let navigation;
  let view = "feed";
  let category = "all";
  let query = "";
  let fullscreen = null;
  let returnFocus = null;
  let noticeTimer;
  let offlineReady = false;
  let updateRequested = false;
  let offlineMessage = "Preparando acesso offline…";
  const inertElements = new Set();

  const escapeHTML = value => String(value).replace(/[&<>"']/g, char => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[char]));
  const normalize = value => String(value).normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
  const icon = name => `<svg class="icon" aria-hidden="true"><use href="#i-${name}"></use></svg>`;
  const inlineScript = code => `<script>${code.replace(/<\/script/gi, "<\\/script")}</script>`;
  const serialize = value => JSON.stringify(value).replace(/</g, "\\u003c");
  const colorScheme = () => document.documentElement.dataset.bsTheme === "dark" ? "dark" : "light";

  function persist() {
    try { localStorage.setItem(storageKey, JSON.stringify({ ...stored, saved: [...saved] })); }
    catch { notify("O armazenamento está indisponível. Seus salvos continuam nesta sessão."); }
  }

  function notify(message) {
    const notice = document.getElementById("notice");
    notice.textContent = message;
    notice.hidden = false;
    clearTimeout(noticeTimer);
    noticeTimer = setTimeout(() => { notice.hidden = true; }, 4500);
  }

  // Altere este template para mudar a estrutura de todos os cards de uma vez.
  function renderCard(snippet) {
    const group = categories.get(snippet.category);
    const requirements = [...snippet.extensions.map(name => extensionLabels[name] || name), ...(snippet.dependencies || [])];
    return `<article class="snippet-card" id="snippet-${escapeHTML(snippet.id)}" data-snippet="${escapeHTML(snippet.id)}" style="--snippet-tint:${escapeHTML(group.tint)}" aria-labelledby="title-${escapeHTML(snippet.id)}">
      <header class="snippet-header">
        <div class="d-flex align-items-center gap-2 mb-3">
          <span class="snippet-avatar" aria-hidden="true">${escapeHTML(group.symbol)}</span>
          <div><span class="d-block small fw-medium">aellux<span class="text-body-secondary">.js</span></span><span class="d-block text-body-secondary" style="font-size:.65rem">${escapeHTML(group.label)} · snippet</span></div>
          <button class="btn icon-button save-button ms-auto" type="button" data-action="save" aria-label="Salvar ${escapeHTML(snippet.title)}" aria-pressed="false">${icon("bookmark")}</button>
        </div>
        <h3 id="title-${escapeHTML(snippet.id)}" class="mb-2">${escapeHTML(snippet.title)}</h3>
        <p class="snippet-description text-body-secondary mb-2">${escapeHTML(snippet.description)}</p>
        <div class="d-flex flex-wrap gap-2">${snippet.tags.map(tag => `<button class="tag" type="button" data-tag="${escapeHTML(tag)}">#${escapeHTML(tag)}</button>`).join("")}</div>
        <div class="snippet-requirements d-flex flex-wrap gap-1 mt-3" aria-label="Dependências">${(requirements.length ? requirements : ["HTML / CSS"]).map(name => `<span class="badge border text-body-secondary fw-normal">${escapeHTML(name)}</span>`).join("")}</div>
        <p class="snippet-capabilities small text-body-secondary mt-2 mb-0">${escapeHTML(snippet.features.join(" · "))} · Personalize no CodePen</p>
        <details class="integration-details small mt-2">
          <summary>Como integrar</summary>
          <p class="mt-2 mb-2">${snippet.dependencies.length ? "Requer Bootstrap 5.3.8. " : "CSS próprio, sem Bootstrap. "}${snippet.extensions.length ? "Registre as extensões indicadas antes de inicializar a aplicação. No CodePen, as dependências já estão incluídas." : "Este exemplo usa somente HTML e CSS. Abra no CodePen para copiar ou personalizar."}</p>
          <p class="mb-0">${escapeHTML(snippet.integration || "Para repetir o componente na mesma página, renomeie os IDs e todas as referências correspondentes (href, for, ARIA e data-ae-*).")}</p>
        </details>
      </header>
      <div class="preview-slot" data-ae-viewport>
        <div class="preview-shell">
          <div class="preview-toolbar">
            <button class="btn btn-sm preview-back" type="button" data-action="back" aria-label="Voltar ao feed">${icon("back")} Voltar</button>
            <span class="preview-label"><span class="status-dot"></span> PRÉVIA <span class="preview-state">· em pausa</span></span>
            <label class="preview-size-label">Largura
              <select class="form-select form-select-sm preview-width" aria-label="Largura da prévia de ${escapeHTML(snippet.title)}">
                <option value="fluid">Disponível</option><option value="mobile">Mobile · 375 px</option><option value="tablet">Tablet · 768 px</option><option value="desktop">Desktop · 1280 px</option>
              </select>
            </label>
            <button class="btn btn-sm btn-outline-secondary preview-codepen" type="button" data-action="codepen" aria-label="Abrir ${escapeHTML(snippet.title)} no CodePen em nova janela" disabled>${icon("code")} Abrir no CodePen <span aria-hidden="true">↗</span></button>
            <button class="btn btn-sm preview-expand" type="button" data-action="expand" aria-label="Ampliar ${escapeHTML(snippet.title)}" disabled>${icon("expand")} Ampliar</button>
          </div>
          <div class="preview-viewport"><iframe title="Prévia: ${escapeHTML(snippet.title)}" sandbox="allow-scripts allow-forms" referrerpolicy="no-referrer"></iframe></div>
        </div>
      </div>
      <footer class="snippet-footer">
        <span class="preview-feedback" role="status">Experimente aqui · Personalize no CodePen</span>
        <span class="small text-body-secondary" style="font-size:.65rem">${escapeHTML(requirements.join(" + ") || "HTML / CSS")}</span>
      </footer>
    </article>`;
  }

  feed.innerHTML = source.snippets.map(renderCard).join("");
  for (const snippet of source.snippets) {
    const card = document.getElementById(`snippet-${snippet.id}`);
    cards.set(snippet.id, {
      snippet, card, slot: card.querySelector(".preview-slot"), shell: card.querySelector(".preview-shell"),
      frame: card.querySelector("iframe"), visible: false, revision: 0, loaded: false, loading: false, token: null, exportHead: null
    });
  }

  document.getElementById("category-filters").innerHTML = [{ id: "all", label: "Tudo" }, ...source.categories].map(item =>
    `<button class="btn category-chip" type="button" data-category="${escapeHTML(item.id)}" aria-pressed="${item.id === category}">${escapeHTML(item.label)}</button>`).join("");
  document.getElementById("category-grid").innerHTML = source.categories.map(item => {
    const count = source.snippets.filter(snippet => snippet.category === item.id).length;
    return `<div class="col-6"><button class="category-tile h-100" type="button" data-category="${escapeHTML(item.id)}" data-open-category>
      <span class="snippet-avatar mb-3" style="--snippet-tint:${escapeHTML(item.tint)}" aria-hidden="true">${escapeHTML(item.symbol)}</span>
      <span class="d-block fw-semibold small mb-1">${escapeHTML(item.label)}</span><span class="d-block small text-body-secondary">${escapeHTML(item.description)}</span>
      <span class="d-block small text-body-secondary mt-2">${count} ${count === 1 ? "snippet" : "snippets"}</span>
    </button></div>`;
  }).join("");

  function updateSaved() {
    for (const state of cards.values()) {
      const button = state.card.querySelector(".save-button");
      const active = saved.has(state.snippet.id);
      button.setAttribute("aria-pressed", String(active));
      button.setAttribute("aria-label", `${active ? "Remover dos salvos:" : "Salvar"} ${state.snippet.title}`);
    }
    document.querySelectorAll(".saved-count").forEach(element => { element.textContent = saved.size; });
  }

  function filter() {
    const terms = normalize(query).split(/\s+/).filter(Boolean);
    let count = 0;
    for (const state of cards.values()) {
      const snippet = state.snippet;
      const haystack = normalize([snippet.title, snippet.description, categories.get(snippet.category).label, ...snippet.tags, ...snippet.extensions, ...snippet.dependencies, ...snippet.features].join(" "));
      const match = (view !== "saved" || saved.has(snippet.id)) && (category === "all" || snippet.category === category) && terms.every(term => haystack.includes(term));
      state.card.hidden = !match;
      if (match) count++;
      else pause(state);
    }
    document.getElementById("results").textContent = `${count} ${count === 1 ? "exemplo para experimentar" : "exemplos para experimentar"}${query ? ` · “${query}”` : ""}`;
    document.getElementById("empty-state").hidden = count > 0;
    document.getElementById("empty-message").textContent = view === "saved" ? "Salve os exemplos pelo ícone de marcador para encontrá-los aqui." : "Experimente outra busca ou escolha uma categoria diferente.";
    document.getElementById("clear-filters").hidden = !query && category === "all";
    document.querySelectorAll(".category-chip").forEach(button => button.setAttribute("aria-pressed", String(button.dataset.category === category)));
    if ($ae.mountManager) $ae.dispatch("Layout");
  }

  function selectView(next, scroll = true) {
    view = next;
    category = "all";
    query = "";
    search.value = "";
    document.getElementById("view-title").textContent = { feed: "Copy, paste, customize.", categories: "O que você quer construir?", saved: "Seus snippets favoritos." }[view];
    document.getElementById("categories-panel").hidden = view !== "categories";
    document.querySelectorAll("[data-view]").forEach(button => {
      if (button.dataset.view === view) button.setAttribute("aria-current", "page");
      else button.removeAttribute("aria-current");
    });
    filter();
    if (scroll) window.scrollTo({ top: 0, behavior: "instant" });
  }

  function fetchText(url) {
    const key = String(url);
    if (!assets.has(key)) {
      const promise = fetch(url).then(response => {
        if (!response.ok) throw new Error(`Não foi possível carregar ${new URL(url).pathname} (${response.status}).`);
        return response.text();
      }).catch(error => { assets.delete(key); throw error; });
      assets.set(key, promise);
    }
    return assets.get(key);
  }

  document.addEventListener("change", event => {
    if (!event.target.matches(".preview-width")) return;
    const state = cards.get(event.target.closest("[data-snippet]").dataset.snippet);
    const width = previewWidths[event.target.value];
    // CSS pixels change the actual iframe viewport, including its media queries.
    state.shell.style.setProperty("--preview-width", width ? `${width}px` : "100%");
  });

  function shouldRun(state) {
    return !document.hidden && !state.card.hidden && (fullscreen ? fullscreen === state.snippet.id : state.visible);
  }

  function replaceFrame(state, html) {
    // Substituir o nó evita acumular navegações srcdoc no histórico do botão Voltar.
    const frame = state.frame.cloneNode(false);
    if (html) frame.srcdoc = html;
    else frame.removeAttribute("srcdoc");
    state.frame.replaceWith(frame);
    state.frame = frame;
  }

  function pause(state) {
    state.revision++;
    if (state.loaded || state.loading) replaceFrame(state, null);
    state.loaded = false;
    state.loading = false;
    state.token = null;
    delete state.shell.dataset.loaded;
    state.shell.querySelector(".preview-state").textContent = "· em pausa";
  }

  async function preview(state) {
    if (!shouldRun(state)) return;
    const revision = ++state.revision;
    state.loading = true;
    state.shell.querySelector(".preview-state").textContent = "· carregando";
    try {
      const extensions = state.snippet.extensions;
      const styleExtensions = extensions.filter(name => ["input", "present", "anchor", "scrollbox", "adaptive", "feedback"].includes(name));
      const hasRuntime = extensions.length > 0;
      const [bootstrap, palette, boot, runtime, scripts, styles, adapters] = await Promise.all([
        state.snippet.dependencies.length ? fetchText(new URL("vendor/bootstrap.min.css", base)) : "",
        state.snippet.dependencies.length ? fetchText(new URL("../assets/bootstrap-brand.css", base)) : "",
        hasRuntime ? fetchText(new URL("aellux.min.js", dist)) : "",
        hasRuntime ? fetchText(new URL("aellux.orchestrator.min.js", dist)) : "",
        Promise.all(extensions.map(name => fetchText(new URL(`aellux.ext.${name}.min.js`, dist)))),
        Promise.all(styleExtensions.map(name => fetchText(new URL(`aellux.ext.${name}.min.css`, dist)))),
        Promise.all((extensions.includes("input") ? ["point", "keyboard"] : []).map(name => fetchText(new URL(`aellux.input.${name}.min.js`, dist))))
      ]);
      if (revision !== state.revision || !shouldRun(state)) return;
      const token = state.token = `${state.snippet.id}:${revision}:${Math.random()}`;
      const theme = colorScheme();
      // Incorpora os assets já carregados a um documento de origem opaca. Assim,
      // os exemplos não acessam o app, o storage ou o histórico da página.
      const setup = bootstrapURL => `window.__aelluxBootstrapURL=${serialize(bootstrapURL)};\n${boot}\n$ae.persist.preferences.setObject({colorScheme:${serialize(theme)}});\nObject.assign($ae.options,{mode:"basic",useHash:false,syncBootstrapThemeTag:true});\n${extensions.map(name => `$ae.ext(${serialize(name)}, {loadStyle:false});`).join("\n")}`;
      const dependencyStyles = `${bootstrap}\n${palette}\n${styles.join("\n")}\nbody{min-height:100vh;margin:0;}`;
      const dependencyScripts = bootstrapURL => (hasRuntime ? inlineScript(setup(bootstrapURL)) + inlineScript(runtime) : "") + scripts.map(inlineScript).join("") + adapters.map(inlineScript).join("");
      // O POST leva os mesmos assets da prévia, inclusive em desenvolvimento local.
      // Nenhum recurso do CodePen depende de localhost ou de uma versão publicada.
      state.exportHead = `<meta name="viewport" content="width=device-width,initial-scale=1"><style>${dependencyStyles}</style>${dependencyScripts("https://aelluxjs.github.io/core/dist/aellux.min.js")}`;
      state.card.querySelector(".preview-codepen").disabled = false;
      const bridge = `(()=>{const send=(type,message)=>parent.postMessage({type,token:${serialize(token)},message},"*");
        window.addEventListener("error",e=>send("library-error",e.message));
        window.addEventListener("unhandledrejection",e=>send("library-error",String(e.reason)));
        window.addEventListener("keydown",e=>{if(e.key==="Escape"&&!e.defaultPrevented)send("library-escape");});
        window.addEventListener("message",e=>{
          if(e.source!==parent||e.data?.type!=="library-theme"||e.data.token!==${serialize(token)}||!["light","dark"].includes(e.data.theme))return;
          if(!window.$ae){document.documentElement.dataset.bsTheme=e.data.theme;return;}
          const preference=$ae.ext.preference;
          if(preference?.initialized){preference.set("colorScheme",e.data.theme);preference.update();}
          else{$ae.persist.preferences.setObject(Object.assign({},$ae.persist.preferences.getObject(),{colorScheme:e.data.theme}));$ae.updatePreferenceAttributesHTML();}
        });
        ${hasRuntime ? '$ae.on("Ready",()=>send("library-ready"),{once:true});' : 'window.addEventListener("DOMContentLoaded",()=>send("library-ready"),{once:true});'}})();`;
      const start = `$ae.updatePreferenceAttributesHTML();$ae.startAelluxJs().catch(error=>parent.postMessage({type:"library-error",token:${serialize(token)},message:error.message},"*"));`;
      const background = `<style id="library-preview-background">html body{isolation:isolate!important;}html body::before{content:""!important;position:fixed!important;inset:0!important;background:rgba(255,214,58,.12)!important;pointer-events:none!important;z-index:-1!important;}</style>`;
      const html = `<!doctype html><html lang="pt-BR" data-bs-theme="${theme}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escapeHTML(state.snippet.title)}</title><style>${dependencyStyles}\nhtml{color-scheme:${theme};}</style>${dependencyScripts(new URL("aellux.min.js", dist).href)}${inlineScript(bridge)}</head><body>${state.snippet.code}${background}${hasRuntime ? inlineScript(start) : ""}</body></html>`;
      replaceFrame(state, html);
      state.loaded = true;
      state.loading = false;
      state.shell.dataset.loaded = "true";
    } catch (error) {
      if (revision !== state.revision) return;
      state.loading = false;
      state.shell.querySelector(".preview-state").textContent = "· indisponível";
      notify(error.message);
    }
  }

  function refreshVisibility() {
    for (const state of cards.values()) {
      if (!shouldRun(state)) pause(state);
      else if (!state.loaded && !state.loading) preview(state);
    }
  }

  $ae.on("ViewportChange", event => {
    if (!event.target.classList.contains("preview-slot")) return;
    const state = cards.get(event.target.closest("[data-snippet]").dataset.snippet);
    state.visible = event.detail.measurable && event.detail.visible > 0;
    if (!shouldRun(state)) pause(state);
    else if (!state.loaded && !state.loading) preview(state);
  });

  function restoreBackground() {
    for (const element of inertElements) element.inert = false;
    inertElements.clear();
  }

  function syncFullscreen(snapshot) {
    const next = cards.has(snapshot.preview) ? snapshot.preview : null;
    if (next === fullscreen) return;
    const previous = fullscreen && cards.get(fullscreen);
    if (previous) {
      previous.shell.classList.remove("is-fullscreen");
      previous.shell.removeAttribute("role");
      previous.shell.removeAttribute("aria-modal");
      previous.shell.removeAttribute("aria-label");
    }
    restoreBackground();
    fullscreen = next;
    document.body.classList.toggle("preview-open", Boolean(next));
    if (next) {
      const state = cards.get(next);
      state.shell.classList.add("is-fullscreen");
      state.shell.setAttribute("role", "dialog");
      state.shell.setAttribute("aria-modal", "true");
      state.shell.setAttribute("aria-label", state.snippet.title);
      const background = document.querySelectorAll(".app-header, .bottom-nav, .app-layout aside, #main > :not(#feed), .snippet-card");
      for (const element of [...background, ...state.card.querySelectorAll(".snippet-header, .snippet-footer")]) {
        if (element === state.card || element.inert) continue;
        element.inert = true;
        inertElements.add(element);
      }
      state.shell.querySelector(".preview-back").focus({ preventScroll: true });
    } else if (returnFocus?.isConnected) {
      returnFocus.focus({ preventScroll: true });
    }
    refreshVisibility();
    $ae.dispatch("Layout");
  }

  $ae.on("SnapshotChange", event => syncFullscreen(event.detail.snapshot));
  $ae.on("SnapshotRestore", event => syncFullscreen(event.detail.snapshot));

  function syncPreviewTheme(state) {
    if (state.token) state.frame.contentWindow.postMessage({ type: "library-theme", token: state.token, theme: colorScheme() }, "*");
  }

  let previewTheme = colorScheme();
  $ae.on("PreferencesChange", () => {
    const theme = colorScheme();
    if (theme === previewTheme) return;
    previewTheme = theme;
    for (const state of cards.values()) syncPreviewTheme(state);
  });

  window.addEventListener("message", event => {
    if (!event.data || typeof event.data !== "object") return;
    const state = [...cards.values()].find(item => item.token && item.token === event.data.token && item.frame.contentWindow === event.source);
    if (!state) return;
    if (event.data.type === "library-ready") {
      state.shell.querySelector(".preview-state").textContent = "· ao vivo";
      syncPreviewTheme(state);
    }
    if (event.data.type === "library-error") {
      state.shell.querySelector(".preview-state").textContent = "· confira o código";
      state.card.querySelector(".preview-feedback").textContent = `Prévia: ${String(event.data.message).slice(0, 160)}`;
    }
    if (event.data.type === "library-escape" && fullscreen) history.back();
  });

  document.addEventListener("keydown", event => {
    if (!fullscreen) return;
    if (event.key === "Escape") { event.preventDefault(); history.back(); }
    if (event.key === "Tab") {
      const state = cards.get(fullscreen);
      const back = state.shell.querySelector(".preview-back");
      if (event.shiftKey && document.activeElement === back) { event.preventDefault(); state.frame.focus(); }
    }
  });
  document.addEventListener("focusin", event => {
    if (fullscreen && !cards.get(fullscreen).shell.contains(event.target)) cards.get(fullscreen).shell.querySelector(".preview-back").focus();
  });
  document.addEventListener("visibilitychange", refreshVisibility);

  document.getElementById("search-form").addEventListener("submit", event => {
    event.preventDefault();
    query = search.value.trim();
    filter();
  });
  document.getElementById("clear-filters").addEventListener("click", () => { category = "all"; query = ""; search.value = ""; filter(); });

  function openCodePen(state) {
    if (!state.exportHead) return;
    const fragment = document.createElement("template");
    fragment.innerHTML = state.snippet.code;
    const css = [], js = [];
    for (const element of fragment.content.querySelectorAll("style, script")) {
      (element.tagName === "STYLE" ? css : js).push(element.textContent);
      element.remove();
    }
    if (state.snippet.extensions.length) js.push("$ae.updatePreferenceAttributesHTML();\n$ae.startAelluxJs();");
    const theme = colorScheme();
    const form = document.createElement("form");
    form.action = "https://codepen.io/pen/define/";
    form.method = "POST";
    form.target = "_blank";
    form.rel = "noopener noreferrer";
    form.hidden = true;
    const input = document.createElement("input");
    input.type = "hidden";
    input.name = "data";
    input.value = JSON.stringify({
      title: `${state.snippet.title} · aellux.js`, description: state.snippet.description,
      html: fragment.innerHTML.trim(), css: css.join("\n\n"), js: js.join("\n\n"),
      head: state.exportHead + inlineScript(`document.documentElement.lang="pt-BR";document.documentElement.dataset.bsTheme=${serialize(theme)};${state.snippet.extensions.length ? `$ae.persist.preferences.setObject({colorScheme:${serialize(theme)}});` : ""}`),
      css_starter: "neither", css_prefix: "neither"
    });
    form.append(input);
    document.body.append(form);
    // O envio ocorre no próprio clique, sem await, para preservar a nova janela.
    form.submit();
    form.remove();
  }

  async function install() {
    if (!$ae.ext.pwa?.initialized) { notify("A instalação está sendo preparada. Tente novamente em instantes."); return; }
    try {
      const result = await $ae.ext.pwa.install({ fallback: "none" });
      if (result.status.installed) notify("A biblioteca já está aberta como aplicativo.");
      else if (["manual", "unknown", "unavailable"].includes(result.outcome)) {
        document.getElementById("install-offline-status").textContent = offlineMessage;
        document.getElementById("install-guide").showModal();
      }
    } catch { notify("Não foi possível abrir a instalação. Tente pelo menu do navegador."); }
  }

  document.addEventListener("click", async event => {
    const button = event.target.closest("button");
    if (!button) return;
    if (button.dataset.view) selectView(button.dataset.view);
    if (button.dataset.category) {
      const selected = button.dataset.category;
      if (button.hasAttribute("data-open-category")) selectView("feed");
      category = selected;
      filter();
    }
    if (button.dataset.tag) { search.value = query = button.dataset.tag; filter(); search.focus({ preventScroll: true }); }
    const action = button.dataset.action;
    if (action === "explore") selectView("feed");
    if (action === "install") { install(); return; }
    if (action === "back") { history.back(); return; }
    const state = cards.get(button.closest("[data-snippet]")?.dataset.snippet);
    if (!state) return;
    if (action === "save") {
      if (saved.has(state.snippet.id)) saved.delete(state.snippet.id);
      else saved.add(state.snippet.id);
      persist(); updateSaved(); filter();
    }
    if (action === "expand") {
      if (!navigation) return;
      returnFocus = button;
      try { await navigation.setState("preview", state.snippet.id, state.snippet.title); }
      catch { notify("Não foi possível abrir a prévia ampliada."); }
    }
    if (action === "codepen") openCodePen(state);
  });

  function updateConnection() {
    const online = navigator.onLine;
    document.getElementById("connection").classList.toggle("is-offline", !online);
    document.getElementById("connection-label").textContent = online ? "Online" : "Offline";
    if (online) refreshVisibility();
  }
  window.addEventListener("online", updateConnection);
  window.addEventListener("offline", updateConnection);
  updateConnection();

  function setOfflineStatus(message, ready = false) {
    offlineReady = ready;
    offlineMessage = message;
    document.getElementById("offline-status").textContent = message;
    document.getElementById("install-offline-status").textContent = message;
  }

  async function prepareOffline() {
    if (!("serviceWorker" in navigator) || !window.isSecureContext) {
      setOfflineStatus("O acesso offline precisa de HTTPS ou localhost.");
      return;
    }
    try {
      const pwa = await $ae.wait("pwa");
      const registration = await pwa.register({ script: new URL("sw.js", base).href, scope: base.href, type: "classic", updateViaCache: "none" });
      const report = () => {
        if (registration.active) setOfflineStatus("Biblioteca pronta para usar offline.", true);
      };
      if (registration.active) report();
      else {
        const worker = registration.installing || registration.waiting;
        worker?.addEventListener("statechange", () => {
          report();
          if (worker.state === "redundant" && !offlineReady) setOfflineStatus("Não foi possível preparar o modo offline. Reabra a biblioteca com conexão.");
        });
      }
      await navigator.serviceWorker.ready;
      report();
    } catch {
      setOfflineStatus("Modo offline indisponível. Reabra a biblioteca com conexão para tentar novamente.");
    }
  }

  $ae.on("PwaUpdateAvailable", () => { document.getElementById("apply-update").hidden = false; });
  document.getElementById("apply-update").addEventListener("click", async () => {
    persist();
    updateRequested = true;
    const applied = await $ae.ext.pwa.applyUpdate();
    if (!applied) { updateRequested = false; notify("A biblioteca já está atualizada."); }
  });
  $ae.on("PwaUpdateComplete", () => { if (updateRequested) { persist(); location.reload(); } });

  $ae.on("Ready", async () => {
    navigation = await $ae.wait("state-navigation");
    document.querySelectorAll('.preview-expand').forEach(button => { button.disabled = false; });
    syncFullscreen(navigation.globalSnapshot);
    prepareOffline();
  }, { once: true });

  window.addEventListener("pagehide", persist);
  updateSaved();
  selectView("feed", false);
})();
