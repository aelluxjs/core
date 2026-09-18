(function () {
  "use strict";

  const moduleName = "scrollbox";
  const templates = Object.create(null);

  Aellux.uxmRegister(moduleName, { init, destroy, templates });

  let BScroll;

  async function init() {
    // BScroll = await import(Aellux.options.dependencies.scrollbox.betterScroll);
    // // Executa assim que o DOM estiver pronto
    // if (document.readyState === 'loading') {
    //   document.addEventListener('DOMContentLoaded', autoWrapAndScroll);
    // } else {
    //   autoWrapAndScroll();
    // }
  }
  async function destroy() {

  }

  function autoWrapAndScroll() {
    // Seleciona elementos que podem conter scroll (evite rodar em tudo se puder restringir)
    const targets = document.querySelectorAll('div, section, article, .auto-scroll');

    targets.forEach(el => {
      // Ignora elementos globais de página e elementos já processados
      if (el === document.body || el === document.documentElement || el.dataset.bsInitialized) return;

      // 1. Verifica se o estilo do elemento permite scroll
      const style = window.getComputedStyle(el);
      const hasScrollStyleX = style.overflowX === 'auto' || style.overflowX === 'scroll';
      const hasScrollStyleY = style.overflowY === 'auto' || style.overflowY === 'scroll';

      if (!hasScrollStyleX && !hasScrollStyleY) return;

      // 2. Verifica se o elemento está REALMENTE transbordando (overflow ativo)
      const isOverflowingY = el.scrollHeight > el.clientHeight;
      const isOverflowingX = el.scrollWidth > el.clientWidth;

      if ((hasScrollStyleX && isOverflowingX) || (hasScrollStyleY && isOverflowingY)) {

        // Marca o elemento para evitar loops ou duplicidade
        el.dataset.bsInitialized = "true";

        // 3. Injeção Dinâmica do Wrapper Interno (Scroller)
        // Cria uma nova div que vai envelopar todos os filhos atuais do elemento
        const innerWrapper = document.createElement('div');
        innerWrapper.className = 'bs-dynamic-scroller';

        // Se o scroll for horizontal, garante que o wrapper interno tenha a largura total do conteúdo
        if (isOverflowingX) {
          innerWrapper.style.display = 'inline-block';
          innerWrapper.style.whiteSpace = 'nowrap';
        }

        // Move todos os filhos do elemento original para dentro do novo wrapper interno
        while (el.firstChild) {
          innerWrapper.appendChild(el.firstChild);
        }

        // Adiciona o wrapper interno de volta ao elemento original
        el.appendChild(innerWrapper);

        // 4. Força o elemento original a esconder o scroll nativo para não conflitar
        el.style.overflow = 'hidden';

        // 5. Inicializa o BetterScroll
        new BScroll(el, {
          scrollX: isOverflowingX,
          scrollY: isOverflowingY,
          click: true,
          // Adicione plugins do BetterScroll 2.0 se necessário (ex: observe-dom, mouse-wheel)
        });
      }
    });
  }
})();
