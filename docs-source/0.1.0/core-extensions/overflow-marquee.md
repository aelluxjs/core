# Overflow Marquee

`overflow-marquee` is a dedicated Extension for `[data-ae-overflow-marquee]`. Register only `$ae.ext("overflow-marquee", { loadStyle: true })` in Basic mode. During `init()`, it registers Anchor if necessary and awaits `$ae.wait("anchor")` before obtaining a placement map and registering its own mount map. Full mode registers it lazily and requests its separate Modern or Legacy script only when matching content is mounted. Anchor alone does not mount marquee elements.

```js
$ae.ext("overflow-marquee", { loadStyle: true });
$ae.init({ mode: "basic" });
```

```html
<span data-ae-overflow-marquee style="max-width:12rem">
  A long label whose complete content should remain available
</span>
```

The external stylesheet, included in Full or requested with `loadStyle: true` in Basic, supplies relative positioning, clipping and ellipsis. It applies `white-space:nowrap!important` to the host and its generated wrapper, without writing inline whitespace styles. Ordinary author styles remain subject to the CSS cascade; a higher-priority important rule can override the weak rule. The wrapper stays in normal flow to preserve the label's height. Its nodes are moved, not cloned, preserving their identity and listeners. Use this on single-line content containers; inserting a wrapper changes direct-child selector relationships.

When content overflows horizontally, the wrapper waits at the start, moves linearly from `top-left:top-left` toward `bottom-right:bottom-right`, and waits for the same duration at the end. It then jumps back without animating the return, waits at the start, and repeats. Geometry compensates for host padding and borders and holds the vertical position. RTL text travels in the opposite direction. The defaults are 30 CSS pixels per second and a 1200ms pause at each end. Customize them on the host:

```css
.label {
  --ae-overflow-marquee-speed: 30;
  --ae-overflow-marquee-delay: 1200ms;
}
```

Speed accepts a positive number; delay accepts a nonnegative `ms` or `s` time. Invalid values use the defaults. CSS Motion and the shared layout scheduler control transitions; `data-ae-maxfps` can cap a label's motion. Measurements and the first pass wait until the label is actually visible. Computed CSS hiding, leaving the viewport or an observed clipping container, and a background document pause the current pass in place, including its remaining restart delay. Reappearing resumes from that position without counting invisible time. Paused labels keep no animation sequence or restart timer running; observers and visibility events wake them. Visibility does not detect coverage by unrelated elements. Without IntersectionObserver, viewport bounds and CSS visibility provide the fallback. Content or size changes on return restart with the updated geometry. Font loading and window resize also refresh measurements.

With `html[data-ae-reduced-motion="reduced"]`, movement is disabled immediately by CSS and the running cycle is canceled. The wrapper uses its available width with `text-overflow:ellipsis`; the complete text remains in the DOM. Returning to `no-preference` restarts from the beginning after the configured pause. Labels that fit do not animate.

Mouse hover pauses movement by default on devices offering hover and a fine pointer. Focus on the host or any descendant also pauses it; the Extension does not change focusability. Moving focus between descendants keeps the pause. All pause reasons compose: playback resumes only after hover, focus and visibility blocks have cleared, preserving the current position and the remaining delay at either endpoint. Hover and focus leave the native tooltip and overflow measurements available.

On devices offering hover and a fine pointer, overflowing labels receive their complete normalized text in the host's native `title` attribute, including in reduced-motion mode. An authored `title`, even an empty one, is preserved. Owned titles update with text changes and are removed when overflow disappears or on unmount; application changes to the title are retained. No custom tooltip or duplicate accessible text is inserted.

Unmount cancels motion and pending work, disconnects component observers/listeners, unwraps the current content and removes owned tooltip/state attributes. The external stylesheet remains across unmount/remount. Destroying the Extension releases its placement map and removes an individually loaded stylesheet; the shared Full stylesheet remains. Generated wrappers do not carry `data-ae-anchor`, so ordinary Anchor discovery and updates cannot compete with their animation.

## Distribution cost

Marquee behavior ships in its own script. Anchor provides only a reusable placement map; Full includes the lazy registration and official artifact metadata. Values are bytes, with gzip level 9.

| Artifact | Raw / gzip | Limit raw / gzip |
| --- | ---: | ---: |
| `aellux.min.js` | 48,079 / 15,355 | 47.5 / 15.5 KiB |
| `aellux.ext.overflow-marquee.min.js` | 11,773 / 4,427 | 12 / 4.5 KiB |
| `aellux.ext.overflow-marquee.legacy.min.js` | 23,479 / 7,805 | 23.5 / 8 KiB |
| `aellux.ext.anchor.min.js` | 14,672 / 5,358 | 15 / 6 KiB |
| `aellux.ext.anchor.legacy.min.js` | 22,229 / 7,836 | 23 / 8 KiB |
| `aellux.full.min.js` | 131,182 / 42,552 | 130 / 42 KiB |
| `aellux.full.legacy.min.js` | 442,219 / 131,956 | 432 / 138 KiB |

Anchor and Full Legacy retain their existing limits. The boot's raw/gzip limits increase from 46.5/15 to 47.5/15.5 KiB for the new official entry and maintenance room for its integrity hashes. Full Modern's gzip limit increases from 41.5 to 42 KiB to cover the additional official metadata and registration. Registering Anchor alone does not download or initialize Overflow Marquee.

Equal endpoint holds and interaction pauses add 681/170 bytes in Modern and 785/227 bytes in Legacy (raw/gzip) over the initial dedicated Extension. Their raw limits increase from 11.5 to 12 KiB and from 23 to 23.5 KiB respectively; gzip limits remain unchanged.
