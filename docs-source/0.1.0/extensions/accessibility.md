# Accessibility Requirements for Extensions

An Extension can create interaction, change presentation, manage state, enforce rules, connect to an external service, or provide infrastructure without producing user interface. Accessibility requirements therefore apply according to the capabilities an Extension declares. They are not a fixed checklist that every Extension must satisfy in full.

Every distributed Extension must preserve the accessibility of the page features it affects. This document defines an implementation and review baseline; meeting it does not by itself certify a page against WCAG or guarantee compatibility with every assistive technology.

## Capability Profile

Describe an Extension with one or more capabilities. These categories may overlap and are documentation tags rather than runtime types.

| Capability | Typical responsibility | Requirements that apply |
| --- | --- | --- |
| Interaction and input | Click, keyboard, pointer, drag, selection, or custom controls. | Semantics, keyboard access, accessible names, focus, input alternatives, and state communication. |
| Structure and state | Show, hide, insert, remove, reorder, label, select, expand, or relate content. | DOM order, semantic structure, ARIA or native state, relationships, focus safety, and announcements when needed. |
| Visual and adaptive presentation | Layout, theme, scale, contrast, color, viewport, or input-mode adaptation. | Reflow, zoom, contrast, forced colors, reduced transparency, text and interface scale, and alternatives to color-only meaning. |
| Motion and timing | Animation, transition, automatic progression, delay, or dismissal. | Reduced motion, interruption, timing controls, understandable state without animation, and timer cleanup. |
| External data and integration | Fetch, persistence, synchronization, embedded services, or third-party APIs. | Pending and failure states when user-facing, recovery, stable focus, meaningful status communication, and asynchronous cleanup. |
| Infrastructure and policy | Diagnostics, scheduling, event routing, rules, registries, or services without direct UI. | Preservation of existing semantics and state, predictable failure behavior, cleanup, and documentation of indirect UI effects. |

Do not force an Extension into a single category. For example, a dialog behavior can declare interaction, structure and state, and motion. A background registry may declare only infrastructure and policy. A network synchronization Extension may declare external data and integration without declaring interaction.

For every capability not declared, the corresponding requirements are not applicable unless the implementation still produces that effect indirectly.

## Requirements for Every Extension

Regardless of category, an Extension must:

- document its capability profile and the page state it reads or owns;
- avoid removing or invalidating existing semantics, accessible names, focusability, relationships, or user preferences outside its documented responsibility;
- leave affected page state coherent when initialization, mounting, updating, or an external operation fails;
- release the listeners, observers, timers, pending work, generated nodes, and references it owns during the applicable lifecycle cleanup; and
- identify unvalidated browser, mobile, iframe, input, or assistive-technology scenarios instead of implying support.

An Extension with no user-facing output may mark visual, keyboard, focus, naming, ARIA, announcement, motion, and timing requirements as not applicable. It must still document any indirect effect that consumers can expose to users.

## Author Documentation

Define the applicable fields on the Extension's page. State `Not applicable` with a short reason when omission could be ambiguous.

| Field | Required definition |
| --- | --- |
| Capabilities | Every applicable category from the capability profile. |
| Affected output | Elements, attributes, content, styles, events, stored values, or external results produced or changed. |
| Inputs and activation | Pointer, keyboard, programmatic, lifecycle, media-query, network, storage, or other triggers. |
| Semantic host | Expected native elements and any supported non-native host. Required when DOM semantics are affected. |
| Accessible name | Source of the visible label or accessible name for controls the Extension creates or owns. |
| State and relationships | Owned `aria-*`, `hidden`, disabled, selected, checked, expanded, busy, IDs, and references. |
| Focus | Whether focus can move, become hidden, require restoration, or remain unchanged. |
| Presentation | Effects on color, contrast, layout, zoom, text scale, interface scale, or forced colors. |
| Motion and timing | Transitions, delays, automatic actions, dismissal, and relevant user preferences. |
| Pending, success, and failure | User-visible behavior while asynchronous or external work is pending, succeeds, or fails. |
| Announcements | Changes that require notification beyond native semantics, focus, or control state. |
| Lifecycle cleanup | Attributes, listeners, timers, requests, observers, generated content, relationships, and references released during cleanup. |
| Limitations | Any relevant scenario that has not been validated. |

