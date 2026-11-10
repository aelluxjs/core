# Declarative Action Naming Convention

This is the normative naming convention for new declarative operations directed at another element:

```html
data-ae-{extension}-trigger="{action}"
data-ae-{extension}-target="{elementId}"
```

The namespace MUST identify the Extension that executes the action, regardless of which Extension or input originated the request. `trigger` declares an action exposed by that Extension; `target` identifies its recipient. Each Extension MUST interpret and validate its own actions. There is no universal dispatcher or automatic exposure of every JavaScript method.

## Targets, validation and composition

A target alone MUST NOT create an interaction control. A trigger MAY use an implicit target, provided its Extension documents that resolution. Present uses the closest Present ancestor, including a region without an ID. An explicit Present target accepts one existing native ID, optionally prefixed with `#`, rather than a selector list.

An Extension MUST document its action values, invalid-value behavior and target grammar. Present accepts `pop`, `unpop`, `dismiss`, `toggle` and `effect`; empty means `toggle`. Unknown actions emit a diagnostic and fall back to `toggle`. An invalid or missing explicit target emits a diagnostic and performs no action. Prefer native buttons so keyboard activation follows native click behavior.

Configuration, structural references and data destinations MUST remain distinct from action declarations. Extensions MAY consume another Extension's target attribute as a routing instruction without turning that element into a trigger. Feedback consumes `data-ae-present-target` for its Pop/popNext requests; it does not declare an interactive Present action. Optional cross-Extension requests use the [communication mediator](../runtime/communication.md), and each provider owns execution and cleanup.

```html
<button data-ae-present-trigger="pop" data-ae-present-target="notice">Open</button>
<section id="notice" data-ae-present="opacity" hidden>
  <button data-ae-present-trigger="dismiss">Close closest Present</button>
</section>
```

## Prerelease migration

Deploy the runtime, generated editor metadata, styles and updated markup together. These replacements establish the prerelease contract; the old names are not aliases:

| Previous attribute | Current declaration |
| --- | --- |
| `data-ae-trigger` | `data-ae-present-trigger` |
| `data-ae-target` | `data-ae-present-target` |
| `data-ae-trigger-on` | `data-ae-present-trigger-on` |
| `data-ae-dismiss="notice"` | `data-ae-present-trigger="dismiss" data-ae-present-target="notice"` |
| `data-ae-dismiss` | `data-ae-present-trigger="dismiss"` |
| `data-ae-message-target` | `data-ae-feedback-message-target` |
| `data-ae-transform-target` | `data-ae-feedback-effect-target` |

Custom effect CSS also migrates from `ae--feedback-motion-{name}` to `ae--present-effect-{name}`, and from `--ae-feedback-aellux-ease` to `--ae-present-effect-aellux-ease`. Preset keyframes are distributed only in Present CSS.

`data-ae-auto-dismiss` and `data-ae-dismiss-on-click` keep their names. `data-ae-present-motion` still identifies the direct grid content child; it never selects an effect.

## Audit of existing declarations

This migration changes Present controls and Feedback destinations. Other established contracts keep their names. Future directed method controls should adopt this convention without inventing generic trigger/target attributes.

| Extension / attributes | Classification and current decision |
| --- | --- |
| Present: `present-trigger`, `present-target` | Declarative method action and recipient; migrated together. |
| Present: `present-trigger-on`, `auto-dismiss`, `dismiss-on-click`, `present-active`, `present-when` | Behavior, timing and group selection configuration. |
| Present: `present-motion`, `present-gesture-source` | Structural child and gesture input reference. |
| Preference: `option`, `next`, `prev` | Existing local value/cycle controls within the closest `preference`; retained. No new directed Preference dispatcher is introduced. |
| Preference: `preference`, `label` | Preference scope and matching-value display configuration. |
| Focus: `focus`, `focus-nav`, `focus-scope` | Navigation behavior and scope configuration. |
| Focus: `shortcut`, `shortcut-action`, `shortcut-target` | Existing scoped input descriptors, action selection and optional recipient; retained. Default `click` composes with the new Present triggers. |
| Input: `point`, `inputs`, `shortcut-hint` | Input and hint configuration; Input routes physical commands rather than interpreting Present attributes. |
| Feedback: `feedback-message-target`, `feedback-effect-target` | Message data destination and visual effect destination. Neither is an interaction trigger. |
| Feedback: `present-target` | Optional routing to Present Pop/popNext on accepted semantic feedback. |
| Anchor: `anchor-target`; Viewport: `viewport-target` | Geometric reference and CSS output destination; retained. |
| Progress: `progress-target` | Reference to a numeric data producer; retained. |
| State Navigation | Event/history API with application-owned state application; no declarative directed method controls to rename. |
| Ajax Href, Scrollbox Snap, PWA | Navigation regions, item configuration and install behavior retain their existing contracts. |

The [Compatibility Commitment](../runtime/compatibility-commitment.md) protects only enumerated activation/mounting roles. This convention does not expand that commitment to action values, effect presets, methods or behavior.
