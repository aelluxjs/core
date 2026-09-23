# ES5 Support Level

ES5 compatibility describes the syntax baseline of the Aellux boot script and Babel-generated Legacy variants. It does not mean unrestricted support for every historical browser capable of parsing ES5.

## Boot Script

The boot script avoids modern syntax so it can perform capability detection before selecting the Modern or Legacy runtime. Optional APIs are checked before use where the boot process requires them.

## APIs and Polyfills

Syntax compatibility does not provide missing browser APIs. A functional Legacy runtime may require polyfills for features such as Promises, DOM matching, collections, events, networking, or URL handling.

The final supported environments and required polyfills remain part of the `0.1.0-beta` milestone. Legacy files are generated from the same orchestrator and Extension sources, but only the Modern ES2017+ runtime should be considered fully operational until those requirements are complete.

## Build Tooling

Node.js 20 or newer is required to build Aellux. This tooling requirement is independent of the browser syntax baseline.
