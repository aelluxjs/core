/*! aellux.js | SPDX-License-Identifier: Apache-2.0 | See LICENSE for terms. */

/**
 * Dialog Extension
 *
 * Purpose: exposes the standard dialog API through mounted controllers.
 * Capability profile: structure and state; native modal interaction and focus.
 * Inputs and activation: mounts native `dialog` elements without data attributes.
 * Outputs and owned state: forwards show(), showModal() and close() to the
 * element, preserving native arguments, return values and exceptions.
 * Lifecycle: releases controllers on unmount. Legacy fallback registrations
 * and their shared CSS remain available for the document lifetime.
 * Accessibility: delegates modal behavior to the platform or Legacy polyfill;
 * consumers provide accessible names and suitable dialog content.
 */

import { attachDialogExtension } from "./internal/attach-dialog-extension.js";

attachDialogExtension(typeof globalThis !== "undefined" ? globalThis : window);
