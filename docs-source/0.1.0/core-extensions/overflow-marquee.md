# Overflow Marquee

`overflow-marquee` is a dedicated Extension for `[data-ae-overflow-marquee]`. Basic registers it automatically for lazy loading; use `$ae.ext("overflow-marquee", { loadStyle: true })` before initialization to load its stylesheet. During `init()`, it registers Anchor if necessary and awaits `$ae.wait("anchor")` before obtaining a placement map and registering its own mount map. Full bundles its implementation and initializes it only when matching content is mounted, without a separate script request. A mount restricted to Anchor does not mount marquee elements.

```js
$ae.ext("overflow-marquee", { loadStyle: true });
$ae.init({ mode: "basic" });
```

```html
<span data-ae-overflow-marquee style="max-width:12rem">
  A long label whose complete content should remain available
</span>
```

The attribute also accepts a nonnegative pixel limit, with or without `px`:

```html
<a data-ae-overflow-marquee="250px" href="/details">A navigation label</a>
<span data-ae-overflow-marquee="250">Another label</span>
```

This value is only a condition; it does not set or cap the layout width. The intrinsic single-line content width or height must strictly exceed it before marquee is considered. Equal or smaller content keeps `white-space:nowrap!important` from the external stylesheet, but otherwise preserves its authored presentation, without generated wrappers, clipping, ellipsis, fade, owned tooltip, visibility/interaction checks or motion. Only content/size monitoring and the threshold measurement remain, so edits, style changes, font loading and resizing can enable it later. Crossing back below the limit cancels motion and restores the original nodes and presentation while retaining nowrap. Horizontal overflow within the existing layout is still required to animate; a height exceeding the limit does not introduce vertical movement. An empty attribute preserves the original overflow behavior. Decimals are accepted; invalid values fall back to the empty behavior. Changing the value reconfigures a mounted label.

The external stylesheet, included in Full or requested with `loadStyle: true` in Basic, supplies relative positioning, clipping and ellipsis. It applies `white-space:nowrap!important` to the host and its generated content wrapper, without writing inline whitespace styles. Ordinary author styles remain subject to the CSS cascade; a higher-priority important rule can override the weak rule. A stationary viewport contains the moving content wrapper, both in normal flow to preserve the label's height. Original nodes are moved, not cloned, preserving their identity and listeners. Use this on single-line content containers; inserting these layers changes direct-child selector relationships.

When content overflows horizontally, the wrapper waits at the start, moves linearly from `top-left:top-left` toward `bottom-right:bottom-right`, and waits for the same duration at the end. It then jumps back without animating the return, waits at the start, and repeats. Geometry compensates for host padding and borders and holds the vertical position. RTL text travels in the opposite direction. The defaults are 30 CSS pixels per second and a 1200ms pause at each end. Customize them on the host:

```css
.label {
  --ae-overflow-marquee-speed: 30;
  --ae-overflow-marquee-delay: 1200ms;
  --ae-overflow-marquee-fade-size: 16px;
}
```

Overflow receives a progressive transparency fade by default. At the start only the trailing edge fades; during travel both edges fade according to the hidden content; at the end only the leading edge fades. RTL reverses these edges. Each fade is limited to the hidden distance, the configured maximum size and half the viewport width. When less than the configured size is hidden, its strength also decreases continuously. Fitting labels have no mask. Use a nonnegative CSS length for `--ae-overflow-marquee-fade-size`; `0px` makes the mask fully opaque and removes the visual effect.

```html
<span data-ae-overflow-marquee data-ae-overflow-marquee-fade="false">
  This overflowing label moves without a fade
</span>
```

The fade attribute defaults to enabled. Empty and `true` also enable it; only `false` disables it. Changing or removing it updates an already mounted label without restarting its current pass. Invalid values keep the default and receive the existing semantic configuration diagnostic in development mode.

The viewport uses only `mask-image:linear-gradient(...)` and its WebKit-prefixed equivalent. It stays fixed over the visible content area, leaving the host's background and border intact. Masking works with any text or background color and inserts no duplicate accessible content. Anchor still measures and places the content wrapper. CSS Motion captures the viewport's registered offset transition together with the wrapper's transform in one operation, so their clocks, FPS policy and cancellation stay synchronized. No fade-specific frame loop or per-frame layout measurement is added. Browsers without CSS masks keep the motion without the visual effect. Without registered custom-property interpolation, moving labels omit the fade; static reduced-motion labels can still display it.

