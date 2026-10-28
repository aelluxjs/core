/*! aellux.js | SPDX-License-Identifier: Apache-2.0 | See LICENSE for terms. */

import { attachDialogExtension } from "./attach-dialog-extension.js";
import { installDialogPolyfill } from "./install-dialog-polyfill.js";
import css from "dialog-polyfill/dist/dialog-polyfill.css";

const root = typeof globalThis !== "undefined" ? globalThis : window;
attachDialogExtension(root, element => installDialogPolyfill(root, element, css));
