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
  .shape { width: 80px; height: 80px; border-radius: 22px; background: #ffc107;
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