Speed accepts a positive number; delay accepts a nonnegative `ms` or `s` time. Invalid values use the defaults. CSS Motion and the shared layout scheduler control transitions; `data-ae-maxfps` can cap a label's motion. Measurements and the first pass wait until the label is actually visible. Computed CSS hiding, leaving the viewport or an observed clipping container, and a background document pause the current pass in place, including its remaining restart delay. Reappearing resumes from that position without counting invisible time. Paused labels keep no animation sequence or restart timer running; observers and visibility events wake them. Visibility does not detect coverage by unrelated elements. Without IntersectionObserver, viewport bounds and CSS visibility provide the fallback. Content or size changes on return restart with the updated geometry. Font loading and window resize also refresh measurements.

With Aellux's resolved `reduced-motion` preference, published as `html[data-ae-reduced-motion="reduced"]`, movement is disabled immediately by CSS and the running cycle is canceled. The wrapper uses its available width with `text-overflow:ellipsis`, retaining the static trailing overflow fade; the complete text remains in the DOM. Returning to `no-preference` restarts from the beginning after the configured pause. Labels that fit do not animate.

Mouse hover pauses movement by default on devices offering hover and a fine pointer. Focus on the host or any descendant also pauses it; the Extension does not change focusability. Moving focus between descendants keeps the pause. All pause reasons compose: playback resumes only after hover, focus and visibility blocks have cleared, preserving the current position and the remaining delay at either endpoint. Hover and focus leave the native tooltip and overflow measurements available.

On devices offering hover and a fine pointer, overflowing labels receive their complete normalized text in the host's native `title` attribute, including in reduced-motion mode. An authored `title`, even an empty one, is preserved. Owned titles update with text changes and are removed when overflow disappears or on unmount; application changes to the title are retained. No custom tooltip or duplicate accessible text is inserted.

Unmount cancels motion and pending work, disconnects component observers/listeners, unwraps the current content and removes owned tooltip/state attributes. The external stylesheet remains across unmount/remount. Destroying the Extension releases its placement map and removes an individually loaded stylesheet; the shared Full stylesheet remains. Generated wrappers do not carry `data-ae-anchor`, so ordinary Anchor discovery and updates cannot compete with their animation.

## Distribution cost

Marquee behavior ships in its own script. Anchor provides only a reusable placement map; Full includes the lazy registration and official artifact metadata. Values are bytes, with gzip level 9.

| Artifact | Raw / gzip | Limit raw / gzip |
| --- | ---: | ---: |
| `aellux.min.js` | 44,489 / 15,095 | 47.5 / 15.5 KiB |
| `aellux.ext.overflow-marquee.min.js` | 13,773 / 4,887 | 13.5 / 5 KiB |
| `aellux.ext.overflow-marquee.legacy.min.js` | 25,722 / 8,135 | 25.5 / 8 KiB |
| `aellux.ext.overflow-marquee.min.css` | 2,662 / 646 | 2.75 / 1 KiB |
| `aellux.ext.anchor.min.js` | 13,637 / 5,028 | 15 / 6 KiB |
| `aellux.ext.anchor.legacy.min.js` | 21,064 / 7,483 | 23 / 8 KiB |
| `aellux.orchestrator.min.js` | 63,482 / 21,149 | 62 / 20.75 KiB |
| `aellux.full.min.js` | 134,437 / 43,620 | 131.5 / 42.75 KiB |
| `aellux.full.legacy.min.js` | 447,192 / 133,005 | 437 / 138 KiB |

Registering Anchor alone does not download or initialize Overflow Marquee. The progressive fade adds 1,102/292 bytes in Modern, 1,172/284 bytes in Legacy and 1,559/231 bytes in the dedicated stylesheet (raw/gzip), compared with the preceding checked-in artifacts. The Extension's script limits remain unchanged; its CSS raw limit increases from 1.5 to 2.5 KiB.

The optional pixel limit adds 1,823/492 bytes in Modern, 2,087/387 bytes in Legacy and 175/24 bytes in CSS (raw/gzip), relative to the fade implementation. This includes measuring intrinsic content, skipping marquee work and styles while dormant, and restoring/reapplying the wrapper lifecycle when content crosses the limit. Its budgets increase from 12/4.5 to 13.5/5 KiB in Modern, from 23.5/8 to 25.5/8 KiB in Legacy, and from 2.5/1 to 2.75/1 KiB in CSS. Shared JavaScript limits remain unchanged.

The shared CSS Motion subtree option and semantic validation for both overflow fades add 667/168 bytes to Orchestrator Modern and 667/202 bytes to Full Modern. Their gzip limits increase from 20.5 to 20.75 KiB and from 42.5 to 42.75 KiB respectively. Combined distribution costs and the remaining shared budget adjustments are recorded in [Scrollbox](scrollbox.md#distribution-cost). Anchor and Full Legacy keep their existing limits.