## Capability-Specific Behavior

### Interaction and input

- Use native interactive elements such as `button`, `a`, `input`, and `select` when their semantics match the action.
- An essential action exposed through click, hover, drag, pointer events, or a custom gesture must have an appropriate keyboard or native-control path.
- Do not add keyboard behavior to a non-interactive element without supplying the necessary role, focusability, accessible name, state, and expected key handling.
- Preserve normal Tab order unless the Extension documents and implements a composite-widget keyboard model.
- Do not intercept keys unrelated to the active control.
- Do not assume hover support, a fine pointer, or a single active pointer when the Extension owns the action.

### Structure, state, and focus

- Keep DOM visibility and accessibility state synchronized. For example, a trigger's `aria-expanded` must agree with the controlled element's expanded or hidden state.
- ARIA references such as `aria-controls`, `aria-labelledby`, and `aria-describedby` must point to existing IDs while active.
- Prefer native elements and state attributes before adding ARIA roles or properties.
- Every interactive control created or owned by the Extension must have an accessible name.
- Do not leave focus inside content that the Extension makes hidden, inert, detached, or otherwise unavailable.
- Move focus only when the interaction requires it and the destination is predictable from the initiating action.
- When a temporary surface closes, return focus to its invoking control when that control still exists and remains usable.
- Use live announcements only for meaningful changes that are not already conveyed through focus, native semantics, or control state.

### Visual and adaptive presentation

- Respect the applicable AelluxJs preferences when the Extension produces behavior related to motion, contrast, transparency, forced colors, text scale, or interface scale.
- Do not communicate state through color alone.
- Enlarged text, zoom, and interface scaling must not remove essential content or make an owned control unreachable in supported layouts.
- Adaptation based on viewport or input characteristics must not remove the only available path to essential content or actions.
- An Extension that only supplies neutral data or rules for another component must document that the consuming component owns the final visual accessibility.

### Motion and timing

- Essential state changes must remain understandable when transitions or animation are disabled.
- Respect reduced-motion preferences for motion the Extension owns.
- Automatic dismissal or progression must not make essential content inaccessible.
- Provide a way to stop or extend timing when required by the announced interaction.
- Cancel owned timers, animation work, and pending transitions during cleanup.

### External data and asynchronous integration

- Expose pending, success, and failure states only when they are meaningful to the user-facing feature.
- If an owned control becomes busy or disabled, restore it after success, failure, cancellation, and unmount.
- Set `aria-busy="true"` only on the region whose availability changed and clear it when the operation ends.
- Preserve focus and existing content unless replacement or movement is part of the documented behavior.
- Communicate an error accessibly when the Extension owns the user-visible operation; background-only failures may remain diagnostics without a live announcement.
- Cancel or disregard stale asynchronous results so they cannot update content after unmount or supersede newer state.

### Infrastructure and policy

- Infrastructure without direct UI does not need to create keyboard behavior, ARIA, focus movement, visual styles, or announcements.
- Events, rules, and services must expose enough state for a consuming user-interface Extension to represent pending, success, failure, and disabled conditions when applicable.
- A policy or routing Extension must not silently invalidate semantic state owned by another Extension.
- Diagnostics intended only for developers must not be announced to users unless a consuming interface explicitly chooses to present them.

## Lifecycle Requirements

`mount` may add temporary ARIA and AelluxJs data attributes to its mounted element. The mount manager records and restores the element's initial `aria-*`, `data-ae-*`, and `hidden` attributes when its last registration is unmounted. An Extension remains responsible for descendant elements it changes unless those descendants have their own mount registration.

For every resource or user-facing state it owns, an Extension must:

1. Read the initial state before overwriting it.
2. Keep the applicable visual, interaction, semantic, and asynchronous states synchronized during update.
3. Cancel or detach owned pending work during `unmount` and `destroy`.
4. Remove owned listeners, observers, generated nodes, IDs, and relationships.
5. Restore changed descendant state explicitly or mount those descendants separately so the mount manager can restore them.
6. Handle failed and partial mounting without leaving busy, hidden, focus, control, or external-operation state inconsistent.

An Extension that does not mount DOM elements applies these rules to its actual lifecycle and resources rather than implementing an artificial mount contract.

## Core Extension Expectations

- `present` declares interaction, structure and state, and motion when transitions are configured. It must synchronize `hidden`, `aria-expanded`, and `aria-controls`; closing content must not leave focus in the hidden region.
- `preference` declares interaction and state. Its controls must use appropriate native semantics, expose the selected value, and remain usable without pointer input.
- `point` declares input routing and infrastructure. Its events are an enhancement layer; the consuming component owns a keyboard or native-control equivalent for any essential action.
- `adaptive` declares visual and adaptive presentation. Its output must not be used to remove essential content solely because of viewport dimensions or input assumptions.
- `state-navigation` declares structure and state plus integration. Restored state must remain coherent with the document title, URL, history entry, and any consuming interface.
- Waiting interfaces using `data-ae-wait-mounted` must clear `aria-busy` after successful and failed mount attempts.
- `focus` declares focus management and state integration. It must skip targets that are hidden, inert, disabled, detached or no longer visible, avoid restoration loops, preserve authored hints and remove generated hints during unmount.

## Minimum Validation

Validate the universal requirements and each declared capability. Tests or documented manual checks should cover only the applicable rows:

| Capability | Minimum validation |
| --- | --- |
| Interaction and input | Keyboard activation, Tab order, input alternatives, accessible names, and owned control state. |
| Structure and state | DOM and reading order, focus safety, synchronized native or ARIA state, valid relationships, and necessary announcements. |
| Visual and adaptive presentation | Zoom, text and interface scale, contrast, forced colors, reflow, and absence of color-only meaning where affected. |
| Motion and timing | Reduced motion, disabled animation, interruption, timing control, and cleanup. |
| External data and integration | Pending, success, failure, cancellation, stale responses, focus stability, and cleanup. |
| Infrastructure and policy | Stable contracts, failure isolation, indirect state effects, cleanup, and diagnostics behavior. |

Also validate failed initialization or mounting, repeated lifecycle execution, and the Modern or Legacy environments claimed by the Extension when those lifecycle paths exist.

Record excluded browser, iframe, mobile, input, network, or assistive-technology scenarios as limitations.

## 0.1.0 Validation Record

The automated release suite runs in Playwright Chromium, Firefox, and WebKit. It verifies native `button` activation by keyboard for Preference controls; Focus history, restoration, and generated `enterkeyhint` cleanup; Present synchronization of `hidden`, `aria-expanded`, and `aria-controls`, including focus release when a region is hidden; and `aria-busy` cleanup after failed mounting.

It also verifies that Preference publishes and clears explicit `reduced-motion`, `contrast`, and `forced-colors` values on the document root. The suite validates the Extension contracts that expose those values; consumer CSS and application markup remain responsible for reflow, zoom, color contrast, forced-color rendering, readable labels, and an equivalent keyboard path for application-specific pointer actions.

This record does not claim manual assistive-technology testing, mobile-browser coverage, or certification of a consuming page against WCAG. Those scenarios remain outside the `0.1.0` validated matrix.

## Review Checklist

- The capability profile matches the behavior implemented.
- Universal preservation, failure, cleanup, and limitation requirements are satisfied.
- Every declared capability has its applicable documentation and validation.
- Requirements marked not applicable include a clear reason when ambiguity is possible.
- The Extension does not claim accessibility behavior owned by a consuming component.
- Tests cover the announced behavior and documented limitations match the validated scope.
