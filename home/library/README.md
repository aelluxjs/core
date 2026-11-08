# Biblioteca de snippets

Abra `home/library/index.htm` em um servidor HTTP local ou HTTPS. Não há etapa de build própria nem dependência de CDN: Bootstrap 5.3.8 está em `vendor/`, com sua licença, e os arquivos AelluxJS são os de `../../dist/`.

- **Conteúdo:** `assets/snippets.js` contém o objeto `window.librarySource`. Cada exemplo define `id` único, `title`, `description`, `category`, `tags`, `extensions` e `code` (HTML, CSS e JavaScript do exemplo). Categorias também estão no objeto.
- **Apresentação:** `assets/library.js`, carregado no final da página, possui o template único `renderCard()` e o documento compartilhado das prévias. Para mudar todos os cards, altere esse renderizador e `assets/library.css`.
- **Edição:** após 650 ms sem digitar, a prévia é recriada com o código atual. Edições e favoritos ficam em `localStorage`; Restaurar recupera o código do objeto source. **Copiar snippet** copia exatamente o conteúdo atual do editor, incluindo seus estilos e scripts locais. **Exemplo completo** copia um documento HTML com Bootstrap, os registros Basic e `$ae.init()`. Se o clipboard falhar, o editor é selecionado para cópia manual.
- **Prévia:** usa `iframe.srcdoc`, sem página externa. Viewport ativa somente prévias com área visível e descarrega as demais, preservando o editor. As prévias iniciam no tema do app e acompanham suas mudanças sem recriar o iframe; os controles de tema de um exemplo continuam funcionando dentro dele. O modo ampliado usa `position: fixed; inset: 0`, mantém o espaço do card e cria uma entrada no State Navigation. Voltar, Escape e o Back do navegador retornam ao mesmo card; Forward reabre a prévia. Substituir o nó do iframe a cada execução evita entradas extras de histórico.
- **Isolamento:** o iframe permite scripts em uma origem opaca (`sandbox="allow-scripts"`). O renderizador incorpora Bootstrap e os arquivos Basic necessários antes de montar os exemplos via `startAelluxJs()`, sem requests de scripts com SRI a partir da origem opaca. A comunicação verifica a janela emissora e o token da execução. O código do exemplo não recebe acesso ao documento, storage ou histórico do app.
- **Busca:** título, descrição, categoria, tags e extensões são normalizados sem distinção de acentos/maiúsculas. O filtro textual é aplicado ao enviar o formulário Buscar. Tags e categorias aplicam filtros diretos.
- **PWA:** `manifest.webmanifest` e `sw.js` preparam o app inteiro e todos os exemplos já na primeira visita online, mesmo os ainda não vistos. Instalação usa a extensão PWA e instruções manuais quando necessário. A instalação efetiva depende do navegador; o indicador de offline só confirma depois da ativação do worker.
- **Marca:** o cabeçalho usa o quadrado com “æ” e as proporções do hero e dos SVGs da homepage. `../assets/bootstrap-brand.css` compartilha a paleta com a homepage, as prévias e o HTML copiado: warning padrão do Bootstrap (#FFC107) no modo claro, amarelo JavaScript (#F7DF1E) no escuro e grafite (#232323) nos textos do modo claro e no “æ”. Textos sobre fundos escuros mantêm contraste. Os ícones de instalação usam a paleta clara; `assets/icon.svg` incorpora Geist e origina os PNGs de 192 e 512 px. A fonte local do logotipo e sua licença estão em `assets/geist-latin.woff2` e `assets/geist.OFL.txt`.

Ao adicionar extensões ou assets aos exemplos, inclua seus arquivos na lista explícita de `sw.js`. O worker aceita somente assets públicos listados, inclusive os arquivos `dist/` fora da pasta do app, e não intercepta outras páginas. Incremente `VERSION` ao publicar alterações para renovar o cache. A atualização aguarda o botão Atualizar biblioteca e preserva as edições antes de recarregar. O navegador pode remover caches por falta de espaço.

Verificação de integração: `npx playwright test tests/browser/library.spec.mjs` (ou `--config playwright.isolated.config.mjs` com o servidor de testes já iniciado).

## Responsive Sidebar

Componente pronto para incorporar, na categoria **Navegação**, com um único menu e CSS próprio, sem dependência de Bootstrap, fontes ou imagens externas. Use **Copiar snippet** e cole o conteúdo no local desejado da página. O componente inclui seu `<style>`, layout e um IIFE local; não registra extensões nem inicializa o runtime novamente. Para experimentar uma página autônoma, use **Exemplo completo**.

A aplicação hospedeira deve fornecer assets AelluxJS compatíveis e as extensões **Present, Adaptive e Focus**. Em Basic, registre uma vez, antes da inicialização da aplicação:

```js
$ae.ext("present", { loadStyle: true });
$ae.ext("adaptive", { loadStyle: true });
$ae.ext("focus");
$ae.init({ mode: "basic", useHash: false });
```

Em uma aplicação já iniciada, insira e execute o script local e aguarde `$ae.mount(container)` para montar os novos elementos. O script aceita tanto a montagem inicial quanto uma montagem posterior. Não repita `$ae.init()`.

Personalize `--sidebar-width`, `--sidebar-surface`, `--sidebar-foreground`, `--sidebar-accent` e `--sidebar-radius` na classe `.ae-lib-sidebar`; edite os links e seus destinos no HTML. Para múltiplas instâncias, renomeie os IDs `ae-sidebar-*` e suas referências (`href`, `aria-controls`, `data-ae-target` e `data-ae-dismiss`). O layout ocupa a largura do seu contêiner e possui altura local configurável, com rolagem independente do conteúdo e da navegação.

Adaptive observa o wrapper estável e aplica `ae--fits-medium` a partir de **768 CSS px do próprio componente**, conforme os limiares padrão do runtime. Nesse modo, a sidebar participa de um grid de duas colunas. Abaixo disso, começa fechada e vira drawer. Present controla a abertura e o `dismiss`, com translação horizontal e estado semântico cuja visibilidade é definida pelo CSS. No desktop, o estado fechado continua visível. O script adicional (cerca de 60 linhas) aguarda a montagem, fecha o drawer somente ao mudar de modo, coordena transições interrompidas e adiciona Escape, foco e fechamento ao seguir um link; não mede o contêiner nem implementa animações.

O drawer é **não modal**, sem focus trap ou `aria-modal`. Os controles nativos têm nomes e foco visível; Present mantém `aria-controls`/`aria-expanded`. Ao abrir, o foco vai ao botão de fechar. Ao fechar, Focus usa seu histórico, com fallback local para o botão do menu. Escape é tratado dentro do componente e fecha primeiro o drawer quando a prévia está ampliada. O estado fechado usa `visibility: hidden` e `inert`, excluindo os links do teclado; no desktop, a navegação permanece acessível. O backdrop aceita clique, e Tab pode sair do drawer. As durações respeitam movimento reduzido, e o layout aceita reflow e rótulos longos.

O exemplo contém conteúdo ilustrativo e destinos locais; substitua-os pelos destinos reais do projeto. Não fornece roteamento, gestão de item ativo nem interação modal. Os testes cobrem os três motores, contêineres de 320 a 1440 px, montagem em uma página sem Bootstrap, reflow equivalente a zoom e offline no Chromium. Zoom nativo, leitores de tela e dispositivos móveis reais ainda exigem avaliação manual.
