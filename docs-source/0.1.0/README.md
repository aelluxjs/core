<div class="text-center">
<h1>aellux.js 0.1.0</h1>
<strong>UX Made Easy</strong>
<p>Modular UX behavior management for browser interfaces with an ES5-compatible AelluxJs boot script and an ES2017+ runtime</p>
</div>

<div class="d-flex gap-2 flex-row justify-content-center my-3">
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

## Getting Started

- [Installation, build, and runtime modes](getting-started.md)
- [Compatibility for 0.1.0 Beta](compatibility.md)
- [Runtime API](runtime/api.md)

## Runtime and Compatibility

- [Modern and Legacy runtimes](runtime/modern-legacy.md)
- [Browser support baseline](runtime/browser-support.md)
- [ES5 support level](runtime/es5-support.md)
- [Visual mounting states](runtime/visual-mounting.md)
- [Diagnostics](runtime/diagnostics.md)
- [Bootstrap integration](integrations/bootstrap.md)

## aellux.js Extensions

- [Authoring third-party Extensions](extensions/authoring.md)
- [Registering Extensions with `$ae.ext(...)`](extensions/registration.md)
- [Declarative loading with `link[rel="aelluxjs-ext"]`](extensions/declarative-loading.md)
- [Lazy loading](extensions/lazy-loading.md)
- [Optional Extension styles](extensions/styles.md)
- [Modern and Legacy Extension variants](extensions/legacy-variants.md)

## Project Documents

- [Browser validation scenarios](validation-scenarios.md)
- [Milestone: aellux.js 0.1.0 Beta 2](https://github.com/aelluxjs/core/blob/main/milestones/0.1.0-beta.2.md)
- [Milestone: aellux.js 0.1.0 Beta 1](https://github.com/aelluxjs/core/blob/main/milestones/0.1.0-beta.1.md)
- [Extension scaffold](https://github.com/aelluxjs/core/blob/main/templates/README.md)
- [Changelog](https://github.com/aelluxjs/core/blob/main/CHANGELOG.md)
