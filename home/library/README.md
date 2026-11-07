# Biblioteca de snippets

Abra `home/library/index.htm` em um servidor HTTP local ou HTTPS. Não há etapa de build própria nem dependência de CDN: Bootstrap 5.3.8 está em `vendor/`, com sua licença, e os arquivos AelluxJS são os de `../../dist/`.

- **Conteúdo:** `assets/snippets.js` contém o objeto `window.librarySource`. Cada exemplo define `id` único, `title`, `description`, `category`, `tags`, `extensions` e `code` (HTML, CSS e JavaScript do exemplo). Categorias também estão no objeto.
- **Apresentação:** `assets/library.js`, carregado no final da página, possui o template único `renderCard()` e o documento compartilhado das prévias. Para mudar todos os cards, altere esse renderizador e `assets/library.css`.
- **Edição:** após 650 ms sem digitar, a prévia é recriada com o código atual. Edições e favoritos ficam em `localStorage`; Restaurar recupera o código do objeto source. Copiar exporta um documento HTML completo com Bootstrap, os registros Basic e `$ae.init()`.
- **Prévia:** usa `iframe.srcdoc`, sem página externa. Viewport ativa somente prévias com área visível e descarrega as demais, preservando o editor. O modo ampliado usa `position: fixed; inset: 0`, mantém o espaço do card e cria uma entrada no State Navigation. Voltar, Escape e o Back do navegador retornam ao mesmo card; Forward reabre a prévia. Substituir o nó do iframe a cada execução evita entradas extras de histórico.
- **Isolamento:** o iframe permite scripts em uma origem opaca (`sandbox="allow-scripts"`). O renderizador incorpora Bootstrap e os arquivos Basic necessários antes de montar os exemplos via `startAelluxJs()`, sem requests de scripts com SRI a partir da origem opaca. A comunicação verifica a janela emissora e o token da execução. O código do exemplo não recebe acesso ao documento, storage ou histórico do app.
- **Busca:** título, descrição, categoria, tags e extensões são normalizados sem distinção de acentos/maiúsculas. O filtro textual é aplicado ao enviar o formulário Buscar. Tags e categorias aplicam filtros diretos.
- **PWA:** `manifest.webmanifest` e `sw.js` preparam o app inteiro e todos os exemplos já na primeira visita online, mesmo os ainda não vistos. Instalação usa a extensão PWA e instruções manuais quando necessário. A instalação efetiva depende do navegador; o indicador de offline só confirma depois da ativação do worker.

Ao adicionar extensões ou assets aos exemplos, inclua seus arquivos na lista explícita de `sw.js`. O worker aceita somente assets públicos listados, inclusive os arquivos `dist/` fora da pasta do app, e não intercepta outras páginas. Incremente `VERSION` ao publicar alterações para renovar o cache. A atualização aguarda o botão Atualizar biblioteca e preserva as edições antes de recarregar. O navegador pode remover caches por falta de espaço.

Verificação de integração: `npx playwright test tests/browser/library.spec.mjs` (ou `--config playwright.isolated.config.mjs` com o servidor de testes já iniciado).
