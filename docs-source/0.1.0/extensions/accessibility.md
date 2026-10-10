# Accessibility Requirements for Extensions

Every distributed Extension must preserve the accessibility of the HTML it enhances. These requirements define the minimum contract for Core and third-party Extensions. They are an implementation and review baseline; meeting them does not by itself certify a page against WCAG or guarantee compatibility with every assistive technology.

## Author Responsibilities

An Extension author must define and test the following parameters for every interactive behavior:

| Parameter | Required definition |
| --- | --- |
| Interaction | Which pointer, keyboard, and programmatic actions activate the behavior. |
| Semantic host | Which native HTML elements are expected, and whether non-native hosts are supported. |
| Accessible name | Where each control obtains its visible label and accessible name. |
| State | Which `aria-*`, `hidden`, disabled, selected, checked, expanded, or busy states the Extension owns. |
| Relationships | Which IDs and ARIA relationships, such as `aria-controls`, are created or updated. |
| Focus | Where focus starts, whether it moves, where it returns, and what happens when content is hidden or removed. |
| Motion and timing | Which transitions, delays, or automatic actions occur and how user preferences affect them. |
| Announcements | Whether a state change needs a live region or another notification for assistive technology. |
| Lifecycle cleanup | Which attributes, listeners, timers, observers, generated IDs, and focus changes are reversed during `unmount` and `destroy`. |
| Limitations | Any interaction mode, browser, iframe, or assistive technology scenario that has not been validated. |

Document these parameters on the Extension's page. If a parameter does not apply, state that explicitly where its absence could otherwise be ambiguous.

## Minimum Behavior

### Semantic controls and keyboard access

- Use native interactive elements such as `button`, `a`, `input`, and `select` whenever their semantics match the action.
- Do not make pointer-only interaction the sole way to perform an action. An action available through click, hover, drag, or a custom pointer event must have an appropriate keyboard or native-control path when the action is essential.
- Do not add keyboard behavior to a non-interactive element without also supplying the necessary role, focusability, accessible name, state, and expected key handling.
- Preserve normal Tab order unless the Extension documents and implements a composite-widget keyboard model.
- Do not intercept keys unrelated to the active control.

### Focus management

- Never leave focus inside content that becomes `hidden`, inert, detached, or otherwise unavailable.
- Move focus only when the interaction requires it and the destination is predictable from the initiating action.
- When a temporary surface closes, return focus to its invoking control when that control still exists and remains usable.
- Removing or unmounting an element must not leave a retained reference that later receives focus.
- Visible focus indication remains the responsibility of the page or Extension stylesheet and must not be removed without an equivalent replacement.

### Names, states, and relationships

- Every interactive control must have an accessible name. Icon-only controls require text through visible content, `aria-label`, or `aria-labelledby`.
- Keep DOM visibility and accessibility state synchronized. For example, a trigger's `aria-expanded` must agree with the controlled element's expanded or hidden state.
- ARIA references such as `aria-controls`, `aria-labelledby`, and `aria-describedby` must point to existing IDs while active.
- Prefer native state attributes and elements before adding an ARIA role or property.
- Set `aria-busy="true"` only while the related operation is pending and restore it when the operation succeeds or fails.
- Use live announcements only for meaningful changes that are not already conveyed through focus, native semantics, or control state.

### Motion, timing, color, and input

- Respect the applicable AelluxJs preferences for reduced motion, contrast, transparency, forced colors, text scale, and interface scale when the Extension produces related visual behavior.
- Essential state changes must remain understandable when transitions or animation are disabled.
- Automatic dismissal or progression must not make essential content inaccessible. Document timing controls and provide a way to stop or extend time when required by the interaction.
- Do not communicate state through color alone.
- Do not assume hover support, a fine pointer, or a single active pointer.
- Enlarged text and interface scaling must not remove controls or make the active state unreachable in the supported layouts.

## Lifecycle Requirements

`mount` may add temporary ARIA and AelluxJs data attributes to its mounted element. The mount manager records and restores the element's initial `aria-*`, `data-ae-*`, and `hidden` attributes when its last registration is unmounted. An Extension remains responsible for descendant elements it changes unless those descendants have their own mount registration.

An accessible lifecycle must therefore:

1. Read the initial DOM before overwriting state that affects behavior.
2. Keep visual, interaction, and accessibility states synchronized during every update.
3. Cancel pending timers, transitions, and asynchronous focus work during `unmount`.
4. Remove listeners, observers, generated nodes, generated IDs, and relationships owned by the Extension.
5. Restore changed descendant state explicitly or mount those descendants separately so the mount manager can restore them.
6. Handle failed and partial mounting without leaving `aria-busy`, hidden content, focus, or control state inconsistent.

## Core Extension Expectations

- `present` must keep `hidden`, `aria-expanded`, and `aria-controls` synchronized for mounted containers and triggers. Closing content must not leave focus in the hidden region.
- `preference` controls must use appropriate native controls and expose the selected value through visible text or an accessible name. Preference changes must remain usable without pointer input.
- `point` events are an enhancement layer. Essential actions using them require a keyboard or native-control equivalent supplied by the consuming component.
- `adaptive` output must not be used to remove essential content solely because of viewport dimensions or input assumptions.
- Waiting interfaces using `data-ae-wait-mounted` must clear `aria-busy` after both successful and failed mount attempts.
- Extensions without implemented behavior, including the current `focus` scaffold, must not be presented as providing an accessibility feature.

## Minimum Validation

Before an Extension is described as supported, cover its announced behavior with tests or a documented manual check for:

- keyboard activation and expected Tab order;
- focus destination and restoration when content opens, closes, unmounts, or is removed;
- accessible names and synchronized ARIA or native states;
- operation without hover and without a fine pointer;
- reduced-motion behavior when motion is present;
- zoom, text scale, or interface scale relevant to the supported layout;
- successful cleanup after `unmount`, failed mounting, and repeated mounting; and
- the Modern and Legacy environments claimed by the Extension.

Record any excluded browser, iframe, mobile, or assistive technology scenario as a limitation rather than implying support.

## Review Checklist

- Native semantics are used where applicable.
- Every action has the required keyboard path.
- Controls have accessible names.
- Focus never remains in hidden or removed content.
- ARIA state matches visible and interactive state.
- Relationships reference valid elements.
- Motion and timing respect applicable preferences.
- State is not communicated through color alone.
- Mount failure and unmount restore a coherent state.
- Tests cover the behavior and documented limitations match the validated scope.
