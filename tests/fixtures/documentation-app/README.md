# Documentation-style application scenarios

These frozen consumer scenarios reproduce a responsive sidebar with nested
Present groups, AJAX navigation feedback, and asynchronous TOC/highlighting
enhancements. Tests load only these local fixtures and the runtime under test.

`nested-menu.htm` contains the relevant markup and styles explicitly, using the
local Bootstrap fixture. `main.js` and `toc-init.js` are independent snapshots of
consumer integration code. They do not import or render the documentation theme,
read its navigation summary, or load generated documentation assets. Changes to
the live documentation do not update these scenarios automatically.

The tests establish runtime behavior in these cloned environments; they do not
validate the current documentation website or its third-party CDN libraries.
