/* Edite somente este objeto para adicionar exemplos ou alterar seu conteúdo.
   code é HTML editável (incluindo <style> e <script>); Bootstrap e as extensões
   listadas em extensions são fornecidos pelo renderizador em library.js. */
window.librarySource = {
  categories: [
    { id: "interacao", label: "Interação", description: "Detalhes que respondem ao toque.", tint: "#ffedb0", symbol: "✳" },
    { id: "navegacao", label: "Navegação", description: "Novos caminhos pela interface.", tint: "#dce6ff", symbol: "↗" },
    { id: "rolagem", label: "Rolagem", description: "Um pouco além da primeira tela.", tint: "#d9eee3", symbol: "↔" },
    { id: "preferencias", label: "Preferências", description: "Uma interface do seu jeito.", tint: "#eedff6", symbol: "◐" }
  ],
  snippets: [
    {
      id: "hello-present", title: "Um olá que aparece com calma", category: "interacao",
      description: "Um botão, uma mensagem e uma pequena entrada. Experimente mudar a duração e o movimento.",
      tags: ["present", "input", "animacao", "toggle"], extensions: ["input", "present"],
      code: String.raw`<main class="p-4 text-center">
  <p class="small text-secondary mb-2">UM PEQUENO COMEÇO</p>
  <h1 class="h4 mb-3">Dê espaço para um olá.</h1>
  <button class="btn btn-warning" type="button"
    data-ae-point data-ae-trigger="toggle" data-ae-target="hello">
    Dizer olá ✳
  </button>
  <div id="hello" class="mt-3 p-3 rounded-3 bg-warning-subtle"
    data-ae-present="opacity transform" data-ae-dismiss-on-click="false"
    style="--ae-from-transform: translateY(12px); --ae-pop-duration: 400ms;" hidden>
    Olá, próxima grande ideia. Que bom te ver aqui!
  </div>
</main>`
    },
    {
      id: "little-tabs", title: "Cada aba, uma nova perspectiva", category: "navegacao",
      description: "Troque de conteúdo com Present. A estrutura continua sendo HTML, e os controles usam Input.",
      tags: ["present", "input", "abas", "grupos"], extensions: ["input", "present"],
      code: String.raw`<main class="p-4">
  <h1 class="h4 mb-3">Qual é o plano de hoje?</h1>
  <nav class="d-flex gap-2 mb-3" aria-label="Ideias para hoje">
    <button class="btn btn-sm btn-outline-secondary" type="button"
      data-ae-point data-ae-trigger="pop" data-ae-target="make">Criar</button>
    <button class="btn btn-sm btn-outline-secondary" type="button"
      data-ae-point data-ae-trigger="pop" data-ae-target="pause">Pausar</button>
  </nav>
  <div class="d-grid" data-ae-present-group data-ae-present-active="make">
    <section id="make" class="p-3 rounded-3 bg-warning-subtle"
      style="grid-area:1/1" data-ae-present="opacity" data-ae-dismiss-on-click="false">
      <h2 class="h5">Faça algo pequeno.</h2><p class="mb-0">Uma boa ideia pode começar com uma linha de código.</p>
    </section>
    <section id="pause" class="p-3 rounded-3 bg-success-subtle"
      style="grid-area:1/1" data-ae-present="opacity" data-ae-dismiss-on-click="false" hidden>
      <h2 class="h5">Respire um pouco.</h2><p class="mb-0">Às vezes, o próximo passo é uma pausa.</p>
    </section>
  </div>
</main>`
    },
    {
      id: "responsive-sidebar", title: "Responsive Sidebar", category: "navegacao",
      description: "Uma sidebar persistente no desktop que vira um drawer de navegação em contêineres menores. Copie, cole e personalize, sem Bootstrap.",
      tags: ["sidebar", "navigation", "responsive", "drawer", "present", "adaptive", "focus", "accessibility"],
      extensions: ["present", "adaptive", "focus"],
      code: String.raw`<style>
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
      aria-controls="ae-sidebar-nav" aria-expanded="false" data-ae-trigger="toggle" data-ae-target="ae-sidebar-nav">
      <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 6h16M4 12h16M4 18h16"/></svg>
    </button>
    <span class="ae-lib-sidebar__brand">estúdio<span aria-hidden="true"> /</span></span>
    <span class="ae-lib-sidebar__context">Seu espaço de trabalho</span>
  </header>
  <div class="ae-lib-sidebar__layout">
    <aside id="ae-sidebar-nav" class="ae-lib-sidebar__panel ae--dismissed" data-ae-present="transform" data-ae-dismiss-on-click="false">
      <div class="ae-lib-sidebar__panel-heading">
        <span class="ae-lib-sidebar__brand">estúdio / workspace</span>
        <button class="ae-lib-sidebar__button ae-lib-sidebar__mobile" type="button" aria-label="Fechar navegação" data-ae-dismiss>
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
    <div class="ae-lib-sidebar__backdrop" data-ae-dismiss="ae-sidebar-nav" aria-hidden="true"></div>
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
  const opener = root.querySelector("[data-ae-trigger]");
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
      id: "slow-scroll", title: "Arraste para descobrir", category: "rolagem",
      description: "Uma pequena coleção horizontal. Arraste com o mouse ou deslize com o dedo para explorar.",
      tags: ["scrollbox", "galeria", "drag", "carrossel"], extensions: ["scrollbox"],
      code: String.raw`<style>
  .place { flex: 0 0 72%; min-height: 155px; padding: 24px; border-radius: 16px; }
</style>
<main class="p-4">
  <h1 class="h4">Devagar também é caminho.</h1>
  <p class="small text-secondary">Arraste para o lado →</p>
  <div class="d-flex gap-3 overflow-x-auto pb-3"
    data-ae-scrollbox="pointer" data-ae-scrollbar="horizontal"
    data-ae-scrollbox-fade="false" tabindex="0" role="region" aria-label="Lugares para uma pausa">
    <article class="place bg-warning-subtle"><p class="small">01 / RESPIRAR</p><h2 class="h4">Perto do mar.</h2></article>
    <article class="place bg-success-subtle"><p class="small">02 / EXPLORAR</p><h2 class="h4">Entre as folhas.</h2></article>
    <article class="place bg-info-subtle"><p class="small">03 / IMAGINAR</p><h2 class="h4">Além do azul.</h2></article>
  </div>
</main>`
    },
    {
      id: "in-view", title: "O movimento encontra a rolagem", category: "rolagem",
      description: "Viewport transforma a posição visível em variáveis CSS. Role dentro do exemplo e acompanhe a forma.",
      tags: ["viewport", "css", "scroll", "variaveis"], extensions: ["viewport"],
      code: String.raw`<style>
  .shape { width: 80px; height: 80px; border-radius: 22px; background: var(--bs-warning);
    transform: rotate(calc(var(--ae-viewport-y, 0) * 90deg)); }
</style>
<main class="p-4">
  <h1 class="h4">Uma mudança de perspectiva.</h1>
  <p class="small text-secondary">Role neste painel para mover a forma ↓</p>
  <div class="overflow-auto border rounded-3 p-3" style="height:140px" tabindex="0" role="region" aria-label="Experimento de rolagem">
    <p class="small text-secondary mb-5">O código também pode sentir o movimento.</p>
    <div class="d-flex justify-content-center py-3" data-ae-viewport="y" data-ae-viewport-target="shape">
      <div id="shape" class="shape" aria-label="Forma que gira durante a rolagem"></div>
    </div>
    <p class="small text-secondary mt-5 mb-0">Um novo ângulo para a mesma ideia.</p>
  </div>
</main>`
    },
    {
      id: "your-theme", title: "Uma interface do seu jeito", category: "preferencias",
      description: "Claro, escuro ou o tema do sistema. Preference sincroniza a escolha com as cores do Bootstrap.",
      tags: ["preference", "tema", "dark", "bootstrap"], extensions: ["preference"],
      code: String.raw`<main class="p-4">
  <p class="small text-secondary">O SEU ESPAÇO</p>
  <h1 class="h4">Qual é a sua luz?</h1>
  <div class="d-flex flex-wrap gap-2 my-3" data-ae-preference="color-scheme" role="group" aria-label="Tema do exemplo">
    <button class="btn btn-sm btn-outline-secondary" type="button" data-ae-option="light">☀ Claro</button>
    <button class="btn btn-sm btn-outline-secondary" type="button" data-ae-option="dark">◐ Escuro</button>
    <button class="btn btn-sm btn-outline-secondary" type="button" data-ae-option="auto">↻ Sistema</button>
  </div>
  <div class="border rounded-3 p-3 bg-body-tertiary">
    <span class="badge text-bg-warning mb-2">Sua próxima ideia</span>
    <p class="mb-0">O conteúdo é o mesmo. A experiência é sua.</p>
  </div>
</main>`
    },
    {
      id: "next-focus", title: "Um próximo passo natural", category: "interacao",
      description: "Enter leva ao próximo campo com Focus. Menos cliques para seguir o fluxo de um formulário.",
      tags: ["focus", "formulario", "teclado", "acessibilidade"], extensions: ["focus"],
      code: String.raw`<main class="p-4">
  <h1 class="h4 mb-1">Vamos dar nome à ideia?</h1>
  <p class="small text-secondary">Digite e pressione Enter para continuar.</p>
  <form onsubmit="event.preventDefault(); document.getElementById('result').hidden = false">
    <label class="form-label small" for="name">Seu nome</label>
    <input id="name" class="form-control form-control-sm mb-2" placeholder="Como podemos te chamar?" data-ae-focus="next" required>
    <label class="form-label small" for="idea">Sua ideia</label>
    <input id="idea" class="form-control form-control-sm mb-3" placeholder="Algo que merece sair do papel" data-ae-focus="next" required>
    <button class="btn btn-sm btn-warning" type="submit">Guardar esta ideia ↗</button>
    <p id="result" class="small text-success mt-2 mb-0" role="status" hidden>Primeiro passo dado. Continue criando!</p>
  </form>
</main>`
    }
  ]
};
