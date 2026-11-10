/*! aellux.js | SPDX-License-Identifier: Apache-2.0 | See LICENSE for terms. */
import { createKeyboardAdapter } from "./internal/create-input-keyboard.js";
const api = (typeof globalThis !== "undefined" ? globalThis : window).aelluxJs;
api.registry.inputAdapters = api.registry.inputAdapters || {};
api.registry.inputAdapters.keyboard = ({ root, emit }) => createKeyboardAdapter(api, root, emit);
