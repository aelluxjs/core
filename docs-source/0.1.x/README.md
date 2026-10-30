<div class="text-center">
<h1>aellux.js 0.1.x</h1>
<strong class="fs-5">UX Made Easy</strong>
<p>Modular UX behavior management for browser interfaces with an ES5-compatible AelluxJs boot script and an ES2017+ runtime</p>
</div>

<div class="d-flex gap-2 flex-row justify-content-center my-4">
<a class="btn btn-outline-adaptive rounded-1" href="https://github.com/aelluxjs/core">
View on Github
</a>
<a class="btn btn-primary rounded-1" href="getting-started.htm">
Get Started
</a>
</div>

## Project Goal

The goal of aellux.js is to make rich browser experiences easier to build and maintain. It helps developers organize UX features into reusable, modular pieces, reduce duplicated code, and keep applications lean as they grow. For end users, the aim is a faster, more consistent, and more reliable experience across pages and devices.

## How it Works

Add aellux.js to a page and enable the Extensions it needs. The library coordinates those Extensions as the page loads and changes. Well-defined contracts keep the public API and Extension behavior consistent, making features easier to combine and maintain.

```html
<div data-ae-scrollbox style="width: 20rem; height: 12rem; overflow: auto">
  <div style="height: 30rem">Scrollable content</div>
</div>
<script src="./dist/aellux.js"></script>
<script>
  $ae.init({ mode: "full" });
</script>
```

## Getting Started

- [Installation, build, and runtime modes](getting-started.md)
- [Technical compatibility and validated environments](compatibility.md)
- [Compatibility Commitment for 0.1.x](runtime/compatibility-commitment.md)
- [Runtime API](runtime/api.md)
- [`waitLayout` layout scheduling](runtime/wait-layout.md)
- [CSS Motion Controller](runtime/css-motion.md)
- [Runtime and Extension events](runtime/events.md)

## Runtime and Compatibility

- [Modern and Legacy runtimes](runtime/modern-legacy.md)
- [Browser support baseline](runtime/browser-support.md)
- [Known Limits & Risks](runtime/known-limits-and-risks.md)
- [ES5 support level](runtime/es5-support.md)
- [Visual mounting states](runtime/visual-mounting.md)
- [Diagnostics](runtime/diagnostics.md)
- [Integration guide](integrations/bootstrap.md) for [Bootstrap](https://getbootstrap.com/)
- [VS Code Custom Data and JetBrains Web Types](integrations/editor-tooling.md)

## Extensions

- [Authoring third-party Extensions](extensions/authoring.md)
- [Accessibility requirements for Extensions](extensions/accessibility.md)
- [Registering Extensions with `$ae.ext(...)`](extensions/registration.md)
- [Declarative loading with `link[rel="aelluxjs-ext"]`](extensions/declarative-loading.md)
- [Lazy loading](extensions/lazy-loading.md)
- [Optional Extension styles](extensions/styles.md)
- [CSP and Extension trust](extensions/csp-and-trust.md)
- [Modern and Legacy Extension variants](extensions/legacy-variants.md)

## Core Extensions

The [Core Extensions overview](core-extensions/README.md) explains distribution and stability and links to all sixteen official Extensions.

- [Bundled Extensions](core-extensions/README.md#bundled-extensions)
- [Optional Extensions](core-extensions/README.md#optional-extensions)

## Project Documents

- [Browser validation scenarios](validation-scenarios.md)
- [Milestone: aellux.js 0.1.0](https://github.com/aelluxjs/core/blob/main/milestones/0.1.0.md)
- [Milestone: aellux.js 0.1.0 Beta 1](https://github.com/aelluxjs/core/blob/main/milestones/0.1.0-beta.1.md)
- [Extension scaffold](https://github.com/aelluxjs/core/blob/main/templates/README.md)
- [Changelog](https://github.com/aelluxjs/core/blob/main/CHANGELOG.md)

## Acknowledgments

Special thanks to [ChatGPT](https://chatgpt.com/), [Codex](https://openai.com/codex/), [Visual Studio Code](https://code.visualstudio.com/), [Bootstrap](https://getbootstrap.com/), and [GitHub](https://github.com/) for the tools and technologies that supported the development of Aellux.
