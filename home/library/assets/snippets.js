/* Catálogo editável. Cada code contém apenas o componente e seus estilos/scripts.
   dependencies e extensions declaram tudo que a página hospedeira precisa fornecer.
   A arte demonstrativa é feita em CSS; não há imagens nem fontes externas. */
window.librarySource = {
  categories: [
    {
      "id": "navegacao",
      "label": "Navegação & Estrutura",
      "description": "Menus, barras e organização de interfaces.",
      "tint": "#dce6ff",
      "symbol": "↗"
    },
    {
      "id": "apresentacao",
      "label": "Apresentação & Destaques",
      "description": "Composições para apresentar sua próxima ideia.",
      "tint": "#ffe4ce",
      "symbol": "✦"
    },
    {
      "id": "rolagem",
      "label": "Carrosséis & Rolagem",
      "description": "Coleções e conteúdo além da primeira tela.",
      "tint": "#d9eee3",
      "symbol": "↔"
    },
    {
      "id": "camadas",
      "label": "Camadas & Feedback",
      "description": "Painéis, mensagens e elementos contextuais.",
      "tint": "#ffedb0",
      "symbol": "▱"
    },
    {
      "id": "formularios",
      "label": "Formulários & Fluxos",
      "description": "Campos, etapas e conclusão de tarefas.",
      "tint": "#d8edf5",
      "symbol": "✓"
    },
    {
      "id": "preferencias",
      "label": "Preferências & Adaptação",
      "description": "Escolhas e controles que se adaptam ao espaço.",
      "tint": "#eedff6",
      "symbol": "◐"
    },
    {
      "id": "interacoes",
      "label": "Interações Personalizadas",
      "description": "Componha controles para novas experiências.",
      "tint": "#f7dfe7",
      "symbol": "✳"
    }
  ],
  snippets: [
    {
      id: "hello-present",
      title: "Welcome Notification",
      category: "camadas",
      description: "Uma mensagem de boas-vindas que pode ser aberta, fechada e anunciada sem interromper a navegação.",
      tags: ["present","input","animacao","notificacao"],
      extensions: ["input","present"],
      dependencies: ["Bootstrap 5.3.8"],
      features: ["Responsivo","Teclado","Touch"],
      code: String.raw`<!-- Requisitos: Bootstrap 5.3.8; AelluxJS Input e Present registrados no host. Renomeie IDs e referências para repetir o componente. -->
<style>
  .ae-lib-welcome [data-ae-present] { --ae-from-transform: translateY(12px); --ae-pop-duration: 250ms; }
  @media (prefers-reduced-motion: reduce) { .ae-lib-welcome [data-ae-present] { --ae-pop-duration: 0s; --ae-dismiss-duration: 0s; } }
</style>
<section class="ae-lib-welcome p-4" aria-label="Boas-vindas">
  <h2 class="h4">Um bom começo.</h2>
  <p class="small text-body-secondary">Uma mensagem no tempo de quem está chegando.</p>
  <button class="btn btn-warning" type="button" data-ae-point data-ae-present-trigger="toggle" data-ae-present-target="ae-welcome-message">Dizer olá ✳</button>
  <div class="mt-3" role="status" aria-live="polite">
    <div id="ae-welcome-message" class="p-3 rounded-3 bg-warning-subtle" data-ae-present="opacity transform" data-ae-dismiss-on-click="false" hidden>
      <p>Bem-vindo ao seu espaço de criação. Sua próxima ideia começa aqui.</p>
      <button class="btn btn-sm btn-outline-secondary" type="button" data-ae-present-trigger="dismiss">Entendi</button>
    </div>
  </div>
</section>`
    },
    {
      id: "responsive-navbar",
      title: "Responsive Navbar",
      category: "navegacao",
      description: "Uma única navegação horizontal no desktop e menu recolhível no mobile. Adaptive mede o componente; Present controla a abertura.",
      tags: ["navbar","menu","responsive","adaptive","present"],
      extensions: ["adaptive","present","focus"],
      dependencies: ["Bootstrap 5.3.8"],
      features: ["Responsivo","Teclado","Touch"],
      code: String.raw`<!-- Requisitos: Bootstrap 5.3.8; AelluxJS Adaptive, Present e Focus registrados no host. Renomeie IDs e referências para repetir o componente. -->
<style>
  .ae-lib-navbar { position: relative; background: var(--bs-tertiary-bg); }
  .ae-lib-navbar__bar { display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 1rem; padding: 1rem; }
  .ae-lib-navbar__content { padding: 1rem; }
  .ae-lib-navbar__links { display: flex; flex-direction: column; gap: .75rem; padding-block: 1rem; --ae-pop-duration: 160ms; }
  .ae-lib-navbar.ae--fits-medium .ae-lib-navbar__bar { flex-wrap: wrap; }
  .ae-lib-navbar.ae--fits-medium .ae-lib-navbar__links { flex-direction: row; align-items: center; padding-block: 0; --ae-from-opacity: 1; --ae-dismiss-opacity: 1; }
  .ae-lib-navbar:not(.ae--fits-medium) .ae-lib-navbar__links { flex-basis: 100%; }
  .ae-lib-navbar.ae--fits-medium .ae-lib-navbar__toggle { display: none; }
  .ae-lib-navbar:not(.ae--fits-medium) .ae-lib-navbar__links:is(.ae--dismissed, .ae--unpop) { display: none; }
  .ae-lib-navbar a { padding: .5rem; color: inherit; }
  @media (prefers-reduced-motion: reduce) { .ae-lib-navbar__links { --ae-pop-duration: 0s; --ae-dismiss-duration: 0s; } }
</style>
<section class="ae-lib-navbar" data-ae-adaptive aria-label="Exemplo de navbar">
  <header class="ae-lib-navbar__bar">
    <span class="fw-bold fs-4">estúdio /</span>
    <button class="ae-lib-navbar__toggle btn btn-outline-secondary" type="button" data-ae-present-trigger="toggle" data-ae-present-target="ae-navbar-links" aria-controls="ae-navbar-links" aria-expanded="false">Menu</button>
    <nav id="ae-navbar-links" class="ae-lib-navbar__links ae--dismissed" data-ae-present="opacity" data-ae-dismiss-on-click="false" aria-label="Navegação do estúdio">
      <a href="#ae-navbar-projects">Projetos</a><a href="#ae-navbar-about">Sobre</a><a href="#ae-navbar-contact">Contato</a>
    </nav>
  </header>
  <div class="ae-lib-navbar__content"><h2 id="ae-navbar-projects" class="h4">Espaço para boas ideias.</h2><p id="ae-navbar-about">Um estúdio que cria em conjunto.</p><p id="ae-navbar-contact" class="small mb-0">Vamos conversar sobre seu próximo projeto.</p></div>
</section>
<script>
(() => {
  const root = document.currentScript.previousElementSibling, panel = root.querySelector("nav"), opener = root.querySelector("button");
  let desktop;
  const sync = () => {
    if (!$ae(panel)?.present) return;
    const next = root.classList.contains("ae--fits-medium");
    if (desktop !== next) { desktop = next; panel.inert = !desktop; if (panel.contains(document.activeElement) && !desktop) opener.focus(); $ae.ext.present.dismiss(panel); }
  };
  root.addEventListener("AelluxJsAdaptiveUpdate", sync);
  const connect = () => { if (!$ae(panel)?.present) return; sync(); document.removeEventListener("AelluxJsMount", connect); };
  document.addEventListener("AelluxJsMount", connect); connect();
  panel.addEventListener("AelluxJsBeforePop", () => { panel.inert = false; });
  panel.addEventListener("AelluxJsDismiss", () => { panel.inert = !desktop; if (!desktop && panel.contains(document.activeElement)) opener.focus(); });
  root.addEventListener("keydown", event => { if (event.key === "Escape" && !desktop && opener.getAttribute("aria-expanded") === "true") { event.preventDefault(); $ae.ext.present.dismiss(panel); opener.focus(); } });
  panel.addEventListener("click", event => { const link = event.target.closest("a"); if (!link) return; event.preventDefault(); root.querySelector(link.getAttribute("href"))?.scrollIntoView({block:"nearest"}); if (!desktop) { $ae.ext.present.dismiss(panel); opener.focus(); } });
})();
</script>`
    },
    {
      id: "responsive-sidebar",
      title: "Responsive Sidebar",
      category: "navegacao",
      description: "Uma sidebar persistente no desktop que vira um drawer de navegação em contêineres menores. Copie, cole e personalize, sem Bootstrap.",
      tags: ["sidebar","navigation","responsive","drawer","present","adaptive","focus","accessibility"],
      extensions: ["present","adaptive","focus"],
      dependencies: [],
      features: ["Responsivo","Teclado","Touch","Movimento reduzido"],
      code: String.raw`<!-- Requisitos: AelluxJS Present, Adaptive e Focus registrados no host. CSS próprio. Renomeie IDs e referências para repetir o componente. -->
<style>
  .ae-lib-sidebar {
    --sidebar-width: 256px; --sidebar-surface: #fff; --sidebar-foreground: #202b3c;
    --sidebar-accent: #3159c6; --sidebar-radius: 14px;
    position: relative; isolation: isolate; display: grid; grid-template-rows: auto minmax(0, 1fr);
    width: 100%; min-width: 0; height: min(680px, 100dvh); min-height: 240px;
    overflow: hidden; border-radius: var(--sidebar-radius); background: #f1f4f9;
    color: var(--sidebar-foreground); font: 400 15px/1.5 system-ui, sans-serif;
  }
  .ae-lib-sidebar, .ae-lib-sidebar * { box-sizing: border-box; }
  .ae-lib-sidebar :is(h2, h3, p) { margin: 0; color: inherit; font-family: inherit; line-height: inherit; }
  .ae-lib-sidebar :is(button, a) { font: inherit; color: inherit; touch-action: manipulation; }
  .ae-lib-sidebar :is(button, a):focus-visible { outline: 3px solid var(--sidebar-accent); outline-offset: -3px; }
  .ae-lib-sidebar__header { display: flex; align-items: center; gap: 12px; padding: 12px 16px; background: var(--sidebar-surface); border-bottom: 1px solid #dce2ec; }
  .ae-lib-sidebar__brand { font-weight: 750; letter-spacing: -.04em; }
  .ae-lib-sidebar__context { margin-left: auto; color: #536179; font-size: 12px; }
  .ae-lib-sidebar__button { display: inline-grid; place-items: center; flex-shrink: 0; width: 44px; height: 44px; padding: 8px; border: 1px solid #cbd4e3; border-radius: 10px; background: var(--sidebar-surface); cursor: pointer; }
  .ae-lib-sidebar__button svg { width: 22px; height: 22px; fill: none; stroke: currentColor; stroke-width: 2; }
  .ae-lib-sidebar__layout { display: grid; grid-template-columns: minmax(0, 1fr); min-height: 0; }
  .ae-lib-sidebar .ae-lib-sidebar__panel {
    --ae-from-transform: translateX(-100%); --ae-pop-transform: translateX(0); --ae-dismiss-transform: translateX(-100%);
    --ae-pop-duration: 220ms; --ae-dismiss-duration: 180ms;
    position: absolute; inset: 0 auto 0 0; z-index: 3; display: flex; flex-direction: column;
    width: min(var(--sidebar-width), 85%); min-height: 0; overflow-y: auto; overscroll-behavior: contain;
    padding: 16px; background: var(--sidebar-surface); border-right: 1px solid #dce2ec;
  }
  .ae-lib-sidebar:not(.ae--fits-medium) .ae-lib-sidebar__panel:is(.ae--dismissed, .ae--unpop) { visibility: hidden; }
  .ae-lib-sidebar__panel-heading { display: flex; align-items: center; justify-content: space-between; gap: 8px; margin-bottom: 24px; }
  .ae-lib-sidebar__nav { display: flex; flex: 1; flex-direction: column; gap: 4px; }
  .ae-lib-sidebar__link { display: flex; align-items: center; min-height: 44px; padding: 10px 12px; border-radius: 9px; text-decoration: none; overflow-wrap: anywhere; }
  .ae-lib-sidebar__link:hover { background: #edf1fa; }
  .ae-lib-sidebar__link[aria-current="page"] { background: #e8edfc; color: var(--sidebar-accent); font-weight: 650; }
  .ae-lib-sidebar .ae-lib-sidebar__group { margin: 20px 12px 4px; color: #536179; font-size: 11px; font-weight: 650; letter-spacing: .08em; text-transform: uppercase; }
  .ae-lib-sidebar__account { margin-top: auto; padding-top: 28px; }
  .ae-lib-sidebar__backdrop { position: absolute; inset: 0; z-index: 2; visibility: hidden; background: #16223c66; }
  .ae-lib-sidebar:not(.ae--fits-medium) .ae-lib-sidebar__panel:is(.ae--popping, .ae--pop, .ae--dismissing) ~ .ae-lib-sidebar__backdrop { visibility: visible; }
  .ae-lib-sidebar__content { min-width: 0; min-height: 0; overflow-y: auto; overscroll-behavior: contain; padding: clamp(16px, 4%, 36px); overflow-wrap: anywhere; }
  .ae-lib-sidebar .ae-lib-sidebar__eyebrow { color: #536179; font-size: 11px; font-weight: 650; letter-spacing: .09em; }
  .ae-lib-sidebar .ae-lib-sidebar__title { margin: 8px 0; font-size: clamp(24px, 4vw, 32px); font-weight: 750; letter-spacing: -.04em; }
  .ae-lib-sidebar__cards { display: grid; grid-template-columns: repeat(auto-fit, minmax(min(100%, 180px), 1fr)); gap: 12px; margin: 24px 0; }
  .ae-lib-sidebar__card { min-width: 0; padding: 20px; border: 1px solid #dce2ec; border-radius: 12px; background: var(--sidebar-surface); }
  .ae-lib-sidebar .ae-lib-sidebar__card h3 { margin-bottom: 12px; font-size: 15px; font-weight: 650; }
  .ae-lib-sidebar .ae-lib-sidebar__metric { font-size: 28px; font-weight: 750; }
  .ae-lib-sidebar .ae-lib-sidebar__muted { color: #536179; font-size: 13px; }
  .ae-lib-sidebar .ae-lib-sidebar__section { margin-top: 20px; scroll-margin-top: 16px; }
  .ae-lib-sidebar .ae-lib-sidebar__section h3 { margin-bottom: 12px; font-size: 18px; font-weight: 650; }
  .ae-lib-sidebar.ae--fits-medium .ae-lib-sidebar__layout { grid-template-columns: var(--sidebar-width) minmax(0, 1fr); }
  .ae-lib-sidebar.ae--fits-medium .ae-lib-sidebar__panel {
    --ae-from-transform: translateX(0); --ae-dismiss-transform: translateX(0);
    position: relative; inset: auto; width: auto; grid-column: 1;
  }
  .ae-lib-sidebar.ae--fits-medium .ae-lib-sidebar__mobile { display: none; }
  .ae-lib-sidebar[data-sidebar-switching] .ae-lib-sidebar__panel { --ae-pop-duration: 0s; --ae-dismiss-duration: 0s; }
  .ae-lib-sidebar[data-sidebar-switching]:not(.ae--fits-medium) :is(.ae-lib-sidebar__panel, .ae-lib-sidebar__backdrop) { visibility: hidden; }
  @media (prefers-reduced-motion: reduce) {
    .ae-lib-sidebar .ae-lib-sidebar__panel { --ae-pop-duration: 0s; --ae-dismiss-duration: 0s; }
  }
</style>
<!-- Rename the ae-sidebar-* IDs and their matching targets for another instance. -->
<section class="ae-lib-sidebar" data-ae-adaptive aria-label="Aplicação de exemplo: Estúdio">
  <header class="ae-lib-sidebar__header">
    <button class="ae-lib-sidebar__button ae-lib-sidebar__mobile" type="button" aria-label="Abrir navegação"
      aria-controls="ae-sidebar-nav" aria-expanded="false" data-ae-present-trigger="toggle" data-ae-present-target="ae-sidebar-nav">
      <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 6h16M4 12h16M4 18h16"/></svg>
    </button>
    <span class="ae-lib-sidebar__brand">estúdio<span aria-hidden="true"> /</span></span>
    <span class="ae-lib-sidebar__context">Seu espaço de trabalho</span>
  </header>
  <div class="ae-lib-sidebar__layout">
    <aside id="ae-sidebar-nav" class="ae-lib-sidebar__panel ae--dismissed" data-ae-present="transform" data-ae-dismiss-on-click="false">
      <div class="ae-lib-sidebar__panel-heading">
        <span class="ae-lib-sidebar__brand">estúdio / workspace</span>
        <button class="ae-lib-sidebar__button ae-lib-sidebar__mobile" type="button" aria-label="Fechar navegação" data-ae-present-trigger="dismiss">
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m6 6 12 12M6 18 18 6"/></svg>
        </button>
      </div>
      <nav class="ae-lib-sidebar__nav" aria-label="Navegação principal">
        <a class="ae-lib-sidebar__link" href="#ae-sidebar-overview" tabindex="0" aria-current="page">Visão geral</a>
        <a class="ae-lib-sidebar__link" href="#ae-sidebar-projects" tabindex="0">Projetos</a>
        <a class="ae-lib-sidebar__link" href="#ae-sidebar-activity" tabindex="0">Atividade</a>
        <p class="ae-lib-sidebar__group">Seu time</p>
        <a class="ae-lib-sidebar__link" href="#ae-sidebar-team" tabindex="0">Pessoas e colaboração</a>
        <a class="ae-lib-sidebar__link" href="#ae-sidebar-notes" tabindex="0">Notas compartilhadas</a>
        <div class="ae-lib-sidebar__account"><a class="ae-lib-sidebar__link" href="#ae-sidebar-settings" tabindex="0">Configurações da conta</a></div>
      </nav>
    </aside>
    <div class="ae-lib-sidebar__backdrop" data-ae-present-trigger="dismiss" data-ae-present-target="ae-sidebar-nav" aria-hidden="true"></div>
    <main class="ae-lib-sidebar__content" tabindex="0" aria-label="Conteúdo do workspace">
      <section id="ae-sidebar-overview">
        <p class="ae-lib-sidebar__eyebrow">WORKSPACE / VISÃO GERAL</p>
        <h2 class="ae-lib-sidebar__title">Bom dia, Alex.</h2>
        <p>Um lugar tranquilo para organizar o trabalho e dar espaço à próxima ideia.</p>
      </section>
      <div class="ae-lib-sidebar__cards">
        <article class="ae-lib-sidebar__card"><h3>Projetos ativos</h3><p class="ae-lib-sidebar__metric">08</p><p class="ae-lib-sidebar__muted">Duas ideias ganharam vida esta semana.</p></article>
        <article class="ae-lib-sidebar__card"><h3>Próximas entregas</h3><p class="ae-lib-sidebar__metric">03</p><p class="ae-lib-sidebar__muted">Tudo no seu ritmo, um passo de cada vez.</p></article>
      </div>
      <section id="ae-sidebar-projects" class="ae-lib-sidebar__section ae-lib-sidebar__card"><h3>Projetos em andamento</h3><p>Identidade do estúdio · Revisão de conteúdo · Novas experiências</p></section>
      <section id="ae-sidebar-activity" class="ae-lib-sidebar__section ae-lib-sidebar__card"><h3>Atividade recente</h3><p>Marina compartilhou uma proposta. Seu time concluiu a primeira revisão.</p></section>
      <section id="ae-sidebar-team" class="ae-lib-sidebar__section ae-lib-sidebar__card"><h3>Feito em conjunto</h3><p>Reserve um momento para conversar sobre o que vem a seguir.</p></section>
      <section id="ae-sidebar-notes" class="ae-lib-sidebar__section ae-lib-sidebar__card"><h3>Notas compartilhadas</h3><p>As melhores ideias também precisam de espaço para respirar.</p></section>
      <section id="ae-sidebar-settings" class="ae-lib-sidebar__section ae-lib-sidebar__card"><h3>Do seu jeito</h3><p>Personalize os links, as cores e a largura para integrar este componente ao seu projeto.</p></section>
    </main>
  </div>
</section>
<script>
(() => {
  const root = document.currentScript.previousElementSibling;
  const panel = root.querySelector(".ae-lib-sidebar__panel");
  const opener = root.querySelector("[data-ae-present-trigger]");
  let connected = false, desktop, revision = 0, closing;
  const isDesktop = () => root.classList.contains("ae--fits-medium");

  // A semantic closed Present stays visible on desktop; CSS hides it on mobile.
  // Await mounting, both before startup and when pasted into an initialized host.
  function connect() {
    if (!$ae(panel)?.present || !$ae.ext.focus?.initialized) return;
    connected = true;
    document.removeEventListener("AelluxJsMount", connect);
    if (root.classList.contains("ae--fits-compact")) sync();
  }
  async function sync() {
    if (!connected || desktop === isDesktop()) return;
    desktop = isDesktop();
    const current = ++revision;
    root.setAttribute("data-sidebar-switching", "");
    // Exclude the closing drawer immediately, even during an interrupted resize.
    if (!desktop && panel.contains(document.activeElement)) opener.focus({ preventScroll: true });
    panel.inert = !desktop;
    closing ||= $ae.ext.present.dismiss(panel).finally(() => { closing = null; });
    await closing;
    if (current === revision) root.removeAttribute("data-sidebar-switching");
  }
  root.addEventListener("AelluxJsAdaptiveUpdate", sync);
  panel.addEventListener("AelluxJsBeforePop", event => {
    if (isDesktop() || root.hasAttribute("data-sidebar-switching")) event.preventDefault();
    else panel.inert = false;
  });
  panel.addEventListener("AelluxJsPop", () => {
    if (!isDesktop()) panel.querySelector("button").focus({ preventScroll: true });
  });
  panel.addEventListener("AelluxJsDismiss", () => {
    panel.inert = !isDesktop();
    if (!isDesktop() && !root.hasAttribute("data-sidebar-switching")) {
      if (document.activeElement !== opener) $ae.ext.focus.restoreLastFocus();
      if (document.activeElement !== opener) opener.focus({ preventScroll: true });
    }
  });
  root.addEventListener("keydown", event => {
    if (event.key === "Escape" && !isDesktop() && opener.getAttribute("aria-expanded") === "true") {
      event.preventDefault();
      $ae.ext.present.dismiss(panel);
    }
  });
  panel.addEventListener("click", event => {
    const link = event.target.closest("a");
    const href = link?.getAttribute("href");
    const target = href?.startsWith("#") && document.getElementById(href.slice(1));
    // Keep local destinations inside this component, including in srcdoc previews.
    if (target && root.contains(target)) {
      event.preventDefault();
      target.scrollIntoView({ block: "nearest" });
    }
    if (!isDesktop() && link) $ae.ext.present.dismiss(panel);
  });
  document.addEventListener("AelluxJsMount", connect);
  connect();
})();
</script>`
    },
    {
      id: "responsive-split-hero",
      title: "Responsive Split Hero",
      category: "apresentacao",
      description: "Título, descrição, CTA e arte em CSS que se reorganizam sem JavaScript, runtime ou imagens externas.",
      tags: ["hero","html","css","responsive"],
      extensions: [],
      dependencies: [],
      features: ["Responsivo","Teclado","HTML / CSS"],
      code: String.raw`<!-- Requisitos: somente HTML e CSS. Renomeie IDs e referências para repetir o componente. -->
<style>
  .ae-lib-hero { container-type: inline-size; color: #202b3c; background: #f5f1e9; font: 16px/1.6 system-ui, sans-serif; }
  .ae-lib-hero, .ae-lib-hero * { box-sizing: border-box; }
  .ae-lib-hero__layout { display: grid; gap: 2rem; align-items: center; padding: clamp(1.25rem, 5%, 4rem); }
  .ae-lib-hero h2 { font: 750 clamp(2rem, 5cqi, 4rem)/1.06 system-ui, sans-serif; letter-spacing: -.05em; margin: .75rem 0 1rem; }
  .ae-lib-hero p { margin: 0 0 1.5rem; max-width: 38ch; }
  .ae-lib-hero a { display: inline-block; padding: .8rem 1.25rem; border-radius: 2rem; background: #202b3c; color: white; text-decoration: none; }
  .ae-lib-hero a:focus-visible { outline: 3px solid #3159c6; outline-offset: 4px; }
  .ae-lib-hero__art { min-width: 0; min-height: 220px; border-radius: 40% 40% 1rem 1rem; background: radial-gradient(circle at 65% 25%, #ffda75 0 14%, transparent 14.5%), linear-gradient(155deg, transparent 48%, #446c60 48.5% 65%, #253e37 65.5%), #b8d5d9; }
  @container (min-width: 680px) { .ae-lib-hero__layout { grid-template-columns: 1fr 1fr; } .ae-lib-hero__art { min-height: 350px; } }
</style>
<section class="ae-lib-hero" aria-label="Apresentação do estúdio">
  <div class="ae-lib-hero__layout">
    <div><span>ESTÚDIO / NOVOS CAMINHOS</span><h2>Uma ideia merece espaço.</h2><p>Transforme o próximo passo em algo que as pessoas possam sentir, explorar e usar.</p><a href="#ae-hero-projects">Conheça os projetos ↗</a></div>
    <div class="ae-lib-hero__art" role="img" aria-label="Paisagem geométrica com montanhas e sol"></div>
  </div>
  <div id="ae-hero-projects" style="padding:1.25rem"><h3>Seu próximo projeto</h3><p>Substitua esta área pelo destino da sua chamada.</p></div>
</section>`
    },
    {
      id: "slow-scroll",
      title: "Responsive Card Carousel",
      category: "rolagem",
      description: "Cards adaptáveis com arraste, toque, setas do teclado e controles. Scrollbox Snap alinha a coleção após cada movimento.",
      tags: ["scrollbox","carrossel","snap","cards"],
      extensions: ["scrollbox","scrollbox-snap"],
      dependencies: ["Bootstrap 5.3.8"],
      features: ["Responsivo","Teclado","Touch"],
      code: String.raw`<!-- Requisitos: Bootstrap 5.3.8; AelluxJS Scrollbox e Scrollbox Snap registrados no host. Renomeie IDs e referências para repetir o componente. -->
<style>
  .ae-lib-cards { container-type: inline-size; }
  .ae-lib-cards__track { display: flex; gap: 1rem; overflow-x: auto; padding-bottom: 1rem; overscroll-behavior-x: contain; }
  .ae-lib-cards__item { flex: 0 0 85%; min-width: 0; padding: 1.5rem; border-radius: 1rem; background: var(--bs-tertiary-bg); }
  .ae-lib-cards__art { height: 100px; margin-bottom: 1rem; border-radius: .75rem; background: linear-gradient(145deg, #d1e9df, #8bbaa5); }
  .ae-lib-cards__item:nth-child(even) .ae-lib-cards__art { background: linear-gradient(145deg, #e8dbbc, #d9ad63); }
  @container (min-width: 600px) { .ae-lib-cards__item { flex-basis: calc((100% - 1rem) / 2); } }
  @container (min-width: 1000px) { .ae-lib-cards__item { flex-basis: calc((100% - 2rem) / 3); } }
</style>
<section class="ae-lib-cards p-4" aria-label="Coleção de projetos">
  <h2 class="h4">Pequenas grandes ideias.</h2><p class="small text-body-secondary">Arraste, deslize ou use as setas para explorar.</p>
  <div id="ae-cards-track" class="ae-lib-cards__track" data-ae-scrollbox="pointer" data-ae-scrollbox-snap data-ae-scrollbox-fade="false" data-ae-scrollbar="horizontal" tabindex="0" role="region" aria-label="Projetos do estúdio">
    <article class="ae-lib-cards__item" data-ae-snap-item="start"><div class="ae-lib-cards__art" aria-hidden="true"></div><h3 class="h5">Perto do mar</h3><p class="small">Uma identidade para quem segue outros ritmos.</p></article>
    <article class="ae-lib-cards__item" data-ae-snap-item="start"><div class="ae-lib-cards__art" aria-hidden="true"></div><h3 class="h5">Entre as folhas</h3><p class="small">Conteúdo que encontra o seu próprio caminho.</p></article>
    <article class="ae-lib-cards__item" data-ae-snap-item="start"><div class="ae-lib-cards__art" aria-hidden="true"></div><h3 class="h5">Além do azul</h3><p class="small">Uma nova perspectiva para ideias conhecidas.</p></article>
    <article class="ae-lib-cards__item" data-ae-snap-item="start"><div class="ae-lib-cards__art" aria-hidden="true"></div><h3 class="h5">Novos encontros</h3><p class="small">Experiências feitas para aproximar pessoas.</p></article>
  </div>
  <div class="d-flex justify-content-end gap-2 mt-2"><button type="button" class="btn btn-outline-secondary" data-direction="previous" aria-controls="ae-cards-track" aria-label="Projetos anteriores">←</button><button type="button" class="btn btn-warning" data-direction="next" aria-controls="ae-cards-track" aria-label="Próximos projetos">→</button></div>
</section>
<script>
(() => {
  const root = document.currentScript.previousElementSibling, track = root.querySelector('[data-ae-scrollbox]');
  root.addEventListener("click", event => { const button = event.target.closest('[data-direction]'); if (button) $ae.ext.scrollboxSnap[button.dataset.direction](track); });
  track.addEventListener("keydown", event => { if (event.target !== track || !["ArrowLeft", "ArrowRight"].includes(event.key)) return; event.preventDefault(); $ae.ext.scrollboxSnap[event.key === "ArrowRight" ? "next" : "previous"](track); });
})();
</script>`
    },
    {
      id: "parallax-carousel",
      title: "Parallax Carousel",
      category: "rolagem",
      description: "Paisagens em CSS com camadas que respondem à posição horizontal. O movimento é removido quando solicitado pelo sistema.",
      tags: ["parallax","viewport","carrossel","snap"],
      extensions: ["scrollbox","scrollbox-snap","viewport"],
      dependencies: ["Bootstrap 5.3.8"],
      features: ["Responsivo","Teclado","Touch"],
      code: String.raw`<!-- Requisitos: Bootstrap 5.3.8; AelluxJS Scrollbox, Scrollbox Snap e Viewport registrados no host. Renomeie IDs e referências para repetir o componente. -->
<style>
  .ae-lib-parallax__track { display: flex; gap: 1rem; overflow-x: auto; padding-bottom: 1rem; overscroll-behavior-x: contain; }
  .ae-lib-parallax__slide { flex: 0 0 min(85%, 600px); min-width: 0; }
  .ae-lib-parallax__scene { position: relative; overflow: hidden; isolation: isolate; height: 230px; padding: 1.5rem; border-radius: 1rem; background: #c5dfe1; color: #fff; }
  .ae-lib-parallax__scene::before { content: ""; position: absolute; z-index: -1; inset: -20% -25%; background: radial-gradient(circle at 65% 20%, #ffdc82 0 9%, transparent 9.5%), linear-gradient(155deg, transparent 40%, #557d6a 40.5% 60%, #24483b 60.5%); transform: translateX(calc((var(--ae-viewport-x, .5) - .5) * 65px)); }
  .ae-lib-parallax__caption { position: relative; margin-top: 100px; transform: translateX(calc((var(--ae-viewport-x, .5) - .5) * -20px)); }
  .ae-lib-parallax__caption h3 { text-shadow: 0 1px 5px #000; }
  @media (prefers-reduced-motion: reduce) { .ae-lib-parallax__scene::before, .ae-lib-parallax__caption { transform: none; } }
</style>
<section class="ae-lib-parallax p-4" aria-label="Viagens em camadas">
  <h2 class="h4">O caminho também é paisagem.</h2><p class="small text-body-secondary">Role para o lado. Cada camada tem seu ritmo.</p>
  <div id="ae-parallax-track" class="ae-lib-parallax__track" data-ae-scrollbox="pointer" data-ae-scrollbox-snap data-ae-scrollbox-fade="false" tabindex="0" role="region" aria-label="Destinos">
    <article class="ae-lib-parallax__slide" data-ae-snap-item="start" data-ae-viewport="x" data-ae-viewport-target="ae-parallax-coast"><div id="ae-parallax-coast" class="ae-lib-parallax__scene"><div class="ae-lib-parallax__caption"><h3 class="h4">Costa tranquila</h3><p>01 / Encontre outra velocidade.</p></div></div></article>
    <article class="ae-lib-parallax__slide" data-ae-snap-item="start" data-ae-viewport="x" data-ae-viewport-target="ae-parallax-forest"><div id="ae-parallax-forest" class="ae-lib-parallax__scene"><div class="ae-lib-parallax__caption"><h3 class="h4">Entre as montanhas</h3><p>02 / Deixe o horizonte surpreender.</p></div></div></article>
    <article class="ae-lib-parallax__slide" data-ae-snap-item="start" data-ae-viewport="x" data-ae-viewport-target="ae-parallax-dunes"><div id="ae-parallax-dunes" class="ae-lib-parallax__scene"><div class="ae-lib-parallax__caption"><h3 class="h4">Além das dunas</h3><p>03 / Um novo ponto de vista.</p></div></div></article>
  </div>
  <div class="d-flex gap-2 justify-content-end"><button type="button" class="btn btn-outline-secondary" data-direction="previous" aria-label="Destino anterior" aria-controls="ae-parallax-track">←</button><button type="button" class="btn btn-warning" data-direction="next" aria-label="Próximo destino" aria-controls="ae-parallax-track">→</button></div>
</section>
<script>
(() => {
  const root = document.currentScript.previousElementSibling, track = root.querySelector('[data-ae-scrollbox]');
  root.addEventListener("click", event => { const button = event.target.closest('[data-direction]'); if (button) $ae.ext.scrollboxSnap[button.dataset.direction](track); });
  track.addEventListener("keydown", event => { if (event.target !== track || !["ArrowLeft", "ArrowRight"].includes(event.key)) return; event.preventDefault(); $ae.ext.scrollboxSnap[event.key === "ArrowRight" ? "next" : "previous"](track); });
})();
</script>`
    },
    {
      id: "mobile-bottom-navigation",
      title: "Mobile Bottom Navigation",
      category: "navegacao",
      description: "Navegação inferior em telas pequenas e barra no desktop, preservando o conteúdo e a seleção ao mudar de largura.",
      tags: ["mobile","navigation","adaptive","touch"],
      extensions: ["adaptive","present"],
      dependencies: ["Bootstrap 5.3.8"],
      features: ["Responsivo","Teclado","Touch"],
      code: String.raw`<!-- Requisitos: Bootstrap 5.3.8; AelluxJS Adaptive e Present registrados no host. Renomeie IDs e referências para repetir o componente. -->
<style>
  .ae-lib-bottomnav { display: flex; flex-direction: column; min-height: 280px; background: var(--bs-tertiary-bg); }
  .ae-lib-bottomnav nav { display: flex; order: 2; position: sticky; bottom: 0; gap: .5rem; padding: .75rem; background: var(--bs-body-bg); border-top: 1px solid var(--bs-border-color); }
  .ae-lib-bottomnav nav button { flex: 1; min-height: 44px; }
  .ae-lib-bottomnav nav button[aria-pressed="true"] { background: var(--bs-warning); color: #232323; }
  .ae-lib-bottomnav.ae--fits-medium nav { order: 0; border-top: 0; border-bottom: 1px solid var(--bs-border-color); }
  .ae-lib-bottomnav__pages { flex: 1; padding: 1.5rem; }
  .ae-lib-bottomnav__pages section { --ae-pop-duration: 0s; --ae-dismiss-duration: 0s; }
</style>
<section class="ae-lib-bottomnav" data-ae-adaptive aria-label="Aplicação de notas">
  <nav aria-label="Navegação das notas"><button class="btn" type="button" data-page="home" aria-controls="ae-bottomnav-home" aria-pressed="true">⌂ Início</button><button class="btn" type="button" data-page="saved" aria-controls="ae-bottomnav-saved" aria-pressed="false">☆ Salvos</button><button class="btn" type="button" data-page="profile" aria-controls="ae-bottomnav-profile" aria-pressed="false">◯ Perfil</button></nav>
  <div class="ae-lib-bottomnav__pages" data-ae-present-group data-ae-present-active="ae-bottomnav-home">
    <section id="ae-bottomnav-home" data-ae-present="opacity" data-ae-dismiss-on-click="false" tabindex="-1"><h2 class="h4">Suas ideias, por perto.</h2><p>Continue de onde parou.</p></section>
    <section id="ae-bottomnav-saved" data-ae-present="opacity" data-ae-dismiss-on-click="false" tabindex="-1" hidden><h2 class="h4">Para ver depois.</h2><p>Um espaço para guardar descobertas.</p></section>
    <section id="ae-bottomnav-profile" data-ae-present="opacity" data-ae-dismiss-on-click="false" tabindex="-1" hidden><h2 class="h4">Do seu jeito.</h2><p>Seu perfil acompanha suas escolhas.</p></section>
  </div>
</section>
<script>
(() => {
  const root = document.currentScript.previousElementSibling;
  // Local state deliberately avoids owning the host application's URL/history.
  root.addEventListener("click", event => {
    const button = event.target.closest('[data-page]'); if (!button) return;
    root.querySelectorAll('[data-page]').forEach(item => item.setAttribute("aria-pressed", item === button));
    const panel = root.querySelector("#" + button.getAttribute("aria-controls"));
    $ae.ext.present.pop(panel).then(() => panel.focus({preventScroll:true}));
  });
})();
</script>`
    },
    {
      id: "responsive-bottom-sheet",
      title: "Responsive Bottom Sheet",
      category: "camadas",
      description: "Painel modal na base do mobile e centralizado no desktop. O diálogo nativo cuida do foco; Present anima seu conteúdo.",
      tags: ["sheet","modal","present","focus"],
      extensions: ["present","input","focus"],
      dependencies: ["Bootstrap 5.3.8"],
      features: ["Responsivo","Teclado","Touch"],
      code: String.raw`<!-- Requisitos: Bootstrap 5.3.8; AelluxJS Present, Input e Focus registrados no host. Renomeie IDs e referências para repetir o componente. -->
<style>
  .ae-lib-sheet__dialog { position: fixed; inset: auto 0 0; width: min(100%, 560px); max-width: 100%; max-height: 85dvh; margin: 0 auto; padding: 0; border: 0; border-radius: 1.5rem 1.5rem 0 0; color: var(--bs-body-color); background: var(--bs-body-bg); }
  .ae-lib-sheet__dialog::backdrop { background: #10182788; }
  .ae-lib-sheet__panel { padding: 1.5rem; --ae-from-transform: translateY(50px); --ae-dismiss-transform: translateY(50px); --ae-pop-duration: 200ms; --ae-dismiss-duration: 160ms; }
  @media (min-width: 768px) { .ae-lib-sheet__dialog { inset: 0; margin: auto; border-radius: 1.5rem; } }
  @media (prefers-reduced-motion: reduce) { .ae-lib-sheet__panel { --ae-pop-duration: 0s; --ae-dismiss-duration: 0s; } }
</style>
<section class="ae-lib-sheet p-4" aria-label="Opções de compartilhamento">
  <h2 class="h4">Boas ideias circulam.</h2><p>Escolha como compartilhar seu projeto.</p>
  <button type="button" class="btn btn-warning" aria-haspopup="dialog" aria-controls="ae-sheet-dialog">Compartilhar projeto</button>
  <dialog id="ae-sheet-dialog" class="ae-lib-sheet__dialog" aria-labelledby="ae-sheet-title">
    <div class="ae-lib-sheet__panel" data-ae-present="opacity transform" data-ae-dismiss-on-click="false" hidden>
      <div class="d-flex justify-content-between gap-3"><h3 id="ae-sheet-title" class="h5">Compartilhar projeto</h3><button type="button" class="btn btn-sm btn-outline-secondary" data-close aria-label="Fechar painel" autofocus>×</button></div>
      <label class="form-label small mt-3" for="ae-sheet-email">Convidar por e-mail</label><input id="ae-sheet-email" class="form-control" type="email" placeholder="pessoa@exemplo.com" data-ae-focus="next">
      <p class="small text-body-secondary mt-3">Demonstração local: nenhum convite será enviado.</p><button type="button" class="btn btn-warning w-100" data-close>Concluir</button>
    </div>
  </dialog>
</section>
<script>
(() => {
  const root = document.currentScript.previousElementSibling, dialog = root.querySelector("dialog"), panel = dialog.firstElementChild, opener = root.querySelector("button");
  let closing = false;
  const close = async () => { if (closing || !dialog.open) return; closing = true; await $ae.ext.present.dismiss(panel); dialog.close(); closing = false; opener.focus(); };
  opener.addEventListener("click", async () => { if (dialog.open) return; dialog.showModal(); await $ae.ext.present.pop(panel); if (dialog.open && !closing) panel.querySelector("button").focus(); });
  dialog.addEventListener("cancel", event => { event.preventDefault(); close(); });
  dialog.addEventListener("keydown", event => { if (event.key === "Escape") { event.preventDefault(); close(); } });
  dialog.addEventListener("click", event => { if (event.target.closest('[data-close]') || event.target === dialog) close(); });
})();
</script>`
    },
    {
      id: "toast-notification-stack",
      title: "Toast Notification Stack",
      category: "camadas",
      description: "Até três notificações, fechamento automático e progresso visual. O prazo pausa enquanto o mouse ou o foco está sobre a mensagem.",
      tags: ["toast","feedback","present","notificacoes"],
      extensions: ["present","feedback"],
      dependencies: ["Bootstrap 5.3.8"],
      features: ["Responsivo","Teclado","Touch"],
      code: String.raw`<!-- Requisitos: Bootstrap 5.3.8; AelluxJS Present e Feedback registrados no host. -->
<style>
  .ae-lib-toasts__stack { display: grid; gap: .75rem; max-width: 420px; margin-top: 1rem; }
  .ae-lib-toasts__item { position: relative; overflow: hidden; padding: 1rem; border: 1px solid var(--bs-border-color); border-radius: .75rem; background: var(--bs-tertiary-bg); --ae-from-transform: translateY(12px); --ae-pop-duration: 160ms; }
  .ae-lib-toasts__timer { display: block; height: 3px; width: 100%; margin-top: .75rem; }
  @media (prefers-reduced-motion: reduce) { .ae-lib-toasts__item { --ae-pop-duration: 0s; --ae-dismiss-duration: 0s; } }
</style>
<section class="ae-lib-toasts p-4" aria-label="Notificações do projeto">
  <h2 class="h4">Uma coisa a menos na lista.</h2><p class="small text-body-secondary">Adicione mensagens. O prazo de 6 segundos pausa ao interagir.</p>
  <button type="button" class="btn btn-warning" data-add>Salvar projeto</button><p class="visually-hidden" role="status" data-announcer></p>
  <div class="ae-lib-toasts__stack"></div>
  <template><article class="ae-lib-toasts__item" data-ae-present="opacity transform" data-ae-dismiss-on-click="false" hidden><div class="d-flex justify-content-between gap-3"><span data-message></span><button type="button" class="btn btn-sm btn-outline-secondary" aria-label="Fechar notificação">×</button></div><progress class="ae-lib-toasts__timer" max="6000" value="6000" aria-label="Tempo restante da notificação"></progress></article></template>
</section>
<script>
(() => {
  const root = document.currentScript.previousElementSibling, stack = root.querySelector('.ae-lib-toasts__stack');
  let count = 0;
  root.querySelector('[data-add]').addEventListener("click", async () => {
    if (stack.children.length >= 3) { root.querySelector('[data-announcer]').textContent = "Feche uma notificação para adicionar outra."; return; }
    const item = root.querySelector("template").content.firstElementChild.cloneNode(true), message = "Projeto salvo · " + ++count;
    item.querySelector('[data-message]').textContent = message; stack.append(item);
    await $ae.mount(item); await $ae.ext.present.pop(item);
    root.querySelector('[data-announcer]').textContent = message; $ae.ext.feedback.success(message, root);
    let remaining = 6000, last = performance.now(), closing = false;
    const close = async (returnFocus = false) => { if (closing) return; closing = true; clearInterval(timer); if (returnFocus || item.contains(document.activeElement)) root.querySelector('[data-add]').focus(); await $ae.ext.present.dismiss(item); await $ae.unmount(item); item.remove(); };
    const timer = setInterval(() => { const now = performance.now(); if (!document.hidden && !item.matches(':hover') && !item.contains(document.activeElement)) remaining -= now - last; last = now; item.querySelector('progress').value = Math.max(0, remaining); if (remaining <= 0) close(); }, 100);
    item.querySelector('button').addEventListener('click', () => close(true));
  });
})();
</script>`
    },
    {
      id: "anchored-popover",
      title: "Anchored Popover",
      category: "camadas",
      description: "Um painel contextual acompanha seu botão e escolhe o lado disponível. Escape fecha o painel e devolve o foco.",
      tags: ["popover","anchor","present","contextual"],
      extensions: ["anchor","present","focus"],
      dependencies: ["Bootstrap 5.3.8"],
      features: ["Responsivo","Teclado","Touch"],
      code: String.raw`<!-- Requisitos: Bootstrap 5.3.8; AelluxJS Anchor, Present e Focus registrados no host. Renomeie IDs e referências para repetir o componente. -->
<style>
  .ae-lib-popover { position: relative; min-height: 340px; padding: 1.5rem; }
  .ae-lib-popover__position { position: absolute; z-index: 1; width: min(280px, calc(100% - 2rem)); }
  .ae-lib-popover__panel { padding: 1rem; border: 1px solid var(--bs-border-color); border-radius: .75rem; background: var(--bs-body-bg); box-shadow: 0 10px 30px #0002; --ae-pop-duration: 160ms; }
  @media (prefers-reduced-motion: reduce) { .ae-lib-popover__panel { --ae-pop-duration: 0s; --ae-dismiss-duration: 0s; } }
</style>
<section class="ae-lib-popover" aria-label="Detalhes do projeto">
  <h2 class="h4">Tudo tem seu contexto.</h2><p class="small text-body-secondary">Abra os detalhes sem sair da página.</p>
  <button id="ae-popover-trigger" class="btn btn-warning" type="button" data-ae-present-trigger="toggle" data-ae-present-target="ae-popover-panel" aria-controls="ae-popover-panel" aria-expanded="false">Detalhes do projeto</button>
  <div class="ae-lib-popover__position" data-ae-anchor="bottom-left:top-left, top-left:bottom-left" data-ae-anchor-target="ae-popover-trigger">
    <aside id="ae-popover-panel" class="ae-lib-popover__panel" data-ae-present="opacity" data-ae-dismiss-on-click="false" aria-labelledby="ae-popover-title" hidden>
      <h3 id="ae-popover-title" class="h6">Estúdio / Identidade</h3><p class="small">Uma coleção de novas perspectivas, feita em conjunto.</p><button class="btn btn-sm btn-outline-secondary" type="button" data-ae-present-trigger="dismiss">Fechar detalhes</button>
    </aside>
  </div>
</section>
<script>
(() => {
  const root = document.currentScript.previousElementSibling, panel = root.querySelector('aside'), opener = root.querySelector('button');
  panel.addEventListener("AelluxJsPop", () => panel.querySelector('button').focus({preventScroll:true}));
  panel.addEventListener("AelluxJsDismiss", () => { if (panel.contains(document.activeElement)) opener.focus({preventScroll:true}); });
  root.addEventListener("keydown", event => { if (event.key === "Escape" && opener.getAttribute("aria-expanded") === "true") { event.preventDefault(); $ae.ext.present.dismiss(panel); opener.focus(); } });
})();
</script>`
    },
    {
      id: "multi-step-form",
      title: "Multi-step Form",
      category: "formularios",
      description: "Duas etapas com validação nativa, retorno sem perder valores e confirmação local. Não envia dados para um servidor.",
      tags: ["formulario","etapas","validacao","focus"],
      extensions: ["focus","feedback"],
      dependencies: ["Bootstrap 5.3.8"],
      features: ["Responsivo","Teclado","Touch"],
      code: String.raw`<!-- Requisitos: Bootstrap 5.3.8; AelluxJS Focus e Feedback registrados no host. Renomeie IDs e referências para repetir o componente. -->
<section class="ae-lib-steps p-4" aria-label="Briefing do projeto">
  <h2 class="h4">Vamos começar pelo essencial.</h2><p class="small text-body-secondary" data-step-status role="status">Etapa 1 de 2 · Contato</p><progress class="w-100 mb-3" max="2" value="1" aria-label="Etapa do formulário"></progress>
  <form>
    <fieldset data-step><legend class="h6">Como podemos conversar?</legend><label class="form-label small" for="ae-steps-name">Nome</label><input id="ae-steps-name" class="form-control mb-2" autocomplete="name" required data-ae-focus="next"><label class="form-label small" for="ae-steps-email">E-mail</label><input id="ae-steps-email" class="form-control mb-3" type="email" autocomplete="email" required><button class="btn btn-warning" type="submit">Continuar →</button></fieldset>
    <fieldset data-step hidden disabled><legend class="h6">O que você quer criar?</legend><label class="form-label small" for="ae-steps-project">Resumo do projeto</label><textarea id="ae-steps-project" class="form-control mb-3" required rows="3"></textarea><div class="d-flex gap-2"><button class="btn btn-outline-secondary" type="button" data-back>← Voltar</button><button class="btn btn-warning" type="submit">Concluir briefing</button></div></fieldset>
  </form>
  <div data-done role="status" hidden><h3 class="h5">Primeiro passo dado.</h3><p>Seu briefing foi preparado nesta demonstração. Nenhum dado foi enviado.</p><button class="btn btn-outline-secondary" type="button" data-restart>Começar novamente</button></div>
</section>
<script>
(() => {
  const root = document.currentScript.previousElementSibling, form = root.querySelector('form'), steps = [...form.querySelectorAll('fieldset')]; let step = 0;
  const show = index => { step = index; steps.forEach((item, i) => { item.hidden = item.disabled = i !== step; }); root.querySelector('progress').value = step + 1; root.querySelector('[data-step-status]').textContent = step ? 'Etapa 2 de 2 · Projeto' : 'Etapa 1 de 2 · Contato'; steps[step].querySelector('input, textarea').focus(); };
  form.addEventListener('submit', event => { event.preventDefault(); if (!form.reportValidity()) return; if (!step) show(1); else { form.hidden = true; root.querySelector('[data-done]').hidden = false; root.querySelector('[data-step-status]').textContent = 'Briefing concluído'; root.querySelector('[data-restart]').focus(); $ae.ext.feedback.success('Briefing preparado.', root); } });
  root.querySelector('[data-back]').addEventListener('click', () => show(0));
  root.querySelector('[data-restart]').addEventListener('click', () => { form.reset(); form.hidden = false; root.querySelector('[data-done]').hidden = true; show(0); });
})();
</script>`
    },
    {
      id: "adaptive-toolbar",
      title: "Adaptive Toolbar",
      category: "preferencias",
      description: "Os mesmos controles passam de uma linha para uma organização compacta conforme a largura do componente, preservando seus valores.",
      tags: ["toolbar","adaptive","responsive","preferencias"],
      extensions: ["adaptive","feedback"],
      dependencies: ["Bootstrap 5.3.8"],
      features: ["Responsivo","Teclado","Touch"],
      code: String.raw`<!-- Requisitos: Bootstrap 5.3.8; AelluxJS Adaptive e Feedback registrados no host. -->
<style>
  .ae-lib-toolbar__controls { display: grid; gap: .75rem; padding: 1rem; border: 1px solid var(--bs-border-color); border-radius: .75rem; }
  .ae-lib-toolbar.ae--fits-medium .ae-lib-toolbar__controls { display: flex; align-items: end; flex-wrap: wrap; }
  .ae-lib-toolbar__field { min-width: 0; flex: 1; }
  .ae-lib-toolbar__preview { margin-top: 1rem; border-radius: .75rem; background: var(--bs-tertiary-bg); overflow-wrap: anywhere; }
</style>
<section class="ae-lib-toolbar p-4" data-ae-adaptive aria-label="Ferramentas de edição">
  <h2 class="h4">O espaço muda. Suas escolhas ficam.</h2>
  <div class="ae-lib-toolbar__controls" role="group" aria-label="Aparência do conteúdo">
    <label class="ae-lib-toolbar__field small">Alinhamento<select class="form-select mt-1" data-align><option value="start">Início</option><option value="center">Centro</option><option value="end">Fim</option></select></label>
    <label class="ae-lib-toolbar__field small">Espaçamento<select class="form-select mt-1" data-density><option value="24">Confortável</option><option value="12">Compacto</option><option value="40">Amplo</option></select></label>
    <button class="btn btn-warning" type="button">Aplicar</button>
  </div>
  <div class="ae-lib-toolbar__preview" style="padding:24px"><h3 class="h5">Seu próximo rascunho.</h3><p class="mb-0">Uma interface que acompanha o jeito de trabalhar.</p></div><p class="small mt-2" role="status" data-result></p>
</section>
<script>
(() => {
  const root = document.currentScript.previousElementSibling, preview = root.querySelector('.ae-lib-toolbar__preview');
  root.querySelector('button').addEventListener('click', () => { preview.style.textAlign = root.querySelector('[data-align]').value; preview.style.padding = root.querySelector('[data-density]').value + 'px'; root.querySelector('[data-result]').textContent = 'Preferências aplicadas.'; $ae.ext.feedback.success('Preferências aplicadas.', root); });
})();
</script>`
    },
    {
      id: "virtual-gamepad",
      title: "Virtual Gamepad",
      category: "interacoes",
      description: "Direções e ação com múltiplos toques simultâneos, teclado e limpeza ao perder foco. Input fornece os eventos de ponteiro; a lógica local compõe o controle.",
      tags: ["gamepad","input","touch","teclado","multitouch"],
      extensions: ["input","focus"],
      dependencies: ["Bootstrap 5.3.8"],
      features: ["Responsivo","Teclado","Touch"],
      code: String.raw`<!-- Requisitos: Bootstrap 5.3.8; AelluxJS Input e Focus registrados no host. -->
<style>
  .ae-lib-gamepad__controls { display: flex; flex-wrap: wrap; align-items: center; gap: 2rem; justify-content: space-between; max-width: 400px; }
  .ae-lib-gamepad__directions { display: grid; grid-template: repeat(3, 48px) / repeat(3, 48px); gap: 4px; }
  .ae-lib-gamepad button { min-width: 48px; min-height: 48px; touch-action: none; user-select: none; }
  .ae-lib-gamepad button[aria-pressed="true"] { background: var(--bs-warning); color: #232323; }
  .ae-lib-gamepad__stage { height: 80px; display: grid; place-items: center; border: 1px solid var(--bs-border-color); border-radius: .75rem; margin-bottom: 1rem; }
  .ae-lib-gamepad__marker { font-size: 2rem; transform: translate(var(--pad-x, 0px), var(--pad-y, 0px)); }
</style>
<section class="ae-lib-gamepad p-4" data-ae-inputs="point keyboard" data-ae-focus-scope aria-label="Controle virtual">
  <h2 class="h4">Mais de uma direção.</h2><p class="small text-body-secondary">Use toque, mouse, setas ou W/A/S/D e Espaço enquanto o controle tem foco.</p>
  <div class="ae-lib-gamepad__stage" aria-hidden="true"><span class="ae-lib-gamepad__marker">✳</span></div>
  <div class="ae-lib-gamepad__controls" role="group" aria-label="Direções e ação">
    <div class="ae-lib-gamepad__directions"><button class="btn btn-outline-secondary" type="button" style="grid-area:1/2" data-control="up" data-ae-point aria-label="Cima" aria-pressed="false">↑</button><button class="btn btn-outline-secondary" type="button" style="grid-area:2/1" data-control="left" data-ae-point aria-label="Esquerda" aria-pressed="false">←</button><button class="btn btn-outline-secondary" type="button" style="grid-area:2/3" data-control="right" data-ae-point aria-label="Direita" aria-pressed="false">→</button><button class="btn btn-outline-secondary" type="button" style="grid-area:3/2" data-control="down" data-ae-point aria-label="Baixo" aria-pressed="false">↓</button></div>
    <button class="btn btn-outline-secondary rounded-circle" type="button" data-control="action" data-ae-point aria-label="Ação" aria-pressed="false">A</button>
  </div>
  <p class="small mt-3 mb-0" role="status" data-status>Em repouso</p>
</section>
<script>
(() => {
  const root = document.currentScript.previousElementSibling, active = new Map(), buttons = [...root.querySelectorAll('[data-control]')];
  const keyMap = { ArrowUp:'up', KeyW:'up', ArrowDown:'down', KeyS:'down', ArrowLeft:'left', KeyA:'left', ArrowRight:'right', KeyD:'right', Space:'action' };
  const render = () => { const values = new Set(active.values()); buttons.forEach(button => button.setAttribute('aria-pressed', values.has(button.dataset.control))); root.querySelector('[data-status]').textContent = values.size ? [...values].join(' + ') : 'Em repouso'; const marker = root.querySelector('.ae-lib-gamepad__marker'); marker.style.setProperty('--pad-x', ((values.has('right') ? 1 : 0) - (values.has('left') ? 1 : 0)) * 32 + 'px'); marker.style.setProperty('--pad-y', ((values.has('down') ? 1 : 0) - (values.has('up') ? 1 : 0)) * 16 + 'px'); marker.textContent = values.has('action') ? '★' : '✳'; };
  const clear = () => { active.clear(); render(); };
  buttons.forEach(button => {
    button.addEventListener('AelluxJsPointerDown', event => { active.set('pointer:' + event.detail.pointer.pointerId, button.dataset.control); render(); });
    for (const type of ['AelluxJsPointerUp', 'AelluxJsPointerCancel']) button.addEventListener(type, event => { active.delete('pointer:' + event.detail.pointer.pointerId); render(); });
    button.addEventListener('click', event => { if (event.detail === 0 && !active.size) { active.set('activation', button.dataset.control); render(); setTimeout(() => { active.delete('activation'); render(); }, 180); } });
  });
  root.addEventListener('keydown', event => { const control = event.code === 'Enter' ? event.target.dataset.control : keyMap[event.code]; if (!control) return; event.preventDefault(); active.set('key:' + event.code, control); render(); });
  window.addEventListener('keyup', event => { if (active.delete('key:' + event.code)) { event.preventDefault(); render(); } });
  root.addEventListener('focusout', event => { if (!root.contains(event.relatedTarget)) clear(); });
  window.addEventListener('blur', clear); document.addEventListener('visibilitychange', () => { if (document.hidden) clear(); });
})();
</script>`
    },
    {
      id: "little-tabs",
      title: "Responsive Tabs",
      category: "navegacao",
      description: "Abas com painéis, setas do teclado, Home e End. Present alterna o conteúdo e o script mantém a seleção acessível.",
      tags: ["present","input","abas","teclado"],
      extensions: ["input","present"],
      dependencies: ["Bootstrap 5.3.8"],
      features: ["Responsivo","Teclado","Touch"],
      code: String.raw`<!-- Requisitos: Bootstrap 5.3.8; AelluxJS Input e Present registrados no host. Renomeie IDs e referências para repetir o componente. -->
<style>
  .ae-lib-tabs [role="tablist"] { display: flex; gap: .5rem; overflow-x: auto; }
  .ae-lib-tabs [role="tabpanel"] { --ae-pop-duration: 160ms; }
  .ae-lib-tabs [role="tab"][aria-selected="true"] { background: var(--bs-warning); color: #232323; border-color: var(--bs-warning); }
  @media (prefers-reduced-motion: reduce) { .ae-lib-tabs [role="tabpanel"] { --ae-pop-duration: 0s; --ae-dismiss-duration: 0s; } }
</style>
<section class="ae-lib-tabs p-4" aria-label="Planos para hoje">
  <h2 class="h4">Qual é o plano de hoje?</h2>
  <div role="tablist" aria-label="Ideias" class="mb-3">
    <button id="ae-tabs-create" class="btn btn-sm btn-outline-secondary" type="button" role="tab" aria-selected="true" aria-controls="ae-tabs-make" data-ae-point data-ae-present-trigger="pop" data-ae-present-target="ae-tabs-make">Criar</button>
    <button id="ae-tabs-rest" class="btn btn-sm btn-outline-secondary" type="button" role="tab" aria-selected="false" aria-controls="ae-tabs-pause" tabindex="-1" data-ae-point data-ae-present-trigger="pop" data-ae-present-target="ae-tabs-pause">Pausar</button>
  </div>
  <div data-ae-present-group data-ae-present-active="ae-tabs-make">
    <section id="ae-tabs-make" class="p-3 rounded-3 bg-warning-subtle" role="tabpanel" aria-labelledby="ae-tabs-create" tabindex="0" data-ae-present="opacity" data-ae-dismiss-on-click="false"><h3 class="h5">Faça algo pequeno.</h3><p class="mb-0">Uma boa ideia pode começar com uma linha de código.</p></section>
    <section id="ae-tabs-pause" class="p-3 rounded-3 bg-success-subtle" role="tabpanel" aria-labelledby="ae-tabs-rest" tabindex="0" data-ae-present="opacity" data-ae-dismiss-on-click="false" hidden><h3 class="h5">Respire um pouco.</h3><p class="mb-0">Às vezes, o próximo passo é uma pausa.</p></section>
  </div>
</section>
<script>
(() => {
  const root = document.currentScript.previousElementSibling;
  const tabs = [...root.querySelectorAll('[role="tab"]')];
  root.addEventListener("AelluxJsBeforePop", event => {
    tabs.forEach(tab => { const selected = tab.getAttribute("aria-controls") === event.target.id; tab.setAttribute("aria-selected", selected); tab.tabIndex = selected ? 0 : -1; });
  });
  root.querySelector('[role="tablist"]').addEventListener("keydown", event => {
    const index = tabs.indexOf(event.target);
    if (index < 0 || !["ArrowRight", "ArrowLeft", "Home", "End"].includes(event.key)) return;
    event.preventDefault();
    const next = event.key === "Home" ? 0 : event.key === "End" ? tabs.length - 1 : (index + (event.key === "ArrowRight" ? 1 : -1) + tabs.length) % tabs.length;
    tabs[next].focus(); tabs[next].click();
  });
})();
</script>`
    },
    {
      id: "in-view",
      title: "Scroll Reveal",
      category: "rolagem",
      description: "O conteúdo permanece legível e ganha uma entrada suave conforme entra na área visível. Movimento reduzido mantém tudo estático.",
      tags: ["viewport","css","scroll","reveal"],
      extensions: ["viewport"],
      dependencies: ["Bootstrap 5.3.8"],
      features: ["Responsivo","Teclado","Movimento reduzido"],
      code: String.raw`<!-- Requisitos: Bootstrap 5.3.8; AelluxJS Viewport registrado no host. Renomeie IDs e referências para repetir o componente. -->
<style>
  .ae-lib-reveal__scroller { height: 240px; overflow: auto; padding: 1rem; border: 1px solid var(--bs-border-color); border-radius: .75rem; }
  .ae-lib-reveal__card { padding: 1.5rem; margin-block: 3rem; background: var(--bs-tertiary-bg); border-radius: .75rem; }
  @media (prefers-reduced-motion: no-preference) { .ae-lib-reveal__card { opacity: calc(.5 + var(--ae-viewport-visible, 0) * .5); transform: translateY(calc((1 - var(--ae-viewport-visible, 0)) * 18px)); } }
</style>
<section class="ae-lib-reveal p-4" aria-label="História do projeto">
  <h2 class="h4">Uma descoberta de cada vez.</h2><p class="small text-body-secondary">Role dentro do painel ↓</p>
  <div class="ae-lib-reveal__scroller" tabindex="0" role="region" aria-label="História com revelação ao rolar">
    <p>Comece pelo que você quer transformar.</p>
    <article data-ae-viewport="y visible" data-ae-viewport-target="ae-reveal-idea"><div id="ae-reveal-idea" class="ae-lib-reveal__card"><h3 class="h5">Dê forma à ideia.</h3><p>Um rascunho já é um primeiro passo.</p></div></article>
    <article data-ae-viewport="y visible" data-ae-viewport-target="ae-reveal-share"><div id="ae-reveal-share" class="ae-lib-reveal__card"><h3 class="h5">Compartilhe o caminho.</h3><p>Novas perspectivas fazem a ideia crescer.</p></div></article>
    <p>Continue criando, no seu ritmo.</p>
  </div>
</section>`
    },
    {
      id: "your-theme",
      title: "Theme Switcher",
      category: "preferencias",
      description: "Claro, escuro ou o tema do sistema. Preference sincroniza a escolha com as cores do Bootstrap.",
      tags: ["preference","tema","dark","bootstrap"],
      extensions: ["preference"],
      dependencies: ["Bootstrap 5.3.8"],
      features: ["Responsivo","Teclado","Touch"],
      integration: "Inicialize o host com syncBootstrapThemeTag: true para publicar as cores do Bootstrap. A escolha de tema afeta a aplicação hospedeira inteira.",
      code: String.raw`<!-- Requisitos: Bootstrap 5.3.8; AelluxJS Preference registrado no host com syncBootstrapThemeTag habilitado na inicialização. -->
<section class="ae-lib-theme p-4" aria-label="Preferência de tema">
  <p class="small text-secondary">O SEU ESPAÇO</p>
  <h2 class="h4">Qual é a sua luz?</h2>
  <div class="d-flex flex-wrap gap-2 my-3" data-ae-preference="color-scheme" role="group" aria-label="Tema do exemplo">
    <button class="btn btn-sm btn-outline-secondary" type="button" data-ae-option="light">☀ Claro</button>
    <button class="btn btn-sm btn-outline-secondary" type="button" data-ae-option="dark">◐ Escuro</button>
    <button class="btn btn-sm btn-outline-secondary" type="button" data-ae-option="auto">↻ Sistema</button>
  </div>
  <div class="border rounded-3 p-3 bg-body-tertiary">
    <span class="badge text-bg-warning mb-2">Sua próxima ideia</span>
    <p class="mb-0">O conteúdo é o mesmo. A experiência é sua.</p>
  </div>
</section>`
    },
    {
      id: "next-focus",
      title: "Keyboard-friendly Form",
      category: "formularios",
      description: "Enter avança por campos obrigatórios com Focus. O envio valida os campos e mostra uma confirmação local.",
      tags: ["focus","formulario","teclado","acessibilidade"],
      extensions: ["focus"],
      dependencies: ["Bootstrap 5.3.8"],
      features: ["Responsivo","Teclado","Touch"],
      code: String.raw`<!-- Requisitos: Bootstrap 5.3.8; AelluxJS Focus registrado no host. Renomeie IDs e referências para repetir o componente. -->
<section class="ae-lib-focus-form p-4" aria-label="Registrar uma ideia">
  <h2 class="h4 mb-1">Vamos dar nome à ideia?</h2><p class="small text-body-secondary">Digite e pressione Enter para continuar.</p>
  <form>
    <label class="form-label small" for="ae-focus-name">Seu nome</label><input id="ae-focus-name" class="form-control mb-2" autocomplete="name" placeholder="Como podemos te chamar?" data-ae-focus="next" required>
    <label class="form-label small" for="ae-focus-idea">Sua ideia</label><input id="ae-focus-idea" class="form-control mb-3" placeholder="Algo que merece sair do papel" data-ae-focus="next" required>
    <button class="btn btn-warning" type="submit">Guardar esta ideia ↗</button><p class="small text-success mt-2 mb-0" role="status" hidden>Primeiro passo dado. Continue criando!</p>
  </form>
</section>
<script>
(() => { const root = document.currentScript.previousElementSibling; root.querySelector('form').addEventListener('submit', event => { event.preventDefault(); root.querySelector('[role="status"]').hidden = false; }); })();
</script>`
    }
  ]
};
