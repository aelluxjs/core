# aellux.js Library — Copy, paste, customize.

Experiências responsivas prontas para incorporar a páginas existentes. O catálogo tem **17 snippets em sete categorias**, incluindo os 12 exemplos prioritários e a evolução dos exemplos anteriores. A Library organiza soluções pelo que a pessoa quer construir; os detalhes de API continuam na documentação de extensões.

Abra `home/library/index.htm` em um servidor HTTP local ou HTTPS. Não há etapa de build própria nem dependência de CDN: Bootstrap 5.3.8 está em `vendor/`, com sua licença, e os arquivos aellux.js são os de `../../dist/`.

- **Conteúdo:** `assets/snippets.js` contém o objeto `window.librarySource`. Cada exemplo define `id` único, `title`, `description`, `category`, `tags`, `extensions`, `dependencies`, `features` e `code` (HTML, CSS e JavaScript do componente). Categorias também estão no objeto. `extensions` determina os registros Basic e os assets da prévia; `dependencies` declara Bootstrap quando necessário; `features` descreve capacidades concretas. Cards mostram esses requisitos e instruções de integração.
- **Apresentação:** `assets/library.js`, carregado no final da página, possui o template único `renderCard()` e o documento compartilhado das prévias. Para mudar todos os cards, altere esse renderizador e `assets/library.css`.
- **CodePen:** o feed apresenta os exemplos sem editor ou blocos de código. **Abrir no CodePen**, na barra da prévia normal ou ampliada, envia um formulário POST para `https://codepen.io/pen/define/`, com `target="_blank"` e o campo `data` em JSON, conforme a [API do CodePen](https://blog.codepen.io/documentation/prefill/). HTML, CSS e JavaScript do componente ocupam seus respectivos painéis; as dependências declaradas são incorporadas ao `head`, com os mesmos arquivos usados na prévia, sem depender de localhost nem de uma publicação posterior. O Split Hero não inclui Bootstrap ou runtime aellux.js. A nova janela acompanha o tema atual e não tem acesso à janela da Library. Abrir o serviço requer conexão.
- **Prévia:** usa `iframe.srcdoc`, sem página externa. Viewport ativa somente prévias com área visível e descarrega as demais. Uma camada `body::before` fixa, amarela e semitransparente destaca o fundo, atrás do conteúdo e sem interceptar cliques; essa decoração não acompanha a exportação para o CodePen. As prévias iniciam no tema do app e acompanham suas mudanças sem recriar o iframe; os controles de tema de um exemplo continuam funcionando dentro dele. O modo ampliado usa `position: fixed; inset: 0`, mantém o espaço do card e cria uma entrada no State Navigation. Voltar, Escape e o Back do navegador retornam ao mesmo card; Forward reabre a prévia. Substituir o nó do iframe a cada execução evita entradas extras de histórico.
- **Larguras:** Disponível acompanha o espaço do card. Mobile (375 px), Tablet (768 px) e Desktop (1280 px) definem a largura real do iframe em CSS px, sem zoom ou transform. Se o viewport escolhido for maior que o card, role a área horizontalmente ou amplie a prévia. A seleção é mantida ao descarregar e ampliar a prévia, durante a sessão. Os breakpoints de cada componente respondem a essa largura; Navbar, Sidebar e Toolbar usam Adaptive no contêiner, e o Split Hero usa container queries de CSS.
- **Isolamento:** o iframe usa uma origem opaca (`sandbox="allow-scripts allow-forms"`). A permissão de formulários permite validação e eventos nativos de submit; os exemplos fornecidos interceptam o envio e confirmam os dados localmente. O renderizador incorpora Bootstrap e os arquivos Basic necessários antes de montar os exemplos via `startAelluxJs()`, sem requests de scripts com SRI a partir da origem opaca. A comunicação verifica a janela emissora e o token da execução. O código do exemplo não recebe acesso ao documento, storage ou histórico do app.
- **Busca:** título, descrição, categoria, tags e extensões são normalizados sem distinção de acentos/maiúsculas. O filtro textual é aplicado ao enviar o formulário Buscar. Tags e categorias aplicam filtros diretos.
- **PWA:** `manifest.webmanifest` e `sw.js` preparam o app inteiro e todos os exemplos já na primeira visita online, mesmo os ainda não vistos. Instalação usa a extensão PWA e instruções manuais quando necessário. A instalação efetiva depende do navegador; o indicador de offline só confirma depois da ativação do worker.
- **Marca:** o cabeçalho usa o quadrado com “æ” e as proporções do hero e dos SVGs da homepage. `../assets/bootstrap-brand.css` compartilha a paleta com a homepage, as prévias e os exemplos enviados ao CodePen: warning padrão do Bootstrap (#FFC107) no modo claro, amarelo JavaScript (#F7DF1E) no escuro e grafite (#232323) nos textos do modo claro e no “æ”. Textos sobre fundos escuros mantêm contraste. Os ícones de instalação usam a paleta clara; `assets/icon.svg` incorpora Geist e origina os PNGs de 192 e 512 px. A fonte local do logotipo e sua licença estão em `assets/geist-latin.woff2` e `assets/geist.OFL.txt`.

Ao adicionar extensões ou assets aos exemplos, inclua seus arquivos na lista explícita de `sw.js`. O worker aceita somente assets públicos listados, inclusive os arquivos `dist/` fora da pasta do app, e não intercepta outras páginas. Incremente `VERSION` ao publicar alterações para renovar o cache. A atualização aguarda o botão Atualizar biblioteca e preserva os favoritos antes de recarregar. O navegador pode remover caches por falta de espaço.

Verificação de integração: `npx playwright test tests/browser/library.spec.mjs tests/browser/library-catalog.spec.mjs` (ou `--config playwright.isolated.config.mjs` com `node tests/browser/server.mjs` já iniciado). Validação do contrato do catálogo e da cobertura de assets offline: `node --test tests/unit/library-source.test.mjs`.

## Catálogo e integração

| Categoria | Snippets |
| --- | --- |
| Navegação & Estrutura | Responsive Navbar, Responsive Sidebar, Mobile Bottom Navigation, Responsive Tabs |
| Apresentação & Destaques | Responsive Split Hero |
| Carrosséis & Rolagem | Responsive Card Carousel, Parallax Carousel, Scroll Reveal |
| Camadas & Feedback | Welcome Notification, Responsive Bottom Sheet, Toast Notification Stack, Anchored Popover |
| Formulários & Fluxos | Multi-step Form, Keyboard-friendly Form |
| Preferências & Adaptação | Adaptive Toolbar, Theme Switcher |
| Interações Personalizadas | Virtual Gamepad |

Todos os estilos próprios usam classes `ae-lib-*`. O HTML é semântico, os scripts usam um escopo local por instância e os IDs de destinos têm prefixos próprios. Ao repetir um snippet, renomeie seus IDs e referências de HTML, ARIA e atributos aellux.js. A arte é feita em CSS, sem download de imagens ou licenças externas adicionais. As animações decorativas respeitam movimento reduzido. Os exemplos que usam Bootstrap declaram a dependência; não dependem do CSS do aplicativo Library.

Registre uma vez as extensões indicadas em **Como integrar** antes de iniciar uma aplicação Basic. Em uma aplicação iniciada, insira o HTML, execute o script local quando houver e aguarde `$ae.mount(container)`; não repita `$ae.init()`. No CodePen, o HTML do componente fica separado das dependências do `head` e dos estilos e scripts locais. Se usar `innerHTML`, os scripts inseridos não executam automaticamente: execute-os explicitamente na integração.

Os IDs persistidos `hello-present`, `little-tabs`, `slow-scroll`, `in-view`, `your-theme`, `next-focus` e `responsive-sidebar` foram preservados. Favoritos continuam associados aos mesmos componentes. Rascunhos da versão anterior permanecem no armazenamento, mas as prévias e o CodePen usam os exemplos originais do catálogo.

Mobile Bottom Navigation alterna painéis localmente e preserva a seleção ao mudar de largura; integre os destinos ao roteador da sua aplicação quando necessário. Bottom Sheet combina o diálogo modal nativo com Present para animação e devolve o foco ao botão ao fechar. Toast Stack aceita até três mensagens, usa `<progress>` nativo e pausa o prazo de seis segundos com hover, foco ou página oculta. Multi-step Form usa validação nativa e confirmação local; o formulário e o painel de compartilhamento não enviam dados. Virtual Gamepad compõe eventos Pointer do Input com teclado local, aceita pressionamentos simultâneos e limpa estados ao perder foco; não é um motor de jogos nem exige um gamepad físico.

## Responsive Sidebar

Componente pronto para incorporar, na categoria **Navegação & Estrutura**, com um único menu e CSS próprio, sem dependência de Bootstrap, fontes ou imagens externas. Use **Abrir no CodePen** para personalizar e copiar HTML, CSS e JavaScript para o local desejado da página. O componente contém layout e um IIFE local; o `head` do Pen fornece os assets e os registros aellux.js necessários ao exemplo autônomo.

A aplicação hospedeira deve fornecer assets aellux.js compatíveis e as extensões **Present, Adaptive e Focus**. Em Basic, registre uma vez, antes da inicialização da aplicação:

```js
$ae.ext("present", { loadStyle: true });
$ae.ext("adaptive", { loadStyle: true });
$ae.ext("focus");
$ae.init({ mode: "basic", useHash: false });
```

Em uma aplicação já iniciada, insira e execute o script local e aguarde `$ae.mount(container)` para montar os novos elementos. O script aceita tanto a montagem inicial quanto uma montagem posterior. Não repita `$ae.init()`.

Personalize `--sidebar-width`, `--sidebar-surface`, `--sidebar-foreground`, `--sidebar-accent` e `--sidebar-radius` na classe `.ae-lib-sidebar`; edite os links e seus destinos no HTML. Para múltiplas instâncias, renomeie os IDs `ae-sidebar-*` e suas referências (`href`, `aria-controls`, `data-ae-present-target`). O layout ocupa a largura do seu contêiner e possui altura local configurável, com rolagem independente do conteúdo e da navegação.

Adaptive observa o wrapper estável e aplica `ae--fits-medium` a partir de **768 CSS px do próprio componente**, conforme os limiares padrão do runtime. Nesse modo, a sidebar participa de um grid de duas colunas. Abaixo disso, começa fechada e vira drawer. Present controla a abertura e o `dismiss`, com translação horizontal e estado semântico cuja visibilidade é definida pelo CSS. No desktop, o estado fechado continua visível. O script adicional (cerca de 60 linhas) aguarda a montagem, fecha o drawer somente ao mudar de modo, coordena transições interrompidas e adiciona Escape, foco e fechamento ao seguir um link; não mede o contêiner nem implementa animações.

O drawer é **não modal**, sem focus trap ou `aria-modal`. Os controles nativos têm nomes e foco visível; Present mantém `aria-controls`/`aria-expanded`. Ao abrir, o foco vai ao botão de fechar. Ao fechar, Focus usa seu histórico, com fallback local para o botão do menu. Escape é tratado dentro do componente e fecha primeiro o drawer quando a prévia está ampliada. O estado fechado usa `visibility: hidden` e `inert`, excluindo os links do teclado; no desktop, a navegação permanece acessível. O backdrop aceita clique, e Tab pode sair do drawer. As durações respeitam movimento reduzido, e o layout aceita reflow e rótulos longos.

O exemplo contém conteúdo ilustrativo e destinos locais; substitua-os pelos destinos reais do projeto. Não fornece roteamento, gestão de item ativo nem interação modal. Os testes cobrem os três motores, contêineres de 320 a 1440 px, montagem em uma página sem Bootstrap, reflow equivalente a zoom e offline no Chromium. Zoom nativo, leitores de tela e dispositivos móveis reais ainda exigem avaliação manual.
